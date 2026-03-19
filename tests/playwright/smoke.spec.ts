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

test('remobi inject pipes ttyd HTML and produces patched output', async () => {
	const res = await fetch('http://127.0.0.1:7681/')
	expect(res.ok).toBe(true)
	const ttydHtml = await res.text()

	const stdout = execSync('tsx cli.ts inject', {
		cwd: repoRoot,
		input: ttydHtml,
		encoding: 'utf-8',
		timeout: 15_000,
	})

	expect(stdout).toContain('<!DOCTYPE html>')
	expect(stdout.indexOf('</head>')).toBeGreaterThan(-1)
})
