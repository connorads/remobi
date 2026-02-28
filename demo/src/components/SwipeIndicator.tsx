import type React from 'react'
import { interpolate, useCurrentFrame } from 'remotion'
import { colours } from '../theme'

/** Arrow flash on swipe — matches #wt-swipe-indicator from base.css */
export const SwipeIndicator: React.FC<{
	/** 'left' = ◀ (rightward swipe), 'right' = ▶ (leftward swipe) */
	direction: 'left' | 'right'
	/** Frame when the arrow appears */
	showAt: number
}> = ({ direction, showAt }) => {
	const frame = useCurrentFrame()
	const arrow = direction === 'left' ? '\u25C0' : '\u25B6'

	// Flash: opacity 0→1, hold 9 frames (~300ms at 30fps), fade to 0
	const opacity = interpolate(
		frame,
		[showAt, showAt + 2, showAt + 11, showAt + 16],
		[0, 1, 1, 0],
		{ extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
	)

	if (opacity <= 0) return null

	return (
		<div
			style={{
				position: 'absolute',
				top: '50%',
				left: '50%',
				transform: 'translate(-50%, -50%)',
				fontSize: 48,
				color: `rgba(205,214,244,0.6)`,
				opacity,
				zIndex: 9998,
				pointerEvents: 'none',
			}}
		>
			{arrow}
		</div>
	)
}
