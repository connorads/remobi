import type React from 'react'
import { Easing, interpolate, useCurrentFrame } from 'remotion'
import { FONT_FAMILY } from '../fonts'
import { colours } from '../theme'

/** 15 drawer buttons from src/config.ts defaultDrawerButtons */
const DRAWER_BUTTONS = [
	'+ Win', 'Split |', 'Split \u2014', 'Zoom', 'Sessions',
	'Windows', 'Git', 'Files', 'Links', 'PgUp',
	'PgDn', 'Copy', 'Help', 'Kill', 'Combo',
] as const

/** Animated command drawer — slides up from bottom */
export const WebmuxDrawer: React.FC<{
	/** Frame at which the drawer starts opening */
	openAt: number
	/** Frame at which the drawer starts closing (optional) */
	closeAt?: number
}> = ({ openAt, closeAt }) => {
	const frame = useCurrentFrame()

	// Opening animation: 8 frames ease-out
	const openProgress = interpolate(frame, [openAt, openAt + 8], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
		easing: Easing.out(Easing.ease),
	})

	// Closing animation: 8 frames
	const closeProgress = closeAt !== undefined
		? interpolate(frame, [closeAt, closeAt + 8], [0, 1], {
				extrapolateLeft: 'clamp',
				extrapolateRight: 'clamp',
				easing: Easing.in(Easing.ease),
			})
		: 0

	const progress = openProgress - closeProgress
	if (progress <= 0) return null

	const translateY = (1 - progress) * 100

	return (
		<>
			{/* Backdrop */}
			<div
				style={{
					position: 'absolute',
					top: 0,
					left: 0,
					right: 0,
					bottom: 0,
					background: `rgba(0,0,0,${0.5 * progress})`,
					zIndex: 10000,
				}}
			/>
			{/* Drawer */}
			<div
				style={{
					position: 'absolute',
					bottom: 0,
					left: 0,
					right: 0,
					background: colours.surface0,
					borderRadius: '16px 16px 0 0',
					padding: '8px 12px 12px 12px',
					zIndex: 10001,
					transform: `translateY(${translateY}%)`,
				}}
			>
				{/* Handle */}
				<div
					style={{
						width: 40,
						height: 4,
						background: colours.surface2,
						borderRadius: 2,
						margin: '0 auto 12px auto',
					}}
				/>
				{/* 3-column grid */}
				<div
					style={{
						display: 'grid',
						gridTemplateColumns: 'repeat(3, 1fr)',
						gap: 8,
					}}
				>
					{DRAWER_BUTTONS.map((label) => (
						<div
							key={label}
							style={{
								background: colours.surface1,
								color: colours.fg,
								borderRadius: 8,
								minHeight: 48,
								fontSize: 13,
								fontWeight: 600,
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
			</div>
		</>
	)
}
