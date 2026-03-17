# Mobile-friendly tmux config

remobi makes your browser the mobile client, but tmux itself can also adapt to narrow viewports. This guide covers making your `tmux.conf` respond to terminal width — so the same session works on a phone, a tablet, and a desktop without manual adjustment.

This is separate from pane navigation ergonomics, which are covered in [Mobile pane navigation](mobile-panes.md).

## Responsive status bar

The biggest win. tmux format strings support conditionals via `#{?condition,true,false}`, and `#{client_width}` gives you the current terminal width. Nest these to build breakpoints.

### status-left tiers

```tmux
# ~/.config/tmux/tmux.conf

# status-left: three tiers
# >= 80 cols: session name + zoom flag
# >= 50 cols: abbreviated session name + zoom flag
# <  50 cols: zoom flag only
set -g status-left "#{?#{>=:#{client_width},80},#[bold] #{session_name} #{?window_zoomed_flag,[Z] ,},#{?#{>=:#{client_width},50}, #{=8:session_name} #{?window_zoomed_flag,[Z] ,}, #{?window_zoomed_flag,[Z] ,}}}"
```

Reading nested conditionals is easier from the inside out:

```
#{?condition, true-branch, false-branch}
#{>=:A,B}   — true when A >= B (numeric comparison)
#{=N:var}   — truncate var to N characters
```

