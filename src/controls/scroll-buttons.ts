import { pageSeq, scrollSeq } from '../gestures/scroll'
import type { ScrollConfig, XTerminal } from '../types'
import { el } from '../util/dom'
import { conditionalFocus, isKeyboardOpen } from '../util/keyboard'
import { sendData } from '../util/terminal'

const LONG_PRESS_DELAY = 300
const REPEAT_INTERVAL = 100
const FADE_TIMEOUT = 2000

/** Create floating scroll buttons (PgUp ▲ / PgDn ▼) */
export function createScrollButtons(
	term: XTerminal,
	config: ScrollConfig,
): { element: HTMLDivElement } {
	const container = el('div', { id: 'wt-scroll-buttons' })

	const upBtn = el('button', { 'aria-label': 'Page Up' }, '\u25B2')
	const downBtn = el('button', { 'aria-label': 'Page Down' }, '\u25BC')

	container.appendChild(upBtn)
	container.appendChild(downBtn)

	function targetCell(): { x: number; y: number } {
		// Prefer cursor position — always in the active tmux pane
		const active = term.buffer?.active
		if (active && typeof active.cursorX === 'number' && typeof active.cursorY === 'number') {
			return {
				x: Math.max(1, active.cursorX + 1),
				y: Math.max(1, active.cursorY + 1),
			}
		}

		// Fallback: centre of terminal grid
		const cols = typeof term.cols === 'number' && term.cols > 0 ? Math.round(term.cols) : 80
		const rows = typeof term.rows === 'number' && term.rows > 0 ? Math.round(term.rows) : 24
		return {
			x: Math.max(1, Math.floor((cols + 1) / 2)),
			y: Math.max(1, Math.floor((rows + 1) / 2)),
		}
	}

	function sequence(direction: 'up' | 'down'): string {
		if (config.strategy === 'keys') {
			return pageSeq(direction)
		}

		const { x, y } = targetCell()
		return scrollSeq(direction, x, y)
	}

	function wireButton(button: HTMLButtonElement, direction: 'up' | 'down'): void {
		let repeatTimer: ReturnType<typeof setInterval> | undefined
		let delayTimer: ReturnType<typeof setTimeout> | undefined

		function send(): void {
			const kbWasOpen = isKeyboardOpen()
			sendData(term, sequence(direction))
			conditionalFocus(term, kbWasOpen)
		}

		function startRepeat(): void {
			delayTimer = setTimeout(() => {
				repeatTimer = setInterval(send, REPEAT_INTERVAL)
			}, LONG_PRESS_DELAY)
		}

		function stopRepeat(): void {
			if (delayTimer !== undefined) {
				clearTimeout(delayTimer)
				delayTimer = undefined
			}
			if (repeatTimer !== undefined) {
				clearInterval(repeatTimer)
				repeatTimer = undefined
			}
		}

		// Touch events for long-press repeat
		button.addEventListener('touchstart', (e) => {
			e.preventDefault()
			send()
			startRepeat()
			resetFade()
		})

		button.addEventListener('touchend', () => stopRepeat())
		button.addEventListener('touchcancel', () => stopRepeat())

		// Pointer click fallback (non-touch)
		button.addEventListener('click', () => {
			send()
			resetFade()
		})
	}

	wireButton(upBtn, 'up')
	wireButton(downBtn, 'down')

	// Auto-fade logic
	let fadeTimer: ReturnType<typeof setTimeout> | undefined

	function resetFade(): void {
		container.classList.add('wt-active')
		if (fadeTimer !== undefined) clearTimeout(fadeTimer)
		fadeTimer = setTimeout(() => {
			container.classList.remove('wt-active')
		}, FADE_TIMEOUT)
	}

	return { element: container }
}
