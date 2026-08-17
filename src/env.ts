import { z } from 'zod'

/**
 * Validated environment. CONCEPT §5.2: nothing in the codebase reads
 * `process.env` directly — everything comes through here, already parsed.
 *
 * This module is imported for its side effect at startup, so a missing or
 * malformed variable fails immediately with a readable message rather than
 * surfacing as `undefined` somewhere deep in a request months later.
 */

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

  /**
   * Canonical origin, used for absolute URLs in metadata and Open Graph tags.
   * Optional in development, where relative URLs are fine; set it in Dokploy
   * so production emits real canonical links.
   */
  NEXT_PUBLIC_SITE_URL: z
    .string()
    .url('NEXT_PUBLIC_SITE_URL must be a full origin, e.g. https://playground.sonomusa.com')
    .optional(),
})

/**
 * `NEXT_PUBLIC_*` values are inlined at build time, so they must be read as
 * literal property accesses rather than gathered dynamically from process.env.
 */
const parsed = EnvSchema.safeParse({
  NODE_ENV: process.env.NODE_ENV,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
})

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((issue) => `  • ${issue.path.join('.') || '(root)'}: ${issue.message}`)
    .join('\n')

  throw new Error(`Invalid environment configuration:\n${issues}`)
}

export const env = parsed.data

export type Env = typeof env

/**
 * The canonical origin, with the development fallback applied once.
 *
 * `sitemap.ts` and `robots.ts` need absolute URLs and cannot express "unset",
 * so something has to decide what an unconfigured origin means. Deciding it
 * here keeps that answer in one place rather than repeating a `?? localhost`
 * in every consumer — and it is the same value Next already falls back to for
 * `metadataBase`, so setting it explicitly changes nothing except that the
 * build stops warning about it.
 *
 * Set NEXT_PUBLIC_SITE_URL in Dokploy and production emits real canonical URLs.
 */
export const siteOrigin = env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
