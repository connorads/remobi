/** Action types for toolbar buttons — discriminated union, no boolean flags */
export type ButtonAction =
	| { readonly type: 'send'; readonly data: string }
	| { readonly type: 'ctrl-modifier' }
	| { readonly type: 'paste' }
	| { readonly type: 'drawer-toggle' }

/** A toolbar button definition */
export interface ButtonDef {
	readonly label: string
	readonly action: ButtonAction
}

/** A tmux drawer command */
export interface DrawerCommand {
	readonly label: string
	readonly seq: string
}

/** xterm.js theme colours */
export interface TermTheme {
	readonly background: string
	readonly foreground: string
	readonly cursor: string
	readonly cursorAccent: string
	readonly selectionBackground: string
	readonly black: string
	readonly red: string
	readonly green: string
	readonly yellow: string
	readonly blue: string
	readonly magenta: string
	readonly cyan: string
	readonly white: string
	readonly brightBlack: string
	readonly brightRed: string
	readonly brightGreen: string
	readonly brightYellow: string
	readonly brightBlue: string
	readonly brightMagenta: string
	readonly brightCyan: string
	readonly brightWhite: string
}

/** Font configuration */
export interface FontConfig {
	readonly family: string
	readonly cdnUrl: string
	readonly mobileSizeDefault: number
	readonly sizeRange: readonly [min: number, max: number]
}

/** Swipe gesture configuration */
export interface SwipeConfig {
	readonly enabled: boolean
	readonly threshold: number
	readonly maxDuration: number
}

/** Pinch gesture configuration */
export interface PinchConfig {
	readonly enabled: boolean
}

/** Scroll gesture configuration */
export interface ScrollConfig {
	readonly enabled: boolean
	readonly sensitivity: number
}

/** Gesture configuration */
export interface GestureConfig {
	readonly swipe: SwipeConfig
	readonly pinch: PinchConfig
	readonly scroll: ScrollConfig
}

/** Full webmux configuration */
export interface WebmuxConfig {
	readonly theme: TermTheme
	readonly font: FontConfig
	readonly toolbar: {
		readonly row1: readonly ButtonDef[]
		readonly row2: readonly ButtonDef[]
	}
	readonly drawer: {
		readonly commands: readonly DrawerCommand[]
	}
	readonly gestures: GestureConfig
}

/** Deep partial — allows overriding any nested subset of config */
export type DeepPartial<T> = {
	[P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

/**
 * Minimal xterm.js Terminal interface — only what webmux needs.
 * Avoids importing the full xterm package.
 */
export interface XTerminal {
	options: {
		fontSize: number
		theme?: Record<string, string>
		fontFamily?: string
	}
	input(data: string, wasUserInput: boolean): void
	focus(): void
	onData(handler: (data: string) => void): { dispose(): void }
}
