import { el } from '../util/dom'
import { haptic } from '../util/haptic'
import { onTap } from '../util/tap'

interface ComboDispatch {
	readonly sendText: (data: string) => Promise<void>
	readonly focusIfNeeded: () => void
}

type ComboParseResult =
	| { readonly ok: true; readonly data: string }
	| { readonly ok: false; readonly error: string }

interface ComboTokens {
	readonly modifiers: readonly string[]
	readonly key: string
}

const NAMED_KEYS = [
	'pagedown',
	'pageup',
	'return',
	'escape',
	'backspace',
	'delete',
	'enter',
	'space',
	'tab',
	'home',
	'end',
	'left',
	'right',
	'down',
	'up',
	'pgdn',
	'pgup',
	'del',
	'esc',
	'bs',
] as const

function parseComboTokens(value: string): ComboTokens | null {
	const trimmed = value.trim()
	if (trimmed.length === 0) {
		return null
	}

	let keyToken: string | null = null
	let prefix = ''

	for (const key of NAMED_KEYS) {
		const pattern = new RegExp(`(?:^|[+\\-\\s])(${key})$`, 'i')
		const match = trimmed.match(pattern)
		if (!match || match.index === undefined) continue

		const matchedKey = match[1]
		if (!matchedKey) continue
		const keyStart = match.index + match[0].length - matchedKey.length
		keyToken = matchedKey
		prefix = trimmed.slice(0, keyStart)
		break
	}

	if (!keyToken) {
		keyToken = trimmed[trimmed.length - 1] ?? ''
		prefix = trimmed.slice(0, -1)
	}

	const modifiers = prefix
		.split(/[+\-\s]+/)
		.map((token) => token.trim())
		.filter((token) => token.length > 0)

	return { modifiers, key: keyToken }
}

function resolveBaseKey(key: string, keyLower: string): ComboParseResult {
	if (key.length === 1) {
		return { ok: true, data: key }
	}

	if (keyLower === 'enter' || keyLower === 'return') return { ok: true, data: '\r' }
	if (keyLower === 'tab') return { ok: true, data: '\t' }
	if (keyLower === 'space') return { ok: true, data: ' ' }
	if (keyLower === 'esc' || keyLower === 'escape') return { ok: true, data: '\x1b' }
	if (keyLower === 'backspace' || keyLower === 'bs') return { ok: true, data: '\x7f' }
	if (keyLower === 'delete' || keyLower === 'del') return { ok: true, data: '\x1b[3~' }
	if (keyLower === 'up') return { ok: true, data: '\x1b[A' }
	if (keyLower === 'down') return { ok: true, data: '\x1b[B' }
	if (keyLower === 'right') return { ok: true, data: '\x1b[C' }
	if (keyLower === 'left') return { ok: true, data: '\x1b[D' }
	if (keyLower === 'home') return { ok: true, data: '\x1b[H' }
	if (keyLower === 'end') return { ok: true, data: '\x1b[F' }
	if (keyLower === 'pageup' || keyLower === 'pgup') return { ok: true, data: '\x1b[5~' }
	if (keyLower === 'pagedown' || keyLower === 'pgdn') return { ok: true, data: '\x1b[6~' }

	return {
		ok: false,
		error: 'Unknown key. Try one character, Enter, Tab, Space, Esc, arrows, Home/End, PgUp/PgDn.',
	}
}

function applyCtrl(base: string, key: string, keyLower: string): ComboParseResult {
	if (base.length !== 1) {
		return {
			ok: false,
			error: 'Ctrl supports single characters (for Enter use M-Enter).',
		}
	}

	if (keyLower === 'space') return { ok: true, data: '\x00' }
	if (key.length !== 1) {
		return {
			ok: false,
			error: 'Unsupported Ctrl combo for this key.',
		}
	}

	if (key === '[') return { ok: true, data: '\x1b' }
	if (key === '\\') return { ok: true, data: '\x1c' }
	if (key === ']') return { ok: true, data: '\x1d' }
	if (key === '6') return { ok: true, data: '\x1e' }
	if (key === '-' || key === '/') return { ok: true, data: '\x1f' }
	if (key === '8') return { ok: true, data: '\x7f' }

	const code = key.charCodeAt(0)
	if ((code >= 65 && code <= 90) || (code >= 97 && code <= 122)) {
		return { ok: true, data: String.fromCharCode(code & 0x1f) }
	}

	return {
		ok: false,
		error: 'Unsupported Ctrl combo for this key.',
	}
}

