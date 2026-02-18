# webmux

Mobile-friendly terminal overlay for [ttyd](https://github.com/tsl0922/ttyd) + [tmux](https://github.com/tmux/tmux).

Turns a ttyd web terminal into a touch-optimised tmux client with toolbar, gesture support, and context-aware command drawers. Produces a single `index.html` for `ttyd --index`.

## Features

- **Two-row toolbar** — Esc, Ctrl (sticky modifier), Tab, arrows, C-c, Enter, tmux prev/next, paste, drawer toggle
- **Context-aware drawers** — tab-based command drawer (tmux, custom contexts) with title-based auto-switching
- **Swipe gestures** — swipe left/right to switch tmux windows
- **Pinch-to-zoom** — adjust font size with two-finger pinch
- **Font controls** — dedicated +/- buttons, top-right overlay
- **Help overlay** — in-app reference for all controls and gestures
- **Keyboard state preservation** — toolbar buttons don't force the virtual keyboard open
- **Catppuccin Mocha** — default theme, fully customisable
- **Landscape keyboard detection** — adapts toolbar layout in landscape + keyboard

## Requirements

- [Bun](https://bun.sh/) ≥ 1.0 (runtime — webmux ships TypeScript source, no transpilation)
- [ttyd](https://github.com/tsl0922/ttyd) (for `webmux build` to fetch base HTML)
- [tmux](https://github.com/tmux/tmux) (the target multiplexer)

## Quick start

```bash
# 1. Install
bun add -g webmux

# 2. Build the overlay
webmux build --output index.html

# 3. Start ttyd
ttyd --index index.html -i 127.0.0.1 --port 7681 --writable tmux new -As main
```

Open `http://localhost:7681` on your phone.

## CLI reference

```
webmux build [--config <path>] [--output <path>]
  Build patched index.html. Starts temp ttyd, fetches base HTML, injects overlay.
  Default output: dist/index.html

webmux inject [--config <path>]
  Pipe mode: reads ttyd HTML from stdin, outputs patched HTML to stdout.
  Example: curl -s http://localhost:7681/ | webmux inject > patched.html

webmux init
  Scaffold a webmux.config.ts with commented defaults.

webmux --version
webmux --help
```

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
      { label: 'Esc', action: { type: 'send', data: '\x1b' } },
      { label: 'Ctrl', action: { type: 'ctrl-modifier' } },
      // ...
    ],
    row2: [
      { label: '☰ More', action: { type: 'drawer-toggle' } },
      { label: 'Paste', action: { type: 'paste' } },
      // ...
    ],
  },
  drawer: {
    commands: [
      { label: '+ Win', seq: '\x02c' },
      { label: 'Split |', seq: '\x02|' },
      // ...
    ],
  },
  gestures: {
    swipe: { enabled: true, threshold: 80, maxDuration: 400 },
    pinch: { enabled: true },
  },
})
```

All fields are optional — defaults are filled in via `defineConfig()`.

### Programmatic API

```typescript
import { defineConfig, serialiseThemeForTtyd } from 'webmux/config'
import type { WebmuxConfig, ButtonDef, DrawerCommand } from 'webmux/types'
```

## Deployment guides

- [Tailscale Serve](docs/guides/tailscale-serve.md) — expose over your tailnet with HTTPS
- [ttyd flags](docs/guides/ttyd-flags.md) — recommended ttyd options and theme flags

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

## Development

```bash
bun install
bun test          # 93 tests
bun run check     # biome lint + format
bun run build     # build dist/index.html
```

For local development with `bun link`:

```bash
cd ~/git/webmux
bun link          # webmux CLI available globally
# Edit source → changes take effect on next build (no transpile step)
```

## Licence

MIT
