# Frontend

## Current status

A static discovery page is implemented at GET/HEAD `/`, with no scripts or external assets. Other paths return 404. The upstream UI built in the isolated reference image is only a compatibility reference.

## Foundation surface

The current public surface is a small self-contained landing page with the historical OpenClaw title and custom-element discovery marker. It is not the full upstream Control UI. Scanner recognition, protocol-subset fidelity and visual realism must be reported separately.

Do not expose operator evidence, deployment secrets or a genuine administration panel through this page. Use no external assets, analytics, remote scripts or live integrations. Render any synthetic data as escaped text. Never render captured attacker HTML or terminal escape sequences as active content.

Grafana and analyst interfaces are later private modules. The first foundation uses local operator tooling for evidence access.

See the [discovery plan](superpowers/plans/2026-10-15-openclaw-gateway-foundation.md) for title/Nuclei negative controls and browser comparison requirements.
