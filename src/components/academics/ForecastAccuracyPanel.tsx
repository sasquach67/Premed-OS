import { ArrowLeft, ChevronDown, Eye, Info } from 'lucide-react'
import type { RetrievabilityPrediction } from '@/lib/types'
import { summarizeForecastAccuracy, type ForecastVerdict } from '@/lib/academics/forecastAccuracy'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Collapsible } from '@/components/common/Collapsible'
import { cn } from '@/lib/utils'

function verdictCopy(verdict: ForecastVerdict | null) {
  if (verdict === 'holding-up') return 'Holding up'
  if (verdict === 'runs-optimistic') return 'Runs optimistic'
  if (verdict === 'runs-pessimistic') return 'Runs pessimistic'
  return 'Still gathering calls'
}

function outcomeCopy(outcome: RetrievabilityPrediction['outcome']) {
  return outcome === 'recalled' ? 'You recalled it' : 'You blanked'
}

/**
 * A contextual Archive document. The system shows only its own dated calls and
 * the student’s later self-rated recall outcome; it does not make a readiness
 * claim or retrofit predictions onto historic review events.
 */
export function ForecastAccuracyPanel({ predictions, onBack }: { predictions: RetrievabilityPrediction[]; onBack: () => void }) {
  const reading = summarizeForecastAccuracy(predictions)

  return <section className="mx-auto max-w-[720px] space-y-4" aria-label="Forecast accuracy">
    <Button size="sm" variant="ghost" className="-ml-2" onClick={onBack}><ArrowLeft className="size-4" /> Grades ledger</Button>
    <Card className="border-primary/30 shadow-[0_10px_26px_-14px_rgba(0,0,0,.55)]">
      <CardHeader className="border-b border-[var(--border)] pb-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[.1em] text-primary">Study record</p>
            <CardTitle className="mt-1 text-xl">Forecast accuracy</CardTitle>
            <p className="mt-1 max-w-[590px] text-sm font-semibold text-muted-foreground">A record of what the review scheduler expected before you rated each recall attempt. It is not a grade, score, or readiness claim.</p>
          </div>
          <Badge variant="outline" className="bg-[var(--muted)]">FSRS v1</Badge>
        </div>
      </CardHeader>
      <CardContent className="p-5">
        {!reading.ready ? <div className="rounded-[13px] border border-dashed border-[var(--border)] bg-[var(--muted)] p-4">
          <div className="flex gap-3"><Info className="mt-0.5 size-4 shrink-0 text-primary" /><div><p className="font-display text-sm font-extrabold">Not enough resolved calls yet</p><p className="mt-1 text-sm font-semibold text-muted-foreground">Forecast accuracy appears after {reading.remainingUntilGate} more resolved recall call{reading.remainingUntilGate === 1 ? '' : 's'}. Old review history is left alone because the system did not make a prediction before those attempts.</p></div></div>
        </div> : <div className="space-y-3">
          <div className="rounded-[13px] border border-[var(--border)] bg-[var(--muted)] p-4">
            <p className="font-display text-base font-extrabold">How the model’s calls have held up</p>
            <p className="mt-1 text-sm font-semibold text-muted-foreground">Each line compares one predicted band with the next review outcome you recorded.</p>
          </div>
          <div className="space-y-2">
            {reading.bands.filter((band) => band.resolved > 0).map((band) => <div key={band.band} className="flex flex-wrap items-center justify-between gap-3 rounded-[13px] border border-[var(--border)] bg-[var(--card)] px-4 py-3">
              <div><p className="font-display font-extrabold">“{band.label}”</p><p className="mt-0.5 text-sm font-semibold text-muted-foreground">You recalled it on {band.recalled} of the next {band.resolved} attempts.</p></div>
              <Badge variant={band.verdict === 'holding-up' ? 'success' : 'outline'}>{verdictCopy(band.verdict)}</Badge>
            </div>)}
          </div>
          <Collapsible title={<span className="inline-flex items-center gap-2"><Eye className="size-4" /> See resolved calls <ChevronDown className="size-4" /></span>}>
            <div className="divide-y divide-[var(--border)] rounded-[13px] border border-[var(--border)] bg-[var(--muted)]">
              {reading.calls.map((call) => <div key={call.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 text-sm font-semibold">
                <span>{new Date(call.predictedAt).toLocaleDateString()} · predicted “{call.predictedBand === 'likely-gone' ? 'likely gone' : call.predictedBand}”</span>
                <span className={cn(call.outcome === 'recalled' ? 'text-emerald-600 dark:text-emerald-300' : 'text-amber-700 dark:text-amber-300')}>{outcomeCopy(call.outcome)}</span>
              </div>)}
            </div>
          </Collapsible>
        </div>}
      </CardContent>
    </Card>
  </section>
}
