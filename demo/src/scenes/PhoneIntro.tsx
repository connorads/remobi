import type React from 'react'
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion'
import { Caption } from '../components/Caption'
import { PhoneMockup } from '../components/PhoneMockup'
import { Terminal } from '../components/Terminal'
import { TmuxStatusBar } from '../components/TmuxStatusBar'
import { WebmuxToolbar } from '../components/WebmuxToolbar'
import { shellScreen, shellStatus } from '../screens'
import { CONFIDENT } from '../springs'
import { colours } from '../theme'

/** Scene 1: Phone springs in, terminal typing, toolbar visible (5s / 150 frames) */
export const PhoneIntro: React.FC = () => {
	const frame = useCurrentFrame()
	const { fps } = useVideoConfig()

	// Phone slides up from bottom — confident spring, no wobble
	const entrance = spring({
		frame,
		fps,
		config: CONFIDENT,
	})
	const translateY = interpolate(entrance, [0, 1], [300, 0])

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
			<div style={{ transform: `translateY(${translateY}px) scale(0.88)`, transformOrigin: 'center center' }}>
				<PhoneMockup>
					<div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column' }}>
						<Terminal screen={shellScreen} />
						<TmuxStatusBar {...shellStatus} />
						<WebmuxToolbar />
					</div>
				</PhoneMockup>
				<Caption text="Your server in your pocket" />
			</div>
		</AbsoluteFill>
	)
}
