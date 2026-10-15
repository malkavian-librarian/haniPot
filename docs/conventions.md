# Development conventions

## Workflow

Follow the [reviewed plan](superpowers/plans/2026-10-15-openclaw-gateway-foundation.md) sequentially. Keep [TODO.md](../TODO.md) accurate and record decisions and verification evidence in the execution ledger. A planned test is not a passed test. Leave blocked gates unchecked.

Write a failing behavioural test before production code, implement the smallest working change and rerun the relevant suite. Verify the complete suite at task boundaries. Keep modules small and separate protocol adapters, synthetic state, recording and operator access.

## Platform

The development host is Windows; use PowerShell, not Bash. The reference container's upstream build uses Linux tooling inside Docker, never on the host. Check disk before installs/builds. Never delete unrelated Docker images, volumes or caches.

Git is available through the GitHub Desktop bundled executable supplied by the user's global instructions. Stage explicit paths. Never commit `.env*`, credentials, node_modules, build output, raw captures, downloaded upstream source or runtime databases. Run the security-review skill before every push; fix critical/high findings before pushing.

## Data and code

Runtime target: Node 24 LTS, TypeScript ESM. Compile before running shipped code; resolve runtime assets from import.meta.url, not the shell's working directory. Pin source/profile/tool provenance and retain required license notices for derived artifacts.

Synthetic values come from a persisted seed and curated templates, not from the developer's host identity or environment. Tests use reserved example domains and nonfunctional credentials. Source pinning alone does not pin container dependencies or package-manager downloads.

## Documentation and agent instructions

Update backend/frontend/vulnerability docs when behaviour changes. Keep AGENTS.md short and actionable, linking these documents rather than duplicating the complete design or transient progress.

This follows the official [AGENTS.md guide](https://developers.openai.com/codex/guides/agents-md/): use repository-local instructions for navigation, commands and project rules; use narrower directory instructions only when a component genuinely needs different rules. User/system instructions take precedence.
