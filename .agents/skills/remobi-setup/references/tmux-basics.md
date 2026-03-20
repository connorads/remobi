# tmux basics

Starter guide for users with no existing tmux config. General audience, informed by best practices.

## What is tmux?

tmux (terminal multiplexer) lets you run multiple terminal sessions inside one connection. Three key benefits:

1. **Persistent sessions** — your work survives disconnects. SSH in from your laptop, detach, pick up on your phone with remobi. The session keeps running.
2. **Windows and panes** — split your terminal into multiple views. Run your editor in one pane, tests in another, logs in a third — all visible at once.
3. **Popup tools** — launch tools like lazygit, file managers (yazi), or scratch shells in floating popups over your current work. One keypress to open, one to close.

## Install tmux

- macOS: `brew install tmux`
- Debian/Ubuntu: `sudo apt install tmux`
- Fedora: `sudo dnf install tmux`
- Check: `tmux -V`

## Core concepts

**Sessions** — persistent workspaces that survive disconnects, network drops, and closing your terminal. Each session has one or more windows. Think of a session as a project workspace.

**Windows** — like browser tabs within a session. Each window has its own shell and can be split into panes. Switch between windows with prefix + number or next/previous.

**Panes** — splits within a window. View multiple terminals side by side. Zoom any pane to full screen with prefix + z (great on mobile).

## Session workflow

```bash
tmux new -s dev             # create named session
tmux ls                     # list sessions
tmux attach -t dev          # reattach to session
tmux new-session -A -s dev  # attach if exists, else create (what remobi serve uses)
```

- Detach: `Ctrl-B d` (keeps session running in background)
- Kill session: `tmux kill-session -t dev`

## Essential keybindings (prefix = Ctrl-B)

| Keys | Action |
|------|--------|
| `c` | New window |
| `n` / `p` | Next / previous window |
| `0-9` | Go to window N |
| `,` | Rename window |
| `%` | Split pane vertically |
| `"` | Split pane horizontally |
| `z` | Toggle pane zoom (full screen current pane) |
| `x` | Kill pane (with confirm) |
| `[` | Enter scroll/copy mode (q to exit) |
| `d` | Detach from session |
| `s` | Session picker |
| `w` | Window picker |
| `?` | List all keybindings |

## Recommended starter `tmux.conf`

Location: `~/.config/tmux/tmux.conf` (XDG) or `~/.tmux.conf` (legacy).

```tmux
# -- Essentials ---------------------------------------------------------------

set -g mouse on                    # Click, scroll, drag pane borders
set -g renumber-windows on         # No gaps after closing windows
set -g history-limit 50000         # Generous scrollback
set -g escape-time 10              # Near-instant Escape (0 can cause issues)
set -g focus-events on             # Pass focus events to apps (neovim etc.)
set -g set-clipboard on            # OSC 52 clipboard (works over SSH)

# -- True colour --------------------------------------------------------------
set -g default-terminal "tmux-256color"
set -ga terminal-overrides ",*256col*:Tc"  # Enable true colour

# -- Status bar ----------------------------------------------------------------
set -g status-position top         # Status at top (phone-friendly: thumb zone at bottom)
set -g status-interval 15          # Refresh every 15s

# -- Better splits (in current working directory) -----------------------------
bind | split-window -h -c "#{pane_current_path}"
bind - split-window -v -c "#{pane_current_path}"
bind c new-window -c "#{pane_current_path}"

# -- Vi mode for copy (optional) ----------------------------------------------
setw -g mode-keys vi
```

## Your first popup — keybinding help

tmux's `display-popup` lets you launch anything in a floating window. Start with a help popup that shows all your keybindings — no extra tools needed, works out of the box:

```tmux
# Help popup — shows all keybindings in a floating window (press q to close)
bind ? display-popup -E -w 80% -h 80% "tmux list-keys | less"
```

This overrides the default `prefix + ?` (which uses tmux's built-in pager) with a cleaner floating popup. Press `q` to close.

Once you see how popups work, you'll want more. Here are common tools that work great as popups:

```tmux
# lazygit — git TUI in a floating popup
bind g display-popup -E -w 95% -h 95% -d "#{pane_current_path}" "lazygit"

# yazi — file manager popup
bind y display-popup -E -w 95% -h 95% -d "#{pane_current_path}" "yazi"

# scratch shell — ephemeral shell for quick commands
bind ` display-popup -E -w 80% -h 80% -d "#{pane_current_path}"

# system monitor (btm or htop)
bind b display-popup -E -w 95% -h 95% "btm"
```

Key flags:
- `-E` — close popup when command exits
- `-w 95% -h 95%` — use percentage dimensions (scales to phone screens)
- `-d "#{pane_current_path}"` — open in same directory as current pane

After adding popup bindings to tmux, add matching drawer buttons in your remobi config so you can trigger them from your phone.

## Custom prefix (optional)

Some users prefer Ctrl-A (screen-style). If changing prefix, update remobi config too:

```tmux
unbind C-b
set -g prefix C-a
bind C-a send-prefix
```

## Plugin management with tpm (optional)

```bash
git clone https://github.com/tmux-plugins/tpm ~/.tmux/plugins/tpm
```

Add to end of `tmux.conf`:

```tmux
set -g @plugin 'tmux-plugins/tpm'
set -g @plugin 'tmux-plugins/tmux-sensible'    # Sensible defaults
set -g @plugin 'tmux-plugins/tmux-resurrect'   # Save/restore sessions across restarts
run '~/.tmux/plugins/tpm/tpm'
```

Install plugins: `prefix + I` (capital i).

## Agent watcher starter config

For users who primarily monitor coding agents (Claude Code, Codex, etc.) from their phone. Extends the base starter config with a zoom indicator and auto-rename. Pane zoom is handled by remobi's double-tap gesture — no special tmux bindings needed.

Add these to the starter config above:

```tmux
# -- Zoom indicator in status bar ---------------------------------------------
set -g status-left " #{session_name} #{?window_zoomed_flag,[Z] ,}"

# -- Auto-rename windows to current directory ---------------------------------
set -g automatic-rename-format '#{b:pane_current_path}'
```

Combined with remobi's double-tap zoom and `mobile.initData: '\x02z'` (auto-zoom on phone load), this gives agent watchers:
- Phone loads -> current pane auto-zooms to full screen
- Double-tap terminal -> toggle zoom on/off to inspect any pane
- Swipe left/right -> navigate between windows
- `[Z]` in status bar always shows you're zoomed

See `mobile-panes.md` for advanced tmux patterns that extend gesture behaviour.

## Tips for remobi users

- `set -g status-position top` keeps the status bar away from remobi's toolbar at the bottom
- Mouse mode (`set -g mouse on`) lets you click panes and scroll on your phone
- Use `%` dimensions in `display-popup` (e.g. `95%x95%`) not fixed char widths — they scale to phone screens
- Zoom pane (`prefix + z`) is your best friend on mobile — remobi can auto-zoom on connect via `mobile.initData`
- See `mobile-tmux.md` for responsive status bar breakpoints and mobile-specific optimisations
- See `mobile-panes.md` for pane workflows and advanced tmux patterns that extend gesture behaviour
