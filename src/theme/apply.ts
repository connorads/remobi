import type { TermTheme, XTerminal } from '../types'

/** Apply a theme to the xterm.js terminal instance */
export function applyTheme(term: XTerminal, theme: TermTheme): void {
	term.options.theme = { ...theme }
}
