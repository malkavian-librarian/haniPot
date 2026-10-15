# haniPot: OpenClaw gateway foundation

Date: 2026-10-14
Status: Approved for implementation planning on 2026-10-15; implementation has not started.

Planning clarification, 2026-10-15: discovery checks will include Nmap, ProjectDiscovery httpx, a pinned Nuclei OpenClaw detection template and an independent WebSocket client. Capture ordinary HTTP requests and rejected upgrades as evidence as well as accepted WebSocket interactions. The minimal landing surface preserves the tagged UI's title and custom-element marker without claiming full UI functionality. Detailed commands and provenance belong in the implementation plan.

Adversarial-panel clarification, 2026-10-15: the revised implementation plan adds a prerequisite reference-capture task, differential verification independent of emulator validators, explicit global memory/evidence-byte admission, HTTP/TCP deadlines, maximum connection lifetime/data, single-writer maintenance and offline operator reads. Public network isolation requires verified host rules beyond an internal Docker bridge. Evidence quotas exclude separately bounded proxy/Docker logs. These refinements preserve the product scope; the plan and panel report contain the concrete contracts and verification gates.

## 1. Purpose and agreed direction

haniPot will be an open-source, Docker-hostable deception system for collecting attacks against exposed AI agents. Its first public persona resembles an OpenClaw installation. Synthetic configuration, agents, sessions, history, credentials and integrations give visitors a coherent environment to explore.

The user selected attacker-facing agent/API and MCP collection as the initial product direction. Crawler content and a repeatable research lab come later. The user approved the OpenClaw persona and requested incremental development after research and design.

This document specifies only the first piece: gateway discovery, connection, enumeration and synthetic information disclosure, with durable evidence. It does not authorize implementation. The broader product will later add MCP, simulated tool effects, optional OpenRouter use, daily analysis and Grafana.

Success for this piece means a visitor can establish a real WebSocket connection, discover a fake installation, enumerate its agents and sessions, and retrieve internally consistent synthetic configuration and conversation history. An operator can reconstruct that journey from evidence after a restart.

Traffic volume is an observation, not an acceptance promise. Public reachability and recognisable fingerprints make discovery possible; they do not guarantee malicious visitors.

## 2. Research basis and fidelity boundary

