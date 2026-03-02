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
		// Prompt + command visible as phone settles (~frame 10)
		{
			spans: [
				{ text: 'connor@rpi5', colour: colours.green, bold: true },
				{ text: ':', colour: colours.fg },
				{ text: '~/projects', colour: colours.teal, bold: true },
				{ text: '$ ', colour: colours.fg },
				{ text: 'ls -la', colour: colours.fg },
			],
			appearAt: 10,
		},
		{
			spans: [{ text: 'total 42', colour: colours.fg, dim: true }],
			appearAt: 13,
		},
		{
			spans: [{ text: 'drwxr-xr-x  5 connor  4096 Feb 28 .', colour: colours.fg }],
			appearAt: 15,
		},
		{
			spans: [
				{ text: '-rw-r--r--  1 connor   847 Feb 28 ', colour: colours.fg },
				{ text: 'index.ts', colour: colours.blue },
			],
			appearAt: 17,
		},
		{
			spans: [
				{ text: '-rw-r--r--  1 connor  1203 Feb 28 ', colour: colours.fg },
				{ text: 'config.ts', colour: colours.blue },
			],
			appearAt: 19,
		},
		{
			spans: [
				{ text: '-rw-r--r--  1 connor   394 Feb 28 ', colour: colours.fg },
				{ text: 'README.md', colour: colours.blue },
			],
			appearAt: 21,
		},
		// Second prompt with typewriter — types `claude`
		{
			spans: [
				{ text: 'connor@rpi5', colour: colours.green, bold: true },
				{ text: ':', colour: colours.fg },
				{ text: '~/projects', colour: colours.teal, bold: true },
				{ text: '$ ', colour: colours.fg },
				{ text: 'claude', colour: colours.yellow, typewriter: true },
			],
			appearAt: 25,
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
		// ── Read tool block (landing beat: +6 frames after swipe) ──
		{
			spans: [
				{ text: '╭─ ', colour: claude.lavender },
				{ text: 'Read', colour: claude.lavender, bold: true },
				{ text: ' src/login.ts', colour: claude.lavender },
				{ text: ' ────────────╮', colour: claude.lavender },
			],
			appearAt: 50,
		},
		{
			spans: [
				{ text: '│', colour: claude.lavender },
				{ text: ' 47 lines', colour: colours.fg, dim: true },
			],
			appearAt: 52,
		},
		{
			spans: [{ text: '╰────────────────────────────╯', colour: claude.lavender }],
			appearAt: 54,
		},
		{ spans: [], appearAt: 64 },
		// ── Response text ──
		{
			spans: [{ text: ' I found the issue.', colour: claude.responseText }],
			appearAt: 64,
		},
		{ spans: [], appearAt: 74 },
		// ── Edit tool block with diff backgrounds ──
		{
			spans: [
				{ text: '╭─ ', colour: claude.lavender },
				{ text: 'Edit', colour: claude.lavender, bold: true },
				{ text: ' src/login.ts', colour: claude.lavender },
				{ text: ' ───────────╮', colour: claude.lavender },
			],
			appearAt: 74,
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
			appearAt: 78,
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
			appearAt: 81,
		},
		{
			spans: [{ text: '╰────────────────────────────╯', colour: claude.lavender }],
			appearAt: 84,
		},
		{ spans: [], appearAt: 91 },
		// ── "✓ Applied edit" ──
		{
			spans: [
				{ text: ' ✓', colour: claude.successGreen, bold: true },
				{ text: ' Applied edit', colour: colours.fg },
			],
			appearAt: 91,
		},
		{ spans: [], appearAt: 106 },
		// ── Input prompt (terracotta bordered box) ──
		{
			spans: [
				{ text: '╭─ ', colour: claude.terracotta },
				{ text: 'claude-opus-4-6', colour: claude.terracotta, bold: true },
				{ text: ' ─────╮', colour: claude.terracotta },
			],
			appearAt: 106,
		},
		{
			spans: [{ text: '│ ', colour: claude.terracotta }],
			appearAt: 106,
		},
	],
	cursorAtEnd: true,
}

// ── Scene 3: Claude Code detail (AI Tools) ─────────────────────────

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
		// ── Thinking shimmer (frame 0) ──
		{
			spans: [{ text: ' ⠿ Thinking…', colour: claude.terracotta }],
			shimmer: true,
		},
		{ spans: [] },
		// ── Edit tool block — lines stagger in (frames 8–30) ──
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
			appearAt: 12,
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
			appearAt: 15,
		},
		{
			spans: [{ text: '│', colour: claude.lavender }],
			appearAt: 18,
		},
		{
			spans: [
				{ text: '│ ', colour: claude.lavender },
				{ text: '+ app.use(rateLimit({', colour: claude.diffAddWord, background: claude.diffAddBg },
			],
			appearAt: 21,
		},
		{
			spans: [
				{ text: '│ ', colour: claude.lavender },
				{ text: '+   window: 60_000,', colour: claude.diffAddWord, background: claude.diffAddBg },
			],
			appearAt: 24,
		},
		{
			spans: [
				{ text: '│ ', colour: claude.lavender },
				{ text: '+   max: 100,', colour: claude.diffAddWord, background: claude.diffAddBg },
			],
			appearAt: 27,
		},
		{
			spans: [
				{ text: '│ ', colour: claude.lavender },
				{ text: '+ }))', colour: claude.diffAddWord, background: claude.diffAddBg },
			],
			appearAt: 30,
		},
		{
			spans: [{ text: '╰────────────────────────────╯', colour: claude.lavender }],
			appearAt: 33,
		},
		{ spans: [], appearAt: 43 },
		// ── "✓ Applied edit" (frame 43) ──
		{
			spans: [
				{ text: ' ✓', colour: claude.successGreen, bold: true },
				{ text: ' Applied edit', colour: colours.fg },
			],
			appearAt: 43,
		},
		{ spans: [], appearAt: 49 },
		// ── Response with typewriter (frame 49) ──
		{
			spans: [
				{ text: ' Rate limiting is now active.', colour: claude.responseText, typewriter: true },
			],
			appearAt: 49,
		},
		{ spans: [], appearAt: 54 },
		// ── Input prompt (frame 54) ──
		{
			spans: [
				{ text: '╭─ ', colour: claude.terracotta },
				{ text: 'claude-opus-4-6', colour: claude.terracotta, bold: true },
				{ text: ' ─────╮', colour: claude.terracotta },
			],
			appearAt: 54,
		},
		{
			spans: [{ text: '│ ', colour: claude.terracotta }],
			appearAt: 54,
		},
	],
	cursorAtEnd: true,
}
