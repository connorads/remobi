import { createDefaultActionRegistry } from '../actions/registry'
import type { ActionRegistry } from '../actions/registry'
import type { HookRegistry } from '../hooks/registry'
import type { ControlButton, WebmuxConfig, XTerminal } from '../types'
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
	def: ControlButton,
	term: XTerminal,
	ctrlState: CtrlState,
	config: WebmuxConfig,
	registry: ActionRegistry,
	hooks: HookRegistry,
	openDrawer: () => void,
	openComboPicker?: (options: {
		readonly sendText: (data: string) => Promise<void>
		readonly focusIfNeeded: () => void
	}) => void,
): void {
	button.addEventListener('click', (e: Event) => {
		e.preventDefault()
		const kbWasOpen = isKeyboardOpen()
		haptic()

		async function sendWithCtrlAware(data: string): Promise<void> {
			const before = await hooks.runBeforeSendData({
				term,
				config,
				source: 'toolbar',
				actionType: def.action.type,
				kbWasOpen,
				data,
			})
			if (before.blocked) return

			let nextData = before.data
			if (ctrlState.active && ctrlState.buttonEl) {
				deactivateCtrl(ctrlState, config.theme)
				if (nextData.length === 1) {
					const code = nextData.charCodeAt(0)
					if ((code >= 65 && code <= 90) || (code >= 97 && code <= 122)) {
						nextData = String.fromCharCode(code & 0x1f)
					}
				}
			}

			sendData(term, nextData)
			await hooks.runAfterSendData({
				term,
				config,
				source: 'toolbar',
				actionType: def.action.type,
				kbWasOpen,
				data: nextData,
			})
		}

		async function sendRaw(data: string): Promise<void> {
			const before = await hooks.runBeforeSendData({
				term,
				config,
				source: 'toolbar',
				actionType: def.action.type,
				kbWasOpen,
				data,
			})
			if (before.blocked) return

			sendData(term, before.data)
			await hooks.runAfterSendData({
				term,
				config,
				source: 'toolbar',
				actionType: def.action.type,
				kbWasOpen,
				data: before.data,
			})
		}

		void registry
			.execute(def.action, {
				term,
				kbWasOpen,
				focusIfNeeded: () => conditionalFocus(term, kbWasOpen),
				sendText: sendWithCtrlAware,
				sendRawText: sendRaw,
				openDrawer,
				openComboPicker,
				toggleCtrlModifier: () => {
					if (ctrlState.active) {
						deactivateCtrl(ctrlState, config.theme)
					} else {
						activateCtrl(ctrlState, term, config.theme)
					}
					conditionalFocus(term, kbWasOpen)
				},
			})
			.catch((error) => {
				console.error('webmux: toolbar action execution failed', error)
				conditionalFocus(term, kbWasOpen)
			})
	})
}

/** Build a row of buttons */
function buildRow(
	buttons: readonly ControlButton[],
	term: XTerminal,
	ctrlState: CtrlState,
	config: WebmuxConfig,
	registry: ActionRegistry,
	hooks: HookRegistry,
	openDrawer: () => void,
	openComboPicker?: (options: {
		readonly sendText: (data: string) => Promise<void>
		readonly focusIfNeeded: () => void
	}) => void,
): HTMLDivElement {
	const row = el('div', { class: 'wt-row' })

	for (const def of buttons) {
		const button = el('button')
		button.textContent = def.label
		if (def.action.type === 'ctrl-modifier') {
			ctrlState.buttonEl = button
		}
		wireButton(button, def, term, ctrlState, config, registry, hooks, openDrawer, openComboPicker)
		row.appendChild(button)
	}

	return row
}

interface ToolbarResult {
	readonly element: HTMLDivElement
	readonly ctrlState: CtrlState
}

/** Create the two-row toolbar */
export function createToolbar(
	term: XTerminal,
	config: WebmuxConfig,
	openDrawer: () => void,
	hooks: HookRegistry,
	actions: ActionRegistry = createDefaultActionRegistry(),
	openComboPicker?: (options: {
		readonly sendText: (data: string) => Promise<void>
		readonly focusIfNeeded: () => void
	}) => void,
): ToolbarResult {
	const toolbar = el('div', { id: 'wt-toolbar' })
	const ctrlState = createCtrlState()

	const row1 = buildRow(
		config.toolbar.row1,
		term,
		ctrlState,
		config,
		actions,
		hooks,
		openDrawer,
		openComboPicker,
	)
	const row2 = buildRow(
		config.toolbar.row2,
		term,
		ctrlState,
		config,
		actions,
		hooks,
		openDrawer,
		openComboPicker,
	)

	toolbar.appendChild(row1)
	toolbar.appendChild(row2)

	return { element: toolbar, ctrlState }
}
