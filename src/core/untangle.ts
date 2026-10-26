import { findDue } from './dates'
import { type Kind, kindOf, templateFor } from './templates'

/**
 * Turns a raw brain dump into drafts: one per idea, each with Nudge's best guesses at its five
 * parts. This is the offline engine. The AI engine (server/untangleAi.ts) produces the same
 * Draft shape, so everything after this point is shared.
 */

export interface Draft {
	title: string
	kind: Kind
	/** Too big or vague to start as it is, so Nudge will offer smaller first steps. */
	big: boolean
	minutes: number
	specific: string | null
	measurable: string | null
	relevant: string | null
	dueAt: string | null
	/** Smaller first steps to offer when the draft is big. */
	starters: { title: string; minutes: number }[]
}

/** Verbs that usually start an action. Used to split "call mum and book the dentist". */
const VERBS = [
	'apply',
	'ask',
	'back up',
	'book',
	'buy',
	'call',
	'cancel',
	'change',
	'check',
	'clean',
	'clear',
	'cook',
	'declutter',
	'do',
	'draft',
	'email',
	'empty',
	'file',
	'find',
	'finish',
	'fix',
	'get',
	'go',
	'hoover',
	'learn',
	'look',
	'make',
	'message',
	'move',
	'order',
	'organise',
	'organize',
	'pack',
	'pay',
	'phone',
	'pick up',
	'plan',
	'post',
	'practice',
	'practise',
	'prep',
	'prepare',
	'print',
	'put',
	'read',
	'renew',
	'reply',
	'research',
	'return',
	'review',
	'ring',
	'schedule',
	'send',
	'sign',
	'sort',
	'start',
	'study',
	'submit',
	'take',
	'text',
	'tidy',
	'update',
	'vacuum',
	'wash',
	'water',
	'write',
]

/** Verbs for things that are usually small once they're specific. */
const QUICK_VERBS = new Set([
	'ask',
	'book',
	'buy',
	'call',
	'cancel',
	'check',
	'email',
	'message',
	'order',
	'pay',
	'phone',
	'post',
	'print',
	'renew',
	'reply',
	'ring',
	'send',
	'sign',
	'submit',
	'text',
	'water',
])

/** Words that mean an idea is a project rather than a step. */
const BIG_WORDS =
	/\b(everything|all (?:the|my)|whole|entire|project|taxes|tax return|garage|house|flat|apartment|redesign|rebuild|overhaul|organi[sz]e|sort out|declutter|finances|budget|portfolio|website|thesis|dissertation|novel|book|cv|resume|job hunt|jobs|career|learn|course|move house|moving|wedding|holiday|trip)\b/i

const FILLERS =
	/^(?:(?:oh|and|also|plus|then|ugh|ok|okay|so|right|maybe|probably|honestly|really|still|finally|actually)[,\s]+)*(?:i\s+(?:really\s+)?(?:need|have|ought|want|must|should|gotta|got)\s+(?:to\s+)?|i've\s+got\s+to\s+|need\s+to\s+|have\s+to\s+|got\s+to\s+|gotta\s+|must\s+|should\s+|remember\s+to\s+|don't\s+forget\s+to\s+|(?:i\s+)?(?:keep\s+)?(?:forgetting|meaning)\s+to\s+)?/i

const verbAlternation = VERBS.map((v) => v.replace(' ', '\\s+')).join('|')
const STARTS_WITH_VERB = new RegExp(`^(?:${verbAlternation})\\b`, 'i')
/** Splits on "and" / "then" / commas only when an action verb follows, so "salt and pepper" stays. */
const JOINER_BEFORE_VERB = new RegExp(
	`\\s*(?:,\\s*(?:and\\s+|then\\s+|also\\s+)?|\\s+and\\s+(?:then\\s+|also\\s+)?|\\s+then\\s+|\\s+also\\s+)(?=(?:i\\s+(?:need|have|should|must|want)\\s+to\\s+|need\\s+to\\s+|remember\\s+to\\s+)?(?:${verbAlternation})\\b)`,
	'i',
)

