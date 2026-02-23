import { catppuccinMocha } from './theme/catppuccin-mocha'
import type { ControlButton, DeepPartial, PwaConfig, WebmuxConfig } from './types'

/** Default font configuration */
const defaultFont: WebmuxConfig['font'] = {
	family: 'JetBrainsMono NFM, monospace',
	cdnUrl:
		'https://cdn.jsdelivr.net/gh/mshaugh/nerdfont-webfonts@latest/build/jetbrainsmono-nfm.css',
	mobileSizeDefault: 16,
	sizeRange: [8, 32],
}

/** Default gesture configuration */
const defaultGestures: WebmuxConfig['gestures'] = {
	swipe: {
		enabled: true,
		threshold: 80,
		maxDuration: 400,
		left: '\x02n',
		right: '\x02p',
		leftLabel: 'Next tmux window',
		rightLabel: 'Previous tmux window',
	},
	pinch: { enabled: false },
	scroll: { enabled: true, sensitivity: 40, strategy: 'wheel', wheelIntervalMs: 24 },
}

/** Default row 1 buttons (prefix + nav) */
const defaultRow1: WebmuxConfig['toolbar']['row1'] = [
	{
		id: 'esc',
		label: 'Esc',
		description: 'Send Escape key',
		action: { type: 'send', data: '\x1b' },
	},
	{
		id: 'tmux-prefix',
		label: 'Prefix',
		description: 'Send tmux prefix key (Ctrl-B)',
		action: { type: 'send', data: '\x02' },
	},
	{ id: 'tab', label: 'Tab', description: 'Send Tab key', action: { type: 'send', data: '\t' } },
	{
		id: 'shift-tab',
		label: 'S-Tab',
		description: 'Send Shift+Tab key',
		action: { type: 'send', data: '\x1b[Z', keyLabel: 'Shift+Tab' },
	},
	{
		id: 'left',
		label: '\u2190',
		description: 'Send Left arrow key',
		action: { type: 'send', data: '\x1b[D', keyLabel: 'Left' },
	},
	{
		id: 'up',
		label: '\u2191',
		description: 'Send Up arrow key',
		action: { type: 'send', data: '\x1b[A', keyLabel: 'Up' },
	},
	{
		id: 'down',
		label: '\u2193',
		description: 'Send Down arrow key',
		action: { type: 'send', data: '\x1b[B', keyLabel: 'Down' },
	},
	{
		id: 'right',
		label: '\u2192',
		description: 'Send Right arrow key',
		action: { type: 'send', data: '\x1b[C', keyLabel: 'Right' },
	},
	{
		id: 'ctrl-c',
		label: 'C-c',
		description: 'Send Ctrl-C interrupt',
		action: { type: 'send', data: '\x03' },
	},
	{
		id: 'enter',
		label: '\u23CE',
		description: 'Send Enter/Return key',
		action: { type: 'send', data: '\r' },
	},
]

/** Default row 2 buttons */
const defaultRow2: WebmuxConfig['toolbar']['row2'] = [
	{
		id: 'q',
		label: 'q',
		description: 'Send q key',
		action: { type: 'send', data: 'q' },
	},
	{
		id: 'alt-enter',
		label: 'M-↵',
		description: 'Send Alt+Enter (ESC + Enter)',
		action: { type: 'send', data: '\x1b\r', keyLabel: 'Alt+Enter' },
	},
	{
		id: 'ctrl-d',
		label: 'C-d',
		description: 'Send Ctrl-D key',
		action: { type: 'send', data: '\x04' },
	},
	{
		id: 'drawer-toggle',
		label: '\u2630 More',
		description: 'Open command drawer',
		action: { type: 'drawer-toggle' },
	},
	{ id: 'paste', label: 'Paste', description: 'Paste from clipboard', action: { type: 'paste' } },
	{
		id: 'backspace',
		label: '\u232b',
		description: 'Send Backspace key',
		action: { type: 'send', data: '\x7f', keyLabel: 'Backspace' },
	},
	{
		id: 'space',
		label: 'Space',
		description: 'Send Space key',
		action: { type: 'send', data: ' ' },
	},
]

