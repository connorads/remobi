import type { FontConfig, XTerminal } from '../types'
import { btn, el } from '../util/dom'
import { haptic } from '../util/haptic'
import { resizeTerm } from '../util/terminal'

/** Change terminal font size by delta, clamped to config range */
export function changeFontSize(term: XTerminal, delta: number, font: FontConfig): void {
	const current = term.options.fontSize
	const next = Math.max(font.sizeRange[0], Math.min(font.sizeRange[1], current + delta))
	if (next !== current) {
		term.options.fontSize = next
		resizeTerm()
	}
}

export interface FontControlsResult {
	readonly element: HTMLDivElement
	readonly helpButton: HTMLButtonElement
}

/** Create the font size controls (-, +) and help button */
export function createFontControls(term: XTerminal, font: FontConfig): FontControlsResult {
	const container = el('div', { id: 'wt-font-controls' })

	const btnMinus = btn('\u2212', 'Decrease font size')
	const btnPlus = btn('+', 'Increase font size')
	const btnHelp = btn('?', 'Help')

	container.appendChild(btnMinus)
	container.appendChild(btnPlus)
	container.appendChild(btnHelp)

	btnMinus.addEventListener('click', (e: Event) => {
		e.preventDefault()
		haptic()
		changeFontSize(term, -2, font)
	})

	btnPlus.addEventListener('click', (e: Event) => {
		e.preventDefault()
		haptic()
		changeFontSize(term, 2, font)
	})

	return { element: container, helpButton: btnHelp }
}
