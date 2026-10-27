import type { ClarificationCard, Reflection, Smart } from './events'

export type {
	CardOption,
	ClarificationCard,
	Criterion,
	NewGoal,
	NudgeEvent,
	OptionEffect,
	Reflection,
	Smart,
	SmartPatch,
} from './events'

/**
 * Where a goal is in its life. These names are internal: the app describes them in plain words.
 *
 * shaping   → still missing one of its five parts, so Nudge has a question for it
 * split     → a bigger goal, waiting quietly behind its current step
 * ready     → all five parts in place, can be picked
 * agreed    → the one Agreed Task being worked on now
 * succeeded → done
 * failed    → the due date passed first, or the person said it didn't happen. A lesson, not a verdict.
 * removed   → taken off the list
 */
export type GoalStatus =
	| 'shaping'
	| 'split'
	| 'ready'
	| 'agreed'
	| 'succeeded'
	| 'failed'
	| 'removed'

export type GoalSource = 'dump' | 'import' | 'step' | 'retry'

export interface Goal {
	id: string
	title: string
	status: GoalStatus
	/** The bigger goal this is a step of. */
	parentId: string | null
	smart: Smart
	/** The question Nudge is waiting on, if any. */
	card: ClarificationCard | null
	source: GoalSource
	createdAt: string
	updatedAt: string
	/** First time it was agreed, so a miss can tell "never started" from "ran out of time". */
	startedAt: string | null
	finishedAt: string | null
	/** How it finished, for misses: closed by the due date, and whether it was ever started. */
	auto: boolean
	cause: 'never-started' | 'ran-out-of-time' | null
	/** How often it was agreed and then put back unfinished. */
	timesPutBack: number
	/** Titles of finished steps, for bigger goals. */
	stepsDone: string[]
	/** The goal this one is a fresh try of. */
	retryOf: string | null
	reflection: Reflection | null
}

export interface NudgeState {
	goals: Record<string, Goal>
	/** Goal ids in the order they arrived. */
	order: string[]
	agreedId: string | null
}

export type Energy = 'low' | 'okay' | 'good'
