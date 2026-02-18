import type { XTerminal } from '../types'
import { el } from '../util/dom'
import { haptic } from '../util/haptic'
import { conditionalFocus, isKeyboardOpen } from '../util/keyboard'

/** Build the help overlay HTML */
function buildHelpContent(): string {
	return [
		'<button class="wt-help-close">\u00d7</button>',
		'<h2>Toolbar \u2014 Row 1</h2>',
		'<table>',
		'<tr><td>Esc</td><td>Send Escape key</td></tr>',
		'<tr><td>Ctrl</td><td>Sticky Ctrl modifier \u2014 next key sent as Ctrl+key</td></tr>',
		'<tr><td>Tab</td><td>Send Tab key</td></tr>',
		'<tr><td>\u2190 \u2191 \u2193 \u2192</td><td>Arrow keys</td></tr>',
		'<tr><td>C-c</td><td>Send Ctrl-C (interrupt)</td></tr>',
		'<tr><td>\u23CE</td><td>Send Enter/Return</td></tr>',
		'</table>',
		'<h2>Toolbar \u2014 Row 2</h2>',
		'<table>',
		'<tr><td>\u25C0 Prev</td><td>Previous tmux window</td></tr>',
		'<tr><td>\u25B6 Next</td><td>Next tmux window</td></tr>',
		'<tr><td>\u2318 claude</td><td>Open drawer \u2014 Claude tab</td></tr>',
		'<tr><td>Paste</td><td>Paste from clipboard</td></tr>',
		'<tr><td>\u2318 tmux</td><td>Open drawer \u2014 tmux tab</td></tr>',
		'</table>',
		'<h2>Tmux Drawer Commands</h2>',
		'<table>',
		'<tr><td>+ Win</td><td>New window</td></tr>',
		'<tr><td>Split | / \u2014</td><td>Vertical / horizontal split</td></tr>',
		'<tr><td>Zoom</td><td>Toggle pane zoom</td></tr>',
		'<tr><td>Sessions</td><td>fzf session picker</td></tr>',
		'<tr><td>Windows</td><td>fzf window picker</td></tr>',
		'<tr><td>Git</td><td>Lazygit popup</td></tr>',
		'<tr><td>Files</td><td>Yazi popup</td></tr>',
		'<tr><td>Links</td><td>fzf-links</td></tr>',
		'<tr><td>Copy</td><td>tmux-thumbs (copy mode)</td></tr>',
		'<tr><td>Help</td><td>tmux help popup</td></tr>',
		'<tr><td>Kill</td><td>Kill pane (with confirm)</td></tr>',
		'</table>',
		'<h2>Claude Drawer Commands</h2>',
		'<table>',
		'<tr><td>Mode</td><td>Cycle permission mode (Shift+Tab)</td></tr>',
		'<tr><td>Yes / No</td><td>Confirm or reject at permission prompt</td></tr>',
		'<tr><td>/compact</td><td>Switch to compact mode</td></tr>',
		'<tr><td>/clear</td><td>Clear conversation</td></tr>',
		'<tr><td>/help</td><td>Show Claude Code help</td></tr>',
		'</table>',
		'<h2>Gestures</h2>',
		'<table>',
		'<tr><td>Swipe right</td><td>Previous tmux window</td></tr>',
		'<tr><td>Swipe left</td><td>Next tmux window</td></tr>',
		'<tr><td>Pinch in/out</td><td>Decrease/increase font size</td></tr>',
		'</table>',
		'<h2>Top-Right Controls</h2>',
		'<table>',
		'<tr><td>\u2212 / +</td><td>Decrease / increase font size</td></tr>',
		'<tr><td>?</td><td>This help screen</td></tr>',
		'</table>',
	].join('')
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
): HelpOverlayResult {
	const overlay = el('div', { id: 'wt-help' })
	overlay.innerHTML = buildHelpContent()

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
