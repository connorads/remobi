import { expect, test } from '@playwright/test'

test('two live clients stay in sync after alternating resizes', async ({ browser }) => {
	const firstContext = await browser.newContext({
		viewport: { width: 430, height: 932 },
		isMobile: true,
		hasTouch: true,
	})
	const secondContext = await browser.newContext({
		viewport: { width: 320, height: 568 },
		isMobile: true,
		hasTouch: true,
	})

	try {
		const firstPage = await firstContext.newPage()
		const secondPage = await secondContext.newPage()

		await firstPage.goto('/')
		await secondPage.goto('/')
		await firstPage.waitForSelector('#terminal .xterm', { timeout: 10_000 })
		await secondPage.waitForSelector('#terminal .xterm', { timeout: 10_000 })

		await firstPage.evaluate(() => {
			window.__remobiResize?.()
		})
		await secondPage.evaluate(() => {
			window.__remobiResize?.()
		})

		await firstPage.evaluate(() => {
			window.term?.input('printf "multi-client-start\\n"\r', true)
		})
		await expect(firstPage.locator('body')).toContainText('multi-client-start')
		await expect(secondPage.locator('body')).toContainText('multi-client-start')

		await firstPage.setViewportSize({ width: 390, height: 844 })
		await firstPage.evaluate(() => {
			window.__remobiResize?.()
		})
		await secondPage.setViewportSize({ width: 280, height: 653 })
		await secondPage.evaluate(() => {
			window.__remobiResize?.()
		})

		const longLine = `printf "wrap-check-${'x'.repeat(120)}\\n"\r`
		await secondPage.evaluate((command) => {
			window.term?.input(command, true)
		}, longLine)
		await expect(firstPage.locator('body')).toContainText('wrap-check-')
		await expect(secondPage.locator('body')).toContainText('wrap-check-')

		await firstPage.evaluate(() => {
			window.term?.input('printf "post-resize-sync\\n"\r', true)
		})
		await expect(firstPage.locator('body')).toContainText('post-resize-sync')
		await expect(secondPage.locator('body')).toContainText('post-resize-sync')
		await expect
			.poll(() => firstPage.evaluate(() => window.__remobiSockets?.[0]?.readyState))
			.toBe(1)
		await expect
			.poll(() => secondPage.evaluate(() => window.__remobiSockets?.[0]?.readyState))
			.toBe(1)
	} finally {
		await firstContext.close()
		await secondContext.close()
	}
})
