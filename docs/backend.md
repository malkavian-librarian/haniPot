# Backend

## Current implementation

The repository currently contains reference-acquisition tooling, a canonical fake dataset and reference tests. The emulator is not yet implemented. [TODO.md](../TODO.md) is the progress source of truth.

`tools/prepare-reference.ps1` downloads the exact historical source commit and records its archive hash. `deploy/reference/` builds and starts upstream only inside an isolated reference container. `tools/capture-reference.mjs` uses a WebSocket client to capture genuine responses. This reference system is development tooling, never the public honeypot backend.

## Target architecture

The approved backend has an HTTP/WebSocket adapter, immutable synthetic world, deception policy, eight read-only method handlers and a single SQLite evidence writer. See the [design](superpowers/specs/2026-10-14-openclaw-gateway-design.md) and [plan](superpowers/plans/2026-10-15-openclaw-gateway-foundation.md) for exact contracts and acceptance criteria.

Incoming data must pass resource admission before parsing/dispatch. Evidence preparation is persisted before successful responses are sent. A socket-send callback is not proof of remote receipt. Private operator commands remain offline and distinct from synthetic public capabilities.

## Compatibility

Profile: OpenClaw v2026.1.29 / protocol 3, commit `77e703c69b07a236c2f0962bd195e03aae1b8da0`. Required reference/decoy comparisons use the same canonical dataset. Dynamic-field normalisation must be explicit; business data cannot be normalised away to manufacture agreement.

The eight planned methods are health, system-presence, agents.list, models.list, skills.status, config.get, sessions.list and chat.history. The foundation does not execute commands, install skills, contact real integrations or invoke a model.
