import { useMemo, useState, type ReactNode } from 'react'
import { BookOpen, BookOpenCheck, CalendarDays, Check, ChevronDown, ChevronRight, Folder, Layers, ListChecks, NotebookText, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Collapsible } from '@/components/common/Collapsible'
import { cn } from '@/lib/utils'
import { dateOf, isoDay } from '@/lib/academics/classDays'
import { buildLessons, groupLessonsByExam, type LessonExam, type LessonRow } from '@/lib/academics/lessonGroups'
import { buildReadingItems, readingExamKey, readingsDiscussedOn, type ReadingItem } from '@/lib/academics/readingGroups'
import { folderTrail, readingFolderName } from '@/lib/academics/classFolder'
import type { AssignedReading, ClassFolderSetup, LectureRecord, SyllabusScheduleEntry } from '@/lib/types'
import './classFolder.css'
import './lessonsTab.css'

type Filter = 'all' | 'needs' | 'none'

interface MadeState { notebook?: LectureRecord; flashcards: boolean; practice: boolean }
interface LessonState extends MadeState { taught: boolean }

const madeFrom = (notebook?: LectureRecord): MadeState => ({ notebook, flashcards: Boolean(notebook?.flashcardsMadeAt), practice: Boolean(notebook?.practiceSetMadeAt) })
const shortDate = (iso: string) => dateOf(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })

/**
 * The Lessons tab (Oct 18 design, picked by Andy Oct 20 2026): lessons from
 * the syllabus grouped under the exam that tests them, each with its notebook,
 * flashcards and practice set, and the class's assigned readings under the
 * lessons of the same exam (reading notebooks, Oct 19). The class's files sit
 * in a collapsed section at the bottom, so nothing the Materials tab held is lost.
 */
