import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { createActionRegistry } from '../src/actions/registry'
import { defaultConfig } from '../src/config'
import { createHookRegistry } from '../src/hooks/registry'
import { type WebmuxPlugin, createPluginManager } from '../src/plugins/manager'
import { createUIContributionCollector } from '../src/plugins/ui-contributions'
import type { XTerminal } from '../src/types'

function mockTerminal(): XTerminal {
	return {
		options: { fontSize: 14 },
		input(_data: string, _wasUserInput: boolean) {},
		focus() {},
		onData(_handler: (data: string) => void) {
			return { dispose() {} }
		},
	}
}

describe('createPluginManager', () => {
	test('runs plugin setup in order', async () => {
		const order: string[] = []
		const manager = createPluginManager([
			{
				name: 'one',
				setup() {
					order.push('one')
				},
			},
			{
				name: 'two',
				setup() {
					order.push('two')
				},
			},
		])

		await manager.init({
			term: mockTerminal(),
			config: defaultConfig,
			hooks: createHookRegistry(),
			actions: createActionRegistry(),
			ui: createUIContributionCollector(),
			mobile: true,
		})

		expect(order).toEqual(['one', 'two'])
	})

	test('continues setup after plugin failure', async () => {
		let secondRan = false
		let logged = false
		const originalError = console.error
		console.error = () => {
			logged = true
		}

		const manager = createPluginManager([
			{
				name: 'broken',
				setup() {
					throw new Error('fail')
				},
			},
			{
				name: 'ok',
				setup() {
					secondRan = true
				},
			},
		])

		try {
			await manager.init({
				term: mockTerminal(),
				config: defaultConfig,
				hooks: createHookRegistry(),
				actions: createActionRegistry(),
				ui: createUIContributionCollector(),
				mobile: false,
			})

			expect(secondRan).toBe(true)
			expect(logged).toBe(true)
		} finally {
			console.error = originalError
		}
	})

	test('runs disposer even when setup throws', async () => {
		let disposed = false
		const originalError = console.error
		console.error = () => {}
		const manager = createPluginManager([
			{
				name: 'partial',
				setup() {
					throw new Error('setup failed after side effects')
				},
				dispose() {
					disposed = true
				},
			},
		])

		try {
			await manager.init({
				term: mockTerminal(),
				config: defaultConfig,
				hooks: createHookRegistry(),
				actions: createActionRegistry(),
				ui: createUIContributionCollector(),
				mobile: true,
			})
			await manager.dispose()

			expect(disposed).toBe(true)
		} finally {
			console.error = originalError
		}
	})

	test('disposes plugins in reverse order', async () => {
		const order: string[] = []
		const manager = createPluginManager([
			{
				name: 'first',
				setup() {},
				dispose() {
					order.push('first')
				},
			},
			{
				name: 'second',
				setup() {},
				dispose() {
					order.push('second')
				},
			},
		])

		await manager.init({
			term: mockTerminal(),
			config: defaultConfig,
			hooks: createHookRegistry(),
			actions: createActionRegistry(),
			ui: createUIContributionCollector(),
			mobile: true,
		})
		await manager.dispose()

		expect(order).toEqual(['second', 'first'])
	})

	test('waits for in-flight setup before disposing', async () => {
		const order: string[] = []
		let releaseSetup: (() => void) | undefined

		const manager = createPluginManager([
			{
				name: 'slow',
				async setup() {
					order.push('setup-start')
					await new Promise<void>((resolve) => {
						releaseSetup = resolve
					})
					order.push('setup-end')
				},
				dispose() {
					order.push('dispose')
				},
			},
		])

		const initPromise = manager.init({
			term: mockTerminal(),
			config: defaultConfig,
			hooks: createHookRegistry(),
			actions: createActionRegistry(),
			ui: createUIContributionCollector(),
			mobile: true,
		})

		await new Promise((resolve) => setTimeout(resolve, 0))
		const disposePromise = manager.dispose()

		if (releaseSetup) {
			releaseSetup()
		}

		await initPromise
		await disposePromise
		expect(order).toEqual(['setup-start', 'setup-end', 'dispose'])
	})

	test('does not run disposer twice on concurrent dispose calls', async () => {
		let disposeCount = 0
		let releaseDispose: (() => void) | undefined

		const manager = createPluginManager([
			{
				name: 'slow-dispose',
				setup() {},
				async dispose() {
					disposeCount += 1
					await new Promise<void>((resolve) => {
						releaseDispose = resolve
					})
				},
			},
		])

		await manager.init({
			term: mockTerminal(),
			config: defaultConfig,
			hooks: createHookRegistry(),
			actions: createActionRegistry(),
			ui: createUIContributionCollector(),
			mobile: true,
		})

		const first = manager.dispose()
		const second = manager.dispose()
		if (releaseDispose) {
			releaseDispose()
		}
		await Promise.all([first, second])

		expect(disposeCount).toBe(1)
	})

	describe('plugin validation', () => {
		let warnings: string[]
		const originalWarn = console.warn

		beforeEach(() => {
			warnings = []
			console.warn = (...args: unknown[]) => {
				warnings.push(args.map(String).join(' '))
			}
		})

		afterEach(() => {
			console.warn = originalWarn
		})

		function makeContext() {
			return {
				term: mockTerminal(),
				config: defaultConfig,
				hooks: createHookRegistry(),
				actions: createActionRegistry(),
				ui: createUIContributionCollector(),
				mobile: false,
			}
		}

		test('skips plugin with missing name', async () => {
			let ran = false
			const manager = createPluginManager([
				{
					setup() {
						ran = true
					},
				} as unknown as WebmuxPlugin,
			])
			await manager.init(makeContext())
			expect(ran).toBe(false)
			expect(warnings.some((w) => w.includes("no valid 'name'"))).toBe(true)
		})

		test('skips plugin with missing setup', async () => {
			const manager = createPluginManager([{ name: 'bad' } as unknown as WebmuxPlugin])
			await manager.init(makeContext())
			expect(warnings.some((w) => w.includes("no 'setup' function"))).toBe(true)
		})

		test('skips null plugin entry', async () => {
			const manager = createPluginManager([null as unknown as WebmuxPlugin])
			await manager.init(makeContext())
			expect(warnings.some((w) => w.includes('not an object'))).toBe(true)
		})
	})
})
