import type React from 'react'
import { Composition } from 'remotion'
import { DemoVideo, FPS, TOTAL_FRAMES } from './DemoVideo'

export const RemotionRoot: React.FC = () => {
	return (
		<Composition
			id="DemoVideo"
			component={DemoVideo}
			durationInFrames={TOTAL_FRAMES}
			fps={FPS}
			width={390}
			height={844}
		/>
	)
}
