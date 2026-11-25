import { neon } from '@neondatabase/serverless'
import { and, asc, eq, gt, lt } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/neon-http'
import type { NudgeEvent } from '@/core/types'
import { events, owners, pairCodes } from './schema'

export type AppendResult = { ok: true; seq: number } | { ok: false; conflict: true }

export interface JournalStore {
	createOwner(id: string): Promise<void>
	ownerExists(id: string): Promise<boolean>
	/** All events after a position, in order, with the latest position. */
	load(ownerId: string, afterSeq?: number): Promise<{ events: NudgeEvent[]; seq: number }>
	/** Appends at exactly afterSeq, or reports a conflict if someone else got there first. */
	append(ownerId: string, afterSeq: number, batch: NudgeEvent[]): Promise<AppendResult>
	savePairCode(code: string, ownerId: string, expiresAt: Date): Promise<void>
	/** Uses up a pairing code, returning its owner if it was valid. */
	redeemPairCode(code: string, now: Date): Promise<string | null>
	deleteOwner(ownerId: string): Promise<void>
}

function isUniqueViolation(error: unknown): boolean {
	const text = String((error as { cause?: unknown })?.cause ?? error)
	return /duplicate key|unique constraint|23505/i.test(text)
}

function neonStore(url: string): JournalStore {
	const db = drizzle(neon(url))
	return {
		async createOwner(id) {
			await db.insert(owners).values({ id }).onConflictDoNothing()
		},
		async ownerExists(id) {
			const rows = await db.select({ id: owners.id }).from(owners).where(eq(owners.id, id)).limit(1)
			return rows.length > 0
		},
		async load(ownerId, afterSeq = 0) {
			const rows = await db
				.select({ seq: events.seq, event: events.event })
				.from(events)
				.where(and(eq(events.ownerId, ownerId), gt(events.seq, afterSeq)))
				.orderBy(asc(events.seq))
			return { events: rows.map((r) => r.event), seq: rows.at(-1)?.seq ?? afterSeq }
		},
		async append(ownerId, afterSeq, batch) {
			if (!batch.length) return { ok: true, seq: afterSeq }
			try {
				// One statement, so the whole batch lands or none of it does.
				await db
					.insert(events)
					.values(batch.map((event, i) => ({ ownerId, seq: afterSeq + i + 1, event })))
			} catch (error) {
				if (isUniqueViolation(error)) return { ok: false, conflict: true }
				throw error
			}
			return { ok: true, seq: afterSeq + batch.length }
		},
		async savePairCode(code, ownerId, expiresAt) {
			await db.delete(pairCodes).where(eq(pairCodes.ownerId, ownerId))
			await db.insert(pairCodes).values({ code, ownerId, expiresAt })
		},
		async redeemPairCode(code, now) {
			await db.delete(pairCodes).where(lt(pairCodes.expiresAt, now))
			const [row] = await db.delete(pairCodes).where(eq(pairCodes.code, code)).returning()
			return row ? row.ownerId : null
		},
		async deleteOwner(ownerId) {
			await db.delete(owners).where(eq(owners.id, ownerId))
		},
	}
}

/** Keeps everything in memory, so Nudge runs locally without a database. */
export function memoryStore(): JournalStore {
	const journals = new Map<string, NudgeEvent[]>()
	const codes = new Map<string, { ownerId: string; expiresAt: Date }>()
	return {
		async createOwner(id) {
			if (!journals.has(id)) journals.set(id, [])
		},
		async ownerExists(id) {
			return journals.has(id)
		},
		async load(ownerId, afterSeq = 0) {
			const all = journals.get(ownerId) ?? []
			return { events: all.slice(afterSeq), seq: Math.max(afterSeq, all.length) }
		},
		async append(ownerId, afterSeq, batch) {
			const all = journals.get(ownerId)
			if (!all || all.length !== afterSeq) return { ok: false, conflict: true }
			all.push(...structuredClone(batch))
			return { ok: true, seq: all.length }
		},
		async savePairCode(code, ownerId, expiresAt) {
			for (const [c, v] of codes) if (v.ownerId === ownerId) codes.delete(c)
			codes.set(code, { ownerId, expiresAt })
		},
		async redeemPairCode(code, now) {
			const entry = codes.get(code)
			codes.delete(code)
			return entry && entry.expiresAt > now ? entry.ownerId : null
		},
		async deleteOwner(ownerId) {
			journals.delete(ownerId)
			for (const [c, v] of codes) if (v.ownerId === ownerId) codes.delete(c)
		},
	}
}

let store: JournalStore | undefined

export function getStore(): JournalStore {
	store ??= process.env.DATABASE_URL ? neonStore(process.env.DATABASE_URL) : memoryStore()
	return store
}
