/**
 * Register a tap handler that works on both touch and non-touch devices.
 *
 * iOS Safari can fail to synthesise `click` after touch events on dynamically
 * created elements. This listens for `touchend` (fires on finger lift — correct
 * button press-then-release UX) and `click` (fallback for mouse/keyboard).
 * A guard prevents double-fire when both events occur.
 */
export function onTap(element: HTMLElement, handler: (e: Event) => void): void {
	let touchFired = false

	element.addEventListener('touchend', (e: TouchEvent) => {
		e.preventDefault()
		touchFired = true
		handler(e)
		setTimeout(() => {
			touchFired = false
		}, 400)
	})

	element.addEventListener('click', (e: Event) => {
		if (touchFired) return
		handler(e)
	})
}
