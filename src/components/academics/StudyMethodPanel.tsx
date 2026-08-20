/**
 * Study method · UNPATCHED 2026 — the class-Overview panel (§4.1-K placement B).
 *
 * A section, never a tab. It groups topics by what each needs NEXT, so the page
 * answers "what do I do right now?".
 *
 * ⚠️ Only groups whose action has an engine are offered. Before class,
 * Needs connecting and Exam-ready check are absent because Pretest/Predict,
 * TopicLink and Full mock are specced (§6.6) and unbuilt. The component renders
 * whatever `studyGroups` returns, so each one turns on when its engine lands.
 *
 * The panel is not rendered AT ALL when every group is empty — the absence is
 * the congratulation, not a placeholder card.
 */
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { MascotNote } from '@/components/common/MascotNote'
import { panelShouldRender, studyGroups } from '@/lib/academics/studyMethod'
import type { ClassWorkspaceType, ReviewEvent, Topic, TopicLink } from '@/lib/types'

export function StudyMethodPanel({ courseId, topics, events, classType, topicLinks = [], primableTopicIds }: {
  courseId: string
  topics: Topic[]
  events: ReviewEvent[]
  classType?: ClassWorkspaceType
  topicLinks?: TopicLink[]
  /** §6.6 before-class: topics with material to prime from. */
  primableTopicIds?: ReadonlySet<string>
}) {
  // Both the empty rule (§4.1-K) and the General exclusion (§4.1-N) are owned
  // by panelShouldRender, so they stay testable and cannot drift apart.
  // §6.6: pass the graph so the needs-connecting group can turn on.
  const linkedTopicIds = new Set(
    topicLinks.flatMap((link) => [link.fromTopicId, link.toTopicId]),
  )
  const groups = studyGroups(topics, events, undefined, linkedTopicIds, primableTopicIds)
  if (!panelShouldRender(groups, classType)) return null

  return (
    <section className="rounded-2xl border border-border bg-card p-4 shadow-[0_10px_26px_-14px_rgba(0,0,0,0.55)]">
      <header className="mb-3">
        <h3 className="font-display text-base font-extrabold">Study method · UNPATCHED 2026</h3>
        <p className="text-xs font-semibold text-muted-foreground">
          Grouped by what each topic needs next. Only the next step is ever offered.
        </p>
      </header>

      <div className="space-y-2.5">
        {groups.map((group) => (
          <div key={group.id} className="overflow-hidden rounded-xl border border-border bg-muted">
            <div className="flex items-center gap-3 px-3.5 py-2.5">
              <span className="flex-1 font-display text-sm font-extrabold">{group.title}</span>
              <span className="font-display text-xs font-extrabold tabular-nums text-muted-foreground">{group.topics.length}</span>
            </div>
            <div className="space-y-1.5 px-3.5 pb-3">
              {group.topics.slice(0, 3).map((topic) => (
                <div key={topic.id} className="flex items-center gap-2.5 rounded-lg border border-border bg-card px-2.5 py-2 text-sm">
                  <span className="min-w-0 flex-1 truncate font-bold">{topic.title}</span>
                  <Button asChild size="sm" variant="outline">
                    <Link to={`/academics/review/${courseId}?topicId=${topic.id}`}>{group.action}</Link>
                  </Button>
                </div>
              ))}
              {group.topics.length > 3 && (
                <p className="text-xs font-bold text-muted-foreground">
                  …and {group.topics.length - 3} more
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* One MascotNote maximum. Pretest is the counter-intuitive step the spec
          would teach first — but it is not built, so teach a live one instead. */}
      <MascotNote variant="tip" className="mt-3">
        Retrieving a topic from memory is what moves it, not re-reading it. Getting it
        partly wrong still counts — the gap is the useful part.
      </MascotNote>
    </section>
  )
}
