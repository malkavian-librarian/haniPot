# Third-party notices

JSON schemas under `tests/fixtures/openclaw/schemas/` are derived from OpenClaw commit `77e703c69b07a236c2f0962bd195e03aae1b8da0` (MIT). The upstream notice and license are retained in `tests/fixtures/openclaw/UPSTREAM-LICENSE.txt`; provenance.json records generated artifact hashes.

Sanitised reference outputs originate from an isolated instance of that commit with fabricated data. They describe observed behaviour; they are not runtime gateway handlers. The reference's transitive dependencies remain inside its development-only container and retain their respective licenses.

Runtime dependency and development-tool licenses are recorded by package-lock.json and their package distributions. No upstream agent code is imported into the public emulator.
