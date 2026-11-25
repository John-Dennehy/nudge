import { describeDue, describeMinutes } from '@/core/dates'
import type { Goal, NudgeState } from '@/core/types'

interface Props {
	goal: Goal
	state: NudgeState
	now: Date
	onDone: () => void
	onFailed: () => void
	onPutBack: () => void
}

/** The one thing being worked on. No timer: the due date is a date, never a countdown. */
export function AgreedTask({ goal, state, now, onDone, onFailed, onPutBack }: Props) {
	const parent = goal.parentId ? state.goals[goal.parentId] : undefined
	const { smart } = goal
	return (
		<section
			aria-labelledby="now"
			className="panel space-y-5 border-sage p-6 sm:p-8"
			data-testid="agreed"
		>
			<div>
				<p className="eyebrow text-sage">Doing now</p>
				<h2 id="now" className="mt-2 text-3xl font-bold">
					{goal.title}
				</h2>
				{parent && <p className="mt-1 text-muted">A step towards “{parent.title}”</p>}
			</div>
			<dl className="grid gap-3 sm:grid-cols-2">
				{smart.specific && smart.specific !== goal.title && (
					<Detail term="Start by">{smart.specific}</Detail>
				)}
				{smart.measurable && <Detail term="Done when">{smart.measurable}</Detail>}
				{smart.minutes && (
					<Detail term="Should take">About {describeMinutes(smart.minutes)}</Detail>
				)}
				{smart.dueAt && <Detail term="By">{describeDue(smart.dueAt, now)}</Detail>}
				{smart.relevant && !parent && <Detail term="Why">{smart.relevant}</Detail>}
			</dl>
			<div className="flex flex-wrap gap-3">
				<button type="button" className="btn-primary" onClick={onDone}>
					Done
				</button>
				<button type="button" className="btn-quiet" onClick={onFailed}>
					Failed
				</button>
				<button type="button" className="btn-ghost" onClick={onPutBack}>
					Put it back for now
				</button>
			</div>
			<p className="text-sm text-muted">
				Failed is fine. It’s feedback, and Nudge will use it to size the next try.
			</p>
		</section>
	)
}

function Detail({ term, children }: { term: string; children: React.ReactNode }) {
	return (
		<div className="rounded-2xl bg-paper p-4">
			<dt className="eyebrow">{term}</dt>
			<dd className="mt-1 font-bold">{children}</dd>
		</div>
	)
}
