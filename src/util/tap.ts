/**
 * Register a tap handler that works on both touch and non-touch devices.
 *
 * ## Why module-level touchFired (not per-element)
 *
 * On touch devices, after touchend fires, the browser synthesises a click
 * ~4ms later at the same coordinates. When a touchend handler opens an
 * overlay (higher z-index) at those coordinates, the synthesised click
 * hit-tests against the overlay instead of the original button — closing
 * it immediately. A per-element guard only prevents double-fire on the
 * SAME element; module-level state prevents cross-element synthesised clicks.
 *
 * ## Why not preventDefault() on touchend
 *
 * The W3C Touch Events spec says preventDefault() on touchend suppresses
 * synthesised mouse events — the "correct" solution. But it was removed
 * (d40fa46) because without synthesised mousedown, focus stays on the
 * terminal textarea and Android re-shows the keyboard when toolbar buttons
 * are pressed. Restoring it would require blur() + reworking keyboard state
 * preservation (isKeyboardOpen/conditionalFocus) across 13 call sites.
 *
 * ## Why not Pointer Events (pointerup)
 *
 * preventDefault() on pointerup does NOT suppress compatibility mouse
 * events per the Pointer Events spec. The browser still synthesises
 * mousedown/mouseup/click from the underlying touch events.
 */

let touchFired = false
let touchGuardTimer: ReturnType<typeof setTimeout> | null = null

export function onTap(element: HTMLElement, handler: (e: Event) => void): void {
	element.addEventListener('touchend', (e: TouchEvent) => {
		// No preventDefault — allow the browser to synthesise mousedown/click,
		// which transfers focus to the button and away from the terminal textarea.
		// Without this, Android re-shows the keyboard when buttons are pressed.
		// The module-level touchFired guard below prevents the handler from
		// double-firing on this element AND prevents cross-element synthesised
		// clicks from closing overlays that just opened at the same coordinates.
		touchFired = true
		handler(e)
		if (touchGuardTimer !== null) clearTimeout(touchGuardTimer)
		touchGuardTimer = setTimeout(() => {
			touchFired = false
			touchGuardTimer = null
		}, 400)
	})

	element.addEventListener('click', (e: Event) => {
		if (touchFired) return
		handler(e)
	})
}

/** Reset module-level touch guard state — test-only. */
export function _resetTouchGuard(): void {
	touchFired = false
	if (touchGuardTimer !== null) {
		clearTimeout(touchGuardTimer)
		touchGuardTimer = null
	}
}
