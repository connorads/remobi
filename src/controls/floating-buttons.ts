import type { ActionRegistry } from '../actions/registry'
import type { HookRegistry } from '../hooks/registry'
import type { ControlButton, FloatingButtonGroup, RemobiConfig, XTerminal } from '../types'
import { el } from '../util/dom'
import { haptic } from '../util/haptic'
import { conditionalFocus, isKeyboardOpen } from '../util/keyboard'
import { sendData } from '../util/terminal'

function createGroupButton(
	term: XTerminal,
	def: ControlButton,
	config: RemobiConfig,
	hooks: HookRegistry,
	actions: ActionRegistry,
	openDrawer: (() => void) | undefined,
	openComboPicker:
		| ((options: {
				readonly sendText: (data: string) => Promise<void>
				readonly focusIfNeeded: () => void
		  }) => void)
		| undefined,
): HTMLButtonElement {
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
				openComboPicker,
			})
			.catch((error) => {
				console.error('remobi: floating button action failed', error)
				conditionalFocus(term, kbWasOpen)
			})
	})

	return button
}

/**
 * Create one container element per floating button group.
 * Each group is positioned via CSS classes (`wt-floating-group`, `wt-floating-${position}`)
 * and rendered as a row or column depending on `direction` (default: row).
 */
export function createFloatingButtons(
	term: XTerminal,
	groups: readonly FloatingButtonGroup[],
	config: RemobiConfig,
	hooks: HookRegistry,
	actions: ActionRegistry,
	openDrawer?: () => void,
	openComboPicker?: (options: {
		readonly sendText: (data: string) => Promise<void>
		readonly focusIfNeeded: () => void
	}) => void,
): { elements: HTMLDivElement[] } {
	const elements: HTMLDivElement[] = []

	for (const group of groups) {
		const container = el('div', {
			class: `wt-floating-group wt-floating-${group.position}${group.direction === 'column' ? ' wt-floating-column' : ''}`,
		})

		for (const def of group.buttons) {
			container.appendChild(
				createGroupButton(term, def, config, hooks, actions, openDrawer, openComboPicker),
			)
		}

		elements.push(container)
	}

	return { elements }
}
