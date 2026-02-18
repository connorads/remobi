/** Short haptic vibration — no-op on devices without vibration API */
export function haptic(): void {
	if (navigator.vibrate) {
		navigator.vibrate(10)
	}
}
