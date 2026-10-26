import { describeDue, describeMinutes } from '@/core/dates'
import type { Nudge } from '@/core/nudges'
import type { Energy, NudgeState } from '@/core/types'

const ENERGY: { value: Energy; label: string; hint: string }[] = [
	{ value: 'low', label: 'Low', hint: 'Small and easy only' },
	{ value: 'okay', label: 'Okay', hint: 'A bit of everything' },
	{ value: 'good', label: 'Good', hint: 'Ready for something harder' },
]

interface Props {
	energy: Energy | null
	onEnergy: (energy: Energy) => void
	nudges: Nudge[]
	state: NudgeState
	now: Date
	onPick: (goalId: string) => void
}

export function Nudges({ energy, onEnergy, nudges, state, now, onPick }: Props) {
	return (
		<section aria-labelledby="pick" className="space-y-4">
			<h2 id="pick" className="text-2xl font-bold">
				What next?
			</h2>
			<fieldset className="space-y-2">
				<legend className="text-muted">How much energy do you have right now?</legend>
				<div className="flex flex-wrap gap-2">
					{ENERGY.map((e) => (
						<label
							key={e.value}
							className="btn-quiet cursor-pointer has-checked:border-sage has-checked:bg-sage-soft has-focus-visible:outline-2 has-focus-visible:outline-sage"
						>
							<input
								type="radio"
								name="energy"
								value={e.value}
								checked={energy === e.value}
								onChange={() => onEnergy(e.value)}
								className="sr-only"
							/>
							{e.label}
							<span className="text-sm font-normal text-muted">{e.hint}</span>
						</label>
					))}
				</div>
			</fieldset>

			{energy && nudges.length === 0 && (
				<p className="rounded-3xl bg-sage-soft p-5">
					Nothing is ready to pick yet. Dump a thought above, or answer a question to get something
					ready.
				</p>
			)}

			{energy && nudges.length > 0 && (
				<ul className="grid gap-3 sm:grid-cols-2" aria-label="Suggestions">
					{nudges.map((nudge) => {
						const goal = state.goals[nudge.goalId]
						if (!goal) return null
						return (
							<li key={nudge.goalId} className="panel flex flex-col gap-3 p-5">
								<p className="eyebrow text-plum">{nudge.label}</p>
								<h3 className="text-xl font-bold">{goal.title}</h3>
								<p className="text-muted">{nudge.reason}</p>
								<p className="text-sm text-muted">
									{goal.smart.minutes && `About ${describeMinutes(goal.smart.minutes)}`}
									{goal.smart.dueAt && ` · by ${describeDue(goal.smart.dueAt, now)}`}
								</p>
								<button
									type="button"
									className="btn-primary mt-auto"
									onClick={() => onPick(goal.id)}
								>
									Do this one
								</button>
							</li>
						)
					})}
				</ul>
			)}
		</section>
	)
}
