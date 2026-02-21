# Changelog

## Unreleased

This project has not been published yet. On first release, rename this section to `0.1.0` and add the release date.

- Breaking: unified toolbar/drawer model to `ControlButton` (`id`, `label`, `description`, `action`) and renamed `drawer.commands` to `drawer.buttons`.
- Changed: touch scrolling defaults to wheel semantics for better behaviour across OpenCode, Claude Code, and plain tmux shells.
- Added: dynamic help overlay rendered from current config (no stale hardcoded sections).
- Fixed: help overlay is now fail-safe and cannot block core overlay init.
- Fixed: viewport/keyboard height handling and document scroll lock to reduce white-gap/rubber-band issues on mobile.
- Added: runtime config validation with path-based errors and unknown-key checks at CLI load boundaries.
- Changed: config validation errors now include received-value previews, and CLI validates merged resolved config before build/inject execution.
- Added: stricter CLI parsing (`-c`/`-o`/`-n`, unknown-flag errors) plus `--dry-run` for `build` and `inject`.
- Changed: toolbar/drawer button handling now runs through a shared action registry abstraction.
- Added: typed hook registry for overlay lifecycle and terminal send pipeline with ordered execution and error isolation.
- Added: plugin manager primitives (`WebmuxPlugin`, setup/dispose lifecycle, failure isolation) and plugin-aware `init(..., hooks, plugins)` entry.
- Added: config `plugins` array support in CLI build/inject path with resolved local specifiers.
- Changed: CLI config validation remains strict; legacy config shapes are not auto-normalised.
- Tests: expanded integration/config/height coverage for the new config model and viewport logic.
- Added: `gestures.swipe.left`/`right` (data to send on swipe) and `leftLabel`/`rightLabel` (help overlay text) — defaults match previous hardcoded behaviour (`\x02n`/`\x02p`, next/previous tmux window).
- Added: `mobile.initData` (string | null) — arbitrary data sent to the terminal on mobile init when viewport is below `mobile.widthThreshold` (default 768px). Useful for auto-zooming a tmux pane (`'\x02z'`) or any other mobile-specific setup.
- Added: `floatingButtons` config — always-visible buttons on touch devices using the same `ControlButton` schema as toolbar/drawer. Renders in the help overlay when non-empty.
- Breaking: `floatingButtons` changed from a flat `ControlButton[]` to `FloatingButtonGroup[]`. Each group has a `position` (`'top-left' | 'top-right' | 'top-centre' | 'bottom-left' | 'bottom-right' | 'bottom-centre' | 'centre-left' | 'centre-right'`), optional `direction` (`'row' | 'column'`, default `'row'`), and a `buttons` array. Migrate: `floatingButtons: [btn]` → `floatingButtons: [{ position: 'top-left', buttons: [btn] }]`.
