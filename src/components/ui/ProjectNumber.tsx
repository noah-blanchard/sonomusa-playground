import { formatProjectNumber } from '@/domain/project'

/**
 * Zero-padded project number — `001`.
 *
 * Derived from position rather than stored on the project, so it can never
 * disagree with the order actually rendered. Tabular figures keep the digits
 * aligned when numbers stack in the index.
 *
 * Decorative: the project title beside it is the real accessible name, so
 * announcing "zero zero one" to a screen reader adds nothing.
 */
export function ProjectNumber({
  index,
  className = '',
  tone = 'secondary',
}: {
  index: number
  className?: string
  tone?: 'primary' | 'secondary'
}) {
  const color = tone === 'primary' ? 'text-(--color-text-primary)' : 'text-(--color-text-secondary)'

  return (
    <span
      aria-hidden
      className={`font-mono text-[0.6875rem] leading-none tracking-(--tracking-wide) tabular-nums ${color} ${className}`}
    >
      {formatProjectNumber(index)}
    </span>
  )
}
