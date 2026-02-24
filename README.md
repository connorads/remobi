# webmux

Mobile-friendly terminal overlay for [ttyd](https://github.com/tsl0922/ttyd) + [tmux](https://github.com/tmux/tmux).

Turns a ttyd web terminal into a touch-optimised tmux client with toolbar, gesture support, and a command drawer. Produces a single `index.html` for `ttyd --index`.

## Features

- **`webmux serve`** — one command to run webmux: builds overlay in memory, manages ttyd, serves manifest + icons
- **PWA installable** — "Add to Home Screen" on iOS and Android with proper icon and standalone mode
- **Two-row toolbar** — Esc, Prefix (`C-b`), Tab, arrows, C-c, Enter, Alt+Enter, paste, backspace, drawer toggle
- **Config-driven controls** — unified button model across toolbar + drawer with ids and descriptions
- **Swipe gestures** — configurable swipe left/right with custom data and help overlay labels
- **Floating buttons** — always-visible quick-action buttons (top-left, touch only) for zoom, pane cycling, etc.
- **Touch scrolling modes** — default wheel scrolling for broad app compatibility, optional key paging
- **Pinch-to-zoom** — adjust font size with two-finger pinch
- **Font controls** — dedicated +/- buttons, top-right overlay
- **Help overlay** — in-app reference for all controls and gestures
- **Keyboard state preservation** — toolbar buttons don't force the virtual keyboard open
- **Catppuccin Mocha** — default theme, fully customisable
- **Landscape keyboard detection** — adapts toolbar layout in landscape + keyboard

## Requirements

- [Bun](https://bun.sh/) ≥ 1.0 (runtime — webmux ships TypeScript source, no transpilation)
- [ttyd](https://github.com/tsl0922/ttyd) (managed by `webmux serve`)
- [tmux](https://github.com/tmux/tmux) (the target multiplexer)

## Quick start

If the npm package is not published yet, use local development flow with `bun link` instead of `bun add -g webmux`.

```bash
# 1. Install
bun add -g webmux

# 2. Start (builds overlay, manages ttyd, serves with PWA support)
webmux serve
```

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
  plugins: [
    './plugins/logger.ts',
    'webmux-plugin-demo',
  ],
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

> Inspect my tmux config (`tmux show-options -g prefix` and `tmux list-keys`), then generate a `webmux.config.ts` tailored to my setup. Allowed root keys: `name theme font plugins toolbar drawer gestures mobile floatingButtons pwa`. Action types: `send | ctrl-modifier | paste | combo-picker | drawer-toggle`. Use `drawer.buttons` not `drawer.commands`. Validate with `webmux build --dry-run` and fix any errors. Summarise what was configured.

See the full [agent setup guide](docs/guides/agent-setup.md) for examples and escape-code reference.

</details>

All fields are optional — defaults are filled in via `defineConfig()`.

At runtime, webmux validates the config object shape and rejects unknown keys with clear path-based errors.

### Beta migration note

- Drawer config key is `drawer.buttons` (previously `drawer.commands`).
- Toolbar and drawer entries share one schema: `ControlButton` (`id`, `label`, `description`, `action`).
- Help content is generated from configured controls, so keep `description` clear and user-facing.

`gestures.scroll.strategy` controls touch scroll behaviour:

- `wheel` (default): sends SGR mouse wheel events with touch-mapped terminal coordinates.
- `keys`: sends `PageUp` / `PageDown` for app-level paging when preferred.

### Programmatic API

```typescript
import { defineConfig, serialiseThemeForTtyd } from 'webmux/config'
import type { WebmuxConfig, ControlButton } from 'webmux/types'
import { init } from 'webmux'
import type { WebmuxPlugin } from 'webmux'
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

You can also pass plugins to `init(config, hooks, plugins)`. Plugin setup/dispose failures are isolated and logged.

## Deployment guides

- [Tailscale Serve](docs/guides/tailscale-serve.md) — expose over your tailnet with HTTPS
- [ttyd flags](docs/guides/ttyd-flags.md) — recommended ttyd options and theme flags
- [Mobile pane navigation](docs/guides/mobile-panes.md) — zoom-aware swipe, auto-zoom on load, floating buttons
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

## Docs

- [Plugin author guide](docs/guides/plugins.md) — hooks, UI contributions, custom actions, cleanup

## Public API and semver

webmux follows semantic versioning. The public API is defined by the following import paths:

| Import path | Contents | Stability |
|---|---|---|
| `webmux` | `init`, `defineConfig`, `createHookRegistry`, `WebmuxConfig`, `ControlButton`, `ButtonAction`, `ButtonArrayPatch`, `ButtonArrayInput`, `WebmuxConfigOverrides`, `WebmuxPlugin`, `HookRegistry`, `UISlot`, `UIContributionCollector` | Public — breaking changes are semver-major |
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

## Licence

MIT
