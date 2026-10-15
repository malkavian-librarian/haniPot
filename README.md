# haniPot

A stateful AI agent honeypot, starting with a partial historical OpenClaw gateway persona.

**Status:** implementation in progress. The reference acquisition gate is being verified; the public sensor is not ready for deployment. [TODO.md](TODO.md) records completed work and remaining gates.

The goal is to collect attacks against synthetic agents, configuration and sessions without exposing a real agent, host tools or provider credentials. The initial compatibility target is OpenClaw v2026.1.29, protocol 3. It is not a complete OpenClaw implementation or an officially affiliated project.

## Documentation

- [Backend](docs/backend.md)
- [Frontend](docs/frontend.md)
- [Simulated vulnerabilities and containment](docs/vulnerabilities.md)
- [Development conventions](docs/conventions.md)
- [Implementation plan](docs/superpowers/plans/2026-10-15-openclaw-gateway-foundation.md)
- [Adversarial review](docs/superpowers/reviews/2026-10-15-gateway-plan-panel.md)

## Reference preparation

PowerShell, Node 24 and Docker Desktop's Linux engine are required. The full reference build needs substantial disk space; check C: and Docker capacity before building.

```powershell
& .\tools\prepare-reference.ps1
docker compose -f deploy/reference/compose.yaml build reference
docker compose -f deploy/reference/compose.yaml up -d reference
docker compose -f deploy/reference/compose.yaml run --name hanipot-reference-capture capture
docker cp hanipot-reference-capture:/captures/reference.json artifacts/reference/reference.json
node --test tests/reference/reference.test.mjs
```

Reference containers have no published ports and use a dedicated internal network. Do not expose the real upstream reference gateway publicly. Raw captures and downloaded source stay under ignored `artifacts/`.

MCP, A2A, live OpenRouter responses, Grafana, crawler content and research-lab modules are later pieces, not current features.
