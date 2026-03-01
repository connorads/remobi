/**
 * Pre-defined terminal screen content for each scene.
 * Colours reference the Catppuccin Mocha palette via theme.ts.
 */
import type { TerminalScreen } from './components/Terminal'
import type { TmuxStatusBarProps } from './components/TmuxStatusBar'
import { claude, colours } from './theme'

// ── Scene 1: Shell prompt ──────────────────────────────────────────

export const shellStatus: TmuxStatusBarProps = {
	session: 'main',
	windows: [
		{ index: 0, name: 'zsh', active: true },
		{ index: 1, name: 'claude' },
		{ index: 2, name: 'vim' },
	],
}

export const shellScreen: TerminalScreen = {
	lines: [
		{
			spans: [
				{ text: 'connor@rpi5', colour: colours.green, bold: true },
				{ text: ':', colour: colours.fg },
				{ text: '~/projects', colour: colours.teal, bold: true },
				{ text: '$ ', colour: colours.fg },
				{ text: 'ls -la', colour: colours.fg },
			],
		},
		{
			spans: [{ text: 'total 42', colour: colours.fg, dim: true }],
			appearAt: 8,
		},
		{
			spans: [{ text: 'drwxr-xr-x  5 connor  4096 Feb 28 .', colour: colours.fg }],
			appearAt: 10,
		},
		{
			spans: [
				{ text: '-rw-r--r--  1 connor   847 Feb 28 ', colour: colours.fg },
				{ text: 'index.ts', colour: colours.blue },
			],
			appearAt: 12,
		},
		{
			spans: [
				{ text: '-rw-r--r--  1 connor  1203 Feb 28 ', colour: colours.fg },
				{ text: 'config.ts', colour: colours.blue },
			],
			appearAt: 14,
		},
		{
			spans: [
				{ text: '-rw-r--r--  1 connor   394 Feb 28 ', colour: colours.fg },
				{ text: 'README.md', colour: colours.blue },
			],
			appearAt: 16,
		},
		{
			spans: [
				{ text: 'connor@rpi5', colour: colours.green, bold: true },
				{ text: ':', colour: colours.fg },
				{ text: '~/projects', colour: colours.teal, bold: true },
				{ text: '$ ', colour: colours.fg },
				{ text: 'claude', colour: colours.yellow, typewriter: true },
			],
			appearAt: 30,
		},
	],
	cursorAtEnd: true,
}

// ── Scene 2a: Claude Code session ──────────────────────────────────

export const claudeCodeStatus: TmuxStatusBarProps = {
	session: 'main',
	windows: [
		{ index: 0, name: 'zsh' },
		{ index: 1, name: 'claude', active: true },
		{ index: 2, name: 'opencode' },
	],
}

export const claudeCodeScreen: TerminalScreen = {
	lines: [
		// ── Read tool block (lavender borders) ──
		{
			spans: [
				{ text: '╭─ ', colour: claude.lavender },
				{ text: 'Read', colour: claude.lavender, bold: true },
				{ text: ' src/login.ts', colour: claude.lavender },
				{ text: ' ────────────╮', colour: claude.lavender },
			],
		},
		{
			spans: [
				{ text: '│', colour: claude.lavender },
				{ text: ' 47 lines', colour: colours.fg, dim: true },
			],
		},
		{
			spans: [{ text: '╰────────────────────────────╯', colour: claude.lavender }],
		},
		{ spans: [] },
		// ── Response text (plain white) ──
		{
			spans: [{ text: ' I found the issue.', colour: claude.responseText }],
		},
		{ spans: [] },
		// ── Edit tool block with diff backgrounds ──
		{
			spans: [
				{ text: '╭─ ', colour: claude.lavender },
				{ text: 'Edit', colour: claude.lavender, bold: true },
				{ text: ' src/login.ts', colour: claude.lavender },
				{ text: ' ───────────╮', colour: claude.lavender },
			],
		},
		{
			spans: [
				{ text: '│ ', colour: claude.lavender },
				{
					text: '- if (token.expiresAt > ...)',
					colour: claude.diffRemWord,
					background: claude.diffRemBg,
				},
			],
		},
		{
			spans: [
				{ text: '│ ', colour: claude.lavender },
				{
					text: '+ if (token.expiresAt < ...)',
					colour: claude.diffAddWord,
					background: claude.diffAddBg,
				},
			],
		},
		{
			spans: [{ text: '╰────────────────────────────╯', colour: claude.lavender }],
		},
		{ spans: [] },
		{
			spans: [
				{ text: ' ✓', colour: claude.successGreen, bold: true },
				{ text: ' Applied edit', colour: colours.fg },
			],
		},
		{ spans: [] },
		// ── Input prompt (terracotta bordered box) ──
		{
			spans: [
				{ text: '╭─ ', colour: claude.terracotta },
				{ text: 'claude-opus-4-6', colour: claude.terracotta, bold: true },
				{ text: ' ─────╮', colour: claude.terracotta },
			],
		},
		{
			spans: [{ text: '│ ', colour: claude.terracotta }],
		},
	],
	cursorAtEnd: true,
}

