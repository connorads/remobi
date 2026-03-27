<div align="center">
  <img src="logo/logo.svg" width="128" alt="remobi logo"/>
</div>

# remobi

[![CI](https://github.com/connorads/remobi/actions/workflows/ci.yml/badge.svg)](https://github.com/connorads/remobi/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/remobi)](https://www.npmjs.com/package/remobi)
[![licence](https://img.shields.io/npm/l/remobi)](LICENSE)

**Your terminal. Everywhere.**

Your tmux session, on your phone. Same panes, same windows, same bindings — nothing changes on your computer. Swipe between windows, pinch to zoom, tap to send commands. You just get a remote control.

It's a terminal on a 6-inch screen. It won't win design awards. But you can do *everything* — monitor coding agents, intervene when they're stuck, scroll through output, switch contexts. Full power.

```bash
/bin/bash -c "$(curl -fsSL http://remobi.app/install.sh)"
```

To upgrade stable: `npm install -g remobi@latest`

To try the experimental channel: `npm install -g remobi@dev`

Your coding agent handles the rest. It installs remobi, inspects your tmux config, generates a config, and suggests tweaks to make your tmux more mobile-friendly — one conversation. Works with Claude Code and Codex.

## Why remobi

- **Zero workflow changes** — your existing tmux setup, untouched
- **Swipe between windows** — gesture navigation, no prefix key fumbling on a phone screen
- **Pinch to zoom** — resize text like every other app on your phone
- **Install to your home screen** — standalone PWA, looks and feels native
- **Config-driven** — your buttons, your gestures, your layout
- **Self-hosted** — local-first by default. Bring your own access layer (Tailscale, Cloudflare, ngrok)

<div align="center">
  <video src="https://github.com/user-attachments/assets/952bdb34-4b73-4210-815a-b2b60f99f87f" />
</div>

## Requirements

- [Node.js](https://nodejs.org/) ≥ 22
- [tmux](https://github.com/tmux/tmux) (the target multiplexer)

## Manual setup

```bash
# 1. Install
npm install -g remobi

# 2. Start (spawns your command, serves remobi on 127.0.0.1:7681)
remobi serve
```

For local development, see the [Development](#development) section below.

Open `http://localhost:7681` on the same machine to verify it works. For phone access, put a trusted proxy/tunnel in front of it, for example [Tailscale Serve](docs/guides/tailscale-serve.md).

## Release channels

- `main` publishes stable releases to npm `latest`
- `dev` publishes prereleases to npm `dev`
- merge `dev` into `main` to promote an experimental line to stable

If an experimental change is breaking for consumers, include a `BREAKING CHANGE:` footer so semantic-release computes the right next version on both channels. `!` in the header is optional shorthand only; on its own it does not trigger a major release in this repo.

## Set up with AI

Install the remobi skill:

```bash
npx skills add connorads/remobi
```

Then tell your coding agent:

> Use the remobi-setup skill to onboard me.

The agent will check your environment, inspect your tmux config, ask what you want, and generate everything — remobi config, tmux mobile tweaks, deployment setup. Full guided experience in one conversation.

## Security model

`remobi` is a remote-control surface for your terminal. Anyone who can reach it can drive the tmux session with your user privileges.

- `remobi serve` binds to `127.0.0.1` by default.
- The inner PTY-backed terminal session stays local to the remobi process.
- There is no built-in login, password, or ACL in remobi itself.
- Safe default: keep it on localhost and publish it through a trusted layer like Tailscale Serve.
- If you use `remobi serve --host 0.0.0.0`, you are exposing terminal control to your LAN/whatever can route to that port. Do that only if you intentionally want direct network exposure and have separate network controls in place.

To report a vulnerability, see [SECURITY.md](SECURITY.md).

## CLI reference

```text
remobi serve [--config <path>] [--port <n>] [--host <addr>] [-- <command...>]
  Start remobi with its built-in web terminal and PWA support.
  Default host: 127.0.0.1. Default port: 7681. Default command: tmux new-session -A -s main
  Example: remobi serve --host 0.0.0.0 --port 8080
  Example: remobi serve --port 8080 -- tmux new -As dev

remobi build [--config <path>] [--output <path>] [--dry-run]
  Deprecated. remobi no longer patches ttyd HTML.

remobi inject [--config <path>] [--dry-run]
  Deprecated. remobi no longer patches ttyd HTML.

remobi init
  Scaffold a remobi.config.ts with commented defaults.

remobi --version
remobi --help
```

Short flags: `-c` (`--config`), `-p` (`--port`). Legacy deprecated flags: `-o` (`--output`), `-n` (`--dry-run`).

### Config resolution

When `--config` is not specified, remobi searches:

1. `remobi.config.ts` / `.js` in the current directory
2. `~/.config/remobi/remobi.config.ts` / `.js` (XDG fallback)

## Configuration

Create `remobi.config.ts` (or run `remobi init`):

```typescript
import { defineConfig } from 'remobi/config'

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
      { id: 'tmux-split-vertical', label: 'Split |', description: 'Split pane vertically', action: { type: 'send', data: '\x02%' } },
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

All fields are optional — defaults are filled in via `defineConfig()`.

Shipped tmux drawer defaults stick to stock tmux bindings (`c`, `%`, `"`, `s`, `w`, `[`, `?`, `x`, `z`) rather than personal popup workflows.

Replace the drawer entirely with a plain array when you want a fully custom setup:

```typescript
import { defineConfig } from 'remobi/config'

export default defineConfig({
  drawer: {
    buttons: [
      { id: 'sessions', label: 'Sessions', description: 'Choose tmux session', action: { type: 'send', data: '\x02s' } },
      { id: 'git', label: 'Git', description: 'Open my tmux git popup', action: { type: 'send', data: '\x02g' } },
    ],
  },
})
```

At runtime, remobi validates the config object shape and rejects unknown keys with clear path-based errors.

`gestures.scroll.strategy` controls touch scroll behaviour:

- `wheel` (default): sends SGR mouse wheel events with touch-mapped terminal coordinates.
- `keys`: sends `PageUp` / `PageDown` for app-level paging when preferred.

### Programmatic API

```typescript
import { defineConfig, serialiseThemeForTtyd } from 'remobi/config'
import type { RemobiConfig, ControlButton } from 'remobi/types'
import { init } from 'remobi'
```

Advanced consumers can use hook registry primitives to observe lifecycle and terminal-send events:

```typescript
import { createHookRegistry, init } from 'remobi'

const hooks = createHookRegistry()
hooks.on('beforeSendData', (ctx) => {
  if (ctx.data.includes('rm -rf /')) return { block: true }
})

init(undefined, hooks)
```

## Deployment guides

- [Tailscale Serve](docs/guides/tailscale-serve.md) — expose over your tailnet with HTTPS
- [Keeping your Mac awake](docs/guides/keep-awake.md) — prevent sleep during remote sessions
- [ttyd flags](docs/guides/ttyd-flags.md) — legacy notes for old ttyd-based setups
- [Mobile pane navigation](docs/guides/mobile-panes.md) — zoom-aware swipe, auto-zoom on load, floating buttons
- [Mobile-friendly tmux config](docs/guides/mobile-tmux.md) — responsive status bar, popup sizing, binding ergonomics

## Architecture docs

- [How remobi works](docs/architecture/how-remobi-works.md) — runtime overview, shared session model, and boot path
- [Networking and WebSocket flow](docs/architecture/networking-and-websockets.md) — request lifecycle, protocol, and network boundary

## Architecture

Pure TypeScript + DOM API — no framework. The build bundles the browser client via esbuild, serves it from Node, and bridges browser input/output to a local PTY via `node-pty`. `xterm.js` handles terminal rendering in the browser; remobi layers the mobile controls on top. The docs above walk through the current runtime in more detail, including diagrams for the server, browser, and WebSocket flow.

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

remobi follows semantic versioning. The public API is defined by the following import paths:

| Import path | Contents | Stability |
|---|---|---|
| `remobi` | `init`, `defineConfig`, `createHookRegistry`, `RemobiConfig`, `ControlButton`, `ButtonAction`, `ButtonArrayPatch`, `ButtonArrayInput`, `RemobiConfigOverrides`, `HookRegistry` | Public — breaking changes are semver-major |
| `remobi/config` | `defineConfig`, `mergeConfig`, `defaultConfig`, `serialiseThemeForTtyd` | Public |
| `remobi/types` | All types in `src/types.ts` | Public |

**Internal modules** (not part of the public API — may change without a major version bump):
`src/toolbar/`, `src/drawer/`, `src/gestures/`, `src/controls/`, `src/theme/`, `src/viewport/`, `src/util/`, `src/serve.ts`, `src/cli/`, `build.ts`

**Semver policy**:
- **Major**: removing or renaming a public export, changing a public function signature incompatibly, removing a config field
- **Minor**: adding new public exports, new optional config fields, new `ButtonArrayInput` operations
- **Patch**: bug fixes, internal refactors, documentation updates

## Development

```bash
git clone https://github.com/connorads/remobi.git && cd remobi
pnpm install
git config core.hooksPath .hk-hooks   # enable commit hooks (conventional commits, biome)
```

### Running locally

From source (bundles the browser client on the fly via esbuild — no build step needed):

```bash
tsx cli.ts serve              # localhost:7681, default tmux session
```

Or build first, then run from dist/:

```bash
pnpm run build:dist          # transpile TS → JS + bundle browser client
node dist/cli.mjs serve      # run locally-built version on localhost:7681
```

No watch mode — re-run the build or use `tsx` for automatic source bundling.

### Checks

```bash
pnpm test            # vitest (unit + integration)
pnpm run test:pw     # playwright e2e (needs: pnpm exec playwright install chromium webkit --with-deps)
pnpm run check       # biome lint + format
```

## FAQ

**Is this secure?**
remobi doesn't handle auth — it's a UI overlay. Use a tunnel or VPN you trust. We recommend [Tailscale](docs/guides/tailscale-serve.md) (deployment guide included) — your session never leaves your tailnet. Cloudflare Tunnel and ngrok also work. Security is your responsibility.

**Why not Termux / Termius / SSH apps?**
They work. But you're managing SSH keys, losing your tmux setup, and fighting a UI that wasn't built for touch. remobi keeps your exact workflow — same panes, same windows, same bindings — and adds touch controls on top.

**Why not [Happy](https://github.com/slopus/happy) / Claude resume / chat-based mobile apps?**
Those tools change your workflow. Chat relays route through third-party servers. Claude's resume has limitations. remobi gives you the raw terminal — full power, self-hosted, works with every agent because it works with tmux.

**Why Node?**
remobi migrated from Bun to Node.js + pnpm for broader compatibility. It transpiles to JS via tsdown for npm distribution and uses esbuild for the browser client bundle.

**Is this production-ready?**
It's v0.1. The author uses it daily. It works. It's also early — feedback welcome, forks encouraged.

## Acknowledgements

remobi owns the full web terminal path now: a local PTY on the server, `xterm.js` in the browser, and the mobile touch controls on top.

Earlier versions were built on top of [ttyd](https://github.com/tsl0922/ttyd). It helped remobi launch quickly, prove the workflow, and shape the product before the runtime moved in-house.

## Licence

MIT
