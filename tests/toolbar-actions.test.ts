import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import { GlobalRegistrator } from '@happy-dom/global-registrator'
import { defineConfig } from '../src/config'
import { createDrawer } from '../src/drawer/drawer'
import { createHookRegistry } from '../src/hooks/registry'
import { createToolbar } from '../src/toolbar/toolbar'
import { mockTerminalWithSent } from './fixtures'

function findButtonByLabel(root: HTMLElement, label: string): HTMLButtonElement {
	const buttons = root.querySelectorAll('button')
	for (const button of buttons) {
		if (button.textContent === label) {
			return button
		}
	}
	throw new Error(`Button not found: ${label}`)
}

beforeEach(() => {
	GlobalRegistrator.register()
})

afterEach(() => {
	GlobalRegistrator.unregister()
})

describe('toolbar action behaviour', () => {
	test('paste does not consume ctrl sticky modifier', async () => {
		const term = mockTerminalWithSent()
		const hooks = createHookRegistry()
		const config = defineConfig({
			toolbar: {
				row1: [
					{
						id: 'ctrl-mod',
						label: 'Ctrl',
						description: 'Sticky Ctrl modifier for the next typed key',
						action: { type: 'ctrl-modifier' },
					},
				],
				row2: [
					{ id: 'q', label: 'q', description: 'Send q key', action: { type: 'send', data: 'q' } },
					{
						id: 'paste',
						label: 'Paste',
						description: 'Paste from clipboard',
						action: { type: 'paste' },
					},
				],
			},
		})
		const drawer = createDrawer(term, config.drawer.buttons, {
			hooks,
			appConfig: config,
		})
		const { element: toolbar } = createToolbar(term, config, drawer.open, hooks)

		Object.defineProperty(navigator, 'clipboard', {
			value: {
				readText: async () => 'abc',
			},
			configurable: true,
		})

		document.body.appendChild(toolbar)

		findButtonByLabel(toolbar, 'Ctrl').click()
		findButtonByLabel(toolbar, 'Paste').click()
		await new Promise((resolve) => setTimeout(resolve, 0))
		findButtonByLabel(toolbar, 'q').click()
		await new Promise((resolve) => setTimeout(resolve, 0))

		expect(term.sent).toEqual(['abc', '\x11'])
	})
})