// ── Scene 2b: OpenCode session ──────────────────────────────────────

export const openCodeStatus: TmuxStatusBarProps = {
	session: 'main',
	windows: [
		{ index: 0, name: 'zsh' },
		{ index: 1, name: 'claude' },
		{ index: 2, name: 'opencode', active: true },
	],
}

export const openCodeScreen: TerminalScreen = {
	lines: [
		{
			spans: [
				{
					text: ' \u2588\u2580\u2580\u2588 \u2588\u2580\u2580\u2588 \u2588\u2580\u2580\u2588 \u2588\u2580\u2580\u2584',
					colour: colours.orange,
					bold: true,
				},
				{
					text: ' \u2588\u2580\u2580\u2580 \u2588\u2580\u2580\u2588 \u2588\u2580\u2580\u2588 \u2588\u2580\u2580\u2588',
					colour: colours.fg,
					bold: true,
				},
			],
		},
		{ spans: [] },
		{
			spans: [
				{ text: ' > ', colour: colours.orange, bold: true },
				{ text: 'Refactor the database module', colour: colours.fg },
			],
		},
		{ spans: [] },
		{
			spans: [
				{ text: ' \u2839', colour: colours.orange },
				{ text: ' Analysing ', colour: colours.fg, dim: true },
				{ text: 'src/db/...', colour: colours.teal, dim: true },
			],
		},
		{ spans: [] },
		{
			spans: [
				{ text: ' \u2713', colour: colours.green, bold: true },
				{ text: ' Created ', colour: colours.fg },
				{ text: 'src/db/connection.ts', colour: colours.teal },
			],
		},
		{
			spans: [
				{ text: ' \u2713', colour: colours.green, bold: true },
				{ text: ' Created ', colour: colours.fg },
				{ text: 'src/db/queries.ts', colour: colours.teal },
			],
		},
		{
			spans: [
				{ text: ' \u2713', colour: colours.green, bold: true },
				{ text: ' Updated ', colour: colours.fg },
				{ text: 'src/db/index.ts', colour: colours.teal },
			],
		},
		{ spans: [] },
		{
			spans: [{ text: ' > ', colour: colours.orange, bold: true }],
		},
		{
			spans: [
				{
					text: '\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500',
					colour: colours.overlay,
				},
			],
		},
		{
			spans: [
				{ text: ' ~/projects', colour: colours.fg, dim: true },
				{ text: '          ', colour: colours.fg },
				{ text: 'MCP: \u2299 1', colour: colours.fg, dim: true },
			],
		},
	],
	cursorAtEnd: true,
}

// ── Scene 4: Claude Code detail (AI Tools) ─────────────────────────

export const claudeCodeDetailStatus: TmuxStatusBarProps = {
	session: 'main',
	windows: [
		{ index: 0, name: 'zsh' },
		{ index: 1, name: 'claude', active: true },
		{ index: 2, name: 'opencode' },
	],
}

