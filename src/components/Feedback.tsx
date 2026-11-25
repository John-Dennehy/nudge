import { useId, useState } from 'react'
import type { Goal, Reflection } from '@/core/types'

interface Props {
	goal: Goal
	waiting: number
	onSave: (reflection: Reflection, retry: boolean) => void
}

const CAUSE: Record<string, string> = {
	'never-started': 'It never got started, so getting going may have been the hard part.',
	'ran-out-of-time':
		'It was started but ran out of time, so it may have been bigger than it looked.',
}

/**
 * Reflecting is optional: Nudge learns from the pattern either way. These questions add detail
 * when there's time for them.
 */
export function Feedback({ goal, waiting, onSave }: Props) {
	const failed = goal.status === 'failed'
	const [reflection, setReflection] = useState<Reflection>({})
	const [retry, setRetry] = useState(true)
	const noteId = useId()
	const set = (patch: Partial<Reflection>) => setReflection((r) => ({ ...r, ...patch }))

	return (
		<section aria-labelledby="feedback" className="panel space-y-5 p-6" data-testid="feedback">
			<div>
				<p className={failed ? 'eyebrow text-apricot' : 'eyebrow text-sage'}>
					{failed ? (goal.auto ? 'Failed: its date passed' : 'Failed') : 'Done'}
				</p>
				<h2 id="feedback" className="mt-1 text-2xl font-bold">
					{goal.title}
				</h2>
				<p className="mt-2 text-muted">
					{failed
						? `That’s feedback, not a verdict. ${goal.cause ? CAUSE[goal.cause] : ''}`
						: 'Nice work. A couple of quick questions help Nudge pitch the next one.'}
				</p>
			</div>

			{failed ? (
				<>
					<YesNo
						label="Was it a reasonable goal?"
						value={reflection.reasonable}
						onChange={(v) => set({ reasonable: v })}
					/>
					<YesNo
						label="Did you feel overwhelmed?"
						value={reflection.overwhelmed}
						onChange={(v) => set({ overwhelmed: v })}
					/>
				</>
			) : (
				<>
					<YesNo
						label="Did it push you outside your comfort zone?"
						value={reflection.stretched}
						onChange={(v) => set({ stretched: v })}
					/>
					<Choice
						label="How long did it take?"
						value={reflection.took}
						options={[
							['less', 'Less than I thought'],
							['about-right', 'About right'],
							['more', 'Longer than I thought'],
						]}
						onChange={(v) => set({ took: v })}
					/>
				</>
			)}

			<div className="space-y-2">
				<label htmlFor={noteId} className="font-bold">
					Anything to remember for next time?{' '}
					<span className="font-normal text-muted">(optional)</span>
				</label>
				<textarea
					id={noteId}
					rows={2}
					maxLength={1000}
					value={reflection.note ?? ''}
					onChange={(e) => set({ note: e.target.value || undefined })}
					className="w-full rounded-2xl border border-edge bg-paper p-3"
				/>
			</div>

			{failed && (
				<label className="flex items-center gap-3">
					<input
						type="checkbox"
						checked={retry}
						onChange={(e) => setRetry(e.target.checked)}
						className="size-5 accent-sage"
					/>
					Try again with a better-sized goal
				</label>
			)}

			<div className="flex flex-wrap gap-3">
				<button
					type="button"
					className="btn-primary"
					onClick={() => onSave(reflection, failed && retry)}
				>
					Save
				</button>
				<button type="button" className="btn-ghost" onClick={() => onSave({}, failed && retry)}>
					Skip the questions
				</button>
				{waiting > 0 && <p className="self-center text-sm text-muted">{waiting} more after this</p>}
			</div>
		</section>
	)
}

function YesNo({
	label,
	value,
	onChange,
}: {
	label: string
	value?: boolean
	onChange: (v: boolean) => void
}) {
	return (
		<Choice
			label={label}
			value={value === undefined ? undefined : value ? 'yes' : 'no'}
			options={[
				['yes', 'Yes'],
				['no', 'No'],
			]}
			onChange={(v) => onChange(v === 'yes')}
		/>
	)
}

function Choice<T extends string>({
	label,
	value,
	options,
	onChange,
}: {
	label: string
	value?: T
	options: [T, string][]
	onChange: (v: T) => void
}) {
	const name = useId()
	return (
		<fieldset className="space-y-2">
			<legend className="font-bold">{label}</legend>
			<div className="flex flex-wrap gap-2">
				{options.map(([v, text]) => (
					<label
						key={v}
						className="btn-quiet cursor-pointer has-checked:border-sage has-checked:bg-sage-soft has-focus-visible:outline-2 has-focus-visible:outline-sage"
					>
						<input
							type="radio"
							name={name}
							checked={value === v}
							onChange={() => onChange(v)}
							className="sr-only"
						/>
						{text}
					</label>
				))}
			</div>
		</fieldset>
	)
}
