import type React from 'react'
import { colours } from '../theme'

/** Minimal laptop silhouette — screen + keyboard base */
export const LaptopMockup: React.FC<{
	children: React.ReactNode
	scale?: number
}> = ({ children, scale = 1 }) => {
	const screenW = 280 * scale
	const screenH = 180 * scale

	return (
		<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
			{/* Screen */}
			<div
				style={{
					width: screenW,
					height: screenH,
					borderRadius: `${8 * scale}px ${8 * scale}px 0 0`,
					border: `2px solid ${colours.surface2}`,
					background: colours.bg,
					overflow: 'hidden',
					display: 'flex',
					flexDirection: 'column',
				}}
			>
				{children}
			</div>
			{/* Keyboard base */}
			<div
				style={{
					width: screenW * 1.1,
					height: 10 * scale,
					borderRadius: `0 0 ${4 * scale}px ${4 * scale}px`,
					background: colours.surface2,
				}}
			/>
		</div>
	)
}