export const claudeCodeDetailScreen: TerminalScreen = {
	lines: [
		// ── Thinking shimmer ──
		{
			spans: [{ text: ' ⠿ Thinking…', colour: claude.terracotta }],
			shimmer: true,
		},
		{ spans: [] },
		// ── Edit tool block (lavender borders + diff backgrounds) ──
		{
			spans: [
				{ text: '╭─ ', colour: claude.lavender },
				{ text: 'Edit', colour: claude.lavender, bold: true },
				{ text: ' src/api/routes.ts', colour: claude.lavender },
				{ text: ' ────╮', colour: claude.lavender },
			],
			appearAt: 8,
		},
		{
			spans: [
				{ text: '│ ', colour: claude.lavender },
				{
					text: '+ import { rateLimit }',
					colour: claude.diffAddWord,
					background: claude.diffAddBg,
				},
			],
			appearAt: 8,
		},
		{
			spans: [
				{ text: '│ ', colour: claude.lavender },
				{
					text: "+   from './rateLimit'",
					colour: claude.diffAddWord,
					background: claude.diffAddBg,
				},
			],
			appearAt: 8,
		},
		{
			spans: [{ text: '│', colour: claude.lavender }],
			appearAt: 8,
		},
		{
			spans: [
				{ text: '│ ', colour: claude.lavender },
				{ text: '+ app.use(rateLimit({', colour: claude.diffAddWord, background: claude.diffAddBg },
			],
			appearAt: 8,
		},
		{
			spans: [
				{ text: '│ ', colour: claude.lavender },
				{ text: '+   window: 60_000,', colour: claude.diffAddWord, background: claude.diffAddBg },
			],
			appearAt: 8,
		},
		{
			spans: [
				{ text: '│ ', colour: claude.lavender },
				{ text: '+   max: 100,', colour: claude.diffAddWord, background: claude.diffAddBg },
			],
			appearAt: 8,
		},
		{
			spans: [
				{ text: '│ ', colour: claude.lavender },
				{ text: '+ }))', colour: claude.diffAddWord, background: claude.diffAddBg },
			],
			appearAt: 8,
		},
		{
			spans: [{ text: '╰────────────────────────────╯', colour: claude.lavender }],
			appearAt: 8,
		},
		{ spans: [], appearAt: 12 },
		{
			spans: [
				{ text: ' ✓', colour: claude.successGreen, bold: true },
				{ text: ' Applied edit', colour: colours.fg },
			],
			appearAt: 12,
		},
		{ spans: [], appearAt: 18 },
		// ── Response ──
		{
			spans: [{ text: ' Rate limiting is now active.', colour: claude.responseText }],
			appearAt: 18,
		},
		{ spans: [], appearAt: 24 },
		// ── Input prompt (terracotta bordered box) ──
		{
			spans: [
				{ text: '╭─ ', colour: claude.terracotta },
				{ text: 'claude-opus-4-6', colour: claude.terracotta, bold: true },
				{ text: ' ─────╮', colour: claude.terracotta },
			],
			appearAt: 24,
		},
		{
			spans: [{ text: '│ ', colour: claude.terracotta }],
			appearAt: 24,
		},
	],
	cursorAtEnd: true,
}

// ── Scene 5: Cross-platform (same terminal on both devices) ────────

export const crossPlatformStatus: TmuxStatusBarProps = {
	session: 'main',
	windows: [
		{ index: 0, name: 'zsh', active: true },
		{ index: 1, name: 'claude' },
	],
}

export const crossPlatformScreen: TerminalScreen = {
	lines: [
		{
			spans: [
				{ text: 'connor@rpi5', colour: colours.green, bold: true },
				{ text: ':', colour: colours.fg },
				{ text: '~', colour: colours.teal, bold: true },
				{ text: '$ ', colour: colours.fg },
				{ text: 'ts status', colour: colours.yellow },
			],
		},
		{ spans: [] },
		{
			spans: [
				{ text: '  Mac-mini       ', colour: colours.fg },
				{ text: 'online', colour: colours.green },
			],
		},
		{
			spans: [
				{ text: '  MacBook        ', colour: colours.fg },
				{ text: 'online', colour: colours.green },
			],
		},
		{
			spans: [
				{ text: '  rpi5           ', colour: colours.fg },
				{ text: 'online', colour: colours.green },
				{ text: '  \u2190 you', colour: colours.fg, dim: true },
			],
		},
		{
			spans: [
				{ text: '  dev-vps        ', colour: colours.fg },
				{ text: 'online', colour: colours.green },
			],
		},
	],
}
