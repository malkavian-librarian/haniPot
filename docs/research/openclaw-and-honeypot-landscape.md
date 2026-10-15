# OpenClaw and the honeypot landscape

Research date: **15 October 2026**. Approximately one fifth of this document covers OpenClaw; the rest covers honeypots, operational methods and recommendations for haniPot. External capabilities below come from official documentation, repositories or author research. They were researched online, not independently deployed or audited for this report. Recommendations are identified as such.

The strongest direction for haniPot is a persistent, coherent OpenClaw-shaped simulator with bounded evidence collection. Existing projects already cover LLM-generated shells, adaptive HTTP responses and MCP bait tools. Our useful differentiation is a recognizable agent gateway, consistent fake installation state, reproducible compatibility evidence and clear separation between apparent capabilities and real privileges.

## Part I — OpenClaw technicalities, approximately 20%

### Architecture and exposed surfaces

OpenClaw's Gateway is a control plane for clients and agents. Current documentation describes WebSocket text frames carrying JSON, with a `connect` request as the first client frame. This matters because an HTTP page alone cannot reproduce a gateway conversation: a believable decoy needs connection establishment, framing, authentication policy, method dispatch, errors and connection lifecycle. The current transport also documents payload and buffering policies and explicitly disables WebSocket compression. [Official transport documentation](https://docs.openclaw.ai/gateway/protocol/transport).

