import type { ClarificationCard, Reflection } from './events'

export type { CardOption, ClarificationCard, NewGoal, NudgeEvent, Reflection } from './events'

/**
 * Where a goal is in its life. Internal names only: the UI never shows these words.
 *
 * unclear   → needs a Clarification Card answered before it can start
 * split     → a bigger goal that Nudge tracks quietly behind its current step
 * ready     → small and clear, can be picked
 * agreed    → the one Agreed Task being worked on now
 * succeeded → done, waiting for a reflection
 * failed    → didn't happen as planned, waiting for a reflection
 * reviewed  → reflected on, finished with
 * removed   → taken off the list
 */
export type GoalStatus =
	| 'unclear'
	| 'split'
	| 'ready'
	| 'agreed'
	| 'succeeded'
	| 'failed'
	| 'reviewed'
	| 'removed'

export type GoalSource = 'dump' | 'import' | 'step' | 'replacement'

export interface Goal {
	id: string
	title: string
	status: GoalStatus
	/** The bigger goal this is a step of. */
	parentId: string | null
	/** Rough size, in minutes. */
	minutes: number
	dueAt: string | null
	card: ClarificationCard | null
	source: GoalSource
	createdAt: string
	updatedAt: string
	/** How often it was agreed and then put back without finishing. */
	timesPutBack: number
	/** Titles of finished steps, for bigger goals. */
	stepsDone: string[]
	/** The goal this one is a fresh try of. */
	replaces: string | null
	reflection: Reflection | null
}

export interface NudgeState {
	goals: Record<string, Goal>
	/** Goal ids in the order they arrived. */
	order: string[]
	agreedId: string | null
	/** Seconds-precision time of the last event, for deterministic decisions. */
	lastAt: string | null
}

export type Energy = 'low' | 'okay' | 'good'
