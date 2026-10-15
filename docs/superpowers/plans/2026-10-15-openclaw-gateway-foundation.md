# OpenClaw Gateway Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Subagent execution is an alternative only if the user selects it. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a Docker-hostable OpenClaw-shaped discovery and enumeration decoy with seeded synthetic state and durable, private evidence.

**Architecture:** A real HTTP/WebSocket adapter delegates access decisions and eight read methods to a synthetic world repository. A separate evidence worker owns SQLite and acknowledges writes before public responses. An internal Docker network separates the emulator from an ingress proxy; operator tools access storage locally.

**Tech Stack:** Node.js 24 LTS, TypeScript compiled to ESM, ws, Ajv, node:sqlite, Node test runner; Docker Compose; external Nmap, ProjectDiscovery httpx and Nuclei for acceptance checks.

**Spec:** [Approved foundation design](../specs/2026-10-14-openclaw-gateway-design.md).

**Revision:** Adversarial-panel revision, 2026-10-15. Review dispositions are recorded in [the panel report](../reviews/2026-10-15-gateway-plan-panel.md). Where the original design gives count limits, the additional byte/admission controls below are required as well.

## Global constraints

- Default internal port: 18789.
- The protocol baseline is the historical upstream tag **v2026.1.29**, using gateway protocol **3**.
- A 10-second handshake timeout applies.
- The tick interval is 30 seconds.
- Default limits: 256 KiB inbound frame, 1 MiB outbound frame, 128 simultaneous sockets, 32 pending requests per socket, 20 requests/second per socket with a burst of 40, 120-second application-idle timeout.
- Retention defaults: 7 days and 512 MiB database budget.
- A 768 MiB data-volume ceiling accounts for WAL and temporary maintenance overhead; low-space alarms occur before exhaustion.
- Suggested container ceilings: 0.5 CPU, 256 MiB memory and 128 processes, validated rather than advertised as measured capacity.
- Windows host commands use PowerShell. Git uses the supplied GitHub Desktop binary. Never commit secrets or build output; security-review is mandatory before every push.
- No product implementation, package installation, scanner execution, public scan, deployment or Git initialization occurred during planning.
- Public readiness requires verified host firewall and quota setup; Compose `internal: true` and application counters alone do not establish containment.

## Review focus

1. A title-only lookalike must not be treated as protocol-confirmed OpenClaw: negative controls in Task 8.
2. HTTP probes and failed upgrades must be recorded even without a WebSocket session: Task 5.
3. Truncated, rejected and invalid-UTF-8 inputs must not be misrepresented as completely captured messages: Tasks 3 and 5.
4. An incoming credential embedded in arbitrary text must not leak through nominally redacted export: Task 7 uses an allowlist rather than heuristic string replacement.
5. Pending writes during shutdown, retention and full-disk conditions must not silently lose successful interactions: Tasks 3 and 6.

## Research: how open-source tools spot OpenClaw

Research checked on 2026-10-15. These are planned localhost acceptance checks, not scans already executed. Scanner results establish different levels of evidence.

| Tool/signal | What it establishes | Limitation |
| --- | --- | --- |
| Nmap TCP connect scan | Port accepts connections | Port 18789 alone does not identify software |
| Nmap service detection and HTTP NSE | HTTP service, title and response headers | Stock service detection is not assumed to name OpenClaw |
| ProjectDiscovery httpx | Status, page title, headers and optional WebSocket availability | Technology-detection output is a hint |
| Nuclei `openclaw-control-detect` | Its documented HTTP body/status signature matches | A copied page can match; no authentication/exploitation verdict |
| Independent WebSocket client | Challenge and schema-valid protocol-3 connect/hello | Our partial emulator still differs from a complete gateway |

The tagged upstream UI uses the title `OpenClaw Control` and an `openclaw-app` element. The dedicated Nuclei template checks body markers and status 200. Its word matcher does not explicitly require both words: a title-only page may match under the engine's default word condition. The negative-control assertion is therefore **HTTP detection does not imply protocol confirmation**, not that title-only pages necessarily fail Nuclei. Keep discovery markers stable while varying installation content. Preserve and test the pinned template's exact semantics rather than rewriting it from this prose.

The Nmap service-probe database retrieved during research contained no case-insensitive OpenClaw/Clawdbot/Moltbot name match. This limited check is not a claim that no custom NSE script or future stock fingerprint exists. High-port HTTP scripts may require explicit service detection or forced script selection.

### Provenance

