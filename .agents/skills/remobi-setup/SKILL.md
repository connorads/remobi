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

This skill walks the user through setup in one conversation. The guiding principle: **detect everything possible, default everything sensible, ask only what requires human intent.** Most users answer 1-3 questions total.

## Workflow

### Phase 1: Welcome and understand (1 question)

Open with a one-liner confirming what they're getting, then ask what brings them here:

> "remobi puts your tmux session on your phone — same panes, same windows, touch controls on top. Everything we set up here you can change later."
>
> "What brings you to remobi? For example: monitoring coding agents from your phone, getting phone access to your dev sessions, or just curious to try it out."

Map the answer to a persona internally (don't tell the user their "persona"):

| Persona | Signals | Downstream effect |
|---------|---------|-------------------|
| **Agent Watcher** | Mentions coding agents, Claude Code, Codex, AI, monitoring | Auto-zoom on, floating zoom button, zoom-aware tmux bindings, lean config, minimal questions |
| **Remote Dev** | Mentions tmux, SSH, dev workflow, existing setup | Inspect config thoroughly, offer popup drawer buttons, ask about auto-zoom |
| **Newcomer** | Says curious, trying it out, heard about it, no specific use case | Offer tmux setup, explain concepts, auto-zoom on, sensible defaults |

If the answer is ambiguous, lean towards Agent Watcher — it's the most common path and the defaults work well for everyone.

### Phase 2: Environment and tmux setup

#### Check prerequisites

Run silently, then report what's present vs missing:

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

#### Inspect tmux

Gather the user's tmux configuration to inform config generation.

```bash
tmux show-options -g prefix                    # prefix key
tmux list-keys                                 # all bindings
tmux show-options -g mouse                     # mouse mode
tmux show-options -g status-left               # status bar
tmux show-options -g status-position            # top or bottom
tmux list-keys | grep display-popup            # popup bindings
```

If tmux isn't running, fall back to reading the config file directly:

```bash
cat ~/.config/tmux/tmux.conf 2>/dev/null || cat ~/.tmux.conf 2>/dev/null
```

Auto-detect and note:
- Prefix key and byte (Ctrl-B = `\x02`, Ctrl-A = `\x01`, etc.)
- Custom popup bindings (lazygit, yazi, scratch shell, system monitor, etc.)
- Whether mouse mode is on
- Split bindings (stock `%`/`"` or remapped `|`/`-`)
- Status bar complexity and position
- Plugin manager (tpm, etc.)
- Zoom-aware n/p bindings (from `references/mobile-panes.md`)

**Detect installed tools** — check for popular tools that work well as tmux popup bindings:

```bash
which lazygit              # Git TUI
which yazi                 # File manager
which btm || which htop    # System monitor
which nvim || which vim    # Editor
```

#### Offer tmux setup (Agent Watcher and Newcomer only)

If no tmux config exists, read `references/tmux-basics.md` and offer to create one. Frame it as a proposal, not a gap:

**Agent Watcher framing:**
> "I'll create a tmux config tuned for monitoring agents — mouse support, status bar at top, and zoom-aware navigation so you can swipe between agent panes on your phone. Go ahead?"

**Newcomer framing:**
> "tmux is the terminal multiplexer that remobi sits on top of — it keeps your sessions running even when you disconnect. I'll set up a config with mouse support, sensible defaults, and a help popup to learn the keybindings. Want me to explain what each setting does as I go?"

**Remote Dev:** Skip — they already have a config.

The starter config comes from `references/tmux-basics.md`. For Agent Watchers, include the "Agent watcher starter config" section (zoom-aware n/p, zoom indicator, auto-rename).

For Newcomers with detected tools, also offer popup bindings:
> "I found lazygit and yazi on your system. These work great as tmux popups — one keypress to open a floating window. Want me to add popup bindings for them?"

Only proceed to Phase 3 once the user has a working tmux session.

### Phase 3: Confirm detections and ask what's needed (0-3 questions)

Present a summary of what you found and what you plan to configure. The style is "here's what I'll do" with checkpoints, not an interview.

**Summary format:**
> "Based on your setup, here's what I'll configure:
> - Prefix: Ctrl-B (detected from your tmux config)
> - Auto-zoom on mobile load (pane fills the phone screen)
> - Floating zoom button (one-tap zoom toggle)
> - Default toolbar and drawer buttons
> - [If applicable:] Drawer buttons for lazygit and yazi (matching your popup bindings)"

Then ask **only** questions that can't be detected or defaulted:

#### Questions by persona

**Agent Watcher (0-1 questions):**

If popup bindings or tools were detected:
> "I found [lazygit/yazi/btm] on your system and matching popup bindings. Want drawer buttons for these in remobi so you can trigger them from your phone?"

If nothing special detected: **zero questions** — proceed straight to config generation.

**Remote Dev (1-3 questions):**

Question 1 (if popup bindings or tools detected):
> "I found popup bindings for [list]. Want matching drawer buttons in remobi?"

Question 2 (if multi-pane layout likely):
> "Do you want auto-zoom when you open remobi on your phone? This zooms the current pane to full screen — works well with multi-pane layouts on a small screen."

Question 3 (catch-all):
> "Anything else you want accessible from your phone? Custom tmux bindings, specific tools, anything I missed?"

**Newcomer (0-1 questions):**

If tools were detected and popup bindings were set up in Phase 2:
> "I set up popup bindings for [lazygit/yazi]. Want matching buttons in remobi's command drawer?"

Otherwise: **zero questions** — defaults are great to start with.

Summarise what you've gathered before moving to config generation.

### Phase 4: Generate config and suggest tmux tweaks

#### Generate `remobi.config.ts`

Export a plain config object — only include keys that differ from defaults, omit everything else. **Do not** `import { defineConfig } from 'remobi'` — the CLI calls `defineConfig()` internally so the config just needs a plain object export.

```typescript
export default {
  // Only non-default overrides here
}
```

Place at `~/.config/remobi/remobi.config.ts` (XDG location) unless the user prefers elsewhere.

After writing, validate:

```bash
remobi build --dry-run
```

A zero exit with "Dry run: build" output means valid. Fix any errors and re-validate until clean.

See [Config reference](#config-reference) below for the full schema, allowed keys, action types, and escape codes.

#### Suggest tmux mobile optimisations (Remote Dev only)

For Remote Dev users who already had a tmux config, offer mobile tweaks as a single confirmation. Read `references/mobile-tmux.md` and `references/mobile-panes.md` for full context.

> "I have a few suggestions to make your tmux more mobile-friendly: [list 2-3 most impactful items]. Want me to add these to your tmux.conf?"

Prioritise by impact, suggest maximum 3:

1. **Zoom-aware n/p bindings** (if multi-pane user and not already present)
2. **Responsive status bar** (if status bar would overflow on phone — see `references/mobile-tmux.md`)
3. **Zoom indicator** (if `#{window_zoomed_flag}` missing from status)

Also check and mention (but don't push):

| Check | Command | Good sign | Suggestion if missing |
|-------|---------|-----------|----------------------|
| Mouse mode | `tmux show -g mouse` | `on` | `set -g mouse on` |
| Status position | `tmux show -g status-position` | `top` | `set -g status-position top` (keeps status away from remobi toolbar) |
| Popup sizing | `tmux list-keys \| grep display-popup` | Uses `%` dimensions | Replace fixed char sizes with `95%`/`100%` |
| Window renumbering | `tmux show -g renumber-windows` | `on` | `set -g renumber-windows on` |

Suggest snippets only — never modify `tmux.conf` without explicit permission.

**Skip this for Newcomers** — their starter config from Phase 2 already includes the essentials.

### Phase 5: Deploy and wrap up

#### Deployment

Detect what's available and recommend accordingly:

```bash
which tailscale            # check for Tailscale
```

**If Tailscale installed:** recommend Tailscale Serve directly:
> "I see Tailscale on your system. Tailscale Serve is the simplest way to access remobi from your phone — HTTPS over your private network, no extra setup."

Read `references/tailscale-serve.md` for the full guide.

**If no Tailscale:** offer options:
> "To access remobi from your phone, you need to put it behind a trusted network layer. Options:
> - **Tailscale Serve** (recommended) — private VPN, HTTPS, easiest setup
> - **Cloudflare Tunnel + Access** — private tunnel with access policies
> - **Local network** — if your phone is on the same WiFi/VPN"

remobi is a remote-control surface for your terminal — never expose it to the public internet. All deployment options keep access private.

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

#### Summary

Tell the user:
1. What was configured and why (prefix byte, custom bindings, gestures, auto-zoom)
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
7. This is a starting point — not a locked-in config. Run this skill again any time to tweak buttons, add drawer commands, or change gestures.

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
| `left` | <- | `send` `\x1b[D` |
| `up` | up arrow | `send` `\x1b[A` |
| `down` | down arrow | `send` `\x1b[B` |
| `right` | -> | `send` `\x1b[C` |
| `ctrl-c` | C-c | `send` `\x03` |
| `enter` | enter | `send` `\r` |

**Toolbar row 2** (7 buttons):

| `id` | `label` | `action` |
|------|---------|----------|
| `q` | q | `send` `q` |
| `alt-enter` | M-enter | `send` `\x1b\r` |
| `ctrl-d` | C-d | `send` `\x04` |
| `drawer-toggle` | hamburger More | `drawer-toggle` |
| `paste` | Paste | `paste` |
| `backspace` | backspace | `send` `\x7f` |
| `space` | Space | `send` `' '` |

**Drawer** (12 buttons):

| `id` | `label` | `action` |
|------|---------|----------|
| `tmux-new-window` | + Win | `send` `\x02c` |
| `tmux-split-vertical` | Split \| | `send` `\x02%` |
| `tmux-split-horizontal` | Split -- | `send` `\x02"` |
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
| `gestures.doubleTap.enabled` | `false` | Opt-in double-tap gesture on terminal screen |
| `gestures.doubleTap.data` | `'\x02z'` | Data to send on double-tap (default: tmux zoom toggle) |
| `gestures.doubleTap.maxInterval` | `300` | Max milliseconds between taps |

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
Ctrl-B + c  ->  '\x02c'   (new window)
Ctrl-B + n  ->  '\x02n'   (next window)
Ctrl-B + p  ->  '\x02p'   (previous window)
Ctrl-B + z  ->  '\x02z'   (zoom pane)
Ctrl-B + %  ->  '\x02%'   (split vertical -- stock tmux)
Ctrl-B + "  ->  '\x02"'   (split horizontal -- stock tmux)
Ctrl-B + [  ->  '\x02['   (copy mode)
Ctrl-B + d  ->  '\x02d'   (detach)
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

### Agent watcher — auto-zoom + floating button

```typescript
export default {
  name: 'agents',
  mobile: {
    initData: '\x02z',    // zoom focused pane on mobile load
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
