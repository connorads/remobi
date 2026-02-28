/**
 * Catppuccin Mocha palette — re-exported from webmux source to stay in sync.
 * Also exposes semantic aliases used throughout the demo.
 */
import { catppuccinMocha } from '../../src/theme/catppuccin-mocha'

export const palette = catppuccinMocha

/** Semantic colour aliases for demo components */
export const colours = {
	/** Deep background (#1e1e2e) */
	bg: palette.background,
	/** Soft foreground text (#cdd6f4) */
	fg: palette.foreground,
	/** Cursor — warm rosewater (#f5e0dc) */
	cursor: palette.cursor,
	/** Blue accent — active states, links, webmux title (#89b4fa) */
	blue: palette.blue,
	/** Green — prompts, tmux status, git additions (#a6e3a1) */
	green: palette.green,
	/** Red — deletions, errors (#f38ba8) */
	red: palette.red,
	/** Yellow — warnings, highlights, typed text (#f9e2af) */
	yellow: palette.yellow,
	/** Mauve — keywords, visual interest (#cba6f7) */
	mauve: palette.magenta,
	/** Teal — paths, info (#94e2d5) */
	teal: palette.cyan,
	/** Peach — Claude Code prompt accent (#fab387) */
	peach: '#fab387',
	/** Orange — OpenCode accent (#fab283) */
	orange: '#fab283',
	/** Surface 0 — toolbar/drawer bg (#313244) */
	surface0: '#313244',
	/** Surface 1 — button bg (#45475a) */
	surface1: palette.black,
	/** Surface 2 — active/pressed (#585b70) */
	surface2: palette.brightBlack,
	/** Subtext — muted text (#a6adc8) */
	subtext: palette.brightWhite,
	/** Overlay — muted borders (#6c7086) */
	overlay: '#6c7086',
} as const
