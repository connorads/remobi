import type { ActionRegistry } from '../actions/registry'
import type { HookRegistry } from '../hooks/registry'
import type { WebmuxConfig, XTerminal } from '../types'
import type { UIContributionCollector } from './ui-contributions'

export interface PluginContext {
	readonly term: XTerminal
	readonly config: WebmuxConfig
	readonly hooks: HookRegistry
	readonly actions: ActionRegistry
	readonly mobile: boolean
	/** Contribute buttons to toolbar rows or drawer slots */
	readonly ui: UIContributionCollector
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

/** Runtime check — plugins from dynamic imports may not match the interface */
function isValidPlugin(value: unknown, index: number): value is WebmuxPlugin {
	if (typeof value !== 'object' || value === null) {
		console.warn(`webmux: plugin[${index}] is not an object, skipping`)
		return false
	}
	if (!('name' in value) || typeof value.name !== 'string' || value.name.length === 0) {
		console.warn(`webmux: plugin[${index}] has no valid 'name', skipping`)
		return false
	}
	if (!('setup' in value) || typeof value.setup !== 'function') {
		console.warn(`webmux: plugin '${value.name}' has no 'setup' function, skipping`)
		return false
	}
	return true
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
			for (let i = 0; i < plugins.length; i++) {
				const plugin: unknown = plugins[i]
				if (!isValidPlugin(plugin, i)) continue
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
