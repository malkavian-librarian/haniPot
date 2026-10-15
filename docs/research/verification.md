# Foundation verification — 2026-10-15

- `npm test`: 9 unit + 11 integration tests passed.
- `node --test tests/reference/*.test.mjs`: 3 reference tests passed against the genuine isolated historical runtime capture.
- Local fixture, port 18789: Nmap 7.92 finds an open port and HTTP title (service remains generic/unknown); httpx 1.12.0 returns HTTP 200 and OpenClaw Control title; Nuclei 3.11.1 matches the pinned informational OpenClaw template.
- Independent built-in WebSocket client: all eight read methods pass; canonical agents/history/config raw+parsed+hash/session records compare. Negative control rejects a title-only lookalike.
- Docker image builds; Compose gateway and ingress start healthy after correcting tmpfs quoting and read-only Nginx temp paths. Independent gateway client passes through ingress. Restart preserves world ID/hash; offline `check` succeeds after graceful shutdown. Stack stopped after checks, persistent evidence retained locally.
- `npm audit --json`: zero known vulnerabilities in installed lockfile dependencies on review date. No image-CVE scan performed.

Raw captures, scanner outputs and runtime state stay under ignored artifacts/ or Docker volumes. Scanner match is not proof of malicious traffic or full UI fidelity. No public scan or third-party target was used.

## Open release gates

This is a local foundation, not a public-ready release. Still required on the intended Linux deployment host: measured saturation/RSS and slow-client tests; forced kill/recovery and full-volume/WAL pressure experiments; tested host-level egress firewall including proxy/metadata/DNS routes; evidence filesystem hard quota; TLS termination and frontend browser comparison. The public readiness report must be backed by these measurements, never set to true to bypass work.

MCP, A2A/ADK, provider-backed responses/batch analysis, Grafana and crawler modules are separate later milestones. OpenRouter credentials are not accepted or used by this foundation.
