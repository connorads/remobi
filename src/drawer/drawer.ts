import type { ControlButton, XTerminal } from '../types'
import { el } from '../util/dom'
import { haptic } from '../util/haptic'
import { conditionalFocus, isKeyboardOpen } from '../util/keyboard'
import { sendData } from '../util/terminal'

export interface DrawerResult {
	readonly backdrop: HTMLDivElement
	readonly drawer: HTMLDivElement
	readonly open: () => void
	readonly close: () => void
	readonly isOpen: () => boolean
}

/** Create the command drawer with backdrop */
export function createDrawer(term: XTerminal, buttons: readonly ControlButton[]): DrawerResult {
	const backdrop = el('div', { id: 'wt-backdrop' })
	const drawer = el('div', { id: 'wt-drawer' })
	const handle = el('div', { id: 'wt-drawer-handle' })
	const grid = el('div', { id: 'wt-drawer-grid' })

	drawer.appendChild(handle)
	drawer.appendChild(grid)

	let drawerOpen = false

	for (const buttonDef of buttons) {
		const button = el('button')
		button.textContent = buttonDef.label
		button.addEventListener('click', (e: Event) => {
			e.preventDefault()
			const kbWasOpen = isKeyboardOpen()
			haptic()
			close()

			switch (buttonDef.action.type) {
				case 'send':
					sendData(term, buttonDef.action.data)
					conditionalFocus(term, kbWasOpen)
					break
				case 'paste':
					if (navigator.clipboard && typeof navigator.clipboard.readText === 'function') {
						navigator.clipboard
							.readText()
							.then((text: string) => {
								if (text) sendData(term, text)
								conditionalFocus(term, kbWasOpen)
							})
							.catch(() => conditionalFocus(term, kbWasOpen))
					} else {
						conditionalFocus(term, kbWasOpen)
					}
					break
				case 'ctrl-modifier':
				case 'drawer-toggle':
					conditionalFocus(term, kbWasOpen)
					break
			}
		})
		grid.appendChild(button)
	}

	function open(): void {
		backdrop.style.display = 'block'
		drawer.classList.add('open')
		drawerOpen = true
	}

	function close(): void {
		drawer.classList.remove('open')
		backdrop.style.display = 'none'
		drawerOpen = false
	}

	function isOpen(): boolean {
		return drawerOpen
	}

	// Backdrop dismisses drawer
	backdrop.addEventListener('click', () => {
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
