# Security policy

## Reporting a vulnerability

Email **security@remobi.app** with a description, reproduction steps, and impact assessment.

You should receive an acknowledgement within 48 hours. We aim to release a fix within 7 days for confirmed issues.

Please do not open a public GitHub issue for security vulnerabilities.

## Security model

remobi is a remote-control surface for your terminal — anyone who can reach it can drive the tmux session with your user privileges.

- **No built-in auth.** remobi binds to `127.0.0.1` by default and relies on an external access layer (Tailscale, Cloudflare Tunnel, VPN, etc.) for authentication and encryption.
- **Localhost default.** The remobi HTTP server binds to loopback by default, and the built-in PTY runtime stays local to the remobi process. Exposing via `--host 0.0.0.0` is opt-in and explicitly warned.
- **Origin check.** WebSocket upgrades on `/ws` require a matching `Origin` header unless the request is loopback-local, which blocks cross-site WebSocket hijacking when remobi is published behind another access layer.
- **Minimal network surface.** remobi only serves the terminal client and its static assets over HTTP plus the `/ws` terminal socket. There is no built-in login, token, or session API.
- **Content Security Policy.** Responses include a strict CSP that restricts script, style, font, image, and connect sources.

## Supply chain

npm packages are published via GitHub Actions with provenance attestations enabled. You can verify the build origin with:

```bash
npm audit signatures
```
