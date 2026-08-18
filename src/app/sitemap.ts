import type { MetadataRoute } from 'next'
import { projectRepository, selectHosted } from '@/domain/project'
import { siteOrigin } from '@/env'

/**
 * The sitemap is derived, never maintained.
 *
 * This is invariant I2 — the manifest is the only source of truth — applied to
 * SEO. A hand-written list of URLs is the same failure as a hand-written
 * gallery array: it is correct on the day it is written and silently wrong
 * afterwards. Adding a project directory is all it takes to appear here.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const projects = await projectRepository.getAll()

  /*
   * No `lastModified`. The contract carries no modification date, so the only
   * thing available is build time — which changes on every deploy whether or
   * not the page did, and tells a crawler something untrue. An absent field is
   * better than a wrong one. If it becomes worth having, it belongs in the
   * schema as a real field rather than inferred here.
   */
  return [
    { url: siteOrigin, priority: 1 },
    { url: `${siteOrigin}/projects`, priority: 0.8 },
    ...projects.map((project) => ({
      url: `${siteOrigin}/projects/${project.slug}`,
      priority: 0.6,
    })),
    /*
     * The stage exists only for projects that declare an experience, so the
     * list is derived from the same selector the route's generateStaticParams
     * uses. Deriving both from one place is why adding a project cannot leave
     * the sitemap behind.
     */
    ...selectHosted(projects).map((project) => ({
      url: `${siteOrigin}/projects/${project.slug}/play`,
      priority: 0.7,
    })),
  ]
}
