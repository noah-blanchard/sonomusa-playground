import { z } from 'zod'
import { PreviewSchema } from './preview'

/**
 * Project contract, version 1.
 *
 * This schema is CANONICAL. The TypeScript type is inferred from it and is
 * never hand-written alongside it — two definitions of the same shape always
 * drift, and the runtime one is the one that actually holds (CONCEPT §10).
 *
 * Evolving it: adding an optional field needs no version bump. Adding a
 * required field, removing one, or changing a meaning does — bump the version,
 * add a migration, and keep this schema so existing manifests still parse.
 */

/**
 * Slugs are permanent: they are the route, and renaming one breaks every link
 * that ever pointed at it. Enforcing the shape here means it is also a valid
 * directory name and a valid generated identifier.
 */
export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export const ProjectStatusSchema = z.enum(['live', 'prototype', 'wip', 'archive'])
export type ProjectStatus = z.output<typeof ProjectStatusSchema>

export const CreditSchema = z.object({
  label: z.string().min(1),
  value: z.string().min(1),
  url: z.url().optional(),
})

/** A file inside the project's own directory. */
const AssetPath = z
  .string()
  .min(1)
  .refine((value) => !value.startsWith('/') && !/^https?:\/\//.test(value), {
    message:
      'Media is referenced by filename relative to the project directory, not by absolute or remote path.',
  })

export const MediaSchema = z.object({
  /**
   * Required, and it must exist on disk — validate:content checks.
   *
   * The poster is the floor the entire resilience story rests on: the gallery
   * must never depend on live rendering to communicate that a project exists
   * (CONCEPT §19).
   */
  poster: AssetPath,
  /** Index strip image. Falls back to the poster when absent. */
  thumbnail: AssetPath.optional(),
  screenshots: z.array(AssetPath).default([]),
})

export const LinksSchema = z.object({
  /**
   * The project's own subdomain. OPTIONAL, and absence is meaningful — not
   * every project has shipped one. When it is missing the frame offers no
   * destination and `status` carries the meaning. A dead call to action is
   * worse than none.
   */
  live: z.url().optional(),
  source: z.url().optional(),
  repository: z.url().optional(),
})

export const PresentationSchema = z.object({
  /** e.g. `16 / 9`. A hint to the frame, never a licence to restyle the shell. */
  preferredAspectRatio: z
    .string()
    .regex(/^\d+(\.\d+)?\s*\/\s*\d+(\.\d+)?$/, 'Use a CSS ratio such as "16 / 9".')
    .optional(),
  /** Normalized 0–1 crop focus, so posters crop sensibly at any frame shape. */
  focalPoint: z
    .object({
      x: z.number().min(0).max(1),
      y: z.number().min(0).max(1),
    })
    .optional(),
  /**
   * The project's own colour, in the project's own hands.
   *
   * Used for its artwork and for the ambient field that marks it as active —
   * never for shell chrome. The shell stays bone on obsidian and `--color-accent`
   * stays colourless; this is the one channel through which a project's identity
   * reaches the frame, which is what CONCEPT §2.2 means by projects owning their
   * colour. Absent is valid: the art falls back to bone and the field to the line
   * colour.
   */
  accent: z
    .string()
    .regex(/^#[0-9a-f]{6}$/i, 'Use a six-digit hex such as "#2FD3C0".')
    .optional(),
})

export const ProjectSchemaV1 = z.object({
  schemaVersion: z.literal(1),

  slug: z
    .string()
    .min(1)
    .regex(
      SLUG_PATTERN,
      'Slugs must be lowercase kebab-case — they are the route and the directory name.',
    ),
  title: z.string().min(1),

  year: z.number().int().min(1970).max(2200).optional(),
  shortDescription: z.string().max(120).optional(),
  description: z.string().optional(),

  status: ProjectStatusSchema,

  tags: z.array(z.string().min(1)).default([]),
  categories: z.array(z.string().min(1)).default([]),

  featured: z.boolean().default(false),
  /** Gallery sequence. Must be unique across projects — validate:content checks. */
  order: z.number().int().nonnegative().optional(),

  media: MediaSchema,
  preview: PreviewSchema,
  links: LinksSchema.default({}),

  technologies: z.array(z.string().min(1)).default([]),
  credits: z.array(CreditSchema).default([]),
  presentation: PresentationSchema.optional(),
})

/** What an author writes — defaults still optional. */
export type ProjectInputV1 = z.input<typeof ProjectSchemaV1>
/** What consumers receive — every default applied, no undefined arrays. */
export type ProjectV1 = z.output<typeof ProjectSchemaV1>
