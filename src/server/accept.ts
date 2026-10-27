import { replay } from '@/core/journal'
import type { NudgeEvent } from '@/core/types'

/** The longest a journal can grow, and the most events in one save. */
export const MAX_EVENTS = 20_000
export const MAX_BATCH = 50
/** How far ahead of the server's clock a device's clock may run. */
const CLOCK_SLACK_MS = 5 * 60 * 1000

/**
 * Checks a batch against the journal it would join. The same rules the browser follows
 * (core/journal.ts) decide, plus a check on timestamps so a goal can't be failed early by a
 * device with its clock set ahead.
 */
export function acceptBatch(
	existing: readonly NudgeEvent[],
	batch: readonly NudgeEvent[],
	now: Date,
): { ok: true } | { ok: false; reason: string } {
	if (batch.length > MAX_BATCH) return { ok: false, reason: 'Too many changes at once' }
	if (existing.length + batch.length > MAX_EVENTS)
		return { ok: false, reason: 'This space is full' }
	const ids = new Set(existing.map((e) => e.id))
	for (const event of batch) {
		if (Date.parse(event.at) > now.getTime() + CLOCK_SLACK_MS) {
			return { ok: false, reason: 'A change is dated in the future' }
		}
		if (ids.has(event.id)) return { ok: false, reason: 'A change was sent twice' }
		ids.add(event.id)
	}
	try {
		replay(batch, replay(existing))
	} catch (error) {
		return { ok: false, reason: (error as Error).message }
	}
	return { ok: true }
}