- OpenClaw tag resolved through GitHub API to `77e703c69b07a236c2f0962bd195e03aae1b8da0`.
- Nuclei templates main resolved to `3de629d823bb6eb00aa3769edc365b6525134fb1`.
- [Pinned OpenClaw UI](https://github.com/openclaw/openclaw/blob/77e703c69b07a236c2f0962bd195e03aae1b8da0/ui/index.html).
- [Pinned frame schemas](https://github.com/openclaw/openclaw/blob/77e703c69b07a236c2f0962bd195e03aae1b8da0/src/gateway/protocol/schema/frames.ts), [method registry](https://github.com/openclaw/openclaw/blob/77e703c69b07a236c2f0962bd195e03aae1b8da0/src/gateway/server-methods-list.ts), [handlers](https://github.com/openclaw/openclaw/tree/77e703c69b07a236c2f0962bd195e03aae1b8da0/src/gateway/server-methods).
- [Pinned Nuclei template](https://github.com/projectdiscovery/nuclei-templates/blob/3de629d823bb6eb00aa3769edc365b6525134fb1/http/exposed-panels/openclaw-control-detect.yaml).
- Nmap official [http-title](https://nmap.org/nsedoc/scripts/http-title.html), [http-headers](https://nmap.org/nsedoc/scripts/http-headers.html), [version detection](https://nmap.org/book/vscan.html), [probe database](https://github.com/nmap/nmap/blob/master/nmap-service-probes).
- ProjectDiscovery official [httpx options](https://docs.projectdiscovery.io/opensource/httpx/usage), [Nuclei source/CLI](https://github.com/projectdiscovery/nuclei).
- Node official [SQLite](https://nodejs.org/docs/latest-v24.x/api/sqlite.html) and [TypeScript](https://nodejs.org/docs/latest-v24.x/api/typescript.html) documentation.

### Planned scanner commands

Run direct checks during Task 8 and packaged/TLS checks after Task 9, never against a discovered third-party host. Save tool versions alongside output. `httpx` below means ProjectDiscovery's executable, not Python's similarly named package. Create `artifacts/discovery/` first. The wrapper resolves executable paths and checks their identity/version, enforces timeouts and exit-code checks, and disables automatic update/network integrations; it runs only the pinned detection template with `-ni` (no interactsh) where supported by the pinned Nuclei engine. Engine flags are verified by its saved help output.

```powershell
nmap -sT -Pn -sV --version-all -p 18789 --script '+http-title,+http-headers' -oA artifacts/discovery/nmap 127.0.0.1
httpx -u http://127.0.0.1:18789 -sc -title -server -json -duc -o artifacts/discovery/httpx.jsonl
nuclei -u http://127.0.0.1:18789 -t tests/fixtures/scanners/openclaw-control-detect.yaml -duc -ni -jsonl -o artifacts/discovery/nuclei.jsonl
node tools/probe-gateway.mjs --url ws://127.0.0.1:18789 --out artifacts/discovery/gateway.json
```

Expected: reachable port, recognizable HTTP title, Nuclei informational detection, successful schema-checked challenge/hello and enumeration. Do not require Nmap's service column to say OpenClaw. Repeat with host port 18890 to ensure identity does not depend on the default port. For TLS deployment repeat HTTP/WebSocket checks through a locally managed TLS proxy; a TLS certificate identifies the proxy/operator, not the gateway product.

HTTP header discovery uses HEAD by default in Nmap; serve consistent HEAD metadata without a body. Do not invent a `Server: openclaw-gateway` header just to satisfy a scanner. Do not add modern health endpoints or legacy rebrand markers to a historical profile without source evidence.

## Execution conventions and file map

Use native sequential execution if selected by the user. Each task below has a red/green test cycle and a reviewable deliverable. Review checkpoints are: **A**, after Tasks 0-1 (reference/profile evidence); **B**, during Task 5 after a working connect -> health -> durable replay vertical slice; **C**, after all eight methods and Tasks 6-7 (read subset and operational controls); **D**, after Tasks 8-9 (verified deployment). At each checkpoint report evidence and remaining work for inspection. Never describe a partial checkpoint as completion of the whole foundation or execute later product modules.

Files are grouped by responsibility:

| Paths | Responsibility |
| --- | --- |
| `src/contracts.ts`, `src/config.ts` | Shared value types and private runtime settings |
| `src/profile/` | Pinned upstream validators, fixtures, method registry and serializers |
| `src/world/` | Seeded generation, integrity checks, persistence |
| `src/evidence/` | SQLite worker, queue, lifecycle, retention |
| `src/gateway/` | HTTP discovery, upgrade, connection machine, dispatch, budgets |
| `src/operator/`, `src/cli.ts` | Private provision/serve/export/replay commands |
| `tests/unit/`, `tests/integration/`, `tests/fixtures/` | Local tests and immutable compatibility evidence |
| `tools/`, `deploy/`, `Dockerfile`, `compose.yaml` | Verification utilities and deployment |
| `docs/research/`, `docs/operations/` | Provenance, limits and operator instructions |

Additional explicit artifacts: `src/world/types.ts`, `tests/fixtures/helpers.ts`, `tools/copy-assets.mjs`, `deploy/reference/`, `deploy/firewall/`, `tests/reference/reference.test.mjs`, `tests/integration/proxy.test.ts`, and `tests/integration/saturation.test.ts`. These belong to the tasks below.

Commit convention once a repository exists:

```powershell
$git = 'C:\Users\FlyerOne\AppData\Local\GitHubDesktop\app-3.5.11\resources\app\git\cmd\git.exe'
& $git add <the exact files listed in the completed task>
& $git commit -m '<the task commit message>'
```

The angle-bracket arguments describe the task-specific file list and message, not executable commands. Use concrete listed files, never `git add -A`. This plan does not include a push.

## Task 0: Establish the isolated reference and build provenance

**Files:** create `deploy/reference/Dockerfile`, `deploy/reference/compose.yaml`, `deploy/reference/openclaw.json`, `deploy/reference/seed/`, `tests/fixtures/reference-dataset.json`, `tools/prepare-reference.ps1`, `tools/capture-reference.mjs`, `tools/derive-profile.mjs`, `tests/reference/reference.test.mjs`, `docs/research/reference.md`, `artifacts/reference/` (gitignored).

**Deliverable:** source- and runtime-backed fixtures before emulator implementation. This is a feasibility gate, not a claim that downloading the source completes reference validation.

- [ ] Run PowerShell disk/command preflight, including `docker version`, `docker info` and `tar.exe --version`. Allow the full upstream build only with at least 4 GiB host free space and 8 GiB Docker storage free; these are conservative admission thresholds, not measured build size. Record actual peak consumption and build duration. If unavailable, stop reference building and report the missing capacity/runtime; do not start emulator work with guessed fixtures.
- [ ] `tools/prepare-reference.ps1` downloads the exact commit archive from `https://github.com/openclaw/openclaw/archive/77e703c69b07a236c2f0962bd195e03aae1b8da0.tar.gz` into `artifacts/reference/`, computes SHA-256, extracts there and records its provenance. Never extract outside the resolved artifact directory. No upstream code executes on the Windows host.
- [ ] Inspect the pinned Dockerfile before adapting it: it uses Node 22, Corepack/pnpm and a mutable Bun installation URL, and builds the full UI. A source commit alone does not pin the build. In the reference-only Dockerfile replace mutable Node/Bun inputs with exact official versions, digests/checksums and retain the upstream dependency lock. Record the actual resolved package manager/dependency graph and build recipe. Preserve notices. Runtime emulator remains Node 24 and does not inherit reference dependencies.
- [ ] Build `hanipot-reference:77e703c` using the reference recipe. During the network-enabled build, pass no host credentials and mount no operator home. Reference runtime has an internal-only network, a dedicated disposable synthetic-state volume, dropped capabilities and no provider secrets. Publish no reference port on a public address. A dedicated capture-client container joins only this network; it has no host state mount. Its output is copied out after capture.
- [ ] Commit a fabricated reference configuration with the tagged schema's token auth and explicitly documented Control UI device-auth bypass, with only an invented reference token. Verify these settings in tagged auth code; do not expect open-control decoy behaviour from upstream. Seed one agent, model and six sessions/transcripts using the tagged session-store format, checking the session utility source. All domains use reserved namespaces and all credentials are nonfunctional. Capture client uses a valid upstream client ID, token and admin scope.
- [ ] Make `tests/fixtures/reference-dataset.json` the canonical data input for both the reference seed files and the later emulator differential-world adapter. Record stable session keys, messages, integration/model inventory and config values explicitly. Task 2 must provide a validated adapter from this dataset into World; random production provisioning remains separate. Capture history vectors resolve session keys from this dataset, not from unrelated generated worlds. Do not normalise away business data or config fields to hide disagreements.
- [ ] The capture client first waits for a real challenge and successful hello with a 30-second deadline. It then captures all eight methods, valid filters and invalid-parameter outcomes. Separate authenticated, wrong-token and wrong-version connections. Capture tick and unknown-method responses. It records configuration/raw hash semantics and checks session history against the seeded files. Missing useful history or incomplete success fixtures fails the gate, even if health works.
- [ ] `tools/derive-profile.mjs` reads the pinned schema dependency closure in the isolated build tooling, converts TypeBox to JSON Schema with explicit reference resolution, and records Ajv options and all nonstandard formats/keywords. Validate generated schemas against genuine reference outputs and deliberately invalid mutations; never loosen `additionalProperties` or replace unresolved references with permissive schemas. The toolchain is a dev-only input with notices and hashes.
- [ ] Sanitise fixtures before committing: replace transient IDs/timestamps/paths and invented credentials with named typed placeholders while retaining an unsanitised capture only in ignored private artifacts. Preserve field presence, frame order, types and invariants; regenerate hashes when content changes. A check rejects non-example domains, credential-like strings outside the approved fake-value inventory and unresolved placeholders. Human review verifies no real reference/environment identity leaked.
- [ ] Run `node --test tests/reference/reference.test.mjs` with plain JavaScript and built-in Node assertions; Task 0 must not depend on Task 1's package/compiler bootstrap. Schema generation dependencies execute inside the isolated reference build toolchain. Record status, image/source hashes, seed configuration, normalisation rules and known deviations. Only after reviewing manifests and resolved paths may cleanup remove this task's containers/images/artifacts; never run broad Docker prune. Commit: `test: establish pinned isolated reference capture`.

## Task 1: Freeze the profile and create an executable contract test

**Files:** create `package.json`, `package-lock.json`, `tsconfig.json`, `.gitignore`, `src/contracts.ts`, `src/profile/validate.ts`, `src/profile/provenance.json`, `tests/unit/profile.test.ts`, `tests/fixtures/openclaw/`, `tools/capture-reference.mjs`, `docs/research/compatibility.md`, `THIRD_PARTY_NOTICES.md`.

**Interfaces:** `validateFrame(value: unknown): ValidationResult`; `validateParams(method: string, value: unknown): ValidationResult`; `validateResult(method: string, value: unknown): ValidationResult`. `ValidationResult = {ok: boolean; errors: string[]}`. Export `PROFILE_ID`, `PROFILE_COMMIT`, `METHODS` as readonly constants. Export `Clock = { now(): number }` and `WorldRef = { worldId: string; worldHash: string; profileId: string }` from contracts.

- [ ] Inspect local AGENTS files and Git state; check disk with `Get-PSDrive C | Select-Object @{N='Free_MB';E={[math]::Round($_.Free/1MB,0)}}`. Check Node and Docker versions. Create Git only if this remains an empty non-repository workspace; do not alter a parent repository.
- [ ] Create package scripts: `build` = `tsc -p tsconfig.json && node tools/copy-assets.mjs`, `test:unit` = `node --test dist/tests/unit/*.test.js`, `test:integration` = `node --test dist/tests/integration/*.test.js`, `test` runs build then both suites. The `&&` is inside npm's cross-platform script, never a PowerShell command. Use ESM, strict checking, NodeNext module resolution, ES2023 target, rootDir `.`, outDir `dist`. An empty not-yet-created suite is omitted from staged task commands, not treated as a passing suite.
- [ ] Candidate exact versions checked from the npm registry during research: `ws@8.22.0`, `ajv@8.20.0`, `typescript@7.0.2`, `@types/node@24.19.2`, `@types/ws@8.18.2`. Verify package engines, compiler options and advisory status before installing these exact versions with scripts disabled. Node 24's built-in SQLite API has a non-stable designation; isolate it behind the recorder interface and test on host and container runtime. Pin Docker Node 24 patch/digest at execution; do not silently switch to another driver if compatibility fails.
- [ ] Write the first contract test before implementing validators:

```typescript
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {validateFrame} from '../../src/profile/validate.js';
test('rejects a JSON-RPC object without gateway framing', () => {
  assert.equal(validateFrame({jsonrpc:'2.0', id:1, method:'health'}).ok, false);
});
```

- [ ] Run `npm run build`; expect a missing validator failure. Build the minimal validator and run the unit script; expect the test to pass.
- [ ] Retrieve schemas and all required imports from the pinned commit, preserving license notices and SHA-256 checksums. Compile schema definitions to standalone JSON Schema artifacts for Ajv; never import upstream executable handlers into runtime. Record source URL, hash, derivation and schema/handler origin per method.
- [ ] Consume Task 0's reviewed reference outputs and conversion artifacts. The capture tool accepts only the configured reference-container service or explicit loopback URLs; reject arbitrary targets and redirects. Record reference settings and observed divergences. If Task 0 is incomplete, do not declare the profile complete.
- [ ] Implement `tools/copy-assets.mjs` to copy profile JSON schemas and provenance into matching `dist/src/` directories; fail on missing required or unexpected profile artifacts. Task 3 extends the explicit asset manifest to require SQL only when SQL is introduced. Assets use `new URL('./asset', import.meta.url)` and the Task 3 worker uses `new URL('./worker.js', import.meta.url)`, never current-working-directory paths. Task 3 tests recorder startup from a different directory; Task 7 adds the compiled CLI equivalent. Do not require artifacts before their owning task creates them.
- [ ] Add fixtures for complete hello, challenge/tick, all eight method parameters/results, invalid parameters, unknown method, unsupported version and missing/wrong token. Validate source-supported parts mechanically; describe handler-derived output checks explicitly. Freeze the interface appendix below and compile its exported types before other tasks use them. Run `npm run build`; check `$LASTEXITCODE` before `npm run test:unit`. Commit: `test: freeze OpenClaw gateway profile contracts`.

## Task 2: Provision a persistent synthetic installation

**Files:** create `src/world/types.ts`, `src/world/generate.ts`, `src/world/validate.ts`, `src/world/store.ts`, `tests/fixtures/reference-world.ts`, `tests/unit/world.test.ts`, `tests/integration/world-store.test.ts`.

**Interfaces:** `generateWorld({seed, generatedAtMs, worldId}): World`; `validateWorld(world: unknown): World`; `loadOrCreateWorld(dataDir: string, clock: Clock): Promise<World>`; `reprovisionWorld(dataDir: string, clock: Clock): Promise<World>`. Define `World` in `src/world/types.ts` as the manifest described in spec section 6, with typed agents, sessions, messages, models, skills and config. Handlers consume `Readonly<World>`.

- [ ] Write failing tests for referential integrity, same-input reproducibility, different-seed variation and restart identity. Core test:

```typescript
test('generation is reproducible', () => {
  const input = {seed:'fixture-a', generatedAtMs:1781568000000, worldId:'test-world'};
  assert.deepEqual(generateWorld(input), generateWorld(input));
});
```

- [ ] Run build/unit tests and confirm missing implementation fails. Implement a documented seeded PRNG, curated templates, canonical JSON hashing and validation. Use 1 owner, 1 agent, 6 sessions and 3 apparent integrations initially. No host-derived identity.
- [ ] Add `referenceWorldFromDataset(dataset): World` in the test-only adapter, validate it and prove session keys/messages/models/config match Task 0's canonical dataset exactly. Differential tests use this world; ordinary deployment generation does not consume reference fixture data or credentials.
- [ ] Persist by temporary-file write, flush and atomic rename; reject symlinks/path escape and invalid manifests. Verify Windows rename/replacement semantics with an interrupted-write test. Acquire an exclusive data-directory lease for every command; export/replay/check are offline in this piece and cannot contend with a serving writer. Stale-lock recovery requires an explicit offline recovery command and verified stopped owner; never infer safety from age alone. Archive manifests by world ID/hash, bound their aggregate size and remove unreferenced archives during retention.
- [ ] Add interrupted-write recovery, invalid-hash rejection, dangling-session reference, model mismatch and reprovision-history tests. Run build/unit/integration tests. Commit: `feat: provision coherent synthetic gateway worlds`.

## Task 3: Build the acknowledged evidence recorder

**Files:** create `src/evidence/types.ts`, `src/evidence/schema.sql`, `src/evidence/worker.ts`, `src/evidence/recorder.ts`, `tests/integration/evidence.test.ts`.

**Interfaces:** `openRecorder(options: RecorderOptions): Promise<Recorder>`; `Recorder.append(event: EvidenceInput): Promise<{eventId: string}>`; `Recorder.close(): Promise<void>`. `EvidenceInput` contains world reference, connection ID, sequence, direction, transport, timestamp, peer/claimed identity, payload Buffer, capture status, parse/access/send status, request metadata and observation tags. Declare all fields in types; absent observations are null, never invented.

- [ ] Write a reopen/order test and a forced-write-failure test:

```typescript
test('failed persistence rejects acknowledgement', async () => {
  const recorder = await openRecorder(failingRecorderOptions());
  await assert.rejects(recorder.append(sampleEvent()), /record/);
});
```

Define `failingRecorderOptions()` and `sampleEvent()` in `tests/fixtures/helpers.ts`; inject the storage failure rather than relying on machine disk exhaustion.

- [ ] Run integration tests; expect missing recorder failure. Implement one worker owning DatabaseSync, versioned migrations, WAL, foreign keys, full synchronous durability and prepared statements. The writer allocates per-connection sequence numbers and finalizes connections transactionally; append callers cannot supply competing sequences. Implement worker RPC operations append, maintain, health and shutdown. Retention uses that same writer, never a second mutating connection. Busy timeout is 250 ms; a write acknowledgement has a 2-second deadline. Unexpected worker exit rejects all pending operations and pauses gateway admission.
- [ ] Queue has a hard 128-entry **and 8 MiB payload-byte** limit including dispatched/unacknowledged worker messages, whichever comes first. Reserve before enqueue; reject immediately when unavailable instead of retaining waiting producers. Include structured-clone copies in memory accounting or transfer an exclusively owned ArrayBuffer. Validate byte length after serialisation before accepting an entry. Maintenance processes at most 100 closed connections or 50 ms per turn and yields to writes. Checkpoint busy/timeout is a recorded maintenance outcome, not an infinite retry.
- [ ] Store connections, archived worlds and events. HTTP request/response pairs use their own interaction connection IDs. `captureStatus` distinguishes complete, prefix-only and unavailable bytes; hash only bytes present. Do not claim full raw WebSocket-frame capture: store the bounded application payload and protocol error metadata actually made available by the library.
- [ ] Extend the asset manifest to require/copy schema.sql, build, change the test process working directory and open a fresh recorder by absolute data-directory path. Verify worker entrypoint and assets resolve relative to their compiled modules.
- [ ] Verify invalid-byte round trip, abrupt worker failure, ordered sequence allocation, prepared outbound versus sent status, drain-on-close and schema-version mismatch. On startup mark unfinished connections from a prior process as recovered-aborted before accepting new traffic. Inject a crash between outbound prepare and socket-send completion: replay must say unknown outcome, not delivered. Pass all tests. Commit: `feat: record bounded gateway evidence durably`.

## Task 4: Implement policies and eight read handlers

**Files:** create `src/gateway/policy.ts`, `src/gateway/dispatch.ts`, `src/profile/results.ts`, `tests/unit/policy.test.ts`, `tests/unit/dispatch.test.ts`.

**Interfaces:** `decideAccess(connect: unknown, policy: DeceptionPolicy): AccessDecision`; `dispatch(method: string, params: unknown, world: Readonly<World>, access: AccessDecision, clock: Clock): HandlerResult`. Define `DeceptionPolicy`, `AccessDecision`, `HandlerResult` in their owning files and export them. Results carry either validated synthetic payload or profile-compatible error and observation tags.

- [ ] Write source-fixture-driven tests before handlers. Include all filters supported by sessions.list, history limits, missing session keys, forbidden node role, absent/wrong token, requested scopes versus synthetic grants, and unknown methods.

```typescript
test('does not invent a version RPC', () => {
  const result = dispatch('version', {}, fixtureWorld(), openAccess(), fixtureClock());
  assert.equal(result.ok, false);
});
```

Define these fixture helpers in the shared fixture helper file. Run unit tests; confirm red.

- [ ] Implement only spec methods; serialize outputs to pinned fixtures/schema contracts. Compute configuration raw text/hash using upstream-verified snapshot semantics. Synthetic secrets may appear only in intended fake outputs, never grant access to real operator controls. Verify config.get's admin-scope requirement separately from read methods; token-gated read scope cannot retrieve it. Do not shell out, read caller paths or fetch URLs. Reject prototype-sensitive object keys, excessive nesting (32 levels), and overlong strings before copying inputs into state; no object merge from visitor input.
- [ ] Add property tests over multiple seeds for cross-method consistency and filters; enumerate advertised methods from the same constant used by dispatch. Pass unit tests. Commit: `feat: emulate gateway enumeration and disclosure`.

## Task 5: Serve discoverable HTTP and genuine WebSockets

**Files:** create `src/gateway/http.ts`, `src/gateway/connection.ts`, `src/gateway/server.ts`, `src/gateway/landing.ts`, `tests/integration/http.test.ts`, `tests/integration/handshake.test.ts`.

**Interfaces:** `startGateway({world, recorder, policy, config, clock}): Promise<{port: number; close(): Promise<void>}>`; server config includes bind address, port and limits. `connection.ts` owns accepted/challenged/connected/closing/closed states; handlers never write sockets directly.

- [ ] Write failing GET/HEAD/rejected-upgrade and handshake tests with an independent client:

```typescript
test('GET discovers the persona without connecting a socket', async () => {
  const response = await fetch(fixtureUrl());
  assert.equal(response.status, 200);
  assert.match(await response.text(), /<title>OpenClaw Control/);
});
```

The integration fixture owns a fresh temporary directory, recorder and listening server, with teardown in finally. Define `fixtureUrl()` in that fixture context. Confirm tests fail before adding server code.

- [ ] Implement a tiny self-contained landing document with the pinned title/element and inert synthetic status presentation. Use no missing asset references, upstream bundle, analytics or external resources. HEAD returns matching metadata without body; unknown paths return 404; log method/path and bounded headers with truncation flags. Cap HTTP headers at 16 KiB, HTTP body capture at 16 KiB, and reject bodies over that cap. Do not publish evidence paths. Explicitly document the historical upstream SPA catch-all versus this decoy's 404 as a fingerprint divergence; measure it against the reference rather than asserting indistinguishability.
- [ ] Count every accepted TCP socket, not just upgraded sockets, toward the 128 limit. Set header deadline 5 seconds, complete request/body deadline 10 seconds, keep-alive idle 5 seconds and max 100 requests/socket. Explicitly cap chunked-body bytes as well as Content-Length. Add raw TCP tests for slow headers/body, invalid headers, parser clientError, early disconnect and duplicate/invalid upgrade. HTTP states are accepted, headers-complete, body-complete/aborted, response-prepared, response-finished/failed, closed. Record only observed bytes with capture status; parser errors may have no parsed request. Persist response preparation before serving success; on recorder failure destroy the socket without pretending the rejection was recorded.
- [ ] Use ws `noServer` upgrade handling, `maxPayload: 262144`, compression disabled and UTF-8 validation enabled. Capture what ws makes available; oversized/bad-encoding rejected payload bytes may be unavailable, and records must say so. Record rejected upgrade attempts before rejecting when storage is available.
- [ ] Implement challenge/connect/hello/dispatch/tick and error close behaviour from frozen fixtures. Store inbound evidence before dispatch, outbound evidence before send, and send outcome after callback. Limit outbound payload to 1 MiB and socket buffered bytes to 1 MiB, subject to the smaller global budgets in Task 6. Reject a repeated connect. Serialise each connection's handlers; never create an unbounded chain of async message callbacks waiting for persistence.
- [ ] Verify fresh nonces, source-valid full hello, protocol-range failures, token policy, request ID echo, binary rejection and deferred route errors. Tests must not require a full upstream UI to connect. Pass integration tests. Commit: `feat: expose discoverable OpenClaw gateway transport`.

## Task 6: Enforce budgets, retention and shutdown

**Files:** create `src/gateway/limits.ts`, `src/evidence/retention.ts`, `src/config.ts`, `tests/unit/limits.test.ts`, `tests/integration/lifecycle.test.ts`.

**Interfaces:** `ConnectionBudget.consume(nowMs: number): boolean`; `Recorder.maintain(): Promise<{accepting: boolean; deletedConnections: number}>` delegates through writer RPC; config loader validates all limits and trusted proxy CIDRs. SIGTERM invokes gateway close, drains recorder and releases world lease.

- [ ] Write fake-clock tests for burst 40/refill 20 per second, 128 sockets, 32 pending requests, 10-second handshake and 120-second application idle. Server ticks must not extend the idle deadline. Run tests; expect failures before implementing controls.
- [ ] Add global byte admission: 16 MiB inbound application payload retained across all connections, 8 MiB recorder queue/in-flight payload, 8 MiB application-owned outbound buffers. A byte can belong to more than one bucket when copied; reserve each allocation. Count limits are ceilings, not promises to admit 128x32 maximum frames. Reject/disconnect before adding work when reservation fails; maximum waiting producers is zero. ws receive buffers, HTTP headers and temporary JSON parsing also count in measured RSS. Ingress concurrently buffering traffic has a separate resource budget.
- [ ] Enforce maximum connection lifetime 15 minutes and maximum recorded data 4 MiB per connection. Close at the first threshold even if a client sends keepalives, so active sessions cannot indefinitely pin evidence. Recover crashed sessions before pruning. Add saturation tests for many connections, large frames, slow recorder, backpressured clients and endless HTTP requests; under the 256 MiB container limit require peak RSS below 220 MiB, no OOM and bounded event-loop delay (p99 below 250 ms). If measured overhead fails this target, reduce admission defaults and update spec; do not merely increase the memory ceiling.
- [ ] Add recorder saturation, EIO/ENOSPC injection and shutdown-with-pending-writes integration tests. Assert no success response if required append fails. Reserve room for small rejection/error metadata; stop accepting if reserve is exhausted.
- [ ] Implement 7-day pruning of complete connections, checkpoint/truncate WAL, SQLite max_page_count budget and bounded incremental vacuum. Start with auto_vacuum=INCREMENTAL before schema creation. The 512 MiB logical budget covers DB+WAL+SHM+manifests; max_page_count bounds only the main database and is not a WAL/filesystem quota. Begin reclaim at 448 MiB, pause admission at 512 MiB, retain 128 MiB recovery/WAL headroom and resume below 384 MiB after maintenance. Set journal/checkpoint policies and test the busy-reader case. A 768 MiB filesystem quota is the hard stop; no portable Compose declaration is claimed to enforce it. Preflight public collection requires verified quota support.
- [ ] Retain active evidence and referenced manifests; prune oldest closed connections first. Test reduced thresholds with temporary stores, not hundreds of MiB on this host. Verify header spoofing remains a claim outside configured proxy CIDRs. Pass all suites. Commit: `feat: bound sensor resources and evidence retention`.

## Task 7: Provide private operator commands and inert replay

**Files:** create `src/cli.ts`, `src/operator/export.ts`, `src/operator/replay.ts`, `tests/integration/operator.test.ts`, `docs/operations/local.md`.

**Interfaces:** CLI commands `provision`, `serve`, `reprovision`, `export`, `replay`, `check`, `recover`. Export accepts data directory, connection selector and explicit `--raw`; replay renders JSON lines with escaped text, never HTML or terminal control sequences. No HTTP admin server. `recover` is an explicit offline stale-lease recovery operation, not a bypass of an active owner.

- [ ] Write tests for unknown arguments, paths containing spaces, running-instance lease, restart persistence and inert escape sequences. Redaction test includes a token inside free-form malformed JSON:

```typescript
test('safe export omits raw attacker text', () => {
  const line = exportSafe(sampleEvent({payload:Buffer.from('token=private-value')}));
  assert.equal(JSON.stringify(line).includes('private-value'), false);
});
```

Add `exportSafe` as a named export. Run tests; expect red before implementing.

- [ ] Safe export emits only allowlisted IDs, times, method/status enums, byte counts and taxonomy tags. Omit all raw bodies, arbitrary strings, addresses, device identity and credential fields. Raw export is explicit and documented. Safe export is a metadata summary, not a complete forensic replay.
- [ ] Allowlisted IDs mean **recorder-generated event/connection/world IDs only**. Never export visitor-supplied request IDs, device IDs, instance IDs or arbitrary method strings in safe mode. Known methods use the fixed internal enum; everything else becomes `unknown`. Tags/statuses come only from trusted enums. Test a credential embedded separately in request ID, unknown method, client display name, path, header, malformed bytes and tag-like input. Safe-mode output must contain none of them.
- [ ] Full replay operates locally from private storage with JSON escaping and bounded line sizes. It never follows URLs or executes content. Operational stdout contains counts and error codes only. Add restart/reprovision/export acceptance test; pass suites. Commit: `feat: add private evidence export and replay`.
- [ ] `recover` verifies the stopped owner using lease nonce, process start identity and container/host identity, never PID alone or lock age. Where ownership cannot be verified, require stopping the sensor deployment and an explicit operator recovery acknowledgement; do not silently delete the lock. Test process crash, reused PID, changed process namespace and active-owner refusal. Run the compiled CLI from another working directory and verify asset/worker resolution. Include these tests before the task commit.

## Task 8: Prove discovery with independent tools

**Files:** create `tools/probe-gateway.mjs`, `tools/check-discovery.ps1`, `tools/verify-discovery.mjs`, `tests/fixtures/scanners/openclaw-control-detect.yaml`, `tests/fixtures/scanners/provenance.json`, `tests/integration/discovery.test.ts`, `docs/research/discovery.md`.

**Interfaces:** probe tool accepts only an explicit URL, outputs a JSON report and fails nonzero on invalid challenge/hello. Discovery script accepts explicit loopback host/port and an output directory; rejects non-loopback targets. Verifier consumes Nmap XML, httpx JSONL, Nuclei JSONL and probe JSON, returns evidence-level results.

- [ ] Write negative controls: generic HTTP page, title-only page, full marker page with no WebSocket, and incompatible WebSocket service. Assert title/Nuclei matches alone do not become protocol-confirmed. Test report parser with recorded example output; no mock is counted as an actual scanner pass.
- [ ] Fetch the exact pinned detection YAML and license notice, compute its hash and leave its signature/digest unmodified. Record scanner executable versions, template commit/hash and command arguments; check installed tool help before running documented flags. Install missing scanner tools only during execution after disk check, using official sources.
- [ ] The independent probe uses Node's built-in WebSocket client and a separate assertion layer; it imports no emulator validators, handlers or serializers. Run identical request vectors against the Task 0 reference and token-gated emulator loaded from the shared canonical dataset via Task 2's adapter, comparing normalised transcripts. Ignore only approved transient timestamp/nonce/connection-ID fields and explicit documented partial-profile differences. Derived schemas supplement this differential oracle, not replace it. A mismatch must be classified as a bug or named divergence before passing.
- [ ] Run the localhost commands in the research section and check exit codes plus parsed output. The probe performs challenge/connect and all eight methods and checks fixture-derived field/invariant assertions independently. Prohibit exploitation templates, OAST, cloud result upload and bulk targets.
- [ ] Repeat direct checks on 18890 and with token-gated rejection. TLS/proxy checks are deferred to Task 9 after ingress exists. Assert captured HTTP/WS evidence exists. Nmap transport probes that fail before HTTP are documented as outside application capture, not fabricated as HTTP events. Save artifacts under gitignored `artifacts/discovery/`.
- [ ] Use this expectation matrix: generic HTTP page -> no OpenClaw protocol confirmation; title-only and full-marker/no-WS pages -> possible HTTP/Nuclei matches, never protocol confirmation; wrong-protocol WS -> no profile confirmation; source-backed subset -> historical-profile confirmation. Add a client range excluding 3 (including 4-only), missing-device and malformed-connect vectors, duplicate in-flight request IDs and repeat-connect vectors. Duplicate IDs are recorded and rejected deterministically; never dispatch two ambiguous pending requests with the same ID. For each vector record upstream-observed, emulated-compatible or intentional-deception outcome separately.
- [ ] Manually inspect a browser screenshot of the minimal landing page and record asset/path differences from the reference. Scanner recognition, protocol-subset fidelity and interactive visual realism are three separate findings; passing scanners does not establish convincing human deception. Do not expand this task into a full Control UI implementation.
- [ ] Run `node tools/verify-discovery.mjs artifacts/discovery`; require tool-specific findings and negative-control separation. Record actual results in discovery.md. If tools cannot run, leave this task uncompleted with the exact blocker. Commit: `test: verify OpenClaw discovery with independent scanners`.

## Task 9: Package Docker isolation and complete the first piece

**Files:** create `Dockerfile`, `.dockerignore`, `compose.yaml`, `deploy/compose.public.yaml`, `deploy/nginx.conf`, `deploy/verify-isolation.ps1`, `README.md`, `docs/operations/deployment.md`, `tests/integration/end-to-end.test.ts`.

**Interfaces:** gateway and provision commands run in a non-root Node image with an explicit data volume. An nginx ingress on an external bridge connects to the gateway's internal-only network. Gateway has only that internal network and no published port; deployment firewall rules additionally deny gateway-initiated connections. Ingress publishes loopback port 18789 in lab configuration and 0.0.0.0 in the public override. The ingress forwards only to the fixed gateway upstream, never arbitrary caller URLs. Only ingress-initiated gateway connections and their established replies are allowed; no gateway-initiated network session is permitted. Docker shares the host kernel; these controls do not promise protection against a kernel/container escape.

- [ ] Write `tests/integration/end-to-end.test.ts` against an explicit deployment-fixture interface: start/stop/restart services, exec private CLI and read exported artifact paths. The fixture invokes `docker compose` using spawn with an argument array and checks each exit status. Run `npm run build`, then `node --test dist/tests/integration/end-to-end.test.js`; initially expect a clearly missing deployment/configuration failure. Its journey is provision -> connect -> enumerate -> stop -> offline replay -> restart -> compare identity -> stop -> reprovision -> replay old world. Offline operator commands must not contend with serving state.
- [ ] Pin Node/nginx images by digest at execution. Multi-stage build uses `npm ci --ignore-scripts`, compiles TS and copies production dependencies only. Apply spec limits, read-only root, tmpfs, non-root user, dropped capabilities and no-new-privileges. Initialize the named volume as the declared UID through an explicit one-shot setup; do not chmod arbitrary host paths. Ignore data, artifacts, dist, node_modules and environment files in Git and Docker build context.
- [ ] Configure ingress WebSocket forwarding and bounded HTTP sizes/timeouts. Overwrite forwarded identity headers; trust only ingress addresses in the gateway. Ingress access logs must not dump incoming credentials. Match proxy timeouts to gateway idle rules so tests observe the intended boundary. Record rejected requests stopped by the proxy as proxy outcomes, with private logs, not falsely as gateway events.
- [ ] Bound ingress to 128 concurrent client sockets, 5-second header/body idle timeouts plus 10-second total-request deadline, 100 requests per keepalive connection and 100 HTTP requests/second globally with burst 200. Disable unnecessary request/response disk spooling; route any required temporary files into a 16 MiB tmpfs. Apply aggregate rejection/connection budgets at ingress and backend, testing that parser/upgrade floods cannot bypass either. A proxy with a weaker timeout model must be paired with the backend total deadline and measured slow-input tests; do not claim nginx alone supplies a hard total deadline.
- [ ] Configure Docker logging-driver rotation with max-size 5 MiB and max-file 2 per service. Proxy observation storage gets its own 32 MiB rotating budget, outside the evidence-volume quota. Proxy records contain generated interaction IDs, status, byte counts and reason enums, without raw URLs/query strings, headers or bodies. State that 768 MiB is an evidence-volume ceiling, not a whole-deployment disk ceiling. Test sustained rejected requests, temp-file bounds and rotation.
- [ ] Supply host firewall recipes under `deploy/firewall/` for the supported Linux Docker backend, with exact interface/subnet resolution, IPv4/IPv6 handling, counters, rollback and preflight verification. Keep firewall privileges on the host; the emulator gets no NET_ADMIN or host namespace. Docker's internal network is defence in depth, not evidence of complete egress denial. Use static internal service addresses or a controlled resolution method so blocked DNS does not break the fixed upstream path.
- [ ] Run `docker compose config`, build after disk check and start lab services. Test allowed ingress/replies and denied new gateway sessions toward: ingress listeners, another controlled internal container, host bridge/gateway service, controlled external IPv4/IPv6 endpoints, DNS over UDP/TCP and controlled link-local/metadata stand-ins. Do not probe a real cloud metadata service. Test disabled IPv6 as an explicit alternative. Assert destination counters/timeouts and firewall counters, not solely client errors. Verify container inspect settings, no host mounts/socket, default loopback publication, deliberate public mapping and private storage. A platform that cannot enforce the rules fails public-readiness preflight.
- [ ] After packaging, repeat Task 8's scanner and differential checks through ingress and a local TLS configuration with a test CA trusted explicitly by clients. Add `tests/integration/proxy.test.ts` for spoofed forwarding headers, rejected traffic capture and normal WS operation. Save separate direct/proxy/TLS reports; never reuse a direct pass as proof of proxy fidelity.
- [ ] Document Linux Docker Engine as initial public deployment target; Windows Docker Desktop is a local development target whose external networking must be independently verified. Configure a quota-backed volume for a hard data ceiling or label the hard-quota deployment check incomplete. Stop public-readiness claims if isolation/quota tests cannot be run.
- [ ] Run all tests and `npm audit --omit=dev`; review dependency advisories and fix high/critical runtime issues. Review spec acceptance checks 1-10 with links to test/results. Update README with partial compatibility, deliberate auth deviations, private storage, discovery commands and deferred modules. Commit: `feat: package isolated gateway sensor foundation`.

## Self-review and handoff

Coverage: spec sections 1-3 -> Tasks 0/1/5/8; architecture -> Tasks 1-7; gateway contract -> Tasks 0/1/4/5; variation -> Task 2; evidence -> Tasks 3/6/7; isolation -> Task 9; limits -> Tasks 5/6/9; taxonomy observations -> Task 4 and evidence enums; acceptance checks -> Tasks 8/9 and each owning test. All five review-focus items have explicit owner tests. Panel review additionally covers reference provenance, independent oracles, lifetime/byte limits, crash recovery, export origin rules and full ingress/deployment storage accounting.

The plan preserves the approved first-piece boundary. No chat execution, MCP, OpenRouter, daily jobs or Grafana implementation is included. Discovery tests intentionally preserve recognizable product markers; content variation does not attempt to hide that the apparent product is OpenClaw.

Review this plan before execution. Recommended approach: native sequential implementation, because the tasks share protocol/world/evidence interfaces and the user wants to inspect small pieces. Subagent-driven execution remains available if explicitly selected. Implementation begins only after plan review and execution-method selection.

## Interface and lifecycle appendix (freeze during Task 1)

All APIs below are internal contracts, not visitor-facing schemas. Source-backed payload types remain in the pinned profile. Define the listed types explicitly in the named files; no `any` or silent conversion from unvalidated JSON to trusted state.

```typescript
// src/contracts.ts
export type Clock = {now(): number};
export type WorldRef = {worldId: string; worldHash: string; profileId: string};
export type KnownMethod = 'health' | 'system-presence' | 'agents.list' |
  'models.list' | 'skills.status' | 'config.get' | 'sessions.list' | 'chat.history';
export type Observation = 'handshake_failure' | 'invalid_frame' | 'enumeration' |
  'config_access' | 'history_access' | 'privilege_claim' | 'unsupported_protocol' |
  'resource_limit';
export type CaptureStatus = 'complete' | 'prefix_only' | 'unavailable';
export type Lifecycle = 'accepted'|'headers_complete'|'body_complete'|'body_aborted'|
  'response_prepared'|'response_finished'|'response_failed'|'challenged'|
  'connected'|'closing'|'closed'|'wire_input'|'wire_output'|'send_outcome'|
  'maintenance'|'recovered_aborted';
export type SendStatus = 'prepared' | 'send_callback_success' |
  'send_callback_failure' | 'unknown_after_crash';
export type ValidationResult = {ok: boolean; errors: string[]};

// src/gateway/policy.ts
export type DeceptionPolicy =
  {kind:'open-control'} |
  {kind:'token-gated'; token:string; grants:readonly string[]};
export type AccessDecision =
  {allowed:false; reason:'invalid_role'|'missing_token'|'wrong_token';
   claimedScopes:readonly string[]} |
  {allowed:true; grants:readonly string[]; claimedScopes:readonly string[];
   authentication:'synthetic_token'|'intentional_bypass'; deviceVerified:false};

// src/gateway/dispatch.ts
export type HandlerResult =
  {ok:true; payload:unknown; observations:readonly Observation[]} |
  {ok:false; error:{code:string; message:string}; observations:readonly Observation[]};

// src/evidence/types.ts
export type EvidenceInput = {
  world:WorldRef; connectionId:string; direction:'in'|'out'|'internal';
  transport:'http'|'websocket'|'tcp_error'; timestampMs:number;
  lifecycle:Lifecycle; peerAddress:string|null; claimedIdentity:unknown;
  payload:Buffer|null; captureStatus:CaptureStatus; observedBytes:number|null;
  requestId:string|null; method:KnownMethod|'unknown'|null;
  rawMethod:string|null; parseStatus:'valid'|'invalid'|'unavailable';
  access:AccessDecision|null; sendStatus:SendStatus|null;
  relatedEventId:string|null; observations:readonly Observation[];
};
export type RecorderOptions = {
  dataDir:string; maxEntries:number; maxQueuedBytes:number; ackTimeoutMs:number;
  clock:Clock;
};
export interface Recorder {
  append(event:EvidenceInput):Promise<{eventId:string; sequence:number}>;
  maintain():Promise<{accepting:boolean; deletedConnections:number}>;
  health():Promise<{accepting:boolean; queuedBytes:number; usedBytes:number}>;
  close():Promise<void>;
}
```

The lifecycle enum above represents the HTTP/gateway states in Task 5; prose hyphenated names map to underscore enum values. Public request IDs stay raw evidence only. One writer assigns sequences per connection, including error/send-outcome events. Send outcomes link to prepared outbound events via relatedEventId; a successful local callback is never labelled remote receipt.

`World` in `src/world/types.ts` uses schemaVersion 1, generatorRevision, WorldRef, seed, generatedAtMs, syntheticBootAtMs, owner, readonly typed agents/sessions/messages/models/skills/integrations and the synthetic config snapshot. Profile serializers own the upstream field names; the world model does not masquerade as raw upstream JSON. Hash excludes its own hash field and uses documented canonical UTF-8 JSON. World size is capped at 2 MiB before persistence.

`tests/fixtures/helpers.ts` defines sampleEvent(overrides?:Partial<EvidenceInput>), fixtureWorld(), openAccess(), fixtureClock() and failingRecorderOptions(). Prefer a lower-level injected writer-port fault to production test-only switches. Integration fixture setup returns an explicit context with url, recorder, server and async dispose(); sample tests must use that context rather than shared global fixtureUrl state. Every acquired resource is closed using test cleanup hooks.

Global acceptance controls additionally include 10 new TCP connections/second with burst 20, 100 HTTP requests/second with burst 200, and 2 MiB/second evidence-byte admission with burst 4 MiB. These are aggregate sensor limits, unaffected by reconnecting. If admission fails, close/refuse and increment a bounded in-memory loss counter; do not recursively attempt one database event per rejected packet. Flush only an aggregated summary when capacity recovers. A recording gap is explicit, never described as lossless collection.

Shutdown stops admission immediately, allows up to 5 seconds for in-flight responses, terminates sockets, then allows 3 seconds for recorder drain. Overall application shutdown deadline is 10 seconds; Compose grace period is 15 seconds. If storage remains unavailable, report a bounded operational failure and exit nonzero; recover unfinished records at next startup. Fault tests cover kill after prepare, after socket send, while persisting outcome and while pruning. Committed acknowledgement depends on SQLite/fsync and the storage device honouring durability; no claim survives hardware lying about flushes.

Public readiness is a conjunction: reference/profile checks, functional journey, discovery checks, measured bounded load, retention/failure checks, hard quota and effective network restrictions. Missing infrastructure can leave a local-development milestone usable, but the public deployment remains explicitly incomplete.
