/**
 * Touch-only interaction tests that reproduce GitHub issue #19:
 * buttons don't respond to taps on iPhone Safari.
 *
 * iOS Safari can fail to synthesise `click` after touch events on
 * dynamically created elements. We simulate this by dispatching only
 * touchend (via dispatchEvent) — no click follows. Buttons with only
 * click listeners will fail; buttons with touchend listeners will work.
 *
 * Playwright's tap() always dispatches touch + click, so it can't
 * reproduce the bug. dispatchEvent('touchend') is the key.
 */
import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
	await page.goto('/')
	await page.waitForSelector('#wt-toolbar', { timeout: 10_000 })
})

test('drawer toggle responds to touchend-only (no click)', async ({ page }) => {
	const toggle = page.locator('#wt-toolbar button', { hasText: 'More' })
	await expect(toggle).toBeVisible()

	// Dispatch only touchend — simulates iOS Safari not firing click
	await toggle.dispatchEvent('touchend', {
		touches: [],
		changedTouches: [],
		targetTouches: [],
	})

	const drawer = page.locator('#wt-drawer')
	await expect(drawer).toHaveClass(/open/)
})

test('drawer button responds to touchend-only', async ({ page }) => {
	// Open drawer via tap() (known working method) to set up state
	const toggle = page.locator('#wt-toolbar button', { hasText: 'More' })
	await toggle.tap()
	await expect(page.locator('#wt-drawer')).toHaveClass(/open/)

	// Dispatch touchend on a drawer button — should close drawer
	const drawerButton = page.locator('#wt-drawer-grid button').first()
	await expect(drawerButton).toBeVisible()
	await drawerButton.dispatchEvent('touchend', {
		touches: [],
		changedTouches: [],
		targetTouches: [],
	})

	await expect(page.locator('#wt-drawer')).not.toHaveClass(/open/)
})

test('backdrop responds to touchend-only', async ({ page }) => {
	const toggle = page.locator('#wt-toolbar button', { hasText: 'More' })
	await toggle.tap()
	await expect(page.locator('#wt-drawer')).toHaveClass(/open/)

	const backdrop = page.locator('#wt-backdrop')
	await backdrop.dispatchEvent('touchend', {
		touches: [],
		changedTouches: [],
		targetTouches: [],
	})

	await expect(page.locator('#wt-drawer')).not.toHaveClass(/open/)
})

test('help button responds to touchend-only', async ({ page }) => {
	const helpBtn = page.locator('#wt-font-controls button', { hasText: '?' })
	await expect(helpBtn).toBeVisible()

	await helpBtn.dispatchEvent('touchend', {
		touches: [],
		changedTouches: [],
		targetTouches: [],
	})

	const overlay = page.locator('#wt-help')
	await expect(overlay).toBeVisible()
})
