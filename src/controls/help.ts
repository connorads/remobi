import type { ControlButton, WebmuxConfig, XTerminal } from '../types'
import { el } from '../util/dom'
import { haptic } from '../util/haptic'
import { conditionalFocus, isKeyboardOpen } from '../util/keyboard'

function escapeHtml(value: unknown): string {
	const text =
		typeof value === 'string' ? value : value === null || value === undefined ? '' : String(value)
	return text
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;')
}

function renderButtonTable(title: string, buttons: readonly ControlButton[]): string {
	const rows = buttons
		.map((button) => {
			const label = escapeHtml(button.label || button.id || 'Unnamed')
			const description = escapeHtml(button.description || 'No description')
			return `<tr><td>${label}</td><td>${description}</td></tr>`
		})
		.join('')

	return `<h2>${escapeHtml(title)}</h2><table>${rows}</table>`
}

function renderGestures(config: WebmuxConfig): string {
	const rows: string[] = []

	if (config.gestures.swipe.enabled) {
		rows.push(
			`<tr><td>Swipe right</td><td>${escapeHtml(config.gestures.swipe.rightLabel)}</td></tr>`,
		)
		rows.push(`<tr><td>Swipe left</td><td>${escapeHtml(config.gestures.swipe.leftLabel)}</td></tr>`)
	}

	if (config.gestures.pinch.enabled) {
		rows.push('<tr><td>Pinch in/out</td><td>Decrease/increase font size</td></tr>')
	}

	if (config.gestures.scroll.enabled) {
		if (config.gestures.scroll.strategy === 'wheel') {
			rows.push('<tr><td>Finger drag</td><td>Send wheel scroll events to terminal apps</td></tr>')
			rows.push('<tr><td>Side ▲ ▼</td><td>Send wheel-up / wheel-down at terminal centre</td></tr>')
		} else {
			rows.push('<tr><td>Finger drag</td><td>Send PageUp / PageDown keys</td></tr>')
			rows.push('<tr><td>Side ▲ ▼</td><td>Send PageUp / PageDown keys</td></tr>')
		}
	}

	if (!rows.length) {
		rows.push('<tr><td>None</td><td>All gestures are disabled in config</td></tr>')
	}

	return `<h2>Gestures</h2><table>${rows.join('')}</table>`
}

/** Build the help overlay HTML */
function buildHelpContent(config: WebmuxConfig): string {
	const topRightButtons: readonly ControlButton[] = [
		{
			id: 'font-size',
			label: '− / +',
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

	const sections = [
		'<button class="wt-help-close">×</button>',
		renderButtonTable('Toolbar — Row 1', config.toolbar.row1),
		renderButtonTable('Toolbar — Row 2', config.toolbar.row2),
		renderButtonTable('Drawer Buttons', config.drawer.buttons),
		renderGestures(config),
		renderButtonTable('Top-Right Controls', topRightButtons),
	]

	if (config.floatingButtons.length > 0) {
		sections.push(renderButtonTable('Floating Buttons', config.floatingButtons))
	}

	return sections.join('')
}

export interface HelpOverlayResult {
	readonly element: HTMLDivElement
	readonly open: () => void
	readonly close: () => void
}

/** Create the help overlay and wire the help button */
export function createHelpOverlay(
	term: XTerminal,
	helpButton: HTMLButtonElement,
	config: WebmuxConfig,
): HelpOverlayResult {
	const overlay = el('div', { id: 'wt-help' })
	overlay.innerHTML = buildHelpContent(config)

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
