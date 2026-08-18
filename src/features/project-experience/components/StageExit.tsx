'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Button } from '@/components/ui/Button'

/**
 * The ways back out.
 *
 * Two destinations, because "leave the stage" means two different things:
 * *what is this* goes to the project page, and *back to the gallery* goes home
 * with the slug in the query string so the carousel opens on the frame the
 * visitor was just inside — the stage closes and the work is sitting in the
 * middle of the gallery, still active.
 *
 * The links are the real affordance and work with no JavaScript at all; Escape
 * is the enhancement on top, because a full-screen surface that traps you until
 * you find the right corner is a bug (docs/rules/05-experience.md). Escape
 * goes to the gallery — the place the stage was most likely opened from.
 */
export function StageExit({ slug, title }: { slug: string; title: string }) {
  const router = useRouter()

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented) return

      // An experience may well use Escape itself — let it say so by calling
      // preventDefault rather than having the stage steal the key outright.
      router.push(`/?project=${slug}`)
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [router, slug])

  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
      <Button
        variant="ghost"
        tone="secondary"
        href={`/?project=${slug}`}
        icon="arrow-left"
        iconPosition="leading"
        srLabel={`Close ${title} and return to the gallery`}
      >
        Gallery
      </Button>

      <Button
        variant="ghost"
        tone="secondary"
        href={`/projects/${slug}`}
        icon="arrow-right"
        srLabel={`Read more about ${title}`}
      >
        More information
      </Button>
    </div>
  )
}
