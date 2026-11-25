import type { Goal, GoalSource, NewGoal, NudgeEvent, NudgeState, Smart } from './types'

export type ApplyResult = { ok: true; state: NudgeState } | { ok: false; reason: string }

export const emptyState = (): NudgeState => ({ goals: {}, order: [], agreedId: null })

/** A goal is ready to start once all five parts are in place. */
export function isComplete(smart: Smart): boolean {
	return (
		smart.specific !== null &&
		smart.measurable !== null &&
		smart.minutes !== null &&
		smart.relevant !== null &&
		smart.dueAt !== null
	)
}

function createGoal(goal: NewGoal, source: GoalSource, at: string, retryOf: string | null): Goal {
	return {
		id: goal.id,
		title: goal.title,
		status: isComplete(goal.smart) && !goal.card ? 'ready' : 'shaping',
		parentId: goal.parentId,
		smart: goal.smart,
		card: goal.card,
		source,
		createdAt: at,
		updatedAt: at,
		startedAt: null,
		finishedAt: null,
		auto: false,
		cause: null,
		timesPutBack: 0,
		stepsDone: [],
		retryOf,
		reflection: null,
	}
}

const fail = (reason: string): ApplyResult => ({ ok: false, reason })

/**
 * Applies one event to the state, or explains why it can't happen. Both the browser and the
 * server use this, so a change the server accepts is exactly a change this function accepts.
 * It never mutates the state passed in.
 */
export function apply(state: NudgeState, event: NudgeEvent): ApplyResult {
	const goals = { ...state.goals }
	const order = [...state.order]
	let agreedId = state.agreedId
	const update = (id: string, change: Partial<Goal>) => {
		const goal = goals[id]
		if (goal) goals[id] = { ...goal, ...change, updatedAt: event.at }
	}

	const addGoals = (incoming: NewGoal[], source: GoalSource, retryOf: string | null = null) => {
		for (const goal of incoming) {
			if (goals[goal.id]) return `A goal with id ${goal.id} already exists`
			if (goal.parentId && !goals[goal.parentId]) return `Unknown bigger goal ${goal.parentId}`
			if (!isComplete(goal.smart) && !goal.card)
				return `Goal ${goal.id} isn't ready and has no question`
			goals[goal.id] = createGoal(goal, source, event.at, retryOf)
			order.push(goal.id)
		}
		return null
	}

	switch (event.type) {
		case 'dumped':
		case 'imported': {
			const problem = addGoals(event.goals, event.type === 'dumped' ? 'dump' : 'import')
			if (problem) return fail(problem)
			break
		}

		case 'answered': {
			const goal = goals[event.goalId]
			if (!goal) return fail('Unknown goal')
			if (goal.card?.id !== event.cardId) return fail('That question has already been answered')
			const { effect } = event
			if (effect.kind === 'set') {
				const smart = { ...goal.smart, ...effect.patch }
				update(goal.id, { smart, card: null, status: isComplete(smart) ? 'ready' : 'shaping' })
			} else if (effect.kind === 'step') {
				if (effect.step.parentId !== goal.id) return fail('A step must belong to its goal')
				update(goal.id, { card: null, status: 'split' })
				const problem = addGoals([effect.step], 'step')
				if (problem) return fail(problem)
			} else {
				if (goal.status !== 'split') return fail('Only a bigger goal can be completed this way')
				update(goal.id, { card: null, status: 'succeeded', finishedAt: event.at })
			}
			break
		}

		case 'asked': {
			const goal = goals[event.goalId]
			if (!goal) return fail('Unknown goal')
			if (goal.status !== 'shaping' && goal.status !== 'split') return fail('Nothing to ask about')
			if (!event.card && goal.status === 'shaping')
				return fail('A goal being shaped needs a question')
			update(goal.id, { card: event.card })
			break
		}

		case 'agreed': {
			const goal = goals[event.goalId]
			if (!goal) return fail('Unknown goal')
			if (goal.status !== 'ready') return fail('Only a goal that is ready can be started')
			if (agreedId) update(agreedId, { status: 'ready' })
			update(goal.id, { status: 'agreed', startedAt: goal.startedAt ?? event.at })
			agreedId = goal.id
			break
		}

		case 'putBack': {
			const goal = goals[event.goalId]
			if (goal?.status !== 'agreed') return fail('That goal is not being worked on')
			update(goal.id, { status: 'ready', timesPutBack: goal.timesPutBack + 1 })
			agreedId = null
			break
		}

		case 'finished': {
			const goal = goals[event.goalId]
			if (!goal) return fail('Unknown goal')
			const open = goal.status === 'ready' || goal.status === 'agreed' || goal.status === 'shaping'
			if (!open) return fail('That goal is already finished')
			if (event.outcome === 'succeeded') {
				if (goal.status === 'shaping') return fail('A goal still being shaped cannot be done')
				if (event.auto || event.cause) return fail('Only a miss can be automatic')
			} else {
				const cause = goal.startedAt ? 'ran-out-of-time' : 'never-started'
				if (event.cause !== cause) return fail(`A miss here must be recorded as ${cause}`)
				if (event.auto) {
					const due = goal.smart.dueAt
					if (!due || Date.parse(event.at) < Date.parse(due)) {
						return fail('A goal only fails by itself once its due date has passed')
					}
				}
			}
			update(goal.id, {
				status: event.outcome,
				card: null,
				finishedAt: event.at,
				auto: event.auto,
				cause: event.cause,
			})
			if (agreedId === goal.id) agreedId = null
			const parent = goal.parentId ? goals[goal.parentId] : undefined
			if (parent && event.outcome === 'succeeded') {
				update(parent.id, { stepsDone: [...parent.stepsDone, goal.title] })
			}
			break
		}

		case 'reflected': {
			const goal = goals[event.goalId]
			if (!goal) return fail('Unknown goal')
			if (goal.status !== 'succeeded' && goal.status !== 'failed') {
				return fail('Only a finished goal can be reflected on')
			}
			update(goal.id, { reflection: event.reflection })
			if (event.retry) {
				if (goal.status !== 'failed') return fail('Only a miss gets a fresh try')
				if (event.retry.parentId !== goal.parentId)
					return fail('A fresh try stays in the same place')
				const problem = addGoals([event.retry], 'retry', goal.id)
				if (problem) return fail(problem)
			}
			break
		}

		case 'removed': {
			const goal = goals[event.goalId]
			if (!goal || goal.status === 'removed') return fail('Unknown goal')
			const removeTree = (id: string) => {
				update(id, { status: 'removed', card: null })
				if (agreedId === id) agreedId = null
				for (const child of Object.values(goals)) {
					if (child.parentId === id && child.status !== 'removed') removeTree(child.id)
				}
			}
			removeTree(goal.id)
			break
		}
	}

	return { ok: true, state: { goals, order, agreedId } }
}

/** Rebuilds the state from a journal. Throws on an event that doesn't fit, naming it. */
export function replay(events: readonly NudgeEvent[], from: NudgeState = emptyState()): NudgeState {
	let state = from
	for (const [index, event] of events.entries()) {
		const result = apply(state, event)
		if (!result.ok) throw new Error(`Event ${index} (${event.type}): ${result.reason}`)
		state = result.state
	}
	return state
}

/** Goals in arrival order, optionally filtered. */
export function listGoals(state: NudgeState, keep: (goal: Goal) => boolean = () => true): Goal[] {
	return state.order.flatMap((id) => {
		const goal = state.goals[id]
		return goal && keep(goal) ? [goal] : []
	})
}
