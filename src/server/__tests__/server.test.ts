import { describe, expect, it } from 'vitest'
import { session } from '@/core/__tests__/helpers'
import type { NudgeEvent } from '@/core/types'
import { acceptBatch } from '../accept'
import { makePairCode, normalisePairCode } from '../pairCode'
import { memoryStore } from '../store'

const NOW = new Date(2025, 10, 5, 10)

describe('acceptBatch', () => {
	it('accepts what the core accepts', () => {
		const s = session()
		s.dump('call mum today')
		expect(acceptBatch([], s.events, NOW)).toEqual({ ok: true })
	})

	it('refuses an event that does not fit the journal', () => {
		const bad = { id: 'x', at: NOW.toISOString(), type: 'agreed', goalId: 'nope' } as NudgeEvent
		expect(acceptBatch([], [bad], NOW)).toMatchObject({ ok: false })
	})

	it('refuses events dated in the future, so a goal cannot be failed early', () => {
		const s = session(new Date(NOW.getTime() + 60 * 60 * 1000))
		s.dump('call mum today')
		expect(acceptBatch([], s.events, NOW)).toMatchObject({ ok: false, reason: /future/ })
	})

	it('refuses the same change twice', () => {
		const s = session()
		s.dump('call mum today')
		expect(acceptBatch(s.events, s.events, NOW)).toMatchObject({ ok: false })
	})
})

describe('memoryStore', () => {
	it('appends at a position and reports conflicts', async () => {
		const store = memoryStore()
		await store.createOwner('a')
		const s = session()
		s.dump('call mum today')
		expect(await store.append('a', 0, s.events)).toEqual({ ok: true, seq: 1 })
		expect(await store.append('a', 0, s.events)).toEqual({ ok: false, conflict: true })
		expect(await store.load('a')).toMatchObject({ seq: 1, events: s.events })
		expect((await store.load('a', 1)).events).toEqual([])
	})

	it('redeems a pairing code once, and not after it expires', async () => {
		const store = memoryStore()
		await store.createOwner('a')
		await store.savePairCode('fox-owl-42', 'a', new Date(NOW.getTime() + 60_000))
		expect(await store.redeemPairCode('fox-owl-42', NOW)).toBe('a')
		expect(await store.redeemPairCode('fox-owl-42', NOW)).toBeNull()
		await store.savePairCode('fox-owl-43', 'a', new Date(NOW.getTime() - 1))
		expect(await store.redeemPairCode('fox-owl-43', NOW)).toBeNull()
	})
})

describe('pairing codes', () => {
	it('are two words and a number, typed loosely', () => {
		expect(makePairCode()).toMatch(/^[a-z]+-[a-z]+-\d{2}$/)
		expect(normalisePairCode('  Fox Owl 42 ')).toBe('fox-owl-42')
	})
})
