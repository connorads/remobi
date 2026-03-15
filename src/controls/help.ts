import type { ControlButton, FloatingButtonGroup, MuxiConfig, XTerminal } from '../types'
import { el } from '../util/dom'
import { haptic } from '../util/haptic'
import { conditionalFocus, isKeyboardOpen } from '../util/keyboard'

/** Create a table row with two cells — textContent auto-escapes */
function row(left: string, right: string): HTMLTableRowElement {
	return el('tr', {}, el('td', {}, left), el('td', {}, right))
}

function renderButtonTable(title: string, buttons: readonly ControlButton[]): DocumentFragment {
	const frag = document.createDocumentFragment()
	frag.appendChild(el('h2', {}, title))
	const table = el('table')
	for (const button of buttons) {
		table.appendChild(
			row(button.label || button.id || 'Unnamed', button.description || 'No description'),
		)
	}
	frag.appendChild(table)
	return frag
}

function renderGestures(config: MuxiConfig): DocumentFragment {
	const frag = document.createDocumentFragment()
	frag.appendChild(el('h2', {}, 'Gestures'))
	const table = el('table')

	if (config.gestures.swipe.enabled) {
		table.appendChild(row('Swipe right', config.gestures.swipe.rightLabel))
		table.appendChild(row('Swipe left', config.gestures.swipe.leftLabel))
	}

	if (config.gestures.pinch.enabled) {
		table.appendChild(row('Pinch in/out', 'Decrease/increase font size'))
	}

	if (config.gestures.scroll.enabled) {
		if (config.gestures.scroll.strategy === 'wheel') {
			table.appendChild(row('Finger drag', 'Send wheel scroll events to terminal apps'))
			table.appendChild(row('Side \u25B2 \u25BC', 'Send wheel-up / wheel-down at terminal centre'))
		} else {
			table.appendChild(row('Finger drag', 'Send PageUp / PageDown keys'))
			table.appendChild(row('Side \u25B2 \u25BC', 'Send PageUp / PageDown keys'))
		}
	}

	if (table.rows.length === 0) {
		table.appendChild(row('None', 'All gestures are disabled in config'))
	}

	frag.appendChild(table)
	return frag
}

/** Build the help overlay content as a DocumentFragment — no innerHTML */
function buildHelpContent(config: MuxiConfig): DocumentFragment {
	const topRightButtons: readonly ControlButton[] = [
		{
			id: 'font-size',
			label: '\u2212 / +',
			description: 'Decrease / increase font size',
			action: { type: 'send', data: '' },
		},
		{
			id: 'help',
			label: '?',
			description: 'Open this help screen',
			action: { type: 'send', data: '' },
		},
	]

	const frag = document.createDocumentFragment()

	const closeBtn = el('button', { class: 'wt-help-close' }, '\u00D7')
	frag.appendChild(closeBtn)

	frag.appendChild(renderButtonTable('Toolbar \u2014 Row 1', config.toolbar.row1))
	frag.appendChild(renderButtonTable('Toolbar \u2014 Row 2', config.toolbar.row2))
	frag.appendChild(renderButtonTable('Drawer Buttons', config.drawer.buttons))
	frag.appendChild(renderGestures(config))
	frag.appendChild(renderButtonTable('Top-Right Controls', topRightButtons))

	if (config.floatingButtons.length > 0) {
		const groups: readonly FloatingButtonGroup[] = config.floatingButtons
		if (groups.length === 1 && groups[0] !== undefined) {
			frag.appendChild(renderButtonTable('Floating Buttons', groups[0].buttons))
		} else {
			for (const group of groups) {
				frag.appendChild(renderButtonTable(`Floating Buttons (${group.position})`, group.buttons))
			}
		}
	}

	return frag
}

interface HelpOverlayResult {
	readonly element: HTMLDivElement
	readonly open: () => void
	readonly close: () => void
}

/** Create the help overlay and wire the help button */
export function createHelpOverlay(
	term: XTerminal,
	helpButton: HTMLButtonElement,
	config: MuxiConfig,
): HelpOverlayResult {
	const overlay = el('div', { id: 'wt-help' })
	overlay.appendChild(buildHelpContent(config))

	function open(): void {
		overlay.style.display = 'block'
	}

	function close(): void {
		overlay.style.display = 'none'
	}

	overlay.addEventListener('click', (e: Event) => {
		const target = e.target
		if (!(target instanceof HTMLElement)) return
		if (target === overlay || target.classList.contains('wt-help-close')) {
			const kbWasOpen = isKeyboardOpen()
			haptic()
			close()
			conditionalFocus(term, kbWasOpen)
		}
	})

	helpButton.addEventListener('click', (e: Event) => {
		e.preventDefault()
		haptic()
		open()
	})

	return { element: overlay, open, close }
}
