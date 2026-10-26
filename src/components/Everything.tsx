import { describeDue } from '@/core/dates'
import { listGoals } from '@/core/journal'
import type { NudgeState } from '@/core/types'

interface Props {
	state: NudgeState
	now: Date
	onPick: (goalId: string) => void
	onRemove: (goalId: string) => void
}

/** The full list, folded away by default so it never becomes a wall of tasks. */
export function Everything({ state, now, onPick, onRemove }: Props) {
	const open = listGoals(state, (g) => ['shaping', 'ready', 'split', 'agreed'].includes(g.status))
	if (!open.length) return null
	const children = (id: string) => open.filter((g) => g.parentId === id)
	const top = open.filter(
		(g) => !g.parentId || !state.goals[g.parentId] || state.goals[g.parentId]?.status === 'removed',
	)

	return (
		<details className="panel p-5">
			<summary className="cursor-pointer font-bold">See everything ({open.length})</summary>
			<ul className="mt-4 space-y-2">
				{top.map((goal) => (
					<li key={goal.id}>
						<Row goal={goal} now={now} onPick={onPick} onRemove={onRemove} />
						{children(goal.id).length > 0 && (
							<ul className="mt-2 ml-5 space-y-2 border-l-2 border-edge pl-4">
								{children(goal.id).map((step) => (
									<li key={step.id}>
										<Row goal={step} now={now} onPick={onPick} onRemove={onRemove} />
									</li>
								))}
							</ul>
						)}
					</li>
				))}
			</ul>
		</details>
	)
}

const STATUS: Record<string, string> = {
	shaping: 'Has a question waiting',
	split: 'Bigger goal, working through steps',
	ready: 'Ready',
	agreed: 'Doing now',
}

function Row({
	goal,
	now,
	onPick,
	onRemove,
}: {
	goal: NudgeState['goals'][string]
	now: Date
	onPick: (id: string) => void
	onRemove: (id: string) => void
}) {
	return (
		<div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-paper px-4 py-3">
			<div>
				<p className="font-bold">{goal.title}</p>
				<p className="text-sm text-muted">
					{STATUS[goal.status]}
					{goal.smart.dueAt && ` · by ${describeDue(goal.smart.dueAt, now)}`}
				</p>
			</div>
			<div className="flex gap-1">
				{goal.status === 'ready' && (
					<button type="button" className="btn-ghost text-sm" onClick={() => onPick(goal.id)}>
						Do this
					</button>
				)}
				<button
					type="button"
					className="btn-ghost text-sm"
					onClick={() => onRemove(goal.id)}
					aria-label={`Remove “${goal.title}”`}
				>
					Remove
				</button>
			</div>
		</div>
	)
}
