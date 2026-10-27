import type { Calibration } from './calibration'
import { type CardContext, makeStep, nextCard, nextStepCard, splitCard } from './cards'
import { endOfDay, findDue, parseMinutes } from './dates'
import { apply, isComplete, listGoals } from './journal'
import type { Goal, NewGoal, NudgeEvent, NudgeState, Reflection } from './types'
import type { Draft } from './untangle'

/**
 * Commands are what a person asks for ("I did it", "this one"). decide() turns a command into
 * the events that record it, working out everything that needs judgement (ids, follow-up
 * questions, write-in parsing) up front. The events then replay exactly, anywhere.
 */

export type Command =
	| { type: 'dump'; text: string; drafts: Draft[] }
	| { type: 'import'; drafts: Draft[] }
	| { type: 'answer'; goalId: string; optionId: string }
	| { type: 'writeIn'; goalId: string; text: string }
	| { type: 'agree'; goalId: string }
	| { type: 'putBack'; goalId: string }
	| { type: 'finish'; goalId: string; outcome: 'succeeded' | 'failed' }
	| { type: 'expire' }
	| { type: 'reflect'; goalId: string; reflection: Reflection; retry: boolean }
	| { type: 'remove'; goalId: string }

export interface DecideContext {
	now: Date
	newId: () => string
	calibration: Calibration
}

export type Decision = { ok: true; events: NudgeEvent[] } | { ok: false; message: string }

/** An event without its id and time, which decide() adds. */
type EventBody = NudgeEvent extends infer E
	? E extends NudgeEvent
		? Omit<E, 'id' | 'at'>
		: never
	: never

const no = (message: string): Decision => ({ ok: false, message })

/** Turns a draft from either engine into a goal, with its first question when it needs one. */
export function draftToGoal(draft: Draft, ctx: CardContext): NewGoal {
	const smart = {
		specific: draft.big ? null : draft.specific,
		measurable: draft.big ? null : draft.measurable,
		minutes: draft.minutes,
		relevant: draft.relevant,
		dueAt: draft.dueAt,
	}
	return {
		id: ctx.newId(),
		title: draft.title,
		parentId: null,
		smart,
		card: draft.big ? splitCard(draft.title, ctx) : nextCard(draft.title, smart, ctx),
	}
}

/** A smaller, kinder second try, sized by what the miss taught. */
export function retryFor(goal: Goal, reflection: Reflection, ctx: CardContext): NewGoal {
	const minutes = goal.smart.minutes ?? 15
	const shrink =
		goal.cause === 'never-started' || reflection.overwhelmed || reflection.reasonable === false
	const retryMinutes = shrink ? Math.max(2, Math.round(minutes / 2)) : minutes
	const title =
		goal.cause === 'never-started'
			? `Just start: ${lowerFirst(goal.smart.specific ?? goal.title)}`
			: goal.title
	const days = Math.max(1, (shrink ? 2 : 1) + ctx.calibration.dueShiftDays)
	return {
		id: ctx.newId(),
		title,
		parentId: goal.parentId,
		smart: {
			specific: goal.cause === 'never-started' ? title : (goal.smart.specific ?? goal.title),
			measurable:
				goal.cause === 'never-started'
					? "I've made a start"
					: (goal.smart.measurable ?? "It's done"),
			minutes: retryMinutes,
			relevant: goal.smart.relevant ?? 'Trying again',
			dueAt: endOfDay(ctx.now, days).toISOString(),
		},
		card: null,
	}
}

function lowerFirst(text: string): string {
	return text.charAt(0).toLowerCase() + text.slice(1)
}

/** The parent's next-step question, once a step finishes and nothing else of it is open. */
function followUpForParent(
	state: NudgeState,
	step: Goal,
	succeeded: boolean,
	ctx: DecideContext,
	at: string,
): NudgeEvent[] {
	if (!step.parentId) return []
	const parent = state.goals[step.parentId]
	if (parent?.status !== 'split') return []
	const stillOpen = listGoals(
		state,
		(g) =>
			g.parentId === parent.id &&
			g.id !== step.id &&
			['shaping', 'ready', 'agreed'].includes(g.status),
	)
	if (stillOpen.length) return []
	const stepsDone = succeeded ? [...parent.stepsDone, step.title] : parent.stepsDone
	return [
		{
			id: ctx.newId(),
			at,
			type: 'asked',
			goalId: parent.id,
			card: nextStepCard(parent.title, stepsDone, ctx),
		},
	]
}

/** Reads a write-in answer for the part a card is asking about. */
function readWriteIn(goal: Goal, text: string, ctx: DecideContext) {
	const about = goal.card?.about
	switch (about) {
		case 'split':
		case 'next':
			return { kind: 'step' as const, step: makeStep(goal, text, 10, ctx) }
		case 'minutes': {
			const minutes = parseMinutes(text)
			return minutes
				? { kind: 'set' as const, patch: { minutes } }
				: 'Try a number of minutes, like 10 or 45.'
		}
		case 'dueAt': {
			const due = findDue(text, ctx.now)
			return due
				? { kind: 'set' as const, patch: { dueAt: due.dueAt.toISOString() } }
				: "I didn't catch a day there. Try “tomorrow”, “Friday” or “next week”."
		}
		case 'specific':
		case 'measurable':
		case 'relevant':
			return { kind: 'set' as const, patch: { [about]: text } }
		default:
			return 'There is no question waiting for that goal.'
	}
}

