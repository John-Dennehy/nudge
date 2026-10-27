import { describe, expect, it } from 'vitest'
import { cleanIdea, sizeUp, splitIdeas, untangle } from '../untangle'
import { NOW } from './helpers'

describe('splitIdeas', () => {
	it('splits lines, bullets, sentences and joined actions', () => {
		expect(
			splitIdeas('- call mum and book the dentist\n* I need to sort out my taxes. Also email Sam'),
		).toEqual(['Call mum', 'Book the dentist', 'Sort out my taxes', 'Email Sam'])
	})

	it('keeps "and" inside a single thing', () => {
		expect(splitIdeas('buy salt and pepper')).toEqual(['Buy salt and pepper'])
	})

	it('drops filler words', () => {
		expect(cleanIdea('ugh I really need to text Jo!!')).toBe('Text Jo')
		expect(cleanIdea("don't forget to water the plants")).toBe('Water the plants')
	})
})

describe('sizeUp', () => {
	it('spots big goals and quick actions', () => {
		expect(sizeUp('Sort out my taxes').big).toBe(true)
		expect(sizeUp('Call the dentist')).toEqual({ minutes: 5, big: false })
		expect(sizeUp('Tidy the desk').big).toBe(false)
	})
})

describe('untangle', () => {
	it('guesses what it can and leaves the rest for questions', () => {
		const [call, taxes] = untangle('call the dentist by Friday\nsort out my taxes', { now: NOW })
		expect(call).toMatchObject({
			title: 'Call the dentist',
			big: false,
			specific: 'Call the dentist',
			measurable: 'The call is made',
			minutes: 5,
			relevant: null,
		})
		expect(new Date(call?.dueAt ?? '').getDate()).toBe(7)
		expect(taxes).toMatchObject({ title: 'Sort out my taxes', big: true, kind: 'money' })
		expect(taxes?.starters).toHaveLength(3)
	})

	it('takes the whole date phrase out of the title', () => {
		const [taxes, weekend] = untangle(
			'sort out my taxes by the end of the month\ntidy up by the weekend',
			{ now: NOW },
		)
		expect(taxes?.title).toBe('Sort out my taxes')
		expect(new Date(taxes?.dueAt ?? '').getDate()).toBe(30)
		expect(weekend?.title).toBe('Tidy up')
	})

	it('scales guesses by what has been learned', () => {
		const [draft] = untangle('call the bank', { now: NOW, minutesFactor: 2 })
		expect(draft?.minutes).toBe(10)
	})
})
