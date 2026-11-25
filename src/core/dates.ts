/**
 * Plain-language dates. Everything works in the person's local time: "by Friday" means the end
 * of their Friday.
 */

const WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
const DAY = 24 * 60 * 60 * 1000

export function endOfDay(date: Date, plusDays = 0): Date {
	const end = new Date(date)
	end.setDate(end.getDate() + plusDays)
	end.setHours(23, 59, 0, 0)
	return end
}

/** The phrases parseDue understands, longest first so "next week" wins over "week". */
const DUE_PATTERN =
	/\b(?:(?:by|before|on|for|due|until)\s+(?:the\s+)?)?(?:(today|tonight|tomorrow|this weekend|the weekend|this week|next week|end of (?:the )?week|end of (?:the )?month|next month)|in (\d{1,2}|a|one|two|three) (days?|weeks?)|((?:this |next )?(?:sun|mon|tues?|wed(?:nes)?|thur?s?|fri|sat(?:ur)?)(?:day)?))\b/i

const NUMBER_WORDS: Record<string, number> = { a: 1, one: 1, two: 2, three: 3 }

function weekdayIndex(word: string): number {
	const w = word.toLowerCase().slice(0, 3)
	return WEEKDAYS.findIndex((day) => day.startsWith(w))
}

/** Finds a due date in text like "pay the bill by Friday". Returns the date and the matched words. */
export function findDue(text: string, now: Date): { dueAt: Date; phrase: string } | null {
	const match = DUE_PATTERN.exec(text)
	if (!match) return null
	const [phrase, named, count, unit, weekday] = match
	let dueAt: Date | null = null

	if (named) {
		const n = named.toLowerCase()
		const day = now.getDay()
		const toSunday = (7 - day) % 7
		if (n === 'today' || n === 'tonight') dueAt = endOfDay(now)
		else if (n === 'tomorrow') dueAt = endOfDay(now, 1)
		else if (n === 'this weekend' || n === 'the weekend') dueAt = endOfDay(now, toSunday)
		else if (n === 'this week' || (n.startsWith('end of') && n.endsWith('week')))
			dueAt = endOfDay(now, toSunday)
		else if (n === 'next week') dueAt = endOfDay(now, toSunday + 7)
		else if (n.endsWith('month')) {
			const end = new Date(now.getFullYear(), now.getMonth() + (n === 'next month' ? 2 : 1), 0)
			dueAt = endOfDay(end)
		}
	} else if (count && unit) {
		const amount = NUMBER_WORDS[count.toLowerCase()] ?? Number(count)
		dueAt = endOfDay(now, unit.toLowerCase().startsWith('week') ? amount * 7 : amount)
	} else if (weekday) {
		const target = weekdayIndex(weekday.replace(/^(this|next)\s+/i, ''))
		if (target >= 0) {
			let ahead = (target - now.getDay() + 7) % 7
			if (ahead === 0) ahead = 7
			if (/^next\s/i.test(weekday) && ahead < 7) ahead += 7
			dueAt = endOfDay(now, ahead)
		}
	}

	return dueAt ? { dueAt, phrase } : null
}

/** "today", "tomorrow", "Friday", "Friday 14 November". */
export function describeDue(dueAt: string | Date, now: Date): string {
	const due = new Date(dueAt)
	const days = Math.round((endOfDay(due).getTime() - endOfDay(now).getTime()) / DAY)
	if (days < 0) return days === -1 ? 'yesterday' : `${-days} days ago`
	if (days === 0) return 'today'
	if (days === 1) return 'tomorrow'
	const weekday = due.toLocaleDateString('en-GB', { weekday: 'long' })
	if (days < 7) return weekday
	return due.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
}

/** Reads a write-in like "20", "20 mins", "half an hour" or "2 hours" as minutes. */
export function parseMinutes(text: string): number | null {
	const t = text.trim().toLowerCase()
	if (/half an? hour/.test(t)) return 30
	if (/^an? hour/.test(t)) return 60
	if (/quarter of an hour/.test(t)) return 15
	const match = /(\d+(?:\.\d+)?)\s*(h|hr|hrs|hour|hours|m|min|mins|minute|minutes)?\b/.exec(t)
	if (!match) return null
	const value = Number(match[1])
	const minutes = match[2]?.startsWith('h') ? value * 60 : value
	return minutes >= 1 && minutes <= 600 ? Math.round(minutes) : null
}

/** "5 minutes", "about an hour", "2 hours". */
export function describeMinutes(minutes: number): string {
	if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'}`
	if (minutes === 60) return 'an hour'
	const hours = Math.round((minutes / 60) * 2) / 2
	return `${hours} hours`
}