Current handshake documentation shows a server `connect.challenge` containing a nonce and timestamp, client protocol negotiation, role/scopes and optional device authentication, followed by `hello-ok`. It now illustrates **protocol 4** and a default 30-second connect deadline. These are current documentation observations, not contracts for our historical profile. [Official handshake documentation](https://docs.openclaw.ai/gateway/protocol/handshake).

The Gateway also has an optional OpenAI-compatible HTTP API. Current documentation lists `/v1/chat/completions` and model/embedding endpoints when enabled, while `/v1/responses` is separately enabled. The chat surface is disabled by default and executes normal Gateway agent runs. Consequently, “OpenClaw gateway,” “OpenAI-compatible API” and “MCP server” must be separate selectable profiles rather than interchangeable labels. [Official HTTP API documentation](https://docs.openclaw.ai/gateway/openai-http-api).

Real deployments have powerful tools and credentials behind this control plane. Official security guidance assumes one trusted operator boundary and distinguishes regular host loopback defaults from container exposure behavior. Reproducing apparent misconfiguration does not require running the real application with its privileges. haniPot should expose invented configuration and simulated tools while its implementation remains incapable of host execution or visitor-directed fetching. [Official security guidance](https://docs.openclaw.ai/gateway/security).

### Discovery: recognizable does not mean compromised

Port **18789** is a useful default-port hint, not proof of identity. Current OpenClaw networking documentation identifies the default loopback WebSocket address. Operators can change ports or place HTTP and WebSocket traffic behind a proxy. [Official networking documentation](https://docs.openclaw.ai/network).

There is a concrete open-source fingerprint: ProjectDiscovery's `openclaw-control-detect` Nuclei template checks an HTTP 200 response and matching body markers, including the `OpenClaw Control` title and `openclaw-app` element. It is an informational interface detector, not an authentication-bypass or remote-execution test. A decoy can satisfy this fingerprint without implementing the full product. [Official template source](https://github.com/projectdiscovery/nuclei-templates/blob/main/http/exposed-panels/openclaw-control-detect.yaml).

Nmap service/version probing can identify the listening HTTP service; its `http-title` script retrieves the page title. Neither establishes full protocol compatibility. For our own loopback fixture, a useful manual check is:

```powershell
nmap.exe --unprivileged -sT -Pn -sV -p 18789 --script '+http-title,+http-headers' 127.0.0.1
```

The quoted script argument works in PowerShell; `+` forces these HTTP scripts when an unusual port is not classified as HTTP. Use only operator-owned targets. An independent WebSocket journey is the next validation layer after a recognizable page. [Nmap version detection](https://nmap.org/book/man-version-detection.html), [http-title documentation](https://nmap.org/nsedoc/scripts/http-title.html).

### Our historical profile and its limits

haniPot pins **OpenClaw v2026.1.29, protocol 3**, commit `77e703c69b07a236c2f0962bd195e03aae1b8da0`. Its eight read methods cover health, presence, agents, models, skills, configuration, sessions and history. It is a partial historical emulator. The isolated reference capture, strict-schema differences, curated catalogues and observed 30-second historical tick are recorded in [compatibility evidence](compatibility.md); current protocol-4 documentation must not silently redefine them.

The present discovery page is static, and the gateway does not invoke a model. [Backend](../backend.md) and [frontend](../frontend.md) describe actual implementation. My recommendation is to keep this named profile stable and add future profiles through explicit reference captures. Rotate fake business identity at provisioning, preserve it across ordinary restarts, and measure recognition separately from visual realism or engagement. No verified source in this review establishes that OpenClaw is more attractive to scammers than every alternative; that remains a deployment hypothesis.

## Part II — Honeypots, use cases and operating practices, approximately 80%

### What exists: established network honeypots

These projects address different jobs. “Popular use cases” here means recurring purposes represented in their official designs, not a measured ranking of deployment share.

| Project | Documented purpose and interaction | Relevant lesson for haniPot |
| --- | --- | --- |
| [Cowrie](https://github.com/cowrie/cowrie) | SSH/Telnet credential attempts and post-login shell activity; emulated shell, proxy mode and an experimental LLM backend. Structured JSON and replayable session records. | Model a coherent fake environment and retain ordered interactions. Do not equate a convincing response with real command execution. |
| [T-Pot](https://github.com/telekom-security/tpotce) | Docker-based multi-honeypot platform with centralized Elastic visibility and distributed deployment options. | Sensor/analysis separation and consistent event ingestion matter more than adding every protocol immediately. |
| [OpenCanary](https://github.com/thinkst/opencanary) | Lightweight multi-protocol decoy, primarily intended to catch intruders inside non-public networks and alert on contact. | A small, low-interaction lure can provide valuable alerts without a conversational model. |
| [Conpot](https://github.com/mushorg/conpot) | Industrial-control-system honeypot for intelligence on adversary motives and methods. | A specific believable persona can be more meaningful than an unrelated collection of banners. |
| [Dionaea](https://dionaea.readthedocs.io/en/latest/introduction.html) | Network-service deception with malware acquisition as a central goal. | Define the evidence objective first; acquiring malware introduces handling and networking requirements that haniPot should initially avoid. |

Cowrie is the closest conceptual ancestor: its fake filesystem and canned outputs can be customized, while connection/session evidence supports reconstruction. Its current repository also describes LLM response generation as experimental, so “Cowrie but using an LLM” is already occupied territory. A haniPot contribution should instead emphasize agent-specific state and protocol fidelity. [Cowrie repository](https://github.com/cowrie/cowrie), [installation and customization guide](https://docs.cowrie.org/en/latest/INSTALL.html).

T-Pot is a useful integration reference, but a large baseline for a single gateway sensor: its documented sensor requirements include 8 GB RAM and 128 GB SSD, and it includes reporting/data-sharing configuration operators must understand. Those requirements are not haniPot requirements. Reuse its operational lessons without inheriting a full multi-service stack on a disk-constrained development machine. [T-Pot requirements and configuration](https://github.com/telekom-security/tpotce#system-requirements).

For internal deployments, OpenCanary's contact-oriented design is especially relevant. An unexpected request to an internal fake agent-management endpoint can be more actionable than thousands of anonymous public HTTP probes. Document expected monitoring and authorized scanner traffic so that routine checks do not become repeated incidents. This is an operational recommendation based on OpenCanary's stated internal-detection purpose. [OpenCanary overview](https://github.com/thinkst/opencanary#overview).

### AI-powered honeypots and AI-service decoys

There are two distinct markets: honeypots that **use AI to simulate another service**, and honeypots that **look like AI infrastructure**. haniPot can eventually combine both, but should measure them separately.

| Project or research | What the primary source actually supports | Assessment for our project |
| --- | --- | --- |
| [Beelzebub](https://github.com/beelzebub-labs/beelzebub) | Configurable deception runtime; static or LLM responses, SSH/HTTP/TCP/Telnet/MCP, structured evidence and Prometheus metrics. Its MCP examples advertise bait tools. | The closest broad feature overlap. Evaluate its configuration and event model before designing a general plugin framework. Documentation is not proof that every bait protocol fully emulates a real product. |
| [Galah](https://github.com/0x4D31/galah) | LLM-generated HTTP headers/body, configurable response caching and several model providers. The author explicitly warns about identifiable latency/nonstandard behavior and denial-of-wallet risk. | Strong reference for optional generative fallback and caching, weaker substitute for an exact stateful gateway. |
| [ai-honeypot](https://github.com/fevziegeyurtsevenler/ai-honeypot) | Fake OpenAI-style chat and MCP tool listing; captured prompts, rule-based/optional richer classification and harmless canned responses. | Direct evidence that an AI-service decoy can work without live inference. A tool listing alone does not prove full MCP transport compliance. |
| [cerebral-work/mcp-honeypot](https://github.com/cerebral-work/mcp-honeypot) | README advertises 13 fake tools, session/anomaly logic, OpenTelemetry, Jaeger, Prometheus and Grafana; its architecture describes SSE. | Relevant telemetry prototype. Treat its “research-grade” description as the author's claim, not independent certification. README clone links naming another owner require provenance checks before reuse. |
| [workspace-tools-mcp](https://github.com/brian-mitchell-sec/workspace-tools-mcp) | Synthetic workspace tools, tool-argument telemetry, honeytoken chains and a documented local experiment harness. It also describes active injection probes. | Useful evidence design and explicit data-handling disclosure. Active probes belong in a separately authorized lab profile; do not reproduce them against unknown visiting agents. |

Beelzebub's current documentation explicitly distinguishes static behavior from provider-dependent generated responses and describes trusted plugins as in-process extensions. For haniPot, configuration-based personas should remain data; adding arbitrary plugins would create a new code-trust boundary. Its platform reporting is optional, which is a useful precedent for keeping open-source local operation complete. [Beelzebub architecture and usage](https://github.com/beelzebub-labs/beelzebub#how-it-works).

One particularly useful counterexample to “put it online and agents will attack” comes from workspace-tools-mcp. Its author reports a 12-day listed-versus-unlisted comparison in which listed traffic was dominated by ecosystem indexers, the unlisted arm saw no initializations, and only one tool was called. This is a small, self-reported field observation, not a universal MCP traffic estimate. It still shows why initialization, catalogue retrieval and actual multi-step agent interaction require separate counters. [Author's report and limitations](https://github.com/brian-mitchell-sec/workspace-tools-mcp/blob/main/FINDINGS.md).

Research on identifying AI attackers also warrants restraint. *LLM Agent Honeypot* describes an SSH-based experiment using prompt-injection and timing signals; its abstract reports eight **potential** AI agents among millions of attempts. A responsive prompt or unusual cadence is not verified attribution to an autonomous model. Preserve an uncertainty label and the evidence supporting it. [Author paper, revised February 2025](https://arxiv.org/abs/2410.13919).

Do not mix these with evaluation frameworks. [AgentDojo](https://github.com/ethz-spylab/agentdojo) evaluates attacks and defenses in agent environments; it is useful for controlled scenario testing, not an internet honeypot by itself. Nmap and Nuclei are discovery/validation tools. MCP itself is a protocol: remote Streamable HTTP and local stdio have different exposure properties. A public MCP module must implement a named protocol/transport version rather than return plausible JSON on a conveniently named route. [Official MCP transports specification](https://modelcontextprotocol.io/specification/2025-11-25/basic/transports).

### Use cases and the evidence each requires

My recommendation is to choose one primary objective for each deployment:

| Use case | Useful observation | Avoid this inference |
| --- | --- | --- |
| Public reconnaissance | Ports/paths requested, page discovery, connection negotiation, catalogue enumeration. | A page request proves malicious intent or a human attacker. |
| Internal intrusion alerting | Unexpected access to a fake gateway or fake administrative API in a quiet segment. | Every monitoring probe is a compromise. |
| Credential and configuration interest | Retrieval of fake settings and subsequent presentation of an issued synthetic token. | Returning fake credentials proves theft from a real service. |
| Agent/tool abuse | A sequence from enumeration to synthetic sensitive reads or simulated privileged actions. | A dangerous tool name establishes that its caller is an LLM. |
| Prompt-injection research | Controlled model task, malicious material encountered, resulting action and clean baseline. | Logging injection-shaped text proves successful prompt injection. |
| Training and detection validation | Known local scenarios produce expected records, alerts and analyst reconstruction. | Lab-generated events represent prevalence in the wild. |

Keep crawler content and deliberate engagement/tarpit experiments as later profiles. For initial haniPot work, service discovery and synthetic disclosure produce interpretable evidence without model availability, cost or agent-side experimentation.

### Practical how-to: a small local baseline

The following is a recipe to perform deliberately, not a claim that this research task executed it. It uses existing haniPot behavior documented in [backend](../backend.md) and [verification evidence](verification.md):

1. Check available disk before building. Keep the sensor on a dedicated data directory or Docker volume with no real OpenClaw files.
2. Start the repository's default Docker deployment: `docker compose up -d --build --wait`. Its published endpoint is loopback `127.0.0.1:18789`; it is not the public deployment recipe.
3. Retrieve `/` locally and run the operator-owned discovery fixture checks. `tools/check-discovery.ps1` accepts the configured local fixture ports and uses pinned scanner inputs. Its canonical differential check expects the fixture dataset; do not treat a randomly provisioned business persona as that exact dataset.
4. Exercise an independent WebSocket client against the local fixture, including supported reads and invalid requests. Confirm that evidence captures both observations and limitations.
5. Stop the sensor before private CLI maintenance/export. Keep metadata export and raw evidence distinct; never attach raw captures to a public issue.
6. Restart with the same volume and check identity continuity. Use explicit offline reprovisioning for a new identity. A new container image should not unexpectedly replace persisted state.

For a comparative lab, repeat the same process with one upstream project at a time on separate loopback ports. Start Cowrie in emulation mode and inspect JSON/session replay; try Galah with a strict provider cap; compare a static Beelzebub route with its generated alternative. Record image/commit versions, enabled modules, requests and evidence outputs. Those are proposed evaluations; this document does not certify their Docker defaults or integrations.

### Practical how-to: containment before public hosting

Docker's port-publishing documentation warns that unspecified host bindings publish broadly; explicit loopback publication limits normal access. It also records a localhost-publication caveat for older Engine releases. Verify the actual Engine/Desktop version and network behavior, especially on Windows, rather than applying Linux assumptions mechanically. [Docker port publishing](https://docs.docker.com/engine/network/port-publishing/).

For a future deployment, use a dedicated VM or host, no production trust, nonroot/read-only containers, dropped capabilities, no Docker socket, bounded writable storage and a management interface reachable only by the operator. These are recommended layers, not proof that containers cannot be compromised. Docker documents the daemon/control-plane privileges as a critical security concern. [Docker Engine security](https://docs.docker.com/engine/security/).

Test outbound restrictions from each relevant workload: sensor, proxy, reference environment and future analysis worker. Check IPv4/IPv6, DNS, LAN, host services, cloud metadata and public destinations against operator-owned test endpoints. A container's `internal` network setting is not a complete measured security boundary. On Linux, Docker also changes firewall behavior; its documentation specifically explains why published traffic can bypass normal ufw expectations. Keep host-specific enforcement and test evidence together. [Docker firewall guidance](https://docs.docker.com/engine/network/packet-filtering-firewalls/).

Admission limits must precede expensive parsing, retention and inference. Exercise slow clients, large bodies/frames, repeated reconnects, writer backpressure, disk-full conditions, WAL growth, abrupt termination and restart. Budget the database, WAL, exports, proxy logs and container logs separately. Application pruning is not a hard filesystem quota. haniPot's public-readiness gates remain open in [TODO](../../TODO.md); this report does not satisfy them.

### Telemetry, retention and analyst safety

Recommended event fields are timestamp, sensor/profile/world versions, connection ID, per-connection sequence, method, observed/captured byte counts, policy decision and linked response outcome. Preserve “prepared,” “send callback succeeded” and “remote receipt unknown” as different facts. Report truncation and capture gaps explicitly. Keep raw payloads private and bounded; a dashboard needs aggregate observations and references to evidence, not every captured credential.

For a future Grafana increment, use private Prometheus metrics for rates/latency/budgets and a bounded log or trace store for investigations. Prometheus advises against high-cardinality dimensions; Loki similarly recommends low-cardinality labels. Do not put IP addresses, request IDs, prompts, paths or tokens into unbounded label values. Use fixed labels such as profile, method and outcome, and place detailed identifiers in protected records. [Prometheus naming guidance](https://prometheus.io/docs/practices/naming/), [Loki label best practices](https://grafana.com/docs/loki/latest/get-started/labels/bp-labels/).

Set an explicit retention policy before collecting: raw versus aggregate lifetime, access roles, deletion process and export scope. Review third-party reporting and model-provider transmission independently. Redact real credentials at analysis/export boundaries where feasible, keep published datasets reviewed and minimal, and provide a contact for data concerns. These are project recommendations, not legal conclusions. The workspace-tools-mcp project's disclosure and [data-handling document](https://github.com/brian-mitchell-sec/workspace-tools-mcp/blob/main/DATA-HANDLING.md) are useful examples of documenting what an instrument actually retains.

Treat captured text as hostile in analyst tooling: escape HTML, strip terminal control sequences where displayed, and never execute downloaded artifacts. A daily LLM analysis job must receive bounded data as untrusted evidence, have no tools or secrets beyond its dedicated provider credential, and produce a schema-validated proposal. It must not automatically modify firewall rules, fetch visitor URLs, publish findings or rewrite the running honeypot.

### Fidelity, variability and model spending

Randomness is useful when it creates multiple plausible installations. It harms credibility when the same agent changes owner, session history or model configuration between consecutive reads. Persist a world seed and schema version; derive all public surfaces from that state. Rotate at explicit provisioning boundaries, and version daily synthetic additions so existing session references remain valid.

For optional OpenRouter generation, my recommendation is to generate batches offline, validate them, and serve cached artifacts. Keep wire protocol, auth policy and evidence handling deterministic. A live model fallback should have request/token/concurrency/day-spend limits and a deterministic response when unavailable. Galah's author explicitly identifies response latency, nonstandard behavior and denial of wallet as failure modes. Its caching design is a useful starting point, not evidence that model-generated output is automatically more convincing. [Galah README](https://github.com/0x4D31/galah).

Measure value per sensor-day: time to first contact, successful handshakes, enumeration-to-history/config conversion, multi-step synthetic-token reuse, session depth, repeated visits, capture loss and operating cost. Report known authorized test traffic separately. Controlled A/B experiments should change one factor at a time—persona or discoverability or response mode—and use comparable exposure windows. Distinct IP counts do not equal distinct attackers; timing-based “AI” classifications remain hypotheses.

### OWASP coverage without overstating results

Use **OWASP LLM Top 10:2026**, matching the project's reviewed design. The official resource page is dated 3 August 2026, and its linked PDF contains the revised category order below, although the PDF's opening pages still contain publication-date placeholders. The general [LLM Top 10 landing page](https://genai.owasp.org/llm-top-10/) currently displays the older 2025 list; do not mix its numbering with 2026. In particular, Unbounded Consumption moves from LLM10:2025 to LLM06:2026, and System Prompt Leakage becomes the broader Hidden Context Exposure. This is a risk taxonomy, not a honeypot certification. [Official 2026 resource](https://genai.owasp.org/resource/owasp-genai-llm-top-10-2026/), [linked 2026 PDF, contents on page 3](https://genai.owasp.org/download/56857/?tmstv=1785822482). Recommended scenarios, with every row using 2026 numbering:

| Risk | Safe haniPot research scenario | Evidence requirement |
| --- | --- | --- |
| LLM01 Prompt Injection | Controlled model encounters seeded malicious content. | Compare task behavior with a clean baseline. |
| LLM02 Sensitive Information Disclosure | Invented configuration/credentials. | Distinguish fake disclosure from real secret exposure. |
| LLM03 Excessive Agency | Simulated privileged MCP operations. | State exactly which actions were simulated. |
| LLM04 Supply Chain | Fake skill/package catalogue and installation request. | Record requests; never install visitor packages. |
| LLM05 Data and Model Poisoning | Isolated synthetic corpus edits. | Requires a later controlled ingestion/retrieval experiment. |
| LLM06 Unbounded Consumption | Controlled bounded load and inference-budget tests. | Capture admission decisions, resource ceilings and loss. |
| LLM07 Misinformation | Contradictory fake source material. | Needs an interpreting model and factual task checks. |
| LLM08 Hidden Context Exposure | Synthetic prompt, memory and hidden-context artifacts. | Avoid leaking developer/analysis-worker instructions. |
| LLM09 Vector and Embedding Weaknesses | Later tenant-tagged fake retrieval store. | Demonstrate retrieval-boundary behavior in a lab. |
| LLM10 Improper Output Handling | Encoded payloads in controlled transcripts. | Verify analyst/rendering sinks stay inert. |

These rows are proposed experiments. The present gateway records service interaction and synthetic disclosure; it does not cover every risk by advertising a tool or returning a fake secret.

### Reuse versus build, and research limits

**Reuse concepts and standard components:** Cowrie's ordered evidence/replay approach; OpenCanary's small-module alerting; Beelzebub's static/generated distinction; Galah's caching; standard OTel/Prometheus/Grafana components when telemetry is added. Audit dependencies and license obligations before copying code. T-Pot and Beelzebub publish GPL-3.0 licenses, while other projects use different licenses; architecture inspiration and code redistribution are different decisions. [T-Pot license](https://github.com/telekom-security/tpotce/blob/master/LICENSE), [Beelzebub license](https://github.com/beelzebub-labs/beelzebub/blob/main/LICENSE).

**Build the specific missing behavior:** named OpenClaw protocol profiles, a consistent synthetic installation, a fake tool capability model shared across surfaces, bounded evidence semantics and reproducible reference/scanner tests. Add MCP first as a separate simulator with synthetic effects; add live inference and A2A only after measuring useful interactions and resource costs.

This is a dated landscape review, not an exhaustive catalogue, security audit or deployment benchmark. Repository capabilities can change; small projects' claims need code review and local validation. No external honeypot was contacted as a client, no internet-wide scan was performed, and no current-project public-readiness claim follows from this research. Preserve source pins when converting these findings into implementation tasks, and recheck official docs before adopting a newer protocol or deployment recipe.
