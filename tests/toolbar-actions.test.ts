import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { GlobalRegistrator } from '@happy-dom/global-registrator'
import { defaultConfig } from '../src/config'
import { createDrawer } from '../src/drawer/drawer'
import { createHookRegistry } from '../src/hooks/registry'
import { createToolbar } from '../src/toolbar/toolbar'
import type { XTerminal } from '../src/types'

interface MockTerm extends XTerminal {
	readonly sent: string[]
}

function mockTerminal(): MockTerm {
	const sent: string[] = []
	return {
		sent,
		options: { fontSize: 14 },
		input(data: string, _wasUserInput: boolean) {
			sent.push(data)
		},
		focus() {},
		onData(_handler: (data: string) => void) {
			return { dispose() {} }
		},
	}
}

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
		const term = mockTerminal()
		const hooks = createHookRegistry()
		const drawer = createDrawer(term, defaultConfig.drawer.buttons, {
			hooks,
			appConfig: defaultConfig,
		})
		const { element: toolbar } = createToolbar(term, defaultConfig, drawer.open, hooks)

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
