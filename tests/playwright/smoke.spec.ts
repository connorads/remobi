import { execSync } from 'node:child_process'
import { join } from 'node:path'
import { expect, test } from '@playwright/test'

const repoRoot = join(import.meta.dirname, '../..')

test('serves HTML with terminal content', async ({ page }) => {
	await page.goto('/')
	const html = await page.content()
	expect(html).toContain('<!DOCTYPE html>')
	expect(html.toLowerCase()).toContain('main')
})

test('remobi inject pipes ttyd HTML and produces patched output', async ({ request }) => {
	const res = await request.get('/')
	expect(res.ok()).toBe(true)
	const ttydHtml = await res.text()

	const stdout = execSync('tsx cli.ts inject', {
		cwd: repoRoot,
		input: ttydHtml,
		encoding: 'utf-8',
		timeout: 15_000,
	})

	expect(stdout).toContain('<!DOCTYPE html>')
	expect(stdout.indexOf('</head>')).toBeGreaterThan(-1)
	expect(stdout).toContain('__remobiVersion')
})

test('help overlay shows version', async ({ page }) => {
	await page.goto('/')
	await page.waitForSelector('#wt-toolbar', { timeout: 10_000 })

	// Open help via touchend (same pattern as touch.spec.ts — tap() can miss on mobile viewports)
	const helpBtn = page.locator('#wt-font-controls button', { hasText: '?' })
	await expect(helpBtn).toBeVisible()
	await helpBtn.dispatchEvent('touchend', {
		touches: [],
		changedTouches: [],
		targetTouches: [],
	})

	const overlay = page.locator('#wt-help')
	await expect(overlay).toBeVisible()

	const versionEl = page.locator('#wt-help .wt-help-version')
	await expect(versionEl).toBeVisible()
	await expect(versionEl).toContainText(/remobi v\d+\.\d+\.\d+/)
})
