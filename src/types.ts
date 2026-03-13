/** Action types for control buttons — discriminated union, no boolean flags */
export type ButtonAction =
	| { readonly type: 'send'; readonly data: string; readonly keyLabel?: string }
	| { readonly type: 'ctrl-modifier' }
	| { readonly type: 'paste' }
	| { readonly type: 'combo-picker' }
	| { readonly type: 'drawer-toggle' }

/** A generic control button definition used by toolbar and drawer */
export interface ControlButton {
	readonly id: string
	readonly label: string
	readonly description: string
	readonly action: ButtonAction
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
	readonly left: string
	readonly right: string
	readonly leftLabel: string
	readonly rightLabel: string
}

/** Pinch gesture configuration */
export interface PinchConfig {
	readonly enabled: boolean
}

/** Scroll gesture configuration */
export type ScrollStrategy = 'keys' | 'wheel'

/** Scroll gesture configuration */
export interface ScrollConfig {
	readonly enabled: boolean
	readonly sensitivity: number
	readonly strategy: ScrollStrategy
	readonly wheelIntervalMs: number
}

/** Gesture configuration */
export interface GestureConfig {
	readonly swipe: SwipeConfig
	readonly pinch: PinchConfig
	readonly scroll: ScrollConfig
}

/** Mobile-specific behaviour configuration */
export interface MobileConfig {
	/** Data to send to the terminal on mobile init, null = disabled */
	readonly initData: string | null
	/** Viewport width (px) below which mobile init behaviour triggers */
	readonly widthThreshold: number
}

/** Viewport position for a floating button group */
export type FloatingPosition =
	| 'top-left'
	| 'top-right'
	| 'top-centre'
	| 'bottom-left'
	| 'bottom-right'
	| 'bottom-centre'
	| 'centre-left'
	| 'centre-right'

/** Layout direction for a floating button group */
export type FloatingDirection = 'row' | 'column'

/** A positioned group of floating buttons */
export interface FloatingButtonGroup {
	readonly position: FloatingPosition
	readonly direction?: FloatingDirection
	readonly buttons: readonly ControlButton[]
}

/** Reconnect overlay configuration */
export interface ReconnectConfig {
	readonly enabled: boolean
}

/** PWA (Progressive Web App) configuration */
export interface PwaConfig {
	readonly enabled: boolean
	readonly shortName?: string
	readonly themeColor: string
}

/** Full webmux configuration */
export interface WebmuxConfig {
	readonly name: string
	readonly theme: TermTheme
	readonly font: FontConfig
	readonly toolbar: {
		readonly row1: readonly ControlButton[]
		readonly row2: readonly ControlButton[]
	}
	readonly drawer: {
		readonly buttons: readonly ControlButton[]
	}
	readonly gestures: GestureConfig
	readonly mobile: MobileConfig
	readonly floatingButtons: readonly FloatingButtonGroup[]
	readonly pwa: PwaConfig
	readonly reconnect: ReconnectConfig
}

/** Deep partial — allows overriding any nested subset of config */
export type DeepPartial<T> = {
	[P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

/**
 * Input form for a button array in config overrides.
 * - Array: replace defaults entirely
 * - Function: receive defaults, return new array (filter, reorder, append, etc.)
 */
export type ButtonArrayInput<T extends { readonly id: string }> =
	| readonly T[]
	| ((defaults: readonly T[]) => readonly T[])

/** Config overrides shape that supports ButtonArrayInput for button arrays */
export type WebmuxConfigOverrides = Omit<
	DeepPartial<WebmuxConfig>,
	'toolbar' | 'drawer' | 'floatingButtons'
> & {
	readonly toolbar?: {
		readonly row1?: ButtonArrayInput<ControlButton>
		readonly row2?: ButtonArrayInput<ControlButton>
	}
	readonly drawer?: {
		readonly buttons?: ButtonArrayInput<ControlButton>
	}
	readonly floatingButtons?: readonly FloatingButtonGroup[]
}

/**
 * Minimal xterm.js Terminal interface — only what webmux needs.
 * Avoids importing the full xterm package.
 */
export interface XTerminal {
	cols?: number
	rows?: number
	buffer?: {
		active: {
			cursorX: number
			cursorY: number
		}
	}
	options: {
		fontSize: number
		theme?: Record<string, string>
		fontFamily?: string
	}
	input(data: string, wasUserInput: boolean): void
	focus(): void
	onData(handler: (data: string) => void): { dispose(): void }
}

/** ttyd sets window.term — typed globally to avoid unsafe casts */
declare global {
	interface Window {
		term?: XTerminal
		/** WebSocket instances captured by the reconnect interceptor script */
		__webmuxSockets?: WebSocket[]
	}
}
