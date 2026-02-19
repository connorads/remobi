# webmux

Mobile-friendly terminal overlay for ttyd + tmux. Intended for npm as `webmux` (Bun-only).

## Architecture

Pure TypeScript + DOM API — no framework. Ships TypeScript source directly (no transpilation). Produces a single `index.html` for ttyd's `--index` flag via `Bun.build()`.

## Stack

- **Bun** — runtime, bundler, test runner, package manager
- **TypeScript (strict)** — no `any`, discriminated unions for actions
- **Biome** — lint + format
- **happy-dom** — DOM testing

## Key Commands

```bash
bun test              # Run all tests
bun run check         # Biome lint + format check
bun run check:fix     # Auto-fix lint + format
bun run build         # Build dist/index.html
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
- `styles/base.css` — all CSS
- `cli.ts` — CLI: build, inject, init, --version
- `build.ts` — build pipeline: bundle → inject → output

## Publishing

- Ships TypeScript source: `bin` → `cli.ts`, `exports` → `.ts` files
- `files` array controls what's published: `src/`, `styles/`, `cli.ts`, `build.ts`, `README.md`, `LICENSE`
- CI: `.github/workflows/ci.yml` — bun test + biome check
- Publish: `.github/workflows/publish.yml` — triggered on `v*` tags → npm publish
- `bun link` for local development (CLI available globally, changes immediate)
- First publish workflow:
  - Keep release notes under `CHANGELOG.md` → `Unreleased` until first publish
  - On release, set `package.json` version, rename `Unreleased` to that version + date
  - Create and push matching tag (`v<version>`) to trigger publish workflow

## Conventions

- Button actions use discriminated unions (`type: 'send' | 'ctrl-modifier' | 'paste' | 'drawer-toggle'`)
- Unified control schema: use `ControlButton` for both toolbar and drawer items
- Config shape: `drawer.buttons` (not `drawer.commands`)
- Config via `defineConfig()` — typed, with sensible defaults
- Config resolution: `--config` flag → cwd → `~/.config/webmux/` (XDG fallback)
- Drawer takes a flat `readonly ControlButton[]` — rendered as a single grid
- Help overlay is config-driven and must be fail-safe (never break core controls if help fails)
- Mobile viewport handling: lock document scroll and compute height from visual viewport (keyboard-aware)
- When behaviour/config/API changes, update `CHANGELOG.md` under `Unreleased` in the same change set
- All DOM creation in `util/dom.ts` helpers
- Keyboard state preserved: capture `isKeyboardOpen()` before action, use `conditionalFocus()` after
- Tests use happy-dom for DOM environment
