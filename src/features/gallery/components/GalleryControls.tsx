'use client'

import { Button } from '@/components/ui/Button'

/**
 * Previous / next and the position indicators.
 *
 * These are real buttons with real labels, which is what makes the gallery
 * fully usable without gesture input. The dots are controls too, not
 * decoration — labelled, focusable, and each states whether it is current.
 */
export function GalleryControls({
  items,
  activeIndex,
  onNext,
  onPrevious,
  onGoTo,
}: {
  items: { slug: string; title: string }[]
  activeIndex: number
  onNext: () => void
  onPrevious: () => void
  onGoTo: (index: number) => void
}) {
  if (items.length <= 1) return null

  return (
    <div className="flex items-center justify-center gap-8">
      <ArrowButton direction="previous" onClick={onPrevious} />

      <ul className="flex items-center gap-3">
        {items.map((item, index) => {
          const isActive = index === activeIndex

          return (
            <li key={item.slug}>
              <button
                type="button"
                onClick={() => onGoTo(index)}
                aria-current={isActive ? 'true' : undefined}
                className="stencil-focus flex size-5 items-center justify-center"
              >
                <span className="sr-only">
                  {item.title} — project {index + 1} of {items.length}
                </span>
                <span
                  aria-hidden
                  className={`size-1.5 rounded-full transition-colors duration-(--duration-base) ${
                    isActive ? 'bg-(--color-accent)' : 'bg-(--color-steel)/40'
                  }`}
                />
              </button>
            </li>
          )
        })}
      </ul>

      <ArrowButton direction="next" onClick={onNext} />
    </div>
  )
}

function ArrowButton({
  direction,
  onClick,
}: {
  direction: 'previous' | 'next'
  onClick: () => void
}) {
  const isNext = direction === 'next'

  /*
   * The visible word is hidden below sm, so the accessible name comes from
   * srLabel instead — it reads the same at every width rather than degrading
   * to an unnamed arrow on mobile. Button hides the visible label from
   * assistive tech in turn, so the name is never announced twice.
   */
  return (
    <Button
      variant="ghost"
      size="md"
      tone="secondary"
      onClick={onClick}
      srLabel={isNext ? 'Next project' : 'Previous project'}
      icon={isNext ? 'arrow-right' : 'arrow-left'}
      iconPosition={isNext ? 'trailing' : 'leading'}
      labelClassName="hidden sm:inline"
      className="gap-3"
    >
      {isNext ? 'Next' : 'Previous'}
    </Button>
  )
}
