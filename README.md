# webmux

[![CI](https://github.com/connorads/webmux/actions/workflows/ci.yml/badge.svg)](https://github.com/connorads/webmux/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/webmux)](https://www.npmjs.com/package/webmux)
[![licence](https://img.shields.io/npm/l/webmux)](LICENSE)

**Your terminal. Everywhere.**

[ttyd](https://github.com/tsl0922/ttyd) gives you a terminal in a browser. On mobile, it's unusable — no toolbar, no gestures, tiny unresizable text. webmux fixes that. One command. Touch controls, swipe gestures, pinch-to-zoom. Install it like a native app.

<div align="center">
  <!-- Upload demo/out/demo.mp4 via GitHub issue/PR drag-and-drop, then replace the src below -->
  <video src="https://github.com/user-attachments/assets/PLACEHOLDER" width="300" autoplay loop muted playsinline></video>
</div>

## Why webmux

- **One command** — `webmux serve` builds the overlay, manages ttyd, serves with PWA support
- **Swipe between panes** — gesture navigation, no prefix key fumbling on a phone screen
- **Pinch to zoom** — resize text like every other app on your phone
- **Install to your home screen** — standalone PWA, looks and feels native

## Requirements

- [Bun](https://bun.sh/) ≥ 1.0 (runtime — webmux ships TypeScript source, no transpilation)
- [ttyd](https://github.com/tsl0922/ttyd) — must be on PATH for `webmux serve` and `webmux build` (they spawn a temporary ttyd to fetch base HTML). Install on macOS with `brew install ttyd`; on Linux use your distro package manager or build from source via the [ttyd installation guide](https://github.com/tsl0922/ttyd#installation). `webmux inject` pipes HTML from stdin and does **not** require ttyd — useful for CI or environments where ttyd isn't installed locally.
- [tmux](https://github.com/tmux/tmux) (the target multiplexer)

webmux uses standard ttyd flags (`--writable`, `-t`, `-i`) and should work with any recent ttyd release.

## Quick start

```bash
# 1. Install
bun add -g webmux

# 2. Start (builds overlay, manages ttyd, serves with PWA support)
webmux serve
```

For local development, use `bun link` from the repo root instead of `bun add -g webmux`.

Open `http://localhost:7681` on your phone. Add to Home Screen for an app-like experience.

## CLI reference

```
webmux serve [--config <path>] [--port <n>] [-- <command...>]
  Build overlay in memory, manage ttyd, serve with PWA support.
  Default port: 7681. Default command: tmux new-session -A -s main
  Example: webmux serve --port 8080 -- tmux new -As dev

webmux build [--config <path>] [--output <path>] [--dry-run]
  Build patched index.html for ttyd --index flag (advanced).
  Default output: dist/index.html

webmux inject [--config <path>] [--dry-run]
  Pipe mode: reads ttyd HTML from stdin, outputs patched HTML to stdout.
  Example: curl -s http://localhost:7681/ | webmux inject > patched.html

webmux init
  Scaffold a webmux.config.ts with commented defaults.

webmux --version
webmux --help
```

Short flags: `-c` (`--config`), `-o` (`--output`), `-p` (`--port`), `-n` (`--dry-run`).

### Config resolution

When `--config` is not specified, webmux searches:

1. `webmux.config.ts` / `.js` in the current directory
2. `~/.config/webmux/webmux.config.ts` / `.js` (XDG fallback)

## Configuration

Create `webmux.config.ts` (or run `webmux init`):

```typescript
import { defineConfig } from 'webmux/config'

export default defineConfig({
  font: {
    family: 'JetBrainsMono NFM, monospace',
    mobileSizeDefault: 16,
    sizeRange: [8, 32],
  },
  toolbar: {
    row1: [
      { id: 'esc', label: 'Esc', description: 'Send Escape key', action: { type: 'send', data: '\x1b' } },
      { id: 'tmux-prefix', label: 'Prefix', description: 'Send tmux prefix key (Ctrl-B)', action: { type: 'send', data: '\x02' } },
      // ...
    ],
    row2: [
      { id: 'alt-enter', label: 'M-↵', description: 'Send Alt+Enter (ESC + Enter)', action: { type: 'send', data: '\x1b\r' } },
      { id: 'drawer-toggle', label: '☰ More', description: 'Open command drawer', action: { type: 'drawer-toggle' } },
      { id: 'paste', label: 'Paste', description: 'Paste from clipboard', action: { type: 'paste' } },
      { id: 'backspace', label: '⌫', description: 'Send Backspace key', action: { type: 'send', data: '\x7f' } },
      // ...
    ],
  },
  drawer: {
    buttons: [
      { id: 'tmux-new-window', label: '+ Win', description: 'Create tmux window', action: { type: 'send', data: '\x02c' } },
      { id: 'tmux-split-vertical', label: 'Split |', description: 'Split pane vertically', action: { type: 'send', data: '\x02|' } },
      { id: 'combo-picker', label: 'Combo', description: 'Open combo sender (Ctrl/Alt + key)', action: { type: 'combo-picker' } },
      // ...
    ],
  },
  gestures: {
    swipe: {
      enabled: true,
      left: '\x02n',         // data sent on swipe left (default: next tmux window)
      right: '\x02p',        // data sent on swipe right (default: prev tmux window)
      leftLabel: 'Next tmux window',    // shown in help overlay
      rightLabel: 'Previous tmux window',
    },
    scroll: {
      enabled: true,
      strategy: 'wheel',
      sensitivity: 40,
      wheelIntervalMs: 24,
    },
    pinch: { enabled: true },
  },
  mobile: {
    initData: '\x02z',     // send on mobile load when viewport < widthThreshold
    widthThreshold: 768,   // px — default matches common phone/tablet breakpoint
  },
  floatingButtons: [
    {
      position: 'top-left',
      buttons: [
        { id: 'zoom', label: 'Zoom', description: 'Toggle pane zoom', action: { type: 'send', data: '\x02z' } },
      ],
    },
  ],
})
```

<details>
<summary>Configure with an AI agent</summary>

### Install the webmux skill

```bash
npx skills add connorads/webmux
```

For a specific agent only (e.g. Claude Code, globally): `npx skills add connorads/webmux -a claude-code -g`

### Or paste this prompt

> Inspect my tmux config (`tmux show-options -g prefix` and `tmux list-keys`), then generate a `webmux.config.ts` tailored to my setup. Allowed root keys: `name theme font toolbar drawer gestures mobile floatingButtons pwa reconnect`. Action types: `send | ctrl-modifier | paste | combo-picker | drawer-toggle`. Use `drawer.buttons` not `drawer.commands`. Validate with `webmux build --dry-run` and fix any errors. Summarise what was configured.

See the full [agent setup guide](docs/guides/agent-setup.md) for examples and escape-code reference.

</details>

All fields are optional — defaults are filled in via `defineConfig()`.

At runtime, webmux validates the config object shape and rejects unknown keys with clear path-based errors.

`gestures.scroll.strategy` controls touch scroll behaviour:

- `wheel` (default): sends SGR mouse wheel events with touch-mapped terminal coordinates.
- `keys`: sends `PageUp` / `PageDown` for app-level paging when preferred.

### Programmatic API

```typescript
import { defineConfig, serialiseThemeForTtyd } from 'webmux/config'
import type { WebmuxConfig, ControlButton } from 'webmux/types'
import { init } from 'webmux'
```

Advanced consumers can use hook registry primitives to observe lifecycle and terminal-send events:

```typescript
import { createHookRegistry, init } from 'webmux'

const hooks = createHookRegistry()
hooks.on('beforeSendData', (ctx) => {
  if (ctx.data.includes('rm -rf /')) return { block: true }
})

init(undefined, hooks)
```

## Deployment guides

- [Tailscale Serve](docs/guides/tailscale-serve.md) — expose over your tailnet with HTTPS
- [Keeping your Mac awake](docs/guides/keep-awake.md) — prevent sleep during remote sessions
- [ttyd flags](docs/guides/ttyd-flags.md) — recommended ttyd options and theme flags
- [Mobile pane navigation](docs/guides/mobile-panes.md) — zoom-aware swipe, auto-zoom on load, floating buttons
- [Mobile-friendly tmux config](docs/guides/mobile-tmux.md) — responsive status bar, popup sizing, binding ergonomics
- [Agent setup](docs/guides/agent-setup.md) — configure webmux with AI agents

## Architecture

Pure TypeScript + DOM API — no framework. The build bundles all JS/CSS into a single HTML file via `Bun.build()`. ttyd handles WebSocket/PTY bridging; webmux only adds the mobile UI overlay.

Key modules:

| Module | Purpose |
|--------|---------|
| `src/toolbar/` | Two-row touch toolbar |
| `src/drawer/` | Command drawer with grid layout |
| `src/gestures/` | Swipe, pinch, scroll detection |
| `src/controls/` | Font size, help overlay, scroll buttons |
| `src/theme/` | Catppuccin Mocha + theme application |
| `src/viewport/` | Height management, landscape detection |
| `src/util/` | DOM helpers, terminal, keyboard, haptics |

## Public API and semver

webmux follows semantic versioning. The public API is defined by the following import paths:

| Import path | Contents | Stability |
|---|---|---|
| `webmux` | `init`, `defineConfig`, `createHookRegistry`, `WebmuxConfig`, `ControlButton`, `ButtonAction`, `ButtonArrayPatch`, `ButtonArrayInput`, `WebmuxConfigOverrides`, `HookRegistry` | Public — breaking changes are semver-major |
| `webmux/config` | `defineConfig`, `mergeConfig`, `defaultConfig`, `serialiseThemeForTtyd` | Public |
| `webmux/types` | All types in `src/types.ts` | Public |

**Internal modules** (not part of the public API — may change without a major version bump):
`src/toolbar/`, `src/drawer/`, `src/gestures/`, `src/controls/`, `src/theme/`, `src/viewport/`, `src/util/`, `src/serve.ts`, `src/cli/`, `build.ts`

**Semver policy**:
- **Major**: removing or renaming a public export, changing a public function signature incompatibly, removing a config field
- **Minor**: adding new public exports, new optional config fields, new `ButtonArrayInput` operations
- **Patch**: bug fixes, internal refactors, documentation updates

## Development

```bash
bun install
bun test
bun run check     # biome lint + format
bun run build     # build dist/index.html
```

For local development with `bun link`:

```bash
cd ~/git/webmux
bun link          # webmux CLI available globally
# Edit source → changes take effect on next build (no transpile step)
```

`bun link` installs the binary to `~/.bun/bin`. If `webmux` is not found after linking, add that directory to your PATH:

```bash
# Add to ~/.zshrc or ~/.bashrc
export PATH="$HOME/.bun/bin:$PATH"
```

Then reload your shell (`source ~/.zshrc`) and `webmux --version` should work.

## Licence

MIT
