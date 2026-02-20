import type { DeepPartial, WebmuxConfig } from './types'

interface ValidationIssue {
	readonly path: string
	readonly expected: string
	readonly received: string
}

const ROOT_KEYS = ['theme', 'font', 'plugins', 'toolbar', 'drawer', 'gestures']
const THEME_KEYS = [
	'background',
	'foreground',
	'cursor',
	'cursorAccent',
	'selectionBackground',
	'black',
	'red',
	'green',
	'yellow',
	'blue',
	'magenta',
	'cyan',
	'white',
	'brightBlack',
	'brightRed',
	'brightGreen',
	'brightYellow',
	'brightBlue',
	'brightMagenta',
	'brightCyan',
	'brightWhite',
]
const FONT_KEYS = ['family', 'cdnUrl', 'mobileSizeDefault', 'sizeRange']
const TOOLBAR_KEYS = ['row1', 'row2']
const DRAWER_KEYS = ['buttons']
const GESTURES_KEYS = ['swipe', 'pinch', 'scroll']
const SWIPE_KEYS = ['enabled', 'threshold', 'maxDuration']
const PINCH_KEYS = ['enabled']
const SCROLL_KEYS = ['enabled', 'sensitivity', 'strategy', 'wheelIntervalMs']
const BUTTON_KEYS = ['id', 'label', 'description', 'action']
const ACTION_KEYS = ['type', 'data', 'keyLabel']

export class ConfigValidationError extends Error {
	readonly issues: readonly ValidationIssue[]

	constructor(issues: readonly ValidationIssue[]) {
		super(formatIssues(issues))
		this.name = 'ConfigValidationError'
		this.issues = issues
	}
}

function formatIssues(issues: readonly ValidationIssue[]): string {
	const lines = ['Invalid webmux config:']
	for (const issue of issues) {
		lines.push(`- ${issue.path}: expected ${issue.expected}, received ${issue.received}`)
	}
	return lines.join('\n')
}

