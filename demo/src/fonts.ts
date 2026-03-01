/**
 * Load JetBrains Mono for consistent terminal rendering.
 * Uses @remotion/fonts to load local woff2 files from public/.
 * Blocks Remotion render until fonts are ready (prevents FOUT).
 */
import { loadFont } from '@remotion/fonts'
import { continueRender, delayRender, staticFile } from 'remotion'

export const FONT_FAMILY = 'JetBrains Mono'

const waitForFonts = delayRender('Loading JetBrains Mono')

Promise.all([
	loadFont({
		family: FONT_FAMILY,
		url: staticFile('JetBrainsMono-Regular.woff2'),
		weight: '400',
	}),
	loadFont({
		family: FONT_FAMILY,
		url: staticFile('JetBrainsMono-Bold.woff2'),
		weight: '700',
	}),
])
	.then(() => continueRender(waitForFonts))
	.catch((err) => {
		console.error('Font load failed:', err)
		continueRender(waitForFonts)
	})
