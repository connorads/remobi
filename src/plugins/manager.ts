import type { ActionRegistry } from '../actions/registry'
import type { HookRegistry } from '../hooks/registry'
import type { WebmuxConfig, XTerminal } from '../types'

export interface PluginContext {
	readonly term: XTerminal
	readonly config: WebmuxConfig
	readonly hooks: HookRegistry
	readonly actions: ActionRegistry
	readonly mobile: boolean
}

export interface WebmuxPlugin {
	readonly name: string
	setup: (context: PluginContext) => void | Promise<void>
	dispose?: () => void | Promise<void>
}

export interface PluginManager {
	init: (context: PluginContext) => Promise<void>
	dispose: () => Promise<void>
}

function logPluginError(phase: 'setup' | 'dispose', name: string, error: unknown): void {
	console.error(`webmux: plugin '${name}' ${phase} failed`, error)
}

export function createPluginManager(plugins: readonly WebmuxPlugin[]): PluginManager {
	const disposers: Array<{ readonly name: string; readonly dispose: () => void | Promise<void> }> =
		[]
	let initPromise: Promise<void> | null = null
	let disposeRequested = false
	let disposePromise: Promise<void> | null = null

	async function init(context: PluginContext): Promise<void> {
		disposeRequested = false
		const run = async (): Promise<void> => {
			for (const plugin of plugins) {
				if (disposeRequested) break
				if (plugin.dispose) {
					disposers.push({ name: plugin.name, dispose: plugin.dispose })
				}
				try {
					await plugin.setup(context)
				} catch (error) {
					logPluginError('setup', plugin.name, error)
				}
			}
		}

		initPromise = run()
		try {
			await initPromise
		} finally {
			initPromise = null
		}
	}

	async function dispose(): Promise<void> {
		if (disposePromise) {
			return disposePromise
		}

		disposeRequested = true
		disposePromise = (async () => {
			if (initPromise) {
				await initPromise
			}

			for (let index = disposers.length - 1; index >= 0; index--) {
				const disposer = disposers[index]
				if (!disposer) continue
				try {
					await disposer.dispose()
				} catch (error) {
					logPluginError('dispose', disposer.name, error)
				}
			}
			disposers.length = 0
		})()

		try {
			await disposePromise
		} finally {
			disposePromise = null
		}
	}

	return { init, dispose }
}
