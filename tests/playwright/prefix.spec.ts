/**
 * E2E tests for the prefix button: tap Prefix → sends prefix byte →
 * combo picker opens with contextual title/description.
 */
import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
	await page.goto('/')
	await page.waitForSelector('#wt-toolbar', { timeout: 10_000 })
})

test('prefix button tap opens combo picker with contextual title', async ({ page }) => {
	const prefixBtn = page.locator('#wt-toolbar button', { hasText: 'Prefix' })
	await prefixBtn.tap()

	const backdrop = page.locator('#wt-combo-backdrop')
	await expect(backdrop).toBeVisible({ timeout: 3_000 })

	await expect(page.locator('#wt-combo-panel h3')).toContainText('Ctrl-B')
	await expect(page.locator('#wt-combo-panel p').first()).toContainText('C-x = Ctrl+x')
})

test('prefix button touchend-only opens combo picker', async ({ page }) => {
	const prefixBtn = page.locator('#wt-toolbar button', { hasText: 'Prefix' })

	await prefixBtn.dispatchEvent('touchend', {
		touches: [],
		changedTouches: [],
		targetTouches: [],
	})

	const backdrop = page.locator('#wt-combo-backdrop')
	await expect(backdrop).toBeVisible({ timeout: 3_000 })
	await expect(page.locator('#wt-combo-panel h3')).toContainText('Ctrl-B')
})

test('prefix combo picker submits follow-up key and closes', async ({ page }) => {
	const prefixBtn = page.locator('#wt-toolbar button', { hasText: 'Prefix' })
	await prefixBtn.tap()

	const backdrop = page.locator('#wt-combo-backdrop')
	await expect(backdrop).toBeVisible({ timeout: 3_000 })

	const input = page.locator('#wt-combo-panel input')
	await expect(input).toBeFocused({ timeout: 1_000 })
	await input.fill('r')
	await input.press('Enter')

	await expect(backdrop).not.toBeVisible({ timeout: 3_000 })
})

test('prefix combo picker cancel restores default title', async ({ page }) => {
	// Open via prefix
	const prefixBtn = page.locator('#wt-toolbar button', { hasText: 'Prefix' })
	await prefixBtn.tap()
	await expect(page.locator('#wt-combo-backdrop')).toBeVisible({ timeout: 3_000 })

	// Cancel
	const cancelBtn = page.locator('#wt-combo-panel button', { hasText: 'Cancel' })
	await cancelBtn.tap()
	await expect(page.locator('#wt-combo-backdrop')).not.toBeVisible()

	// Re-open via drawer Combo button — should have default title
	const toggle = page.locator('#wt-toolbar button', { hasText: 'More' })
	await toggle.tap()
	await expect(page.locator('#wt-drawer')).toHaveClass(/open/)

	const comboBtn = page.locator('#wt-drawer-grid button', { hasText: 'Combo' })
	await comboBtn.tap()
	await expect(page.locator('#wt-combo-backdrop')).toBeVisible({ timeout: 3_000 })
	await expect(page.locator('#wt-combo-panel h3')).toHaveText('Send combo')
})
