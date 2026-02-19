# Changelog

## Unreleased

This project has not been published yet. On first release, rename this section to `0.1.0` and add the release date.

- Breaking: unified toolbar/drawer model to `ControlButton` (`id`, `label`, `description`, `action`) and renamed `drawer.commands` to `drawer.buttons`.
- Changed: touch scrolling defaults to wheel semantics for better behaviour across OpenCode, Claude Code, and plain tmux shells.
- Added: dynamic help overlay rendered from current config (no stale hardcoded sections).
- Fixed: help overlay is now fail-safe and cannot block core overlay init.
- Fixed: viewport/keyboard height handling and document scroll lock to reduce white-gap/rubber-band issues on mobile.
- Tests: expanded integration/config/height coverage for the new config model and viewport logic.
