import { createFileRoute } from '@tanstack/react-router'
import { type FormEvent, useId, useMemo, useState } from 'react'
import { progressLines } from '@/components/QuietProgress'
import { describeDue } from '@/core/dates'
import { listGoals } from '@/core/journal'
import { quietProgress } from '@/core/progress'
import { clearLocalCopy, useJournal } from '@/lib/useJournal'
import { createPairCode, deleteEverything, joinWithCode } from '@/server/journal'

export const Route = createFileRoute('/progress')({
	ssr: false,
	head: () => ({ meta: [{ title: 'Progress · Nudge' }] }),
	component: ProgressPage,
})

function ProgressPage() {
	const { state, events, calibration } = useJournal()
	const now = useMemo(() => new Date(), [])
	const progress = useMemo(
		() => quietProgress(events, state, new Date(new Date(now).setHours(0, 0, 0, 0))),
		[events, state, now],
	)
	const recent = listGoals(state, (g) => g.status === 'succeeded' || g.status === 'failed')
		.sort((a, b) => Date.parse(b.finishedAt ?? '') - Date.parse(a.finishedAt ?? ''))
		.slice(0, 12)
	const lines = progressLines(progress.allTime)

	return (
		<div className="space-y-10 pt-4">
			<section className="space-y-3">
				<h1 className="text-4xl font-bold">Progress</h1>
				<p className="text-lg text-muted">
					The work that’s easy to miss. Wins and misses both count: every miss is something learned.
				</p>
				<ul className="grid gap-3 sm:grid-cols-2">
					{(lines.length ? lines : ['Nothing yet. It all starts with one brain dump.']).map(
						(line) => (
							<li key={line} className="rounded-3xl bg-plum-soft p-5 text-lg font-bold">
								{line}
							</li>
						),
					)}
				</ul>
			</section>

			<section aria-labelledby="learned" className="panel space-y-4 p-6">
				<h2 id="learned" className="text-2xl font-bold">
					What Nudge has learned
				</h2>
				{calibration.results < 5 ? (
					<p className="text-muted">
						After {5 - calibration.results} more{' '}
						{5 - calibration.results === 1 ? 'thing finishes' : 'things finish'}, done or not, Nudge
						will start adjusting how big and how soon it pitches goals.
					</p>
				) : calibration.notes.length ? (
					<ul className="list-disc space-y-1 pl-5">
						{calibration.notes.map((note) => (
							<li key={note}>{note}</li>
						))}
					</ul>
				) : (
					<p>
						Goals are pitched about right: you get most of them done, but not all. That’s the sweet
						spot.
					</p>
				)}
				{calibration.results > 0 && (
					<table className="w-full text-left">
						<caption className="sr-only">How often goals of each size got done</caption>
						<thead>
							<tr className="eyebrow">
								<th className="py-2 font-bold">Size</th>
								<th className="py-2 font-bold">Done</th>
							</tr>
						</thead>
						<tbody>
							{calibration.bySize
								.filter((s) => s.total > 0)
								.map((s) => (
									<tr key={s.label} className="border-t border-edge">
										<td className="py-2">{s.label}</td>
										<td className="py-2">
											{s.done} of {s.total}
										</td>
									</tr>
								))}
						</tbody>
					</table>
				)}
			</section>

			{recent.length > 0 && (
				<section aria-labelledby="recent" className="space-y-3">
					<h2 id="recent" className="text-2xl font-bold">
						Recently
					</h2>
					<ul className="space-y-2">
						{recent.map((goal) => (
							<li
								key={goal.id}
								className="flex flex-wrap justify-between gap-2 rounded-2xl bg-surface px-4 py-3"
							>
								<span className="font-bold">{goal.title}</span>
								<span className={goal.status === 'succeeded' ? 'text-sage' : 'text-apricot'}>
									{goal.status === 'succeeded'
										? 'Done'
										: goal.cause === 'never-started'
											? 'Failed: never started'
											: 'Failed: ran out of time'}
									{goal.finishedAt && `, ${describeDue(goal.finishedAt, now)}`}
								</span>
							</li>
						))}
					</ul>
				</section>
			)}

			<Devices />
		</div>
	)
}

function Devices() {
	const [code, setCode] = useState<{ code: string; expiresAt: string } | null>(null)
	const [entered, setEntered] = useState('')
	const [message, setMessage] = useState<string | null>(null)
	const [confirming, setConfirming] = useState(false)
	const inputId = useId()

	const join = async (e: FormEvent) => {
		e.preventDefault()
		const result = await joinWithCode({ data: { code: entered } })
		if (result.ok) {
			clearLocalCopy()
			window.location.assign('/today')
		} else {
			setMessage('That code didn’t work. Codes last 15 minutes and can be used once.')
		}
	}

	const remove = async () => {
		await deleteEverything()
		clearLocalCopy()
		window.location.assign('/')
	}

	return (
		<section aria-labelledby="devices" className="panel space-y-6 p-6">
			<div>
				<h2 id="devices" className="text-2xl font-bold">
					Your space
				</h2>
				<p className="mt-1 text-muted">
					There’s no account. Your list lives in a private space linked to this browser.
				</p>
			</div>

			<div className="space-y-2">
				<h3 className="text-lg font-bold">Use Nudge on another device</h3>
				{code ? (
					<p>
						On the other device, open Progress and enter{' '}
						<strong className="font-mono text-lg">{code.code}</strong>. It works once, for 15
						minutes.
					</p>
				) : (
					<button
						type="button"
						className="btn-quiet"
						onClick={async () => setCode(await createPairCode())}
					>
						Get a linking code
					</button>
				)}
			</div>

			<form onSubmit={join} className="space-y-2">
				<label htmlFor={inputId} className="block text-lg font-bold">
					Have a code from another device?
				</label>
				<p className="text-sm text-muted">This swaps this browser over to that device’s list.</p>
				<div className="flex flex-col gap-2 sm:flex-row">
					<input
						id={inputId}
						value={entered}
						onChange={(e) => {
							setEntered(e.target.value)
							setMessage(null)
						}}
						placeholder="maple-otter-42"
						className="min-h-11 flex-1 rounded-full border border-edge bg-paper px-4"
						autoComplete="off"
					/>
					<button type="submit" className="btn-quiet" disabled={entered.trim().length < 3}>
						Link this device
					</button>
				</div>
				{message && (
					<p role="alert" className="text-sm text-apricot">
						{message}
					</p>
				)}
			</form>

			<div className="space-y-2">
				<h3 className="text-lg font-bold">Delete everything</h3>
				{confirming ? (
					<div className="flex flex-wrap items-center gap-3">
						<p>This can’t be undone. All goals, reflections and progress will go.</p>
						<button type="button" className="btn bg-apricot text-surface" onClick={remove}>
							Yes, delete it all
						</button>
						<button type="button" className="btn-ghost" onClick={() => setConfirming(false)}>
							Keep it
						</button>
					</div>
				) : (
					<button type="button" className="btn-quiet" onClick={() => setConfirming(true)}>
						Delete everything
					</button>
				)}
			</div>
		</section>
	)
}