OpenClaw-specific scanning has been reported by [Terrace Networks](https://www.terracenetworks.com/blog/2026-02-09-openclaw-exploitation). [Beelzebub's OpenClaw decoy report](https://beelzebub.ai/blog/automated-reconnaissance-targeting-openclaw-gateways/) provides examples of enumeration and extraction attempts. These are external observations, not deployments independently reproduced for this design.

The protocol baseline is the historical upstream tag **v2026.1.29**, using gateway protocol **3**. This is a deliberate initial target, not a claim about the latest OpenClaw version. The older surface is tractable and aligns with the early exposure research. Before implementing, resolve this tag to a commit SHA and record source hashes in the compatibility fixtures; freeze the profile to that revision. Never follow upstream main automatically.

The tagged [protocol documentation](https://github.com/openclaw/openclaw/blob/v2026.1.29/docs/gateway/protocol.md) describes JSON-bearing WebSocket frames and connection negotiation. The tagged [frame schemas](https://github.com/openclaw/openclaw/blob/v2026.1.29/src/gateway/protocol/schema/frames.ts) provide the fuller handshake contract. Method availability comes from the [method registry](https://github.com/openclaw/openclaw/blob/v2026.1.29/src/gateway/server-methods-list.ts), with handler outputs checked separately.

This is a **partial gateway emulator**, not a full OpenClaw installation or a verified reproduction of every historical CVE. It has no actual agent framework, messaging connection, execution backend or model provider in this piece. Default deception policy intentionally differs from upstream authentication enforcement; that difference is identified in operator metadata and tests.

The source-backed wire format must remain stable. Deployment variation changes synthetic contents, not required frame names, method names or field types. Compatibility is claimed only for the documented subset and pinned profile. A full upstream Control UI or CLI is not promised to function.

## 3. First-piece scope

### Included

- HTTP listener with a small OpenClaw-style landing surface and genuine WebSocket upgrade at `/`.
- Gateway connection negotiation, challenge, request correlation, response/error frames, tick events and orderly disconnection.
- A fixed subset of discovery, configuration, agent and session methods.
- Seeded synthetic installation generation, validation, persisted identity and explicit offline reprovisioning.
- Two explicit deception policies: open-control and token-gated.
- Evidence capture, private export/replay commands, bounded retention and operational error reporting.
- Docker image and Compose configuration when implemented, with private persistent storage.

### Deferred

- `chat.send`, agent execution, arbitrary shell emulation and writable configuration.
- MCP, A2A, HTTP chat-completion APIs and webhooks.
- Full Control UI, Hermes persona and additional upstream-version profiles.
- OpenRouter keys, live LLM responses, generative provisioning and scheduled analysis.
- Grafana, Loki, Prometheus and external telemetry export.
- Real retrieval/embeddings, canary callbacks, malicious file collection and active outbound investigation.
- Crawler engagement, trap instructions sent to external agents and benchmarking lab orchestration.

Probe requests for deferred surfaces are captured but receive an appropriate error or HTTP 404. Their presence in a scanner report is not evidence they are native methods in this pinned version.

## 4. Architecture and suggested implementation choice

Proposed stack: TypeScript on a supported Node.js LTS runtime, a maintained WebSocket library, JSON Schema validation, SQLite evidence storage and Node's test runner. Dependency versions and the SQLite driver will be selected in the implementation plan after checking current support and Windows/Linux compatibility. No installation is required for this design.

The rationale is a small runtime with direct access to upstream TypeScript contracts, suitable for incremental protocol work. The emulator will not import upstream gateway handlers that can touch real credentials or execute operations.

Components have these responsibilities:

| Component | Responsibility | Boundary |
| --- | --- | --- |
| Provisioner | Build and validate one seeded synthetic world | Runs offline; no host inspection |
| World repository | Serve consistent records from a persisted manifest | Read-only to public handlers |
| Gateway adapter | WebSocket lifecycle, validation, negotiation and framing | Knows protocol, not storage paths |
| Deception policy | Decide synthetic access and apparent outcomes | Cannot change real operator controls |
| Method handlers | Map validated requests to synthetic records | No filesystem/network execution |
| Evidence recorder | Durably record bounded wire evidence and outcomes | Private SQLite volume |
| Operator tools | Export and reconstruct captured interactions | Local CLI only in this piece |

Data flow: connection -> bounded evidence capture -> frame validation -> handshake/access decision -> method handler -> response capture -> socket send. Public responses contain synthetic state only. Internal diagnostics never become fake gateway responses.

Persistence failure closes or refuses public interactions rather than silently serving unrecorded successful responses. An outbound record means a response was prepared for transmission; a subsequent transport event records send success/failure. It does not prove the remote visitor consumed the response.

## 5. Gateway contract

### Transport and lifecycle

Default internal port: 18789. The Compose lab configuration binds it to host loopback; an explicit public deployment override binds the decoy listener externally. This distinguishes an intentional public sensor from accidental exposure. TLS may terminate at an operator-managed reverse proxy with WebSocket support.

Use a valid WebSocket handshake; never a static Sec-WebSocket-Accept value. The adapter accepts text JSON frames, sends a fresh connection challenge, and requires connect before application requests. Binary frames, invalid JSON and invalid ordering produce recorded failures and bounded connection termination.

The connection state machine is: accepted -> challenged -> connected -> closing -> closed. A 10-second handshake timeout applies. Protocol negotiation accepts a range containing 3 and rejects ranges excluding it. Attempts to request older versions are recorded without fabricating successful support.

Request identifiers remain associated with their responses. The complete hello result, including required server, advertised features, synthetic snapshot and policy fields, must validate against the pinned schema. The handshake documentation's abbreviated example is insufficient as a fixture.

The tick interval is 30 seconds. Exact error shapes and close behaviour follow the tagged source where implemented; resource-limit failures are documented local divergences. No generic JSON-RPC compatibility is implied.

### Method subset

| Method | Synthetic result | Acceptance evidence |
| --- | --- | --- |
| `health` | Fake channel/account health derived from the world | Stable references to configured channels |
| `system-presence` | Fake gateway/client presence | Synthetic host and timeline agreement |
| `agents.list` | Agent catalogue and defaults | Every default and session references a listed agent |
| `models.list` | Fake configured model catalogue | Configured model appears in catalogue |
| `skills.status` | Fake installed skills and availability | Installation story matches configuration |
| `config.get` | Fake configuration snapshot | Snapshot fields/hash agree with synthetic raw config |
| `sessions.list` | Filtered/limited synthetic sessions | Schema-supported filters work consistently |
| `chat.history` | Messages for a selected synthetic session | IDs and previews match session listing |

`connect` is handled by the adapter. Advertise only implemented methods and emitted events, accepting reduced fidelity over falsely promising an entire gateway. Known but unimplemented methods and unknown methods receive source-compatible unsupported-method errors. Do not invent a standalone `version` or `tool` RPC simply because a scanner probes it.

For each method, implementation must freeze its parameter validator, success fixture, invalid-input fixture and access requirement from the tagged schema and handler. Output types not covered by upstream schemas must be verified against tagged handler code and a controlled reference run. No handler is complete merely because its JSON looks plausible.

### Deception policies

**open-control** is the initial collection policy: schema-valid operator connections can proceed without a valid shared credential or paired device. This is an intentional simulated authentication failure, not asserted to be normal v2026.1.29 behaviour. Apparent role/scope escalation is recorded separately from granted synthetic access. Node connections are refused; there are no real nodes. Device data may be captured as an unverified claim, never labelled authenticated.

**token-gated** requires the provisioned synthetic shared token, grants only the profile's configured read/admin access, and returns appropriate failures for missing/wrong tokens. It does not implement full upstream device pairing or signature verification, and compatibility claims must state this. It exercises the contained access boundary; it is not the collection default.

The synthetic config describes the selected policy's apparent settings. Policy identifiers, validation outcomes and divergences remain private evidence metadata. Neither policy grants operator access to SQLite, exports, host configuration or deployment secrets.

## 6. Synthetic world and variation

The manifest has its own schema version and contains a profile revision, generator revision, random seed, world ID, generation time, synthetic installation timeline and content hash. Store it in a private persistent volume before listeners open.

Initial content: one fake owner operating a small shop; one primary operations agent; 4-8 historic sessions; 2-4 apparent integrations; a modest skill inventory; synthetic model settings; fake configuration paths and nonfunctional credentials. The shop is background context, not a storefront or order API in this piece.

The generator selects from curated data and templates, using a persisted random seed. Variation works without an API key. It never reads hostname, username, environment variables, home directories, browser state or real project files to populate the decoy. Synthetic email/domain references use reserved example namespaces, and credentials are invented strings with no provisioned account access.

Validation enforces referential integrity, chronological ordering, consistent names/models/integrations, configuration snapshot/hash agreement, and session preview/history agreement. The public configuration snapshot is rendered exclusively from this manifest, including any synthetic path fields.

Ordinary restart preserves world identity and historic installation age. Connection IDs, challenge nonces and current timestamps are fresh; uptime derives from the persisted synthetic boot timeline rather than a hardcoded repeated value. Tests use an injectable clock and seeded generator.

Offline reprovisioning explicitly creates a new world ID and archives its manifest before starting listeners. Old evidence retains the previous world ID/hash and stays replayable. No implicit identity rotation on restart, image rebuild or daily schedule.

## 7. Evidence, analysis and replay

Use SQLite as the canonical store. Export NDJSON as a derived artifact; do not maintain competing canonical log files. Transactions protect ordered writes; schema migrations carry explicit versions. Store manifests or immutable manifest references alongside evidence.

Each event records UTC time, per-connection sequence, event ID, connection ID, direction, transport, actual peer address, claimed proxy/client identity, world/profile revisions, request ID/method when parseable, bounded original payload bytes, parse result, access decision, response outcome and optional detector tags. Preserve invalid UTF-8 as encoded bytes. Record truncation, original observed size where known and a captured-byte hash; never describe a partial hash as a full-payload hash.

Keep the TCP peer address separate from forwarded headers. Trust forwarded identity only from an explicit proxy allowlist. IPs/client claims do not establish an attacker identity; reconnect correlation is tentative. Operator probe traffic is marked by a private configured test identifier, not silently removed.

Replay reconstructs the ordered recorded timeline and fake records associated with it. It displays inputs as inert text, does not replay requests onto the internet and does not execute captured code. Exact timestamps/nonces are evidence, not expected regenerated values.

First-piece tags are deterministic observations: handshake failure, invalid frame, enumeration, config access, history access, claimed privilege escalation, unsupported-protocol request and resource-limit event. They are not automatic maliciousness verdicts. Unknown intent remains unknown.

## 8. Isolation, resource limits and operation

The container runs non-root, with a read-only root filesystem, dropped Linux capabilities, no-new-privileges, a bounded temporary filesystem and explicit private data volume. No host networking, Docker socket, home-directory mount or real OpenClaw state mount. Only the decoy port is publishable. There is no public analyst endpoint or genuine provider credential in this piece.

The public deployment requires runtime egress denial at the deployment boundary. Application handlers do not perform outbound requests, and the supplied network/deployment configuration must enforce and test that restriction; code-level conventions alone are insufficient. Reverse proxies sit outside this boundary. Builds may retrieve dependencies, but runtime has no such requirement.

Default limits: 256 KiB inbound frame, 1 MiB outbound frame, 128 simultaneous sockets, 32 pending requests per socket, 20 requests/second per socket with a burst of 40, 120-second application-idle timeout. Socket admission counts all accepted TCP connections. Global retained-input, recorder and outbound byte limits apply before these count ceilings; no admission promise exists for their maximum Cartesian product. Maximum connection lifetime is 15 minutes or 4 MiB recorded data, whichever occurs first. Periodic server ticks do not reset client inactivity. Input caps apply before parsing. Limit changes are operator configuration, never public RPC.

Retention defaults: 7 days and 512 MiB database budget. Rotation removes oldest complete connections first, preserving their manifests while any surviving events reference them; checkpoint/truncate the WAL during maintenance. Above the budget, reclaim closed connections or pause acceptance. Reserve bounded space for active events; if a transaction cannot be recorded, stop that interaction. A 768 MiB data-volume ceiling accounts for WAL and temporary maintenance overhead; low-space alarms occur before exhaustion. Do not promise unlimited evidence under attack.

Live stdout reports operational counts/errors without dumping captured credentials or payloads. Raw evidence stays private with operator-controlled access. Default NDJSON export is a metadata summary containing only internally generated IDs, fixed enums and numeric observations; visitor-controlled strings are omitted. Full raw export is an explicit local option. Export/replay/check require the offline data lease in this piece. Retention applies to canonical storage; independently exported files are operator-managed. No automatic cloud upload.

Suggested container ceilings: 0.5 CPU, 256 MiB memory and 128 processes, validated rather than advertised as measured capacity. Check available disk before builds or installations on this Windows workspace.

## 9. OWASP coverage and limitations

Use edition-qualified risk identifiers and retain observations independently of taxonomy labels. The [OWASP LLM Top 10 2026](https://genai.owasp.org/resource/owasp-genai-llm-top-10-2026/) and [Agentic Top 10 2026](https://genai.owasp.org/resource/owasp-top-10-for-agentic-applications-for-2026/) inform the broader catalogue.

| First-piece observation | Proposed taxonomy association | Limit |
| --- | --- | --- |
| Retrieval of fake sensitive config/history | LLM02:2026; ASI03:2026 when access abuse is involved | Gateway disclosure, not proof of a model leak |
| Client privilege claims and simulated auth bypass | ASI03:2026 | No real privilege gained |
| Attempts to exhaust connections/requests | LLM06:2026 as an adjacent consumption signal | Gateway exhaustion is not demonstrated token spending |
| Injection text in captured requests | Candidate LLM01:2026 label for later analysis | No prompt-injection success without an interpreting agent |

This piece does not claim full OWASP coverage. Later scenario modules distinguish attempted technique, simulated effect and independently supported outcome.

## 10. Acceptance checks for implementation

1. Correct WebSocket upgrade and schema-valid handshake with a real independent client; required hello fields present, unique challenge, request correlation and ticks verified.
2. Protocol ranges excluding 3 fail; invalid JSON, oversized/binary frames and application requests before connect are recorded and bounded.
3. Every advertised method passes frozen source-backed success/error fixtures; method parameters and response structures agree with the pinned profile.
4. A complete connect -> agents -> sessions -> history -> config journey exposes coherent data and can be reconstructed from SQLite after restart.
5. Open-control and token-gated policies have distinct tested decisions; forged roles/device claims never become asserted authenticated identities.
6. Same seed/generator/time inputs reproduce content; different seeds vary content; ordinary restart preserves world/hash, and reprovisioned evidence remains attributable to its old world.
7. Captured shell/path/URL payloads cause no host read, process execution or outbound network request; container filesystem and egress restrictions are exercised.
8. Recording failure, disk-budget pressure, rate limits, handshake timeout and connection saturation result in documented bounded behaviour without silent capture loss.
9. Export/replay safely renders markup, escape sequences and malformed payloads as data. Redacted export excludes credentials and peer addresses by default.
10. Docker restart preserves data, operator commands remain private, and exposure configuration clearly distinguishes loopback lab operation from public collection.

Reference verification may run the pinned upstream gateway in an isolated test environment with fabricated data to obtain fixtures. It must not expose or install a real agent on the operator's host. Runtime emulator dependencies remain separate from the reference system. These checks are planned, not performed by this design phase.

## 11. Subsequent pieces and review boundary

After this foundation: add simulated tools/chat over the same state, then MCP, richer generated identities via a private model broker, daily analysis, Grafana, and finally memory/RAG and A2A. Each piece gets its own scoped design and acceptance criteria. Crawler content and research lab modes follow separately.

Before implementation, the user reviews this written design. After approval, create a task-level implementation plan with exact files, dependencies, reference-fixture acquisition and test commands. This document is a scope and architecture decision, not that execution plan.

The workspace was empty when inspected and had no Git repository. The design is saved locally; no repository initialization, commit, push, deployment or installation was performed.
