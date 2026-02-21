# Mobile pane navigation

Desktop tmux dashboards with 8–16 panes are effectively unusable on mobile — panes are squished to unreadable sizes. This guide shows how to combine webmux features with a smart tmux binding so you can navigate panes comfortably from your phone.

## The problem

When you swipe left/right in webmux, it sends `\x02n` / `\x02p` by default — next/previous **window**. That's fine for window switching, but it doesn't help when you have many panes in one window. On mobile you want to zoom a pane to full screen and swipe to cycle through them.

## Zoom-aware tmux bindings (recommended)

The cleanest solution requires no webmux config at all. Override `prefix n`/`prefix p` in tmux so they behave differently depending on whether a pane is zoomed:

```tmux
# ~/.config/tmux/tmux.conf

# Zoom-aware window/pane switching
# When zoomed: cycle to next/prev pane and re-zoom
# When not zoomed: behave as normal window switching
bind -N "Next window (zoom-aware)" n \
  if -F '#{window_zoomed_flag}' \
  'select-pane -t :.+ ; resize-pane -Z' \
  'next-window'

bind -N "Previous window (zoom-aware)" p \
  if -F '#{window_zoomed_flag}' \
  'select-pane -t :.- ; resize-pane -Z' \
  'previous-window'
```

With this binding:
- **Not zoomed**: `prefix n`/`prefix p` switch windows (default behaviour)
- **Zoomed**: `prefix n`/`prefix p` cycle to the next/previous pane and keep it zoomed

Swipe gestures in webmux still send `\x02n`/`\x02p`, so no webmux config change is needed — the tmux binding does all the work.

## Mobile init data

Use `mobile.initData` to send an arbitrary string to the terminal when webmux loads on a narrow viewport (below `mobile.widthThreshold`, default 768px). This runs once on page load.

**Auto-zoom on load:**

```typescript
// webmux.config.ts
import { defineConfig } from 'webmux'

export default defineConfig({
  mobile: {
    initData: '\x02z',   // send prefix-z to zoom current pane
  },
})
```

Now when you open the terminal on your phone, the current pane automatically zooms to full screen. Combined with the zoom-aware tmux bindings above, a left swipe will then cycle to the next pane (re-zoomed), and a right swipe will go to the previous pane.

The `widthThreshold` (default 768px) controls when initData is sent. Adjust if needed:

```typescript
mobile: {
  initData: '\x02z',
  widthThreshold: 1024,  // treat tablets in portrait as mobile too
},
```

## Floating buttons

Add `floatingButtons` to put always-visible quick-action buttons in the top-left corner, visible on touch devices only. Useful for a one-tap zoom button without opening the drawer:

```typescript
import { defineConfig } from 'webmux'

export default defineConfig({
  floatingButtons: [
    {
      id: 'zoom',
      label: 'Zoom',
      description: 'Toggle pane zoom',
      action: { type: 'send', data: '\x02z' },
    },
  ],
})
```

You can combine with swipe cycling buttons if you prefer explicit buttons over swipe gestures:

```typescript
floatingButtons: [
  {
    id: 'zoom',
    label: 'Zoom',
    description: 'Toggle pane zoom',
    action: { type: 'send', data: '\x02z' },
  },
  {
    id: 'next-pane',
    label: '›',
    description: 'Next pane',
    action: { type: 'send', data: '\x02]' },
  },
  {
    id: 'prev-pane',
    label: '‹',
    description: 'Previous pane',
    action: { type: 'send', data: '\x02[' },
  },
],
```

## Configurable swipe commands

Override what data swipe gestures send — useful if you prefer pane cycling over window switching:

```typescript
import { defineConfig } from 'webmux'

export default defineConfig({
  gestures: {
    swipe: {
      left: '\x02]',          // next pane (instead of next window)
      right: '\x02[',         // previous pane
      leftLabel: 'Next pane',
      rightLabel: 'Previous pane',
    },
  },
})
```

The `leftLabel`/`rightLabel` values appear in the help overlay (`?` button → Gestures section).

## Full recipe: auto-zoom + smart swipe cycling

Combine everything for the best mobile pane experience:

**1. tmux config** (`~/.config/tmux/tmux.conf`):

```tmux
bind -N "Next window (zoom-aware)" n \
  if -F '#{window_zoomed_flag}' \
  'select-pane -t :.+ ; resize-pane -Z' \
  'next-window'

bind -N "Previous window (zoom-aware)" p \
  if -F '#{window_zoomed_flag}' \
  'select-pane -t :.- ; resize-pane -Z' \
  'previous-window'
```

**2. webmux config** (`~/.config/webmux/webmux.config.ts`):

```typescript
import { defineConfig } from 'webmux'

export default defineConfig({
  mobile: {
    initData: '\x02z',  // auto-zoom current pane on mobile load
  },
  floatingButtons: [
    {
      id: 'zoom',
      label: 'Zoom',
      description: 'Toggle pane zoom',
      action: { type: 'send', data: '\x02z' },
    },
  ],
})
```

**Result:**
- Phone loads → current pane auto-zooms to full screen
- Swipe left → next pane (re-zoomed)
- Swipe right → previous pane (re-zoomed)
- Tap Zoom button → toggle zoom at any time
- No zoom active → swipe switches windows as normal

## General mobile tmux tips

- **Use zoom liberally** — `prefix z` is your friend on mobile. One pane at a time is readable; six squished panes are not.
- **Keep layouts simple** — flat window lists (many windows, few panes each) work better than deep nested pane trees.
- **Status bar pane info** — add `#{window_zoomed_flag}` to your status bar so you can see at a glance whether you're zoomed: `set -g status-right "#{window_zoomed_flag}[Z] #H"`.
- **Mouse mode** — `set -g mouse on` lets you tap a pane to focus it, scroll with touch, and resize panes by dragging borders.
- **Prefix key** — `\x02` is `Ctrl-b`. If you prefer a different prefix (e.g. `Ctrl-a`), update the `data` values in your webmux config accordingly.
