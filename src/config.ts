import { catppuccinMocha } from './theme/catppuccin-mocha'
import type { DeepPartial, DrawerCommand, WebmuxConfig } from './types'

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
	swipe: { enabled: true, threshold: 80, maxDuration: 400 },
	pinch: { enabled: false },
	scroll: { enabled: true, sensitivity: 40 },
}

/** Default row 1 buttons (modifiers + nav) */
const defaultRow1: WebmuxConfig['toolbar']['row1'] = [
	{ label: 'Esc', action: { type: 'send', data: '\x1b' } },
	{ label: 'Ctrl', action: { type: 'ctrl-modifier' } },
	{ label: 'Tab', action: { type: 'send', data: '\t' } },
	{ label: 'S-Tab', action: { type: 'send', data: '\x1b[Z' } },
	{ label: '\u2190', action: { type: 'send', data: '\x1b[D' } },
	{ label: '\u2191', action: { type: 'send', data: '\x1b[A' } },
	{ label: '\u2193', action: { type: 'send', data: '\x1b[B' } },
	{ label: '\u2192', action: { type: 'send', data: '\x1b[C' } },
	{ label: 'C-c', action: { type: 'send', data: '\x03' } },
	{ label: '\u23CE', action: { type: 'send', data: '\r' } },
]

/** Default row 2 buttons */
const defaultRow2: WebmuxConfig['toolbar']['row2'] = [
	{ label: 'q', action: { type: 'send', data: 'q' } },
	{ label: 'C-d', action: { type: 'send', data: '\x04' } },
	{ label: '\u2630 More', action: { type: 'drawer-toggle' } },
	{ label: 'Paste', action: { type: 'paste' } },
	{ label: 'Space', action: { type: 'send', data: ' ' } },
]

/** Default drawer commands */
export const defaultDrawerCommands: readonly DrawerCommand[] = [
	{ label: '+ Win', seq: '\x02c' },
	{ label: 'Split |', seq: '\x02|' },
	{ label: 'Split \u2014', seq: '\x02-' },
	{ label: 'Zoom', seq: '\x02z' },
	{ label: 'Sessions', seq: '\x02S' },
	{ label: 'Windows', seq: '\x02W' },
	{ label: 'Git', seq: '\x02g' },
	{ label: 'Files', seq: '\x02y' },
	{ label: 'Links', seq: '\x02u' },
	{ label: 'PgUp', seq: '\x02\x1b[5~' },
	{ label: 'PgDn', seq: '\x1b[6~' },
	{ label: 'Copy', seq: '\x02 ' },
	{ label: 'Help', seq: '\x02?' },
	{ label: 'Kill', seq: '\x02x' },
]

/** Complete default configuration */
export const defaultConfig: WebmuxConfig = {
	theme: catppuccinMocha,
	font: defaultFont,
	toolbar: { row1: defaultRow1, row2: defaultRow2 },
	drawer: { commands: defaultDrawerCommands },
	gestures: defaultGestures,
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
