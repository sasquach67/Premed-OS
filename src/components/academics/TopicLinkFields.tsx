/**
 * Topic ↔ assignment linking — the fields (§4.1 #37, exam scope).
 *
 * Drawing:   mockup-lab/01-academics/academics-topic-linking.html
 * Decisions: academics-topic-linking.md — **A + C ruled**: chips lead, the
 *            picker is the link-many escape hatch, and §"The handoff" specifies
 *            the six rules this file implements.
 * Model:     lib/academics/topicLinks.ts — every rule lives there.
 *
 * The handoff, as built: the picker opens only from the chip row, only above
 * the threshold, pre-populated with current state; Cancel writes nothing; Save
 * closes and the chip row re-renders as the single rendering of the record.
 */
import { useMemo, useState } from 'react'
import { Plus, X } from 'lucide-react'
import { useStore } from '@/store/store'
import { cn } from '@/lib/utils'
import {
  assignmentsForTopic, linkedIds, linkingApplies, setLinks, shouldOfferPicker,
  toggleLink, topicsForAssignment, type LinkField, type LinkState,
} from '@/lib/academics/topicLinks'
import type { ClassAssignment, ClassWorkspaceType, Topic } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CenterPeek } from '@/components/common/CenterPeek'

const LABEL = 'font-display text-[10.5px] font-extrabold uppercase tracking-[0.08em] text-muted-foreground'
const CHIP = 'inline-flex items-center gap-1.5 rounded-[9px] border px-2 py-1.5 pl-2.5 font-display text-[11.5px] font-extrabold'
const COVERAGE = 'border-[color-mix(in_srgb,var(--cat-gpa)_34%,var(--border))] bg-[color-mix(in_srgb,var(--cat-gpa)_11%,transparent)]'
const SCOPE = 'border-amber-500/40 bg-amber-500/10'
const ADD = 'inline-flex items-center gap-1.5 rounded-[9px] border border-dashed border-[color-mix(in_srgb,var(--cat-gpa)_46%,var(--border))] px-2.5 py-1.5 font-display text-[11.5px] font-extrabold text-[var(--cat-gpa)] transition-colors duration-150 ease-[cubic-bezier(.16,1,.3,1)] hover:bg-[color-mix(in_srgb,var(--cat-gpa)_8%,transparent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--cat-gpa)] motion-reduce:transition-none'
/** Quieter than the dashed chip on purpose — the escape hatch never outranks the primary path. */
const MANY = 'font-bold text-[11px] text-muted-foreground underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--cat-gpa)]'

function useLinkState(): [LinkState, (next: LinkState) => void] {
  const assignments = useStore((state) => state.academics.classCenter.assignments)
  const topics = useStore((state) => state.academics.classCenter.topics)
  const write = (next: LinkState) => {
    useStore.getState().update((draft) => {
      draft.academics.classCenter.assignments = next.assignments
      draft.academics.classCenter.topics = next.topics
    })
  }
  return [{ assignments, topics }, write]
}

