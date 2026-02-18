# webmux

Mobile-friendly terminal overlay for [ttyd](https://github.com/tsl0922/ttyd) + [tmux](https://github.com/tmux/tmux).

Turns a ttyd web terminal into a touch-optimised tmux client with toolbar, gesture support, and context-aware command drawers.

## Features

- **Two-row toolbar** — Esc, Ctrl (sticky modifier), Tab, arrows, C-c, Enter, tmux prev/next, paste, context drawer buttons
- **Context-aware drawers** — tab-based drawer with tmux commands and Claude Code commands (Mode, Yes/No, slash commands)
- **Title-based auto-detection** — automatically switches active drawer tab based on terminal title (e.g. detects Claude Code)
- **Keyboard state preservation** — toolbar buttons don't open the virtual keyboard when it was closed
- **Swipe gestures** — swipe left/right to switch tmux windows
- **Pinch-to-zoom** — adjust font size with two-finger pinch
- **Font controls** — dedicated +/- buttons, top-right overlay
- **Help overlay** — in-app reference for all controls and gestures
- **Catppuccin Mocha** — default theme, fully customisable
- **Landscape keyboard detection** — adapts toolbar in landscape + keyboard

## Install

```bash
bun add -g webmux
# or
bunx webmux build
```

## Usage

### Build patched index.html

```bash
webmux build [--config webmux.config.ts] [--output dist/index.html]
```

Starts a temporary ttyd, fetches its base HTML, injects the overlay, outputs a single `index.html`. Use with `ttyd --index`:

```bash
ttyd --index dist/index.html -i 127.0.0.1 --port 7681 --writable tmux new -As main
```

### Pipe mode

```bash
curl -s http://localhost:7681/ | webmux inject > patched.html
```

### Scaffold config

```bash
webmux init
```

## Configuration

Create `webmux.config.ts`:

```typescript
import { defineConfig } from 'webmux'

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
      { label: '◀ Prev', action: { type: 'send', data: '\x02p' } },
      { label: '⌘ claude', action: { type: 'drawer-open', contextId: 'claude' } },
      { label: '⌘ tmux', action: { type: 'drawer-open', contextId: 'tmux' } },
      // ...
    ],
  },
  drawer: {
    contexts: [
      {
        id: 'tmux',
        label: 'tmux',
        commands: [
          { label: '+ Win', seq: '\x02c' },
          // ...
        ],
      },
      {
        id: 'claude',
        label: 'claude',
        titlePatterns: ['claude'],
        commands: [
          { label: 'Mode', seq: '\x1b[Z' },
          { label: 'Yes', seq: 'y' },
          // ...
        ],
      },
    ],
  },
  gestures: {
    swipe: { enabled: true, threshold: 80, maxDuration: 400 },
    pinch: { enabled: true },
  },
})
```

## Architecture

Pure TypeScript + DOM API — no framework. The build produces a single HTML file containing all JS/CSS inlined. ttyd handles all WebSocket/PTY bridging; webmux only adds the mobile UI overlay.

The drawer supports multiple contexts (tmux, claude, custom) with a tab bar for switching. Title-based auto-detection watches `document.title` to switch the active tab automatically.

## Development

```bash
bun install
bun test          # Run tests
bun run check     # biome lint + format
bun run build     # build dist/index.html
```

## Licence

MIT
