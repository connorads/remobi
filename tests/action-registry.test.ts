import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { GlobalRegistrator } from '@happy-dom/global-registrator'
import { createActionRegistry, createDefaultActionRegistry } from '../src/actions/registry'
import type { ButtonAction } from '../src/types'
import { mockTerminal } from './fixtures'

beforeEach(() => {
	GlobalRegistrator.register()
})

afterEach(() => {
	GlobalRegistrator.unregister()
})

describe('createActionRegistry', () => {
	test('returns false for unregistered action', async () => {
		const registry = createActionRegistry()
		const executed = await registry.execute(
			{ type: 'send', data: 'x' },
			{
				term: mockTerminal(),
				kbWasOpen: false,
				focusIfNeeded() {},
				async sendText(_data: string) {},
			},
		)
		expect(executed).toBe(false)
	})

	test('runs registered handler', async () => {
		const registry = createActionRegistry()
		let handled = false
		registry.register('send', () => {
			handled = true
		})

		const executed = await registry.execute(
			{ type: 'send', data: 'x' },
			{
				term: mockTerminal(),
				kbWasOpen: false,
				focusIfNeeded() {},
				async sendText(_data: string) {},
			},
		)

		expect(executed).toBe(true)
		expect(handled).toBe(true)
	})

	test('serialises execution order for async handlers', async () => {
		const registry = createActionRegistry()
		const sent: string[] = []

		registry.register('send', async (action, context) => {
			if (action.type !== 'send') return
			if (action.data === 'q') {
				await new Promise((resolve) => setTimeout(resolve, 10))
			}
			await context.sendText(action.data)
		})

		const context = {
			term: mockTerminal(),
			kbWasOpen: false,
			focusIfNeeded() {},
			async sendText(data: string) {
				sent.push(data)
			},
		}

		const first = registry.execute({ type: 'send', data: 'q' }, context)
		const second = registry.execute({ type: 'send', data: ' ' }, context)
		await Promise.all([first, second])

		expect(sent).toEqual(['q', ' '])
	})

	test('non-send actions do not block send actions', async () => {
		const registry = createDefaultActionRegistry()
		const sent: string[] = []
		let resolveClipboard: ((value: string) => void) | undefined

		Object.defineProperty(navigator, 'clipboard', {
			value: {
				readText: () =>
					new Promise<string>((resolve) => {
						resolveClipboard = resolve
					}),
			},
			configurable: true,
		})

		const context = {
			term: mockTerminal(),
			kbWasOpen: false,
			focusIfNeeded() {},
			async sendText(data: string) {
				sent.push(data)
			},
		}

		const pastePromise = registry.execute({ type: 'paste' }, context)
		await registry.execute({ type: 'send', data: 'q' }, context)

		expect(sent).toEqual(['q'])
		if (resolveClipboard) {
			resolveClipboard('abc')
		}
		await pastePromise
		expect(sent).toEqual(['q', 'abc'])
	})

	test('preserves click order when send is delayed and paste follows', async () => {
		const registry = createDefaultActionRegistry()
		const sent: string[] = []

		Object.defineProperty(navigator, 'clipboard', {
			value: {
				readText: async () => 'abc',
			},
			configurable: true,
		})

		const context = {
			term: mockTerminal(),
			kbWasOpen: false,
			focusIfNeeded() {},
			async sendText(data: string) {
				if (data === 'q') {
					await new Promise((resolve) => setTimeout(resolve, 10))
				}
				sent.push(data)
			},
			async sendRawText(data: string) {
				sent.push(data)
			},
		}

		const first = registry.execute({ type: 'send', data: 'q' }, context)
		const second = registry.execute({ type: 'paste' }, context)
		await Promise.all([first, second])

		expect(sent).toEqual(['q', 'abc'])
	})

	test('preserves order for consecutive paste actions', async () => {
		const registry = createDefaultActionRegistry()
		const sent: string[] = []
		const pending: Array<(value: string) => void> = []

		Object.defineProperty(navigator, 'clipboard', {
			value: {
				readText: () =>
					new Promise<string>((resolve) => {
						pending.push(resolve)
					}),
			},
			configurable: true,
		})

		const context = {
			term: mockTerminal(),
			kbWasOpen: false,
			focusIfNeeded() {},
			async sendText(data: string) {
				sent.push(data)
			},
		}

		const first = registry.execute({ type: 'paste' }, context)
		const second = registry.execute({ type: 'paste' }, context)
		for (let attempt = 0; attempt < 5 && pending.length < 2; attempt++) {
			await new Promise((resolve) => setTimeout(resolve, 0))
		}

		const firstResolver = pending[0]
		if (firstResolver) firstResolver('first')
		await new Promise((resolve) => setTimeout(resolve, 0))

		const secondResolver = pending[1]
		if (secondResolver) secondResolver('second')
		await Promise.all([first, second])

		expect(sent).toEqual(['first', 'second'])
	})

	test('paste execute resolves after clipboard send completes', async () => {
		const registry = createDefaultActionRegistry()
		let resolveClipboard: ((value: string) => void) | undefined
		let sent = ''

		Object.defineProperty(navigator, 'clipboard', {
			value: {
				readText: () =>
					new Promise<string>((resolve) => {
						resolveClipboard = resolve
					}),
			},
			configurable: true,
		})

		const context = {
			term: mockTerminal(),
			kbWasOpen: false,
			focusIfNeeded() {},
			async sendText(data: string) {
				sent = data
			},
		}

		let done = false
		const pastePromise = registry.execute({ type: 'paste' }, context).then(() => {
			done = true
		})

		await new Promise((resolve) => setTimeout(resolve, 0))
		expect(done).toBe(false)
		const resolver = resolveClipboard
		if (resolver) {
			resolver('abc')
		}
		await pastePromise
		expect(done).toBe(true)
		expect(sent).toBe('abc')
	})
})

