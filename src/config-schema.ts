/**
 * Valibot schemas for muxi config validation.
 * Only used at CLI time (build/inject/serve) — never in the browser bundle.
 */
import * as v from 'valibot'

// --- Primitives ---

const finiteNumber = v.pipe(v.number(), v.finite())

// --- Button action (discriminated union) ---

const sendActionSchema = v.strictObject({
	type: v.literal('send'),
	data: v.string(),
	keyLabel: v.optional(v.string()),
})

const ctrlModifierActionSchema = v.strictObject({ type: v.literal('ctrl-modifier') })
const pasteActionSchema = v.strictObject({ type: v.literal('paste') })
const comboPickerActionSchema = v.strictObject({ type: v.literal('combo-picker') })
const drawerToggleActionSchema = v.strictObject({ type: v.literal('drawer-toggle') })

const buttonActionSchema = v.variant('type', [
	sendActionSchema,
	ctrlModifierActionSchema,
	pasteActionSchema,
	comboPickerActionSchema,
	drawerToggleActionSchema,
])

// --- Control button ---

const controlButtonSchema = v.strictObject({
	id: v.string(),
	label: v.string(),
	description: v.string(),
	action: buttonActionSchema,
})

// --- Button array input (array | function) ---
// Uses v.custom for type check + v.rawCheck for deep array validation,
// avoiding v.union which loses path context for nested issues.

const buttonArrayInputSchema = v.pipe(
	v.custom<readonly Record<string, unknown>[] | ((...args: readonly unknown[]) => unknown)>(
		(input) => Array.isArray(input) || typeof input === 'function',
		'array or function',
	),
	v.rawCheck(({ dataset, addIssue }) => {
		if (!dataset.typed || !Array.isArray(dataset.value)) return
		const arr = dataset.value
		for (let i = 0; i < arr.length; i++) {
			const result = v.safeParse(controlButtonSchema, arr[i])
			if (!result.success) {
				for (const issue of result.issues) {
					addIssue({
						message: issue.message,
						expected: issue.expected,
						received: issue.received,
						path: [
							{
								type: 'array',
								origin: 'value',
								input: arr,
								key: i,
								// oxlint-disable-next-line typescript/consistent-type-assertions -- Valibot path segment requires typed value
								value: arr[i] as Record<string, unknown>,
							},
							...(issue.path ?? []),
						],
					})
				}
			}
		}
	}),
)

// --- Theme ---

const themeColourSchema = v.optional(v.string())

const termThemeOverridesSchema = v.strictObject({
	background: themeColourSchema,
	foreground: themeColourSchema,
	cursor: themeColourSchema,
	cursorAccent: themeColourSchema,
	selectionBackground: themeColourSchema,
	black: themeColourSchema,
	red: themeColourSchema,
	green: themeColourSchema,
	yellow: themeColourSchema,
	blue: themeColourSchema,
	magenta: themeColourSchema,
	cyan: themeColourSchema,
	white: themeColourSchema,
	brightBlack: themeColourSchema,
	brightRed: themeColourSchema,
	brightGreen: themeColourSchema,
	brightYellow: themeColourSchema,
	brightBlue: themeColourSchema,
	brightMagenta: themeColourSchema,
	brightCyan: themeColourSchema,
	brightWhite: themeColourSchema,
})

const termThemeResolvedSchema = v.strictObject({
	background: v.string(),
	foreground: v.string(),
	cursor: v.string(),
	cursorAccent: v.string(),
	selectionBackground: v.string(),
	black: v.string(),
	red: v.string(),
	green: v.string(),
	yellow: v.string(),
	blue: v.string(),
	magenta: v.string(),
	cyan: v.string(),
	white: v.string(),
	brightBlack: v.string(),
	brightRed: v.string(),
	brightGreen: v.string(),
	brightYellow: v.string(),
	brightBlue: v.string(),
	brightMagenta: v.string(),
	brightCyan: v.string(),
	brightWhite: v.string(),
})

// --- Font ---

const fontOverridesSchema = v.strictObject({
	family: v.optional(v.string()),
	cdnUrl: v.optional(v.string()),
	mobileSizeDefault: v.optional(finiteNumber),
	sizeRange: v.optional(v.pipe(v.tuple([finiteNumber, finiteNumber]))),
})

const fontResolvedSchema = v.strictObject({
	family: v.string(),
	cdnUrl: v.string(),
	mobileSizeDefault: finiteNumber,
	sizeRange: v.pipe(v.tuple([finiteNumber, finiteNumber])),
})

// --- Gestures ---

