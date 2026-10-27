import { calibrate } from '../calibration'
import { type Command, type DecideContext, decide } from '../decide'
import { emptyState, replay } from '../journal'
import type { NudgeEvent, NudgeState } from '../types'
import { untangle } from '../untangle'

/** Wednesday 5 November 2025, 10am local time. */
export const NOW = new Date(2025, 10, 5, 10, 0, 0)

export function context(now = NOW, state: NudgeState = emptyState()): DecideContext {
	let n = 0
	return { now, newId: () => `id${++n}`, calibration: calibrate(state) }
}

/** A tiny journal driver for tests: run commands, keep the events, read the state. */
export function session(start = NOW) {
	const events: NudgeEvent[] = []
	let now = start
	let n = 0
	const state = () => replay(events)
	return {
		events,
		state,
		setNow(next: Date) {
			now = next
		},
		run(command: Command) {
			const s = state()
			const result = decide(s, command, { now, newId: () => `e${++n}`, calibration: calibrate(s) })
			if (!result.ok) throw new Error(result.message)
			events.push(...result.events)
			return result.events
		},
		dump(text: string) {
			return this.run({ type: 'dump', text, drafts: untangle(text, { now }) })
		},
		goal(title: string) {
			const goal = Object.values(state().goals).find((g) => g.title === title)
			if (!goal) throw new Error(`No goal called ${title}`)
			return goal
		},
		/** Answers the goal's current card with the option whose label matches. */
		choose(title: string, label: string | RegExp) {
			const goal = this.goal(title)
			const option = goal.card?.options.find((o) =>
				typeof label === 'string' ? o.label === label : label.test(o.label),
			)
			if (!option) throw new Error(`No option ${label} on ${goal.card?.question}`)
			return this.run({ type: 'answer', goalId: goal.id, optionId: option.id })
		},
		/** Answers cards with the first option until the goal is ready. */
		shape(title: string) {
			for (let i = 0; i < 6 && this.goal(title).card; i++) {
				const goal = this.goal(title)
				const first = goal.card?.options[0]
				if (!first) break
				this.run({ type: 'answer', goalId: goal.id, optionId: first.id })
			}
			return this.goal(title)
		},
	}
}
