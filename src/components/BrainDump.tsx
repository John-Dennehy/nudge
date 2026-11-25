import { type FormEvent, useId, useState } from 'react'

interface Props {
	onDump: (text: string) => Promise<void>
	ai: boolean
	/** Shown big and first when the list is empty. */
	first: boolean
}

export function BrainDump({ onDump, ai, first }: Props) {
	const [text, setText] = useState('')
	const [busy, setBusy] = useState(false)
	const id = useId()

	const submit = async (e?: FormEvent) => {
		e?.preventDefault()
		if (!text.trim() || busy) return
		setBusy(true)
		try {
			await onDump(text.trim())
			setText('')
		} finally {
			setBusy(false)
		}
	}

	return (
		<form onSubmit={submit} className="panel space-y-3 p-5 sm:p-6">
			<label
				htmlFor={id}
				className={first ? 'block font-display text-2xl font-bold' : 'eyebrow block'}
			>
				{first ? "What's on your mind?" : 'Anything else on your mind?'}
			</label>
			<textarea
				id={id}
				value={text}
				onChange={(e) => setText(e.target.value)}
				onKeyDown={(e) => {
					if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) void submit()
				}}
				rows={first ? 5 : 2}
				maxLength={4000}
				placeholder="Call the dentist, sort out my taxes by the end of the month, reply to Sam…"
				className="w-full resize-y rounded-2xl border border-edge bg-paper p-4 text-lg leading-relaxed"
			/>
			<div className="flex flex-wrap items-center justify-between gap-3">
				<p className="text-sm text-muted">
					{ai
						? 'To help untangle it, what you write is sent to Google’s Gemini AI. Nothing else is shared.'
						: 'Untangled right here, by Nudge’s own rules. Nothing is sent to an AI.'}
				</p>
				<button type="submit" className="btn-primary" disabled={!text.trim() || busy}>
					{busy ? 'Untangling…' : 'Untangle it'}
				</button>
			</div>
		</form>
	)
}
