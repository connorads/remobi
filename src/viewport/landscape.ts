/**
 * Detect landscape orientation + keyboard open state.
 * In landscape with keyboard, hides row 2 and shrinks buttons via CSS class.
 */
export function checkLandscapeKeyboard(toolbar: HTMLDivElement): void {
	const vp = window.visualViewport
	if (!vp) return

	const kbOpen = window.innerHeight - vp.height > 150
	const landscape = window.innerWidth > window.innerHeight

	if (kbOpen && landscape) {
		toolbar.classList.add('wt-kb-open')
	} else {
		toolbar.classList.remove('wt-kb-open')
	}
}
