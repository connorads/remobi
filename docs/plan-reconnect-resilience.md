# Plan: PWA Connection Resilience

## Context

When remobi's PWA loses focus on mobile, the WebSocket connection drops and the user sees "Connection lost" with a manual reload button. iOS Safari kills background connections within seconds (OS-level, unfixable). Android Chrome suspends client-side timers, so heartbeats stop and server-side timeouts kill the connection.

**We can't prevent disconnection** — but we can make reconnection seamless and invisible. The server already maintains terminal state via its headless xterm mirror and sends snapshots to new clients. We just need to auto-create a new WebSocket and restore state without a full page reload.

## Approach

### 1. Protocol: bidirectional ping/pong

**File: `src/session-protocol.ts`**

Currently ping is client→server only and pong is server→client only. Make both bidirectional:
- Add `PingMessage` to `ServerMessage` union
- Add `PongMessage` to `ClientMessage` union
- Add `'pong'` case to `parseClientMessage`
- Add `'ping'` case to `parseServerMessage`

The existing `PingMessage`/`PongMessage` interfaces are reusable — same shape regardless of direction.

### 2. Server-initiated heartbeat

**File: `src/session.ts`**

Add to `SharedTerminalSession`:
- `HEARTBEAT_INTERVAL_MS = 25_000`, `HEARTBEAT_TIMEOUT_MS = 10_000` constants
- `heartbeatInterval` field — `setInterval` that pings all clients every 25s
- `pendingPongs: Map<SessionClient, NodeJS.Timeout>` — per-client timeout tracking
- When ping sent, set 10s timeout per client. If no pong received, `client.close()`
- New `'pong'` case in `handleClientMessage` — clears the pending timeout
- Clean up in `dispose()`, `pty.onExit`, and `removeClient`

### 3. Config extension (additive)

**Files: `src/types.ts`, `src/config-schema.ts`, `src/config.ts`**

Extend `ReconnectConfig`:
```typescript
interface ReconnectConfig {
  readonly enabled: boolean
  readonly maxRetries: number   // default: 3
  readonly wakeLock: boolean    // default: false
}
```

### 4. New module: connection manager

**New file: `src/connection.ts`**

Pure browser-side module owning WebSocket lifecycle:
- `createConnectionManager(options)` → `ConnectionManager`
- Creates WebSocket, handles open/close/error/message
- Auto-responds to server `ping` with `pong`
- On disconnect: exponential backoff reconnect (1s, 2s, 4s) up to `maxRetries`
- On visibility change to visible: if socket closed, reconnect immediately (reset retries since user is actively looking). If socket "open", send health-check ping with 5s timeout
- On `navigator.online`: reconnect if disconnected
- Queues messages while disconnected, flushes on reconnect
- Calls `onReconnectFailed` only after exhausting retries → triggers overlay
- `dispose()` cleans up everything

### 5. New module: wake lock

**New file: `src/wake-lock.ts`**

Opt-in Screen Wake Lock API wrapper (prevents screen dimming while PWA is foreground):
- `setupWakeLock(): () => void`
- Request wake lock on setup, re-acquire on `visibilitychange` → visible
- Noop if API not supported
- Minimal type declarations for the Wake Lock API

### 6. Rewrite `client-entry.ts` to use connection manager

**File: `src/client-entry.ts`**

Replace manual WebSocket setup:
- Use `createConnectionManager` with callbacks for snapshot/output/exit/error
- `onSnapshot`: reset terminal, write snapshot data, set `snapshotLoaded = true`
- `onConnected`: call `syncSize()` to send dimensions (server sends snapshot via `addClient`)
- `onReconnectFailed`: show the existing session status overlay with "Connection lost"
- Reset `snapshotLoaded = false` and clear `pendingOutput` on each new snapshot (reconnection state reset)
- Remove direct WebSocket event listeners

### 7. Simplify `reconnect.ts`

**File: `src/reconnect.ts`**

Connection management moves to `connection.ts`. This becomes a thin wrapper:
- If `config.wakeLock`, call `setupWakeLock()` and store dispose
- Remove overlay creation, WebSocket tracking, visibility/online handlers (all moved to `connection.ts`)

## Verification

1. **Unit tests** (vitest + happy-dom):
   - `session-protocol.test.ts` — parsing bidirectional ping/pong
   - `session.test.ts` — heartbeat sends pings, closes unresponsive clients, cleans up
   - `connection.test.ts` (new) — auto-reconnect with backoff, visibility-triggered reconnect, pong response, message queueing, retry exhaustion
   - `wake-lock.test.ts` (new) — request/release lifecycle, noop when unsupported
   - `config-resolve.test.ts` / `config.test.ts` — new defaults
   - Update `reconnect.test.ts` for simplified module
2. **Manual**: run `tsx cli.ts serve`, connect from phone, switch apps, return — should auto-reconnect without reload
3. **`pnpm run check`** — biome lint/format
4. **Playwright** (`pnpm run test:pw`) — existing e2e tests still pass