function kindOf(value: unknown): string {
	if (value === null) return 'null'
	if (Array.isArray(value)) return 'array'
	return typeof value
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function pushIssue(
	issues: ValidationIssue[],
	path: string,
	expected: string,
	receivedValue: unknown,
): void {
	issues.push({ path, expected, received: kindOf(receivedValue) })
}

function checkUnknownKeys(
	value: Record<string, unknown>,
	allowedKeys: readonly string[],
	basePath: string,
	issues: ValidationIssue[],
): void {
	for (const key of Object.keys(value)) {
		if (!allowedKeys.includes(key)) {
			pushIssue(issues, `${basePath}.${key}`, `known key (${allowedKeys.join(', ')})`, value[key])
		}
	}
}

function validateString(value: unknown, path: string, issues: ValidationIssue[]): void {
	if (typeof value !== 'string') {
		pushIssue(issues, path, 'string', value)
	}
}

function validateNumber(value: unknown, path: string, issues: ValidationIssue[]): void {
	if (typeof value !== 'number' || !Number.isFinite(value)) {
		pushIssue(issues, path, 'finite number', value)
	}
}

function validateBoolean(value: unknown, path: string, issues: ValidationIssue[]): void {
	if (typeof value !== 'boolean') {
		pushIssue(issues, path, 'boolean', value)
	}
}

function validateAction(value: unknown, path: string, issues: ValidationIssue[]): void {
	if (!isRecord(value)) {
		pushIssue(issues, path, 'object', value)
		return
	}

	checkUnknownKeys(value, ACTION_KEYS, path, issues)

	const actionType = value.type
	if (typeof actionType !== 'string') {
		pushIssue(
			issues,
			`${path}.type`,
			`'send' | 'ctrl-modifier' | 'paste' | 'drawer-toggle'`,
			actionType,
		)
		return
	}

	if (
		actionType !== 'send' &&
		actionType !== 'ctrl-modifier' &&
		actionType !== 'paste' &&
		actionType !== 'drawer-toggle'
	) {
		pushIssue(
			issues,
			`${path}.type`,
			`'send' | 'ctrl-modifier' | 'paste' | 'drawer-toggle'`,
			actionType,
		)
		return
	}

	if (actionType === 'send') {
		if (!('data' in value)) {
			pushIssue(issues, `${path}.data`, 'string', undefined)
		} else {
			validateString(value.data, `${path}.data`, issues)
		}

		if ('keyLabel' in value && value.keyLabel !== undefined) {
			validateString(value.keyLabel, `${path}.keyLabel`, issues)
		}
		return
	}

	if ('data' in value && value.data !== undefined) {
		pushIssue(issues, `${path}.data`, 'undefined for non-send actions', value.data)
	}
	if ('keyLabel' in value && value.keyLabel !== undefined) {
		pushIssue(issues, `${path}.keyLabel`, 'undefined for non-send actions', value.keyLabel)
	}
}

function validateControlButton(value: unknown, path: string, issues: ValidationIssue[]): void {
	if (!isRecord(value)) {
		pushIssue(issues, path, 'object', value)
		return
	}

	checkUnknownKeys(value, BUTTON_KEYS, path, issues)

	if (!('id' in value)) {
		pushIssue(issues, `${path}.id`, 'string', undefined)
	} else {
		validateString(value.id, `${path}.id`, issues)
	}

	if (!('label' in value)) {
		pushIssue(issues, `${path}.label`, 'string', undefined)
	} else {
		validateString(value.label, `${path}.label`, issues)
	}

	if (!('description' in value)) {
		pushIssue(issues, `${path}.description`, 'string', undefined)
	} else {
		validateString(value.description, `${path}.description`, issues)
	}

	if (!('action' in value)) {
		pushIssue(issues, `${path}.action`, 'object', undefined)
	} else {
		validateAction(value.action, `${path}.action`, issues)
	}
}

function validateButtonsArray(value: unknown, path: string, issues: ValidationIssue[]): void {
	if (!Array.isArray(value)) {
		pushIssue(issues, path, 'array of control buttons', value)
		return
	}

	for (let index = 0; index < value.length; index++) {
		validateControlButton(value[index], `${path}[${index}]`, issues)
	}
}

function validateTheme(value: unknown, path: string, issues: ValidationIssue[]): void {
	if (!isRecord(value)) {
		pushIssue(issues, path, 'object', value)
		return
	}

	checkUnknownKeys(value, THEME_KEYS, path, issues)

	for (const key of THEME_KEYS) {
		if (key in value && value[key] !== undefined) {
			validateString(value[key], `${path}.${key}`, issues)
		}
	}
}

function validateFont(value: unknown, path: string, issues: ValidationIssue[]): void {
	if (!isRecord(value)) {
		pushIssue(issues, path, 'object', value)
		return
	}

	checkUnknownKeys(value, FONT_KEYS, path, issues)

	if ('family' in value && value.family !== undefined) {
		validateString(value.family, `${path}.family`, issues)
	}
	if ('cdnUrl' in value && value.cdnUrl !== undefined) {
		validateString(value.cdnUrl, `${path}.cdnUrl`, issues)
	}
	if ('mobileSizeDefault' in value && value.mobileSizeDefault !== undefined) {
		validateNumber(value.mobileSizeDefault, `${path}.mobileSizeDefault`, issues)
	}

	if ('sizeRange' in value && value.sizeRange !== undefined) {
		const sizeRange = value.sizeRange
		if (!Array.isArray(sizeRange) || sizeRange.length !== 2) {
			pushIssue(issues, `${path}.sizeRange`, 'tuple [min, max]', sizeRange)
		} else {
			validateNumber(sizeRange[0], `${path}.sizeRange[0]`, issues)
			validateNumber(sizeRange[1], `${path}.sizeRange[1]`, issues)
		}
	}
}

function validateToolbar(value: unknown, path: string, issues: ValidationIssue[]): void {
	if (!isRecord(value)) {
		pushIssue(issues, path, 'object', value)
		return
	}

	checkUnknownKeys(value, TOOLBAR_KEYS, path, issues)

	if ('row1' in value && value.row1 !== undefined) {
		validateButtonsArray(value.row1, `${path}.row1`, issues)
	}
	if ('row2' in value && value.row2 !== undefined) {
		validateButtonsArray(value.row2, `${path}.row2`, issues)
	}
}

function validatePlugins(value: unknown, path: string, issues: ValidationIssue[]): void {
	if (!Array.isArray(value)) {
		pushIssue(issues, path, 'array of plugin specifiers', value)
		return
	}

	for (let index = 0; index < value.length; index++) {
		const entry = value[index]
		validateString(entry, `${path}[${index}]`, issues)
		if (typeof entry === 'string' && entry.trim().length === 0) {
			pushIssue(issues, `${path}[${index}]`, 'non-empty plugin specifier', entry)
		} else if (typeof entry === 'string' && entry.trim() !== entry) {
			pushIssue(
				issues,
				`${path}[${index}]`,
				'trimmed plugin specifier (no leading/trailing whitespace)',
				entry,
			)
		} else if (typeof entry === 'string' && /[\r\n]/.test(entry)) {
			pushIssue(
				issues,
				`${path}[${index}]`,
				'single-line plugin specifier with no control characters',
				entry,
			)
		}
	}
}

function validateDrawer(value: unknown, path: string, issues: ValidationIssue[]): void {
	if (!isRecord(value)) {
		pushIssue(issues, path, 'object', value)
		return
	}

	checkUnknownKeys(value, DRAWER_KEYS, path, issues)

	if ('buttons' in value && value.buttons !== undefined) {
		validateButtonsArray(value.buttons, `${path}.buttons`, issues)
	}
}

function validateGestures(value: unknown, path: string, issues: ValidationIssue[]): void {
	if (!isRecord(value)) {
		pushIssue(issues, path, 'object', value)
		return
	}

	checkUnknownKeys(value, GESTURES_KEYS, path, issues)

	if ('swipe' in value && value.swipe !== undefined) {
		const swipe = value.swipe
		if (!isRecord(swipe)) {
			pushIssue(issues, `${path}.swipe`, 'object', swipe)
		} else {
			checkUnknownKeys(swipe, SWIPE_KEYS, `${path}.swipe`, issues)
			if ('enabled' in swipe && swipe.enabled !== undefined) {
				validateBoolean(swipe.enabled, `${path}.swipe.enabled`, issues)
			}
			if ('threshold' in swipe && swipe.threshold !== undefined) {
				validateNumber(swipe.threshold, `${path}.swipe.threshold`, issues)
			}
			if ('maxDuration' in swipe && swipe.maxDuration !== undefined) {
				validateNumber(swipe.maxDuration, `${path}.swipe.maxDuration`, issues)
			}
		}
	}

	if ('pinch' in value && value.pinch !== undefined) {
		const pinch = value.pinch
		if (!isRecord(pinch)) {
			pushIssue(issues, `${path}.pinch`, 'object', pinch)
		} else {
			checkUnknownKeys(pinch, PINCH_KEYS, `${path}.pinch`, issues)
			if ('enabled' in pinch && pinch.enabled !== undefined) {
				validateBoolean(pinch.enabled, `${path}.pinch.enabled`, issues)
			}
		}
	}

	if ('scroll' in value && value.scroll !== undefined) {
		const scroll = value.scroll
		if (!isRecord(scroll)) {
			pushIssue(issues, `${path}.scroll`, 'object', scroll)
		} else {
			checkUnknownKeys(scroll, SCROLL_KEYS, `${path}.scroll`, issues)
			if ('enabled' in scroll && scroll.enabled !== undefined) {
				validateBoolean(scroll.enabled, `${path}.scroll.enabled`, issues)
			}
			if ('sensitivity' in scroll && scroll.sensitivity !== undefined) {
				validateNumber(scroll.sensitivity, `${path}.scroll.sensitivity`, issues)
			}
			if ('wheelIntervalMs' in scroll && scroll.wheelIntervalMs !== undefined) {
				validateNumber(scroll.wheelIntervalMs, `${path}.scroll.wheelIntervalMs`, issues)
			}
			if ('strategy' in scroll && scroll.strategy !== undefined) {
				if (scroll.strategy !== 'keys' && scroll.strategy !== 'wheel') {
					pushIssue(issues, `${path}.scroll.strategy`, `'keys' | 'wheel'`, scroll.strategy)
				}
			}
		}
	}
}

export function assertValidConfigOverrides(
	value: unknown,
): asserts value is DeepPartial<WebmuxConfig> {
	const issues: ValidationIssue[] = []

	if (!isRecord(value)) {
		pushIssue(issues, 'config', 'object', value)
	} else {
		checkUnknownKeys(value, ROOT_KEYS, 'config', issues)

		if ('theme' in value && value.theme !== undefined) {
			validateTheme(value.theme, 'config.theme', issues)
		}
		if ('font' in value && value.font !== undefined) {
			validateFont(value.font, 'config.font', issues)
		}
		if ('plugins' in value && value.plugins !== undefined) {
			validatePlugins(value.plugins, 'config.plugins', issues)
		}
		if ('toolbar' in value && value.toolbar !== undefined) {
			validateToolbar(value.toolbar, 'config.toolbar', issues)
		}
		if ('drawer' in value && value.drawer !== undefined) {
			validateDrawer(value.drawer, 'config.drawer', issues)
		}
		if ('gestures' in value && value.gestures !== undefined) {
			validateGestures(value.gestures, 'config.gestures', issues)
		}
	}

	if (issues.length > 0) {
		throw new ConfigValidationError(issues)
	}
}
