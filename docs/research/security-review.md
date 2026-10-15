# Security review — 2026-10-15

| Severity | Findings |
| --- | ---: |
| Critical | 0 |
| High | 0 |
| Medium | 1 |
| Low | 0 |
| Info | 2 |

Scope: first-party TypeScript runtime, tests, development tools, Docker/Compose/Nginx configuration, lockfile and proposed tracked documentation/fixtures. Reviewed HTTP/WebSocket admission through validation, dispatch, evidence worker and operator export, plus world/lease and startup boundaries. This is a static review with targeted runtime checks, not a penetration-test certification.

## Deployment boundaries

**Medium — Public containment gates remain unverified. Confidence: high.** `compose.yaml` supplies process/resource/network restrictions but its evidence volume has no filesystem hard quota and ingress has a network path outside the internal bridge. `deploy/compose.public.yaml` changes the bind based on a trusted operator-supplied report; the application cannot prove that report's claims. Public deployment without measured egress restrictions, quota/load/crash checks and TLS could permit resource exhaustion or unintended network reach following a separate compromise. Default ingress is loopback; public readiness is false. Keep the public deployment gate open and perform the documented host-specific checks before exposure. This finding is a release blocker for public hosting, not for a private source repository/local prototype.

## Intentional simulated access

**Info — Open-control bypasses synthetic authentication. Confidence: high.** `src/gateway/policy.ts` grants access only to fake read handlers. Traced dispatch has no visitor-controlled filesystem, process execution, URL fetch or external integration sink. Fake configuration/token disclosure is intended; do not add real state or provider keys to this world. Token-gated mode is not full upstream pairing.

**Info — Raw evidence is sensitive and unencrypted at rest. Confidence: high.** `src/operator/export.ts` provides conservative metadata by default and explicit base64 payload export. SQLite/volumes can contain visitor credentials or personal data. Restrict operator/volume access and use host disk encryption/retention appropriate to deployment. Never publish raw evidence.

## Dependency, secrets and injection checks

`npm audit --json` reports zero known vulnerabilities across installed production/development dependencies. No container image vulnerability scan was performed. Secret-pattern scan of candidate source/fixtures found no real provider/cloud/GitHub private keys or tokens; reference credentials are fabricated. Git excludes environment files, dependencies, builds, raw artifacts and databases. Fixture provenance and upstream notices are retained.

SQL event values use bound parameters; SQL execution strings are fixed. Public paths do not select host files. Landing HTML is constant with restrictive CSP, no attacker rendering or external script. No eval, child process, dynamic code execution or network-fetch path exists in the sensor. Operator paths and readiness reports are trusted local inputs. Local administrators can replace files or forge readiness; they are outside the remote-visitor trust boundary.

The independent implementation review identified four recording/recovery issues; linked HTTP outcomes, malformed-value capture, aborted prefixes and indexed recovery lookups address them. Regression tests pass. No critical/high patch proposals remain. No patches were applied as part of this security-review pass.
