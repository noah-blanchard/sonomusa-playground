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

  // Fail the production build on type or lint errors. CONCEPT §36: a malformed
  // project must never reach a deployment.
  typescript: { ignoreBuildErrors: false },
  eslint: { ignoreDuringBuilds: false },

  images: {
    // Project media is authored as .webp; AVIF is emitted where the client
    // supports it. Self-hosted optimization is handled by `sharp`, which is a
    // runtime dependency for exactly this reason.
    formats: ['image/avif', 'image/webp'],
    // Projects live on their own subdomains, so remote posters must be
    // possible later without a code change. Patterns are added deliberately.
    remotePatterns: [],
  },

  // Do not leak the framework version in response headers.
  poweredByHeader: false,
}

export default nextConfig
