import React from 'react'
import { Composition, continueRender, delayRender } from 'remotion'
import { DemoVideo } from './DemoVideo'
import { fontsLoaded } from './fonts'

const FPS = 30

/**
 * Total duration: 6 scenes × durations − 5 transitions × 15 frames overlap
 * = (90 + 120 + 120 + 90 + 90 + 90) - (5 × 15)
 * = 600 - 75 = 525 frames (~17.5s)
 */
const TOTAL_FRAMES = 525

/** Wrapper that delays rendering until fonts are loaded */
const DemoVideoWithFonts: React.FC = () => {
	const [handle] = React.useState(() => delayRender('Loading fonts'))

	React.useEffect(() => {
		fontsLoaded.then(() => continueRender(handle))
	}, [handle])

	return <DemoVideo />
}

export const RemotionRoot: React.FC = () => {
	return (
		<Composition
			id="DemoVideo"
			component={DemoVideoWithFonts}
			durationInFrames={TOTAL_FRAMES}
			fps={FPS}
			width={390}
			height={844}
		/>
	)
}
