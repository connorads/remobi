import { GlobalRegistrator } from '@happy-dom/global-registrator'
import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import { createDefaultActionRegistry } from '../src/actions/registry'
import { defaultConfig } from '../src/config'
import { createFloatingButtons } from '../src/controls/floating-buttons'
import { createFontControls } from '../src/controls/font-size'
import { createHelpOverlay } from '../src/controls/help'
import { createDrawer } from '../src/drawer/drawer'
import { createHookRegistry } from '../src/hooks/registry'
import { createToolbar } from '../src/toolbar/toolbar'
import { _resetTouchGuard } from '../src/util/tap'
import { mockTerminal } from './fixtures'

beforeEach(() => {
	GlobalRegistrator.register()
})

afterEach(() => {
	GlobalRegistrator.unregister()
})

describe('toolbar integration', () => {
	test('creates toolbar with two rows', () => {
		const term = mockTerminal()
		const hooks = createHookRegistry()
		const drawer = createDrawer(term, defaultConfig.drawer.buttons, {
			hooks,
			appConfig: defaultConfig,
		})
		const { element: toolbar } = createToolbar(term, defaultConfig, drawer.open, hooks)

		document.body.appendChild(toolbar)

		expect(toolbar.id).toBe('wt-toolbar')
		const rows = toolbar.querySelectorAll('.wt-row')
		expect(rows).toHaveLength(2)
	})

	test('row1 has correct number of buttons', () => {
		const term = mockTerminal()
		const hooks = createHookRegistry()
		const drawer = createDrawer(term, defaultConfig.drawer.buttons, {
			hooks,
			appConfig: defaultConfig,
		})
		const { element: toolbar } = createToolbar(term, defaultConfig, drawer.open, hooks)

		document.body.appendChild(toolbar)

		const row1 = toolbar.querySelector('.wt-row')
		const buttons = row1?.querySelectorAll('button')
		expect(buttons?.length).toBe(defaultConfig.toolbar.row1.length)
	})

	test('row2 has correct number of buttons', () => {
		const term = mockTerminal()
		const hooks = createHookRegistry()
		const drawer = createDrawer(term, defaultConfig.drawer.buttons, {
			hooks,
			appConfig: defaultConfig,
		})
		const { element: toolbar } = createToolbar(term, defaultConfig, drawer.open, hooks)

		document.body.appendChild(toolbar)

		const rows = toolbar.querySelectorAll('.wt-row')
		const row2 = rows[1]
		const buttons = row2?.querySelectorAll('button')
		expect(buttons?.length).toBe(defaultConfig.toolbar.row2.length)
	})
})

describe('drawer integration', () => {
	test('renders all commands as buttons', () => {
		const term = mockTerminal()
		const { drawer } = createDrawer(term, defaultConfig.drawer.buttons, {
			hooks: createHookRegistry(),
			appConfig: defaultConfig,
		})

		document.body.appendChild(drawer)

		const grid = drawer.querySelector('#wt-drawer-grid')
		const buttons = grid?.querySelectorAll('button')
		expect(buttons?.length).toBe(defaultConfig.drawer.buttons.length)
	})

	test('open/close toggles state', () => {
		const term = mockTerminal()
		const result = createDrawer(term, defaultConfig.drawer.buttons, {
			hooks: createHookRegistry(),
			appConfig: defaultConfig,
		})

		document.body.appendChild(result.backdrop)
		document.body.appendChild(result.drawer)

		expect(result.isOpen()).toBe(false)

		result.open()
		expect(result.isOpen()).toBe(true)
		expect(result.drawer.classList.contains('open')).toBe(true)

		result.close()
		expect(result.isOpen()).toBe(false)
		expect(result.drawer.classList.contains('open')).toBe(false)
	})

	test('has no tab bar', () => {
		const term = mockTerminal()
		const { drawer } = createDrawer(term, defaultConfig.drawer.buttons, {
			hooks: createHookRegistry(),
			appConfig: defaultConfig,
		})

		document.body.appendChild(drawer)

		const tabs = drawer.querySelector('#wt-drawer-tabs')
		expect(tabs).toBeNull()
	})
})

