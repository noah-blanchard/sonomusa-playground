import { Button } from '@/components/ui/Button'
import { Label } from '@/components/ui/Label'

/**
 * The editorial column: eyebrow, display line, standfirst, one way in.
 *
 * Sits at roughly 30% of the composition against the gallery's 70%
 * (CONCEPT §20). Its job is to state what this is in one breath and then get
 * out of the way — the work is the thing being looked at.
 *
 * The display line runs Light at a large size with tight leading. Weight is
 * doing the hierarchy, not size alone, which is what keeps it editorial rather
 * than promotional.
 */
export function PlaygroundIntro({ galleryHref = '#gallery' }: { galleryHref?: string }) {
  return (
    <div className="max-w-xl">
      <div className="flex items-center gap-4">
        <span aria-hidden className="h-px w-8 bg-(--color-line-strong)" />
        <Label>Playground</Label>
      </div>

      <h1 className="mt-8 font-display text-[clamp(2.75rem,7vw,5.25rem)] font-light leading-(--leading-display) tracking-(--tracking-tight) text-balance text-(--color-text-primary)">
        A gallery of coded experiences.
      </h1>

      <p className="mt-8 max-w-sm text-base leading-(--leading-body) text-(--color-text-secondary)">
        Interactive works exploring sound, form and digital perception.
      </p>

      <Button href={galleryHref} icon="arrow-right" size="md" className="mt-10">
        Explore the gallery
      </Button>
    </div>
  )
}
