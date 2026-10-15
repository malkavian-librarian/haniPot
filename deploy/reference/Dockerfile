FROM oven/bun:1.3.0@sha256:00cccad6e9c66bbacc250851f689168606aaea551ac473e908bbcf00a5645025 AS bun
FROM node:22.22.0-bookworm@sha256:20a424ecd1d2064a44e12fe287bf3dae443aab31dc5e0c0cb6c74bef9c78911c
COPY --from=bun /usr/local/bin/bun /usr/local/bin/bun
RUN corepack enable
WORKDIR /app
COPY artifacts/reference/openclaw-77e703c69b07a236c2f0962bd195e03aae1b8da0/ .
RUN pnpm install --frozen-lockfile
RUN OPENCLAW_A2UI_SKIP_MISSING=1 pnpm build
RUN OPENCLAW_PREFER_PNPM=1 pnpm ui:build
COPY deploy/reference/start.mjs tools/capture-reference.mjs tools/derive-profile.mjs /reference/
COPY tests/fixtures/reference-dataset.json /reference/dataset.json
RUN mkdir /captures && chown node:node /captures
ENV OPENCLAW_STATE_DIR=/state HOME=/state NODE_ENV=production
USER node
CMD ["node", "/reference/start.mjs"]
