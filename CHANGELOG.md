# Changelog

## Unreleased

This project has not been published yet. On first release, rename this section to `0.1.0` and add the release date.

- Added: `webmux serve` — single command to run webmux with full PWA support. Builds overlay in memory, manages ttyd lifecycle, serves manifest + icons + WebSocket relay. Replaces the multi-step build + ttyd + proxy workflow.
- Added: PWA support — web app manifest, 192/512px icons, apple-touch-icon, theme-color meta tags for "Add to Home Screen" installability on iOS and Android.
- Added: `pwa` config section (`enabled`, `shortName`, `themeColor`) — controls manifest generation and meta tag injection. `shortName` defaults to `name` when absent.
- Added: top-level `name` config field (default `'webmux'`) — used as document title, PWA manifest name, and apple-mobile-web-app-title. Replaces `pwa.name` and `pwa.shortName` (the latter is now optional and falls back to `name`).
- Added: default toolbar backspace button (`⌫`, sends `\x7f`) to provide reliable deletion on mobile keyboards when IME composition behaviour is inconsistent.
- Added: e2e smoke test scaffold (`tests/e2e/smoke.test.ts`) — checks ttyd availability, skips gracefully when absent, tests HTML serving and `webmux inject` pipe path against a real ttyd process. Closes #9.
- Added: ADR `docs/decisions/001-bun-only.md` — documents the decision to remain Bun-only, the Bun-specific APIs in use, and the conditions under which a Node runtime track would be considered. Closes #11.
- Added: plugin author guide (`docs/guides/plugins.md`) covering hooks, UI contributions, custom actions, and cleanup patterns. Closes #10.
- Added: stable public API surface defined in README — semver policy documents which import paths are public, what constitutes major/minor/patch. Closes #4.
- Added: UI contribution API for plugins — `context.ui.add(slot, button, priority?)` lets plugins contribute buttons to `'toolbar.row1'`, `'toolbar.row2'`, or `'drawer'` slots. Contributions are merged (appended) after config buttons, sorted by priority. Closes #8.
- Added: per-machine config overrides via `.local` config file — place `webmux.config.local.ts` next to your shared `webmux.config.ts` to apply machine-specific overrides (gitignore the `.local` file). Merged on top of the shared config using the same `WebmuxConfigOverrides` schema. Closes #12.
- Added: declarative button customisation — toolbar rows and drawer buttons now accept `ButtonArrayInput`: a plain array (replace), a function `(defaults) => newArray`, or a patch object with `append`, `prepend`, `remove`, `replace`, `insertBefore`, `insertAfter` operations. Closes #13.

- Breaking: unified toolbar/drawer model to `ControlButton` (`id`, `label`, `description`, `action`) and renamed `drawer.commands` to `drawer.buttons`.
- Changed: touch scrolling defaults to wheel semantics for better behaviour across OpenCode, Claude Code, and plain tmux shells.
- Added: dynamic help overlay rendered from current config (no stale hardcoded sections).
- Fixed: help overlay is now fail-safe and cannot block core overlay init.
- Fixed: viewport/keyboard height handling and document scroll lock to reduce white-gap/rubber-band issues on mobile.
- Added: runtime config validation with path-based errors and unknown-key checks at CLI load boundaries.
- Changed: config validation errors now include received-value previews, and CLI validates merged resolved config before build/inject execution.
- Added: stricter CLI parsing (`-c`/`-o`/`-n`, unknown-flag errors) plus `--dry-run` for `build` and `inject`. Closes #3.
- Changed: toolbar/drawer button handling now runs through a shared action registry abstraction. Closes #5.
- Added: typed hook registry for overlay lifecycle and terminal send pipeline with ordered execution and error isolation. Closes #6.
- Added: plugin manager primitives (`WebmuxPlugin`, setup/dispose lifecycle, failure isolation) and plugin-aware `init(..., hooks, plugins)` entry. Closes #7.
- Added: config `plugins` array support in CLI build/inject path with resolved local specifiers.
- Changed: CLI config validation remains strict; legacy config shapes are not auto-normalised.
- Tests: expanded integration/config/height coverage for the new config model and viewport logic.
- Added: `gestures.swipe.left`/`right` (data to send on swipe) and `leftLabel`/`rightLabel` (help overlay text) — defaults match previous hardcoded behaviour (`\x02n`/`\x02p`, next/previous tmux window).
- Added: `mobile.initData` (string | null) — arbitrary data sent to the terminal on mobile init when viewport is below `mobile.widthThreshold` (default 768px). Useful for auto-zooming a tmux pane (`'\x02z'`) or any other mobile-specific setup.
- Added: `floatingButtons` config — always-visible buttons on touch devices using the same `ControlButton` schema as toolbar/drawer. Renders in the help overlay when non-empty.
- Breaking: `floatingButtons` changed from a flat `ControlButton[]` to `FloatingButtonGroup[]`. Each group has a `position` (`'top-left' | 'top-right' | 'top-centre' | 'bottom-left' | 'bottom-right' | 'bottom-centre' | 'centre-left' | 'centre-right'`), optional `direction` (`'row' | 'column'`, default `'row'`), and a `buttons` array. Migrate: `floatingButtons: [btn]` → `floatingButtons: [{ position: 'top-left', buttons: [btn] }]`.
- Changed: Tailscale Serve guide now recommends always rebuilding the overlay before start; removed version-hash cache-key snippet to prevent stale build issues.
- Changed: default toolbar now uses explicit tmux `Prefix` (`C-b`) and `Alt+Enter` buttons for more predictable mobile input.
- Added: new drawer `Combo` action (`combo-picker`) that opens a small combo input modal for explicit Ctrl/Alt key sends.
- Added: default toolbar `q` button (row 2, left) for quitting interactive TUIs.
