/**
 * §6.6 Pretest — answering before you are taught.
 *
 * ⚠️ §6.6 names the interface risk directly: *"The UI must say so plainly, or
 * users will read a 0/5 as failure and quit."* So this surface leads with the
 * mechanism, shows no score, and frames a wrong answer as the thing working.
 * There is no tally even in the reveal.
 */
import { useState } from 'react'
import { Sparkles } from 'lucide-react'
import { useStore } from '@/store/store'
import { canPretest, pretestPrompts, recordPretest } from '@/lib/academics/pretest'
import { MascotNote } from '@/components/common/MascotNote'
import { Button } from '@/components/ui/button'
import type { Topic } from '@/lib/types'

const EYEBROW = 'font-display text-[10px] font-extrabold uppercase tracking-[0.1em] text-muted-foreground'

export function PretestPanel({ topics }: { topics: Topic[] }) {
  const keyPoints = useStore((s) => s.academics.classCenter.keyPoints ?? [])
  const [openTopicId, setOpenTopicId] = useState<string | undefined>()
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [revealed, setRevealed] = useState(false)

  const candidates = topics.filter((topic) =>
    canPretest(topic) && pretestPrompts(topic, keyPoints).length > 0)
  const topic = topics.find((item) => item.id === openTopicId) ?? candidates[0]
  const prompts = topic ? pretestPrompts(topic, keyPoints) : []

  if (!topic || !prompts.length) return null

  return (
    <section className="rounded-2xl border border-violet-500/30 bg-violet-500/9 p-4">
      <p className={EYEBROW}>Before the lecture</p>
      <h3 className="mt-0.5 font-display text-base font-extrabold">
        Guess these before {topic.title} is taught.
      </h3>
      {/* The plain statement §6.6 requires. It leads, rather than sitting under
          the questions where a discouraged student would never reach it. */}
      <p className="mt-1 max-w-2xl text-xs font-bold text-muted-foreground">
        You are meant to get these wrong. Attempting an answer before instruction makes the lecture
        stick harder than reading it first — so a blank or a wrong guess is the method working,
        not a bad result. Nothing here is scored or recorded.
      </p>

      {candidates.length > 1 && (
        <select
          value={topic.id}
          onChange={(event) => { setOpenTopicId(event.target.value); setRevealed(false); setAnswers({}) }}
          className="mt-2 w-full rounded-lg border border-border bg-card px-2 py-1.5 text-xs font-bold"
        >
          {candidates.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
        </select>
      )}

      <ol className="mt-3 space-y-2">
        {prompts.map((prompt, index) => (
          <li key={prompt.id} className="rounded-xl border border-border bg-card p-3">
            <p className="font-display text-[12.5px] font-extrabold">
              {index + 1}. {prompt.text}
            </p>
            {revealed ? (
              <p className="mt-1 text-[11.5px] font-bold text-muted-foreground">
                {answers[prompt.id]?.trim()
                  ? `You guessed: “${answers[prompt.id].trim()}” — now read the lecture with that in mind.`
                  : 'You left this blank. Watch for it in the lecture; the gap is what makes it land.'}
              </p>
            ) : (
              <input
                value={answers[prompt.id] ?? ''}
                onChange={(event) => setAnswers((current) => ({ ...current, [prompt.id]: event.target.value }))}
                placeholder="Guess, even if you are sure you do not know…"
                className="mt-2 w-full rounded-lg border border-border bg-muted px-2.5 py-1.5 text-xs font-semibold"
              />
            )}
          </li>
        ))}
      </ol>

      {!revealed ? (
        <Button
          size="sm" className="mt-3"
          onClick={() => {
            setRevealed(true)
            useStore.getState().update((draft) => {
              draft.academics.classCenter.topics = recordPretest(draft.academics.classCenter.topics, topic.id)
            })
          }}
        >
          <Sparkles className="size-4" /> Done guessing
        </Button>
      ) : (
        <p className="mt-3 text-[11.5px] font-bold text-muted-foreground">
          Primed. Read or attend the lecture next — the questions you missed are the ones it will
          answer most sharply.
        </p>
      )}

      <MascotNote variant="tip" className="mt-3">
        This is the step people skip because it feels like failing. Answering before you are taught
        is what makes the teaching stick — the wrong guess is doing the work.
      </MascotNote>
    </section>
  )
}
