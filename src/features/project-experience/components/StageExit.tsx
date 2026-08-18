'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Button } from '@/components/ui/Button'

/**
 * The way back out.
 *
 * The link is the real affordance and works with no JavaScript at all; Escape
 * is the enhancement on top, because a full-screen surface that traps you until
 * you find the right corner is a bug (docs/rules/05-experience.md).
 *
 * It goes to the project page rather than back through history: arriving here
 * from a shared URL is as likely as arriving from the gallery, and `history.back`
 * would strand that visitor.
 */
export function StageExit({ slug, title }: { slug: string; title: string }) {
  const router = useRouter()

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented) return

      // An experience may well use Escape itself — let it say so by calling
      // preventDefault rather than having the stage steal the key outright.
      router.push(`/projects/${slug}`)
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [router, slug])

  return (
    <Button
      variant="ghost"
      tone="secondary"
      href={`/projects/${slug}`}
      icon="arrow-left"
      iconPosition="leading"
      srLabel={`Leave ${title} and return to its project page`}
    >
      Back
    </Button>
  )
}