/** Breaks a brain dump into separate ideas. */
export function splitIdeas(text: string): string[] {
	return text
		.split(/\r?\n|;|(?<=[.!?])\s+(?=[A-Z])/)
		.map((line) => line.replace(/^\s*(?:[-*•·–]|\d+[.)])\s*/, '').trim())
		.flatMap((line) => line.split(JOINER_BEFORE_VERB))
		.map(cleanIdea)
		.filter((idea) => idea.length >= 2)
}

/** Strips "I need to", trailing punctuation and so on, and capitalises the first letter. */
export function cleanIdea(idea: string): string {
	const cleaned = idea
		.trim()
		.replace(FILLERS, '')
		.replace(/[\s.,!;:]+$/, '')
		.replace(/\s+/g, ' ')
		.trim()
	return cleaned.charAt(0).toUpperCase() + cleaned.slice(1)
}

function firstVerb(title: string): string | null {
	const match = STARTS_WITH_VERB.exec(title)
	return match ? match[0].toLowerCase().replace(/\s+/g, ' ') : null
}

/** A rough size guess in minutes, and whether the idea is too big to start as it is. */
export function sizeUp(title: string, comfortMinutes = 20): { minutes: number; big: boolean } {
	const verb = firstVerb(title)
	const words = title.split(/\s+/).length
	if (BIG_WORDS.test(title) || words > 12) return { minutes: 120, big: true }
	if (verb && QUICK_VERBS.has(verb)) return { minutes: 5, big: false }
	if (!verb) return { minutes: 30, big: 30 > comfortMinutes }
	const minutes = words <= 4 ? 15 : 25
	return { minutes, big: minutes > comfortMinutes }
}

export interface UntangleOptions {
	now: Date
	/** Multiplies size guesses, learned from how long things really took. */
	minutesFactor?: number
	/** Anything expected to take longer than this is split into smaller steps. */
	comfortMinutes?: number
}

/** The offline engine: brain dump in, drafts out. */
export function untangle(text: string, options: UntangleOptions): Draft[] {
	const { now, minutesFactor = 1, comfortMinutes = 20 } = options
	return splitIdeas(text).map((idea) => {
		const due = findDue(idea, now)
		const title = due ? cleanIdea(idea.replace(due.phrase, ' ')) || idea : idea
		const kind = kindOf(title)
		const size = sizeUp(title, comfortMinutes)
		const minutes = Math.max(2, Math.round(size.minutes * minutesFactor))
		const template = templateFor(kind)
		const verb = firstVerb(title)
		return {
			title,
			kind,
			big: size.big,
			minutes,
			specific: !size.big && verb ? title : null,
			measurable: !size.big && verb ? (template.doneWhen(title) ?? null) : null,
			relevant: null,
			dueAt: due ? due.dueAt.toISOString() : null,
			starters: template.starters(title),
		}
	})
}

/** What the AI engine returns for each idea. Dates come back as words and are read locally. */
export interface Suggestion {
	title: string
	big: boolean
	minutes: number
	specific: string | null
	measurable: string | null
	relevant: string | null
	when: string | null
	starters: { title: string; minutes: number }[]
}

export function draftFromSuggestion(s: Suggestion, options: UntangleOptions): Draft {
	const kind = kindOf(s.title)
	const due = s.when ? findDue(s.when, options.now) : null
	const big = s.big || s.minutes * (options.minutesFactor ?? 1) > (options.comfortMinutes ?? 20)
	const starters =
		s.starters.length >= 2 ? s.starters.slice(0, 3) : templateFor(kind).starters(s.title)
	return {
		title: s.title,
		kind,
		big,
		minutes: Math.max(2, Math.round(s.minutes * (options.minutesFactor ?? 1))),
		specific: big ? null : s.specific,
		measurable: big ? null : s.measurable,
		relevant: s.relevant,
		dueAt: due ? due.dueAt.toISOString() : null,
		starters,
	}
}