const swipeOverridesSchema = v.strictObject({
	enabled: v.optional(v.boolean()),
	threshold: v.optional(finiteNumber),
	maxDuration: v.optional(finiteNumber),
	left: v.optional(v.string()),
	right: v.optional(v.string()),
	leftLabel: v.optional(v.string()),
	rightLabel: v.optional(v.string()),
})

const swipeResolvedSchema = v.strictObject({
	enabled: v.boolean(),
	threshold: finiteNumber,
	maxDuration: finiteNumber,
	left: v.string(),
	right: v.string(),
	leftLabel: v.string(),
	rightLabel: v.string(),
})

const pinchOverridesSchema = v.strictObject({
	enabled: v.optional(v.boolean()),
})

const pinchResolvedSchema = v.strictObject({
	enabled: v.boolean(),
})

const scrollStrategySchema = v.picklist(['keys', 'wheel'])

const scrollOverridesSchema = v.strictObject({
	enabled: v.optional(v.boolean()),
	sensitivity: v.optional(finiteNumber),
	strategy: v.optional(scrollStrategySchema),
	wheelIntervalMs: v.optional(finiteNumber),
})

const scrollResolvedSchema = v.strictObject({
	enabled: v.boolean(),
	sensitivity: finiteNumber,
	strategy: scrollStrategySchema,
	wheelIntervalMs: finiteNumber,
})

const gestureOverridesSchema = v.strictObject({
	swipe: v.optional(swipeOverridesSchema),
	pinch: v.optional(pinchOverridesSchema),
	scroll: v.optional(scrollOverridesSchema),
})

const gestureResolvedSchema = v.strictObject({
	swipe: swipeResolvedSchema,
	pinch: pinchResolvedSchema,
	scroll: scrollResolvedSchema,
})

// --- Mobile ---

const mobileOverridesSchema = v.strictObject({
	initData: v.optional(v.nullable(v.string())),
	widthThreshold: v.optional(finiteNumber),
})

const mobileResolvedSchema = v.strictObject({
	initData: v.nullable(v.string()),
	widthThreshold: finiteNumber,
})

// --- Floating buttons ---

const floatingPositionSchema = v.picklist([
	'top-left',
	'top-right',
	'top-centre',
	'bottom-left',
	'bottom-right',
	'bottom-centre',
	'centre-left',
	'centre-right',
])

const floatingDirectionSchema = v.picklist(['row', 'column'])

const floatingButtonGroupSchema = v.strictObject({
	position: floatingPositionSchema,
	direction: v.optional(floatingDirectionSchema),
	buttons: v.array(controlButtonSchema),
})

// --- PWA ---

const pwaOverridesSchema = v.strictObject({
	enabled: v.optional(v.boolean()),
	shortName: v.optional(v.string()),
	themeColor: v.optional(v.string()),
})

const pwaResolvedSchema = v.strictObject({
	enabled: v.boolean(),
	shortName: v.optional(v.string()),
	themeColor: v.string(),
})

// --- Reconnect ---

const reconnectOverridesSchema = v.strictObject({
	enabled: v.optional(v.boolean()),
})

const reconnectResolvedSchema = v.strictObject({
	enabled: v.boolean(),
})

// --- Top-level schemas ---

/** Schema for config overrides (all fields optional, button arrays accept array | function) */
export const muxiConfigOverridesSchema = v.strictObject({
	name: v.optional(v.string()),
	theme: v.optional(termThemeOverridesSchema),
	font: v.optional(fontOverridesSchema),
	toolbar: v.optional(
		v.strictObject({
			row1: v.optional(buttonArrayInputSchema),
			row2: v.optional(buttonArrayInputSchema),
		}),
	),
	drawer: v.optional(
		v.strictObject({
			buttons: v.optional(buttonArrayInputSchema),
		}),
	),
	gestures: v.optional(gestureOverridesSchema),
	mobile: v.optional(mobileOverridesSchema),
	floatingButtons: v.optional(v.array(floatingButtonGroupSchema)),
	pwa: v.optional(pwaOverridesSchema),
	reconnect: v.optional(reconnectOverridesSchema),
})

/** Schema for fully resolved config (all required fields, plain button arrays) */
export const muxiConfigResolvedSchema = v.strictObject({
	name: v.string(),
	theme: termThemeResolvedSchema,
	font: fontResolvedSchema,
	toolbar: v.strictObject({
		row1: v.array(controlButtonSchema),
		row2: v.array(controlButtonSchema),
	}),
	drawer: v.strictObject({
		buttons: v.array(controlButtonSchema),
	}),
	gestures: gestureResolvedSchema,
	mobile: mobileResolvedSchema,
	floatingButtons: v.array(floatingButtonGroupSchema),
	pwa: pwaResolvedSchema,
	reconnect: reconnectResolvedSchema,
})
