import type { Calibration } from './calibration'
import { describeMinutes, endOfDay } from './dates'
import { kindOf, templateFor } from './templates'
import type {
	CardOption,
	ClarificationCard,
	Criterion,
	NewGoal,
	OptionEffect,
	Smart,
} from './types'

/**
 * Clarification Cards: one small question at a time, each filling in one missing part of a
 * goal. The order goes from what makes it startable to why it matters.
 */

export interface CardContext {
	now: Date
	newId: () => string
	calibration: Calibration
}

/** The order Nudge asks in. */
export const ASK_ORDER: Criterion[] = ['specific', 'measurable', 'minutes', 'dueAt', 'relevant']

export function missingParts(smart: Smart): Criterion[] {
	return ASK_ORDER.filter((part) => smart[part] === null)
}

const option = (
	ctx: CardContext,
	label: string,
	effect: OptionEffect,
	hint?: string,
): CardOption => ({
	id: ctx.newId(),
	label,
	effect,
	...(hint ? { hint } : {}),
})

const card = (
	ctx: CardContext,
	about: ClarificationCard['about'],
	question: string,
	options: CardOption[],
): ClarificationCard => ({ id: ctx.newId(), about, question, options })

const scaled = (minutes: number, ctx: CardContext) =>
	Math.max(2, Math.round(minutes * ctx.calibration.minutesFactor))

/** For a goal too big to start: offer small first steps. */
export function splitCard(title: string, ctx: CardContext): ClarificationCard {
	const starters = templateFor(kindOf(title)).starters(title)
	return card(ctx, 'split', "This sounds like a big one. What's a small first step?", [
		...starters.map((s) =>
			option(
				ctx,
				s.title,
				{ kind: 'step', title: s.title, minutes: scaled(s.minutes, ctx) },
				`About ${describeMinutes(scaled(s.minutes, ctx))}`,
			),
		),
		option(
			ctx,
			"It's small enough already",
			{ kind: 'set', patch: {} },
			"I'll ask a couple of quick questions instead",
		),
	])
}

/** After a step of a bigger goal finishes: what's next, or is it done? */
export function nextStepCard(
	title: string,
	stepsDone: string[],
	ctx: CardContext,
): ClarificationCard {
	const starters = templateFor(kindOf(title))
		.starters(title)
		.filter((s) => !stepsDone.includes(s.title))
		.slice(0, 3)
	return card(ctx, 'next', `What's the next small step for “${title}”?`, [
		...starters.map((s) =>
			option(
				ctx,
				s.title,
				{ kind: 'step', title: s.title, minutes: scaled(s.minutes, ctx) },
				`About ${describeMinutes(scaled(s.minutes, ctx))}`,
			),
		),
		option(ctx, "That's all of it", { kind: 'complete' }, 'Mark the whole thing as done'),
	])
}

function dueOptions(ctx: CardContext): CardOption[] {
	const shift = ctx.calibration.dueShiftDays
	const choices = [
		{ label: 'Today', days: 0 },
		{ label: 'Tomorrow', days: 1 },
		{ label: 'In a few days', days: 3 },
		{ label: 'Within a week', days: 7 },
	]
	return choices.map((c) => {
		const days = Math.max(0, c.days + (c.days === 0 ? 0 : shift))
		return option(ctx, c.label, {
			kind: 'set',
			patch: { dueAt: endOfDay(ctx.now, days).toISOString() },
		})
	})
}

/** The question for one missing part. */
export function partCard(
	part: Criterion,
	title: string,
	smart: Smart,
	ctx: CardContext,
): ClarificationCard {
	const template = templateFor(kindOf(title))
	switch (part) {
		case 'specific':
			return card(
				ctx,
				part,
				"What's the very first thing you'd physically do?",
				template.starters(title).map((s) =>
					option(ctx, s.title, {
						kind: 'set',
						patch: {
							specific: s.title,
							...(smart.minutes === null ? { minutes: scaled(s.minutes, ctx) } : {}),
						},
					}),
				),
			)
		case 'measurable':
			return card(
				ctx,
				part,
				'How will you know it’s done?',
				template
					.doneOptions(title)
					.map((text) => option(ctx, text, { kind: 'set', patch: { measurable: text } })),
			)
		case 'minutes': {
			const sizes = [5, 15, 30, 60].map((m) => scaled(m, ctx))
			return card(
				ctx,
				part,
				'Roughly how long will it take?',
				sizes.map((m) =>
					option(ctx, `About ${describeMinutes(m)}`, { kind: 'set', patch: { minutes: m } }),
				),
			)
		}
		case 'dueAt':
			return card(ctx, part, 'When should this be done by?', dueOptions(ctx))
		case 'relevant':
			return card(
				ctx,
				part,
				'Why does this matter to you?',
				template.whyOptions
					.slice(0, 4)
					.map((why) => option(ctx, why, { kind: 'set', patch: { relevant: why } })),
			)
	}
}

/** The next question for a goal, or null when all five parts are in place. */
export function nextCard(title: string, smart: Smart, ctx: CardContext): ClarificationCard | null {
	const [part] = missingParts(smart)
	return part ? partCard(part, title, smart, ctx) : null
}

/** A step under a bigger goal. Steps are small by design, so all five parts are filled in. */
export function makeStep(
	parent: { id: string; title: string; smart: Smart },
	title: string,
	minutes: number,
	ctx: CardContext,
): NewGoal {
	const tomorrow = endOfDay(ctx.now, 1)
	const parentDue = parent.smart.dueAt ? new Date(parent.smart.dueAt) : null
	const due = parentDue && parentDue < tomorrow && parentDue > ctx.now ? parentDue : tomorrow
	return {
		id: ctx.newId(),
		title,
		parentId: parent.id,
		smart: {
			specific: title,
			measurable: templateFor(kindOf(title)).doneWhen(title) ?? 'That one step is done',
			minutes,
			relevant: `Part of “${parent.title}”`,
			dueAt: due.toISOString(),
		},
		card: null,
	}
}

/** Every fixed question, for the plain-English check. */
export const CARD_QUESTIONS = [
	"This sounds like a big one. What's a small first step?",
	"It's small enough already",
	"I'll ask a couple of quick questions instead",
	"That's all of it",
	'Mark the whole thing as done',
	"What's the very first thing you'd physically do?",
	'How will you know it’s done?',
	'Roughly how long will it take?',
	'When should this be done by?',
	'Why does this matter to you?',
	'That one step is done',
]
