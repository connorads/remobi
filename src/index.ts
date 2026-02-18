import { defaultConfig } from './config'
import { createFontControls } from './controls/font-size'
import { createHelpOverlay } from './controls/help'
import { createScrollButtons } from './controls/scroll-buttons'
import { createDrawer } from './drawer/drawer'
import { createGestureLock } from './gestures/lock'
import { attachPinchGestures } from './gestures/pinch'
import { attachScrollGesture } from './gestures/scroll'
import { attachSwipeGestures } from './gestures/swipe'
import { applyTheme } from './theme/apply'
import { createToolbar } from './toolbar/toolbar'
import type { WebmuxConfig } from './types'
import { resizeTerm, waitForTerm } from './util/terminal'
import { initHeightManager } from './viewport/height'

// Re-export for package consumers
export { defineConfig } from './config'
export type { WebmuxConfig, ButtonAction, ButtonDef, DrawerCommand, TermTheme } from './types'

/** Detect touch device */
function isMobile(): boolean {
	return 'ontouchstart' in window || navigator.maxTouchPoints > 0
}

/**
 * Initialise the webmux overlay.
 * Called automatically when loaded in a browser (via the IIFE in build output).
 * Config is embedded at build time.
 */
export function init(config: WebmuxConfig = defaultConfig): void {
	waitForTerm().then((term) => {
		// Resize after fonts load
		document.fonts.ready.then(() => resizeTerm())

		document.title = `webmux · ${location.hostname.replace(/\..*/, '')}`

		if (!isMobile()) return

		// Apply theme and font
		applyTheme(term, config.theme)
		term.options.fontSize = config.font.mobileSizeDefault
		term.options.fontFamily = config.font.family
		resizeTerm()

		// CSS is injected as a <style> tag by the build script (build.ts)

		// Create drawer (needed by toolbar for toggle)
		const drawer = createDrawer(term, config.drawer.commands)
		document.body.appendChild(drawer.backdrop)
		document.body.appendChild(drawer.drawer)

		// Create toolbar
		const { element: toolbar } = createToolbar(term, config, drawer.open)
		document.body.appendChild(toolbar)

		// Font controls + help
		const { element: fontControls, helpButton } = createFontControls(term, config.font)
		document.body.appendChild(fontControls)

		const { element: helpOverlay } = createHelpOverlay(term, helpButton)
		document.body.appendChild(helpOverlay)

		// Scroll buttons
		const { element: scrollButtons } = createScrollButtons(term)
		document.body.appendChild(scrollButtons)

		// Gestures
		const gestureLock = createGestureLock()
		if (config.gestures.swipe.enabled) {
			const indicator = attachSwipeGestures(term, config.gestures.swipe, drawer.isOpen)
			document.body.appendChild(indicator)
		}
		if (config.gestures.pinch.enabled) {
			attachPinchGestures(term, config.font, gestureLock)
		}
		if (config.gestures.scroll.enabled) {
			attachScrollGesture(term, config.gestures.scroll, gestureLock, drawer.isOpen)
		}

		// Height management
		initHeightManager(toolbar)
	})
}
