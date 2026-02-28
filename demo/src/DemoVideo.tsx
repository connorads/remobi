import type React from 'react'
import { TransitionSeries, linearTiming } from '@remotion/transitions'
import { fade } from '@remotion/transitions/fade'
import { flip } from '@remotion/transitions/flip'
import { slide } from '@remotion/transitions/slide'
import { wipe } from '@remotion/transitions/wipe'
import { PhoneIntro } from './scenes/PhoneIntro'
import { SwipeDemo } from './scenes/SwipeDemo'
import { DrawerDemo } from './scenes/DrawerDemo'
import { AITools } from './scenes/AITools'
import { CrossPlatform } from './scenes/CrossPlatform'
import { Tagline } from './scenes/Tagline'

/** Frame counts at 30fps */
const FPS = 30
const TRANSITION_FRAMES = 15

/**
 * Main composition (~20s): 6 scenes with varied transitions.
 *
 * | Scene           | Duration   | Transition out        |
 * |-----------------|------------|-----------------------|
 * | Phone Intro     | 3.5s (105f)| slide from-left       |
 * | Swipe Demo      | 4s (120f)  | wipe from-bottom      |
 * | Drawer Demo     | 4s (120f)  | fade                  |
 * | AI Tools        | 2.5s (75f) | slide from-right      |
 * | Cross-Platform  | 3s (90f)   | flip                  |
 * | Tagline         | 3.5s (105f)| —                     |
 */
export const DemoVideo: React.FC = () => {
	return (
		<TransitionSeries>
			<TransitionSeries.Sequence durationInFrames={3.5 * FPS}>
				<PhoneIntro />
			</TransitionSeries.Sequence>

			<TransitionSeries.Transition
				presentation={slide({ direction: 'from-left' })}
				timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
			/>

			<TransitionSeries.Sequence durationInFrames={4 * FPS}>
				<SwipeDemo />
			</TransitionSeries.Sequence>

			<TransitionSeries.Transition
				presentation={wipe({ direction: 'from-bottom' })}
				timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
			/>

			<TransitionSeries.Sequence durationInFrames={4 * FPS}>
				<DrawerDemo />
			</TransitionSeries.Sequence>

			<TransitionSeries.Transition
				presentation={fade()}
				timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
			/>

			<TransitionSeries.Sequence durationInFrames={2.5 * FPS}>
				<AITools />
			</TransitionSeries.Sequence>

			<TransitionSeries.Transition
				presentation={slide({ direction: 'from-right' })}
				timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
			/>

			<TransitionSeries.Sequence durationInFrames={3 * FPS}>
				<CrossPlatform />
			</TransitionSeries.Sequence>

			<TransitionSeries.Transition
				presentation={flip()}
				timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
			/>

			<TransitionSeries.Sequence durationInFrames={3.5 * FPS}>
				<Tagline />
			</TransitionSeries.Sequence>
		</TransitionSeries>
	)
}
