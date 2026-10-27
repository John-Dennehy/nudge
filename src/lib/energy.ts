import { useEffect, useState } from 'react'
import type { Energy } from '@/core/types'

const KEY = 'nudge_energy'
const MAX_AGE_MS = 4 * 60 * 60 * 1000

/** Energy is a right-now thing, so it's kept on this device and forgotten after a few hours. */
export function useEnergy(): [Energy | null, (energy: Energy) => void] {
	const [energy, setEnergy] = useState<Energy | null>(null)
	useEffect(() => {
		try {
			const saved = JSON.parse(localStorage.getItem(KEY) ?? 'null') as {
				energy: Energy
				at: number
			} | null
			if (saved && Date.now() - saved.at < MAX_AGE_MS) setEnergy(saved.energy)
		} catch {}
	}, [])
	const choose = (next: Energy) => {
		setEnergy(next)
		try {
			localStorage.setItem(KEY, JSON.stringify({ energy: next, at: Date.now() }))
		} catch {}
	}
	return [energy, choose]
}