export function parseComboInput(value: string): ComboParseResult {
	const tokens = parseComboTokens(value)
	if (!tokens) {
		return { ok: false, error: 'Type a combo like C-s, M-Enter, or C-[.' }
	}

	let ctrl = false
	let alt = false

	for (const modifier of tokens.modifiers) {
		const token = modifier.toLowerCase()
		if (token === 'c' || token === 'ctrl' || token === 'control') {
			ctrl = true
			continue
		}
		if (token === 'm' || token === 'meta' || token === 'alt' || token === 'a') {
			alt = true
			continue
		}
		if (token === 's' || token === 'shift') {
			continue
		}
		return { ok: false, error: `Unknown modifier: ${modifier}` }
	}

	const keyToken = tokens.key
	if (!keyToken) {
		return { ok: false, error: 'Missing key in combo.' }
	}

	const keyLower = keyToken.toLowerCase()
	const base = resolveBaseKey(keyToken, keyLower)
	if (!base.ok) return base

	let data = base.data
	if (ctrl) {
		const next = applyCtrl(data, keyToken, keyLower)
		if (!next.ok) return next
		data = next.data
	}

	if (alt) {
		data = `\x1b${data}`
	}

	return { ok: true, data }
}

interface ComboPickerResult {
	readonly element: HTMLDivElement
	readonly open: (dispatch: ComboDispatch) => void
	readonly close: () => void
}

export function createComboPicker(): ComboPickerResult {
	const backdrop = el('div', { id: 'wt-combo-backdrop' })
	const panel = el('div', { id: 'wt-combo-panel' })
	const title = el('h3')
	title.textContent = 'Send combo'
	const description = el('p')
	description.textContent = 'Examples: C-s, C-[, M-Enter, Alt-x'
	const input = el('input', {
		type: 'text',
		placeholder: 'Combo',
		'aria-label': 'Combo input',
		autocomplete: 'off',
		autocorrect: 'off',
		autocapitalize: 'off',
		spellcheck: 'false',
	})
	const error = el('p', { class: 'wt-combo-error' })
	const actions = el('div', { class: 'wt-combo-actions' })
	const cancelButton = el('button', { type: 'button' }, 'Cancel')
	const sendButton = el('button', { type: 'button' }, 'Send')

	actions.appendChild(cancelButton)
	actions.appendChild(sendButton)
	panel.appendChild(title)
	panel.appendChild(description)
	panel.appendChild(input)
	panel.appendChild(error)
	panel.appendChild(actions)
	backdrop.appendChild(panel)

	let currentDispatch: ComboDispatch | null = null

	function clearError(): void {
		error.textContent = ''
	}

	function setError(message: string): void {
		error.textContent = message
	}

	function closeAndFocus(): void {
		const dispatch = currentDispatch
		backdrop.style.display = 'none'
		currentDispatch = null
		clearError()
		input.value = ''
		if (dispatch) {
			dispatch.focusIfNeeded()
		}
	}

	async function submit(): Promise<void> {
		const dispatch = currentDispatch
		if (!dispatch) return

		const parsed = parseComboInput(input.value)
		if (!parsed.ok) {
			setError(parsed.error)
			return
		}

		backdrop.style.display = 'none'
		currentDispatch = null
		clearError()
		input.value = ''

		try {
			await dispatch.sendText(parsed.data)
		} catch (errorValue) {
			console.error('remobi: combo send failed', errorValue)
		} finally {
			dispatch.focusIfNeeded()
		}
	}

	function open(dispatch: ComboDispatch): void {
		currentDispatch = dispatch
		clearError()
		input.value = ''
		backdrop.style.display = 'flex'
		setTimeout(() => input.focus(), 0)
	}

	function close(): void {
		closeAndFocus()
	}

	onTap(backdrop, (event: Event) => {
		if (event.target !== backdrop) return
		haptic()
		closeAndFocus()
	})

	onTap(cancelButton, () => {
		haptic()
		closeAndFocus()
	})

	onTap(sendButton, () => {
		haptic()
		void submit()
	})

	input.addEventListener('keydown', (event: KeyboardEvent) => {
		if (event.key === 'Enter') {
			event.preventDefault()
			haptic()
			void submit()
			return
		}
		if (event.key === 'Escape') {
			event.preventDefault()
			haptic()
			closeAndFocus()
		}
	})

	return { element: backdrop, open, close }
}
