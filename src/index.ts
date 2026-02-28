import { createDefaultActionRegistry } from './actions/registry'
import { defaultConfig } from './config'
import { createComboPicker } from './controls/combo-picker'
import { createFloatingButtons } from './controls/floating-buttons'
import { createFontControls } from './controls/font-size'
import { createHelpOverlay } from './controls/help'
import { createScrollButtons } from './controls/scroll-buttons'
import { createDrawer } from './drawer/drawer'
import { createGestureLock } from './gestures/lock'
import { attachPinchGestures } from './gestures/pinch'
import { attachScrollGesture } from './gestures/scroll'
import { attachSwipeGestures } from './gestures/swipe'
import { createHookRegistry } from './hooks/registry'
import type { HookRegistry } from './hooks/registry'
import { createPluginManager } from './plugins/manager'
import type { WebmuxPlugin } from './plugins/manager'
import { createUIContributionCollector } from './plugins/ui-contributions'
import { applyTheme } from './theme/apply'
import { createToolbar } from './toolbar/toolbar'
import type { WebmuxConfig } from './types'
import { resizeTerm, sendData, waitForTerm } from './util/terminal'
import { initHeightManager } from './viewport/height'

// Re-export for package consumers
export { defineConfig } from './config'
export { createHookRegistry }
export type {
	WebmuxConfig,
	WebmuxConfigOverrides,
	ButtonAction,
	ButtonArrayInput,
	ControlButton,
	TermTheme,
	FloatingButtonGroup,
	FloatingPosition,
	FloatingDirection,
} from './types'
export type { HookRegistry, SendSource } from './hooks/registry'
export type { WebmuxPlugin } from './plugins/manager'
export type { UISlot, UIContributionCollector } from './plugins/ui-contributions'

/** Detect touch device */
function isMobile(): boolean {
	return 'ontouchstart' in window || navigator.maxTouchPoints > 0
}

/**
 * Initialise the webmux overlay.
 * Called automatically when loaded in a browser (via the IIFE in build output).
 * Config is embedded at build time.
 */
export function init(
	config: WebmuxConfig = defaultConfig,
	hooks: HookRegistry = createHookRegistry(),
	plugins: readonly WebmuxPlugin[] = [],
): void {
	void waitForTerm()
		.then(async (term) => {
			const mobile = isMobile()
			const actions = createDefaultActionRegistry()
			const uiContributions = createUIContributionCollector()
			const pluginsManager = createPluginManager(plugins)
			let disposed = false

			function disposePlugins(): void {
				if (disposed) return
				disposed = true
				window.removeEventListener('pagehide', onPageHide)
				void pluginsManager.dispose()
			}

			function onPageHide(event: PageTransitionEvent): void {
				if (event.persisted) return
				disposePlugins()
			}

			window.addEventListener('beforeunload', disposePlugins, { once: true })
			window.addEventListener('pagehide', onPageHide)

			await pluginsManager.init({
				term,
				config,
				hooks,
				actions,
				mobile,
				ui: uiContributions,
			})

			try {
				await hooks.runOverlayInitStart({ term, config, mobile })

				// Resize after fonts load
				document.fonts.ready.then(() => resizeTerm())

				document.title = `${config.name} · ${location.hostname.replace(/\..*/, '')}`

				if (!mobile) {
					await hooks.runOverlayReady({ term, config, mobile })
					return
				}

				// Apply theme and font
				applyTheme(term, config.theme)
				term.options.fontSize = config.font.mobileSizeDefault
				term.options.fontFamily = config.font.family
				resizeTerm()

				// CSS is injected as a <style> tag by the build script (build.ts)

				// Merge plugin UI contributions into the active config
				const activeRow1 = [...config.toolbar.row1, ...uiContributions.getForSlot('toolbar.row1')]
				const activeRow2 = [...config.toolbar.row2, ...uiContributions.getForSlot('toolbar.row2')]
				const activeDrawerButtons = [
					...config.drawer.buttons,
					...uiContributions.getForSlot('drawer'),
				]
				const activeConfig = {
					...config,
					toolbar: { row1: activeRow1, row2: activeRow2 },
					drawer: { buttons: activeDrawerButtons },
				}

				const comboPicker = createComboPicker()
				document.body.appendChild(comboPicker.element)

				// Create drawer (needed by toolbar for toggle)
				const drawer = createDrawer(term, activeConfig.drawer.buttons, {
					hooks,
					appConfig: config,
					actions,
					openComboPicker: comboPicker.open,
				})
				document.body.appendChild(drawer.backdrop)
				document.body.appendChild(drawer.drawer)
				await hooks.runDrawerCreated({
					term,
					config,
					drawer: drawer.drawer,
					backdrop: drawer.backdrop,
				})

				// Create toolbar
				const { element: toolbar } = createToolbar(
					term,
					activeConfig,
					drawer.open,
					hooks,
					actions,
					comboPicker.open,
				)
				document.body.appendChild(toolbar)
				await hooks.runToolbarCreated({ term, config, toolbar })

				// Font controls + help
				const { element: fontControls, helpButton } = createFontControls(term, config.font)
				document.body.appendChild(fontControls)

				// Floating button groups (always visible on touch devices)
				if (config.floatingButtons.length > 0) {
					const { elements: floatingEls } = createFloatingButtons(
						term,
						config.floatingButtons,
						config,
						hooks,
						actions,
						drawer.open,
						comboPicker.open,
					)
					for (const floatingEl of floatingEls) {
						document.body.appendChild(floatingEl)
					}
				}

				// Scroll buttons
				const { element: scrollButtons } = createScrollButtons(term, config.gestures.scroll)
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

				// Mobile init data: send once on load if viewport is narrow enough.
				// Already inside isMobile() guard (touch detection). widthThreshold adds a
				// second filter — a wide-viewport touch device (e.g. landscape tablet) may
				// not want mobile init behaviour.
				if (config.mobile.initData !== null && window.innerWidth < config.mobile.widthThreshold) {
					const data = config.mobile.initData
					const before = await hooks.runBeforeSendData({
						term,
						config,
						source: 'mobile-init',
						actionType: 'send',
						kbWasOpen: false,
						data,
					})
					if (!before.blocked) {
						sendData(term, before.data)
						await hooks.runAfterSendData({
							term,
							config,
							source: 'mobile-init',
							actionType: 'send',
							kbWasOpen: false,
							data: before.data,
						})
					}
				}

				// Help overlay should never break core controls.
				try {
					const { element: helpOverlay } = createHelpOverlay(term, helpButton, config)
					document.body.appendChild(helpOverlay)
				} catch (error) {
					console.error('webmux: failed to initialise help overlay', error)
				}

				await hooks.runOverlayReady({ term, config, mobile })
			} catch (error) {
				disposePlugins()
				throw error
			}
		})
		.catch((error) => {
			console.error('webmux: failed to initialise overlay', error)
		})
}
