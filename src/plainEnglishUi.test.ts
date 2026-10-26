import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { findJargon } from '@/core/plainEnglish'

/** Every piece of text in the screens: JSX text and string literals with a space in them. */
function interfaceText(dir: string): { file: string; text: string }[] {
	return readdirSync(dir, { recursive: true, encoding: 'utf8' })
		.filter((f) => f.endsWith('.tsx') && !f.includes('test'))
		.flatMap((file) => {
			const source = readFileSync(join(dir, file), 'utf8')
				.split('\n')
				.filter((line) => !/^\s*(import|\/\/|\*|\/\*\*)/.test(line))
				.join('\n')
				// Template placeholders hold code, not words.
				.replace(/\$\{[^{}]*\}/g, ' ')
			const jsx = [...source.matchAll(/>([^<>{}]*[A-Za-z][^<>{}]*)</g)].map((m) => m[1] ?? '')
			const strings = [...source.matchAll(/(['"`])((?:(?!\1).)*\s(?:(?!\1).)*)\1/g)]
				.map((m) => m[2] ?? '')
				.filter((s) => !/^[\w-]+(?:\s[\w:[\]()&./%#-]+)*$/.test(s) || /[A-Z].*\s/.test(s))
			return [...jsx, ...strings].map((text) => ({ file, text: text.trim() }))
		})
		.filter(
			({ text }) => text.length > 0 && !text.includes('\n') && !/=>|&&|\?\?|\) : |\? \(/.test(text),
		)
}

describe('the plain-English rule', () => {
	it('holds for every screen', () => {
		const text = [...interfaceText('src/components'), ...interfaceText('src/routes')]
		expect(text.length).toBeGreaterThan(100)
		const broken = text.filter(({ text }) => findJargon(text).length > 0)
		expect(broken).toEqual([])
	})
})
