import { describe, expect, test } from 'vitest'
import { defaultConfig } from '../src/config'
import { buildTtydArgs, randomInternalPort } from '../src/serve'

describe('randomInternalPort', () => {
	test('returns a number in the 19000–19999 range', () => {
		for (let i = 0; i < 50; i++) {
			const port = randomInternalPort()
			expect(port).toBeGreaterThanOrEqual(19000)
			expect(port).toBeLessThan(20000)
		}
	})

	test('returns an integer', () => {
		const port = randomInternalPort()
		expect(Number.isInteger(port)).toBe(true)
	})
})

describe('buildTtydArgs', () => {
	test('includes --writable and binds to 127.0.0.1', () => {
		const args = buildTtydArgs(defaultConfig, 19500, ['tmux'])
		expect(args).toContain('--writable')
		expect(args).toContain('-i')
		expect(args).toContain('127.0.0.1')
	})

	test('sets the internal port', () => {
		const args = buildTtydArgs(defaultConfig, 19123, ['tmux'])
		const portIdx = args.indexOf('--port')
		expect(portIdx).toBeGreaterThan(-1)
		expect(args[portIdx + 1]).toBe('19123')
	})

	test('includes theme as JSON', () => {
		const args = buildTtydArgs(defaultConfig, 19500, ['tmux'])
		const themeArg = args.find((a) => a.startsWith('theme='))
		expect(themeArg).toBeDefined()
		expect(themeArg).toContain(defaultConfig.theme.background)
	})

	test('includes font family', () => {
		const args = buildTtydArgs(defaultConfig, 19500, ['tmux'])
		const fontArg = args.find((a) => a.startsWith('fontFamily='))
		expect(fontArg).toBeDefined()
		expect(fontArg).toContain(defaultConfig.font.family)
	})

	test('appends the command at the end', () => {
		const command = ['tmux', 'new-session', '-A', '-s', 'main']
		const args = buildTtydArgs(defaultConfig, 19500, command)
		const tail = args.slice(-command.length)
		expect(tail).toEqual(command)
	})

	test('includes disableLeaveAlert', () => {
		const args = buildTtydArgs(defaultConfig, 19500, ['tmux'])
		expect(args).toContain('disableLeaveAlert=true')
	})
})