export function LessonsTab({ schedule, exams, lectures, readings = [], today = isoDay(new Date()), titleOf, onOpenNotebook, onNewNotebook, onNewReadingNotebook, onToggleReadingPart, onFlashcards, onPracticeSet, classFiles, classFilesCount, classFilesOpen = false, classFolder, defaultFolderName, onSetUpFolder, onSkipFolder }: {
  schedule?: SyllabusScheduleEntry[]
  exams: LessonExam[]
  /** This class's notebooks. */
  lectures: LectureRecord[]
  /** This class's assigned readings from the syllabus. */
  readings?: AssignedReading[]
  today?: string
  titleOf: (lecture: LectureRecord) => string
  onOpenNotebook: (id: string) => void
  onNewNotebook: () => void
  /** Start a notebook for a reading (or a whole book), by its reading key. */
  onNewReadingNotebook?: (readingKey: string) => void
  /** Mark one assigned reading (a book part) read or not read. */
  onToggleReadingPart?: (readingId: string) => void
  onFlashcards: (lectureId: string) => void
  onPracticeSet: (lectureId: string) => void
  classFiles: ReactNode
  classFilesCount?: number
  /** Open when a link asked for the class's files (old Materials links). */
  classFilesOpen?: boolean
  /** The class folder setup, absent until set up or skipped. */
  classFolder?: ClassFolderSetup
  defaultFolderName: string
  onSetUpFolder: () => void
  onSkipFolder: () => void
}) {
  const readingNotebooks = useMemo(() => lectures.filter((l) => l.readingKey), [lectures])
  const lessonNotebooks = useMemo(() => lectures.filter((l) => !l.readingKey), [lectures])
  const lessons = useMemo(() => {
    const fromSyllabus = buildLessons(schedule)
    if (fromSyllabus.length) return fromSyllabus
    // No syllabus lessons: each notebook is a lesson, in class-date order.
    return [...lessonNotebooks].sort((a, b) => (a.occurredOn ?? '9').localeCompare(b.occurredOn ?? '9') || a.createdAt - b.createdAt)
      .map((lecture, i): LessonRow => ({ lesson: i + 1, dates: lecture.occurredOn ? [lecture.occurredOn.slice(0, 10)] : [] }))
  }, [schedule, lessonNotebooks])
  const stateOf = useMemo(() => {
    const syllabusLessons = Boolean(schedule?.some((e) => e.lesson !== undefined || e.startDate))
    const sortedNotebooks = [...lessonNotebooks].sort((a, b) => (a.occurredOn ?? '9').localeCompare(b.occurredOn ?? '9') || a.createdAt - b.createdAt)
    return (row: LessonRow): LessonState => {
      const notebook = syllabusLessons
        ? lessonNotebooks.find((l) => l.occurredOn && row.dates.includes(l.occurredOn.slice(0, 10))) ?? lessonNotebooks.find((l) => new RegExp(`\\blesson\\s*${row.lesson}\\b`, 'i').test(l.title))
        : sortedNotebooks[row.lesson - 1]
      return { ...madeFrom(notebook), taught: Boolean(notebook) || (row.dates.length > 0 && row.dates[0] <= today) }
    }
  }, [schedule, lessonNotebooks, today])
  const groups = useMemo(() => groupLessonsByExam(lessons, exams), [lessons, exams])
  const readingItems = useMemo(() => buildReadingItems(readings), [readings])
  const readingsByGroup = useMemo(() => {
    const out = new Map<string, ReadingItem[]>()
    if (!groups.length) return out
    const keys = groups.map((g) => ({ key: g.key, date: g.date }))
    for (const item of readingItems) {
      const at = groups.length === 1 ? groups[0].key : readingExamKey(item, keys) ?? groups[groups.length - 1].key
      out.set(at, [...(out.get(at) ?? []), item])
    }
    return out
  }, [groups, readingItems])
  const readingState = (item: ReadingItem) => madeFrom(readingNotebooks.find((l) => l.readingKey === item.key))
  const taught = lessons.filter((l) => stateOf(l).taught)
  const current = taught[taught.length - 1]?.lesson
  const [filter, setFilter] = useState<Filter>('all')
  const [openGroups, setOpenGroups] = useState<Set<string>>()
  const [openLessons, setOpenLessons] = useState<Set<string>>()
  const groupOpen = (key: string, hasCurrent: boolean) => openGroups ? openGroups.has(key) : hasCurrent
  const currentKey = current !== undefined ? `lesson-${current}` : undefined
  const itemOpen = (key: string) => openLessons ? openLessons.has(key) : key === currentKey
  const toggle = <T,>(set: Set<T> | undefined, fallback: T[], value: T) => { const next = new Set(set ?? fallback); if (next.has(value)) next.delete(value); else next.add(value); return next }
  const toggleItem = (key: string) => setOpenLessons(toggle(openLessons, currentKey ? [currentKey] : [], key))
  const needsWork = (s: MadeState) => !(s.notebook && s.flashcards && s.practice)
  const shown = (s: MadeState) => filter === 'all' || (filter === 'needs' ? needsWork(s) : !s.notebook)
  const actionsFor = (onNew: () => void): RowActions => ({ onOpenNotebook, onNewNotebook: onNew, onFlashcards, onPracticeSet })

  const askFolder = !classFolder
  const noNotebooks = lectures.length === 0
  return <div className="lessons-tab">
    <div className="lessons-head">
      <div><h2>Lessons</h2><p>{lessons.length ? `${taught.length} lesson${taught.length === 1 ? '' : 's'} so far${groups.length > 1 ? ' · grouped by exam' : ''}` : 'No lessons yet'}</p></div>
      <Button size="sm" variant={askFolder ? 'outline' : 'default'} onClick={onNewNotebook}><Plus aria-hidden="true" /> New notebook</Button>
    </div>
    {askFolder && <section className="class-folder-card" aria-labelledby="class-folder-card-title">
      <div className="flex items-start gap-4">
        <span className="icon"><Folder aria-hidden="true" /></span>
        <div className="min-w-0">
          <p className="class-folder-kicker">{noNotebooks ? 'Before your first notebook' : 'Class folder'}</p>
          <h3 id="class-folder-card-title">Set up your class folder</h3>
          <p className="sub">So your AI knows where to save notebooks and flashcards.</p>
          <div className="class-folder-chips"><span className="chip"><Folder aria-hidden="true" />{defaultFolderName}</span><span aria-hidden="true">›</span><span className="chip"><Folder aria-hidden="true" />Lesson 1</span><span>+</span><span className="chip is-ai"><Folder aria-hidden="true" />premedOS</span></div>
        </div>
      </div>
      <div className="class-folder-card-actions"><Button onClick={onSetUpFolder}>Set it up · 5 min</Button><button type="button" className="skip" onClick={onSkipFolder}>Skip for now. Files go to Downloads.</button></div>
    </section>}
    {classFolder && noNotebooks && <div className="class-folder-ready">
      <div><Folder aria-hidden="true" /><div><b>{classFolder.state === 'ready' ? 'Class folder set up' : 'No class folder'}</b><small>{classFolder.state === 'ready' ? `${folderTrail(classFolder).join(' › ')} · new files land in each lesson’s folders` : 'Your AI saves files to Downloads'}</small></div></div>
      <div className="flex items-center gap-3">{classFolder.state === 'ready' && <span className="ok"><Check aria-hidden="true" /> Ready</span>}<button type="button" className="change" onClick={onSetUpFolder}>{classFolder.state === 'ready' ? 'Change' : 'Set it up'}</button></div>
    </div>}
    {lessons.length ? <>
      <div className="class-hub-material-filters" role="group" aria-label="Lesson filters">
        {([['all', `All ${taught.length}`], ['needs', 'Needs work'], ['none', 'No notebook']] as const).map(([key, label]) =>
          <button key={key} type="button" aria-pressed={filter === key} className={cn('class-hub-material-filter', filter === key && 'is-active')} onClick={() => setFilter(key)}>{label}</button>)}
      </div>
      {groups.map((group) => {
        const groupTaught = group.lessons.filter((l) => stateOf(l).taught)
        const future = group.lessons.filter((l) => !stateOf(l).taught)
        const withNotebook = groupTaught.filter((l) => stateOf(l).notebook).length
        const hasCurrent = group.lessons.some((l) => l.lesson === current)
        const open = groupOpen(group.key, hasCurrent)
        const first = group.lessons[0].lesson, last = group.lessons[group.lessons.length - 1].lesson
        const rows = groupTaught.filter((l) => shown(stateOf(l))).reverse()
        const groupReadings = readingsByGroup.get(group.key) ?? []
        const assigned = groupReadings.filter((r) => !r.firstDue || r.firstDue <= today)
        const upcoming = groupReadings.filter((r) => r.firstDue && r.firstDue > today)
        const readingRows = assigned.filter((r) => shown(readingState(r))).reverse()
        return <section key={group.key} className={cn('lessons-group', open && 'is-open')}>
          <button type="button" className="lessons-ghead" aria-expanded={open} onClick={() => setOpenGroups(toggle(openGroups, groups.filter((g) => g.lessons.some((l) => l.lesson === current)).map((g) => g.key), group.key))}>
            {open ? <ChevronDown aria-hidden="true" /> : <ChevronRight aria-hidden="true" />}
            <span className="t"><b>{group.name}</b>{group.date && ` · ${shortDate(group.date)}`}</span>
            <span className="r">{group.cumulative ? 'Cumulative · new: ' : ''}{first === last ? `Lesson ${first}` : `Lessons ${first}–${last}`}</span>
            <span className="grow" />
            <span className="s">{groupTaught.length ? `${withNotebook} of ${groupTaught.length} with notebooks` : 'Not taught yet'}</span>
          </button>
          {open && <div className="lessons-gbody">
            {future.length > 0 && <div className="lessons-row is-future"><span className="lessons-num"><CalendarDays aria-hidden="true" /></span><span className="lessons-main"><b>{future.length > 1 ? `Lessons ${future[0].lesson}–${future[future.length - 1].lesson}` : `Lesson ${future[0].lesson}`}</b><small>{future.length} not taught yet · {future.length > 1 ? 'they appear' : 'it appears'} here as the class reaches {future.length > 1 ? 'them' : 'it'}</small></span></div>}
            {rows.map((row) => {
              const key = `lesson-${row.lesson}`, state = stateOf(row), title = lessonTitle(row, state, titleOf)
              const discusses = readingsDiscussedOn(readingItems, row.dates)
              const meta = <>{row.dates.length ? row.dates.map(shortDate).join(' · ') : state.notebook ? 'Notebook saved' : 'No notebook yet'}{discusses.length > 0 && <> · <span className="lessons-disc"><BookOpen aria-hidden="true" />Discusses {discusses.join('; ')}</span></>}</>
              return itemOpen(key)
                ? <MaterialCard key={key} label={`Lesson ${row.lesson}`} kicker={`Lesson ${row.lesson}`} title={title} meta={meta} state={state} onCollapse={() => toggleItem(key)} {...actionsFor(onNewNotebook)} />
                : <MaterialLine key={key} label={`Lesson ${row.lesson}`} num={row.lesson} title={title} state={state} current={row.lesson === current} onExpand={() => toggleItem(key)} {...actionsFor(onNewNotebook)} />
            })}
            {!rows.length && groupTaught.length > 0 && <p className="lessons-empty">Nothing here matches this filter.</p>}
            {groupReadings.length > 0 && <>
              <p className="lessons-subhead"><BookOpen aria-hidden="true" />Readings <span>{assigned.length} assigned</span></p>
              {upcoming.length > 0 && <div className="lessons-row is-future"><span className="lessons-num"><CalendarDays aria-hidden="true" /></span><span className="lessons-main"><b>{upcoming.length > 1 ? `${upcoming.length} readings to come` : upcoming[0].title}</b><small>{upcoming.length > 1 ? `Next: ${upcoming[0].title}, for ${shortDate(upcoming[0].firstDue!)}` : `For ${shortDate(upcoming[0].firstDue!)}`}</small></span></div>}
              {readingRows.map((item) => {
                const key = `reading-${item.key}`, state = readingState(item)
                const read = item.parts.filter((p) => p.status === 'read').length
                const when = item.partLabels.length ? `Book · ${read} of ${item.parts.length} parts read` : [item.parts[0].week, item.firstDue && shortDate(item.firstDue)].filter(Boolean).join(' · ')
                const onNew = () => onNewReadingNotebook ? onNewReadingNotebook(item.key) : onNewNotebook()
                if (!itemOpen(key)) return <MaterialLine key={key} label={item.title} num={<BookOpen aria-hidden="true" />} title={item.title} sub={when} state={state} reading onExpand={() => toggleItem(key)} {...actionsFor(onNew)} />
                const parts = item.partLabels.length > 0 && <div className="lessons-parts" role="group" aria-label="Parts read">
                  {item.parts.map((p, i) => <button key={p.id} type="button" aria-pressed={p.status === 'read'} className={p.status === 'read' ? 'is-on' : undefined} onClick={() => onToggleReadingPart?.(p.id)}>{p.status === 'read' && <Check aria-hidden="true" />}Part {i + 1} · {item.partLabels[i]}</button>)}
                  <small>{read < item.parts.length ? 'Update the notebook as you read each part. One notebook for the whole book.' : 'All parts read.'}</small>
                </div>
                return <MaterialCard key={key} label={item.title} kicker={`Reading · ${item.parts.length > 1 ? `${item.parts[0].week}–${item.parts[item.parts.length - 1].week.replace(/^Week\s*/i, '')}` : item.parts[0].week}`} title={item.title}
                  meta={<>On disk: premedOS › {readingFolderName(item.title)}</>} state={state} reading before={parts || undefined} onCollapse={() => toggleItem(key)} {...actionsFor(onNew)} />
              })}
            </>}
          </div>}
        </section>
      })}
    </> : <div className="lessons-first"><NotebookText aria-hidden="true" /><p className="h">Make your first notebook</p><p>Your AI turns the lesson’s slides, outline and transcript into a study guide.</p><Button onClick={onNewNotebook}><Plus aria-hidden="true" /> New notebook</Button></div>}
    <div className="lessons-files"><Collapsible title="Class files" badge={classFilesCount ? <span className="lessons-files-count" aria-label={`${classFilesCount} files`}>{classFilesCount}</span> : undefined} defaultOpen={classFilesOpen}>{classFolder && <p className="class-folder-line"><Folder aria-hidden="true" /><span>{classFolder.state === 'ready' ? <>Class folder · {folderTrail(classFolder).join(' › ')}</> : <>No class folder · your AI saves to Downloads</>}</span><button type="button" onClick={onSetUpFolder}>{classFolder.state === 'ready' ? 'Change' : 'Set it up'}</button></p>}{classFiles}</Collapsible></div>
  </div>
}

