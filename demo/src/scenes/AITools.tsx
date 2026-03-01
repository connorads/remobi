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
 * Scene 3: Claude Code active session — AI writing real code (5s / 150 frames)
 *
 * Timeline:
 * 0-30:    "Thinking…" shimmer, edit block appears line by line
 * 50-60:   "✓ Applied edit" appears
 * 60-80:   Response text typewriter
 * 80-95:   Input prompt appears. Finger taps ↓ (frame 85)
 * 95-110:  Finger taps Esc (frame 100)
 * 110-130: Hold — viewer sees complete Claude Code session
 * 130-150: Transition begins
 */
export const AITools: React.FC = () => {
	const frame = useCurrentFrame()

	// Toolbar button highlight based on frame
	const highlightButton =
		frame >= 85 && frame < 89 ? '\u2193' : frame >= 100 && frame < 104 ? 'Esc' : undefined
	const highlightAt = frame >= 85 && frame < 89 ? 85 : frame >= 100 && frame < 104 ? 100 : 0

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
						<TapFinger tapFrame={85} position={[245, 735]} />
						{/* Finger taps Esc (row 1, 1st button) */}
						<TapFinger tapFrame={100} position={[25, 735]} />
					</div>
				</PhoneMockup>
				<Caption text="Code with AI agents" />
			</div>
		</AbsoluteFill>
	)
}
