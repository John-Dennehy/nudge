import { z } from 'zod'

/**
 * Everything that happens in Nudge is recorded as an event. The journal of events is the only
 * thing stored, and the current state is rebuilt from it (see journal.ts). That keeps sync
 * simple, lets the server check every change, and gives Nudge a full history to learn from.
 */

const id = z.string().min(1).max(64)
const isoTime = z.iso.datetime({ offset: true })
const text = z.string().trim().min(1).max(200)
const minutes = z.number().int().min(1).max(600)

/**
 * The five parts that make a goal ready to start. Each is filled in by answering a card (or
 * guessed from the brain dump). Internal only: the app never says "SMART".
 */
export const smartSchema = z.object({
	/** Specific: the first physical action. */
	specific: text.nullable(),
	/** Measurable: what done looks like. */
	measurable: text.nullable(),
	/** Achievable: the expected size, in minutes. */
	minutes: minutes.nullable(),
	/** Relevant: why it matters, or the bigger goal it serves. */
	relevant: text.nullable(),
	/** Time-bound: when it's due. Passing this without finishing fails the goal automatically. */
	dueAt: isoTime.nullable(),
})

export const smartPatchSchema = smartSchema.partial()

export const criterionSchema = z.enum(['specific', 'measurable', 'minutes', 'relevant', 'dueAt'])

/** What choosing a card option does. */
export const optionEffectSchema = z.discriminatedUnion('kind', [
	/** Fill in one or more parts of the goal. */
	z.object({ kind: z.literal('set'), patch: smartPatchSchema }),
	/** Start the goal with a smaller step, tracked under it. */
	z.object({ kind: z.literal('step'), title: text, minutes }),
	/** A bigger goal has nothing left to do. */
	z.object({ kind: z.literal('complete') }),
])

export const cardOptionSchema = z.object({
	id,
	label: text,
	hint: z.string().max(120).optional(),
	effect: optionEffectSchema,
})

export const clarificationCardSchema = z.object({
	id,
	/** What the card is for: one missing part, splitting a big goal, or the next step of one. */
	about: z.enum(['split', 'next', ...criterionSchema.options]),
	question: z.string().trim().min(1).max(200),
	options: z.array(cardOptionSchema).min(1).max(5),
})

/** A goal as it enters the journal, from a brain dump, a card answer or a fresh try. */
export const newGoalSchema = z.object({
	id,
	title: text,
	parentId: id.nullable(),
	smart: smartSchema,
	/** The question to ask next, when the goal isn't ready yet. */
	card: clarificationCardSchema.nullable(),
})

export const reflectionSchema = z.object({
	/** After a miss: was it a reasonable goal? */
	reasonable: z.boolean().optional(),
	/** After a miss: was I overwhelmed? */
	overwhelmed: z.boolean().optional(),
	/** After a win: did it push me outside my comfort zone? */
	stretched: z.boolean().optional(),
	/** How long it took compared with the guess. */
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
		type: z.literal('answered'),
		goalId: id,
		cardId: id,
		/** The chosen option, or null for a write-in. */
		optionId: id.nullable(),
		answer: text,
		/** What the answer did, already worked out (write-ins included), so replay is exact. */
		effect: z.discriminatedUnion('kind', [
			z.object({ kind: z.literal('set'), patch: smartPatchSchema }),
			z.object({ kind: z.literal('step'), step: newGoalSchema }),
			z.object({ kind: z.literal('complete') }),
		]),
	}),
	/** Nudge's next question for a goal (or null when it has nothing left to ask). */
	z.object({
		...base,
		type: z.literal('asked'),
		goalId: id,
		card: clarificationCardSchema.nullable(),
	}),
	z.object({ ...base, type: z.literal('agreed'), goalId: id }),
	z.object({ ...base, type: z.literal('putBack'), goalId: id }),
	z.object({
		...base,
		type: z.literal('finished'),
		goalId: id,
		outcome: z.enum(['succeeded', 'failed']),
		/** True when the due date passed and Nudge closed it, rather than the person. */
		auto: z.boolean(),
		/** For a miss: had it been started at all? Each teaches something different. */
		cause: z.enum(['never-started', 'ran-out-of-time']).nullable(),
	}),
	z.object({
		...base,
		type: z.literal('reflected'),
		goalId: id,
		reflection: reflectionSchema,
		/** A fresh, better-sized try after a miss. */
		retry: newGoalSchema.nullable(),
	}),
	z.object({ ...base, type: z.literal('removed'), goalId: id }),
])

export type NudgeEvent = z.infer<typeof eventSchema>
export type EventType = NudgeEvent['type']
export type Smart = z.infer<typeof smartSchema>
export type SmartPatch = z.infer<typeof smartPatchSchema>
export type Criterion = z.infer<typeof criterionSchema>
export type NewGoal = z.infer<typeof newGoalSchema>
export type ClarificationCard = z.infer<typeof clarificationCardSchema>
export type CardOption = z.infer<typeof cardOptionSchema>
export type OptionEffect = z.infer<typeof optionEffectSchema>
export type Reflection = z.infer<typeof reflectionSchema>
