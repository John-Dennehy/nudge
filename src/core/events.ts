import { z } from 'zod'

/**
 * Everything that happens in Nudge is recorded as an event. The journal of events is the only
 * thing stored, and the current state is rebuilt from it (see journal.ts). That keeps sync
 * simple, lets the server check every change, and gives Quiet Progress a full history to count.
 */

const id = z.string().min(1).max(64)
const isoTime = z.iso.datetime({ offset: true })
const title = z.string().trim().min(1).max(200)
const minutes = z.number().int().min(1).max(600)

export const cardOptionSchema = z.object({
	id,
	label: title,
	minutes,
	/** step: do this as the next step. as-is: the goal is small enough already. finished: nothing left. */
	kind: z.enum(['step', 'as-is', 'finished']),
})

export const clarificationCardSchema = z.object({
	id,
	question: z.string().trim().min(1).max(200),
	options: z.array(cardOptionSchema).min(1).max(5),
})

/** A goal as it enters the journal, from a brain dump, a card answer or a reflection. */
export const newGoalSchema = z.object({
	id,
	title,
	minutes,
	dueAt: isoTime.nullable(),
	/** Present when the goal is too big or fuzzy to start, so it needs a question first. */
	card: clarificationCardSchema.nullable(),
})

export const reflectionSchema = z.object({
	outcome: z.enum(['succeeded', 'failed']),
	/** On failure: was it a reasonable goal? */
	reasonable: z.boolean().optional(),
	/** On failure: was I overwhelmed? */
	overwhelmed: z.boolean().optional(),
	/** On success: did it push me outside my comfort zone? */
	stretched: z.boolean().optional(),
	/** On success: how long it took compared with the guess. */
	took: z.enum(['less', 'about-right', 'more']).optional(),
	note: z.string().trim().max(1000).optional(),
})

const base = { id, at: isoTime }

export const eventSchema = z.discriminatedUnion('type', [
	z.object({
		...base,
		type: z.literal('dumped'),
		text: z.string().max(4000),
		goals: z.array(newGoalSchema).min(1).max(30),
	}),
	z.object({
		...base,
		type: z.literal('imported'),
		goals: z.array(newGoalSchema).min(1).max(200),
	}),
	z.object({
		...base,
		type: z.literal('clarified'),
		goalId: id,
		cardId: id,
		/** The chosen option, or a write-in when optionId is null. */
		optionId: id.nullable(),
		answer: title,
		/** The step this answer created, when it split the goal. */
		step: newGoalSchema.nullable(),
	}),
	z.object({ ...base, type: z.literal('asked'), goalId: id, card: clarificationCardSchema }),
	z.object({ ...base, type: z.literal('agreed'), goalId: id }),
	z.object({ ...base, type: z.literal('putBack'), goalId: id }),
	z.object({
		...base,
		type: z.literal('finished'),
		goalId: id,
		outcome: z.enum(['succeeded', 'failed']),
	}),
	z.object({
		...base,
		type: z.literal('reflected'),
		goalId: id,
		reflection: reflectionSchema,
		/** A fresh, better-sized try after a failure. */
		replacement: newGoalSchema.nullable(),
	}),
	z.object({ ...base, type: z.literal('removed'), goalId: id }),
])

export type NudgeEvent = z.infer<typeof eventSchema>
export type EventType = NudgeEvent['type']
export type NewGoal = z.infer<typeof newGoalSchema>
export type ClarificationCard = z.infer<typeof clarificationCardSchema>
export type CardOption = z.infer<typeof cardOptionSchema>
export type Reflection = z.infer<typeof reflectionSchema>
