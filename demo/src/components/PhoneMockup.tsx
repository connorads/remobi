import type React from 'react'
import { colours } from '../theme'

/** iPhone-style frame with dynamic island notch */
export const PhoneMockup: React.FC<{
	children: React.ReactNode
	scale?: number
	width?: number
	height?: number
}> = ({ children, scale = 1, width = 390, height = 844 }) => {
	return (
		<div
			style={{
				width: width * scale,
				height: height * scale,
				borderRadius: 48 * scale,
				border: `3px solid ${colours.surface2}`,
				background: colours.bg,
				overflow: 'hidden',
				position: 'relative',
				display: 'flex',
				flexDirection: 'column',
				boxShadow: `0 ${20 * scale}px ${60 * scale}px rgba(0,0,0,0.5)`,
			}}
		>
			{/* Dynamic island */}
			<div
				style={{
					position: 'absolute',
					top: 12 * scale,
					left: '50%',
					transform: 'translateX(-50%)',
					width: 120 * scale,
					height: 34 * scale,
					borderRadius: 20 * scale,
					background: '#000',
					zIndex: 10,
				}}
			/>
			{/* Screen content area with top padding for dynamic island */}
			<div
				style={{
					flex: 1,
					display: 'flex',
					flexDirection: 'column',
					paddingTop: 54 * scale,
					overflow: 'hidden',
				}}
			>
				{children}
			</div>
		</div>
	)
}
