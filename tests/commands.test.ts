import { describe, expect, test } from 'bun:test'
import { defaultDrawerCommands } from '../src/drawer/commands'

describe('defaultDrawerCommands', () => {
	test('has 14 commands', () => {
		expect(defaultDrawerCommands).toHaveLength(14)
	})

	test('all commands have label and seq', () => {
		for (const cmd of defaultDrawerCommands) {
			expect(cmd.label).toBeTruthy()
			expect(cmd.seq).toBeTruthy()
		}
	})

	test('all non-scroll command seqs start with tmux prefix (Ctrl-b)', () => {
		for (const cmd of defaultDrawerCommands) {
			if (cmd.label === 'PgUp' || cmd.label === 'PgDn') {
				// Scroll keys are app-level by default for better cross-app compatibility.
				expect(cmd.seq.startsWith('\x02')).toBe(false)
			} else {
				expect(cmd.seq.startsWith('\x02')).toBe(true)
			}
		}
	})

	test('includes window management commands', () => {
		const labels = defaultDrawerCommands.map((c) => c.label)
		expect(labels).toContain('+ Win')
		expect(labels).toContain('Split |')
		expect(labels).toContain('Zoom')
		expect(labels).toContain('Kill')
	})

	test('includes navigation commands', () => {
		const labels = defaultDrawerCommands.map((c) => c.label)
		expect(labels).toContain('Sessions')
		expect(labels).toContain('Windows')
	})

	test('includes scroll commands', () => {
		const labels = defaultDrawerCommands.map((c) => c.label)
		expect(labels).toContain('PgUp')
		expect(labels).toContain('PgDn')
	})
})
