import { Link } from '@tanstack/react-router'
import type { ProgressCounts } from '@/core/progress'

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

export function progressLines(c: ProgressCounts): string[] {
	return [
		c.untangled && plural(c.untangled, 'thought untangled', 'thoughts untangled'),
		c.done && plural(c.done, 'thing done', 'things done'),
		c.lessons && plural(c.lessons, 'lesson learned', 'lessons learned'),
		c.reflections && plural(c.reflections, 'reflection saved', 'reflections saved'),
		c.stretches && plural(c.stretches, 'comfort zone stretched', 'comfort zones stretched'),
	].filter((line): line is string => Boolean(line))
}

/** A gentle line about today. Never a score, never a streak. */
export function QuietProgress({ today }: { today: ProgressCounts }) {
	const lines = progressLines(today)
	return (
		<aside
			aria-label="Today so far"
			className="flex flex-wrap items-center justify-between gap-2 rounded-3xl bg-plum-soft px-5 py-4"
		>
			<p>
				<span className="font-bold">Today so far: </span>
				{lines.length ? lines.join(' · ') : 'Opening this counts. Start wherever you like.'}
			</p>
			<Link to="/progress" className="text-sm font-bold text-plum underline">
				See all progress
			</Link>
		</aside>
	)
}
