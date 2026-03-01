import type React from 'react'
import { colours } from '../theme'

/** iPhone-style frame with dynamic island notch */
export const PhoneMockup: React.FC<{
	children: React.ReactNode
	width?: number
	height?: number
}> = ({ children, width = 390, height = 844 }) => {
	return (
		<div
			style={{
				width,
				height,
				borderRadius: 48,
				border: `3px solid ${colours.surface2}`,
				background: colours.bg,
				overflow: 'hidden',
				position: 'relative',
				display: 'flex',
				flexDirection: 'column',
				boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
			}}
		>
			{/* Dynamic island */}
			<div
				style={{
					position: 'absolute',
					top: 12,
					left: '50%',
					transform: 'translateX(-50%)',
					width: 120,
					height: 34,
					borderRadius: 20,
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
					paddingTop: 54,
					overflow: 'hidden',
				}}
			>
				{children}
			</div>
		</div>
	)
}
