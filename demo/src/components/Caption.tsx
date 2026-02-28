import type React from 'react'
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion'
import { colours } from '../theme'

/** Feature text displayed below the phone mockup */
export const Caption: React.FC<{
	text: string
	/** Optional secondary text */
	subtitle?: string
	/** Frame when caption appears (default: 10) */
	appearAt?: number
}> = ({ text, subtitle, appearAt = 10 }) => {
	const frame = useCurrentFrame()
	const { fps } = useVideoConfig()

	const entrance = spring({
		frame: frame - appearAt,
		fps,
		config: { damping: 200 },
	})

	const opacity = interpolate(entrance, [0, 1], [0, 1])
	const y = interpolate(entrance, [0, 1], [20, 0])

	return (
		<div
			style={{
				textAlign: 'center',
				opacity,
				transform: `translateY(${y}px)`,
				marginTop: 28,
			}}
		>
			<div
				style={{
					fontSize: 28,
					fontWeight: 700,
					color: colours.fg,
					fontFamily: 'system-ui, -apple-system, sans-serif',
					textShadow: '0 0 20px rgba(137,180,250,0.25)',
				}}
			>
				{text}
			</div>
			{subtitle && (
				<div
					style={{
						fontSize: 16,
						color: colours.subtext,
						fontFamily: 'system-ui, -apple-system, sans-serif',
						marginTop: 8,
					}}
				>
					{subtitle}
				</div>
			)}
		</div>
	)
}