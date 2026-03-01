import type React from 'react'
import { useCurrentFrame } from 'remotion'
import { FONT_FAMILY } from '../fonts'
import { colours } from '../theme'

/** Button labels from src/config.ts defaultRow1/defaultRow2 */
const ROW1 = [
	'Esc',
	'Prefix',
	'Tab',
	'S-Tab',
	'\u2190',
	'\u2191',
	'\u2193',
	'\u2192',
	'C-c',
	'\u23CE',
] as const
const ROW2 = ['q', 'M-\u21B5', 'C-d', '\u2630 More', 'Paste', '\u232b', 'Space'] as const

/** Pixel-perfect webmux toolbar matching styles/base.css */
export const WebmuxToolbar: React.FC<{
	/** Label of button to highlight (press animation) */
	highlightButton?: string
	/** Frame at which highlight starts */
	highlightAt?: number
}> = ({ highlightButton, highlightAt = 0 }) => {
	const frame = useCurrentFrame()

	const isHighlighted = (label: string) => {
		if (label !== highlightButton) return false
		const elapsed = frame - highlightAt
		return elapsed >= 0 && elapsed < 4
	}

	return (
		<div
			style={{
				background: colours.surface0,
				padding: '6px 4px 6px 4px',
				display: 'flex',
				flexDirection: 'column',
				gap: 4,
				flexShrink: 0,
			}}
		>
			<ToolbarRow buttons={ROW1} isHighlighted={isHighlighted} minWidth={38} />
			<ToolbarRow buttons={ROW2} isHighlighted={isHighlighted} flex1 />
		</div>
	)
}

const ToolbarRow: React.FC<{
	buttons: readonly string[]
	isHighlighted: (label: string) => boolean
	minWidth?: number
	flex1?: boolean
}> = ({ buttons, isHighlighted, minWidth, flex1 }) => {
	return (
		<div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
			{buttons.map((label) => (
				<div
					key={label}
					style={{
						background: isHighlighted(label) ? colours.surface2 : colours.surface1,
						color: colours.fg,
						borderRadius: 6,
						minHeight: 44,
						minWidth: minWidth,
						flex: flex1 ? 1 : undefined,
						fontSize: 13,
						fontWeight: 600,
						fontFamily: `"${FONT_FAMILY}", system-ui, sans-serif`,
						padding: '4px 6px',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						flexShrink: 1,
					}}
				>
					{label}
				</div>
			))}
		</div>
	)
}
