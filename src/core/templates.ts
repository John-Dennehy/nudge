/**
 * Offline suggestions for common kinds of task: smaller first steps, what "done" could look
 * like, and why it might matter. All of this text is shown to people, so it follows the
 * plain-English rule (checked by plainEnglish.test.ts).
 */

export type Kind =
	| 'cleaning'
	| 'money'
	| 'messages'
	| 'writing'
	| 'jobs'
	| 'building'
	| 'learning'
	| 'errands'
	| 'health'
	| 'other'

interface Starter {
	title: string
	minutes: number
}

interface Template {
	starters: (title: string) => Starter[]
	doneOptions: (title: string) => string[]
	whyOptions: string[]
	/** A confident guess at what done looks like, for small tasks. */
	doneWhen: (title: string) => string | undefined
}

const KIND_WORDS: [Kind, RegExp][] = [
	[
		'money',
		/\b(tax|taxes|bill|bills|budget|finances?|bank|invoice|pension|insurance|payslip|receipts?|debt|council|benefits?|refund)\b/i,
	],
	[
		'jobs',
		/\b(jobs?|apply|application|interview|cv|resume|cover letter|recruiter|linkedin|career)\b/i,
	],
	[
		'health',
		/\b(doctor|gp|dentist|appointment|prescription|meds|medication|therapy|therapist|hospital|optician|physio|vaccine)\b/i,
	],
	[
		'cleaning',
		/\b(clean|tidy|declutter|wash|laundry|washing|dishes|hoover|vacuum|bins?|kitchen|bathroom|bedroom|garage|room|fridge|wardrobe)\b/i,
	],
	[
		'messages',
		/\b(emails?|inbox|messages?|reply|replies|texts?|call back|voicemail|whatsapp|dms?)\b/i,
	],
	[
		'writing',
		/\b(write|essay|report|blog|article|thesis|dissertation|chapter|newsletter|post|draft|proposal|speech)\b/i,
	],
	[
		'building',
		/\b(website|app|code|portfolio|project|build|deploy|bug|feature|repo|design|prototype|side project)\b/i,
	],
	[
		'learning',
		/\b(learn|study|course|practi[cs]e|revise|revision|exam|lesson|tutorial|homework|language)\b/i,
	],
	[
		'errands',
		/\b(shop|shopping|groceries|errands?|buy|pick up|collect|return|parcel|post office|pharmacy)\b/i,
	],
]

export function kindOf(title: string): Kind {
	return KIND_WORDS.find(([, words]) => words.test(title))?.[0] ?? 'other'
}

/** Shortens a title for use inside a suggestion: "Sort out my taxes" → "my taxes". */
function topic(title: string): string {
	const stripped = title
		.replace(
			/^(?:sort out|sort|do|finish|start|clean|tidy|organi[sz]e|fix|write|plan|work on|deal with|get)\s+/i,
			'',
		)
		.trim()
	const short = stripped.split(/\s+/).slice(0, 5).join(' ')
	return short.charAt(0).toLowerCase() + short.slice(1)
}

const GENERIC_WHY = [
	"Someone's counting on it",
	"It'll take a weight off my mind",
	'It moves something bigger forward',
	"It's good for future me",
]

const DONE_BY_VERB: [RegExp, string][] = [
	[/^(?:call|phone|ring)\b/i, 'The call is made'],
	[/^(?:email|message|text|reply|send)\b/i, "It's sent"],
	[/^pay\b/i, "It's paid"],
	[/^book\b/i, "It's booked"],
	[/^(?:buy|order)\b/i, "It's ordered"],
	[/^cancel\b/i, "It's cancelled"],
	[/^renew\b/i, "It's renewed"],
	[/^submit\b/i, "It's submitted"],
	[/^post\b/i, "It's posted"],
	[/^sign\b/i, "It's signed"],
	[/^print\b/i, "It's printed"],
	[/^water\b/i, 'The plants are watered'],
	[/^ask\b/i, "I've asked"],
	[/^check\b/i, 'I know the answer'],
]

const doneWhen = (title: string) => DONE_BY_VERB.find(([verb]) => verb.test(title))?.[1]

