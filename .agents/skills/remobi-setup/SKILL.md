---
name: remobi-setup
description: >
  Full interactive onboarding for remobi — the mobile terminal overlay for tmux.
  Checks prerequisites, inspects tmux config, interviews the user about their
  workflow, generates a validated remobi.config.ts, suggests tmux mobile
  optimisations, and walks through deployment. Use this skill whenever someone
  asks to set up remobi, configure remobi, onboard with remobi, generate a
  remobi config, make tmux mobile-friendly, or deploy remobi with Tailscale.
  Also use when the user says "onboard me" or "set up my phone terminal".
---

# remobi-setup

Interactive onboarding skill for [remobi](https://github.com/connorads/remobi) — monitor and control tmux from your phone.

This skill walks the user through the full setup journey in one conversation. Each phase builds on the last; skip phases the user doesn't need.

## Workflow

### Phase 1: Assess environment

Check what's installed and help fill gaps.

```bash
node --version          # need >= 22
which ttyd              # must be on PATH
tmux -V                 # target multiplexer
which remobi            # npm install -g remobi
```

If anything is missing, help install it:
- **Node**: suggest mise, nvm, or direct install
- **ttyd**: `brew install ttyd` (macOS), distro package or source build (Linux) — see [ttyd installation](https://github.com/tsl0922/ttyd#installation)
- **tmux**: `brew install tmux` or distro package
- **remobi**: `npm install -g remobi`

Move on once all four are present.

### Phase 2: Inspect tmux setup

Gather the user's tmux configuration to inform config generation.

```bash
tmux show-options -g prefix                    # prefix key
tmux list-keys                                 # all bindings
tmux show-options -g mouse                     # mouse mode
tmux show-options -g status-left               # status bar
tmux list-keys | grep display-popup            # popup bindings
```

If tmux isn't running, fall back to reading the config file directly:

```bash
cat ~/.config/tmux/tmux.conf 2>/dev/null || cat ~/.tmux.conf 2>/dev/null
```

Note down:
- Prefix key and byte (Ctrl-B = `\x02`, Ctrl-A = `\x01`, etc.)
- Custom bindings worth surfacing as buttons (especially popup bindings for lazygit, yazi, neovim, fzf pickers, scratch shells)
- Whether mouse mode is on
- Status bar complexity (affects mobile width recommendations)
- Plugin manager (tpm, etc.)

If the user has no tmux config at all, read `references/tmux-basics.md` and help them create a starter config:
- Explain what tmux is and its benefits (persistent sessions, windows/panes, popup tools)
- Install tmux if missing
- Create `~/.config/tmux/tmux.conf` with mouse, renumber-windows, true colour, scrollback, vi keys
- Explain sessions/windows/panes and the essential keybindings
- Set up a help popup as the first `display-popup` binding: `bind ? display-popup -E -w 80% -h 80% "tmux list-keys | less"` — immediate payoff, no extra tools, teaches the popup concept
- Suggest `status-position top` (keeps status away from remobi toolbar)
- Optionally set up tpm for plugin management

Only proceed to Phase 3 once the user has a working tmux session.

**Detect installed tools** — check for popular tools that work well as tmux popup bindings:

```bash
which lazygit              # Git TUI — great as popup
which yazi                 # File manager — great as popup
which btm || which htop    # System monitor
which nvim || which vim    # Editor
```

Note which tools are installed. In Phase 3, suggest popup bindings for each. In Phase 4, generate matching drawer buttons. If none are installed, suggest lazygit as the most valuable first popup tool.

### Phase 3: Interview the user

Ask questions **one at a time** — don't dump a list. Adapt based on what you learned in phase 2.

1. **What do you primarily use tmux for?** (coding agents, dev workflow, server monitoring, all of the above)
2. **Do you use popup bindings for tools?** Which ones? (lazygit, yazi, neovim, scratch shell, session picker)
3. **Detected tools** — "I detected [lazygit/yazi/btm/etc.] on your system. Would you like popup bindings in tmux and matching drawer buttons in remobi for any of these?" Adapt based on Phase 2 detection. For tools not installed, briefly explain what they are and ask if the user wants to install any.
4. **Custom split bindings?** — Stock tmux uses `%` (vertical) and `"` (horizontal). Some configs remap to `|` and `-`. If custom, the drawer buttons need updated escape codes.
5. **Do you want touch scrolling?** — `wheel` (default, recommended) sends mouse-wheel events — works in vim, less, htop, and any mouse-aware app. `keys` sends PageUp/PageDown — simpler, works everywhere including plain tmux copy-mode. Which fits your workflow? Config shape: `gestures: { scroll: { strategy: 'wheel' } }` or `gestures: { scroll: { strategy: 'keys' } }`.
6. **Auto-zoom on mobile?** When you open remobi on your phone, should the current pane zoom to full screen automatically?
7. **Floating zoom button?** A persistent button overlaid on the terminal for one-tap zoom toggle
8. **Custom theme or Catppuccin Mocha?** (Catppuccin Mocha is the default and looks great — only ask if the user's tmux theme is clearly different)
9. **Font preference?** (default: JetBrainsMono NFM)
10. **Any other tmux bindings you want on your phone?** (This catches anything the inspection missed)

Skip questions where you already know the answer from phase 2. Summarise what you've gathered before moving to config generation.

### Phase 4: Generate `remobi.config.ts`

Export a plain config object — only include keys that differ from defaults, omit everything else. **Do not** `import { defineConfig } from 'remobi'` — the CLI calls `defineConfig()` internally so the config just needs a plain object export.

```typescript
export default {
  // Only non-default overrides here
}
```

After writing, validate:

```bash
remobi build --dry-run
```

A zero exit with "Dry run: build" output means valid. Fix any errors and re-validate until clean.

See [Config reference](#config-reference) below for the full schema, allowed keys, action types, and escape codes.

### Phase 5: Suggest tmux mobile optimisations

Ask: "Would you like suggestions for making your tmux config more mobile-friendly?"

If yes, run the checks below. If tmux isn't running, read the config file directly. For full context and examples, read `references/mobile-tmux.md` and `references/mobile-panes.md`.

| Check | Command | Good sign | Suggestion if missing |
|-------|---------|-----------|----------------------|
| Responsive status-left | `tmux show -g status-left` | Contains `#{client_width}` | Add width breakpoints to strip content on narrow terminals |
| Responsive status-right | `tmux show -g status-right` | Contains `#{client_width}` or calls a script | Progressive content stripping |
| Popup sizing | `tmux list-keys \| grep display-popup` | Uses `%` dimensions | Replace fixed char sizes with `95%`/`100%` |
| Zoom indicator | `tmux show -g status-left` | Contains `window_zoomed_flag` | Add `#{?window_zoomed_flag,[Z] ,}` |
| Mouse mode | `tmux show -g mouse` | `on` | `set -g mouse on` |
| Window renumbering | `tmux show -g renumber-windows` | `on` | `set -g renumber-windows on` |
| Zoom-aware navigation | `tmux list-keys \| grep 'select-pane.*resize-pane'` | Present | Add zoom-aware `n`/`p` bindings (see `references/mobile-panes.md`) |

For each missing item, offer a concrete snippet the user can paste into `tmux.conf`. Suggest snippets only — never modify `tmux.conf` without explicit permission.

### Phase 6: Deployment guidance

Ask: "How do you want to access remobi from your phone?"

remobi is a remote-control surface for your terminal — never expose it to the public internet. All deployment options below keep access private.

Common options:
- **Tailscale Serve** (recommended) — HTTPS over your private tailnet. Read `references/tailscale-serve.md` for the full guide.
- **Cloudflare Tunnel + Access** — private tunnel with Cloudflare Access policies controlling who can connect (e.g. restrict by email, IdP group, device posture). Do not use unauthenticated quick tunnels.
- **Local network only** — `remobi serve` on localhost behind your own VPN or private network.

#### Security hardening

remobi hardens the connection even on private networks. Mention these if the user has security concerns:

- **Binds `127.0.0.1` only** — never exposed to network without explicit `--host` flag
- **Content-Security-Policy** — strict default-src, script-src, connect-src scoped to same host
- **WebSocket origin validation** — rejects cross-origin upgrade requests
- **Relay buffer limit** — 1 MB per connection; drops oversized payloads
- **Crypto-secure internal port** — ttyd listens on a random ephemeral port (crypto PRNG), never exposed
- **X-Frame-Options DENY** — prevents clickjacking via iframes
- **Referrer-Policy: no-referrer** — no URL leaking to external sites

For macOS users, mention `--no-sleep` and point to `references/keep-awake.md` for persistent options.

For users who want manual ttyd control, point to `references/ttyd-flags.md`.

### Phase 7: Summarise

Tell the user:
1. What was configured and why (prefix byte, custom bindings, gestures, theme)
2. How to start: `remobi serve`
3. How to access from their phone (URL from deployment choice)
4. PWA install: on mobile, tap "Add to Home Screen" for a standalone app experience
5. Built-in mobile controls (these work out of the box, no config needed):
   - **Font size**: `+`/`-` buttons in top-right. Config: `font.mobileSizeDefault` (default 16px), `font.sizeRange` (default [8, 32]), steps by 2
   - **Scroll buttons**: Floating arrow buttons on the sides. Long-press for rapid repeat (300ms delay, 100ms interval). Auto-fade after 2s. Strategy follows `gestures.scroll.strategy` (`wheel` sends mouse events, `keys` sends PageUp/PageDown)
   - **Combo picker**: Modal for arbitrary key combos — type `C-s`, `M-Enter`, `Alt-x`, `C-[`. Supports Ctrl, Alt, Shift modifiers + named keys (PageUp, Escape, etc.). Opened via drawer "Combo" button
   - **Help overlay**: `?` button in top-right. Shows all configured buttons, gestures, and floating buttons in tables. Config-driven, updates when you change buttons
   - **Landscape + keyboard**: When on-screen keyboard opens in landscape, row 2 auto-hides and buttons shrink. No config needed
6. PWA: enabled by default. On mobile Safari/Chrome, tap Share then "Add to Home Screen" for standalone app experience. Config options:
   - `pwa.enabled` (default `true`) — set `false` to disable manifest + icons
   - `pwa.themeColor` (default `'#1e1e2e'`) — status bar colour on mobile
   - `pwa.shortName` (optional) — short name for home screen icon (falls back to `name`)

---

## Config reference

### Allowed root keys

Exactly these — validation rejects anything else:

```
name  theme  font  toolbar  drawer  gestures  mobile  floatingButtons  pwa  reconnect
```

### ButtonAction union

| `type`           | Required fields     | Notes |
|------------------|---------------------|-------|
| `send`           | `data: string`      | Optional `keyLabel?: string` for help overlay |
| `ctrl-modifier`  | (none)              | Opens Ctrl+key combo UI |
| `paste`          | (none)              | Paste from clipboard |
| `combo-picker`   | (none)              | Opens Ctrl/Alt + key modal |
| `drawer-toggle`  | (none)              | Opens/closes command drawer |

Non-`send` actions must NOT have `data` or `keyLabel` — the validator rejects them.

### ControlButton shape

Every button in toolbar rows, drawer, and floatingButtons uses this schema:

```typescript
{
  id: string           // unique within its array
  label: string        // text shown on the button
  description: string  // shown in help overlay — keep user-facing and clear
  action: ButtonAction
}
```

### Button array forms (`toolbar.row1`, `toolbar.row2`, `drawer.buttons`)

Two forms — pick the least invasive:

```typescript
// 1. Replace entirely (plain array)
toolbar: { row1: [{ id, label, description, action }, ...] }

// 2. Transform (function receives defaults, returns new array)
toolbar: { row2: (defaults) => defaults.filter(b => b.id !== 'q') }

// Function form covers all operations via standard JS:
// - Append:  (d) => [...d, newBtn]
// - Prepend: (d) => [newBtn, ...d]
// - Remove:  (d) => d.filter(b => b.id !== 'q')
// - Replace: (d) => d.map(b => b.id === 'tmux-prefix' ? newBtn : b)
// - Insert:  (d) => { const i = d.findIndex(b => b.id === 'tab'); return [...d.slice(0,i), newBtn, ...d.slice(i)] }
```

### Floating buttons

Must use the grouped shape — a flat `ControlButton[]` is rejected:

```typescript
floatingButtons: [
  {
    position: 'top-left',           // required
    direction: 'row',               // optional: 'row' | 'column' (default 'row')
    buttons: [{ id, label, description, action }],
  },
]
```

Valid positions: `top-left | top-right | top-centre | bottom-left | bottom-right | bottom-centre | centre-left | centre-right`

### Default button IDs

**Toolbar row 1** (10 buttons):

| `id` | `label` | `action` |
|------|---------|----------|
| `esc` | Esc | `send` `\x1b` |
| `tmux-prefix` | Prefix | `send` `\x02` |
| `tab` | Tab | `send` `\t` |
| `shift-tab` | S-Tab | `send` `\x1b[Z` |
| `left` | ← | `send` `\x1b[D` |
| `up` | ↑ | `send` `\x1b[A` |
| `down` | ↓ | `send` `\x1b[B` |
| `right` | → | `send` `\x1b[C` |
| `ctrl-c` | C-c | `send` `\x03` |
| `enter` | ⏎ | `send` `\r` |

**Toolbar row 2** (7 buttons):

| `id` | `label` | `action` |
|------|---------|----------|
| `q` | q | `send` `q` |
| `alt-enter` | M-↵ | `send` `\x1b\r` |
| `ctrl-d` | C-d | `send` `\x04` |
| `drawer-toggle` | ☰ More | `drawer-toggle` |
| `paste` | Paste | `paste` |
| `backspace` | ⌫ | `send` `\x7f` |
| `space` | Space | `send` `' '` |

**Drawer** (12 buttons):

| `id` | `label` | `action` |
|------|---------|----------|
| `tmux-new-window` | + Win | `send` `\x02c` |
| `tmux-split-vertical` | Split \| | `send` `\x02%` |
| `tmux-split-horizontal` | Split — | `send` `\x02"` |
| `tmux-zoom` | Zoom | `send` `\x02z` |
| `tmux-sessions` | Sessions | `send` `\x02s` |
| `tmux-windows` | Windows | `send` `\x02w` |
| `page-up` | PgUp | `send` `\x1b[5~` |
| `page-down` | PgDn | `send` `\x1b[6~` |
| `tmux-copy` | Copy | `send` `\x02[` |
| `tmux-help` | Help | `send` `\x02?` |
| `tmux-kill-pane` | Kill | `send` `\x02x` |
| `combo-picker` | Combo | `combo-picker` |

### Gestures

| Field | Default | Notes |
|-------|---------|-------|
| `gestures.swipe.enabled` | `true` | |
| `gestures.swipe.left` | `'\x02n'` | Next tmux window |
| `gestures.swipe.right` | `'\x02p'` | Previous tmux window |
| `gestures.swipe.threshold` | `80` | Pixels |
| `gestures.swipe.maxDuration` | `400` | Milliseconds |
| `gestures.pinch.enabled` | `false` | |
| `gestures.scroll.enabled` | `true` | |
| `gestures.scroll.strategy` | `'wheel'` | `'wheel'` (recommended) sends SGR mouse wheel sequences — works in vim, less, htop. `'keys'` sends PageUp/PageDown — simpler, works everywhere |
| `gestures.scroll.sensitivity` | `40` | |
| `gestures.scroll.wheelIntervalMs` | `24` | |

### Font

| Field | Default | Notes |
|-------|---------|-------|
| `font.family` | `'JetBrainsMono NFM, monospace'` | CSS font-family |
| `font.cdnUrl` | jsdelivr nerdfont URL | CSS file for web font |
| `font.mobileSizeDefault` | `16` | px, applied on mobile |
| `font.sizeRange` | `[8, 32]` | Min/max for +/- buttons |

### PWA

| Field | Default | Notes |
|-------|---------|-------|
| `pwa.enabled` | `true` | Set `false` to disable manifest + icons |
| `pwa.themeColor` | `'#1e1e2e'` | Status bar colour on mobile |
| `pwa.shortName` | (none) | Short name for home screen icon, falls back to `name` |

### Hooks (advanced)

Hooks are programmatic, not via `defineConfig()`. See `references/hooks.md` if the user asks about analytics, action filtering, or custom DOM. Do not proactively suggest hooks during setup.

### Escape-code cheat sheet

Use these in `action.data` and gesture `left`/`right` fields:

| Key            | Escape sequence | Notes |
|----------------|-----------------|-------|
| Ctrl-B (prefix)| `\x02`          | Default tmux prefix |
| Ctrl-A (prefix)| `\x01`          | screen/byobu/custom prefix |
| Ctrl-C         | `\x03`          | Interrupt |
| Ctrl-D         | `\x04`          | EOF / exit shell |
| Escape         | `\x1b`          | |
| Tab            | `\t`            | |
| Shift+Tab      | `\x1b[Z`        | |
| Enter          | `\r`            | |
| Alt+Enter      | `\x1b\r`        | |
| Backspace      | `\x7f`          | DEL character |
| Up arrow       | `\x1b[A`        | |
| Down arrow     | `\x1b[B`        | |
| Right arrow    | `\x1b[C`        | |
| Left arrow     | `\x1b[D`        | |
| Page Up        | `\x1b[5~`       | |
| Page Down      | `\x1b[6~`       | |
| Space          | `' '`           | literal space |

### Composing tmux key sequences

tmux bindings are `prefix` + `key`. Concatenate the bytes:

```
Ctrl-B + c  →  '\x02c'   (new window)
Ctrl-B + n  →  '\x02n'   (next window)
Ctrl-B + p  →  '\x02p'   (previous window)
Ctrl-B + z  →  '\x02z'   (zoom pane)
Ctrl-B + %  →  '\x02%'   (split vertical — stock tmux)
Ctrl-B + "  →  '\x02"'   (split horizontal — stock tmux)
Ctrl-B + [  →  '\x02['   (copy mode)
Ctrl-B + d  →  '\x02d'   (detach)
```

For a custom prefix (e.g. Ctrl-A): replace `\x02` with `\x01`.

## Example configs

### Minimal — default Ctrl-B prefix, custom name only

```typescript
export default {
  name: 'dev',
}
```

### Custom prefix — Ctrl-A (screen/byobu style)

Replace the default `tmux-prefix` button and update swipe gestures:

```typescript
export default {
  name: 'dev',
  toolbar: {
    row1: (defaults) => defaults.map(b =>
      b.id === 'tmux-prefix'
        ? { ...b, description: 'Send tmux prefix key (Ctrl-A)', action: { type: 'send', data: '\x01' } }
        : b
    ),
  },
  gestures: {
    swipe: {
      left: '\x01n',
      right: '\x01p',
      leftLabel: 'Next tmux window',
      rightLabel: 'Previous tmux window',
    },
  },
  drawer: {
    buttons: (defaults) => defaults.map(b => {
      // Remap tmux-prefixed buttons from Ctrl-B (\x02) to Ctrl-A (\x01)
      if (b.action.type === 'send' && b.action.data.startsWith('\x02')) {
        return { ...b, action: { ...b.action, data: '\x01' + b.action.data.slice(1) } }
      }
      return b
    }),
  },
}
```

### Floating buttons + mobile auto-zoom

```typescript
export default {
  mobile: {
    initData: '\x02z',    // zoom focused pane on mobile load
    widthThreshold: 768,
  },
  floatingButtons: [
    {
      position: 'top-left',
      buttons: [
        {
          id: 'zoom',
          label: 'Zoom',
          description: 'Toggle pane zoom',
          action: { type: 'send', data: '\x02z' },
        },
      ],
    },
  ],
}
```

### Scroll strategy — keys instead of wheel

```typescript
export default {
  gestures: {
    scroll: { strategy: 'keys' },
  },
}
```

### Popup-heavy workflow — lazygit, yazi, scratch shell

Uses function form to keep default drawer buttons and append popup triggers:

```typescript
export default {
  name: 'dev',
  drawer: {
    buttons: (defaults) => [
      ...defaults,
      {
        id: 'lazygit',
        label: 'Git',
        description: 'Open lazygit popup (prefix + g)',
        action: { type: 'send', data: '\x02g' },
      },
      {
        id: 'yazi',
        label: 'Files',
        description: 'Open yazi file manager popup (prefix + y)',
        action: { type: 'send', data: '\x02y' },
      },
      {
        id: 'scratch',
        label: 'Scratch',
        description: 'Open scratch shell popup (prefix + `)',
        action: { type: 'send', data: '\x02`' },
      },
    ],
  },
}
```

Requires matching tmux bindings (see `references/tmux-basics.md` popup section).

## Guardrails

- **Do not `import` from `'remobi'`** — the CLI calls `defineConfig()` internally, so configs just export a plain object. Using `import { defineConfig } from 'remobi'` fails when the config lives outside a project with remobi installed.
- **Never invent root keys.** The validator rejects unknown keys with a path-based error.
- **Use `drawer.buttons`, never `drawer.commands`** — the latter was renamed and no longer works.
- **`send` actions require `data`** — omitting it fails validation.
- **Non-`send` actions must not have `data` or `keyLabel`** — validator rejects them.
- **`floatingButtons` is an array of groups** — wrap buttons in `{ position, buttons }`.
- **`toolbar` has `row1` and `row2`** — there is no `row3` or flat `buttons` key on toolbar.
- **`mobile.initData`** is `string | null` — set to `null` to disable, not `false` or `''`.
- **`reconnect`** has only `enabled: boolean` — defaults to `true`. Set `{ enabled: false }` to disable.
- **`gestures.scroll` is an object, not a string** — use `{ strategy: 'wheel' }` or `{ strategy: 'keys' }`, never a bare `'wheel'` / `'keys'` string.

## Validation

```bash
remobi build --dry-run          # validates config, prints plan, exits without building
remobi build --dry-run -c ./remobi.config.ts   # explicit path
```

A zero exit with "Dry run: build" output means the config is valid. Any error output means fix the reported paths before proceeding.

### Common validation errors

| Error | Cause | Fix |
|-------|-------|-----|
| `config.<unknown-key>` | Invented or legacy root key | Remove it; only allowed root keys are valid |
| `config.drawer.commands` | Old key name | Rename to `drawer.buttons` |
| `config.toolbar.buttons` | Wrong toolbar shape | Use `toolbar.row1` and/or `toolbar.row2` |
| `action.type: expected 'send' \| ...` | Wrong type string | Use exact literal from ButtonAction union |
| `action.data: expected string, received undefined` | `send` action missing `data` | Add `data: '\x...'` |
| `action.data: expected undefined` | `data` on non-`send` action | Remove `data` from non-`send` actions |
| `floatingButtons[0]: expected object` | Flat `ControlButton[]` | Wrap in group: `{ position: 'top-left', buttons: [...] }` |
| `mobile.initData: expected string or null` | `false` or `0` passed | Use `null` to disable, or a string to send |
| `Cannot find package 'remobi'` | Config uses `import ... from 'remobi'` | Remove the import — export a plain object instead. The CLI calls `defineConfig()` internally |
| `gestures.scroll: expected Object, received string` | Bare `'wheel'` / `'keys'` string | Use `{ strategy: 'wheel' }` or `{ strategy: 'keys' }` |