/** Default drawer commands */
export const defaultDrawerButtons: readonly ControlButton[] = [
	{
		id: 'tmux-new-window',
		label: '+ Win',
		description: 'Create tmux window',
		action: { type: 'send', data: '\x02c' },
	},
	{
		id: 'tmux-split-vertical',
		label: 'Split |',
		description: 'Split pane vertically',
		action: { type: 'send', data: '\x02|' },
	},
	{
		id: 'tmux-split-horizontal',
		label: 'Split \u2014',
		description: 'Split pane horizontally',
		action: { type: 'send', data: '\x02-' },
	},
	{
		id: 'tmux-zoom',
		label: 'Zoom',
		description: 'Toggle pane zoom',
		action: { type: 'send', data: '\x02z' },
	},
	{
		id: 'tmux-sessions',
		label: 'Sessions',
		description: 'Open tmux sessions picker',
		action: { type: 'send', data: '\x02S' },
	},
	{
		id: 'tmux-windows',
		label: 'Windows',
		description: 'Open tmux windows picker',
		action: { type: 'send', data: '\x02W' },
	},
	{
		id: 'tmux-git',
		label: 'Git',
		description: 'Open Lazygit popup',
		action: { type: 'send', data: '\x02g' },
	},
	{
		id: 'tmux-files',
		label: 'Files',
		description: 'Open file browser popup',
		action: { type: 'send', data: '\x02y' },
	},
	{
		id: 'tmux-links',
		label: 'Links',
		description: 'Open links picker',
		action: { type: 'send', data: '\x02u' },
	},
	{
		id: 'page-up',
		label: 'PgUp',
		description: 'Send Page Up key',
		action: { type: 'send', data: '\x1b[5~', keyLabel: 'Page Up' },
	},
	{
		id: 'page-down',
		label: 'PgDn',
		description: 'Send Page Down key',
		action: { type: 'send', data: '\x1b[6~', keyLabel: 'Page Down' },
	},
	{
		id: 'tmux-copy',
		label: 'Copy',
		description: 'Start tmux copy mode helper',
		action: { type: 'send', data: '\x02 ' },
	},
	{
		id: 'tmux-help',
		label: 'Help',
		description: 'Open tmux help',
		action: { type: 'send', data: '\x02?' },
	},
	{
		id: 'tmux-kill-pane',
		label: 'Kill',
		description: 'Kill current pane (with confirm)',
		action: { type: 'send', data: '\x02x' },
	},
	{
		id: 'combo-picker',
		label: 'Combo',
		description: 'Open combo sender (Ctrl/Alt + key)',
		action: { type: 'combo-picker' },
	},
]

/** Default mobile configuration */
const defaultMobile: WebmuxConfig['mobile'] = {
	initData: null,
	widthThreshold: 768,
}

/** Default PWA configuration */
const defaultPwa: PwaConfig = {
	enabled: true,
	themeColor: '#1e1e2e',
}

/** Complete default configuration */
export const defaultConfig: WebmuxConfig = {
	name: 'webmux',
	theme: catppuccinMocha,
	font: defaultFont,
	plugins: [],
	toolbar: { row1: defaultRow1, row2: defaultRow2 },
	drawer: { buttons: defaultDrawerButtons },
	gestures: defaultGestures,
	mobile: defaultMobile,
	floatingButtons: [],
	pwa: defaultPwa,
}

/** Deep merge two objects, with `override` taking precedence */
function deepMerge(
	base: Record<string, unknown>,
	override: Record<string, unknown>,
): Record<string, unknown> {
	const result: Record<string, unknown> = { ...base }
	for (const key of Object.keys(override)) {
		const overrideVal = override[key]
		if (overrideVal === undefined) continue
		const baseVal = base[key]
		if (
			baseVal !== null &&
			typeof baseVal === 'object' &&
			!Array.isArray(baseVal) &&
			overrideVal !== null &&
			typeof overrideVal === 'object' &&
			!Array.isArray(overrideVal)
		) {
			result[key] = deepMerge(
				baseVal as Record<string, unknown>,
				overrideVal as Record<string, unknown>,
			)
		} else {
			result[key] = overrideVal
		}
	}
	return result
}

/** Define a webmux configuration with defaults filled in */
export function defineConfig(overrides: DeepPartial<WebmuxConfig> = {}): WebmuxConfig {
	return deepMerge(
		defaultConfig as unknown as Record<string, unknown>,
		overrides as unknown as Record<string, unknown>,
	) as unknown as WebmuxConfig
}

/**
 * Serialise theme to ttyd `-t theme=...` JSON string.
 * Used by the shell wrapper to pass theme via CLI flags.
 */
export function serialiseThemeForTtyd(config: WebmuxConfig): string {
	return JSON.stringify(config.theme)
}