describe('font controls integration', () => {
	test('creates three buttons (-, +, ?)', () => {
		const term = mockTerminal()
		const { element } = createFontControls(term, defaultConfig.font)

		document.body.appendChild(element)

		const buttons = element.querySelectorAll('button')
		expect(buttons).toHaveLength(3)
	})

	test('returns help button reference', () => {
		const term = mockTerminal()
		const { helpButton } = createFontControls(term, defaultConfig.font)
		expect(helpButton.textContent).toBe('?')
	})
})

describe('help overlay integration', () => {
	beforeEach(() => {
		_resetTouchGuard()
	})

	test('creates help overlay', () => {
		const term = mockTerminal()
		const { helpButton } = createFontControls(term, defaultConfig.font)
		const { element } = createHelpOverlay(term, helpButton, defaultConfig)

		document.body.appendChild(element)

		expect(element.id).toBe('wt-help')
		expect(element.innerHTML).toContain('Drawer Buttons')
		expect(element.innerHTML).toContain('Gestures')
	})

	test('shows version when provided', () => {
		const term = mockTerminal()
		const { helpButton } = createFontControls(term, defaultConfig.font)
		const { element } = createHelpOverlay(term, helpButton, defaultConfig, '1.2.3')

		document.body.appendChild(element)

		const versionEl = element.querySelector('.wt-help-version')
		expect(versionEl).not.toBeNull()
		expect(versionEl?.textContent).toBe('remobi v1.2.3')
	})

	test('shows dev version with hash', () => {
		const term = mockTerminal()
		const { helpButton } = createFontControls(term, defaultConfig.font)
		const { element } = createHelpOverlay(term, helpButton, defaultConfig, '0.2.6-dev+abc1234')

		expect(element.innerHTML).toContain('remobi v0.2.6-dev+abc1234')
	})

	test('omits version when not provided', () => {
		const term = mockTerminal()
		const { helpButton } = createFontControls(term, defaultConfig.font)
		const { element } = createHelpOverlay(term, helpButton, defaultConfig)

		expect(element.querySelector('.wt-help-version')).toBeNull()
	})

	test('synthesised click after touchend does not immediately close overlay', () => {
		const term = mockTerminal()
		const { element: fontControls, helpButton } = createFontControls(term, defaultConfig.font)
		const { element: overlay } = createHelpOverlay(term, helpButton, defaultConfig)

		document.body.appendChild(fontControls)
		document.body.appendChild(overlay)

		// Simulate touch on ? button — touchend opens the overlay
		helpButton.dispatchEvent(new Event('touchend', { bubbles: true }))
		expect(overlay.style.display).toBe('block')

		// Browser synthesises click ~4ms later. On a real device the overlay
		// (higher z-index) now covers the ? button area, so hit-testing targets
		// the overlay element itself. Simulate this by dispatching click on the
		// overlay with target === overlay.
		overlay.dispatchEvent(new Event('click', { bubbles: true }))

		// Overlay should still be open — the synthesised click must be ignored
		expect(overlay.style.display).toBe('block')
	})

	test('renders configured button descriptions and no stale Claude section', () => {
		const term = mockTerminal()
		const { helpButton } = createFontControls(term, defaultConfig.font)
		const config = {
			...defaultConfig,
			toolbar: {
				...defaultConfig.toolbar,
				row1: [
					{
						id: 'custom-esc',
						label: '<Esc>',
						description: 'Custom escape label',
						action: { type: 'send' as const, data: '\x1b' },
					},
				],
			},
		}
		const { element } = createHelpOverlay(term, helpButton, config)

		expect(element.innerHTML).toContain('Custom escape label')
		expect(element.innerHTML).toContain('&lt;Esc&gt;')
		expect(element.innerHTML).not.toContain('Claude Drawer Commands')
	})
})

