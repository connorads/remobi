import type { ButtonDef, WebmuxConfig, XTerminal } from '../types'
import { el } from '../util/dom'
import { haptic } from '../util/haptic'
import { conditionalFocus, isKeyboardOpen } from '../util/keyboard'
import { sendData } from '../util/terminal'

/** Ctrl sticky modifier state */
interface CtrlState {
	active: boolean
	disposer: { dispose(): void } | null
	buttonEl: HTMLButtonElement | null
}

/** Create the ctrl modifier state manager */
function createCtrlState(): CtrlState {
	return { active: false, disposer: null, buttonEl: null }
}

/** Activate ctrl sticky modifier */
function activateCtrl(state: CtrlState, term: XTerminal, theme: WebmuxConfig['theme']): void {
	if (!state.buttonEl) return
	state.active = true
	state.buttonEl.style.background = theme.blue
	state.buttonEl.style.color = theme.background

	if (!state.disposer) {
		state.disposer = term.onData((data: string) => {
			if (state.active && data.length === 1) {
				const code = data.charCodeAt(0)
				deactivateCtrl(state, theme)
				if ((code >= 65 && code <= 90) || (code >= 97 && code <= 122)) {
					sendData(term, String.fromCharCode(code & 0x1f))
				}
			}
		})
	}
}

/** Deactivate ctrl sticky modifier */
function deactivateCtrl(state: CtrlState, theme: WebmuxConfig['theme']): void {
	if (!state.buttonEl) return
	state.active = false
	state.buttonEl.style.background = theme.black
	state.buttonEl.style.color = theme.foreground

	if (state.disposer) {
		state.disposer.dispose()
		state.disposer = null
	}
}

/** Wire up a single button's click handler based on its action type */
function wireButton(
	button: HTMLButtonElement,
	def: ButtonDef,
	term: XTerminal,
	ctrlState: CtrlState,
	config: WebmuxConfig,
	openDrawer: () => void,
): void {
	button.addEventListener('click', (e: Event) => {
		e.preventDefault()
		const kbWasOpen = isKeyboardOpen()
		haptic()

		switch (def.action.type) {
			case 'ctrl-modifier':
				if (ctrlState.active) {
					deactivateCtrl(ctrlState, config.theme)
				} else {
					activateCtrl(ctrlState, term, config.theme)
				}
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

			case 'drawer-toggle':
				openDrawer()
				break

			case 'send': {
				if (ctrlState.active && ctrlState.buttonEl) {
					deactivateCtrl(ctrlState, config.theme)
					if (def.action.data.length === 1) {
						const code = def.action.data.charCodeAt(0)
						if ((code >= 65 && code <= 90) || (code >= 97 && code <= 122)) {
							sendData(term, String.fromCharCode(code & 0x1f))
							conditionalFocus(term, kbWasOpen)
							return
						}
					}
				}
				sendData(term, def.action.data)
				conditionalFocus(term, kbWasOpen)
				break
			}
		}
	})
}

/** Build a row of buttons */
function buildRow(
	buttons: readonly ButtonDef[],
	term: XTerminal,
	ctrlState: CtrlState,
	config: WebmuxConfig,
	openDrawer: () => void,
): HTMLDivElement {
	const row = el('div', { class: 'wt-row' })

	for (const def of buttons) {
		const button = el('button')
		button.textContent = def.label
		if (def.action.type === 'ctrl-modifier') {
			ctrlState.buttonEl = button
		}
		wireButton(button, def, term, ctrlState, config, openDrawer)
		row.appendChild(button)
	}

	return row
}

export interface ToolbarResult {
	readonly element: HTMLDivElement
	readonly ctrlState: CtrlState
}

/** Create the two-row toolbar */
export function createToolbar(
	term: XTerminal,
	config: WebmuxConfig,
	openDrawer: () => void,
): ToolbarResult {
	const toolbar = el('div', { id: 'wt-toolbar' })
	const ctrlState = createCtrlState()

	const row1 = buildRow(config.toolbar.row1, term, ctrlState, config, openDrawer)
	const row2 = buildRow(config.toolbar.row2, term, ctrlState, config, openDrawer)

	toolbar.appendChild(row1)
	toolbar.appendChild(row2)

	return { element: toolbar, ctrlState }
}
