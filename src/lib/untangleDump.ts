import type { Calibration } from '@/core/calibration'
import { type Draft, draftFromSuggestion, untangle } from '@/core/untangle'
import { suggestGoals } from '@/server/journal'

/** Uses the AI engine when it's on and answers well, and the built-in rules otherwise. */
export async function untangleDump(
	text: string,
	calibration: Calibration,
	ai: boolean,
): Promise<Draft[]> {
	const options = {
		now: new Date(),
		minutesFactor: calibration.minutesFactor,
		comfortMinutes: calibration.comfortMinutes,
	}
	if (ai) {
		try {
			const { suggestions } = await suggestGoals({ data: { text } })
			if (suggestions?.length) return suggestions.map((s) => draftFromSuggestion(s, options))
		} catch {
			// Fall through to the built-in rules.
		}
	}
	return untangle(text, options)
}
