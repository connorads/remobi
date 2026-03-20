# [0.5.0](https://github.com/connorads/remobi/compare/v0.4.0...v0.5.0) (2026-03-20)


### Bug Fixes

* **ci:** pin ttyd 1.7.7 via mise — fixes prefix e2e failures ([2e88df3](https://github.com/connorads/remobi/commit/2e88df39734c427b7973015e64f43a6b958c1cc1))


### Features

* prefix button sends prefix then opens combo picker ([cae17de](https://github.com/connorads/remobi/commit/cae17de6889658da8cc46ee8f917b542b4582bb3))

# [0.4.0](https://github.com/connorads/remobi/compare/v0.3.1...v0.4.0) (2026-03-20)


### Features

* add double-tap gesture for configurable terminal action ([7999f8e](https://github.com/connorads/remobi/commit/7999f8e625bdd38e6df900de6f1e36f3f25b5e2e))

## [0.3.1](https://github.com/connorads/remobi/compare/v0.3.0...v0.3.1) (2026-03-20)


### Bug Fixes

* prevent synthesised click from closing overlays opened by touch ([e5a625d](https://github.com/connorads/remobi/commit/e5a625db8dadec33c40046a90d230ebe0847b837))

# [0.3.0](https://github.com/connorads/remobi/compare/v0.2.7...v0.3.0) (2026-03-20)


### Bug Fixes

* prevent drawer from immediately closing on touch devices ([5cbfefe](https://github.com/connorads/remobi/commit/5cbfefec93d24ff11d9014b47a9da6effe56335c))
* stop buttons opening keyboard on Android ([d40fa46](https://github.com/connorads/remobi/commit/d40fa4662f11f3fc43b02019b186670cf06f0df1))


### Features

* show version in help overlay ([eab3272](https://github.com/connorads/remobi/commit/eab3272e979bcd4cf281325d90c9546d9794b565))

## [0.2.7](https://github.com/connorads/remobi/compare/v0.2.6...v0.2.7) (2026-03-19)


### Bug Fixes

* respond to touch events on all buttons for iOS Safari ([5af6dda](https://github.com/connorads/remobi/commit/5af6ddadfc6865be05ffff976da661db100b6783)), closes [#19](https://github.com/connorads/remobi/issues/19)

## [0.2.6](https://github.com/connorads/remobi/compare/v0.2.5...v0.2.6) (2026-03-17)


### Bug Fixes

* **ci:** gate release on CI success ([0171dcf](https://github.com/connorads/remobi/commit/0171dcf1a7bd07b9bf92be9c7889ce345432eed3))

## [0.2.5](https://github.com/connorads/remobi/compare/v0.2.4...v0.2.5) (2026-03-17)


### Bug Fixes

* add WS relay buffer size limit ([40478fb](https://github.com/connorads/remobi/commit/40478fb43e596078b2d3e94229db6aaf0533f06f))
* apply origin check to catch-all ttyd proxy ([240d8c3](https://github.com/connorads/remobi/commit/240d8c371baf97db0b98b0f5669e6ac9e0992595))
* scope CSP connect-src WebSocket to same host ([75f2149](https://github.com/connorads/remobi/commit/75f21498e175593393450ee240c967a76ee79468))
* seal __remobiSockets global ([be6e2db](https://github.com/connorads/remobi/commit/be6e2db1546eeca393e6e486289536bfd1f52f98))
* tighten CSP with script-src directive ([5a076fe](https://github.com/connorads/remobi/commit/5a076fedf3bd08ed81f9c54c90f91dcdaabe8ac9))
* use crypto PRNG for internal ttyd port ([10e7493](https://github.com/connorads/remobi/commit/10e7493ebf499ef813354548b8c31ced52602589))

## [0.2.4](https://github.com/connorads/remobi/compare/v0.2.3...v0.2.4) (2026-03-16)


### Bug Fixes

* **security:** escape font CDN URL and tighten WS origin check ([1c55d5c](https://github.com/connorads/remobi/commit/1c55d5c28d85d14fc42a90813d4e479b531e4243))

## [0.2.3](https://github.com/connorads/remobi/compare/v0.2.2...v0.2.3) (2026-03-16)


### Bug Fixes

* **serve:** default remobi serve to localhost ([6b8706e](https://github.com/connorads/remobi/commit/6b8706ec144ff2c92f92538a2c39997534b32e4d))

## [0.2.2](https://github.com/connorads/remobi/compare/v0.2.1...v0.2.2) (2026-03-16)

### Bug Fixes

* guard process.argv[1] for strict index access ([fd07a60](https://github.com/connorads/remobi/commit/fd07a6026135caffc189ba40fc0051d5ee9215fa))

## [0.2.1](https://github.com/connorads/remobi/compare/v0.2.0...v0.2.1) (2026-03-15)

### Bug Fixes

* resolve symlink in entry guard so npx execution works ([f2409e1](https://github.com/connorads/remobi/commit/f2409e1ae63540f5594cc2384b76f6be4a701c2b))

## [0.2.0](https://github.com/connorads/remobi/compare/v0.1.0...v0.2.0) (2026-03-15)

### Bug Fixes

* **ci:** add npm to mise.toml for OIDC trusted publishing ([62bfd3a](https://github.com/connorads/remobi/commit/62bfd3a79864dfe60c0edc0bd6528be0bfbf5e34))
* exclude package.json from Biome formatter ([eb88ac5](https://github.com/connorads/remobi/commit/eb88ac525c4acd04afe8b01ae71b80295ebce508))
* remove leading ./ from bin path for npm 11 compatibility ([b350ecb](https://github.com/connorads/remobi/commit/b350ecbe8197346c91f78bdb64bc2906b483a047))
* remove redundant checks from prepublishOnly ([9f2247c](https://github.com/connorads/remobi/commit/9f2247c6a915578e7c7e1394fd9f562c7faea70c))

### Features

* add pixel R> logo and integrate across project ([0235c4b](https://github.com/connorads/remobi/commit/0235c4be3f1d0b503f4531a4c8adc90283eece0f))

## 0.1.0 (2026-03-15)

### Breaking Changes

* migrated from Bun to Node.js 22+ with pnpm — runtime is now Node, bundler is esbuild, test runner is vitest, transpiler is tsdown; `remobi serve` uses Hono + @hono/node-ws; package ships transpiled JS (`dist/`) instead of TypeScript source
* unified toolbar/drawer model to `ControlButton` (`id`, `label`, `description`, `action`) and renamed `drawer.commands` to `drawer.buttons`
* `floatingButtons` changed from flat `ControlButton[]` to `FloatingButtonGroup[]` with `position`, optional `direction`, and `buttons` array
* removed plugin system (`RemobiPlugin`, `UISlot`, `UIContributionCollector`, plugin manager, UI contributions, build-time resolution, `config.plugins`) — hooks and actions remain as core infrastructure

### Features

* `remobi serve` — single command with full PWA support, overlay build, ttyd lifecycle, manifest + icons + WebSocket relay
* PWA support — web app manifest, 192/512px icons, apple-touch-icon, theme-color meta tags for "Add to Home Screen"
* reconnect overlay — detects connection loss via WebSocket interception, auto-reconnects on browser online event
* `remobi serve --no-sleep` — prevents macOS system sleep via `caffeinate -s -w <pid>`
* `floatingButtons` config — always-visible buttons on touch devices
* `gestures.swipe.left`/`right` and `leftLabel`/`rightLabel` for configurable swipe actions
* `mobile.initData` — arbitrary data sent to terminal on mobile init below width threshold
* `pwa` config section (`enabled`, `shortName`, `themeColor`)
* top-level `name` config field — used as document title, PWA manifest name, apple-mobile-web-app-title
* default toolbar backspace button (`⌫`) for reliable mobile deletion
* new drawer `Combo` action (`combo-picker`) for explicit Ctrl/Alt key sends
* default toolbar `q` button (row 2) for quitting interactive TUIs
* explicit tmux `Prefix` (`C-b`) and `Alt+Enter` toolbar buttons
* dynamic help overlay rendered from current config
* runtime config validation with path-based errors and unknown-key checks
* stricter CLI parsing (`-c`/`-o`/`-n`, unknown-flag errors) plus `--dry-run` for `build` and `inject`
* action registry abstraction for toolbar/drawer button handling
* typed hook registry for overlay lifecycle and terminal send pipeline
* declarative button customisation via `ButtonArrayInput`
* per-machine config overrides via `.local` config file
* overlay pre-built as IIFE during `build:dist` — faster `remobi serve` startup

### Bug Fixes

* visibilitychange listener leak in reconnect dispose path
* reconnect overlay retry on any tap, focused button for keyboard `Enter`, duplicate reload guard
* unhandled promise rejection when `document.fonts.ready` fails
* help overlay rewritten to DOM API (no innerHTML), eliminating XSS surface
* PWA meta-tag values HTML-attribute-escaped
* `waitForTerm` rejects after timeout (default 10s) instead of polling indefinitely
* help overlay is fail-safe and cannot block core overlay init
* viewport/keyboard height handling and document scroll lock for mobile
