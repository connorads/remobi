import { TransitionSeries, springTiming } from '@remotion/transitions'
import { fade } from '@remotion/transitions/fade'
import { wipe } from '@remotion/transitions/wipe'
import type React from 'react'
import { AITools } from './scenes/AITools'
import { PhoneIntro } from './scenes/PhoneIntro'
import { SwipeDemo } from './scenes/SwipeDemo'
import { Tagline } from './scenes/Tagline'
import { SMOOTH } from './springs'

/** Frame counts at 30fps */
export const FPS = 30
export const TRANSITION_FRAMES = 15

/** Scene durations in seconds — order matches TransitionSeries below */
export const SCENE_DURATIONS_S = [5, 6, 6, 4] as const

/** Total frames accounting for overlapping transitions */
export const TOTAL_FRAMES =
	SCENE_DURATIONS_S.reduce((sum, s) => sum + s * FPS, 0) -
	(SCENE_DURATIONS_S.length - 1) * TRANSITION_FRAMES

/**
 * Main composition (~19.5s): 4 scenes, organic spring transitions.
 *
 * | Scene       | Duration    | Transition out     |
 * |-------------|-------------|--------------------|
 * | Phone Intro | 5s (150f)   | fade               |
 * | Swipe Demo  | 6s (180f)   | wipe from-bottom   |
 * | AI Tools    | 6s (180f)   | fade               |
 * | Tagline     | 4s (120f)   | —                  |
 */
export const DemoVideo: React.FC = () => {
	return (
		<TransitionSeries>
			{/* Scene 1: The Hook — phone arrives, terminal comes alive */}
			<TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS_S[0] * FPS}>
				<PhoneIntro />
			</TransitionSeries.Sequence>

			<TransitionSeries.Transition
				presentation={fade()}
				timing={springTiming({ config: SMOOTH, durationInFrames: TRANSITION_FRAMES })}
			/>

			{/* Scene 2: The Magic — one deliberate swipe */}
			<TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS_S[1] * FPS}>
				<SwipeDemo />
			</TransitionSeries.Sequence>

			<TransitionSeries.Transition
				presentation={wipe({ direction: 'from-bottom' })}
				timing={springTiming({ config: SMOOTH, durationInFrames: TRANSITION_FRAMES })}
			/>

			{/* Scene 3: The Power — Claude Code writing real code */}
			<TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS_S[2] * FPS}>
				<AITools />
			</TransitionSeries.Sequence>

			<TransitionSeries.Transition
				presentation={fade()}
				timing={springTiming({ config: SMOOTH, durationInFrames: TRANSITION_FRAMES })}
			/>

			{/* Scene 4: The Close — logo, tagline, hold */}
			<TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS_S[3] * FPS}>
				<Tagline />
			</TransitionSeries.Sequence>
		</TransitionSeries>
	)
}
