import { createDefaultActionRegistry } from '../actions/registry'
import type { ActionRegistry } from '../actions/registry'
import type { HookRegistry } from '../hooks/registry'
import type { ControlButton, RemobiConfig, XTerminal } from '../types'
import { el } from '../util/dom'
import { haptic } from '../util/haptic'
import { conditionalFocus, isKeyboardOpen } from '../util/keyboard'
import { onTap } from '../util/tap'
import { sendData } from '../util/terminal'

interface DrawerResult {
	readonly backdrop: HTMLDivElement
	readonly drawer: HTMLDivElement
	readonly open: () => void
	readonly close: () => void
	readonly isOpen: () => boolean
}

/** Create the command drawer with backdrop */
export function createDrawer(
	term: XTerminal,
	buttons: readonly ControlButton[],
	config: {
		readonly hooks: HookRegistry
		readonly appConfig: RemobiConfig
		readonly actions?: ActionRegistry
		readonly openComboPicker?: (options: {
			readonly sendText: (data: string) => Promise<void>
			readonly focusIfNeeded: () => void
		}) => void
	},
): DrawerResult {
	const actionRegistry = config.actions ?? createDefaultActionRegistry()
	const hooks = config.hooks
	const appConfig = config.appConfig
	const backdrop = el('div', { id: 'wt-backdrop' })
	const drawer = el('div', { id: 'wt-drawer' })
	const handle = el('div', { id: 'wt-drawer-handle' })
	const grid = el('div', { id: 'wt-drawer-grid' })

	drawer.appendChild(handle)
	drawer.appendChild(grid)

	let drawerOpen = false
	let justOpened = false

	for (const buttonDef of buttons) {
		const button = el('button')
		button.textContent = buttonDef.label
		onTap(button, () => {
			const kbWasOpen = isKeyboardOpen()
			haptic()
			close()

			async function sendWithHooks(data: string): Promise<void> {
				const before = await hooks.runBeforeSendData({
					term,
					config: appConfig,
					source: 'drawer',
					actionType: buttonDef.action.type,
					kbWasOpen,
					data,
				})
				if (before.blocked) return

				sendData(term, before.data)
				await hooks.runAfterSendData({
					term,
					config: appConfig,
					source: 'drawer',
					actionType: buttonDef.action.type,
					kbWasOpen,
					data: before.data,
				})
			}

			void actionRegistry
				.execute(buttonDef.action, {
					term,
					kbWasOpen,
					focusIfNeeded: () => conditionalFocus(term, kbWasOpen),
					sendText: sendWithHooks,
					sendRawText: sendWithHooks,
					openComboPicker: config.openComboPicker,
				})
				.catch((error) => {
					console.error('remobi: drawer action execution failed', error)
					conditionalFocus(term, kbWasOpen)
				})
		})
		grid.appendChild(button)
	}

	function open(): void {
		backdrop.style.display = 'block'
		drawer.classList.add('open')
		drawerOpen = true
		// Guard against synthesised click on backdrop. When onTap fires on
		// touchend (no preventDefault), the browser synthesises mousedown/click
		// ~4ms later at the same coordinates. By then the backdrop is visible
		// and intercepts the click, immediately closing the drawer.
		justOpened = true
		setTimeout(() => {
			justOpened = false
		}, 300)
	}

	function close(): void {
		drawer.classList.remove('open')
		backdrop.style.display = 'none'
		drawerOpen = false
	}

	function isOpen(): boolean {
		return drawerOpen
	}

	// Backdrop dismisses drawer. The click listener ignores the first click
	// after open() to avoid synthesised click from the triggering touch.
	// touchend is never synthesised, so it always works immediately.
	backdrop.addEventListener(
		'click',
		(e: Event) => {
			if (justOpened) {
				justOpened = false
				e.stopImmediatePropagation()
			}
		},
		{ capture: true },
	)

	onTap(backdrop, () => {
		const kbWasOpen = isKeyboardOpen()
		haptic()
		close()
		conditionalFocus(term, kbWasOpen)
	})

	// Swipe-to-dismiss on handle
	let handleStartY = 0

	handle.addEventListener(
		'touchstart',
		(e: TouchEvent) => {
			const touch = e.touches[0]
			if (touch) handleStartY = touch.clientY
		},
		{ passive: true },
	)

	handle.addEventListener(
		'touchmove',
		(e: TouchEvent) => {
			const touch = e.touches[0]
			if (!touch) return
			const dy = touch.clientY - handleStartY
			if (dy > 0) drawer.style.transform = `translateY(${dy}px)`
		},
		{ passive: true },
	)

	handle.addEventListener(
		'touchend',
		(e: TouchEvent) => {
			const touch = e.changedTouches[0]
			if (!touch) return
			const kbWasOpen = isKeyboardOpen()
			const dy = touch.clientY - handleStartY
			drawer.style.transform = ''
			if (dy > 60) {
				close()
				conditionalFocus(term, kbWasOpen)
			}
		},
		{ passive: true },
	)

	return { backdrop, drawer, open, close, isOpen }
}
