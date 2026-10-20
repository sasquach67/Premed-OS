import { useMemo, useState, type ReactNode } from 'react'
import { BookOpenCheck, CalendarDays, Check, ChevronDown, ChevronRight, Folder, Layers, ListChecks, NotebookText, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Collapsible } from '@/components/common/Collapsible'
import { cn } from '@/lib/utils'
import { dateOf, isoDay } from '@/lib/academics/classDays'
import { buildLessons, groupLessonsByExam, type LessonExam, type LessonRow } from '@/lib/academics/lessonGroups'
import { folderTrail } from '@/lib/academics/classFolder'
import type { ClassFolderSetup, LectureRecord, SyllabusScheduleEntry } from '@/lib/types'
import './classFolder.css'
import './lessonsTab.css'

type Filter = 'all' | 'needs' | 'none'

interface LessonState { notebook?: LectureRecord; flashcards: boolean; practice: boolean; taught: boolean }

/**
 * The Lessons tab (Oct 18 design, picked by Andy Oct 20 2026): lessons from
 * the syllabus grouped under the exam that tests them, each with its notebook,
 * flashcards and practice set. The class's files sit in a collapsed section
 * at the bottom, so nothing the Materials tab held is lost.
 */
export function LessonsTab({ schedule, exams, lectures, today = isoDay(new Date()), titleOf, onOpenNotebook, onNewNotebook, onFlashcards, onPracticeSet, classFiles, classFilesCount, classFilesOpen = false, classFolder, defaultFolderName, onSetUpFolder, onSkipFolder }: {
  schedule?: SyllabusScheduleEntry[]
  exams: LessonExam[]
  /** This class's notebooks. */
  lectures: LectureRecord[]
  today?: string
  titleOf: (lecture: LectureRecord) => string
  onOpenNotebook: (id: string) => void
  onNewNotebook: () => void
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
  const lessons = useMemo(() => {
    const fromSyllabus = buildLessons(schedule)
    if (fromSyllabus.length) return fromSyllabus
    // No syllabus lessons: each notebook is a lesson, in class-date order.
    return [...lectures].sort((a, b) => (a.occurredOn ?? '9').localeCompare(b.occurredOn ?? '9') || a.createdAt - b.createdAt)
      .map((lecture, i): LessonRow => ({ lesson: i + 1, dates: lecture.occurredOn ? [lecture.occurredOn.slice(0, 10)] : [] }))
  }, [schedule, lectures])
  const stateOf = useMemo(() => {
    const syllabusLessons = Boolean(schedule?.some((e) => e.lesson !== undefined || e.startDate))
    const sortedNotebooks = [...lectures].sort((a, b) => (a.occurredOn ?? '9').localeCompare(b.occurredOn ?? '9') || a.createdAt - b.createdAt)
    return (row: LessonRow): LessonState => {
      const notebook = syllabusLessons
        ? lectures.find((l) => l.occurredOn && row.dates.includes(l.occurredOn.slice(0, 10))) ?? lectures.find((l) => new RegExp(`\\blesson\\s*${row.lesson}\\b`, 'i').test(l.title))
        : sortedNotebooks[row.lesson - 1]
      const taught = Boolean(notebook) || (row.dates.length > 0 && row.dates[0] <= today)
      return { notebook, flashcards: Boolean(notebook?.flashcardsMadeAt), practice: Boolean(notebook?.practiceSetMadeAt), taught }
    }
  }, [schedule, lectures, today])
  const groups = useMemo(() => groupLessonsByExam(lessons, exams), [lessons, exams])
  const taught = lessons.filter((l) => stateOf(l).taught)
  const current = taught[taught.length - 1]?.lesson
  const [filter, setFilter] = useState<Filter>('all')
  const [openGroups, setOpenGroups] = useState<Set<string>>()
  const [openLessons, setOpenLessons] = useState<Set<number>>()
  const groupOpen = (key: string, hasCurrent: boolean) => openGroups ? openGroups.has(key) : hasCurrent
  const lessonOpen = (n: number) => openLessons ? openLessons.has(n) : n === current
  const toggle = <T,>(set: Set<T> | undefined, fallback: T[], value: T) => { const next = new Set(set ?? fallback); if (next.has(value)) next.delete(value); else next.add(value); return next }
  const needs = (l: LessonRow) => { const s = stateOf(l); return s.taught && !(s.notebook && s.flashcards && s.practice) }
  const shown = (l: LessonRow) => filter === 'all' || (filter === 'needs' ? needs(l) : !stateOf(l).notebook)

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
        const rows = groupTaught.filter(shown).reverse()
        return <section key={group.key} className={cn('lessons-group', open && 'is-open')}>
          <button type="button" className="lessons-ghead" aria-expanded={open} onClick={() => setOpenGroups(toggle(openGroups, groups.filter((g) => g.lessons.some((l) => l.lesson === current)).map((g) => g.key), group.key))}>
            {open ? <ChevronDown aria-hidden="true" /> : <ChevronRight aria-hidden="true" />}
            <span className="t"><b>{group.name}</b>{group.date && ` · ${dateOf(group.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`}</span>
            <span className="r">{group.cumulative ? 'Cumulative · new: ' : ''}{first === last ? `Lesson ${first}` : `Lessons ${first}–${last}`}</span>
            <span className="grow" />
            <span className="s">{groupTaught.length ? `${withNotebook} of ${groupTaught.length} with notebooks` : 'Not taught yet'}</span>
          </button>
          {open && <div className="lessons-gbody">
            {future.length > 0 && <div className="lessons-row is-future"><span className="lessons-num"><CalendarDays aria-hidden="true" /></span><span className="lessons-main"><b>{future.length > 1 ? `Lessons ${future[0].lesson}–${future[future.length - 1].lesson}` : `Lesson ${future[0].lesson}`}</b><small>{future.length} not taught yet · {future.length > 1 ? 'they appear' : 'it appears'} here as the class reaches {future.length > 1 ? 'them' : 'it'}</small></span></div>}
            {rows.map((row) => lessonOpen(row.lesson)
              ? <LessonCard key={row.lesson} row={row} state={stateOf(row)} title={lessonTitle(row, stateOf(row), titleOf)} onCollapse={() => setOpenLessons(toggle(openLessons, current !== undefined ? [current] : [], row.lesson))} onOpenNotebook={onOpenNotebook} onNewNotebook={onNewNotebook} onFlashcards={onFlashcards} onPracticeSet={onPracticeSet} />
              : <LessonLine key={row.lesson} row={row} state={stateOf(row)} current={row.lesson === current} title={lessonTitle(row, stateOf(row), titleOf)} onExpand={() => setOpenLessons(toggle(openLessons, current !== undefined ? [current] : [], row.lesson))} onOpenNotebook={onOpenNotebook} onNewNotebook={onNewNotebook} onFlashcards={onFlashcards} onPracticeSet={onPracticeSet} />)}
            {!rows.length && groupTaught.length > 0 && <p className="lessons-empty">Nothing here matches this filter.</p>}
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

function nextAction(state: LessonState, a: RowActions): [string, () => void, boolean] {
  const nb = state.notebook
  if (!nb) return ['Make notebook', a.onNewNotebook, true]
  if (!state.flashcards) return ['Make flashcards', () => a.onFlashcards(nb.id), false]
  if (!state.practice) return ['Make practice set', () => a.onPracticeSet(nb.id), false]
  return ['Open', () => a.onOpenNotebook(nb.id), false]
}

const PIECES = [['notebook', NotebookText, 'Notebook'], ['flashcards', Layers, 'Flashcards'], ['practice', ListChecks, 'Practice set']] as const

function LessonLine({ row, state, current, title, onExpand, ...actions }: { row: LessonRow; state: LessonState; current: boolean; title: string; onExpand: () => void } & RowActions) {
  const made = { notebook: Boolean(state.notebook), flashcards: state.flashcards, practice: state.practice }
  const done = made.notebook && made.flashcards && made.practice
  const [label, act, primary] = nextAction(state, actions)
  const status = done ? 'All made' : !made.notebook ? 'No notebook yet' : `Notebook${made.flashcards ? ' · flashcards' : ''}`
  return <div className={cn('lessons-row', current && 'is-current', done && 'is-done')}>
    <button type="button" className="lessons-chev" aria-expanded={false} aria-label={`Expand Lesson ${row.lesson}`} onClick={onExpand}><ChevronRight aria-hidden="true" /></button>
    <span className="lessons-num">{row.lesson}</span>
    <button type="button" className="lessons-main" onClick={onExpand}><b>{title}</b><small>{status}</small></button>
    <span className="lessons-pips" aria-label={`${PIECES.filter(([k]) => made[k]).map(([, , n]) => n.toLowerCase()).join(', ') || 'nothing'} made`}>
      {PIECES.map(([key, Icon, name]) => <span key={key} className={cn('lessons-pip', made[key] && 'is-on')} title={`${name}: ${made[key] ? 'made' : 'not made yet'}`}><Icon aria-hidden="true" /></span>)}
    </span>
    <Button size="sm" variant={primary ? 'default' : 'outline'} onClick={act}>{label}</Button>
  </div>
}

function LessonCard({ row, state, title, onCollapse, ...actions }: { row: LessonRow; state: LessonState; title: string; onCollapse: () => void } & RowActions) {
  const nb = state.notebook
  const made = [Boolean(nb), state.flashcards, state.practice]
  const n = made.filter(Boolean).length
  const nextIndex = made.findIndex((m) => !m)
  const when = row.dates.length ? row.dates.map((d) => dateOf(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })).join(' · ') : nb ? 'Notebook saved' : 'No notebook yet'
  const tile = (i: number, Icon: typeof NotebookText, name: string, detail: string, onClick: () => void) =>
    <button type="button" className={cn('lessons-tile', made[i] ? 'is-made' : i === nextIndex ? 'is-next' : 'is-todo')} onClick={onClick}>
      <span className="top"><span className="ic"><Icon aria-hidden="true" /></span>{made[i] ? <span className="chip"><Check aria-hidden="true" />Made</span> : i === nextIndex ? <span className="chip">Next</span> : null}</span>
      <span><span className="nm">{name}</span><span className="dt">{detail}</span></span>
      <span className="go">{made[i] ? 'Open' : 'Make'}<ChevronRight aria-hidden="true" /></span>
    </button>
  return <article className="lessons-card">
    <div className="lessons-card-head">
      <div className="flex min-w-0 items-start gap-2">
        <button type="button" className="lessons-chev" aria-expanded={true} aria-label={`Collapse Lesson ${row.lesson}`} onClick={onCollapse}><ChevronDown aria-hidden="true" /></button>
        <div className="min-w-0"><p className="kicker">Lesson {row.lesson}</p><h3>{title}</h3><p className="meta">{when}</p></div>
      </div>
      <div className="lessons-prog" aria-label={`${n} of 3 made`}><b><em>{n}</em> of 3 made</b><span className="bar">{made.map((m, i) => <i key={i} className={m ? 'is-on' : i === nextIndex ? 'is-next' : ''} />)}</span></div>
    </div>
    <div className="lessons-tiles">
      {tile(0, NotebookText, 'Notebook', nb ? 'Study guide · objectives' : 'From the lesson files', nb ? () => actions.onOpenNotebook(nb.id) : actions.onNewNotebook)}
      {tile(1, Layers, 'Flashcards', state.flashcards ? 'Deck in Anki' : 'From the notebook', nb ? () => actions.onFlashcards(nb.id) : actions.onNewNotebook)}
      {tile(2, BookOpenCheck, 'Practice set', state.practice ? 'Exam-style questions' : 'Exam-style questions', nb ? () => actions.onPracticeSet(nb.id) : actions.onNewNotebook)}
    </div>
  </article>
}