/** One field on an assignment record. Rendered twice on an exam: coverage, then scope. */
export function TopicLinkField({ assignment, field, classType }: {
  assignment: ClassAssignment
  field: LinkField
  classType?: ClassWorkspaceType
}) {
  const [state, write] = useLinkState()
  const [query, setQuery] = useState<string | undefined>()
  const [picking, setPicking] = useState(false)

  const candidates = useMemo(
    () => state.topics.filter((topic) => topic.courseId === assignment.courseId),
    [state.topics, assignment.courseId],
  )
  const linked = topicsForAssignment(state, assignment, field)
  const scope = field === 'scope'

  // STEM-only, owned by the model — see `linkingApplies`.
  if (!linkingApplies(classType)) return null

  const matches = query == null ? [] : candidates
    .filter((topic) => !linkedIds(assignment, field).includes(topic.id))
    .filter((topic) => `${topic.title} ${topic.unit ?? ''}`.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 6)

  return (
    <div className="mt-3 border-t border-border pt-3">
      <div className="flex items-center gap-2">
        <span className={LABEL}>{scope ? 'Exam scope' : 'Topics this covers'}</span>
        {scope && <span className="rounded-md border border-border bg-muted px-1.5 py-0.5 font-display text-[10px] font-extrabold text-muted-foreground">drives exam prep</span>}
      </div>

      {/* No topics recorded: say why rather than opening an empty picker, and
          keep the affordance visible so the path is still learnable. */}
      {!candidates.length ? (
        <p className="mt-2 text-xs font-bold text-muted-foreground">
          This class has no topics yet — add topics from Materials or a syllabus import, then link them here.
        </p>
      ) : (
        <>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {linked.map((topic) => (
              <span key={topic.id} className={cn(CHIP, scope ? SCOPE : COVERAGE)}>
                {topic.title}
                <button
                  type="button"
                  aria-label={`Unlink ${topic.title}`}
                  className="text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--cat-gpa)]"
                  onClick={() => write(toggleLink(state, { assignmentId: assignment.id, field, topicId: topic.id }))}
                >
                  <X className="size-3" />
                </button>
              </span>
            ))}
            <button type="button" className={ADD} onClick={() => setQuery(query == null ? '' : undefined)}>
              <Plus className="size-3" /> {scope ? 'Add to scope' : 'Link topic'}
            </button>
            {shouldOfferPicker(candidates.length) && (
              <button type="button" className={MANY} onClick={() => setPicking(true)}>Link many…</button>
            )}
          </div>

          {query != null && (
            <div className="mt-2.5 overflow-hidden rounded-xl border border-[color-mix(in_srgb,var(--cat-gpa)_40%,var(--border))] bg-muted">
              <Input
                autoFocus value={query} onChange={(event) => setQuery(event.target.value)}
                placeholder="Type a topic name…" className="rounded-none border-0 border-b border-border bg-transparent"
              />
              {matches.map((topic) => (
                <button
                  key={topic.id} type="button"
                  className="flex w-full items-center justify-between gap-3 border-t border-border px-3 py-2 text-left text-xs font-bold first:border-t-0 hover:bg-[color-mix(in_srgb,var(--cat-gpa)_10%,transparent)]"
                  onClick={() => {
                    write(toggleLink(state, { assignmentId: assignment.id, field, topicId: topic.id }))
                    setQuery(undefined)
                  }}
                >
                  <span>{topic.title}</span>
                  <span className="text-[10.5px] text-muted-foreground">{topic.unit || 'Unit not set'}</span>
                </button>
              ))}
              {!matches.length && (
                <p className="px-3 py-2 text-[11px] font-bold text-muted-foreground">
                  {query ? 'No topic in this class matches.' : 'Only this class’s own topics are offered.'}
                </p>
              )}
            </div>
          )}
        </>
      )}

      <LinkPicker
        open={picking}
        label={`${assignment.title} · ${scope ? 'exam scope' : 'topics covered'}`}
        title={scope ? `What does ${assignment.title} test?` : `What does ${assignment.title} cover?`}
        detail={scope
          ? 'Scope drives Exam prep and the forgetting curve. It is separate from “topics this covers”.'
          : `${candidates.length} topics recorded in this class.`}
        rows={candidates.map((topic) => ({ id: topic.id, title: topic.title, meta: topic.unit || 'Unit not set' }))}
        selected={linkedIds(assignment, field)}
        countLabel={scope ? 'in scope' : 'linked'}
        saveLabel={scope ? 'Set scope' : 'Save links'}
        onClose={() => setPicking(false)}
        onSave={(topicIds) => {
          write(setLinks(state, { assignmentId: assignment.id, field, topicIds }))
          setPicking(false)
        }}
      />
    </div>
  )
}

