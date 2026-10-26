import { createServerFn } from '@tanstack/react-start'
import { deleteCookie, getCookie, setCookie } from '@tanstack/react-start/server'
import { z } from 'zod'
import { eventSchema } from '@/core/events'
import { acceptBatch, MAX_BATCH } from './accept'
import { makePairCode, normalisePairCode } from './pairCode'
import { getStore } from './store'
import { aiEnabled, suggestWithAi } from './untangleAi'

/**
 * Server functions. Each browser gets a private, anonymous space, named by a random id in an
 * http-only cookie. There are no accounts: a short pairing code links another device.
 */

const COOKIE = 'nudge_space'
const ID_PATTERN = /^[0-9a-f-]{36}$/
const PAIR_MINUTES = 15

function cookieOptions() {
	return {
		httpOnly: true,
		sameSite: 'lax' as const,
		secure: process.env.NODE_ENV === 'production',
		path: '/',
		maxAge: 400 * 24 * 60 * 60,
	}
}

/** The current space, created on first visit. */
async function currentSpace(): Promise<string> {
	const store = getStore()
	const existing = getCookie(COOKIE)
	if (existing && ID_PATTERN.test(existing) && (await store.ownerExists(existing))) {
		setCookie(COOKIE, existing, cookieOptions())
		return existing
	}
	const id = crypto.randomUUID()
	await store.createOwner(id)
	setCookie(COOKIE, id, cookieOptions())
	return id
}

export const loadJournal = createServerFn({ method: 'GET' })
	.validator(z.object({ afterSeq: z.number().int().min(0) }).optional())
	.handler(async ({ data }) => {
		const space = await currentSpace()
		const { events, seq } = await getStore().load(space, data?.afterSeq ?? 0)
		return { events, seq, ai: aiEnabled() }
	})

export const appendEvents = createServerFn({ method: 'POST' })
	.validator(
		z.object({
			afterSeq: z.number().int().min(0),
			events: z.array(eventSchema).min(1).max(MAX_BATCH),
		}),
	)
	.handler(async ({ data }) => {
		const space = await currentSpace()
		const store = getStore()
		const { events: existing, seq } = await store.load(space)
		if (seq !== data.afterSeq) {
			return { ok: false as const, conflict: true as const, seq }
		}
		const verdict = acceptBatch(existing, data.events, new Date())
		if (!verdict.ok) return { ok: false as const, conflict: false as const, reason: verdict.reason }
		const result = await store.append(space, data.afterSeq, data.events)
		if (!result.ok) return { ok: false as const, conflict: true as const, seq }
		return { ok: true as const, seq: result.seq }
	})

export const createPairCode = createServerFn({ method: 'POST' }).handler(async () => {
	const space = await currentSpace()
	const code = makePairCode()
	const expiresAt = new Date(Date.now() + PAIR_MINUTES * 60 * 1000)
	await getStore().savePairCode(code, space, expiresAt)
	return { code, expiresAt: expiresAt.toISOString() }
})

export const joinWithCode = createServerFn({ method: 'POST' })
	.validator(z.object({ code: z.string().min(3).max(60) }))
	.handler(async ({ data }) => {
		const owner = await getStore().redeemPairCode(normalisePairCode(data.code), new Date())
		if (!owner) return { ok: false as const }
		setCookie(COOKIE, owner, cookieOptions())
		return { ok: true as const }
	})

export const deleteEverything = createServerFn({ method: 'POST' }).handler(async () => {
	const existing = getCookie(COOKIE)
	if (existing && ID_PATTERN.test(existing)) await getStore().deleteOwner(existing)
	deleteCookie(COOKIE, { path: '/' })
	return { ok: true as const }
})

export const suggestGoals = createServerFn({ method: 'POST' })
	.validator(z.object({ text: z.string().trim().min(1).max(4000) }))
	.handler(async ({ data }) => ({ suggestions: await suggestWithAi(data.text) }))
