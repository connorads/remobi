import { describe, expect, test } from 'vitest'
import { defaultConfig } from '../src/config'
import { createHookRegistry } from '../src/hooks/registry'
import { mockTerminal } from './fixtures'

describe('hook registry', () => {
	test('runs beforeSend hooks in registration order', async () => {
		const hooks = createHookRegistry()
		const order: string[] = []

		hooks.on('beforeSendData', (context) => {
			order.push(`a:${context.data}`)
			return { data: `${context.data}-a` }
		})
		hooks.on('beforeSendData', (context) => {
			order.push(`b:${context.data}`)
			return { data: `${context.data}-b` }
		})

		const result = await hooks.runBeforeSendData({
			term: mockTerminal(),
			config: defaultConfig,
			source: 'toolbar',
			actionType: 'send',
			kbWasOpen: false,
			data: 'x',
		})

		expect(order).toEqual(['a:x', 'b:x-a'])
		expect(result.blocked).toBe(false)
		expect(result.data).toBe('x-a-b')
	})

	test('supports blocking in beforeSendData', async () => {
		const hooks = createHookRegistry()
		hooks.on('beforeSendData', () => ({ block: true }))

		const result = await hooks.runBeforeSendData({
			term: mockTerminal(),
			config: defaultConfig,
			source: 'drawer',
			actionType: 'paste',
			kbWasOpen: true,
			data: 'blocked',
		})

		expect(result.blocked).toBe(true)
		expect(result.data).toBe('blocked')
	})

	test('accepts mobile-init and floating-buttons as sources', async () => {
		const hooks = createHookRegistry()
		const sources: string[] = []
		hooks.on('beforeSendData', (ctx) => {
			sources.push(ctx.source)
			return undefined
		})

		await hooks.runBeforeSendData({
			term: mockTerminal(),
			config: defaultConfig,
			source: 'mobile-init',
			actionType: 'send',
			kbWasOpen: false,
			data: '\x02z',
		})
		await hooks.runBeforeSendData({
			term: mockTerminal(),
			config: defaultConfig,
			source: 'floating-buttons',
			actionType: 'send',
			kbWasOpen: false,
			data: '\x02z',
		})

		expect(sources).toEqual(['mobile-init', 'floating-buttons'])
	})

	test('isolates hook errors and continues execution', async () => {
		const hooks = createHookRegistry()
		const calls: string[] = []
		let logged = false

		const originalError = console.error
		console.error = () => {
			logged = true
		}

		hooks.on('beforeSendData', () => {
			throw new Error('boom')
		})
		hooks.on('beforeSendData', (context) => {
			calls.push(context.data)
			return { data: `${context.data}-ok` }
		})

		try {
			const result = await hooks.runBeforeSendData({
				term: mockTerminal(),
				config: defaultConfig,
				source: 'toolbar',
				actionType: 'send',
				kbWasOpen: false,
				data: 'x',
			})

			expect(logged).toBe(true)
			expect(calls).toEqual(['x'])
			expect(result.data).toBe('x-ok')
		} finally {
			console.error = originalError
		}
	})
})
