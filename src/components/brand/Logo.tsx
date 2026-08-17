import { SonoMusaMonogram, SonoMusaStacked, SonoMusaWordmark } from './marks.generated'

/**
 * The SonoMusa mark.
 *
 * Three lockups, chosen by available space rather than by preference:
 * `wordmark` horizontally, `stacked` in square-ish space, `monogram` where
 * there is almost none.
 *
 * The mark is never re-typeset — it is an asset, and its interrupted
 * letterforms are the identity (docs/rules/03-design-system.md). Height is set
 * by the caller and the width follows the aspect ratio.
 */
export function Logo({
  lockup = 'wordmark',
  title,
  className = '',
}: {
  lockup?: 'wordmark' | 'stacked' | 'monogram'
  /** Accessible name. Omit when adjacent text already names the site. */
  title?: string
  className?: string
}) {
  const Mark =
    lockup === 'stacked' ? SonoMusaStacked : lockup === 'monogram' ? SonoMusaMonogram : SonoMusaWordmark

  return <Mark {...(title && { title })} className={`w-auto ${className}`} />
}
