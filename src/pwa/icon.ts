/**
 * SVG icon for webmux PWA.
 * Dark rounded-rect background (#1e1e2e catppuccin mocha base),
 * green chevron (›) in #a6e3a1 (catppuccin green),
 * underscore cursor in #89b4fa (catppuccin blue).
 */
export const ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="80" ry="80" fill="#1e1e2e"/>
  <text x="100" y="330" font-family="monospace" font-size="260" font-weight="bold" fill="#a6e3a1">›</text>
  <text x="195" y="400" font-family="monospace" font-size="140" font-weight="bold" fill="#89b4fa">_</text>
</svg>`

/** Convert SVG string to a data URI */
export function svgToDataUri(svg: string): string {
	return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`
}
