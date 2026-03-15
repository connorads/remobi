# remobi

Monitor and control your coding agents from your phone. Touch controls for tmux over the web. Published on npm as `remobi`.

## Architecture

Pure TypeScript + DOM API — no framework. Transpiles to JS via tsdown for npm distribution. Produces a single `index.html` for ttyd's `--index` flag via esbuild.

## Stack

- **Node 22+** — runtime
- **pnpm** — package manager
- **esbuild** — browser bundle (overlay JS)
- **tsdown** — transpile TS → JS for npm publish
- **vitest** — test runner
- **TypeScript (strict)** — no `any`, discriminated unions for actions
- **Biome** — lint + format
- **happy-dom** — DOM testing
- **Hono** — HTTP + WebSocket server (`remobi serve`)

## Key Commands

```bash
pnpm test              # Run all tests
pnpm run check         # Biome lint + format check
pnpm run check:fix     # Auto-fix lint + format
pnpm run build         # Build dist/index.html (dev-time, uses tsx)
pnpm run build:dist    # Transpile for publishing (tsdown)
```

## Module Layout

- `src/index.ts` — entry: waitForTerm then init overlay
- `src/config.ts` — config schema, defaults, defineConfig
- `src/types.ts` — all shared types
- `src/toolbar/` — toolbar DOM + button definitions
- `src/drawer/drawer.ts` — command drawer with flat grid
- `src/drawer/commands.ts` — re-exports defaultDrawerButtons from config
- `src/gestures/` — swipe + pinch detection
- `src/controls/` — font size, help overlay
- `src/theme/` — catppuccin-mocha + apply
- `src/viewport/` — height management, landscape detection
- `src/util/dom.ts` — element creation helpers
- `src/util/terminal.ts` — sendData, resizeTerm, waitForTerm
- `src/util/haptic.ts` — vibration feedback
- `src/util/keyboard.ts` — isKeyboardOpen, conditionalFocus
- `src/util/node-compat.ts` — sleep, readStdin, spawnProcess, collectStream
- `styles/base.css` — all CSS
- `cli.ts` — CLI: build, inject, init, serve, --version
- `build.ts` — build pipeline: bundle → inject → output

## Publishing

- Transpiles to JS via tsdown: `bin` → `dist/cli.mjs`, `exports` → `dist/*.mjs` + `dist/*.d.mts`
- `files` array controls what's published: `dist/`, `styles/`, `src/pwa/icons/`, `README.md`, `LICENSE`
- CI: `.github/workflows/ci.yml` — pnpm test + biome check
- Publish: `.github/workflows/publish.yml` — triggered on `v*` tags → npm publish
- `pnpm link --global` for local development (CLI available globally)
- First publish workflow:
  - Keep release notes under `CHANGELOG.md` → `Unreleased` until first publish
  - On release, set `package.json` version, rename `Unreleased` to that version + date
  - Create and push matching tag (`v<version>`) to trigger publish workflow

## Conventions

- Button actions use discriminated unions (`type: 'send' | 'ctrl-modifier' | 'paste' | 'drawer-toggle'`)
- Unified control schema: use `ControlButton` for both toolbar and drawer items
- Config shape: `drawer.buttons` (not `drawer.commands`)
- Config via `defineConfig()` — typed, with sensible defaults
- Config resolution: `--config` flag → cwd → `~/.config/remobi/` (XDG fallback)
- Drawer takes a flat `readonly ControlButton[]` — rendered as a single grid
- Help overlay is config-driven and must be fail-safe (never break core controls if help fails)
- Mobile viewport handling: lock document scroll and compute height from visual viewport (keyboard-aware)
- When behaviour/config/API changes, update `CHANGELOG.md` under `Unreleased` in the same change set
- All DOM creation in `util/dom.ts` helpers
- Keyboard state preserved: capture `isKeyboardOpen()` before action, use `conditionalFocus()` after
- Tests use happy-dom for DOM environment (e2e/CLI tests use node environment)
- Agent skill: `skills/remobi-setup/SKILL.md` provides AI agents with config guidance. When config shape, CLI commands, action types, or validation rules change, update the skill and `docs/guides/agent-setup.md` to stay in sync.
- When working on `demo/` code, load `/remotion-best-practices` skill for Remotion-specific patterns (Sequence frame resets, interpolation, transitions).
