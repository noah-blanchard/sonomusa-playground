import { z } from 'zod'

/**
 * How a project renders INSIDE its frame.
 *
 * This is deliberately not the same thing as where the visitor can go. Projects
 * live on their own subdomains and the primary action leaves the site, but that
 * is a destination — it belongs to `links.live`, not here. Keeping the two
 * apart is what stops navigation logic from leaking into the preview adapters.
 * See docs/adr/0001-baseline.md §4.
 *
 * Adding a future kind — `webgpu`, `audio`, `canvas`, `remote-stream` — costs
 * one variant here, one renderer, and one entry in the renderer map. Nothing
 * else in the codebase changes. That is the whole point of the union.
 */

/** A file inside the project's own directory, e.g. `poster.webp`. */
const AssetPath = z
  .string()
  .min(1)
  .refine((value) => !value.startsWith('/') && !/^https?:\/\//.test(value), {
    message:
      'Media is referenced by filename relative to the project directory, not by absolute or remote path. This keeps remote hosting possible later without touching manifests.',
  })

export const PreviewSchema = z.discriminatedUnion('kind', [
  /**
   * The poster is the preview. The common case, and the right default — a
   * preview kind is a cost in bytes, failure modes, and attention taken from
   * the work itself.
   */
  z.object({
    kind: z.literal('static'),
    /** Optional override; falls back to `media.poster`. */
    src: AssetPath.optional(),
  }),

  /** A short muted loop, activated on intent rather than on load. */
  z.object({
    kind: z.literal('video'),
    src: AssetPath,
    poster: AssetPath.optional(),
  }),

  /** An embeddable live piece. Sandboxed, and never eagerly mounted. */
  z.object({
    kind: z.literal('iframe'),
    src: z.url(),
    sandbox: z.array(z.string()).default(['allow-scripts', 'allow-same-origin']),
  }),

  /**
   * A preview implemented in this repository. The component itself is resolved
   * through the registry by id — manifests must stay serializable, which is
   * what keeps a CMS possible later (CONCEPT §16).
   */
  z.object({
    kind: z.literal('component'),
    componentId: z.string().min(1),
  }),
])

export type Preview = z.output<typeof PreviewSchema>
export type PreviewKind = Preview['kind']

/** Every kind, for exhaustiveness checks and adapter-map coverage tests. */
export const PREVIEW_KINDS = ['static', 'video', 'iframe', 'component'] as const
