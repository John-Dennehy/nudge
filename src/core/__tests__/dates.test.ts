import { describe, expect, it } from 'vitest'
import { describeDue, describeMinutes, findDue, parseMinutes } from '../dates'
import { NOW } from './helpers'

const day = (d: Date) => [d.getDate(), d.getHours(), d.getMinutes()]

describe('findDue', () => {
	it('reads today, tomorrow and weekdays as the end of that day', () => {
		expect(day(findDue('pay it today', NOW)?.dueAt as Date)).toEqual([5, 23, 59])
		expect(day(findDue('call mum tomorrow', NOW)?.dueAt as Date)).toEqual([6, 23, 59])
		expect(day(findDue('send it by Friday', NOW)?.dueAt as Date)).toEqual([7, 23, 59])
		// Today is Wednesday, so "Wednesday" means next week's.
		expect(day(findDue('on wednesday', NOW)?.dueAt as Date)).toEqual([12, 23, 59])
	})

	it('reads relative spans', () => {
		expect(day(findDue('in 3 days', NOW)?.dueAt as Date)).toEqual([8, 23, 59])
		expect(day(findDue('this week', NOW)?.dueAt as Date)).toEqual([9, 23, 59])
		expect(day(findDue('next week', NOW)?.dueAt as Date)).toEqual([16, 23, 59])
		expect(day(findDue('by the end of the month', NOW)?.dueAt as Date)).toEqual([30, 23, 59])
	})

	it('returns the phrase so it can be taken out of the title', () => {
		expect(findDue('Send the invoice by Friday', NOW)?.phrase).toBe('by Friday')
		expect(findDue('Make a cup of tea', NOW)).toBeNull()
	})
})

describe('minutes', () => {
	it('reads write-ins', () => {
		expect(parseMinutes('20')).toBe(20)
		expect(parseMinutes('about 45 mins')).toBe(45)
		expect(parseMinutes('half an hour')).toBe(30)
		expect(parseMinutes('2 hours')).toBe(120)
		expect(parseMinutes('soon')).toBeNull()
	})

	it('describes sizes and dates in plain words', () => {
		expect(describeMinutes(5)).toBe('5 minutes')
		expect(describeMinutes(60)).toBe('an hour')
		expect(describeMinutes(90)).toBe('1.5 hours')
		expect(describeDue(new Date(2025, 10, 5, 23, 59), NOW)).toBe('today')
		expect(describeDue(new Date(2025, 10, 6, 23, 59), NOW)).toBe('tomorrow')
		expect(describeDue(new Date(2025, 10, 7, 23, 59), NOW)).toBe('Friday')
	})
})
