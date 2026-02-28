import type React from 'react'
import { AbsoluteFill, useCurrentFrame } from 'remotion'
import { Caption } from '../components/Caption'
import { PhoneMockup } from '../components/PhoneMockup'
import { Terminal } from '../components/Terminal'
import { TmuxStatusBar } from '../components/TmuxStatusBar'
import { TapFinger } from '../components/TouchFinger'
import { WebmuxToolbar } from '../components/WebmuxToolbar'
import { claudeCodeDetailScreen, claudeCodeDetailStatus } from '../screens'
import { colours } from '../theme'

/**
 * Scene 4: Claude Code active session — coloured diffs, toolbar interaction (3s / 90 frames)
 *
 * Timeline:
 * 0-30:  Terminal content appears line by line (appearAt in screen data)
 * 30:    Finger taps ↓ arrow
 * 55:    Finger taps Esc
 * 55-90: Rest of terminal content
 */
export const AITools: React.FC = () => {
	const frame = useCurrentFrame()

	// Determine which button is highlighted based on frame
	const highlightButton = frame >= 30 && frame < 34 ? '\u2193' : frame >= 55 && frame < 59 ? 'Esc' : undefined
	const highlightAt = frame >= 30 && frame < 34 ? 30 : frame >= 55 && frame < 59 ? 55 : 0

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
			<div>
				<PhoneMockup>
					<div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column' }}>
						<Terminal screen={claudeCodeDetailScreen} />
						<TmuxStatusBar {...claudeCodeDetailStatus} />
						<WebmuxToolbar highlightButton={highlightButton} highlightAt={highlightAt} />

						{/* Finger taps ↓ arrow (row 1, position ~6th button) */}
						<TapFinger tapFrame={30} position={[245, 735]} />
						{/* Finger taps Esc (row 1, 1st button) */}
						<TapFinger tapFrame={55} position={[25, 735]} />
					</div>
				</PhoneMockup>
				<Caption text="Code with AI agents" />
			</div>
		</AbsoluteFill>
	)
}
