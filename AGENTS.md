# webmux

Mobile-friendly terminal overlay for ttyd + tmux.

## Architecture

Pure TypeScript + DOM API — no framework. Produces a single `index.html` for ttyd's `--index` flag.

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
- `src/drawer/commands.ts` — re-exports defaultDrawerCommands from config
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

## Conventions

- Button actions use discriminated unions (`type: 'send' | 'ctrl-modifier' | 'paste' | 'drawer-toggle'`)
- Config via `defineConfig()` — typed, with sensible defaults
- Drawer takes a flat `readonly DrawerCommand[]` — rendered as a single grid
- All DOM creation in `util/dom.ts` helpers
- Keyboard state preserved: capture `isKeyboardOpen()` before action, use `conditionalFocus()` after
- Tests use happy-dom for DOM environment
