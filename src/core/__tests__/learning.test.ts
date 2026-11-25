import { describe, expect, it } from 'vitest'
import { calibrate } from '../calibration'
import { CARD_QUESTIONS } from '../cards'
import { curateNudges } from '../nudges'
import { isPlainEnglish } from '../plainEnglish'
import { quietProgress } from '../progress'
import { allTemplateText } from '../templates'
import { NOW, session } from './helpers'

const at = (days: number) => new Date(NOW.getTime() + days * 86_400_000)

/** n quick goals, each agreed and then either done or left to run out of time. */
function history(outcomes: ('done' | 'missed' | 'never')[]) {
	const s = session()
	outcomes.forEach((outcome, i) => {
		s.setNow(at(i * 2))
		s.dump(`call person${i} today`)
		const title = `Call person${i}`
		s.shape(title)
		if (outcome !== 'never') s.run({ type: 'agree', goalId: s.goal(title).id })
		if (outcome === 'done')
			s.run({ type: 'finish', goalId: s.goal(title).id, outcome: 'succeeded' })
		s.setNow(at(i * 2 + 1))
		s.run({ type: 'expire' })
	})
	return s
}

describe('learning from patterns', () => {
	it('waits for enough results before adjusting anything', () => {
		expect(calibrate(history(['done', 'done', 'done']).state())).toMatchObject({
			pitch: 'steady',
			notes: [],
		})
	})

	it('stretches when nearly everything gets done', () => {
		const c = calibrate(history(Array(6).fill('done')).state())
		expect(c).toMatchObject({
			pitch: 'bigger',
			comfortMinutes: 30,
			dueShiftDays: -1,
			successRate: 1,
		})
		expect(c.notes[0]).toMatch(/slightly bigger/)
	})

	it('eases off when a lot runs out of time, and notices when starting is the hard part', () => {
		const c = calibrate(history(['never', 'never', 'missed', 'never', 'done', 'never']).state())
		expect(c.pitch).toBe('smaller')
		expect(c.neverStartedShare).toBeCloseTo(0.8)
		expect(c.notes.join(' ')).toMatch(/Starting seems to be the hard part/)
	})

	it('stays steady inside the stretch band', () => {
		expect(
			calibrate(history(['done', 'done', 'missed', 'done', 'done', 'missed', 'done']).state())
				.pitch,
		).toBe('steady')
	})
})

describe('nudges', () => {
	function readyList() {
		const s = session()
		s.dump('call mum today\nwrite the report next week\ntidy the desk by Friday\nsort out my taxes')
		for (const t of ['Call mum', 'Write the report', 'Tidy the desk']) s.shape(t)
		s.choose('Sort out my taxes', /^Find where/)
		return s
	}

	it('keeps it to quick wins and anything due soon on low energy', () => {
		const s = readyList()
		const nudges = curateNudges(s.state(), 'low', calibrate(s.state()), NOW)
		expect(nudges.length).toBeLessThanOrEqual(2)
		expect(nudges.map((n) => n.kind)).toEqual(['quick', 'soon'])
	})

	it('offers more variety with more energy, each with a reason', () => {
		const s = readyList()
		const nudges = curateNudges(s.state(), 'good', calibrate(s.state()), NOW)
		expect(new Set(nudges.map((n) => n.goalId)).size).toBe(nudges.length)
		expect(nudges.map((n) => n.kind)).toContain('bigger')
		for (const n of nudges) expect(isPlainEnglish(`${n.label} ${n.reason}`)).toBe(true)
	})

	it('surfaces something that keeps getting put back', () => {
		const s = readyList()
		const desk = s.goal('Tidy the desk')
		s.run({ type: 'agree', goalId: desk.id })
		s.run({ type: 'putBack', goalId: desk.id })
		const nudges = curateNudges(s.state(), 'good', calibrate(s.state()), NOW)
		expect(nudges.find((n) => n.kind === 'weight')).toMatchObject({
			goalId: desk.id,
			reason: /Put back once/,
		})
	})
})

describe('quiet progress', () => {
	it('counts wins and lessons, today and all time', () => {
		const s = history(['done', 'missed', 'done'])
		const { today, allTime } = quietProgress(
			s.events,
			s.state(),
			new Date(at(4).setHours(0, 0, 0, 0)),
		)
		expect(allTime).toMatchObject({ done: 2, lessons: 1 })
		expect(allTime.untangled).toBeGreaterThanOrEqual(3)
		expect(today).toMatchObject({ done: 1, lessons: 0 })
	})
})

describe('plain English', () => {
	it('holds for every suggestion and question Nudge can show', () => {
		const text = [...allTemplateText(), ...CARD_QUESTIONS]
		expect(text.filter((t) => !isPlainEnglish(t))).toEqual([])
	})

	it('holds for every learning note', () => {
		const notes = [
			calibrate(history(Array(6).fill('done')).state()).notes,
			calibrate(history(['never', 'never', 'missed', 'never', 'done', 'never']).state()).notes,
		].flat()
		expect(notes.length).toBeGreaterThan(0)
		expect(notes.filter((t) => !isPlainEnglish(t))).toEqual([])
	})
})
