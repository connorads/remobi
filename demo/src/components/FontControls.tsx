import type React from 'react'
import { FONT_FAMILY } from '../fonts'
import { colours } from '../theme'

/** Top-right floating font size controls (+/- and ?) */
export const FontControls: React.FC = () => {
	const buttons = ['\u2212', '+', '?'] as const

	return (
		<div
			style={{
				position: 'absolute',
				top: 62, // below dynamic island
				right: 8,
				display: 'flex',
				gap: 4,
				zIndex: 9999,
			}}
		>
			{buttons.map((label) => (
				<div
					key={label}
					style={{
						width: 36,
						height: 36,
						borderRadius: 6,
						background: colours.surface1,
						color: colours.fg,
						opacity: 0.8,
						fontSize: 16,
						fontWeight: 700,
						fontFamily: `"${FONT_FAMILY}", system-ui, sans-serif`,
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
					}}
				>
					{label}
				</div>
			))}
		</div>
	)
}
