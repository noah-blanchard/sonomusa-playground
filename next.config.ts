import type { NextConfig } from 'next'

/**
 * Deployment target is Dokploy (self-hosted Docker) — NOT Vercel.
 *
 * `output: 'standalone'` emits `.next/standalone` with a minimal server and
 * only the traced dependencies, which is what the Dockerfile copies. Without
 * it the runtime image has to carry the whole node_modules tree.
 */
const nextConfig: NextConfig = {
  output: 'standalone',

  reactStrictMode: true,

  // Fail the production build on type errors. CONCEPT §36: a malformed project
  // must never reach a deployment.
  //
  // Next 16 removed the built-in lint-during-build hook, so linting is a
  // separate gate — `bun run verify` runs it before `next build`, and CI runs
  // the same sequence.
  typescript: { ignoreBuildErrors: false },

  images: {
    // Project media is authored as .webp; AVIF is emitted where the client
    // supports it. Self-hosted optimization is handled by `sharp`, which is a
    // runtime dependency for exactly this reason.
    formats: ['image/avif', 'image/webp'],
    // Projects live on their own subdomains, so remote posters must be
    // possible later without a code change. Patterns are added deliberately.
    remotePatterns: [],
  },

  // Phosphor ships 9,000+ modules and is not in Next's default-optimized list,
  // so without this the dev server transpiles the whole set on first import.
  // See node_modules/next/dist/docs/01-app/02-guides/package-bundling.md.
  experimental: {
    optimizePackageImports: ['@phosphor-icons/react'],
  },

  // Do not leak the framework version in response headers.
  poweredByHeader: false,
}

export default nextConfig
