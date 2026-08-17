# syntax=docker/dockerfile:1

# SonoMusa Playground — self-hosted image for Dokploy.
#
# Multi-stage: Bun installs and builds, then a slim Node runtime serves the
# standalone output. Bun is the project's package manager and script runner
# (the content pipeline is written in TypeScript and executed by bun), but the
# server itself runs on Node because that is what `next start` and the
# standalone server target.

# ── deps ──────────────────────────────────────────────────────────────────
FROM oven/bun:1.3.13-alpine AS deps
WORKDIR /app

# Copied alone so this layer is only rebuilt when dependencies actually change.
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# ── build ─────────────────────────────────────────────────────────────────
FROM oven/bun:1.3.13-alpine AS build
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# NEXT_PUBLIC_* values are inlined at build time, so the canonical origin has
# to be present here rather than only at runtime. Set it in Dokploy's build
# arguments; without it, metadata falls back to relative URLs.
ARG NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Regenerates the registry, syncs project media into public/, then builds.
# Content validation runs first so a malformed manifest fails the image build
# rather than reaching a deployment (CONCEPT §36).
RUN bun run validate:content && bun run build

# ── runtime ───────────────────────────────────────────────────────────────
FROM node:24-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Never run the server as root.
RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 --ingroup nodejs nextjs

# `output: 'standalone'` traces only the dependencies actually reached, so the
# runtime image carries a minimal node_modules instead of the whole tree.
COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/.next/static ./.next/static
# public/ holds the synced project media, which the standalone trace excludes.
COPY --from=build --chown=nextjs:nodejs /app/public ./public

USER nextjs

EXPOSE 3000

# Dokploy polls this; it hits the app's own route rather than a TCP check, so a
# process that is up but failing to render still reports unhealthy.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
