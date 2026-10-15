# Adversarial review: OpenClaw foundation plan

Date: 2026-10-15
Scope: Three independently tasked, read-only subagents reviewed the implementation plan and design. The coordinating agent reconciled and revised the documents. No product code, scanner execution, installations or deployments were performed.

## Panel

1. Protocol/discovery reviewer: historical fidelity, source provenance, scanner interpretation and compatibility evidence.
2. Containment/evidence reviewer: hostile input, memory/storage exhaustion, Docker boundaries, export and durability.
3. Feasibility reviewer: reference setup, task order, interfaces, build artifacts and incremental execution.

The reviewers identified several overlapping blockers. Findings below are consolidated; inclusion does not imply the deployment has passed the planned tests.

## Findings and dispositions

| Finding | Priority | Incorporated correction |
| --- | --- | --- |
| Reference gateway is an undefined prerequisite | High | New Task 0: resource gate, source/build provenance, reference-only container, synthetic state/auth, capture, schema conversion and sanitisation |
| Independent probe shares emulator's validation mistakes | High | Task 8 requires an independent built-in WebSocket client and normalised reference-versus-decoy differential transcripts |
| Permitted payload counts exceed container memory | High | Tasks 3/5/6: global byte reservations, bounded worker in-flight bytes, no waiting producer queue, serial handlers and measured RSS/load gate |
| HTTP and unfinished TCP traffic bypass WS limits | High | Count all sockets; explicit header/body/idle deadlines, chunked limits and raw TCP parser/slow-input tests |
| Internal bridge alone does not deny all new outbound sessions | High | Task 9: explicit allowed flows, verified host rules, host/peer/link-local/DNS/IPv4/IPv6 tests and public-readiness gate |
| Safe export can leak attacker-supplied IDs/methods | High | Task 7: internally generated IDs only, fixed enums, unknown-method mapping, secret-in-every-field tests |
| Retention competes with writer or is pinned indefinitely | Medium/high | One writer RPC owns mutations/maintenance; offline operator reads; connection lifetime/data cap; startup crash recovery and bounded checkpoint behaviour |
| WAL and auxiliary files escape nominal budget | Medium/high | Separate logical and filesystem limits; headroom/hysteresis; bounded proxy logs, Docker logs and temp files; no whole-host quota claim |
| Crash after socket write has unknowable outcome | Medium | Explicit prepared/callback/unknown-after-crash states; bounded shutdown and kill-point fault tests |
| Reconnects reset per-socket limits and amplify synchronous writes | Medium | Aggregate connection/request/evidence-byte limits and bounded loss-counter summaries |
| Task 8 requires Task 9's absent TLS ingress | Medium | Direct discovery in Task 8; proxy/TLS discovery only after Task 9 packages ingress |
| tsc does not copy runtime SQL/schema assets | Medium | Task 1 artifact-copy script, import.meta.url resolution and different-working-directory test |
| Shared interfaces and sequence ownership are vague | Medium | Interface appendix; writer sequence allocation and linkage; typed result/access contracts and fixture ownership |
| Nuclei title-only negative control is ambiguous | Medium | Preserve actual matcher semantics; allow an HTTP match while refusing protocol-confirmed promotion |
| Minimal landing page is visibly unlike a full UI | Medium | Separate scanner attraction, protocol fidelity and browser realism; screenshot comparison and named SPA/path divergence |
| Modern-only clients may be mistaken for emulator failures | Medium | Explicit range-excluding-3 vector and prominent historical-profile compatibility report |
| Nine tasks obscure the user's incremental workflow | Medium | Four named checkpoints: reference/profile, vertical slice, read/operations subset, deployment verification |

## Verification and decisions

The coordinator retrieved the pinned upstream Dockerfile and auth-scope code using read-only PowerShell requests. The Dockerfile uses Node 22, Corepack/pnpm and a mutable Bun installer, supporting the need to separate source pinning from build reproducibility. Source inspection also supports treating configuration access separately from ordinary read-scope methods.

Official Docker bridge documentation was checked to support the distinction between bridge membership and a complete egress policy. Node HTTP documentation and SQLite PRAGMA documentation were consulted for the additional timeout and storage-boundary checks. Relevant primary references:

- [Pinned reference Dockerfile](https://github.com/openclaw/openclaw/blob/77e703c69b07a236c2f0962bd195e03aae1b8da0/Dockerfile)
- [Pinned method authorization](https://github.com/openclaw/openclaw/blob/77e703c69b07a236c2f0962bd195e03aae1b8da0/src/gateway/server-methods.ts)
- [Docker bridge networking](https://docs.docker.com/engine/network/drivers/bridge/)
- [Node HTTP](https://nodejs.org/docs/latest-v24.x/api/http.html)
- [SQLite PRAGMAs](https://www.sqlite.org/pragma.html), [WAL](https://www.sqlite.org/wal.html)

The protocol reviewer reported cache misses for pinned web-source retrieval and did not independently verify historical commit hashes. Those findings were treated as plan-logic critiques; source assertions rely on the coordinator's successful pinned-source reads and still require runtime reference checks.

## Scope decisions

- Retain the historical protocol-3 profile; do not turn this review into support for current OpenClaw or a full UI.
- Retain all eight read methods in the foundation, but deliver a one-method vertical slice before broadening.
- Keep containers and firewall enforcement as explicit public-deployment gates, rather than asserting that application simulation alone provides containment.
- Keep operator export/replay offline initially; live analyst access can be designed later if operational demand justifies a reader-coordination mechanism.
- Keep Node's SQLite API behind the recorder adapter. Host/container tests and advisory checks decide whether the proposed dependencies can actually ship; this review has not established their runtime compatibility.

## Remaining execution gates

The same three reviewers performed a targeted residual check after revisions. That pass caught and resolved four additional issues: differential fixtures now share a canonical synthetic dataset; Task 0 uses a plain `.mjs` test before compiler bootstrap; SQL/CLI asset checks occur only after their owning tasks; the private CLI explicitly includes stale-lease recovery with ownership/PID-reuse checks. This was a document-level recheck, not runtime validation.

Reference build/capture, differential compatibility, real scanner runs, measured saturation, kill/disk fault tests, host firewall and hard-quota verification remain unperformed. The revised plan specifies them; it does not claim they passed. Public readiness remains incomplete until all required evidence exists.
