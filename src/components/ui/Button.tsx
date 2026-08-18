import Link from 'next/link'
import type { ComponentPropsWithoutRef, ComponentPropsWithRef, ReactNode } from 'react'
import { Icon, type IconName } from '@/components/ui/Icon'
import { Label } from '@/components/ui/Label'

/**
 * Every deliberate action in the shell.
 *
 * The reason this is one component rather than five is that in this design
 * system a control's appearance does not depend on whether it navigates or
 * acts. "View project" and "Next" are the same object wearing different verbs.
 * Splitting them by element would have duplicated the padding, the focus ring,
 * the label typography and the arrow nudge across two trees that then drift —
 * which is exactly what happened to the arrows before `Icon` existed.
 *
 * It renders whichever element the props actually imply:
 *
 *   no `href`            → <button type="button">
 *   internal `href`      → next/link, so it prefetches
 *   http(s) `href`       → <a target="_blank">, plus the new-tab warning
 *   mailto:/tel: `href`  → <a>, no target, no warning
 *
 * That last distinction is the point of doing it here. The footer's GitHub
 * link used to open a new tab with no visible marker and nothing for a screen
 * reader, because remembering three things at every call site does not scale.
 * Now `external` implies all three and cannot be half-applied.
 */

type Variant = 'link' | 'ghost' | 'outline' | 'solid' | 'icon'
type Size = 'sm' | 'md'
type Tone = 'primary' | 'secondary'

const BASE = 'stencil-focus group inline-flex items-center'

const VARIANTS: Record<Variant, string> = {
  /** The editorial default: a tracked label on a retracting stencil underline. */
  link: 'gap-4',
  /** Navigation and secondary controls — no underline, colour carries the state. */
  ghost: 'gap-2 transition-colors duration-(--duration-fast) hover:text-(--color-text-primary)',
  /** A control that needs to read as a target. The frame is the stencil's, corners open. */
  outline:
    'stencil-frame stencil-frame-tight justify-center gap-3 transition-colors duration-(--duration-base) hover:bg-(--color-surface-well)',
  /** The loudest thing available, and still only bone on obsidian. Use sparingly. */
  solid:
    'justify-center gap-3 bg-(--color-text-primary) text-(--color-text-inverted) transition-opacity duration-(--duration-fast) hover:opacity-85',
  /** Icon alone. Needs `srLabel`; there is no visible text to name it. */
  icon: 'justify-center transition-colors duration-(--duration-fast) hover:text-(--color-text-primary)',
}

/**
 * Negative margin on `icon` so the hit target grows past the glyph without
 * pushing its neighbours around — a 14px close button is not a touch target.
 */
const PADDING: Record<Variant, Record<Size, string>> = {
  link: { sm: 'py-1', md: 'py-2' },
  ghost: { sm: 'py-1', md: 'py-2' },
  outline: { sm: 'px-5 py-3', md: 'px-7 py-4' },
  solid: { sm: 'px-5 py-3', md: 'px-7 py-4' },
  icon: { sm: '-m-2 p-2', md: '-m-2.5 p-2.5' },
}

const TONES: Record<Tone, string> = {
  primary: 'text-(--color-text-primary)',
  secondary: 'text-(--color-text-secondary)',
}

/** `solid` paints its own foreground; anything else would fight it. */
const OWNS_ITS_COLOUR: Variant[] = ['solid']

/** A boxed control should not have its icon slide out of the box on hover. */
const NUDGES: Variant[] = ['link', 'ghost']

export type ButtonProps = {
  variant?: Variant
  size?: Size
  tone?: Tone
  /** Rendered at `iconPosition`, inheriting the control's colour. */
  icon?: IconName
  iconPosition?: 'leading' | 'trailing'
  /** An extra mark before the label — the INFO trigger's accent dot, for one. */
  leading?: ReactNode
  /**
   * Replaces the accessible name and hides the visible label from assistive
   * tech. For controls whose visible text is too terse to stand alone: six
   * "View project" links on one page should each announce their own project.
   */
  srLabel?: string
  /**
   * For the label alone, not the control. Exists because the carousel's
   * prev/next hide their text below `sm` and keep the arrow — the accessible
   * name comes from `srLabel`, so nothing is lost when the word goes.
   */
  labelClassName?: string
  href?: string
  /**
   * Defaults to true for http(s) hrefs. Forces the new-tab treatment, the
   * `arrow-up-right` icon and the screen-reader warning together.
   */
  external?: boolean
  children?: ReactNode
  className?: string
  /*
   * WithRef, not WithoutRef: React 19 passes `ref` as an ordinary prop, so it
   * rides along in `...rest` and reaches the element with no forwardRef. The
   * INFO trigger needs it to take focus back when its dialog closes.
   */
} & Omit<ComponentPropsWithRef<'button'>, 'children' | 'className'>

export function Button({
  variant = 'link',
  size = 'sm',
  tone = 'primary',
  icon,
  iconPosition = 'trailing',
  leading,
  srLabel,
  labelClassName = '',
  href,
  external,
  children,
  className = '',
  ...rest
}: ButtonProps) {
  const opensNewTab = external ?? Boolean(href?.startsWith('http'))
  const resolvedIcon = icon ?? (opensNewTab ? 'arrow-up-right' : undefined)

  const colour = OWNS_ITS_COLOUR.includes(variant) ? '' : TONES[tone]
  const classes = `${BASE} ${VARIANTS[variant]} ${PADDING[variant][size]} ${colour} ${className}`

  const nudge = NUDGES.includes(variant)
    ? iconPosition === 'leading'
      ? ('back' as const)
      : ('forward' as const)
    : ('none' as const)

  const glyph = resolvedIcon ? (
    <Icon name={resolvedIcon} nudge={nudge} size={size} />
  ) : null

  const content = (
    <>
      {srLabel && <span className="sr-only">{srLabel}</span>}
      {iconPosition === 'leading' && glyph}
      {leading}
      {children != null && (
        <Label
          // The visible text is redundant once srLabel has named the control;
          // announcing both reads the label twice.
          aria-hidden={srLabel ? true : undefined}
          tone="inherit"
          className={`${variant === 'link' ? 'stencil-underline pb-2' : ''} ${labelClassName}`}
        >
          {children}
        </Label>
      )}
      {iconPosition === 'trailing' && glyph}
      {/* Paired with target="_blank" below — never one without the other. */}
      {opensNewTab && <span className="sr-only">(opens in a new tab)</span>}
    </>
  )

  if (href === undefined) {
    return (
      <button type="button" className={classes} {...rest}>
        {content}
      </button>
    )
  }

  const anchorProps = rest as ComponentPropsWithoutRef<'a'>

  if (opensNewTab || /^(mailto:|tel:)/.test(href)) {
    return (
      <a
        href={href}
        {...(opensNewTab && { target: '_blank', rel: 'noreferrer noopener' })}
        className={classes}
        {...anchorProps}
      >
        {content}
      </a>
    )
  }

  return (
    <Link href={href} className={classes} {...anchorProps}>
      {content}
    </Link>
  )
}
