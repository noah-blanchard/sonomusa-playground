import type { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react'

/**
 * Tracked uppercase metadata label.
 *
 * The wide tracking carries as much identity as the typeface does — it is what
 * makes a one-word label read as editorial rather than as a form field. Kept as
 * a component rather than a utility class so the tracking and size stay in one
 * place across the whole shell (docs/rules/03-design-system.md).
 */

const TONES = {
  primary: 'text-(--color-text-primary)',
  secondary: 'text-(--color-text-secondary)',
  inherit: '',
} as const

export function Label({
  as: Tag = 'span',
  children,
  className = '',
  tone = 'secondary',
  ...rest
}: {
  as?: ElementType
  children: ReactNode
  className?: string
  /**
   * `inherit` sets no colour at all, so the label takes the colour of whatever
   * contains it. Button needs this: it owns the colour for the whole control,
   * including the icon, and a label that hard-codes its own would fight it.
   */
  tone?: 'primary' | 'secondary' | 'inherit'
} & Omit<ComponentPropsWithoutRef<'span'>, 'children' | 'className'>) {
  const color = TONES[tone]

  return (
    <Tag
      className={`font-mono text-[0.6875rem] uppercase leading-none tracking-(--tracking-label) ${color} ${className}`}
      {...rest}
    >
      {children}
    </Tag>
  )
}
