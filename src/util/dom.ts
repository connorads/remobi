/** Create an element with optional attributes and children */
export function el<K extends keyof HTMLElementTagNameMap>(
	tag: K,
	attrs?: Record<string, string>,
	...children: Array<string | HTMLElement>
): HTMLElementTagNameMap[K] {
	const element = document.createElement(tag)
	if (attrs) {
		for (const [key, value] of Object.entries(attrs)) {
			element.setAttribute(key, value)
		}
	}
	for (const child of children) {
		if (typeof child === 'string') {
			element.appendChild(document.createTextNode(child))
		} else {
			element.appendChild(child)
		}
	}
	return element
}

/** Inject a <style> block into <head> */
export function injectStyles(css: string): HTMLStyleElement {
	const style = el('style')
	style.textContent = css
	document.head.appendChild(style)
	return style
}

/** Create a button with label and aria-label */
export function btn(label: string, ariaLabel?: string): HTMLButtonElement {
	const button = el('button')
	button.textContent = label
	if (ariaLabel) {
		button.setAttribute('aria-label', ariaLabel)
	}
	return button
}
