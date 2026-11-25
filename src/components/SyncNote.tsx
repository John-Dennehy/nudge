import type { SyncStatus } from '@/lib/useJournal'

const TEXT: Record<SyncStatus, string> = {
	loading: 'Opening your list…',
	saved: 'Saved',
	saving: 'Saving…',
	offline: 'Offline. Changes are kept on this device and saved when you’re back.',
	problem: 'One change couldn’t be saved, so it was left out.',
}

export function SyncNote({ status }: { status: SyncStatus }) {
	return (
		<p role="status" aria-live="polite" className="text-right text-sm text-muted">
			{TEXT[status]}
		</p>
	)
}
