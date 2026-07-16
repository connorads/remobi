/**
 * Regression test for late-join mouse encoding: the app enables SGR mouse
 * reporting (?1006h) before a client connects, so the client depends on the
 * snapshot to replay it. The serialize addon only replays tracking modes
 * (?1000h etc.), so without the server appending the encoding mode, the late
 * client's xterm stays on legacy X10 encoding and emits reports via
 * term.onBinary — which the client never forwards. The tap dies silently.
 *
 * Runs against an isolated server: the test holds the PTY in a modal state
 * (foreground cat + live mouse modes) that would race parallel specs sharing
 * the suite webServer.
 */
import { expect, test } from '@playwright/test'
import { startIsolatedServe } from './isolated-serve'

test('late client taps produce SGR mouse reports', async ({ browser }) => {
	const server = await startIsolatedServe()
	const firstContext = await browser.newContext({
		viewport: { width: 430, height: 932 },
		isMobile: true,
		hasTouch: true,
	})
	const secondContext = await browser.newContext({
		viewport: { width: 430, height: 932 },
		isMobile: true,
		hasTouch: true,
	})

	try {
		const firstPage = await firstContext.newPage()
		await firstPage.goto(server.url)
		await firstPage.waitForSelector('#terminal .xterm', { timeout: 10_000 })

		// Enable mouse tracking + SGR encoding on the PTY, then run cat so
		// the shell doesn't interpret the incoming mouse reports — the tty
		// echoes them as visible ^[[<...M text.
		await firstPage.evaluate(() => {
			window.term?.input("printf '\\033[?1000h\\033[?1006hmouse-ready\\n'; cat -v\r", true)
		})
		await expect(firstPage.locator('body')).toContainText('mouse-ready')

		// Late join: this client only learns the mouse state from the snapshot.
		const secondPage = await secondContext.newPage()
		await secondPage.goto(server.url)
		await secondPage.waitForSelector('#terminal .xterm', { timeout: 10_000 })
		await expect(secondPage.locator('body')).toContainText('mouse-ready')

		await secondPage.locator('#terminal .xterm-screen').click({ position: { x: 100, y: 100 } })

		// SGR-encoded report (\e[<...M) echoed by the tty. Without the
		// encoding replayed, the click is emitted via onBinary and dropped —
		// nothing ever reaches the PTY.
		await expect(secondPage.locator('body')).toContainText('^[[<')
	} finally {
		await firstContext.close()
		await secondContext.close()
		await server.close()
	}
})
