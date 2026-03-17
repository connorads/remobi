# Security policy

## Reporting a vulnerability

Email **security@remobi.app** with a description, reproduction steps, and impact assessment.

You should receive an acknowledgement within 48 hours. We aim to release a fix within 7 days for confirmed issues.

Please do not open a public GitHub issue for security vulnerabilities.

## Security model

remobi is a remote-control surface for your terminal — anyone who can reach it can drive the tmux session with your user privileges.

- **No built-in auth.** remobi binds to `127.0.0.1` by default and relies on an external access layer (Tailscale, Cloudflare Tunnel, VPN, etc.) for authentication and encryption.
- **Localhost default.** Both the remobi HTTP server and the inner ttyd process bind to loopback. Exposing via `--host 0.0.0.0` is opt-in and explicitly warned.
- **Origin check.** WebSocket upgrades, non-safe HTTP methods (POST/PUT/DELETE/PATCH), and the `/token` endpoint require a matching `Origin` header to prevent cross-site request forgery.
- **Content Security Policy.** Responses include a strict CSP that restricts script, style, font, image, and connect sources.

## Supply chain

npm packages are published via GitHub Actions with provenance attestations enabled. You can verify the build origin with:

```bash
npm audit signatures
```
