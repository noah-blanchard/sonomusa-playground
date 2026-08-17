import type { ElementType, ReactNode } from 'react'

/**
 * Tracked uppercase metadata label.
 *
 * The wide tracking carries as much identity as the typeface does — it is what
 * makes a one-word label read as editorial rather than as a form field. Kept as
 * a component rather than a utility class so the tracking and size stay in one
 * place across the whole shell (docs/rules/03-design-system.md).
 */
export function Label({
  as: Tag = 'span',
  children,
  className = '',
  tone = 'secondary',
}: {
  as?: ElementType
  children: ReactNode
  className?: string
  tone?: 'primary' | 'secondary'
}) {
  const color = tone === 'primary' ? 'text-(--color-text-primary)' : 'text-(--color-text-secondary)'

  return (
    <Tag
      className={`font-mono text-[0.6875rem] uppercase leading-none tracking-(--tracking-label) ${color} ${className}`}
    >
      {children}
    </Tag>
  )
}
