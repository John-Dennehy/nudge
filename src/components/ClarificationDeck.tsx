import { type KeyboardEvent, useEffect, useId, useRef, useState } from 'react'
import type { Goal } from '@/core/types'

interface Props {
	goal: Goal
	/** How many other goals are waiting on a question. */
	waiting: number
	onChoose: (optionId: string) => void
	onWriteIn: (text: string) => string | null
	onLater: () => void
}

const WRITE_IN_PROMPT: Record<string, string> = {
	split: 'Or write your own first step',
	next: 'Or write your own next step',
	specific: 'Or write the first thing you would do',
	measurable: 'Or describe what done looks like',
	minutes: 'Or write how long, like "20 minutes"',
	dueAt: 'Or write a day, like "Friday"',
	relevant: 'Or say why, in your own words',
}

/**
 * One question at a time, as a hand of cards. Arrow keys (or h and l) move between cards,
 * number keys pick one straight away, Enter or Space picks the focused card, and a tap or
 * click picks too. On a phone the hand scrolls sideways. Keys only work while the deck has
 * focus, so they never get in the way of typing elsewhere.
 */
export function ClarificationDeck({ goal, waiting, onChoose, onWriteIn, onLater }: Props) {
	const card = goal.card
	const [focused, setFocused] = useState(0)
	const [writeIn, setWriteIn] = useState('')
	const [problem, setProblem] = useState<string | null>(null)
	const buttons = useRef<(HTMLButtonElement | null)[]>([])
	const headingId = useId()
	const writeInId = useId()

	// biome-ignore lint/correctness/useExhaustiveDependencies: reset when a new question arrives
	useEffect(() => {
		setFocused(0)
		setWriteIn('')
		setProblem(null)
	}, [card?.id])

	if (!card) return null
	const count = card.options.length

	const move = (to: number) => {
		const next = (to + count) % count
		setFocused(next)
		buttons.current[next]?.focus()
		buttons.current[next]?.scrollIntoView({
			block: 'nearest',
			inline: 'center',
			behavior: 'smooth',
		})
	}

	const onKeyDown = (e: KeyboardEvent) => {
		if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === 'l') {
			e.preventDefault()
			move(focused + 1)
		} else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'h') {
			e.preventDefault()
			move(focused - 1)
		} else if (/^[1-9]$/.test(e.key)) {
			const option = card.options[Number(e.key) - 1]
			if (option) {
				e.preventDefault()
				onChoose(option.id)
			}
		}
	}

	const submitWriteIn = (e: React.FormEvent) => {
		e.preventDefault()
		if (!writeIn.trim()) return
		setProblem(onWriteIn(writeIn.trim()))
	}

	return (
		<section aria-labelledby={headingId} className="panel space-y-5 p-5 sm:p-7" data-testid="deck">
			<div className="flex items-start justify-between gap-4">
				<div>
					<p className="eyebrow">{goal.title}</p>
					<h2 id={headingId} className="mt-1 text-2xl font-bold">
						{card.question}
					</h2>
				</div>
				<button type="button" className="btn-ghost shrink-0 text-sm" onClick={onLater}>
					Not now
				</button>
			</div>

			<fieldset
				aria-labelledby={headingId}
				onKeyDown={onKeyDown}
				className="-mx-5 flex min-w-0 snap-x snap-mandatory gap-3 overflow-x-auto px-5 pt-3 pb-4 sm:mx-0 sm:grid sm:grid-cols-[repeat(auto-fit,minmax(9.5rem,1fr))] sm:overflow-visible sm:px-0"
			>
				{card.options.map((option, i) => {
					const tilt = (i - (count - 1) / 2) * 1.5
					return (
						<button
							key={option.id}
							ref={(el) => {
								buttons.current[i] = el
							}}
							type="button"
							aria-keyshortcuts={String(i + 1)}
							tabIndex={i === focused ? 0 : -1}
							onFocus={() => setFocused(i)}
							onClick={() => onChoose(option.id)}
							style={{ '--tilt': `${tilt}deg` } as React.CSSProperties}
							className="group relative flex min-h-36 w-44 shrink-0 snap-center flex-col justify-between rounded-2xl border-2 border-edge bg-paper p-4 text-left transition duration-300 ease-spring [transform:rotate(var(--tilt))] hover:-translate-y-2 hover:rotate-0 hover:border-sage hover:shadow-lg focus-visible:-translate-y-2 focus-visible:rotate-0 focus-visible:border-sage focus-visible:shadow-lg sm:w-auto"
						>
							<span
								aria-hidden="true"
								className="mb-3 inline-flex size-7 items-center justify-center rounded-full bg-sage-soft text-sm font-bold text-sage"
							>
								{i + 1}
							</span>
							<span className="font-bold leading-snug">{option.label}</span>
							{option.hint && <span className="mt-2 text-sm text-muted">{option.hint}</span>}
						</button>
					)
				})}
			</fieldset>

			<form onSubmit={submitWriteIn} className="flex flex-col gap-2 sm:flex-row">
				<label htmlFor={writeInId} className="sr-only">
					{WRITE_IN_PROMPT[card.about]}
				</label>
				<input
					id={writeInId}
					value={writeIn}
					onChange={(e) => {
						setWriteIn(e.target.value)
						setProblem(null)
					}}
					placeholder={WRITE_IN_PROMPT[card.about]}
					maxLength={200}
					className="min-h-11 flex-1 rounded-full border border-edge bg-paper px-4"
					aria-describedby={problem ? `${writeInId}-problem` : undefined}
				/>
				<button type="submit" className="btn-quiet" disabled={!writeIn.trim()}>
					Use this
				</button>
			</form>
			{problem && (
				<p id={`${writeInId}-problem`} role="alert" className="text-sm text-apricot">
					{problem}
				</p>
			)}

			<p className="text-sm text-muted">
				Tip: use the arrow keys and Enter, or press a number.
				{waiting > 0 &&
					` ${waiting} more ${waiting === 1 ? 'thing' : 'things'} to untangle after this.`}
			</p>
		</section>
	)
}
