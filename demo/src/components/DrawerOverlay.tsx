import type React from 'react'
import { Easing, interpolate, useCurrentFrame } from 'remotion'
import { FONT_FAMILY } from '../fonts'
import { colours } from '../theme'

/** Button labels from src/config.ts defaultDrawerButtons — authentic subset */
const DRAWER_BUTTONS = [
	'+ Win',
	'Split |',
	'Split —',
	'Zoom',
	'Sessions',
	'Windows',
	'Git',
	'Files',
	'Links',
	'PgUp',
	'PgDn',
	'Copy',
	'Help',
	'Kill',
	'Combo',
] as const

/**
 * Mimics the webmux command drawer: dark overlay, 3-column grid of buttons,
 * handle bar at top. Slides up from the bottom of the phone screen.
 */
export const DrawerOverlay: React.FC<{
	/** Frame when drawer starts opening */
	showFrame: number
	/** Frame when drawer starts closing */
	hideFrame: number
}> = ({ showFrame, hideFrame }) => {
	const frame = useCurrentFrame()
	const SLIDE_DURATION = 8

	// Slide up: showFrame → showFrame + SLIDE_DURATION
	const slideIn = interpolate(frame, [showFrame, showFrame + SLIDE_DURATION], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
		easing: Easing.out(Easing.ease),
	})

	// Slide down: hideFrame → hideFrame + SLIDE_DURATION
	const slideOut = interpolate(frame, [hideFrame, hideFrame + SLIDE_DURATION], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
		easing: Easing.in(Easing.ease),
	})

	const progress = slideIn - slideOut
	if (progress <= 0) return null

	const translateY = interpolate(progress, [0, 1], [100, 0])
	const backdropOpacity = interpolate(progress, [0, 1], [0, 0.6])

	return (
		<div
			style={{
				position: 'absolute',
				inset: 0,
				zIndex: 10000,
				pointerEvents: 'none',
			}}
		>
			{/* Dark backdrop */}
			<div
				style={{
					position: 'absolute',
					inset: 0,
					background: `rgba(0,0,0,${backdropOpacity})`,
				}}
			/>

			{/* Drawer panel */}
			<div
				style={{
					position: 'absolute',
					bottom: 0,
					left: 0,
					right: 0,
					transform: `translateY(${translateY}%)`,
					background: colours.surface0,
					borderTopLeftRadius: 16,
					borderTopRightRadius: 16,
					padding: '8px 8px 16px',
					display: 'flex',
					flexDirection: 'column',
					gap: 8,
				}}
			>
				{/* Handle bar */}
				<div style={{ display: 'flex', justifyContent: 'center', padding: '4px 0' }}>
					<div
						style={{
							width: 36,
							height: 4,
							borderRadius: 2,
							background: colours.surface2,
						}}
					/>
				</div>

				{/* 3-column button grid */}
				<div
					style={{
						display: 'grid',
						gridTemplateColumns: 'repeat(3, 1fr)',
						gap: 6,
					}}
				>
					{DRAWER_BUTTONS.map((label) => (
						<div
							key={label}
							style={{
								background: colours.surface1,
								color: colours.fg,
								borderRadius: 8,
								padding: '10px 6px',
								fontSize: 12,
								fontWeight: 600,
								fontFamily: `"${FONT_FAMILY}", system-ui, sans-serif`,
								textAlign: 'center',
								whiteSpace: 'nowrap',
							}}
						>
							{label}
						</div>
					))}
				</div>
			</div>
		</div>
	)
}
