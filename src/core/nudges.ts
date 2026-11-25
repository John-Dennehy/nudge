import type { Calibration } from './calibration'
import { describeDue } from './dates'
import { listGoals } from './journal'
import type { Energy, Goal, NudgeState } from './types'

/**
 * Adaptive Nudges: a few options to choose the next thing from, never a ranked backlog. Which
 * kinds appear depends on energy right now and on what Nudge has learned. Every nudge says
 * why it's there, in plain words.
 */

export type NudgeKind = 'soon' | 'quick' | 'weight' | 'bigger'

export interface Nudge {
	goalId: string
	kind: NudgeKind
	label: string
	reason: string
}

const DAY = 24 * 60 * 60 * 1000

const LABELS: Record<NudgeKind, string> = {
	soon: 'Due soon',
	quick: 'Quick win',
	weight: 'Lift a weight',
	bigger: 'Moves something bigger',
}

/** Which kinds to offer, in order, for each energy level. */
const BY_ENERGY: Record<Energy, NudgeKind[]> = {
	low: ['quick', 'soon'],
	okay: ['soon', 'quick', 'bigger', 'weight'],
	good: ['soon', 'weight', 'bigger', 'quick'],
}

const MAX_NUDGES: Record<Energy, number> = { low: 2, okay: 3, good: 4 }

/** How heavy something has become: put back, already missed once, or just been around a while. */
function weight(goal: Goal, now: Date): number {
	const ageDays = (now.getTime() - Date.parse(goal.createdAt)) / DAY
	return goal.timesPutBack * 2 + (goal.retryOf ? 2 : 0) + Math.min(ageDays, 7) / 2
}

export function curateNudges(
	state: NudgeState,
	energy: Energy,
	calibration: Calibration,
	now: Date,
): Nudge[] {
	const ready = listGoals(state, (g) => g.status === 'ready')
	if (!ready.length) return []

	const startingIsHard = (calibration.neverStartedShare ?? 0) >= 0.5 && calibration.results >= 5
	const order =
		startingIsHard && energy !== 'good'
			? ['quick' as const, ...BY_ENERGY[energy].filter((k) => k !== 'quick')]
			: BY_ENERGY[energy]
	const minutes = (g: Goal) => g.smart.minutes ?? 15
	const picked = new Set<string>()
	const nudges: Nudge[] = []

	const pick = (kind: NudgeKind, goal: Goal | undefined, reason: (g: Goal) => string) => {
		if (!goal || picked.has(goal.id)) return
		picked.add(goal.id)
		nudges.push({ goalId: goal.id, kind, label: LABELS[kind], reason: reason(goal) })
	}
	const available = () => ready.filter((g) => !picked.has(g.id))

	for (const kind of order) {
		if (nudges.length >= MAX_NUDGES[energy]) break
		const pool = available()
		switch (kind) {
			case 'soon': {
				const soon = pool
					.filter((g) => g.smart.dueAt && Date.parse(g.smart.dueAt) - now.getTime() <= 2 * DAY)
					.sort((a, b) => Date.parse(a.smart.dueAt ?? '') - Date.parse(b.smart.dueAt ?? ''))[0]
				pick(
					kind,
					soon,
					(g) => `Due ${describeDue(g.smart.dueAt ?? now, now)}, so worth doing before it slips.`,
				)
				break
			}
			case 'quick': {
				const limit = energy === 'low' ? 10 : 15
				const quick = pool
					.filter((g) => minutes(g) <= limit)
					.sort((a, b) => minutes(a) - minutes(b))[0]
				pick(kind, quick, () =>
					startingIsHard
						? 'Starting is the hard part, so start small.'
						: 'A small win gets things moving.',
				)
				break
			}
			case 'weight': {
				const heavy = pool
					.filter((g) => weight(g, now) >= 2)
					.sort((a, b) => weight(b, now) - weight(a, now))[0]
				pick(kind, heavy, (g) =>
					g.retryOf
						? 'A second go at something that ran out of time. You know more about it now.'
						: g.timesPutBack > 0
							? `Put back ${g.timesPutBack === 1 ? 'once' : `${g.timesPutBack} times`}. Clearing it will lighten the load.`
							: 'This has been around for a while. Clearing it will lighten the load.',
				)
				break
			}
			case 'bigger': {
				const step = pool.filter((g) => g.parentId).sort((a, b) => minutes(a) - minutes(b))[0]
				const parent = step?.parentId ? state.goals[step.parentId] : undefined
				pick(kind, step, () => `A step towards “${parent?.title ?? 'a bigger goal'}”.`)
				break
			}
		}
	}

	// Never leave someone with nothing: fall back to the smallest ready thing.
	if (!nudges.length) {
		pick(
			'quick',
			[...ready].sort((a, b) => minutes(a) - minutes(b))[0],
			() => 'The smallest thing that’s ready.',
		)
	}
	return nudges
}
