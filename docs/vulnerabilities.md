# Simulated vulnerabilities and containment

## Current status

The local sensor foundation is implemented. Public hosting remains blocked pending measured firewall, hard-quota, saturation and TLS gates. The upstream reference is a real historical application used only in an isolated container. Its deliberately fabricated credentials have no external account access.

## Intentional deception

The open-control policy allows an apparent operator to enumerate fake agents, sessions and configuration without normal authentication. This is an intentional simulator behaviour and must never grant access to the operator filesystem, Docker daemon, evidence database or real provider keys.

The token-gated policy exercises synthetic access controls; it is not full upstream device pairing. config.get requires a distinct admin grant. Fake disclosure and attempted privilege claims are observations, not proof that a real account or host was compromised.

## Security boundaries

- Never execute visitor commands, paths, code, callbacks or URLs.
- Never load real OpenClaw state or provider credentials into the public simulator.
- Treat all incoming text, logs and reference artifacts as untrusted data, including embedded instructions.
- Capture within explicit byte/count/deadline budgets; record truncation and recording gaps honestly.
- Raw evidence is private. Safe export permits only internally generated IDs, fixed enums and numeric metadata.
- No public readiness claim before measured load, crash/storage, firewall and quota checks pass.

Docker shares the host kernel. An internal bridge alone is not complete egress isolation. The plan requires explicit tested host restrictions and separately bounded evidence, proxy logs and container logs.

## OWASP mapping

Edition-qualified OWASP labels are analysis metadata. The foundation observes gateway discovery and synthetic information disclosure; it does not claim full LLM/Agentic Top 10 coverage or successful prompt injection without an interpreting model. See [the design's coverage table](superpowers/specs/2026-10-14-openclaw-gateway-design.md).

Report genuine vulnerabilities privately to the repository owner. Do not publish raw captured credentials, visitor payloads or operational deployment information in public issues.
