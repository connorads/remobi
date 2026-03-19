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
		// No preventDefault — allow the browser to synthesise mousedown/click,
		// which transfers focus to the button and away from the terminal textarea.
		// Without this, Android re-shows the keyboard when buttons are pressed.
		// The touchFired guard below prevents the handler from double-firing.
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