/** The same record, written from the topic side. One link, seen from two places. */
export function AssignmentLinkField({ topic }: { topic: Topic }) {
  const [state, write] = useLinkState()
  const [query, setQuery] = useState<string | undefined>()

  const candidates = useMemo(
    () => state.assignments.filter((item) => item.courseId === topic.courseId),
    [state.assignments, topic.courseId],
  )
  const links = assignmentsForTopic(state, topic.id)

  const matches = query == null ? [] : candidates
    .filter((item) => !links.some((link) => link.assignment.id === item.id))
    .filter((item) => item.title.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 6)

  if (!candidates.length) return null

  return (
    <div className="mt-2 md:col-span-6">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className={LABEL}>Covered by</span>
        {links.map(({ assignment, field }) => (
          <span key={`${assignment.id}-${field}`} className={cn(CHIP, field === 'scope' ? SCOPE : COVERAGE)}>
            {assignment.title}{field === 'scope' ? ' — in scope' : ''}
            <button
              type="button"
              aria-label={`Unlink ${assignment.title}`}
              className="text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--cat-gpa)]"
              onClick={() => write(toggleLink(state, { assignmentId: assignment.id, field, topicId: topic.id }))}
            >
              <X className="size-3" />
            </button>
          </span>
        ))}
        <button type="button" className={ADD} onClick={() => setQuery(query == null ? '' : undefined)}>
          <Plus className="size-3" /> Link work
        </button>
      </div>

      {query != null && (
        <div className="mt-2 overflow-hidden rounded-xl border border-[color-mix(in_srgb,var(--cat-gpa)_40%,var(--border))] bg-muted">
          <Input
            autoFocus value={query} onChange={(event) => setQuery(event.target.value)}
            placeholder="Type an assignment name…" className="rounded-none border-0 border-b border-border bg-transparent"
          />
          {matches.map((item) => (
            <button
              key={item.id} type="button"
              className="flex w-full items-center justify-between gap-3 border-t border-border px-3 py-2 text-left text-xs font-bold first:border-t-0 hover:bg-[color-mix(in_srgb,var(--cat-gpa)_10%,transparent)]"
              onClick={() => {
                write(toggleLink(state, { assignmentId: item.id, field: 'coverage', topicId: topic.id }))
                setQuery(undefined)
              }}
            >
              <span>{item.title}</span>
              <span className="text-[10.5px] text-muted-foreground">{item.dueDate || 'No date'}</span>
            </button>
          ))}
          {!matches.length && <p className="px-3 py-2 text-[11px] font-bold text-muted-foreground">No work in this class matches.</p>}
        </div>
      )}
    </div>
  )
}

/**
 * C, the escape hatch. `CenterPeek` already renders a full-screen sheet below
 * 768px, which is the ruled mobile treatment — so it is reused, never forked.
 *
 * Selection is local until Save: Cancel writes nothing, including boxes toggled
 * while it was open.
 */
function LinkPicker({
  open, label, title, detail, rows, selected, countLabel, saveLabel, onClose, onSave,
}: {
  open: boolean
  label: string
  title: string
  detail: string
  rows: Array<{ id: string; title: string; meta: string }>
  selected: string[]
  countLabel: string
  saveLabel: string
  onClose: () => void
  onSave: (ids: string[]) => void
}) {
  // Re-seeded from the record every time it opens, so it edits current state
  // rather than starting fresh or appending a second set.
  const [draft, setDraft] = useState<string[]>(selected)
  const [wasOpen, setWasOpen] = useState(false)
  if (open && !wasOpen) { setDraft(selected); setWasOpen(true) }
  if (!open && wasOpen) setWasOpen(false)

  return (
    <CenterPeek
      open={open} mode="peek" label={label} allowSplit={false}
      onOpenChange={(next) => { if (!next) onClose() }}
      onModeChange={() => undefined}
    >
      <div className="p-4">
        <h3 className="font-display text-base font-extrabold">{title}</h3>
        <p className="mt-1 text-xs font-bold text-muted-foreground">{detail}</p>
        <div className="mt-3 overflow-hidden rounded-xl border border-border">
          {rows.map((row) => {
            const on = draft.includes(row.id)
            return (
              <button
                key={row.id} type="button" role="checkbox" aria-checked={on}
                className="flex w-full items-center gap-3 border-t border-border px-3 py-2.5 text-left text-sm font-bold first:border-t-0 hover:bg-muted/50"
                onClick={() => setDraft(on ? draft.filter((id) => id !== row.id) : [...draft, row.id])}
              >
                <span className={cn('size-4 shrink-0 rounded-[5px] border-[1.5px]', on ? 'border-[var(--cat-gpa)] bg-[var(--cat-gpa)]' : 'border-border')} />
                <span className="min-w-0 flex-1 truncate">{row.title}</span>
                <span className="text-[10.5px] font-bold text-muted-foreground">{row.meta}</span>
              </button>
            )
          })}
        </div>
        <div className="mt-3 flex items-center justify-between gap-3">
          {/* A count of the current selection. Never a ratio against the class. */}
          <span className="text-xs font-bold text-muted-foreground">{draft.length} {countLabel}</span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={onClose}>Cancel</Button>
            <Button size="sm" onClick={() => onSave(draft)}>{saveLabel}</Button>
          </div>
        </div>
      </div>
    </CenterPeek>
  )
}