function lessonTitle(row: LessonRow, state: LessonState, titleOf: (l: LectureRecord) => string) {
  const topic = row.title ?? (state.notebook ? titleOf(state.notebook).replace(/^(?:lessons?|lectures?)\s*\d+\s*[—–:\-·.]\s*/i, '') : undefined)
  return `Lesson ${row.lesson}${topic ? ` — ${topic}` : ''}`
}

interface RowActions {
  onOpenNotebook: (id: string) => void
  onNewNotebook: () => void
  onFlashcards: (lectureId: string) => void
  onPracticeSet: (lectureId: string) => void
}

function nextAction(state: MadeState, a: RowActions): [string, () => void, boolean] {
  const nb = state.notebook
  if (!nb) return ['Make notebook', a.onNewNotebook, true]
  if (!state.flashcards) return ['Make flashcards', () => a.onFlashcards(nb.id), false]
  if (!state.practice) return ['Make practice set', () => a.onPracticeSet(nb.id), false]
  return ['Open', () => a.onOpenNotebook(nb.id), false]
}

const PIECES = [['notebook', NotebookText, 'Notebook'], ['flashcards', Layers, 'Flashcards'], ['practice', ListChecks, 'Practice set']] as const

/** One collapsed row: a lesson or a reading. */
function MaterialLine({ label, num, title, sub, state, current, reading, onExpand, ...actions }: { label: string; num: ReactNode; title: string; sub?: string; state: MadeState; current?: boolean; reading?: boolean; onExpand: () => void } & RowActions) {
  const made = { notebook: Boolean(state.notebook), flashcards: state.flashcards, practice: state.practice }
  const done = made.notebook && made.flashcards && made.practice
  const [actionLabel, act, primary] = nextAction(state, actions)
  const status = sub ?? (done ? 'All made' : !made.notebook ? 'No notebook yet' : `Notebook${made.flashcards ? ' · flashcards' : ''}`)
  return <div className={cn('lessons-row', current && 'is-current', done && 'is-done', reading && 'is-reading')}>
    <button type="button" className="lessons-chev" aria-expanded={false} aria-label={`Expand ${label}`} onClick={onExpand}><ChevronRight aria-hidden="true" /></button>
    <span className="lessons-num">{num}</span>
    <button type="button" className="lessons-main" onClick={onExpand}><b>{title}</b><small>{status}</small></button>
    <span className="lessons-pips" aria-label={`${PIECES.filter(([k]) => made[k]).map(([, , n]) => n.toLowerCase()).join(', ') || 'nothing'} made`}>
      {PIECES.map(([key, Icon, name]) => <span key={key} className={cn('lessons-pip', made[key] && 'is-on')} title={`${name}: ${made[key] ? 'made' : 'not made yet'}`}><Icon aria-hidden="true" /></span>)}
    </span>
    <Button size="sm" variant={primary ? 'default' : 'outline'} onClick={act}>{actionLabel}</Button>
  </div>
}