export function decide(state: NudgeState, command: Command, ctx: DecideContext): Decision {
	const at = ctx.now.toISOString()
	const event = (body: EventBody): NudgeEvent => ({ id: ctx.newId(), at, ...body }) as NudgeEvent

	switch (command.type) {
		case 'dump':
		case 'import': {
			if (!command.drafts.length) return no('There was nothing to untangle there.')
			const goals = command.drafts.map((d) => draftToGoal(d, ctx))
			return {
				ok: true,
				events: [
					command.type === 'dump'
						? event({ type: 'dumped', text: command.text, goals })
						: event({ type: 'imported', goals }),
				],
			}
		}

		case 'answer':
		case 'writeIn': {
			const goal = state.goals[command.goalId]
			const card = goal?.card
			if (!goal || !card) return no('There is no question waiting for that goal.')

			let answer: string
			let effect: Extract<NudgeEvent, { type: 'answered' }>['effect']
			let optionId: string | null = null
			if (command.type === 'answer') {
				const chosen = card.options.find((o) => o.id === command.optionId)
				if (!chosen) return no('That option is no longer there.')
				answer = chosen.label
				optionId = chosen.id
				effect =
					chosen.effect.kind === 'step'
						? {
								kind: 'step',
								step: makeStep(goal, chosen.effect.title, chosen.effect.minutes, ctx),
							}
						: chosen.effect
			} else {
				answer = command.text.trim()
				if (!answer) return no('Write a few words first.')
				const read = readWriteIn(goal, answer, ctx)
				if (typeof read === 'string') return no(read)
				effect = read
			}

			const events: NudgeEvent[] = [
				event({ type: 'answered', goalId: goal.id, cardId: card.id, optionId, answer, effect }),
			]
			if (effect.kind === 'set') {
				const smart = { ...goal.smart, ...effect.patch }
				if (!isComplete(smart)) {
					events.push(
						event({ type: 'asked', goalId: goal.id, card: nextCard(goal.title, smart, ctx) }),
					)
				}
			}
			return check(state, events)
		}

		case 'agree':
			return check(state, [event({ type: 'agreed', goalId: command.goalId })])

		case 'putBack':
			return check(state, [event({ type: 'putBack', goalId: command.goalId })])

		case 'finish': {
			const goal = state.goals[command.goalId]
			if (!goal) return no('That goal is not there any more.')
			const cause =
				command.outcome === 'failed' ? (goal.startedAt ? 'ran-out-of-time' : 'never-started') : null
			const finished = event({
				type: 'finished',
				goalId: goal.id,
				outcome: command.outcome,
				auto: false,
				cause,
			})
			return check(state, [
				finished,
				...followUpForParent(state, goal, command.outcome === 'succeeded', ctx, at),
			])
		}

		case 'expire': {
			// Goals whose due date has passed fail by themselves: no one has to mark them.
			const events: NudgeEvent[] = []
			let current = state
			const overdue = listGoals(
				state,
				(g) =>
					['shaping', 'ready', 'agreed'].includes(g.status) &&
					g.smart.dueAt !== null &&
					Date.parse(g.smart.dueAt) <= ctx.now.getTime(),
			)
			for (const goal of overdue) {
				const fresh = current.goals[goal.id]
				if (!fresh || !['shaping', 'ready', 'agreed'].includes(fresh.status)) continue
				const batch = [
					event({
						type: 'finished',
						goalId: goal.id,
						outcome: 'failed',
						auto: true,
						cause: fresh.startedAt ? 'ran-out-of-time' : 'never-started',
					}),
					...followUpForParent(current, fresh, false, ctx, at),
				]
				const result = check(current, batch)
				if (!result.ok) continue
				for (const e of result.events) {
					const applied = apply(current, e)
					if (applied.ok) current = applied.state
				}
				events.push(...result.events)
			}
			return { ok: true, events }
		}

		case 'reflect': {
			const goal = state.goals[command.goalId]
			if (!goal) return no('That goal is not there any more.')
			const retry =
				command.retry && goal.status === 'failed' ? retryFor(goal, command.reflection, ctx) : null
			return check(state, [
				event({ type: 'reflected', goalId: goal.id, reflection: command.reflection, retry }),
			])
		}

		case 'remove':
			return check(state, [event({ type: 'removed', goalId: command.goalId })])
	}
}

/** Makes sure the events would be accepted, so the UI never records something the server refuses. */
function check(state: NudgeState, events: NudgeEvent[]): Decision {
	let current = state
	for (const e of events) {
		const result = apply(current, e)
		if (!result.ok) return no(result.reason)
		current = result.state
	}
	return { ok: true, events }
}