const TEMPLATES: Record<Kind, Template> = {
	cleaning: {
		starters: (t) => [
			{ title: 'Put on a song and clear one surface', minutes: 5 },
			{ title: 'Fill one bag with things to throw away', minutes: 10 },
			{ title: `Do just the dishes or laundry part of ${topic(t)}`, minutes: 15 },
		],
		doneOptions: () => [
			'One surface is clear',
			'It looks better than before',
			'Everything is put away',
		],
		whyOptions: [
			'I want to feel calmer at home',
			'Someone is coming over',
			...GENERIC_WHY.slice(1, 3),
		],
		doneWhen,
	},
	money: {
		starters: (t) => [
			{ title: `Find where the paperwork for ${topic(t)} is`, minutes: 5 },
			{ title: 'Write down the one number or date I need', minutes: 5 },
			{ title: `Open the website or app for ${topic(t)} and log in`, minutes: 5 },
		],
		doneOptions: () => [
			"It's paid or sent",
			'I know what I owe and when',
			'The papers are in one place',
		],
		whyOptions: [
			'There could be a fine or late fee',
			"It'll take a weight off my mind",
			GENERIC_WHY[3] as string,
		],
		doneWhen,
	},
	messages: {
		starters: () => [
			{ title: 'Reply to the one message that matters most', minutes: 5 },
			{ title: 'Archive everything older than a month', minutes: 5 },
			{ title: 'Write a two-line reply and send it as is', minutes: 5 },
		],
		doneOptions: () => ["It's sent", 'Nothing urgent is waiting', 'I know who needs a reply'],
		whyOptions: [
			"Someone's waiting on me",
			"It'll take a weight off my mind",
			GENERIC_WHY[2] as string,
		],
		doneWhen,
	},
	writing: {
		starters: (t) => [
			{ title: `Open a blank page and give ${topic(t)} a title`, minutes: 2 },
			{ title: 'Write three bullet points, badly on purpose', minutes: 10 },
			{ title: 'Write the messiest possible first paragraph', minutes: 15 },
		],
		doneOptions: () => [
			'A rough draft exists',
			'It has a title and three points',
			"It's sent or published",
		],
		whyOptions: [
			"Someone's waiting for it",
			"It's something I care about",
			GENERIC_WHY[2] as string,
		],
		doneWhen,
	},
	jobs: {
		starters: () => [
			{ title: 'Save one job listing that looks interesting', minutes: 5 },
			{ title: 'Update the top line of my CV', minutes: 10 },
			{ title: 'Write the first sentence of a cover letter', minutes: 10 },
		],
		doneOptions: () => [
			'One application is sent',
			'I have a shortlist of three',
			'My CV is up to date',
		],
		whyOptions: ['I need the money', 'I want something better', GENERIC_WHY[3] as string],
		doneWhen,
	},
	building: {
		starters: (t) => [
			{ title: `Open ${topic(t)} and read where I left off`, minutes: 5 },
			{ title: 'Write down the next three small changes', minutes: 10 },
			{ title: 'Fix or finish the smallest thing on the list', minutes: 15 },
		],
		doneOptions: () => [
			"It's working",
			'The change is saved and pushed',
			'I know what the next step is',
		],
		whyOptions: [
			"It's something I care about",
			'It could help my career',
			GENERIC_WHY[2] as string,
		],
		doneWhen,
	},
	learning: {
		starters: () => [
			{ title: 'Open the lesson or book where I left off', minutes: 2 },
			{ title: 'Do one short exercise or page', minutes: 10 },
			{ title: 'Write down one thing I want to understand', minutes: 5 },
		],
		doneOptions: () => [
			'One lesson is done',
			'I can explain one new thing',
			'I practised for the time I planned',
		],
		whyOptions: [
			"It's something I care about",
			'There is a test or deadline',
			GENERIC_WHY[3] as string,
		],
		doneWhen,
	},
	errands: {
		starters: () => [
			{ title: 'Write the list of what I need', minutes: 5 },
			{ title: 'Put everything I need by the door', minutes: 5 },
			{ title: 'Check the opening times', minutes: 2 },
		],
		doneOptions: () => [
			"It's done and I'm home",
			'Everything on the list is ticked off',
			"It's ordered",
		],
		whyOptions: ['I need it soon', "Someone's counting on it", GENERIC_WHY[1] as string],
		doneWhen,
	},
	health: {
		starters: () => [
			{ title: 'Find the phone number or booking page', minutes: 2 },
			{ title: 'Write down what I want to say or ask', minutes: 5 },
			{ title: 'Make the call or booking', minutes: 10 },
		],
		doneOptions: () => ["It's booked", 'I know the next step', "I've asked my question"],
		whyOptions: ['My health matters', "It's been worrying me", GENERIC_WHY[3] as string],
		doneWhen,
	},
	other: {
		starters: (t) => [
			{ title: `Spend two minutes looking at ${topic(t)}`, minutes: 2 },
			{ title: 'Write down the very first step', minutes: 5 },
			{ title: 'Do the first step and stop there', minutes: 10 },
		],
		doneOptions: () => ['The first step is done', 'I know what happens next', "It's finished"],
		whyOptions: GENERIC_WHY,
		doneWhen,
	},
}

export function templateFor(kind: Kind): Template {
	return TEMPLATES[kind]
}

/** Every template string, for the plain-English check. */
export function allTemplateText(): string[] {
	const sample = 'Sort out my taxes'
	return Object.values(TEMPLATES).flatMap((t) => [
		...t.starters(sample).map((s) => s.title),
		...t.doneOptions(sample),
		...t.whyOptions,
		...DONE_BY_VERB.map(([, text]) => text),
	])
}