/** One open card with the three tiles: a lesson or a reading. */
function MaterialCard({ label, kicker, title, meta, state, reading, before, onCollapse, ...actions }: { label: string; kicker: string; title: string; meta: ReactNode; state: MadeState; reading?: boolean; before?: ReactNode; onCollapse: () => void } & RowActions) {
  const nb = state.notebook
  const made = [Boolean(nb), state.flashcards, state.practice]
  const n = made.filter(Boolean).length
  const nextIndex = made.findIndex((m) => !m)
  const tile = (i: number, Icon: typeof NotebookText, name: string, detail: string, onClick: () => void) =>
    <button type="button" className={cn('lessons-tile', made[i] ? 'is-made' : i === nextIndex ? 'is-next' : 'is-todo')} onClick={onClick}>
      <span className="top"><span className="ic"><Icon aria-hidden="true" /></span>{made[i] ? <span className="chip"><Check aria-hidden="true" />Made</span> : i === nextIndex ? <span className="chip">Next</span> : null}</span>
      <span><span className="nm">{name}</span><span className="dt">{detail}</span></span>
      <span className="go">{made[i] ? 'Open' : 'Make'}<ChevronRight aria-hidden="true" /></span>
    </button>
  return <article className={cn('lessons-card', reading && 'is-reading')}>
    <div className="lessons-card-head">
      <div className="flex min-w-0 items-start gap-2">
        <button type="button" className="lessons-chev" aria-expanded={true} aria-label={`Collapse ${label}`} onClick={onCollapse}><ChevronDown aria-hidden="true" /></button>
        <div className="min-w-0"><p className="kicker">{kicker}</p><h3>{title}</h3><p className="meta">{meta}</p></div>
      </div>
      <div className="lessons-prog" aria-label={`${n} of 3 made`}><b><em>{n}</em> of 3 made</b><span className="bar">{made.map((m, i) => <i key={i} className={m ? 'is-on' : i === nextIndex ? 'is-next' : ''} />)}</span></div>
    </div>
    {before}
    <div className="lessons-tiles">
      {tile(0, NotebookText, 'Notebook', nb ? (reading ? 'Argument · key concepts · cases' : 'Study guide · objectives') : reading ? 'From the reading' : 'From the lesson files', nb ? () => actions.onOpenNotebook(nb.id) : actions.onNewNotebook)}
      {tile(1, Layers, 'Flashcards', state.flashcards ? 'Deck in Anki' : 'From the notebook', nb ? () => actions.onFlashcards(nb.id) : actions.onNewNotebook)}
      {tile(2, BookOpenCheck, 'Practice set', reading ? 'Short answer and IDs' : 'Exam-style questions', nb ? () => actions.onPracticeSet(nb.id) : actions.onNewNotebook)}
    </div>
  </article>
}
