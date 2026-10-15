# Historical profile evidence

Reference commit: `77e703c69b07a236c2f0962bd195e03aae1b8da0`; compiled in an isolated Node 22.22.0 reference image. The emulator runtime target remains Node 24.

Live capture verified all eight planned methods, nonempty synthetic main history, wrong-token rejection, protocol-4-only rejection and tick events. Schemas were exported from the built pinned TypeBox objects; hashes and the upstream MIT license accompany fixtures. Raw capture and build logs remain ignored artifacts.

## Source discrepancies and intentional limits

- Live tick policy is **30 seconds**, matching server-constants.ts. The design's earlier 15-second value came from an abbreviated documentation example and has been corrected.
- The live models.list handler emits an `input` field not declared by its own strict ModelsListResult schema. Preserve both source schema and observed output. The foundation emits the strict-schema projection and reports this narrow known difference; tests do not globally relax additionalProperties.
- Live maxPayload/maxBufferedBytes are 524288/1572864 bytes. The emulator uses stricter 262144/1048576 limits and must advertise its actual values.
- The reference build reports version `dev` without Git metadata. The emulator advertises the named historical profile version; no claim of byte-identical full installation is made.
- The reference's complete built-in skill/model catalogues exceed the foundation's curated synthetic subset. Catalogue size/content are named profile limitations; shape and canonical configured records must still agree.
- Open-control bypasses normal authentication deliberately. Token-gated behaviour and device-pairing limitations are reported separately.

## Reference environment

Reference uses only fabricated shop/session data. Heartbeat is disabled to prevent scheduled work replacing the seeded main session. HOME and state live in bounded temporary storage. No provider key is configured and no port is published. Startup is checked through a readiness healthcheck; the reference is development-only and never a public honeypot.