describe('build output', () => {
	test('inline script contains no HTML-breaking < chars', async () => {
		const { renderClientHtml } = await import('../build')
		const js = 'var x = "\\x1b[<64;1;1M"; var y = "</script>"'
		const result = renderClientHtml(js, '', defaultConfig, 'test-nonce')

		const scriptMatch = result.match(/<script nonce="test-nonce">([\s\S]*?)<\/script>/)
		const scriptContent = scriptMatch?.[1] ?? ''
		// No < followed by a letter or / inside the script (would break HTML parsing)
		const dangerousLt = scriptContent.match(/<(?=[a-zA-Z/])/g)
		expect(dangerousLt).toBeNull()
	})

	test('JS containing $& is not corrupted by replacement patterns', async () => {
		const { renderClientHtml } = await import('../build')
		const js = 'String.fromCharCode($&31)'
		const result = renderClientHtml(js, '', defaultConfig, 'test-nonce')

		expect(result).toContain('String.fromCharCode($&31)')
	})

	test('renderClientHtml produces valid HTML with terminal shell', async () => {
		const { renderClientHtml } = await import('../build')
		const js = 'console.log("test")'
		const css = 'body { color: red; }'

		const result = renderClientHtml(js, css, defaultConfig, 'test-nonce')

		expect(result).toContain('<style>')
		expect(result).toContain('<script nonce="test-nonce">')
		expect(result).toContain('viewport')
		expect(result).toContain('jetbrainsmono-nfm.css')
		expect(result).toContain('<link rel="stylesheet"')
		expect(result).toContain('id="terminal-container"')
		expect(result).toContain('id="terminal"')
	})

	test('renderClientHtml includes PWA tags when pwa.enabled', async () => {
		const { renderClientHtml } = await import('../build')

		const result = renderClientHtml('', '', defaultConfig, 'test-nonce')

		expect(result).toContain('rel="manifest"')
		expect(result).toContain('href="/manifest.json"')
		expect(result).toContain('apple-touch-icon')
		expect(result).toContain('theme-color')
	})

	test('renderClientHtml omits PWA tags when pwa.enabled is false', async () => {
		const { renderClientHtml } = await import('../build')
		const { defineConfig } = await import('../src/config')
		const config = defineConfig({ pwa: { enabled: false } })

		const result = renderClientHtml('', '', config, 'test-nonce')

		expect(result).not.toContain('rel="manifest"')
		expect(result).not.toContain('apple-touch-icon')
	})
})

