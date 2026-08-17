import type { MetadataRoute } from 'next'
import { siteOrigin } from '@/env'

/**
 * Everything is public and everything should be indexed — the gallery exists to
 * be found. The one exclusion is the health endpoint, which is infrastructure
 * rather than content and has no business in a search result.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: '/api/',
    },
    sitemap: `${siteOrigin}/sitemap.xml`,
  }
}
