import type { NudgeEvent, NudgeState } from './types'

/**
 * Quiet Progress: gentle counts of the work that doesn't show up as ticked boxes. Worked out
 * from the journal, so they're always right. Misses count too: each one is a lesson.
 */

export interface ProgressCounts {
	/** Ideas pulled out of brain dumps, plus questions answered. */
	untangled: number
	/** Goals and steps done. */
	done: number
	/** Misses, each one feedback for next time. */
	lessons: number
	reflections: number
	/** Wins that pushed past the comfort zone. */
	stretches: number
}

export interface Progress {
	today: ProgressCounts
	allTime: ProgressCounts
}

const zero = (): ProgressCounts => ({
	untangled: 0,
	done: 0,
	lessons: 0,
	reflections: 0,
	stretches: 0,
})

export function quietProgress(
	events: readonly NudgeEvent[],
	state: NudgeState,
	startOfToday: Date,
): Progress {
	const today = zero()
	const allTime = zero()
	const since = startOfToday.getTime()

	for (const event of events) {
		const counts = Date.parse(event.at) >= since ? [today, allTime] : [allTime]
		const add = (key: keyof ProgressCounts, amount = 1) => {
			for (const c of counts) c[key] += amount
		}
		switch (event.type) {
			case 'dumped':
				add('untangled', event.goals.length)
				break
			case 'answered':
				add('untangled')
				if (event.effect.kind === 'complete') add('done')
				break
			case 'finished':
				add(event.outcome === 'succeeded' ? 'done' : 'lessons')
				break
			case 'reflected':
				add('reflections')
				if (event.reflection.stretched && state.goals[event.goalId]?.status === 'succeeded')
					add('stretches')
				break
		}
	}
	return { today, allTime }
}
