/**
 * §6.6 Predict — the pre-lecture expectation, and its resurfacing.
 *
 * Placement is ruled: "Pretest and Predict sit in the Materials module beside
 * the existing priming block (all three are pre-lecture acts)."
 *
 * ⚠️ Nothing here is graded. A prediction has no right answer — §6.6 rules the
 * pretesting family as priming, not performance. The value is entirely in
 * seeing the expectation again afterwards: **the violation is where the
 * encoding happens**, which is why the revealed state leads with the
 * comparison and not with a verdict.
 */
import { useState } from 'react'
import { Lightbulb } from 'lucide-react'
import { useStore } from '@/store/store'
import {
  PREDICT_PROMPT, canPredict, pendingReveal, recordPrediction, revealPrediction,
} from '@/lib/academics/predict'
import { MascotNote } from '@/components/common/MascotNote'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { Topic } from '@/lib/types'

const EYEBROW = 'font-display text-[10px] font-extrabold uppercase tracking-[0.1em] text-muted-foreground'

export function PredictPanel({ courseId, topics }: { courseId: string; topics: Topic[] }) {
  const predictions = useStore((s) => s.academics.classCenter.topicPredictions ?? [])
  const [answer, setAnswer] = useState('')
  const [target, setTarget] = useState<string | undefined>()

  const write = (next: typeof predictions) => {
    useStore.getState().update((draft) => { draft.academics.classCenter.topicPredictions = next })
  }

  const mine = predictions.filter((prediction) => prediction.courseId === courseId)
  const reveals = pendingReveal(topics, mine)
  const upcoming = topics.filter((topic) => canPredict(topic, mine))
  const chosen = topics.find((topic) => topic.id === target) ?? upcoming[0]

  if (!reveals.length && !upcoming.length) return null

  return (
    <section className="rounded-2xl border border-violet-500/30 bg-violet-500/9 p-4">
      <p className={EYEBROW}>Before the lecture</p>

      {/* The resurfacing leads, because it is the half that does the work. */}
      {reveals.map((prediction) => {
        const topic = topics.find((item) => item.id === prediction.topicId)
        return (
          <div key={prediction.id} className="mb-3 rounded-xl border border-border bg-card p-3">
            <p className="font-display text-sm font-extrabold">
              You predicted this before {topic?.title ?? 'the lecture'}.
            </p>
            <p className="mt-1 text-[11.5px] font-bold text-muted-foreground">“{prediction.answer}”</p>
            <p className="mt-2 text-[11.5px] font-bold">
              Compare that with what was actually covered. Where your expectation was wrong is where
              the lecture will stick — that gap is the point, not a mistake.
            </p>
            <Button
              size="sm" variant="outline" className="mt-2"
              onClick={() => write(revealPrediction(predictions, prediction.id))}
            >
              Got it
            </Button>
          </div>
        )
      })}

      {chosen && (
        <div>
          <p className="font-display text-sm font-extrabold">{PREDICT_PROMPT}</p>
          <p className="mt-1 text-[11.5px] font-bold text-muted-foreground">
            One line about <b>{chosen.title}</b>. It is never scored, and being wrong is useful.
          </p>
          {upcoming.length > 1 && (
            <select
              value={chosen.id}
              onChange={(event) => setTarget(event.target.value)}
              className="mt-2 w-full rounded-lg border border-border bg-card px-2 py-1.5 text-xs font-bold"
            >
              {upcoming.map((topic) => <option key={topic.id} value={topic.id}>{topic.title}</option>)}
            </select>
          )}
          <div className="mt-2 flex gap-2">
            <Input
              value={answer} onChange={(event) => setAnswer(event.target.value)}
              placeholder="I think it will cover…"
            />
            <Button
              size="sm" disabled={!answer.trim()}
              onClick={() => {
                write(recordPrediction(predictions, { courseId, topicId: chosen.id, answer }))
                setAnswer('')
                setTarget(undefined)
              }}
            >
              Save
            </Button>
          </div>
        </div>
      )}

      {/* §4.1-F: teach the mechanism once. */}
      <MascotNote variant="tip" className="mt-3">
        <Lightbulb className="mr-1 inline size-3.5" />
        Guessing before you are taught feels pointless and is not. A wrong expectation makes the
        correction land harder than reading the right answer first ever does.
      </MascotNote>
    </section>
  )
}
