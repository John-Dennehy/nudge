import { describe, expect, it } from 'vitest'
import { apply, replay } from '../journal'
import type { NudgeEvent } from '../types'
import { NOW, session } from './helpers'

const at = (days: number, hours = 0) =>
	new Date(NOW.getTime() + days * 86_400_000 + hours * 3_600_000)

describe('a small goal', () => {
	it('asks only for the missing parts, one at a time', () => {
		const s = session()
		s.dump('call the dentist by Friday')
		const goal = s.goal('Call the dentist')
		expect(goal.status).toBe('shaping')
		// Specific, measurable, size and date were guessed, so only "why" is left.
		expect(goal.card?.about).toBe('relevant')
		s.choose('Call the dentist', 'My health matters')
		const ready = s.goal('Call the dentist')
		expect(ready.status).toBe('ready')
		expect(ready.card).toBeNull()
		expect(ready.smart.relevant).toBe('My health matters')
	})

	it('reads write-ins for the part being asked about', () => {
		const s = session()
		s.dump('call the dentist')
		expect(s.goal('Call the dentist').card?.about).toBe('dueAt')
		expect(() =>
			s.run({ type: 'writeIn', goalId: s.goal('Call the dentist').id, text: 'whenever' }),
		).toThrow(/didn't catch a day/)
		s.run({ type: 'writeIn', goalId: s.goal('Call the dentist').id, text: 'tomorrow' })
		expect(new Date(s.goal('Call the dentist').smart.dueAt ?? '').getDate()).toBe(6)
	})
})

describe('a bigger goal', () => {
	it('splits into steps, asks for the next one, and finishes when there is nothing left', () => {
		const s = session()
		s.dump('sort out my taxes')
		expect(s.goal('Sort out my taxes').card?.about).toBe('split')

		s.choose('Sort out my taxes', /^Find where the paperwork/)
		expect(s.goal('Sort out my taxes').status).toBe('split')
		const step = s.goal('Find where the paperwork for my taxes is')
		expect(step).toMatchObject({ status: 'ready', parentId: s.goal('Sort out my taxes').id })
		expect(step.smart.relevant).toBe('Part of “Sort out my taxes”')

		s.run({ type: 'agree', goalId: step.id })
		s.run({ type: 'finish', goalId: step.id, outcome: 'succeeded' })
		const parent = s.goal('Sort out my taxes')
		expect(parent.stepsDone).toEqual(['Find where the paperwork for my taxes is'])
		expect(parent.card?.about).toBe('next')
		// The finished step isn't offered again.
		expect(parent.card?.options.map((o) => o.label)).not.toContain(
			'Find where the paperwork for my taxes is',
		)

		s.choose('Sort out my taxes', "That's all of it")
		expect(s.goal('Sort out my taxes').status).toBe('succeeded')
	})

	it('can be treated as small after all', () => {
		const s = session()
		s.dump('organise my desk drawer')
		s.choose('Organise my desk drawer', "It's small enough already")
		expect(s.goal('Organise my desk drawer').card?.about).toBe('specific')
		expect(s.shape('Organise my desk drawer').status).toBe('ready')
	})
})

describe('one agreed task', () => {
	it('moves the previous one back when another is picked', () => {
		const s = session()
		s.dump('call mum today\ntext Jo today')
		s.shape('Call mum')
		s.shape('Text Jo')
		s.run({ type: 'agree', goalId: s.goal('Call mum').id })
		s.run({ type: 'agree', goalId: s.goal('Text Jo').id })
		expect(s.goal('Call mum').status).toBe('ready')
		expect(s.state().agreedId).toBe(s.goal('Text Jo').id)
	})
})

describe('deadlines', () => {
	it('fail goals by themselves once the due date passes, recording whether they were started', () => {
		const s = session()
		s.dump('call mum today\ntext Jo today\nwrite the report next week')
		s.shape('Call mum')
		s.shape('Text Jo')
		s.run({ type: 'agree', goalId: s.goal('Text Jo').id })

		s.setNow(at(0, 6))
		expect(s.run({ type: 'expire' })).toEqual([])

		s.setNow(at(1))
		const events = s.run({ type: 'expire' })
		expect(events.map((e) => e.type)).toEqual(['finished', 'finished'])
		expect(s.goal('Call mum')).toMatchObject({
			status: 'failed',
			auto: true,
			cause: 'never-started',
		})
		expect(s.goal('Text Jo')).toMatchObject({
			status: 'failed',
			auto: true,
			cause: 'ran-out-of-time',
		})
		expect(s.state().agreedId).toBeNull()
		expect(s.goal('Write the report').status).not.toBe('failed')
	})

	it('give a failed step’s bigger goal its next question', () => {
		const s = session()
		s.dump('sort out my taxes')
		s.choose('Sort out my taxes', /^Find where/)
		s.setNow(at(3))
		s.run({ type: 'expire' })
		expect(s.goal('Sort out my taxes').card?.about).toBe('next')
	})
})

describe('reflection and fresh tries', () => {
	it('offers a smaller first step after something was never started', () => {
		const s = session()
		s.dump('tidy the desk today')
		s.shape('Tidy the desk')
		s.setNow(at(1))
		s.run({ type: 'expire' })
		s.run({
			type: 'reflect',
			goalId: s.goal('Tidy the desk').id,
			reflection: { reasonable: true, overwhelmed: false },
			retry: true,
		})
		const retry = Object.values(s.state().goals).find((g) => g.source === 'retry')
		expect(retry).toMatchObject({ status: 'ready', retryOf: s.goal('Tidy the desk').id })
		expect(retry?.title).toMatch(/^Just start: /)
		expect(retry?.smart.minutes).toBeLessThan(s.goal('Tidy the desk').smart.minutes ?? 0)
	})

	it('records a reflection on a win without a fresh try', () => {
		const s = session()
		s.dump('call mum today')
		s.shape('Call mum')
		s.run({ type: 'agree', goalId: s.goal('Call mum').id })
		s.run({ type: 'finish', goalId: s.goal('Call mum').id, outcome: 'succeeded' })
		s.run({
			type: 'reflect',
			goalId: s.goal('Call mum').id,
			reflection: { stretched: true, took: 'more' },
			retry: true,
		})
		expect(s.goal('Call mum').reflection).toEqual({ stretched: true, took: 'more' })
		expect(Object.values(s.state().goals).some((g) => g.source === 'retry')).toBe(false)
	})
})

describe('the journal refuses changes that could not happen', () => {
	const s = session()
	s.dump('call mum today')
	const goal = s.goal('Call mum')
	const base = s.state()
	const event = (body: Partial<NudgeEvent>) =>
		({ id: 'x', at: NOW.toISOString(), ...body }) as NudgeEvent

	it('a goal failing by itself before its due date', () => {
		const result = apply(
			base,
			event({
				type: 'finished',
				goalId: goal.id,
				outcome: 'failed',
				auto: true,
				cause: 'never-started',
			}),
		)
		expect(result).toMatchObject({ ok: false, reason: /due date has passed/ })
	})

	it('finishing a goal that is still being shaped', () => {
		const result = apply(
			base,
			event({ type: 'finished', goalId: goal.id, outcome: 'succeeded', auto: false, cause: null }),
		)
		expect(result.ok).toBe(false)
	})

	it('a miss recorded with the wrong cause', () => {
		const result = apply(
			base,
			event({
				type: 'finished',
				goalId: goal.id,
				outcome: 'failed',
				auto: false,
				cause: 'ran-out-of-time',
			}),
		)
		expect(result.ok).toBe(false)
	})

	it('answering a question twice', () => {
		const card = goal.card
		const answer = event({
			type: 'answered',
			goalId: goal.id,
			cardId: card?.id ?? '',
			optionId: null,
			answer: 'Because',
			effect: { kind: 'set', patch: { relevant: 'Because' } },
		})
		const once = apply(base, answer)
		expect(once.ok).toBe(true)
		if (once.ok) expect(apply(once.state, answer).ok).toBe(false)
	})

	it('and replay names the event that broke', () => {
		expect(() => replay([...s.events, event({ type: 'agreed', goalId: 'nope' })])).toThrow(
			/Event 1 \(agreed\)/,
		)
	})
})
