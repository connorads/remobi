import type React from 'react'
import { AbsoluteFill, useCurrentFrame } from 'remotion'
import { Caption } from '../components/Caption'
import { DrawerOverlay } from '../components/DrawerOverlay'
import { PhoneMockup } from '../components/PhoneMockup'
import { Terminal } from '../components/Terminal'
import { TmuxStatusBar } from '../components/TmuxStatusBar'
import { TapFinger } from '../components/TouchFinger'
import { WebmuxToolbar } from '../components/WebmuxToolbar'
import { claudeCodeDetailScreen, claudeCodeDetailStatus } from '../screens'
import { colours } from '../theme'

/**
 * Scene 3: Claude Code active session — AI writing real code (6s / 180 frames)
 *
 * Timeline:
 * 0-30:    "Thinking…" shimmer, edit block appears line by line
 * 50-60:   "✓ Applied edit" appears
 * 60-80:   Response text typewriter
 * 82-84:   Finger taps ☰ More
 * 84-115:  Drawer slides up, holds open
 * 115:     Drawer closes
 * 120-132: Finger taps Esc
 * 132-180: Hold + transition
 */
export const AITools: React.FC = () => {
	const frame = useCurrentFrame()

	// Toolbar button highlight: ☰ More tap at 82, Esc tap at 120
	const highlightButton =
		frame >= 82 && frame < 86 ? '\u2630 More' : frame >= 120 && frame < 124 ? 'Esc' : undefined
	const highlightAt = frame >= 82 && frame < 86 ? 82 : frame >= 120 && frame < 124 ? 120 : 0

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
			<div style={{ transform: 'scale(0.88)', transformOrigin: 'center center' }}>
				<PhoneMockup>
					<div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column' }}>
						<Terminal screen={claudeCodeDetailScreen} />
						<TmuxStatusBar {...claudeCodeDetailStatus} />
						<WebmuxToolbar highlightButton={highlightButton} highlightAt={highlightAt} />

						{/* Finger taps ☰ More to open drawer */}
						<TapFinger tapFrame={82} position={[175, 775]} />
						{/* Finger taps Esc */}
						<TapFinger tapFrame={120} position={[25, 735]} />

						{/* Command drawer overlay */}
						<DrawerOverlay showFrame={84} hideFrame={115} />
					</div>
				</PhoneMockup>
				<Caption text="Code with AI agents" />
			</div>
		</AbsoluteFill>
	)
}
