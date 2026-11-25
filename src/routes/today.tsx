import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import { AgreedTask } from '@/components/AgreedTask'
import { BrainDump } from '@/components/BrainDump'
import { ClarificationDeck } from '@/components/ClarificationDeck'
import { Everything } from '@/components/Everything'
import { Feedback } from '@/components/Feedback'
import { Nudges } from '@/components/Nudges'
import { QuietProgress } from '@/components/QuietProgress'
import { SyncNote } from '@/components/SyncNote'
import { listGoals } from '@/core/journal'
import { curateNudges } from '@/core/nudges'
import { quietProgress } from '@/core/progress'
import { useEnergy } from '@/lib/energy'
import { untangleDump } from '@/lib/untangleDump'
import { useJournal } from '@/lib/useJournal'

export const Route = createFileRoute('/today')({
	ssr: false,
	head: () => ({ meta: [{ title: 'Today · Nudge' }] }),
	component: Today,
})

function useNow(everyMs = 60_000) {
	const [now, setNow] = useState(() => new Date())
	useEffect(() => {
		const timer = setInterval(() => setNow(new Date()), everyMs)
		return () => clearInterval(timer)
	}, [everyMs])
	return now
}

function Today() {
	const { state, events, calibration, dispatch, status, ai } = useJournal()
	const [energy, setEnergy] = useEnergy()
	const [later, setLater] = useState<string[]>([])
	const [announcement, setAnnouncement] = useState('')
	const now = useNow()

	const agreed = state.agreedId ? state.goals[state.agreedId] : undefined
	const asking = listGoals(state, (g) => g.card !== null)
	const deckGoal = asking.find((g) => !later.includes(g.id)) ?? asking[0]
	const parents = new Set(
		Object.values(state.goals).flatMap((g) => (g.parentId ? [g.parentId] : [])),
	)
	const unreflected = listGoals(
		state,
		(g) =>
			(g.status === 'succeeded' || g.status === 'failed') && !g.reflection && !parents.has(g.id),
	).reverse()
	const nudges = useMemo(
		() => (energy ? curateNudges(state, energy, calibration, now) : []),
		[state, energy, calibration, now],
	)
	const startOfToday = useMemo(() => new Date(new Date(now).setHours(0, 0, 0, 0)), [now])
	const progress = useMemo(
		() => quietProgress(events, state, startOfToday),
		[events, state, startOfToday],
	)
	const isEmpty = state.order.length === 0

	const onDump = async (text: string) => {
		const drafts = await untangleDump(text, calibration, ai)
		const result = dispatch({ type: 'dump', text, drafts })
		if (result.ok) {
			setAnnouncement(
				drafts.length === 1
					? 'Got it: one thing.'
					: `Untangled into ${drafts.length} separate things.`,
			)
		}
	}

	if (status === 'loading' && isEmpty) {
		return <p className="py-24 text-center text-muted">Opening your list…</p>
	}

	return (
		<div className="space-y-6">
			<SyncNote status={status} />
			<p className="sr-only" role="status" aria-live="polite">
				{announcement}
			</p>

			{unreflected[0] && (
				<Feedback
					key={unreflected[0].id}
					goal={unreflected[0]}
					waiting={unreflected.length - 1}
					onSave={(reflection, retry) =>
						dispatch({ type: 'reflect', goalId: unreflected[0]?.id ?? '', reflection, retry })
					}
				/>
			)}

			{agreed && (
				<AgreedTask
					goal={agreed}
					state={state}
					now={now}
					onDone={() => dispatch({ type: 'finish', goalId: agreed.id, outcome: 'succeeded' })}
					onFailed={() => dispatch({ type: 'finish', goalId: agreed.id, outcome: 'failed' })}
					onPutBack={() => dispatch({ type: 'putBack', goalId: agreed.id })}
				/>
			)}

			{deckGoal && (
				<ClarificationDeck
					goal={deckGoal}
					waiting={asking.length - 1}
					onChoose={(optionId) => {
						dispatch({ type: 'answer', goalId: deckGoal.id, optionId })
					}}
					onWriteIn={(text) => {
						const result = dispatch({ type: 'writeIn', goalId: deckGoal.id, text })
						return result.ok ? null : result.message
					}}
					onLater={() => setLater((l) => [...l.filter((id) => id !== deckGoal.id), deckGoal.id])}
				/>
			)}

			<BrainDump onDump={onDump} ai={ai} first={isEmpty} />

			{!agreed && !isEmpty && (
				<Nudges
					energy={energy}
					onEnergy={setEnergy}
					nudges={nudges}
					state={state}
					now={now}
					onPick={(goalId) => dispatch({ type: 'agree', goalId })}
				/>
			)}

			<QuietProgress today={progress.today} />

			<Everything
				state={state}
				now={now}
				onPick={(goalId) => dispatch({ type: 'agree', goalId })}
				onRemove={(goalId) => dispatch({ type: 'remove', goalId })}
			/>
		</div>
	)
}
