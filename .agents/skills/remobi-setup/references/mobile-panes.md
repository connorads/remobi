# Mobile pane navigation

Desktop tmux dashboards with 8-16 panes are effectively unusable on mobile — panes are squished to unreadable sizes. This guide shows how to navigate panes comfortably from your phone using remobi's built-in features.

## The problem

When you swipe left/right in remobi, it sends `\x02n` / `\x02p` by default — next/previous **window**. That's fine for window switching, but it doesn't help when you have many panes in one window. On mobile you want to zoom a pane to full screen and cycle through them.

## Double-tap zoom (recommended)

remobi has a built-in double-tap gesture that sends any escape sequence when you double-tap the terminal screen. Combined with auto-zoom on load and a floating zoom button, this gives you full pane control without any tmux config changes:

**remobi config** (`~/.config/remobi/remobi.config.ts`):

```typescript
export default {
  mobile: {
    initData: '\x02z',  // auto-zoom current pane on mobile load
  },
  gestures: {
    doubleTap: {
      enabled: true,     // double-tap terminal to toggle zoom
    },
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

**Result:**
- Phone loads -> current pane auto-zooms to full screen
- Double-tap terminal -> toggle zoom on/off
- Tap floating Zoom button -> toggle zoom
- Swipe left/right -> navigate windows (always, even when zoomed)

This workflow keeps swipe for window navigation and uses double-tap/button for zoom control. No tmux config changes needed.

## Mobile init data

Use `mobile.initData` to send an arbitrary string to the terminal when remobi loads on a narrow viewport (below `mobile.widthThreshold`, default 768px). This runs once on page load.

**Auto-zoom on load:**

```typescript
// remobi.config.ts
export default {
  mobile: {
    initData: '\x02z',   // send prefix-z to zoom current pane
  },
}
```

The `widthThreshold` (default 768px) controls when initData is sent. Adjust if needed:

```typescript
mobile: {
  initData: '\x02z',
  widthThreshold: 1024,  // treat tablets in portrait as mobile too
},
```

## Floating buttons

Add `floatingButtons` to put always-visible quick-action buttons at a chosen position, visible on touch devices only. Each group specifies a `position` and a `buttons` array. Useful for a one-tap zoom button without opening the drawer:

```typescript
export default {
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

## Configurable swipe commands

Override what data swipe gestures send — useful if you prefer pane cycling over window switching:

```typescript
export default {
  gestures: {
    swipe: {
      left: '\x02]',          // next pane (instead of next window)
      right: '\x02[',         // previous pane
      leftLabel: 'Next pane',
      rightLabel: 'Previous pane',
    },
  },
}
```

The `leftLabel`/`rightLabel` values appear in the help overlay (`?` button -> Gestures section).

## Advanced: extending gestures via tmux

remobi gestures send escape sequences — tmux interprets them. This means you can create "smart" gesture behaviour purely via tmux config, with no remobi changes needed. The binding decides what happens; remobi just sends the key.

### Example: zoom-aware pane cycling

Override `prefix n`/`prefix p` in tmux so they behave differently depending on whether a pane is zoomed:

```tmux
# ~/.config/tmux/tmux.conf

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

Swipe gestures in remobi still send `\x02n`/`\x02p`, so no remobi config change is needed — the tmux binding does all the work.

**Trade-off**: this prevents swiping between windows when zoomed. If you use double-tap zoom (recommended above), you probably want simple window navigation on swipe instead.

This pattern generalises — any tmux binding can add conditional logic to change what a remobi gesture does. For example, you could make swipe send different commands based on the current program (`if -F '#{pane_current_command}'`).

## General mobile tmux tips

See [Mobile-friendly tmux config](mobile-tmux.md) for a full guide on responsive status bars, popup sizing, zoom indicators, mouse mode, and binding ergonomics.
