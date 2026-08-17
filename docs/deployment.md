# Deployment — Dokploy (self-hosted)

Not Vercel. Nothing in the codebase depends on a Vercel-specific API, adapter or header, and it should stay that way.

---

## What the setup assumes

| | |
| --- | --- |
| Build | Docker, from the repository `Dockerfile` |
| Runtime | `node server.js` against Next's standalone output |
| Port | `3000` (`PORT` overrides) |
| Healthcheck | `GET /api/health` |

Three choices in the code exist because of self-hosting, and would be wrong on a managed platform:

- **`output: 'standalone'`** in `next.config.ts`. Next traces only the dependencies actually reached and emits a minimal server, so the runtime image carries a small `node_modules` rather than the whole tree.
- **`sharp` is a runtime dependency**, not a dev one. Image optimization happens inside the container; there is no platform layer providing it.
- **The image builds its own content pipeline output.** `public/projects/` is generated during the build by `bun run media:sync`, and `.dockerignore` excludes any host-built copy so a broken sync fails the build instead of being masked.

## Dokploy configuration

**Application → Docker**

- Build type: `Dockerfile`
- Dockerfile path: `./Dockerfile`
- Port: `3000`

**Build arguments**

```
NEXT_PUBLIC_SITE_URL=https://playground.sonomusa.com
```

This one has to be a *build argument*, not only a runtime variable. `NEXT_PUBLIC_*` values are inlined when the bundle is compiled — setting it only at runtime leaves canonical URLs and Open Graph images relative, which breaks link previews without breaking the page, so it fails quietly.

**Healthcheck**

Path `/api/health`, expecting `200`. It reads the project registry rather than returning a bare `ok`, so a container whose content failed to load reports unhealthy — a TCP check would call it fine while it served an empty gallery.

## Building locally

```bash
docker build -t sonomusa-playground \
  --build-arg NEXT_PUBLIC_SITE_URL=https://playground.sonomusa.com .

docker run --rm -p 3000:3000 sonomusa-playground

curl localhost:3000/api/health
```

## The build fails when content is wrong — on purpose

`bun run validate:content` runs inside the image before `next build`. A manifest missing a poster, a slug that disagrees with its directory, a duplicate `order`, or a `componentId` that resolves to nothing all stop the image from being produced.

This is CONCEPT §36: a malformed project must never reach a deployment. If a build fails on content, the fix is the manifest, never the check.

## Adding a project in production

```bash
# 1. create src/content/projects/<slug>/ with project.ts and poster.webp
bun run validate:content
git commit && git push
```

Dokploy rebuilds, and the project appears in the gallery, the index, its own route and the sitemap metadata. No configuration is touched, because there is no configuration to touch — the manifest is the only source (invariant I2).

## Notes

- **The build needs network access** for `next/font/google`, which downloads Jost, Inter Tight and Geist Mono at build time and self-hosts them in the output. The running container makes no external font requests.
- **`.next/standalone` does not include `public/`**, which is why the Dockerfile copies it explicitly. Forget that and every project poster 404s while the pages still render.
- **The container runs as a non-root user** (`nextjs`, uid 1001).
