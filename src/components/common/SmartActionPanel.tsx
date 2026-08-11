import { AnimatePresence, m, useReducedMotion } from 'motion/react'
import { ArrowRight, BookOpenCheck, CalendarClock, Scale, Sparkles, TrendingDown, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { smartNextActions, type Recommendation } from '@/lib/intelligence'
import { MOTION_TRANSITION } from '@/lib/motion'
import { useStore } from '@/store/store'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export function SmartActionPanel({
  title = 'Smart next actions',
  className,
  recommendations: suppliedRecommendations,
}: {
  title?: string
  className?: string
  recommendations?: Recommendation[]
}) {
  const state = useStore()
  const accept = useStore((store) => store.acceptRecommendation)
  const dismiss = useStore((store) => store.dismissRecommendation)
  const reduceMotion = useReducedMotion()
  const recommendations = suppliedRecommendations ?? smartNextActions(state)
  // Supplied recommendations (for example, the Academics heads-up panel) are
  // derived by their parent. Filter here too so a persisted dismissal removes
  // the card immediately, just as it does on the Overview panel.
  const visibleRecommendations = recommendations.filter(
    (recommendation) => !state.settings.recommendationState[recommendation.id]
  )

  function dismissAll() {
    visibleRecommendations.forEach((recommendation) => dismiss(recommendation))
  }

  return (
    <AnimatePresence initial={false}>
      {!!visibleRecommendations.length && (
        <m.section
          aria-labelledby="smart-actions-heading"
          layout={!reduceMotion}
          initial={reduceMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, height: 0, marginBottom: 0 }}
          transition={reduceMotion ? MOTION_TRANSITION.instant : MOTION_TRANSITION.standard}
          className={className}
        >
          <Card>
        <CardHeader className="flex-row items-center justify-between gap-3">
          <div>
            <CardTitle id="smart-actions-heading" className="flex items-center gap-2 text-lg">
              <Sparkles className="size-5 text-primary" aria-hidden="true" />
              {title}
            </CardTitle>
            <p className="mt-1 text-xs font-semibold text-muted-foreground">
              Deterministic suggestions, each with the reason it appeared.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            {visibleRecommendations.length > 1 && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-8 px-2 text-muted-foreground hover:text-foreground"
                onClick={dismissAll}
                aria-label={`Dismiss all ${visibleRecommendations.length} recommendations`}
              >
                <X className="size-3.5" />
                Dismiss all
              </Button>
            )}
            <Badge variant="outline">{visibleRecommendations.length} ready</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className={cn(
            'grid gap-3',
            visibleRecommendations.length === 2 && 'md:grid-cols-2',
            visibleRecommendations.length >= 3 && 'lg:grid-cols-3',
          )}>
            <AnimatePresence initial={false}>
              {visibleRecommendations.map((recommendation) => (
                <m.article
                  key={recommendation.id}
                  layout={!reduceMotion}
                  initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduceMotion ? { opacity: 0 } : { opacity: 0, height: 0, y: -8 }}
                  transition={reduceMotion ? MOTION_TRANSITION.instant : MOTION_TRANSITION.standard}
                  className="flex min-h-40 flex-col rounded-2xl border border-border bg-muted/35 p-4 shadow-inner"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary">
                      <RecommendationIcon ruleId={recommendation.ruleId} />
                    </span>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="size-8"
                      aria-label={`Dismiss ${recommendation.title}`}
                      onClick={() => dismiss(recommendation)}
                    >
                      <X className="size-4" />
                    </Button>
                  </div>
                  <h3 className="mt-3 font-display text-base font-bold leading-tight">{recommendation.title}</h3>
                  <RecommendationWhy recommendation={recommendation} />
                  <Button asChild size="sm" className="mt-4 self-start">
                    <Link to={recommendation.route} onClick={() => accept(recommendation.id)}>
                      {recommendation.actionLabel}
                      <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                </m.article>
              ))}
            </AnimatePresence>
          </div>
        </CardContent>
          </Card>
        </m.section>
      )}
    </AnimatePresence>
  )
}

function RecommendationIcon({ ruleId }: { ruleId: string }) {
  if (ruleId.includes('gpa')) return <TrendingDown className="size-4" aria-hidden="true" />
  if (ruleId.includes('prereq') || ruleId.includes('bcpm-heavy')) return <CalendarClock className="size-4" aria-hidden="true" />
  if (ruleId.includes('syllabus') || ruleId.includes('reviewed')) return <BookOpenCheck className="size-4" aria-hidden="true" />
  return <Scale className="size-4" aria-hidden="true" />
}

function RecommendationWhy({ recommendation }: { recommendation: Recommendation }) {
  if (!recommendation.cause || !recommendation.why.includes(recommendation.cause)) {
    return <p className="mt-2 flex-1 text-xs font-semibold leading-relaxed text-muted-foreground">{recommendation.why}</p>
  }
  const [before, after] = recommendation.why.split(recommendation.cause)
  return (
    <p className="mt-2 flex-1 text-xs font-semibold leading-relaxed text-muted-foreground">
      {before}<strong className="text-foreground">{recommendation.cause}</strong>{after}
    </p>
  )
}