For readability, split across lines with line continuation (tmux ignores trailing `\` in `set` values):

```tmux
set -g status-left \
  "#{?#{>=:#{client_width},80},\
 #[bold]#{session_name} #{?window_zoomed_flag,[Z] ,},\
#{?#{>=:#{client_width},50},\
 #{=8:session_name} #{?window_zoomed_flag,[Z] ,},\
 #{?window_zoomed_flag,[Z] ,}}}"
```

> **Note:** Examples here use plain text formatting. If you use Powerline glyphs or Catppuccin status modules, wrap the same `#{?#{>=:...},...}` logic around your existing strings.

### status-right tiers

`status-right` typically carries date, hostname, or load — content worth stripping on mobile. A shell script is easier to read than deeply nested conditionals for four tiers:

```tmux
set -g status-right-length 100
set -g status-right "#(~/.config/tmux/status-right.sh #{client_width})"
```

`~/.config/tmux/status-right.sh`:

```sh
#!/bin/sh
# Print a status-right string appropriate for the given terminal width.
# Usage: status-right.sh <width>
width=${1:-80}

if [ "$width" -ge 120 ]; then
  # Full: date + time + hostname
  printf ' %s  %s ' "$(date '+%a %d %b')" "$(hostname -s)"
elif [ "$width" -ge 90 ]; then
  # Medium: date + hostname
  printf ' %s  %s ' "$(date '+%d %b')" "$(hostname -s)"
elif [ "$width" -ge 60 ]; then
  # Compact: hostname only
  printf ' %s ' "$(hostname -s)"
else
  # Mobile: nothing (preserve horizontal space)
  printf ''
fi
```

Make it executable: `chmod +x ~/.config/tmux/status-right.sh`

The shell script approach is easier to test independently and extend without counting brace depths.

## Window tab truncation

Long window names — especially those that include a working directory — eat horizontal space. Use `window-status-format` to hide the path on narrow terminals:

```tmux
# Wide: show name + path indicator
# Narrow (< 80): name only
set -g window-status-format \
  "#{?#{>=:#{client_width},80}, #I:#W#F , #I:#{=10:window_name}#F }"

set -g window-status-current-format \
  "#{?#{>=:#{client_width},80}, #[bold]#I:#W#F , #[bold]#I:#{=10:window_name}#F }"
```

`#W` is the full window name. `#{=10:window_name}` truncates to 10 characters. Adjust the threshold and length to suit your names.

If your window names include directory paths (e.g. via automatic renaming), keep them short — or use `set -g automatic-rename-format '#{b:pane_current_path}'` to show only the basename.

## Popup sizing

Fixed character sizes overflow narrow terminals. Use percentages instead:

```tmux
# Good — scales to whatever the terminal is
bind f display-popup -h 95% -w 100% -E "fzf --some-flags"

# Fragile — overflows if terminal is narrower than 120 cols
bind f display-popup -h 40 -w 120 -E "fzf --some-flags"
```

### display-popup + fzf vs display-menu

`display-menu` renders a tmux-native menu at a fixed position. `display-popup` opens a full sub-terminal — you can run `fzf`, `gum`, or any interactive picker inside it.

On a phone soft keyboard, a popup that fills the screen is easier to tap accurately than a small overlaid menu. Prefer `display-popup` for session/window pickers, file browsers, and any command that benefits from a scrollable list.

Example — session picker:

```tmux
bind s display-popup -h 50% -w 80% -E \
  "tmux list-sessions -F '#{session_name}' | fzf --prompt='session: ' | xargs tmux switch-client -t"
```

## Session and window naming

Short, memorable names make the status bar readable at any width.

```tmux
# Truncate long session names in the status bar
set -g status-left " #{=8:session_name} "

# Renumber windows when one is closed (avoids gaps like 1, 3, 4)
set -g renumber-windows on

# Use only the basename for auto-renamed windows
set -g automatic-rename-format '#{b:pane_current_path}'
```

Aim for session names of 4–8 characters (e.g. `dev`, `prod`, `infra`, `docs`). You can always rename: `prefix + $` for sessions, `prefix + ,` for windows.

## Zoom indicator

Always show `#{window_zoomed_flag}` in your status bar. On mobile you zoom frequently, and it is easy to forget whether you are in a zoomed single-pane view or a multi-pane layout.

```tmux
# In status-left or status-right, add:
#   #{?window_zoomed_flag,[Z] ,}
# e.g.
set -g status-left " #{session_name} #{?window_zoomed_flag,[Z] ,}"
```

The zoom indicator should be visible at all width tiers — put it inside every branch of your `#{?#{>=:...}}` conditionals, as shown in the responsive status-left example above.

## Binding ergonomics

Mobile soft keyboards typically cannot produce `Alt+Shift+key` or other multi-modifier combos. Prefer:

- **`prefix + single-key`** — works reliably from remobi via the Prefix button or a configured toolbar/drawer button.
- **Single-key in copy mode** — no modifier needed.
- **remobi toolbar/drawer buttons** — the right place for actions you want one-tap access to on mobile.

Move modifier-heavy bindings to remobi buttons rather than trying to send them from a soft keyboard. For example, if you have a binding like `bind -n M-S-f ...`, surface it as a remobi drawer button with `action: { type: 'send', data: '\x02f' }` (mapped to a simpler prefix binding instead).

## Mouse mode

```tmux
set -g mouse on
```

Mouse mode enables:
- **Tap to focus** — tap a pane to make it active
- **Touch scroll** — scroll terminal history with a swipe (works alongside remobi's own scroll handling)
- **Drag to resize** — drag pane borders to resize

This is the single highest-value setting for mobile use. Enable it unconditionally unless a specific workflow requires it off.

## Summary checklist

| Setting | Command | What it does |
|---------|---------|--------------|
| Responsive status-left | `set -g status-left "#{?#{>=:...},...}"` | Strip content on narrow terminals |
| Responsive status-right | script or nested `#{?}` | Hide date/host on very narrow terminals |
| Zoom indicator | `#{?window_zoomed_flag,[Z] ,}` in status | Always shows zoom state |
| Window tab truncation | `#{=N:window_name}` in `window-status-format` | Prevents tab overflow |
| Popup sizing | `-h 95% -w 100%` in `display-popup` | Fills screen regardless of terminal width |
| Mouse mode | `set -g mouse on` | Tap-to-focus, touch scroll, drag resize |
| Renumber windows | `set -g renumber-windows on` | Keeps window list tidy |
| Short names | `prefix + $` / `prefix + ,` | Readable at any width |

## Further reading

- [Mobile pane navigation](mobile-panes.md) — zoom-aware swipe, auto-zoom on load, floating buttons
