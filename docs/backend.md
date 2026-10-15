# Backend

## Current implementation

The foundation implements HTTP discovery, a real WebSocket gateway, eight synthetic read methods, persistent generated installations, bounded SQLite evidence and private operator commands. [TODO.md](../TODO.md) is the progress source of truth.

`tools/prepare-reference.ps1` downloads the exact historical source commit and records its archive hash. `deploy/reference/` builds and starts upstream only inside an isolated reference container. `tools/capture-reference.mjs` uses a WebSocket client to capture genuine responses. This reference system is development tooling, never the public honeypot backend.

## Architecture

The approved backend has an HTTP/WebSocket adapter, immutable synthetic world, deception policy, eight read-only method handlers and a single SQLite evidence writer. See the [design](superpowers/specs/2026-10-14-openclaw-gateway-design.md) and [plan](superpowers/plans/2026-10-15-openclaw-gateway-foundation.md) for exact contracts and acceptance criteria.

Incoming data must pass resource admission before parsing/dispatch. Evidence preparation is persisted before successful responses are sent. A socket-send callback is not proof of remote receipt. Private operator commands remain offline and distinct from synthetic public capabilities.

## Compatibility

Profile: OpenClaw v2026.1.29 / protocol 3, commit `77e703c69b07a236c2f0962bd195e03aae1b8da0`. Required reference/decoy comparisons use the same canonical dataset. Dynamic-field normalisation must be explicit; business data cannot be normalised away to manufacture agreement.

The eight implemented methods are health, system-presence, agents.list, models.list, skills.status, config.get, sessions.list and chat.history. The foundation does not execute commands, install skills, contact real integrations or invoke a model.

## Operator workflow

Run `npm ci`, `npm test`, then `node dist/src/cli.js serve --data-dir data`. Default bind: loopback port 18789. `provision` creates an installation; ordinary restarts preserve it; `reprovision` explicitly rotates and archives the old world. Generation uses local randomness and curated templates. No provider key is needed, and rebuilding an image does not rotate an existing volume.

Private commands: `check`, `provision`, `reprovision`, `export`, `replay`, `recover`. Stop the sensor before operating on its data directory. An exclusive lease prevents concurrent writers. Recovery refuses an existing local process; cross-namespace recovery requires `--acknowledge-stopped` after confirming the old deployment stopped. `export` is conservative metadata JSONL; `export --raw` and `replay` include base64 payloads and must remain private. Replay never executes payloads.

## Limits and durability

The SQLite worker uses WAL/FULL transactions, per-connection sequences and linked prepared-response/send-outcome events. Missing outcomes become `unknown_after_crash`; successful callbacks do not establish remote receipt. Recovery lookups use an indexed relationship. Admitted malformed JSON and aborted HTTP prefixes are retained; proxy-rejected or pre-admission traffic cannot have complete backend evidence.

Limits: 128 writer operations / 8 MiB queued, two-second acknowledgement; 16/8 MiB global inbound/outbound budgets; 128 sockets; 256 KiB WebSocket frames; 32 queued frames; 4 MiB/session; ten-second connect; fifteen-minute lifetime. Closed evidence expires after seven days and is pruned under storage pressure. The 512 MiB application storage budget is not a filesystem quota. Node 24.13 marks its SQLite API experimental.

## Docker

`docker compose up -d --build --wait` starts a nonroot read-only gateway, persistent evidence volume and Nginx on `127.0.0.1:18789`. `docker compose down` retains the volume. Memory, CPU, PID and rotated log limits are configured. Public override requires a fresh operator readiness report and measured firewall, hard-quota, TLS and saturation evidence. An internal bridge alone is insufficient for complete egress isolation.
