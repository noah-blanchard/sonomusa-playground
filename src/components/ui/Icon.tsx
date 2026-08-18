import { ArrowLeftIcon, ArrowRightIcon, ArrowUpRightIcon, XIcon } from '@phosphor-icons/react/ssr'

/**
 * The shell's entire icon vocabulary.
 *
 * Every icon in the product comes through here, for two reasons.
 *
 * The first is drift. Before this existed, six hand-written arrow spans
 * repeated the same eight utility classes, and they had already diverged — two
 * of them had lost `ease-(--ease-standard)`, one was a size larger than the
 * rest. `docs/rules/03-design-system.md` calls that out by name: if two
 * components animate differently for no reason, that is a bug. A shared
 * definition is the only thing that actually prevents it.
 *
 * The second is that Phosphor is named in exactly one file. Swapping icon sets
 * later is this map, not a search across the app — the same reasoning as the
 * repository port and the preview renderer map.
 *
 * Import note: `@phosphor-icons/react/ssr` is mandatory, not a preference. The
 * package's root entry reads `IconContext` through `useContext`, so it cannot
 * render in a Server Component — and five of the seven call sites are Server
 * Components. The `/ssr` build has no hooks and works in both trees. All that
 * is given up is `IconContext` theming, which this codebase does not use.
 * See docs/adr/0002-icon-animation-and-webgl-libraries.md §2.
 */

const ICONS = {
  'arrow-left': ArrowLeftIcon,
  'arrow-right': ArrowRightIcon,
  'arrow-up-right': ArrowUpRightIcon,
  close: XIcon,
} as const

export type IconName = keyof typeof ICONS

/**
 * The hover nudge, defined once.
 *
 * Depends on a `group` ancestor, which every call site already has — the arrow
 * responds to the whole link being hovered, not to the arrow itself, because a
 * 14px target is not a hover affordance.
 */
const NUDGE = {
  none: '',
  forward:
    'transition-transform duration-(--duration-base) ease-(--ease-standard) group-hover:translate-x-1 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0',
  back: 'transition-transform duration-(--duration-base) ease-(--ease-standard) group-hover:-translate-x-1 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0',
} as const

/**
 * Two sizes, deliberately — the same small-vocabulary rule the duration tokens
 * follow. `md` exists only because the carousel controls are the primary
 * navigation affordance and are meant to sit heavier than an inline arrow.
 */
const SIZES = {
  sm: 'text-sm',
  md: 'text-base',
} as const

export function Icon({
  name,
  nudge = 'none',
  size = 'sm',
  className = '',
}: {
  name: IconName
  nudge?: keyof typeof NUDGE
  size?: keyof typeof SIZES
  className?: string
}) {
  const Glyph = ICONS[name]

  return (
    <Glyph
      /*
       * Phosphor's SSR base sets width, height, fill and viewBox and nothing
       * else — no aria-hidden, no focusable. Both are set here rather than at
       * the call sites so no icon can ship announcing itself: the accessible
       * name always comes from adjacent sr-only text or the parent's
       * aria-label. Same contract as src/components/brand/marks.generated.tsx.
       */
      aria-hidden
      focusable="false"
      weight="light"
      /*
       * `1em` against the size class below, so the icon tracks the type it sits
       * beside. `shrink-0` because an <svg> has intrinsic width where the glyph
       * it replaced had none, and these all sit in flex rows that e2e/overflow
       * asserts never widen the document.
       */
      size="1em"
      className={`shrink-0 ${SIZES[size]} ${NUDGE[nudge]} ${className}`}
    />
  )
}