describe('floating buttons integration', () => {
	test('renders one element per group, buttons within each group', () => {
		const term = mockTerminal()
		const hooks = createHookRegistry()
		const actions = createDefaultActionRegistry()
		const config = {
			...defaultConfig,
			floatingButtons: [
				{
					position: 'top-left' as const,
					buttons: [
						{
							id: 'zoom',
							label: 'Zoom',
							description: 'Toggle pane zoom',
							action: { type: 'send' as const, data: '\x02z' },
						},
						{
							id: 'next',
							label: '›',
							description: 'Next pane',
							action: { type: 'send' as const, data: '\x02]' },
						},
					],
				},
			],
		}

		const { elements } = createFloatingButtons(term, config.floatingButtons, config, hooks, actions)
		expect(elements).toHaveLength(1)
		const el = elements[0] as HTMLDivElement
		document.body.appendChild(el)

		expect(el.classList.contains('wt-floating-group')).toBe(true)
		expect(el.classList.contains('wt-floating-top-left')).toBe(true)
		const buttons = el.querySelectorAll('button')
		expect(buttons).toHaveLength(2)
		expect(buttons[0]?.textContent).toBe('Zoom')
		expect(buttons[1]?.textContent).toBe('›')
	})

	test('multiple groups produce multiple elements', () => {
		const term = mockTerminal()
		const hooks = createHookRegistry()
		const actions = createDefaultActionRegistry()
		const config = {
			...defaultConfig,
			floatingButtons: [
				{
					position: 'top-left' as const,
					buttons: [
						{
							id: 'zoom',
							label: 'Zoom',
							description: 'Toggle pane zoom',
							action: { type: 'send' as const, data: '\x02z' },
						},
					],
				},
				{
					position: 'bottom-right' as const,
					direction: 'column' as const,
					buttons: [
						{
							id: 'next',
							label: '›',
							description: 'Next pane',
							action: { type: 'send' as const, data: '\x02]' },
						},
					],
				},
			],
		}

		const { elements } = createFloatingButtons(term, config.floatingButtons, config, hooks, actions)
		expect(elements).toHaveLength(2)
		expect(elements[0]?.classList.contains('wt-floating-top-left')).toBe(true)
		expect(elements[1]?.classList.contains('wt-floating-bottom-right')).toBe(true)
		expect(elements[1]?.classList.contains('wt-floating-column')).toBe(true)
	})

	test('group without direction has no column class', () => {
		const term = mockTerminal()
		const hooks = createHookRegistry()
		const actions = createDefaultActionRegistry()
		const config = {
			...defaultConfig,
			floatingButtons: [
				{
					position: 'top-right' as const,
					buttons: [],
				},
			],
		}

		const { elements } = createFloatingButtons(term, config.floatingButtons, config, hooks, actions)
		expect(elements[0]?.classList.contains('wt-floating-column')).toBe(false)
	})

	test('drawer-toggle button calls openDrawer', async () => {
		const term = mockTerminal()
		const hooks = createHookRegistry()
		const actions = createDefaultActionRegistry()
		const config = {
			...defaultConfig,
			floatingButtons: [
				{
					position: 'top-left' as const,
					buttons: [
						{
							id: 'more',
							label: '☰',
							description: 'Open drawer',
							action: { type: 'drawer-toggle' as const },
						},
					],
				},
			],
		}

		let drawerOpened = false
		const openDrawer = () => {
			drawerOpened = true
		}

		const { elements } = createFloatingButtons(
			term,
			config.floatingButtons,
			config,
			hooks,
			actions,
			openDrawer,
		)
		document.body.appendChild(elements[0] as HTMLDivElement)

		const button = elements[0]?.querySelector('button') as HTMLButtonElement
		button.click()
		await new Promise((resolve) => setTimeout(resolve, 0))

		expect(drawerOpened).toBe(true)
	})

	test('single group shows "Floating Buttons" in help overlay', () => {
		const term = mockTerminal()
		const { helpButton } = createFontControls(term, defaultConfig.font)
		const config = {
			...defaultConfig,
			floatingButtons: [
				{
					position: 'top-left' as const,
					buttons: [
						{
							id: 'zoom',
							label: 'Zoom',
							description: 'Toggle pane zoom',
							action: { type: 'send' as const, data: '\x02z' },
						},
					],
				},
			],
		}
		const { element } = createHelpOverlay(term, helpButton, config)

		expect(element.innerHTML).toContain('Floating Buttons')
		expect(element.innerHTML).not.toContain('(top-left)')
		expect(element.innerHTML).toContain('Toggle pane zoom')
	})

	test('multiple groups show position label in help overlay', () => {
		const term = mockTerminal()
		const { helpButton } = createFontControls(term, defaultConfig.font)
		const config = {
			...defaultConfig,
			floatingButtons: [
				{
					position: 'top-left' as const,
					buttons: [
						{
							id: 'zoom',
							label: 'Zoom',
							description: 'Toggle pane zoom',
							action: { type: 'send' as const, data: '\x02z' },
						},
					],
				},
				{
					position: 'bottom-right' as const,
					buttons: [
						{
							id: 'next',
							label: '›',
							description: 'Next pane',
							action: { type: 'send' as const, data: '\x02]' },
						},
					],
				},
			],
		}
		const { element } = createHelpOverlay(term, helpButton, config)

		expect(element.innerHTML).toContain('Floating Buttons (top-left)')
		expect(element.innerHTML).toContain('Floating Buttons (bottom-right)')
	})

	test('help overlay has no floating buttons section when unconfigured', () => {
		const term = mockTerminal()
		const { helpButton } = createFontControls(term, defaultConfig.font)
		const { element } = createHelpOverlay(term, helpButton, defaultConfig)

		expect(element.innerHTML).not.toContain('Floating Buttons')
	})
})
