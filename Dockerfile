FROM node:24.13.0-bookworm-slim@sha256:4660b1ca8b28d6d1906fd644abe34b2ed81d15434d26d845ef0aced307cf4b6f AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts --no-audit --no-fund
COPY tsconfig.json ./
COPY src/ src/
COPY tests/fixtures/ tests/fixtures/
COPY tools/copy-assets.mjs tools/copy-assets.mjs
RUN npm run build
FROM node:24.13.0-bookworm-slim@sha256:4660b1ca8b28d6d1906fd644abe34b2ed81d15434d26d845ef0aced307cf4b6f
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts --no-audit --no-fund && mkdir /data && chown node:node /data
COPY --from=build /app/dist/src/ dist/src/
ENV HANIPOT_BIND=0.0.0.0 NODE_ENV=production
USER node
EXPOSE 18789
CMD ["node","dist/src/cli.js","serve","--data-dir","/data"]
