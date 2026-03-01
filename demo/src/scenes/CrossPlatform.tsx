import type React from 'react'
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion'
import { Caption } from '../components/Caption'
import { LaptopMockup } from '../components/LaptopMockup'
import { PhoneMockup } from '../components/PhoneMockup'
import { Terminal } from '../components/Terminal'
import { TmuxStatusBar } from '../components/TmuxStatusBar'
import { WebmuxToolbar } from '../components/WebmuxToolbar'
import { FONT_FAMILY } from '../fonts'
import { crossPlatformScreen, crossPlatformStatus } from '../screens'
import { colours } from '../theme'

/**
 * Scene 5: Multiple devices showing same terminal + Tailscale lock (3s / 90 frames)
 *
 * Layout: phone left + laptop right, using built-in scale props to
 * actually shrink the DOM dimensions (not CSS transform).
 *
 * Timeline:
 * 0-20:  Phone appears from left (spring)
 * 10-30: Laptop appears from right (spring)
 * 20-40: Lock icon + labels fade in
 * 40-90: Hold
 */
export const CrossPlatform: React.FC = () => {
	const frame = useCurrentFrame()
	const { fps } = useVideoConfig()

	const phoneEntrance = spring({
		frame,
		fps,
		config: { damping: 15, stiffness: 100 },
	})
	const laptopEntrance = spring({
		frame: frame - 10,
		fps,
		config: { damping: 15, stiffness: 100 },
	})
	const labelEntrance = spring({
		frame: frame - 25,
		fps,
		config: { damping: 200 },
	})

	const phoneX = interpolate(phoneEntrance, [0, 1], [-60, 0])
	const laptopX = interpolate(laptopEntrance, [0, 1], [60, 0])
	const labelOpacity = interpolate(labelEntrance, [0, 1], [0, 1])

	return (
		<AbsoluteFill
			style={{
				background: colours.bg,
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
				justifyContent: 'center',
			}}
		>
			{/* Devices row */}
			<div
				style={{
					display: 'flex',
					alignItems: 'flex-end',
					justifyContent: 'center',
					gap: 12,
				}}
			>
				{/* Phone — scale=0.36 → 140×304px */}
				<div
					style={{
						display: 'flex',
						flexDirection: 'column',
						alignItems: 'center',
						transform: `translateX(${phoneX}px)`,
						opacity: interpolate(phoneEntrance, [0, 0.3], [0, 1], { extrapolateRight: 'clamp' }),
					}}
				>
					<PhoneMockup scale={0.36}>
						<div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
							<Terminal screen={crossPlatformScreen} fontSize={5} padding={4} lineHeight={1.3} />
							<TmuxStatusBar {...crossPlatformStatus} />
						</div>
					</PhoneMockup>
					<span
						style={{
							fontSize: 11,
							color: colours.subtext,
							fontFamily: `"${FONT_FAMILY}", monospace`,
							marginTop: 8,
							opacity: labelOpacity,
						}}
					>
						iPhone
					</span>
				</div>

				{/* Lock icon between devices */}
				<div
					style={{
						display: 'flex',
						flexDirection: 'column',
						alignItems: 'center',
						gap: 4,
						opacity: labelOpacity,
						marginBottom: 40,
					}}
				>
					<span style={{ fontSize: 24 }}>🔒</span>
					<span
						style={{
							fontSize: 9,
							color: colours.subtext,
							fontFamily: `"${FONT_FAMILY}", monospace`,
						}}
					>
						Tailscale
					</span>
				</div>

				{/* Laptop */}
				<div
					style={{
						display: 'flex',
						flexDirection: 'column',
						alignItems: 'center',
						transform: `translateX(${laptopX}px)`,
						opacity: interpolate(laptopEntrance, [0, 0.3], [0, 1], { extrapolateRight: 'clamp' }),
					}}
				>
					<LaptopMockup scale={0.6}>
						<Terminal screen={crossPlatformScreen} fontSize={5} padding={4} lineHeight={1.3} />
						<TmuxStatusBar {...crossPlatformStatus} />
					</LaptopMockup>
					<span
						style={{
							fontSize: 11,
							color: colours.subtext,
							fontFamily: `"${FONT_FAMILY}", monospace`,
							marginTop: 8,
							opacity: labelOpacity,
						}}
					>
						MacBook
					</span>
				</div>
			</div>

			{/* Caption */}
			<div style={{ opacity: labelOpacity, marginTop: 24 }}>
				<Caption text="Any device, anywhere" subtitle="Secured over Tailscale" appearAt={0} />
			</div>
		</AbsoluteFill>
	)
}
