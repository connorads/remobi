import { describe, expect, test } from 'bun:test'
import { catppuccinMocha } from '../src/theme/catppuccin-mocha'
import type { TermTheme } from '../src/types'

describe('catppuccinMocha', () => {
	test('has all required colour fields', () => {
		const requiredKeys: Array<keyof TermTheme> = [
			'background',
			'foreground',
			'cursor',
			'cursorAccent',
			'selectionBackground',
			'black',
			'red',
			'green',
			'yellow',
			'blue',
			'magenta',
			'cyan',
			'white',
			'brightBlack',
			'brightRed',
			'brightGreen',
			'brightYellow',
			'brightBlue',
			'brightMagenta',
			'brightCyan',
			'brightWhite',
		]

		for (const key of requiredKeys) {
			expect(catppuccinMocha[key]).toBeDefined()
			expect(catppuccinMocha[key]).toMatch(/^#[0-9a-f]{6}$/i)
		}
	})

	test('background is mocha base', () => {
		expect(catppuccinMocha.background).toBe('#1e1e2e')
	})

	test('foreground is mocha text', () => {
		expect(catppuccinMocha.foreground).toBe('#cdd6f4')
	})

	test('blue is mocha blue', () => {
		expect(catppuccinMocha.blue).toBe('#89b4fa')
	})
})
