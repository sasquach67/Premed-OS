import { BookOpenCheck, Pin } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import { useStore } from '@/store/store'

/** Temporary ownership bridge, ruled by Andy Aug 2026.
 *
 * `advisingQs` ultimately belongs on Letters' LT-27 mentor records as
 * person-scoped questions, flowing through LT-30's existing office-hours loop.
 * `tips` ultimately belongs in Help as sourced Category B guidance.
 * Both destination surfaces are undrawn, so Overview hosts the existing
 * collections unchanged until those tabs are built. Do not merge or delete
 * either collection when this component is split into its final owners. */
export function TemporaryAdvisingGuidance() {
  const advisingQs = useStore((state) => state.advisingQs)
  const patchItem = useStore((state) => state.patchItem)
  const guidance = useStore((state) => state.tips).filter((tip) => tip.tag === 'andy')

  return (
    <section className="grid gap-4 lg:grid-cols-3" aria-label="Advising questions and sourced guidance">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpenCheck className="size-4 text-primary" aria-hidden="true" />
            Questions for advisors
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          {!advisingQs.length && <p className="text-sm text-muted-foreground">No advisor questions saved.</p>}
          {advisingQs.map((question) => (
            <label key={question.id} className="flex cursor-pointer items-start gap-2.5 rounded-lg px-1 py-1.5 transition-colors hover:bg-muted/40">
              <Checkbox
                checked={question.answered}
                onCheckedChange={(checked) => patchItem('advisingQs', question.id, { answered: Boolean(checked) })}
                className="mt-0.5"
              />
              <span className={cn('text-sm', question.answered && 'text-muted-foreground line-through')}>
                {question.question}
              </span>
            </label>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Pin className="size-4 text-destructive" aria-hidden="true" />
            Sourced guidance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {!guidance.length && <p className="text-sm text-muted-foreground">No saved guidance.</p>}
          {guidance.map((tip) => (
            <div key={tip.id} className="rounded-lg border border-border bg-muted p-2.5">
              <p className="text-xs font-semibold leading-relaxed">{tip.text}</p>
              <p className="mt-1 text-[11px] text-muted-foreground">Source: {tip.source || 'Not recorded'}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </section>
  )
}
