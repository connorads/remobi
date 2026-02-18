import type { XTerminal } from '../types'
import { el } from '../util/dom'
import { conditionalFocus, isKeyboardOpen } from '../util/keyboard'
import { sendData } from '../util/terminal'

const PGUP_SEQ = '\x02\x1b[5~'
const PGDN_SEQ = '\x1b[6~'

const LONG_PRESS_DELAY = 300
const REPEAT_INTERVAL = 100
const FADE_TIMEOUT = 2000

/** Create floating scroll buttons (PgUp ▲ / PgDn ▼) */
export function createScrollButtons(term: XTerminal): { element: HTMLDivElement } {
	const container = el('div', { id: 'wt-scroll-buttons' })

	const upBtn = el('button', { 'aria-label': 'Page Up' }, '\u25B2')
	const downBtn = el('button', { 'aria-label': 'Page Down' }, '\u25BC')

	container.appendChild(upBtn)
	container.appendChild(downBtn)

	function wireButton(button: HTMLButtonElement, seq: string): void {
		let repeatTimer: ReturnType<typeof setInterval> | undefined
		let delayTimer: ReturnType<typeof setTimeout> | undefined

		function send(): void {
			const kbWasOpen = isKeyboardOpen()
			sendData(term, seq)
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

	wireButton(upBtn, PGUP_SEQ)
	wireButton(downBtn, PGDN_SEQ)

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
