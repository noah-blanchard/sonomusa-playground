/**
 * A hairline with one deliberate break — the logo's interruption applied to a
 * divider. See src/styles/stencil.css.
 *
 * Presentational, so it is hidden from assistive technology; the headings
 * around it already communicate the structure.
 */
export function StencilRule({
  className = '',
  variant = 'default',
  strong = false,
}: {
  className?: string
  /** Where the break falls. `late` suits rules sitting under a heading. */
  variant?: 'default' | 'late'
  strong?: boolean
}) {
  const classes = [
    'stencil-rule',
    variant === 'late' && 'stencil-rule-late',
    strong && 'stencil-rule-strong',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return <div role="presentation" className={classes} />
}
