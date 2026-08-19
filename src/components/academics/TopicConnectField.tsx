/**
 * The Connect step (§6.6) — authoring a `TopicLink`.
 *
 * Composition: **the A + C ruling Andy made for topic ↔ assignment linking**
 * (`academics-topic-linking.md`, Aug 19 2026), applied to the topic ↔ topic
 * record. Chips lead, the picker is the link-many escape hatch above five
 * candidates. This is a sibling of `TopicLinkFields`, deliberately not a fork
 * of it: the records differ, the composition does not.
 *
 * ⚠️ Choosing a candidate asks for the relation before writing. §6.6 stores a
 * relation on every link, and defaulting it would author a claim about the
 * student's own knowledge that they never made.
 */
import { useMemo, useState } from 'react'
import { Plus, X } from 'lucide-react'
import { useStore } from '@/store/store'
import { cn } from '@/lib/utils'
import {
  RELATION_LABEL, TOPIC_LINK_RELATIONS, connectCandidates, linkTopics,
  linksForTopic, otherEnd, unlinkTopics,
} from '@/lib/academics/topicGraph'
import type { Topic, TopicLinkRelation } from '@/lib/types'

const LABEL = 'font-display text-[10.5px] font-extrabold uppercase tracking-[0.08em] text-muted-foreground'
const CHIP = 'inline-flex items-center gap-1.5 rounded-[9px] border px-2 py-1.5 pl-2.5 font-display text-[11.5px] font-extrabold'
const LINKED = 'border-[color-mix(in_srgb,var(--cat-mcat)_34%,var(--border))] bg-[color-mix(in_srgb,var(--cat-mcat)_11%,transparent)]'
const ADD = 'inline-flex items-center gap-1.5 rounded-[9px] border border-dashed border-[color-mix(in_srgb,var(--cat-gpa)_46%,var(--border))] px-2.5 py-1.5 font-display text-[11.5px] font-extrabold text-[var(--cat-gpa)] transition-colors duration-150 ease-[cubic-bezier(.16,1,.3,1)] hover:bg-[color-mix(in_srgb,var(--cat-gpa)_8%,transparent)] motion-reduce:transition-none'

export function TopicConnectField({ topic }: { topic: Topic }) {
  const topics = useStore((s) => s.academics.classCenter.topics)
  const links = useStore((s) => s.academics.classCenter.topicLinks ?? [])
  const courses = useStore((s) => s.courses)
  const [picking, setPicking] = useState(false)
  const [pending, setPending] = useState<Topic | undefined>()

  const candidates = useMemo(
    () => connectCandidates(topic, topics, courses, links),
    [topic, topics, courses, links],
  )
  const mine = linksForTopic(links, topic.id)

  const write = (next: typeof links) => {
    useStore.getState().update((draft) => { draft.academics.classCenter.topicLinks = next })
  }

  if (!topics.length) return null

  return (
    <div className="mt-2 md:col-span-6">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className={LABEL}>Connected to</span>
        {mine.map((link) => {
          const other = topics.find((item) => item.id === otherEnd(link, topic.id))
          if (!other) return null
          return (
            <span key={link.id} className={cn(CHIP, LINKED)}>
              {other.title}
              <span className="font-body text-[10px] font-bold text-muted-foreground">
                {RELATION_LABEL[link.relation]}
              </span>
              <button
                type="button" aria-label={`Unlink ${other.title}`}
                className="text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--cat-gpa)]"
                onClick={() => write(unlinkTopics(links, link.id))}
              >
                <X className="size-3" />
              </button>
            </span>
          )
        })}
        {candidates.length > 0 && (
          <button type="button" className={ADD} onClick={() => setPicking((open) => !open)}>
            <Plus className="size-3" /> Connect topic
          </button>
        )}
      </div>

      {picking && !pending && (
        <div className="mt-2 overflow-hidden rounded-xl border border-[color-mix(in_srgb,var(--cat-gpa)_40%,var(--border))] bg-muted">
          {candidates.slice(0, 8).map((candidate) => (
            <button
              key={candidate.topic.id} type="button"
              className="flex w-full items-center justify-between gap-3 border-t border-border px-3 py-2 text-left text-xs font-bold first:border-t-0 hover:bg-[color-mix(in_srgb,var(--cat-gpa)_10%,transparent)]"
              onClick={() => setPending(candidate.topic)}
            >
              <span>{candidate.topic.title}</span>
              <span className="text-[10.5px] text-muted-foreground">{candidate.reason}</span>
            </button>
          ))}
        </div>
      )}

      {/* The relation is asked for, never assumed — the link is a claim about
          the student's own knowledge. */}
      {pending && (
        <div className="mt-2 rounded-xl border border-border bg-muted p-3">
          <p className="text-[11.5px] font-bold">
            How does <b className="font-display">{topic.title}</b> relate to{' '}
            <b className="font-display">{pending.title}</b>?
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {TOPIC_LINK_RELATIONS.map((relation: TopicLinkRelation) => (
              <button
                key={relation} type="button"
                className="rounded-lg border border-border bg-card px-2 py-1 font-display text-[11px] font-extrabold hover:border-[var(--cat-gpa)]"
                onClick={() => {
                  write(linkTopics(links, { fromTopicId: topic.id, toTopicId: pending.id, relation }))
                  setPending(undefined)
                  setPicking(false)
                }}
              >
                {RELATION_LABEL[relation]}
              </button>
            ))}
            <button
              type="button" className="px-2 py-1 text-[11px] font-bold text-muted-foreground hover:underline"
              onClick={() => setPending(undefined)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
