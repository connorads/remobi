import type { ButtonAction, XTerminal } from '../types'

export interface ActionExecutionContext {
	readonly term: XTerminal
	readonly kbWasOpen: boolean
	readonly focusIfNeeded: () => void
	readonly sendText: (data: string) => Promise<void>
	readonly sendRawText?: (data: string) => Promise<void>
	readonly openDrawer?: () => void
	readonly openComboPicker?: (options: {
		readonly sendText: (data: string) => Promise<void>
		readonly focusIfNeeded: () => void
		readonly title?: string
		readonly description?: string
	}) => void
	readonly toggleCtrlModifier?: () => void
}

type ActionHandler = (action: ButtonAction, context: ActionExecutionContext) => void | Promise<void>

export interface ActionRegistry {
	register: (type: ButtonAction['type'], handler: ActionHandler) => void
	execute: (action: ButtonAction, context: ActionExecutionContext) => Promise<boolean>
}

export function createActionRegistry(): ActionRegistry {
	const handlers = new Map<ButtonAction['type'], ActionHandler>()
	let sendQueue: Promise<void> = Promise.resolve()

	function register(type: ButtonAction['type'], handler: ActionHandler): void {
		handlers.set(type, handler)
	}

	async function execute(action: ButtonAction, context: ActionExecutionContext): Promise<boolean> {
		const handler = handlers.get(action.type)
		if (!handler) return false

		if (action.type === 'send' || action.type === 'prefix') {
			const current = sendQueue.then(async () => {
				await handler(action, context)
			})
			sendQueue = current.catch(() => {})
			await current
			return true
		}

		if (action.type === 'paste') {
			await sendQueue
			await handler(action, context)
			return true
		}

		await handler(action, context)
		return true
	}

	return { register, execute }
}

/** Map a prefix byte to a human-readable label (e.g. '\x02' → 'Ctrl-B') */
function describePrefixByte(data: string): string | null {
	if (data.length !== 1) return null
	const code = data.charCodeAt(0)
	// Ctrl-A through Ctrl-Z → 0x01–0x1A
	if (code >= 1 && code <= 26) {
		return `Ctrl-${String.fromCharCode(code + 64)}`
	}
	return null
}

export function createDefaultActionRegistry(): ActionRegistry {
	const registry = createActionRegistry()
	let pasteQueue: Promise<void> = Promise.resolve()

	registry.register('send', (action, context) => {
		if (action.type !== 'send') return
		return context.sendText(action.data).then(() => context.focusIfNeeded())
	})

	registry.register('paste', (_action, context) => {
		if (!navigator.clipboard || typeof navigator.clipboard.readText !== 'function') {
			context.focusIfNeeded()
			return
		}

		const runPaste = async (): Promise<void> => {
			try {
				const text = await navigator.clipboard.readText()
				if (!text) return
				if (context.sendRawText) {
					await context.sendRawText(text)
					return
				}
				await context.sendText(text)
			} catch {
				// Clipboard access may fail due to permissions or browser constraints.
				// Keep behaviour fail-safe and restore focus without surfacing runtime errors.
			} finally {
				context.focusIfNeeded()
			}
		}

		const current = pasteQueue.then(runPaste)
		pasteQueue = current.catch(() => {})
		return current
	})

	registry.register('ctrl-modifier', (_action, context) => {
		if (context.toggleCtrlModifier) {
			context.toggleCtrlModifier()
		} else {
			context.focusIfNeeded()
		}
	})

	registry.register('drawer-toggle', (_action, context) => {
		if (context.openDrawer) {
			context.openDrawer()
		} else {
			context.focusIfNeeded()
		}
	})

	registry.register('prefix', async (action, context) => {
		if (action.type !== 'prefix') return
		await context.sendText(action.data)
		if (context.openComboPicker) {
			const prefixLabel = describePrefixByte(action.data)
			context.openComboPicker({
				title: `Prefix sent${prefixLabel ? ` (${prefixLabel})` : ''} — type follow-up`,
				description:
					'A letter like r (reload config) or c (new window). ' + 'C-x = Ctrl+x, M-x = Alt+x',
				sendText: async (data: string) => {
					await registry.execute(
						{ type: 'send', data },
						{ ...context, sendText: context.sendRawText ?? context.sendText },
					)
				},
				focusIfNeeded: context.focusIfNeeded,
			})
		} else {
			context.focusIfNeeded()
		}
	})

	registry.register('combo-picker', (_action, context) => {
		if (context.openComboPicker) {
			context.openComboPicker({
				sendText: async (data: string) => {
					await registry.execute(
						{ type: 'send', data },
						{
							...context,
							sendText: context.sendRawText ?? context.sendText,
						},
					)
				},
				focusIfNeeded: context.focusIfNeeded,
			})
		} else {
			context.focusIfNeeded()
		}
	})

	return registry
}
