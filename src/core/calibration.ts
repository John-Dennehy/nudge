import { listGoals } from './journal'
import type { Goal, NudgeState } from './types'

/**
 * Learning from patterns. Every goal that succeeds or fails is feedback about how big and how
 * soon to pitch the next one. The aim is goals you usually manage, but not always: if nearly
 * everything gets done, Nudge stretches a little; if a lot runs out of time, it eases off.
 *
 * Each adjustment comes with a plain sentence saying what changed and why, so it never feels
 * like the app is quietly moving the goalposts.
 */

/** Usually manage, but not always. */
export const STRETCH_BAND = { low: 0.6, high: 0.85 } as const
/** How many recent results to learn from, and how many before learning anything. */
const WINDOW = 20
const MIN_RESULTS = 5

export type Pitch = 'smaller' | 'steady' | 'bigger'

export interface Calibration {
	/** Finished goals considered (steps and single goals, not bigger goals). */
	results: number
	successRate: number | null
	pitch: Pitch
	/** Share of misses that were never started. High means starting is the hard part. */
	neverStartedShare: number | null
	/** Multiply size guesses by this, from "took less/more" reflections. */
	minutesFactor: number
	/** Anything bigger than this gets split into smaller steps first. */
	comfortMinutes: number
	/** Extra days to add to suggested due dates (negative means sooner). */
	dueShiftDays: number
	/** Success rate by size, for the progress page. */
	bySize: { label: string; done: number; total: number }[]
	/** Plain-English explanations of each adjustment. */
	notes: string[]
}

const SIZES = [
	{ label: 'Under 10 minutes', max: 10 },
	{ label: '10 to 30 minutes', max: 30 },
	{ label: 'Over 30 minutes', max: Number.POSITIVE_INFINITY },
]

function isResult(goal: Goal): boolean {
	return (goal.status === 'succeeded' || goal.status === 'failed') && goal.smart.minutes !== null
}

export function calibrate(state: NudgeState): Calibration {
	const results = listGoals(state, isResult)
		.sort((a, b) => Date.parse(b.finishedAt ?? '') - Date.parse(a.finishedAt ?? ''))
		.slice(0, WINDOW)

	const done = results.filter((g) => g.status === 'succeeded')
	const misses = results.filter((g) => g.status === 'failed')
	const successRate = results.length ? done.length / results.length : null
	const neverStartedShare = misses.length
		? misses.filter((g) => g.cause === 'never-started').length / misses.length
		: null

	const notes: string[] = []
	let pitch: Pitch = 'steady'
	if (results.length >= MIN_RESULTS && successRate !== null) {
		if (successRate > STRETCH_BAND.high) {
			pitch = 'bigger'
			notes.push(
				'Nearly everything has been getting done, so I suggest slightly bigger steps and sooner dates.',
			)
		} else if (successRate < STRETCH_BAND.low) {
			pitch = 'smaller'
			notes.push(
				'Quite a few things have run out of time, so I suggest smaller steps and more time.',
			)
		}
	}

	const took = results.flatMap((g) => (g.reflection?.took ? [g.reflection.took] : []))
	const longer = took.filter((t) => t === 'more').length
	const shorter = took.filter((t) => t === 'less').length
	let minutesFactor = 1
	if (took.length >= 3 && longer > shorter * 2) {
		minutesFactor = 1.5
		notes.push('Things often take longer than guessed, so I add a bit of time to my guesses.')
	} else if (took.length >= 3 && shorter > longer * 2) {
		minutesFactor = 0.75
		notes.push('Things often take less time than guessed, so my guesses are a little shorter.')
	}

	if (misses.length >= 3 && neverStartedShare !== null && neverStartedShare >= 0.5) {
		notes.push('Starting seems to be the hard part, so quick first steps come first.')
	}

	const overwhelmed = results.filter((g) => g.reflection?.overwhelmed).length
	if (overwhelmed >= 2 && pitch !== 'smaller') {
		pitch = 'smaller'
		notes.push('A few things felt overwhelming, so I break bigger things down sooner.')
	}

	const bySize = SIZES.map((size, i) => {
		const min = i === 0 ? 0 : (SIZES[i - 1]?.max ?? 0)
		const inSize = results.filter((g) => {
			const m = g.smart.minutes ?? 0
			return m > min && m <= size.max
		})
		return {
			label: size.label,
			done: inSize.filter((g) => g.status === 'succeeded').length,
			total: inSize.length,
		}
	})

	return {
		results: results.length,
		successRate,
		pitch,
		neverStartedShare,
		minutesFactor,
		comfortMinutes: pitch === 'smaller' ? 10 : pitch === 'bigger' ? 30 : 20,
		dueShiftDays: pitch === 'smaller' ? 1 : pitch === 'bigger' ? -1 : 0,
		bySize,
		notes,
	}
}
