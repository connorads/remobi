import type { ActionRegistry } from '../actions/registry'
import type { HookRegistry } from '../hooks/registry'
import type { ControlButton, WebmuxConfig, XTerminal } from '../types'
import { el } from '../util/dom'
import { haptic } from '../util/haptic'
import { conditionalFocus, isKeyboardOpen } from '../util/keyboard'
import { sendData } from '../util/terminal'

/**
 * Create the floating buttons container (top-left, always visible on touch devices).
 * Note: `ctrl-modifier` actions are not supported — no ctrlState is available,
 * so they silently no-op (focus only).
 */
export function createFloatingButtons(
	term: XTerminal,
	buttons: readonly ControlButton[],
	config: WebmuxConfig,
	hooks: HookRegistry,
	actions: ActionRegistry,
	openDrawer?: () => void,
): { element: HTMLDivElement } {
	const container = el('div', { id: 'wt-floating-buttons' })

	for (const def of buttons) {
		const button = el('button')
		button.textContent = def.label
		button.setAttribute('aria-label', def.description)

		button.addEventListener('click', (e: Event) => {
			e.preventDefault()
			const kbWasOpen = isKeyboardOpen()
			haptic()

			async function sendWithHooks(data: string): Promise<void> {
				const before = await hooks.runBeforeSendData({
					term,
					config,
					source: 'floating-buttons',
					actionType: def.action.type,
					kbWasOpen,
					data,
				})
				if (before.blocked) return

				sendData(term, before.data)
				await hooks.runAfterSendData({
					term,
					config,
					source: 'floating-buttons',
					actionType: def.action.type,
					kbWasOpen,
					data: before.data,
				})
			}

			void actions
				.execute(def.action, {
					term,
					kbWasOpen,
					focusIfNeeded: () => conditionalFocus(term, kbWasOpen),
					sendText: sendWithHooks,
					sendRawText: sendWithHooks,
					openDrawer,
				})
				.catch((error) => {
					console.error('webmux: floating button action failed', error)
					conditionalFocus(term, kbWasOpen)
				})
		})

		container.appendChild(button)
	}

	return { element: container }
}