describe('createDefaultActionRegistry', () => {
	test('send action forwards data then focuses', async () => {
		const registry = createDefaultActionRegistry()
		const sent: string[] = []
		let focused = false
		const action: ButtonAction = { type: 'send', data: 'abc' }

		await registry.execute(action, {
			term: mockTerminal(),
			kbWasOpen: true,
			focusIfNeeded() {
				focused = true
			},
			async sendText(data: string) {
				sent.push(data)
			},
		})

		expect(sent).toEqual(['abc'])
		expect(focused).toBe(true)
	})

	test('drawer-toggle calls openDrawer when available', async () => {
		const registry = createDefaultActionRegistry()
		let opened = false

		await registry.execute(
			{ type: 'drawer-toggle' },
			{
				term: mockTerminal(),
				kbWasOpen: false,
				focusIfNeeded() {},
				async sendText(_data: string) {},
				openDrawer() {
					opened = true
				},
			},
		)

		expect(opened).toBe(true)
	})

	test('ctrl-modifier falls back to focus when toggle unavailable', async () => {
		const registry = createDefaultActionRegistry()
		let focused = false

		await registry.execute(
			{ type: 'ctrl-modifier' },
			{
				term: mockTerminal(),
				kbWasOpen: false,
				focusIfNeeded() {
					focused = true
				},
				async sendText(_data: string) {},
			},
		)

		expect(focused).toBe(true)
	})

	test('paste action swallows clipboard errors and restores focus', async () => {
		const registry = createDefaultActionRegistry()
		let focused = false
		let sent = false

		Object.defineProperty(navigator, 'clipboard', {
			value: {
				readText: async () => {
					throw new Error('Permission denied')
				},
			},
			configurable: true,
		})

		await expect(
			registry.execute(
				{ type: 'paste' },
				{
					term: mockTerminal(),
					kbWasOpen: true,
					focusIfNeeded() {
						focused = true
					},
					async sendText(_data: string) {
						sent = true
					},
				},
			),
		).resolves.toBe(true)

		expect(focused).toBe(true)
		expect(sent).toBe(false)
	})

	test('combo-picker opens picker with raw sender when available', async () => {
		const registry = createDefaultActionRegistry()
		let opened = false
		let sent = ''

		await registry.execute(
			{ type: 'combo-picker' },
			{
				term: mockTerminal(),
				kbWasOpen: false,
				focusIfNeeded() {},
				async sendText(data: string) {
					sent = `normal:${data}`
				},
				async sendRawText(data: string) {
					sent = `raw:${data}`
				},
				openComboPicker(options) {
					opened = true
					void options.sendText('abc')
				},
			},
		)

		expect(opened).toBe(true)
		expect(sent).toBe('raw:abc')
	})

	test('combo-picker falls back to focus when picker unavailable', async () => {
		const registry = createDefaultActionRegistry()
		let focused = false

		await registry.execute(
			{ type: 'combo-picker' },
			{
				term: mockTerminal(),
				kbWasOpen: false,
				focusIfNeeded() {
					focused = true
				},
				async sendText(_data: string) {},
			},
		)

		expect(focused).toBe(true)
	})

	test('combo-picker queued sends preserve existing send order', async () => {
		const registry = createDefaultActionRegistry()
		const sent: string[] = []
		let comboPromise: Promise<void> | null = null

		const context = {
			term: mockTerminal(),
			kbWasOpen: false,
			focusIfNeeded() {},
			async sendText(data: string) {
				if (data === 'q') {
					await new Promise((resolve) => setTimeout(resolve, 10))
				}
				sent.push(data)
			},
			openComboPicker(options: { sendText: (data: string) => Promise<void> }) {
				comboPromise = options.sendText('x')
			},
		}

		const first = registry.execute({ type: 'send', data: 'q' }, context)
		await registry.execute({ type: 'combo-picker' }, context)
		if (comboPromise) {
			await comboPromise
		}
		await first

		expect(sent).toEqual(['q', 'x'])
	})
})
