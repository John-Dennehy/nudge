import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { calibrate } from '@/core/calibration'
import { type Command, type Decision, decide } from '@/core/decide'
import { apply, emptyState, replay } from '@/core/journal'
import type { NudgeEvent, NudgeState } from '@/core/types'
import { appendEvents, loadJournal } from '@/server/journal'
import { legacyDrafts } from './legacy'

/**
 * Keeps the journal in sync. Changes apply instantly in the browser, are cached locally so the
 * app opens straight away, and are sent to the server in order. If another device saved
 * first, this catches up and replays its own unsaved changes on top, dropping any that no
 * longer make sense.
 */

const CACHE_KEY = 'nudge_journal_v2'
const EXPIRE_EVERY_MS = 60_000

export type SyncStatus = 'loading' | 'saved' | 'saving' | 'offline' | 'problem'

interface Cache {
	seq: number
	confirmed: NudgeEvent[]
	pending: NudgeEvent[]
}

function readCache(): Cache | null {
	try {
		const raw = localStorage.getItem(CACHE_KEY)
		return raw ? (JSON.parse(raw) as Cache) : null
	} catch {
		return null
	}
}

function writeCache(cache: Cache) {
	try {
		localStorage.setItem(CACHE_KEY, JSON.stringify(cache))
	} catch {
		// Storage can be full or blocked. The server copy still works.
	}
}

export function clearLocalCopy() {
	try {
		localStorage.removeItem(CACHE_KEY)
	} catch {}
}

/** Re-applies unsaved changes on top of newer saved ones, keeping only those that still fit. */
function rebase(base: NudgeState, pending: NudgeEvent[]): NudgeEvent[] {
	const kept: NudgeEvent[] = []
	let state = base
	for (const event of pending) {
		const result = apply(state, event)
		if (result.ok) {
			state = result.state
			kept.push(event)
		}
	}
	return kept
}

function safeReplay(events: NudgeEvent[]): NudgeState {
	try {
		return replay(events)
	} catch {
		return emptyState()
	}
}

export function useJournal() {
	const [cache, setCache] = useState<Cache>({ seq: 0, confirmed: [], pending: [] })
	const [status, setStatus] = useState<SyncStatus>('loading')
	const [ai, setAi] = useState(false)
	const ref = useRef(cache)
	const flushing = useRef(false)
	const retryTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

	const commit = useCallback((next: Cache) => {
		ref.current = next
		setCache(next)
		writeCache(next)
	}, [])

	const flush = useCallback(async () => {
		if (flushing.current) return
		flushing.current = true
		try {
			while (ref.current.pending.length) {
				setStatus('saving')
				const { seq, confirmed, pending } = ref.current
				const batch = pending.slice(0, 50)
				const result = await appendEvents({ data: { afterSeq: seq, events: batch } })
				if (result.ok) {
					const now = ref.current
					commit({
						seq: result.seq,
						confirmed: [...now.confirmed, ...batch],
						pending: now.pending.slice(batch.length),
					})
				} else if (result.conflict) {
					// Another device saved first: catch up, then replay what's left on top.
					const fresh = await loadJournal({ data: { afterSeq: seq } })
					const merged = [...confirmed, ...fresh.events]
					commit({
						seq: fresh.seq,
						confirmed: merged,
						pending: rebase(safeReplay(merged), ref.current.pending),
					})
				} else {
					// The server refused it. Drop that batch rather than retrying forever.
					console.warn('Nudge could not save a change:', result.reason)
					commit({ ...ref.current, pending: ref.current.pending.slice(batch.length) })
					setStatus('problem')
					return
				}
			}
			setStatus('saved')
		} catch {
			setStatus('offline')
			clearTimeout(retryTimer.current)
			retryTimer.current = setTimeout(() => void flush(), 10_000)
		} finally {
			flushing.current = false
		}
	}, [commit])

	const state = useMemo(() => safeReplay([...cache.confirmed, ...cache.pending]), [cache])
	const events = useMemo(() => [...cache.confirmed, ...cache.pending], [cache])
	const calibration = useMemo(() => calibrate(state), [state])

	const dispatch = useCallback(
		(command: Command): Decision => {
			const current = safeReplay([...ref.current.confirmed, ...ref.current.pending])
			const decision = decide(current, command, {
				now: new Date(),
				newId: () => crypto.randomUUID(),
				calibration: calibrate(current),
			})
			if (decision.ok && decision.events.length) {
				commit({ ...ref.current, pending: [...ref.current.pending, ...decision.events] })
				void flush()
			}
			return decision
		},
		[commit, flush],
	)

	// Load: show the local copy at once, then catch up with the server.
	useEffect(() => {
		const local = readCache()
		if (local) commit(local)
		let cancelled = false
		;(async () => {
			try {
				const server = await loadJournal({ data: { afterSeq: 0 } })
				if (cancelled) return
				setAi(server.ai)
				const before = ref.current
				// A fresh server space but a local copy: put the local copy back (say, after clearing cookies).
				const pending =
					server.seq === 0 && before.confirmed.length
						? [...before.confirmed, ...before.pending]
						: before.pending
				commit({
					seq: server.seq,
					confirmed: server.events,
					pending: rebase(safeReplay(server.events), pending),
				})
				if (!server.events.length && !pending.length) {
					const drafts = legacyDrafts(new Date())
					if (drafts?.length) dispatch({ type: 'import', drafts })
				}
				setStatus('saved')
				void flush()
			} catch {
				if (!cancelled) setStatus('offline')
			}
		})()
		return () => {
			cancelled = true
		}
	}, [commit, dispatch, flush])

	// Deadlines: goals fail by themselves once their date passes.
	useEffect(() => {
		if (status === 'loading') return
		const expire = () => dispatch({ type: 'expire' })
		expire()
		const timer = setInterval(expire, EXPIRE_EVERY_MS)
		const onVisible = () => document.visibilityState === 'visible' && expire()
		document.addEventListener('visibilitychange', onVisible)
		return () => {
			clearInterval(timer)
			document.removeEventListener('visibilitychange', onVisible)
		}
	}, [status, dispatch])

	return { state, events, calibration, dispatch, status, ai }
}
