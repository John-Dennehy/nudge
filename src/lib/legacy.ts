import { type Draft, untangle } from '@/core/untangle'

/**
 * The first version of Nudge kept tasks in this browser under "nudge_tasks_v1". The first
 * time the new version loads with an empty space, unfinished tasks are brought over.
 */

const LEGACY_KEY = 'nudge_tasks_v1'
const DONE_KEY = 'nudge_tasks_v1_imported'
const OPEN_STATES = new Set(['Ideas', 'Defined', 'Active', 'Paused'])

export function legacyDrafts(now: Date): Draft[] | null {
	try {
		const raw = localStorage.getItem(LEGACY_KEY)
		if (!raw) return null
		localStorage.setItem(DONE_KEY, raw)
		localStorage.removeItem(LEGACY_KEY)
		const tasks = JSON.parse(raw) as { title?: unknown; state?: unknown; parentId?: unknown }[]
		const titles = tasks
			.filter((t) => typeof t.title === 'string' && OPEN_STATES.has(String(t.state)) && !t.parentId)
			.map((t) => String(t.title))
			.slice(0, 200)
		return titles.flatMap((title) => untangle(title, { now }).slice(0, 1))
	} catch {
		return null
	}
}
