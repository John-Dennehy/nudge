/**
 * The plain-English rule from CONTEXT.md: nothing shown to a person uses technical or
 * productivity jargon. Tests run every piece of interface text through this, and the AI
 * engine's output is checked with it before anyone sees it.
 */

export const JARGON = [
	'smart',
	'confidence score',
	'criteria',
	'criterion',
	'dependency',
	'dependencies',
	'state machine',
	'triad',
	'deconstruct',
	'deconstruction',
	'prerequisite',
	'atomic',
	'backlog',
	'epic',
	'sprint',
	'kanban',
	'wip',
	'productivity',
	'streak',
	'leaderboard',
	'archetype',
	'entity',
	'transition',
	'calibrate',
	'calibration',
	'parse',
	'parsing',
	'friction',
	'inertia',
	'scope',
	'leverage',
	'actionable',
	'deliverable',
	'optimi[sz]e',
	'workflow',
	'metric',
]

const PATTERN = new RegExp(`\\b(?:${JARGON.join('|')})\\b`, 'gi')

/** The jargon found in some text, lower-cased, or an empty list. */
export function findJargon(text: string): string[] {
	return [...text.matchAll(PATTERN)].map((m) => m[0].toLowerCase())
}

export function isPlainEnglish(text: string): boolean {
	return findJargon(text).length === 0
}
