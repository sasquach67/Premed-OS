import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft, BookOpen, Brain, CalendarClock, CheckCircle2, ChevronDown,
  Clock3, FileText, Filter, FolderOpen, GraduationCap, HelpCircle,
  Mail, MapPin, MoreHorizontal, NotebookText, Play, Plus,
  Sparkles, Target, UserRound, Users,
  TrendingDown,
} from 'lucide-react'
import type {
  AcademicFile, ClassAssignment, ClassCenterData, ClassContact, ClassNote,
  AssignedReading, ClassWorkspace, ClassWorkspaceType, Course, FeedbackNote, GradeCategory, PaperDraft, Person, ReviewEvent, Topic, TopicStatus,
} from '@/lib/types'
import { useStore } from '@/store/store'
import { uid } from '@/lib/id'
import { fmtDeadline, fmtEventDate } from '@/lib/date'
import { createTopicFsrsState } from '@/lib/academics/fsrs'
import { calculateCourseCoverage } from '@/lib/academics/coverage'
import { calculateCourseScenario } from '@/lib/academics/gradeLedger'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/common/useToast'
import { InfoTip } from '@/components/common/InfoTip'
import { PageHeader } from '@/components/common/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger,
} from '@/components/ui/context-menu'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { StatStrip } from '@/components/common/StatStrip'
import { ExamPrepMode } from '@/components/academics/ExamPrepMode'
import { ForgettingCurve } from '@/components/academics/ForgettingCurve'
import { StudyMethodTrack } from '@/components/academics/StudyMethodTrack'
import { StudyMethodPanel } from '@/components/academics/StudyMethodPanel'
import { AssignmentLinkField, TopicLinkField } from '@/components/academics/TopicLinkFields'
import { TopicConnectField } from '@/components/academics/TopicConnectField'
import { MaterialCatalog } from '@/components/academics/MaterialCatalog'
import { retainLocalMaterial } from '@/lib/academics/localMaterialFiles'
import { generateStudyGuide, sourcesFor } from '@/lib/academics/generateStudyGuide'
import { downloadFlashcardApkg, downloadFlashcardTsv } from '@/lib/academics/flashcardExport'
import { PredictPanel } from '@/components/academics/PredictPanel'
import { PretestPanel } from '@/components/academics/PretestPanel'
import { LectureCapturePanel } from '@/components/academics/LectureCapturePanel'
import { CalendarReview } from '@/components/academics/CalendarReview'
import { LearningSignalsPanel } from '@/components/academics/LearningSignalsPanel'
import { MaterialGenerationIntake, type MaterialArtifact } from '@/components/academics/MaterialGenerationIntake'
import { ProfessorEvidencePanel } from '@/components/academics/ProfessorEvidencePanel'
import { AssessmentCatalog } from '@/components/academics/AssessmentCatalog'
import { readLocalBlob } from '@/lib/localBlobStore'

type HubTab = 'overview' | 'materials' | 'topics' | 'readings' | 'assignments' | 'notes'

export interface ClassHubProps {
  course: Course
  workspace: ClassWorkspace
  data: ClassCenterData
  persons: Person[]
}

const STATUS_LABELS: Record<TopicStatus, string> = {
  'not-started': 'Not started',
  seen: 'Covered',
  'notes-made': 'Notes made',
  reviewing: 'Reviewing',
  weak: 'Marked for review',
  ready: 'Marked ready',
}

const STATUS_TONE: Record<TopicStatus, string> = {
  'not-started': 'bg-muted text-muted-foreground',
  seen: 'bg-sky-500/12 text-sky-700 dark:text-sky-200',
  'notes-made': 'bg-violet-500/12 text-violet-700 dark:text-violet-200',
  reviewing: 'bg-amber-500/14 text-amber-800 dark:text-amber-200',
  weak: 'bg-destructive/12 text-destructive',
  ready: 'bg-emerald-500/14 text-emerald-700 dark:text-emerald-200',
}

const COLOR_DOT: Record<string, string> = {
  gray: 'bg-slate-400', brown: 'bg-stone-500', orange: 'bg-orange-500',
  yellow: 'bg-yellow-500', green: 'bg-emerald-500', blue: 'bg-sky-500',
  purple: 'bg-violet-500', pink: 'bg-pink-500', red: 'bg-rose-500',
}

export function ClassHub({ course, workspace, data, persons }: ClassHubProps) {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const requestedTab = params.get('classTab')
  const classType: ClassWorkspaceType = workspace.type ?? (course.bcpm ? 'stem' : 'general')
  const availableTabs = classType === 'stem'
    ? ['overview', 'materials', 'topics', 'assignments', 'notes'] as HubTab[]
    : classType === 'writing'
      ? ['overview', 'materials', 'readings', 'assignments', 'notes'] as HubTab[]
      : ['overview', 'materials', 'assignments', 'notes'] as HubTab[]
  const initialTab = isHubTab(requestedTab) && availableTabs.includes(requestedTab) ? requestedTab : 'overview'
  const [tab, setTab] = useState<HubTab>(initialTab)
  const toast = useToast()
  const courseTopics = ordered(data.topics.filter((item) => item.courseId === course.id))
  const courseFiles = ordered(data.files.filter((item) => item.courseId === course.id))
  const courseNotes = [...data.notes.filter((item) => item.courseId === course.id)].sort((a, b) => b.updatedAt - a.updatedAt)
  const courseAssignments = ordered(data.assignments.filter((item) => item.courseId === course.id))
  const courseContacts = ordered(data.contacts.filter((item) => item.courseId === course.id))
  const courseDrafts = ordered(data.paperDrafts.filter((item) => item.courseId === course.id))
  const courseReadings = ordered(data.assignedReadings.filter((item) => item.courseId === course.id))
  const courseFeedback = ordered(data.feedbackNotes.filter((item) => item.courseId === course.id))
  const stats = hubStats(course, courseTopics, courseAssignments)
  const requestedExamPrepId = params.get('examPrep')
  const requestedExamPrep = requestedExamPrepId
    ? courseAssignments.find((item) => item.id === requestedExamPrepId && item.type === 'exam')
    : undefined

  function changeTab(next: string) {
    if (!isHubTab(next) || !availableTabs.includes(next)) return
    setTab(next)
    const nextParams = new URLSearchParams(params)
    nextParams.set('classTab', next)
    setParams(nextParams, { replace: true })
  }

  function addTopic() {
    const now = Date.now()
    useStore.getState().update((draft) => {
      const topics = draft.academics.classCenter.topics
      topics.push({
        id: uid(), courseId: course.id, title: 'New topic', unit: '',
        status: 'not-started', confidence: 3, sourceNoteIds: [],
        linkedNoteIds: [], linkedAssignmentIds: [], linkedFileIds: [],
        fsrs: createTopicFsrsState(now), createdAt: now, updatedAt: now,
        order: topics.filter((item) => item.courseId === course.id).length,
      })
    })
    changeTab('topics')
    toast({ title: 'Topic added', description: 'Rename it when you are ready.' })
  }

  function startReview() {
    navigate(`/academics/review/${course.id}`)
  }

  function openExamPrep(examId: string) {
    const nextParams = new URLSearchParams(params)
    nextParams.set('examPrep', examId)
    setParams(nextParams)
  }

  function exitExamPrep() {
    const nextParams = new URLSearchParams(params)
    nextParams.delete('examPrep')
    setParams(nextParams)
  }

  function returnToHubTab(next: HubTab) {
    const nextParams = new URLSearchParams(params)
    nextParams.delete('examPrep')
    nextParams.set('classTab', next)
    setParams(nextParams)
    setTab(next)
  }

  if (requestedExamPrep) {
    return <ExamPrepMode
      course={course}
      data={data}
      exam={requestedExamPrep}
      onExit={exitExamPrep}
      onOpenTab={returnToHubTab}
    />
  }

  function primaryAction() {
    if (classType === 'stem') return <Button onClick={startReview}><Play className="size-4" /> Start review</Button>
    if (classType === 'writing') return <Button onClick={() => changeTab('readings')}><NotebookText className="size-4" /> Open current draft</Button>
    return <Button onClick={() => changeTab('assignments')}><Plus className="size-4" /> Add a grade</Button>
  }

  const counts = {
    materials: courseFiles.length,
    topics: courseTopics.length,
    readings: courseReadings.length,
    assignments: courseAssignments.filter((item) => !isComplete(item)).length,
    notes: courseNotes.length,
  }

  return (
    <div className="class-hub space-y-5">
      <Tabs value={tab} onValueChange={changeTab}>
        {/* The class hub wears the same banner as every other Academics
         *  surface (04 §0c): themed art → scrim → glass stat strip floating
         *  over it → underline tabs on the banner's lower edge. The strip is
         *  the only glass here, so the header's own glass wrapper is off. */}
        <PageHeader
          scene="academics"
          title={course.code}
          titleAdornment={<span className={cn('size-3 shrink-0 rounded-full', COLOR_DOT[workspace.color] ?? COLOR_DOT.blue)} aria-hidden="true" />}
          subtitle={course.title}
          actions={(
            <div className="flex shrink-0 items-center gap-2">
              {primaryAction()}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" aria-label="Class actions" className="border-white/25 bg-white/10 text-white hover:bg-white/20 hover:text-white"><MoreHorizontal className="size-4" /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>{classType === 'stem' ? 'Study tools' : 'Class actions'}</DropdownMenuLabel>
                  {classType === 'stem' && <><DropdownMenuItem onClick={() => toast({ title: 'Choose your sources', description: 'Open Materials and select the files to include.' })}>
                    <Sparkles className="size-4" /> Generate study guide
                  </DropdownMenuItem><DropdownMenuSeparator /><DropdownMenuItem onClick={addTopic}><Plus className="size-4" /> Add topic</DropdownMenuItem></>}
                  {classType === 'writing' && <DropdownMenuItem onClick={() => changeTab('readings')}><NotebookText className="size-4" /> Manage drafts and readings</DropdownMenuItem>}
                  {classType === 'general' && <DropdownMenuItem onClick={() => changeTab('assignments')}><Plus className="size-4" /> Add coursework</DropdownMenuItem>}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
          footer={(
            <TabsList className="h-auto w-full justify-start gap-5 overflow-x-auto rounded-none border-0 bg-transparent p-0">
              <HubTabTrigger value="overview" label="Overview" />
              <HubTabTrigger value="materials" label="Materials" count={counts.materials} />
              {classType === 'stem' && <HubTabTrigger value="topics" label="Topics" count={counts.topics} />}
              {classType === 'writing' && <HubTabTrigger value="readings" label="Readings" count={counts.readings} />}
              <HubTabTrigger value="assignments" label="Assignments" count={counts.assignments} />
              <HubTabTrigger value="notes" label="Notes" count={counts.notes} />
            </TabsList>
          )}
          contentGlass={false}
        >
          <div className="flex flex-col gap-3 p-2 lg:flex-row lg:items-center lg:justify-between">
            {/* Class facts are a LINE, not a panel (01 §4b-ii) — fixed facts
             *  don't earn banner space, so only the strip carries metrics. */}
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1 px-1 text-sm font-semibold text-white/72">
              <button
                type="button"
                onClick={() => navigate('/academics?mode=daily&tab=class-center')}
                className="inline-flex min-h-8 items-center gap-1 rounded-lg pr-2 font-bold text-white/72 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <ArrowLeft className="size-4" /> Class Center
              </button>
              <span><UserRound className="mr-1 inline size-3.5" />{workspace.instructor || 'Instructor not set'}</span>
              <span><Clock3 className="mr-1 inline size-3.5" />{meetingText(workspace)}</span>
              <span><MapPin className="mr-1 inline size-3.5" />{workspace.location || 'Location not set'}</span>
              <span className="inline-flex items-center gap-1 font-bold">
                {course.bcpm ? 'BCPM' : 'Non-BCPM'}
                <InfoTip field="course.bcpm" value={course.bcpm} className="border-white/30 text-white/70 hover:bg-white/15 hover:text-white" />
              </span>
              <LinksMenu workspace={workspace} contacts={courseContacts} />
            </div>
            <StatStrip
              variant="banner"
              className="grid-flow-row grid-cols-2 sm:grid-flow-col sm:grid-cols-none"
              metrics={[
                { id: 'grade', label: 'Grade', value: stats.grade, cadence: 'variable' },
                ...(classType === 'stem' ? [
                  { id: 'ready', label: 'Marked ready', value: `${stats.ready}/${courseTopics.length}`, cadence: 'variable' as const },
                  { id: 'due-today', label: 'Due today', value: String(stats.dueToday), cadence: 'variable' as const },
                  { id: 'next-exam', label: 'Next exam', value: stats.examCountdown, cadence: 'variable' as const },
                ] : classType === 'writing' ? [
                  { id: 'next-due', label: 'Next due', value: stats.nextDue, cadence: 'variable' as const },
                  { id: 'draft-stage', label: 'Draft stage', value: currentDraftStage(courseDrafts), cadence: 'variable' as const },
                  { id: 'readings', label: 'Readings behind', value: String(courseReadings.filter((item) => item.status === 'not-started' && item.dueForDiscussion && item.dueForDiscussion < isoToday()).length), cadence: 'variable' as const },
                ] : [
                  { id: 'next-deadline', label: 'Next deadline', value: stats.nextDue, cadence: 'variable' as const },
                  { id: 'credits', label: 'Credits', value: String(course.credits), cadence: 'variable' as const },
                ]),
              ]}
            />
          </div>
        </PageHeader>

        <TabsContent value="overview" className="class-hub-tab"><Overview course={course} data={data} type={classType} topics={courseTopics} drafts={courseDrafts} assignments={courseAssignments} notes={courseNotes} contacts={courseContacts} persons={persons} onTab={changeTab} onOpenExamPrep={openExamPrep} /></TabsContent>
        <TabsContent value="materials" className="class-hub-tab"><Materials courseId={course.id} courseCode={course.code} data={data} files={courseFiles} topics={courseTopics} notes={courseNotes} onTab={changeTab} /></TabsContent>
        <TabsContent value="topics" className="class-hub-tab"><Topics
          courseId={course.id} data={data} topics={courseTopics} assignments={courseAssignments}
          onOpenNotes={(topicId) => {
            // The Notes tab filters to this topic, so the menu item lands on
            // something rather than on an unfiltered list.
            setParams((current) => {
              const next = new URLSearchParams(current)
              next.set('classTab', 'notes')
              next.set('noteTopic', topicId)
              return next
            }, { replace: true })
            changeTab('notes')
          }}
        /></TabsContent>
        <TabsContent value="readings" className="class-hub-tab"><WritingTools courseId={course.id} drafts={courseDrafts} readings={courseReadings} feedback={courseFeedback} assignments={courseAssignments} /></TabsContent>
        <TabsContent value="assignments" className="class-hub-tab"><Assignments assignments={courseAssignments} topics={courseTopics} categories={data.gradeCategories.filter((item) => item.courseId === course.id)} classType={classType} /></TabsContent>
        <TabsContent value="notes" className="class-hub-tab"><Notes courseId={course.id} notes={courseNotes} topics={courseTopics} data={data} onOpenMaterials={() => changeTab('materials')} topicFilter={params.get('noteTopic') ?? undefined} /></TabsContent>
      </Tabs>
    </div>
  )
}

export function ClassHubPeek({
  course, workspace, data, split = false, onOpen,
}: Omit<ClassHubProps, 'persons'> & { split?: boolean; onOpen: () => void }) {
  const classType: ClassWorkspaceType = workspace.type ?? (course.bcpm ? 'stem' : 'general')
  const topics = ordered(data.topics.filter((item) => item.courseId === course.id))
  const assignments = ordered(data.assignments.filter((item) => item.courseId === course.id))
  const stats = hubStats(course, topics, assignments)
  const due = assignments
    .filter((item) => !isComplete(item) && item.dueDate)
    .sort((a, b) => String(a.dueDate).localeCompare(String(b.dueDate)))
  const marked = classType === 'stem' ? topics.filter((item) => item.status === 'weak' || item.status === 'reviewing') : []
  const recordedItems = [
    ...due.map((item) => ({ id: `a-${item.id}`, title: item.title, meta: assignmentDateLabel(item), type: 'assignment' })),
    ...marked.map((item) => ({ id: `t-${item.id}`, title: item.title, meta: STATUS_LABELS[item.status], type: 'topic' })),
  ]

  return (
    <div className={cn('grid gap-0', split && 'lg:grid-cols-[minmax(0,1fr)_minmax(320px,.72fr)]')}>
      <div className="space-y-5 p-5 md:p-7">
        <div className="flex items-start gap-3">
          <span className={cn('mt-2 size-3 rounded-full', COLOR_DOT[workspace.color] ?? COLOR_DOT.blue)} />
          <div>
            <h2 className="font-display text-3xl font-extrabold">{course.code}</h2>
            <p className="font-semibold text-muted-foreground">{course.title}</p>
          </div>
        </div>
        <div className="grid grid-cols-3 overflow-hidden rounded-2xl border border-border bg-card/70">
          <Stat label="Grade" value={stats.grade} />
          <Stat label="Due today" value={String(stats.dueToday)} />
          {classType === 'stem' ? <Stat label="Marked ready" value={`${stats.ready}/${topics.length}`} /> : <Stat label="Credits" value={String(course.credits)} />}
        </div>
        <div>
          <h3 className="font-display text-lg font-extrabold">{classType === 'stem' ? 'Due and marked topics' : 'Due work'}</h3>
          <div className="mt-2 max-h-60 space-y-2 overflow-y-auto">
            {recordedItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-xl border border-border bg-muted/35 px-3 py-2">
                <span className="font-bold">{item.title}</span>
                <Badge variant={item.type === 'topic' ? 'warning' : 'outline'}>{item.meta}</Badge>
              </div>
            ))}
            {!recordedItems.length && <EmptyState icon={CheckCircle2} title="Nothing recorded here" detail={classType === 'stem' ? 'No due assignments or marked review topics are recorded for this class.' : 'No due assignments are recorded for this class.'} />}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {classType === 'stem' && <Button asChild><Link to={`/academics/review/${course.id}`}>Start review</Link></Button>}
          <Button variant="outline" onClick={onOpen}>Open full hub</Button>
        </div>
      </div>
      {split && (
        <aside className="border-t border-border bg-muted/20 p-5 lg:border-l lg:border-t-0">
          <h3 className="font-display text-xl font-extrabold">Assignments</h3>
          <p className="mt-1 text-sm text-muted-foreground">The class stays in view while you scan its work.</p>
          <div className="mt-4 space-y-2">
            {due.map((item) => <AssignmentMini key={item.id} item={item} />)}
            {!due.length && <EmptyState icon={CheckCircle2} title="No open assignments" detail="Everything recorded here is complete." />}
          </div>
        </aside>
      )}
    </div>
  )
}

function Overview({
  course, data, type, topics, drafts, assignments, notes, contacts, persons, onTab, onOpenExamPrep,
}: {
  course: Course
  data: ClassCenterData
  type: ClassWorkspaceType
  topics: Topic[]
  drafts: PaperDraft[]
  assignments: ClassAssignment[]
  notes: ClassNote[]
  contacts: ClassContact[]
  persons: Person[]
  onTab: (tab: string) => void
  onOpenExamPrep: (examId: string) => void
}) {
  const open = assignments.filter((item) => !isComplete(item) && item.dueDate).sort((a, b) => String(a.dueDate).localeCompare(String(b.dueDate)))
  const today = open.filter((item) => item.dueDate === isoToday())
  const exam = open.find((item) => item.type === 'exam')
  const scopedTopics = exam ? topics.filter((item) => (exam.coveredTopicIds ?? []).includes(item.id)) : []
  const recentNotes = notes.filter((item) => item.type === 'lecture').slice(0, 3)
  const graded = assignments.filter(hasGrade)
  const categories = categoryStats(assignments)
  const weightSum = assignments.reduce((sum, item) => sum + (item.weight ?? 0), 0)
  const gradedWeight = assignments.filter(hasGrade).reduce((sum, item) => sum + (item.weight ?? 0), 0)

  if (type !== 'stem') {
    return <NonStemOverview
      course={course} type={type} drafts={drafts} assignments={assignments} notes={notes}
      contacts={contacts} persons={persons} onTab={onTab}
    />
  }

  return (
    <div className="class-hub-overview grid grid-cols-12 gap-4">
      <Panel className="class-hub-primary-band col-span-12" title="Class status" action={<Button size="sm" variant="outline" onClick={() => onTab('topics')}>Open topics</Button>}>
        <div className="grid gap-3 sm:grid-cols-3">
          <StatusMetric label="Course grade" value={course.grade || 'Not graded yet'} />
          <StatusMetric label="Topics ready" value={`${topics.filter((item) => item.status === 'ready').length} of ${topics.length}`} />
          <StatusMetric label="Open work" value={String(open.length)} />
        </div>
      </Panel>

      <Panel className="class-hub-primary-band col-span-12" title="Material coverage" action={<Button size="sm" variant="outline" onClick={() => onTab('materials')}>Open materials</Button>}>
        <CoverageLedger courseId={course.id} data={data} topics={topics} onOpenMaterials={() => onTab('materials')} />
      </Panel>

      <div className="class-hub-primary-band col-span-12">
        <StudyMethodPanel courseId={course.id} topics={topics} events={data.reviewEvents} classType={type} topicLinks={data.topicLinks ?? []} primableTopicIds={new Set((data.keyPoints ?? []).map((point) => point.topicId))} />
      </div>

      {/* §4.1: below the class's primary next action, above its supporting
          class information. Absent entirely when no signal is earned. */}
      <div className="class-hub-primary-band col-span-12">
        <LearningSignalsPanel
          courseId={course.id} topics={topics} events={data.reviewEvents}
          assignments={assignments} classType={type} onTab={onTab}
          topicLinks={data.topicLinks ?? []} allTopics={data.topics}
        />
      </div>

      <Panel className="col-span-12 lg:col-span-4" title="Due today">
        {today.length ? <div className="space-y-2">{today.map((item) => <AssignmentMini key={item.id} item={item} />)}</div> : <EmptyState icon={CheckCircle2} title="Clear for today" detail="No unfinished class work is dated today." />}
        {today.length > 0 && graded.length > 1 && <p className="mt-3 text-xs font-bold text-muted-foreground">At your recorded completion pace, today’s queue is within one focused block.</p>}
      </Panel>

      <Panel className="col-span-12 lg:col-span-4" title="Exam scope" action={exam ? <Button size="sm" variant="outline" onClick={() => onOpenExamPrep(exam.id)}>Exam prep</Button> : undefined}>
        {exam ? (
          <ExamScope exam={exam} topics={scopedTopics} allTopics={topics} events={data.reviewEvents} />
        ) : <EmptyState icon={CalendarClock} title="No upcoming exam" detail="Add an exam and link its covered topics to see scope." />}
      </Panel>

      <Panel className="col-span-12 lg:col-span-4" title="Coming up">
        <div className="space-y-2">
          {open.slice(0, 4).map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-3 rounded-xl bg-muted/35 px-3 py-2">
              <div className="min-w-0"><p className="truncate font-bold">{item.title}</p><p className="text-xs text-muted-foreground">{item.category || titleCase(item.type)}</p></div>
              <div className="text-right"><p className="text-xs font-extrabold">{assignmentDateLabel(item)}</p><p className="text-xs text-muted-foreground">{item.weight != null ? `${item.weight}% weight` : 'Weight not set'}</p></div>
            </div>
          ))}
          {!open.length && <EmptyState icon={CheckCircle2} title="Nothing coming up" detail="No unfinished dated work is recorded." />}
        </div>
      </Panel>

      <Panel className="col-span-12 lg:col-span-5" title="Recently covered">
        <div className="space-y-2">
          {recentNotes.map((note) => {
            const linked = topics.filter((topic) => note.topicIds.includes(topic.id))
            const reviewed = linked.length > 0 && linked.every((topic) => topic.fsrs.reps > 0)
            return (
              <div key={note.id} className="rounded-xl border border-border bg-muted/25 p-3">
                <div className="flex items-center justify-between gap-3"><p className="font-bold">{note.title}</p><Badge variant={reviewed ? 'success' : 'warning'}>{reviewed ? 'Reviewed' : 'Needs recall'}</Badge></div>
                <p className="mt-1 text-xs text-muted-foreground">{note.date || 'Date not set'} · {note.unit || 'Unit not mapped'}</p>
              </div>
            )
          })}
          {!recentNotes.length && <EmptyState icon={NotebookText} title="No lectures logged" detail="Lecture notes will appear here after you capture them." />}
        </div>
      </Panel>

      <Panel className="col-span-12 lg:col-span-4" title="Grade breakdown">
        {categories.length ? (
          <div className="space-y-3">
            <p className="rounded-xl border border-border bg-muted/30 px-3 py-2 text-sm font-extrabold tabular-nums">{formatNumber(gradedWeight)}% of the course grade is in</p>
            {categories.map((item) => <CategoryBar key={item.name} item={item} />)}
            <Separator />
            <p className={cn('text-sm font-extrabold', Math.abs(weightSum - 100) < 0.01 ? 'text-emerald-600' : 'text-amber-700 dark:text-amber-200')}>
              Recorded weights total {formatNumber(weightSum)}% {Math.abs(weightSum - 100) < 0.01 ? '✓' : '— should total 100%'}
            </p>
          </div>
        ) : <EmptyState icon={GraduationCap} title="Not enough graded work yet" detail="Add points and category weights to calculate this breakdown." />}
      </Panel>

      <Panel className="col-span-12 lg:col-span-3" title="Class contacts">
        <div className="space-y-2">
          {contacts.map((contact) => <ContactRow key={contact.id} contact={contact} person={persons.find((person) => person.id === contact.personId)} />)}
          {!contacts.length && <EmptyState icon={Users} title="No contacts yet" detail="Add a professor, TA, or study partner from Class Center." />}
        </div>
      </Panel>

      <div className="class-hub-primary-band col-span-12">
        <ProfessorEvidencePanel courseId={course.id} data={data} assignments={assignments} contacts={contacts} />
      </div>

      <Panel className="col-span-12" title="Recorded recall activity">
        <RecallHistory events={data.reviewEvents.filter((event) => topics.some((topic) => topic.id === event.topicId))} />
      </Panel>
    </div>
  )
}

function NonStemOverview({
  course, type, drafts, assignments, notes, contacts, persons, onTab,
}: {
  course: Course
  type: ClassWorkspaceType
  drafts: PaperDraft[]
  assignments: ClassAssignment[]
  notes: ClassNote[]
  contacts: ClassContact[]
  persons: Person[]
  onTab: (tab: string) => void
}) {
  const open = assignments.filter((item) => !isComplete(item) && item.dueDate).sort((a, b) => String(a.dueDate).localeCompare(String(b.dueDate)))
  const today = open.filter((item) => item.dueDate === isoToday())
  const recentNotes = notes.slice(0, 3)
  const label = type === 'writing' ? 'Open readings' : 'Open assignments'
  const destination = type === 'writing' ? 'readings' : 'assignments'
  return (
    <div className="class-hub-overview grid grid-cols-12 gap-4">
      <Panel className="class-hub-primary-band col-span-12" title="Class status" action={<Button size="sm" variant="outline" onClick={() => onTab(destination)}>{label}</Button>}>
        <div className="grid gap-3 sm:grid-cols-3">
          <StatusMetric label="Course grade" value={course.grade || 'Not graded yet'} />
          <StatusMetric label={type === 'writing' ? 'Open papers' : 'Open work'} value={String(type === 'writing' ? drafts.filter((draft) => draft.stage !== 'submitted').length : open.length)} />
          <StatusMetric label="Credits" value={String(course.credits)} />
        </div>
      </Panel>
      <Panel className="col-span-12 lg:col-span-4" title="Due today">
        {today.length ? <div className="space-y-2">{today.map((item) => <AssignmentMini key={item.id} item={item} />)}</div> : <EmptyState icon={CheckCircle2} title="Clear for today" detail="No unfinished class work is dated today." />}
      </Panel>
      <Panel className="col-span-12 lg:col-span-4" title="Coming up">
        <div className="space-y-2">{open.slice(0, 4).map((item) => <AssignmentMini key={item.id} item={item} />)}{!open.length && <EmptyState icon={CheckCircle2} title="Nothing coming up" detail="No unfinished dated work is recorded." />}</div>
      </Panel>
      <Panel className="col-span-12 lg:col-span-4" title="Recent notes">
        <div className="space-y-2">{recentNotes.map((note) => <NoteRow key={note.id} note={note} />)}{!recentNotes.length && <EmptyState icon={NotebookText} title="No notes yet" detail="Class notes will appear here after you capture them." />}</div>
      </Panel>
      <Panel className="col-span-12" title="Class contacts">
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">{contacts.map((contact) => <ContactRow key={contact.id} contact={contact} person={persons.find((person) => person.id === contact.personId)} />)}{!contacts.length && <EmptyState icon={Users} title="No contacts yet" detail="Add a professor, TA, or study partner from Class Center." />}</div>
      </Panel>
    </div>
  )
}

function WritingTools({ courseId, drafts, readings, feedback, assignments }: { courseId: string; drafts: PaperDraft[]; readings: AssignedReading[]; feedback: FeedbackNote[]; assignments: ClassAssignment[] }) {
  const update = useStore((state) => state.update)
  const incompleteReadings = readings.filter((item) => item.status !== 'read')
  const current = drafts.find((item) => item.stage !== 'submitted')
  const feedbackGroups = feedback.reduce((groups, note) => {
    const key = note.theme.trim().toLocaleLowerCase()
    const currentGroup = groups.get(key) ?? { label: note.theme, notes: [] as FeedbackNote[] }
    currentGroup.notes.push(note)
    groups.set(key, currentGroup)
    return groups
  }, new Map<string, { label: string; notes: FeedbackNote[] }>())
  const [pastedReadings, setPastedReadings] = useState('')
  function patchDraft(id: string, stage: PaperDraft['stage']) {
    update((draft) => {
      const item = draft.academics.classCenter.paperDrafts.find((row) => row.id === id)
      if (item) Object.assign(item, { stage, completedAt: stage === 'submitted' ? Date.now() : undefined, updatedAt: Date.now() })
    })
  }
  function patchReading(id: string, status: AssignedReading['status']) {
    update((draft) => {
      const item = draft.academics.classCenter.assignedReadings.find((row) => row.id === id)
      if (item) Object.assign(item, { status, updatedAt: Date.now() })
    })
  }
  function addPastedReadings() {
    const rows = pastedReadings.split('\n').map((item) => item.trim()).filter(Boolean)
    if (!rows.length) return
    const now = Date.now()
    update((draft) => {
      const target = draft.academics.classCenter.assignedReadings
      rows.forEach((title, index) => target.push({ id: uid(), courseId, week: 'Unscheduled', title, status: 'not-started', createdAt: now, updatedAt: now, order: target.filter((item) => item.courseId === courseId).length + index }))
    })
    setPastedReadings('')
  }
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <Panel title="Current draft" action={<Button size="sm" variant="outline" onClick={() => {
        const now = Date.now(); update((draft) => draft.academics.classCenter.paperDrafts.push({ id: uid(), courseId, title: 'Untitled paper', stage: 'outline', createdAt: now, updatedAt: now, order: draft.academics.classCenter.paperDrafts.filter((item) => item.courseId === courseId).length }))
      }}><Plus className="size-4" /> Add paper</Button>}>
        <div className="space-y-3">{drafts.map((draft) => { const assignment = assignments.find((item) => item.id === draft.assignmentId); return <div key={draft.id} className="rounded-xl border border-border bg-muted p-3"><div className="flex items-center justify-between gap-3"><p className="font-extrabold">{draft.title}</p><Badge variant={draft.stage === 'submitted' ? 'success' : 'outline'}>{titleCase(draft.stage)}</Badge></div><div className="mt-3 flex flex-wrap gap-2">{(['outline', 'draft', 'revision', 'submitted'] as const).map((stage) => <Button key={stage} size="sm" variant={draft.stage === stage ? 'default' : 'outline'} onClick={() => patchDraft(draft.id, stage)}>{titleCase(stage)}</Button>)}</div><div className="mt-3 grid gap-2 text-xs font-semibold text-muted-foreground sm:grid-cols-2"><span>Assignment deadline · {assignment?.dueDate ? fmtDeadline(assignment.dueDate) : 'Not recorded'}</span><label>Your target <Input type="date" value={draft.selfDeadline ?? ''} onChange={(event) => update((state) => { const item = state.academics.classCenter.paperDrafts.find((row) => row.id === draft.id); if (item) Object.assign(item, { selfDeadline: event.target.value || undefined, updatedAt: Date.now() }) })} className="mt-1 h-8" /></label></div></div> })}{!drafts.length && <EmptyState icon={FileText} title="No papers assigned yet" detail="Add a paper when it appears in the syllabus or course site." />}</div>
      </Panel>
      <Panel title="Readings" action={<Button size="sm" variant="outline" onClick={() => {
        const now = Date.now(); update((draft) => draft.academics.classCenter.assignedReadings.push({ id: uid(), courseId, week: 'This week', title: 'Untitled reading', status: 'not-started', createdAt: now, updatedAt: now, order: draft.academics.classCenter.assignedReadings.filter((item) => item.courseId === courseId).length }))
      }}><Plus className="size-4" /> Add reading</Button>}>
        <div className="space-y-2">{readings.map((reading) => <div key={reading.id} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-muted p-3"><div className="min-w-0"><p className="font-extrabold">{reading.title}</p><p className="text-xs text-muted-foreground">{reading.week}{reading.source ? ` · ${reading.source}` : ''}</p></div><Select value={reading.status} onValueChange={(status) => patchReading(reading.id, status as AssignedReading['status'])}><SelectTrigger className="w-32"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="not-started">Not started</SelectItem><SelectItem value="skimmed">Skimmed</SelectItem><SelectItem value="read">Read</SelectItem></SelectContent></Select></div>)}{!readings.length && <EmptyState icon={BookOpen} title="No readings listed yet" detail="Your syllabus doesn't list readings by week — add one, paste a list, or add this week's reading." />}</div>
        <div className="mt-3 rounded-xl border border-border bg-muted p-3"><p className="text-xs font-extrabold uppercase tracking-wide text-muted-foreground">Paste a reading list</p><Textarea value={pastedReadings} onChange={(event) => setPastedReadings(event.target.value)} className="mt-2 min-h-20" placeholder="One reading per line" /><Button size="sm" variant="outline" className="mt-2" disabled={!pastedReadings.trim()} onClick={addPastedReadings}>Add pasted readings</Button></div>
      </Panel>
      <Panel className="xl:col-span-2" title="Feedback log">
        <div className="space-y-2">{[...feedbackGroups.values()].map((group) => <div key={group.label} className="rounded-xl border border-border bg-muted/25 p-3"><div className="flex items-center justify-between gap-2"><p className="font-extrabold">{group.label}</p><span className="text-xs font-bold text-muted-foreground">{group.notes.length >= 2 ? `Recurring · ${group.notes.length} returned notes` : 'One returned note'}</span></div>{group.notes.map((note) => note.quote && <p key={note.id} className="mt-1 text-sm text-muted-foreground">“{note.quote}”</p>)}</div>)}{!feedback.length && <EmptyState icon={NotebookText} title="No feedback logged yet" detail="Capture a professor's recurring note after your first draft returns." />}</div>
      </Panel>
      {current && <p className="sr-only">Current draft: {current.title}</p>}
      {!readings.length && <p className="sr-only">Reading list incomplete.</p>}
      {incompleteReadings.length > 0 && <p className="sr-only">{incompleteReadings.length} readings are not finished.</p>}
    </div>
  )
}

function CoverageLedger({
  courseId,
  data,
  topics,
  onOpenMaterials,
}: {
  courseId: string
  data: ClassCenterData
  topics: Topic[]
  onOpenMaterials: () => void
}) {
  const update = useStore((state) => state.update)
  const [selections, setSelections] = useState<Record<string, string>>({})
  const coverage = useMemo(() => calculateCourseCoverage(courseId, data), [courseId, data])

  function confirmAssignment(chunkId: string) {
    const proposed = data.sourceChunks.find((chunk) => chunk.id === chunkId)
    const topicId = selections[chunkId] || (proposed?.assignmentConfirmed === false ? proposed.topicId : undefined)
    if (!topicId) return
    update((draft) => {
      const chunk = draft.academics.classCenter.sourceChunks.find((item) => item.id === chunkId)
      if (!chunk || chunk.courseId !== courseId) return
      chunk.topicId = topicId
      chunk.assignmentMethod = 'manual'
      chunk.assignmentConfirmed = true
      chunk.updatedAt = Date.now()
    })
  }

  if (!coverage.totalChunks) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-5">
        <p className="font-extrabold">{coverage.unprocessedFiles.length ? 'Materials are waiting to be processed' : 'No source material yet'}</p>
        <p className="mt-1 text-sm font-semibold text-muted-foreground">
          {coverage.unprocessedFiles.length
            ? `${coverage.unprocessedFiles.length} file${coverage.unprocessedFiles.length === 1 ? '' : 's'} remain visible here; none have been silently dropped.`
            : 'Add a syllabus, lecture deck, or note to begin the coverage ledger.'}
        </p>
        <Button size="sm" className="mt-3" onClick={onOpenMaterials}>Open materials</Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_repeat(3,minmax(8rem,.42fr))]">
        <div className="class-hub-metric rounded-2xl p-4">
          <div className="flex items-center justify-between gap-3 text-sm font-extrabold"><span>Confirmed</span><span className="tabular-nums">{coverage.mappedPercent}%</span></div>
          <Progress className="mt-3" value={coverage.mappedPercent} />
          <p className="mt-2 text-xs font-semibold text-muted-foreground">{coverage.mappedChunks} of {coverage.totalChunks} chunks have a student-confirmed topic label.</p>
        </div>
        <CoverageMetric label="Unassigned" value={coverage.unassigned.length} tone={coverage.unassigned.length ? 'warning' : 'neutral'} />
        <CoverageMetric label="Uncovered" value={coverage.uncovered.length} tone={coverage.uncovered.length ? 'warning' : 'neutral'} />
        <CoverageMetric label="Never reviewed" value={coverage.neverReviewed.length} tone={coverage.neverReviewed.length ? 'warning' : 'neutral'} />
      </div>

      {coverage.unassigned.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-muted-foreground">Needs a confirmed topic</p>
          {coverage.unassigned.map(({ chunk, file }) => (
            <div key={chunk.id} className="grid gap-2 rounded-xl border border-amber-500/25 bg-amber-500/7 p-3 md:grid-cols-[minmax(0,1fr)_14rem_auto] md:items-center">
              <div className="min-w-0">
                <p className="truncate font-bold">{file?.title || 'Source file unavailable'}</p>
                <p className="truncate text-xs font-semibold text-muted-foreground">{chunk.content}</p>
              </div>
              <Select value={selections[chunk.id] || (chunk.assignmentConfirmed === false ? chunk.topicId : undefined)} onValueChange={(value) => setSelections((current) => ({ ...current, [chunk.id]: value }))}>
                <SelectTrigger aria-label={`Topic for ${file?.title || 'source chunk'}`}><SelectValue placeholder="Choose topic…" /></SelectTrigger>
                <SelectContent>{topics.map((topic) => <SelectItem key={topic.id} value={topic.id}>{topic.title}</SelectItem>)}</SelectContent>
              </Select>
              <Button size="sm" disabled={!selections[chunk.id] && !(chunk.assignmentConfirmed === false && chunk.topicId)} onClick={() => confirmAssignment(chunk.id)}>Confirm</Button>
            </div>
          ))}
        </div>
      )}

      {coverage.uncovered.length > 0 && (
        <p className="rounded-xl border border-dashed border-amber-500/35 bg-amber-500/7 p-3 text-sm font-semibold">
          {coverage.uncovered.length} chunk{coverage.uncovered.length === 1 ? '' : 's'} {coverage.uncovered.length === 1 ? 'is' : 'are'} not claimed by any key point. The source records stay visible until extraction is reviewed.
        </p>
      )}
      {coverage.neverReviewed.length > 0 && (
        <p className="text-sm font-semibold text-muted-foreground">
          Not yet reviewed: <strong className="text-foreground">{coverage.neverReviewed.map((point) => point.text).join(' · ')}</strong>
        </p>
      )}
    </div>
  )
}

function CoverageMetric({ label, value, tone }: { label: string; value: number; tone: 'warning' | 'neutral' }) {
  return (
    <div className={cn('class-hub-metric rounded-2xl p-4', tone === 'warning' && 'border-amber-500/25 bg-amber-500/7')}>
      <p className="text-xs font-extrabold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-3xl font-extrabold tabular-nums">{value}</p>
    </div>
  )
}

function Materials({
  courseId, courseCode, data, files, topics, notes, onTab,
}: { courseId: string; courseCode: string; data: ClassCenterData; files: AcademicFile[]; topics: Topic[]; notes: ClassNote[]; onTab: (tab: string) => void }) {
  const navigate = useNavigate()
  const toast = useToast()
  const [filter, setFilter] = useState<'all' | 'course' | 'mine' | 'generated' | 'unassigned'>('all')
  const [artifact, setArtifact] = useState<MaterialArtifact | null>(null)
  const groups = useMemo(() => groupFiles(files, topics, notes), [files, notes, topics])
  const visible = groups.map((group) => ({
    ...group,
    files: group.files.filter((file) => filter === 'all' || (filter === 'unassigned' ? group.unit === 'Unassigned' : fileOwnership(file, notes) === filter)),
  })).filter((group) => group.files.length)
  /**
   * The add path Materials never had (§3.1). Same accept list and the same
   * retention mechanism as the syllabus importer — no second blob store, no
   * cloud storage. The unit link is left empty rather than guessed, so the
   * file lands honestly under `Unfiled` until the student files it.
   */
  async function addMaterial() {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.pdf,.docx,image/*,text/plain'
    input.multiple = true
    input.onchange = async () => {
      const picked = Array.from(input.files ?? [])
      if (!picked.length) return
      const retained = await Promise.all(picked.map(async (file) => {
        const id = uid()
        return { file, id, blobRef: await retainLocalMaterial(file, id) }
      }))
      const now = Date.now()
      useStore.getState().update((draft) => {
        const center = draft.academics.classCenter
        retained.forEach(({ file, id, blobRef }) => center.files.unshift({
          id,
          courseId,
          title: file.name.replace(/\.[^.]+$/, '') || file.name,
          type: 'other',
          sourceType: 'upload',
          owner: 'mine',
          url: '',
          blobRef,
          fileName: file.name,
          mimeType: file.type,
          notes: '',
          linkedTopicIds: [],
          createdAt: now,
          updatedAt: now,
          order: center.files.length,
        }))
      })
      toast({ title: retained.length > 1 ? `${retained.length} materials added` : 'Material added', description: 'Filed under Unfiled until you link it to a unit. It stays on this device.' })
    }
    input.click()
  }

  const categories = data.gradeCategories.filter((item) => item.courseId === courseId).sort((a, b) => a.order - b.order)
  function patchCategory(id: string, patch: Partial<GradeCategory>) {
    useStore.getState().update((draft) => {
      const category = draft.academics.classCenter.gradeCategories.find((item) => item.id === id)
      if (category) Object.assign(category, patch, { updatedAt: Date.now() })
    })
  }

  return (
    <div className="space-y-4">
      <SectionToolbar
        title="Materials"
        detail="Course files stay grouped by their linked unit."
        action={<div className="flex flex-wrap items-center gap-2"><Button size="sm" variant="outline" onClick={() => navigate(`/academics?mode=daily&tab=class-center&importFor=${courseId}`)}><FileText className="size-4" /> Import syllabus</Button><DropdownMenu><DropdownMenuTrigger asChild><Button size="sm"><Sparkles className="size-4" /> Create study material</Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={() => setArtifact('flashcards')}><Sparkles className="size-4" /> Generate flashcards</DropdownMenuItem><DropdownMenuItem onClick={() => setArtifact('revised-notes')}><NotebookText className="size-4" /> Generate revised notes</DropdownMenuItem><DropdownMenuItem onClick={() => setArtifact('study-guide')}><BookOpen className="size-4" /> Generate study guide</DropdownMenuItem></DropdownMenuContent></DropdownMenu></div>}
      />
      {artifact && <MaterialGenerationIntake artifact={artifact} courseId={courseId} courseLabel={courseCode} files={files} onClose={() => setArtifact(null)} onAddMaterial={addMaterial} />}
      {/* §4.1 materials extensions — the shelf. Unit → material → provenance. */}
      <MaterialCatalog files={files} topics={topics} />
      <AssessmentCatalog courseId={courseId} data={data} files={files} />
      <FlashcardDecks courseId={courseId} data={data} />
      {/* §6.6 Pretest and Predict — both pre-lecture acts, beside priming. */}
      <PretestPanel topics={topics} />
      <PredictPanel courseId={courseId} topics={topics} />
      {/* §4.1-Q — audio is retained locally; transcript evidence is reviewed here. */}
      <LectureCapturePanel courseId={courseId} data={data} onOpenNotes={() => onTab('notes')} />
      {/* §4.1 — read-only Canvas context through Google Calendar. */}
      <CalendarReview assignments={data.assignments.filter((item) => item.courseId === courseId)} />
      <div className="flex flex-wrap gap-2" aria-label="Material filters">
        {(['all', 'course', 'mine', 'generated', 'unassigned'] as const).map((value) => (
          <Button key={value} size="sm" variant={filter === value ? 'default' : 'outline'} onClick={() => setFilter(value)}>
            {value === 'all' ? 'All' : value === 'course' ? 'From course' : value === 'mine' ? 'My notes' : titleCase(value)}
          </Button>
        ))}
      </div>
      {!!categories.length && <Card className="class-hub-panel">
        <CardHeader className="class-hub-panel-header"><CardTitle>Grade categories</CardTitle><p className="mt-1 text-sm text-muted-foreground">Saved from your syllabus. These are editable records only—grade calculations are not enabled here.</p></CardHeader>
        <CardContent className="class-hub-panel-content space-y-2">{categories.map((category) => <div key={category.id} className="class-hub-record-row grid gap-2 rounded-xl p-3 sm:grid-cols-[1fr_7rem]">
          <Input aria-label="Grade category" value={category.name} onChange={(event) => patchCategory(category.id, { name: event.target.value })} />
          <Input aria-label="Grade category weight" type="number" min="0" max="100" value={category.weight} onChange={(event) => patchCategory(category.id, { weight: Number(event.target.value) || 0 })} />
          {category.policyNote && <p className="text-xs font-semibold text-muted-foreground sm:col-span-2">Policy (verbatim): {category.policyNote}</p>}
          {category.source && <p className="text-xs text-muted-foreground sm:col-span-2">{category.source}</p>}
        </div>)}</CardContent>
      </Card>}
      {visible.map((group) => (
        <Card key={group.unit} className="class-hub-panel">
          <CardHeader className="class-hub-panel-header flex-row items-start justify-between gap-3">
            <div><CardTitle>{group.unit}</CardTitle><p className="mt-1 text-sm text-muted-foreground">Weeks not mapped · {group.ready}/{group.topicCount} linked topics ready</p></div>
            <Badge variant={group.unit === 'Unassigned' ? 'warning' : 'outline'}>{group.files.length} files</Badge>
          </CardHeader>
          <CardContent className="class-hub-panel-content space-y-3">
            {group.unit === 'Unassigned' && <div className="rounded-xl border border-dashed border-amber-500/45 bg-amber-500/8 p-3 text-sm font-semibold">These files have no linked topic, so their position is not known yet. Link a topic to file them without moving or deleting anything.</div>}
            {group.files.map((file) => <FileRow key={file.id} file={file} ownership={fileOwnership(file, notes)} onReimport={file.type === 'syllabus' ? () => navigate(`/academics?mode=daily&tab=class-center&importFor=${courseId}&reimport=1&reimportFile=${file.id}`) : undefined} />)}
            <div className="rounded-2xl border border-violet-500/30 bg-violet-500/9 p-4">
              <p className="font-display font-extrabold text-violet-800 dark:text-violet-100">Prime yourself</p>
              <p className="mt-1 text-sm text-muted-foreground">Write one question you should be able to answer before this module’s next lecture.</p>
              <Button size="sm" variant="outline" className="mt-3" onClick={() => addQuestionNote(courseId, group.unit)}>Add to Notes</Button>
            </div>
          </CardContent>
        </Card>
      ))}
      {!visible.length && <EmptyState icon={FolderOpen} title="No materials in this view" detail={files.length ? 'Try another filter.' : 'Add course files from the class actions menu.'} />}
      <p className="sr-only">{data.files.length} files are stored across all classes.</p>
    </div>
  )
}

function Topics({
  courseId, data, topics, assignments, onOpenNotes,
}: {
  courseId: string
  data: ClassCenterData
  topics: Topic[]
  assignments: ClassAssignment[]
  onOpenNotes: (topicId: string) => void
}) {
  const [filter, setFilter] = useState<'all' | TopicStatus>('all')
  const units = groupTopics(topics.filter((item) => filter === 'all' || item.status === filter))
  const examTopicIds = new Set(assignments.filter((item) => item.type === 'exam' && !isComplete(item)).flatMap((item) => item.coveredTopicIds ?? []))
  // The next uncompleted exam, so a topic's curve can carry its exam line (§4.1-L).
  const exam = assignments.filter((item) => item.type === 'exam' && !isComplete(item) && item.dueDate)
    .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())[0]
  return (
    <div className="space-y-4">
      <SectionToolbar
        title="Topics"
        detail="Syllabus order, recall state, and linked context."
        action={<Button onClick={() => addCoveredTopic(courseId)}><CheckCircle2 className="size-4" /> Covered a topic today</Button>}
      />
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant={filter === 'all' ? 'default' : 'outline'} onClick={() => setFilter('all')}><Filter className="size-4" /> All</Button>
        {(['weak', 'reviewing', 'ready'] as const).map((status) => <Button key={status} size="sm" variant={filter === status ? 'default' : 'outline'} onClick={() => setFilter(status)}>{STATUS_LABELS[status]}</Button>)}
      </div>
      {units.map(([unit, unitTopics]) => {
        const ready = unitTopics.filter((item) => item.status === 'ready').length
        const inScope = unitTopics.some((item) => examTopicIds.has(item.id))
        return (
          <Card key={unit} className="class-hub-panel">
            <CardHeader className="class-hub-panel-header">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div><CardTitle>{unit}</CardTitle><p className="mt-1 text-sm text-muted-foreground">Weeks not mapped · {ready}/{unitTopics.length} ready</p></div>
                {inScope && <Badge variant="warning">Upcoming exam scope</Badge>}
              </div>
              <Progress value={unitTopics.length ? (ready / unitTopics.length) * 100 : 0} />
            </CardHeader>
            <CardContent className="class-hub-panel-content space-y-2">
              {unitTopics.map((topic) => <TopicRow key={topic.id} topic={topic} data={data} exam={exam} onOpenNotes={onOpenNotes} />)}
            </CardContent>
          </Card>
        )
      })}
      {!units.length && <EmptyState icon={Target} title="No topics in this view" detail={topics.length ? 'Choose another status filter.' : 'Capture the first topic covered in class.'} />}
    </div>
  )
}

function Assignments({ assignments, topics, categories, classType }: { assignments: ClassAssignment[]; topics: Topic[]; categories: GradeCategory[]; classType?: ClassWorkspaceType }) {
  const groups = groupAssignments(assignments)
  return (
    <div className="space-y-4">
      <SectionToolbar title="Assignments" detail="Grouped by syllabus category with recorded weights and outcomes." />
      {groups.map(([category, items]) => {
        const complete = items.filter(isComplete)
        const graded = items.filter(hasGrade)
        const earned = graded.reduce((sum, item) => sum + (item.pointsEarned ?? 0), 0)
        const possible = graded.reduce((sum, item) => sum + (item.pointsPossible ?? 0), 0)
        const weight = items.reduce((sum, item) => sum + (item.weight ?? 0), 0)
        return (
          <Card key={category} className="class-hub-panel">
            <CardHeader className="class-hub-panel-header flex-row items-start justify-between gap-3">
              <div><CardTitle>{category}</CardTitle><p className="mt-1 text-sm text-muted-foreground">{complete.length}/{items.length} completed · {possible ? `${formatNumber((earned / possible) * 100)}% average` : 'Not enough graded work yet'}</p></div>
              <Badge variant="outline">{weight ? `${formatNumber(weight)}% weight` : 'Weight not set'}</Badge>
            </CardHeader>
            <CardContent className="class-hub-panel-content space-y-2">{items.map((item) => <AssignmentRow key={item.id} item={item} topics={topics} classType={classType} />)}</CardContent>
          </Card>
        )
      })}
      {!groups.length && <EmptyState icon={FileText} title="No assignments yet" detail="Import a syllabus or add work from the Assignments page." />}
      <WhatIf assignments={assignments} categories={categories} />
    </div>
  )
}

function Notes({ courseId, notes, topics, data, onOpenMaterials, topicFilter }: {
  courseId: string
  notes: ClassNote[]
  topics: Topic[]
  data: ClassCenterData
  onOpenMaterials: () => void
  /** Set when arriving from a topic's menu, so the tab lands on that topic. */
  topicFilter?: string
}) {
  const scoped = topicFilter ? notes.filter((item) => item.topicIds.includes(topicFilter)) : notes
  const focus = topicFilter ? topics.find((item) => item.id === topicFilter) : undefined
  const [, setParams] = useSearchParams()
  const sections = [
    // Generated guides were previously in no section at all, which made a
    // successful generation invisible.
    { key: 'guides', title: 'Study guides', notes: scoped.filter((item) => item.type === 'study-guide') },
    { key: 'exam', title: 'Exam intel', notes: scoped.filter((item) => item.type === 'exam-review') },
    { key: 'questions', title: 'Questions to ask', notes: scoped.filter((item) => item.type === 'question-log') },
    { key: 'priming', title: 'Priming rollup', notes: scoped.filter((item) => item.type === 'reading' && item.title.startsWith('Prime:')) },
    { key: 'lecture', title: 'Lecture notes by unit', notes: scoped.filter((item) => ['lecture', 'lab', 'other'].includes(item.type)) },
  ]
  const topicNotes = topics.map((topic) => ({ topic, notes: notes.filter((note) => note.topicIds.includes(topic.id)) })).filter((item) => item.notes.length)
  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
      <div className="space-y-4">
        <SectionToolbar title="Notes" detail="About this class. Material files remain separate in Materials." action={<Button onClick={() => addBlankNote(courseId)}><Plus className="size-4" />
        {focus && (
          <div className="flex items-center gap-2 rounded-xl border border-border bg-muted px-3 py-2">
            <p className="text-xs font-bold">
              Showing notes linked to <b className="font-display">{focus.title}</b>
              {!scoped.length && ' — there are none yet.'}
            </p>
            <Button
              size="sm" variant="ghost" className="ml-auto"
              onClick={() => setParams((current) => {
                const next = new URLSearchParams(current)
                next.delete('noteTopic')
                return next
              }, { replace: true })}
            >
              Show all notes
            </Button>
          </div>
        )} New note</Button>} />
        <ProfessorRemarkProposals courseId={courseId} data={data} onOpenMaterials={onOpenMaterials} />
        {sections.map((section) => (
          <Card key={section.key} className="class-hub-panel">
            <CardHeader className="class-hub-panel-header"><CardTitle>{section.title}</CardTitle></CardHeader>
            <CardContent className="class-hub-panel-content space-y-2">
              {section.notes.map((note) => <NoteRow key={note.id} note={note} checkbox={section.key === 'questions'} />)}
              {!section.notes.length && <p className="text-sm font-semibold text-muted-foreground">Nothing recorded here yet.</p>}
            </CardContent>
          </Card>
        ))}
      </div>
      <aside className="space-y-3 xl:sticky xl:top-20 xl:self-start">
        <h2 className="font-display text-xl font-extrabold">Topic notes</h2>
        {topicNotes.map(({ topic, notes: linked }) => (
          <Card key={topic.id} className="class-hub-panel"><CardContent className="class-hub-panel-content p-4"><p className="font-extrabold">{topic.title}</p><p className="mt-1 text-sm text-muted-foreground">{linked.map((note) => note.title).join(' · ')}</p></CardContent></Card>
        ))}
        {!topicNotes.length && <EmptyState icon={NotebookText} title="No linked topic notes" detail="Link a class note to a topic to build this rail." />}
      </aside>
    </div>
  )
}

/**
 * Transcript analysis never writes a working class note on its own. This is
 * the deliberate confirmation boundary: every proposed professor remark keeps
 * its exact source quote and timestamp until the student adds or dismisses it.
 */
function ProfessorRemarkProposals({ courseId, data, onOpenMaterials }: { courseId: string; data: ClassCenterData; onOpenMaterials: () => void }) {
  const [playingId, setPlayingId] = useState<string | null>(null)
  const proposals = data.lectureNoteProposals
    .filter((proposal) => proposal.courseId === courseId && proposal.status === 'pending')
    .sort((a, b) => a.order - b.order)

  if (!proposals.length) return null

  async function playSource(proposalId: string) {
    const proposal = data.lectureNoteProposals.find((item) => item.id === proposalId)
    const lecture = proposal ? data.lectures.find((item) => item.id === proposal.lectureId) : undefined
    if (!lecture?.audioBlobRef) {
      onOpenMaterials()
      return
    }
    const blob = await readLocalBlob(lecture.audioBlobRef)
    if (!blob) return
    const audio = new Audio(URL.createObjectURL(blob))
    setPlayingId(proposalId)
    audio.addEventListener('ended', () => setPlayingId((current) => current === proposalId ? null : current), { once: true })
    void audio.play().catch(() => setPlayingId(null))
  }

  function accept(proposalId: string) {
    const now = Date.now()
    useStore.getState().update((draft) => {
      const center = draft.academics.classCenter
      const proposal = center.lectureNoteProposals.find((item) => item.id === proposalId)
      const finding = proposal ? center.lectureFindings.find((item) => item.id === proposal.findingId) : undefined
      const lecture = proposal ? center.lectures.find((item) => item.id === proposal.lectureId) : undefined
      if (!proposal || !finding) return
      proposal.status = 'accepted'
      proposal.updatedAt = now
      center.notes.unshift({
        id: uid(), courseId, title: `Professor remark: ${finding.label}`, type: 'lecture', kind: 'about-class', date: isoToday(), unit: '', topicIds: [],
        content: `Professor remark · ${finding.timestamp}\n\n“${finding.quote}”\n\n${finding.detail}`,
        syncStatus: 'local-only', linkedFileIds: lecture?.transcriptFileId ? [lecture.transcriptFileId] : [], createdAt: now, updatedAt: now, order: center.notes.length,
      })
    })
  }

  function dismiss(proposalId: string) {
    useStore.getState().update((draft) => {
      const proposal = draft.academics.classCenter.lectureNoteProposals.find((item) => item.id === proposalId)
      if (proposal) Object.assign(proposal, { status: 'dismissed', updatedAt: Date.now() })
    })
  }

  return (
    <Card className="class-hub-panel">
      <CardHeader className="class-hub-panel-header">
        <CardTitle>Professor remarks to review</CardTitle>
        <p className="mt-1 text-sm text-muted-foreground">Exact lecture moments about this class. Add one only if it belongs in your working notes.</p>
      </CardHeader>
      <CardContent className="class-hub-panel-content space-y-3">
        {proposals.map((proposal) => {
          const finding = data.lectureFindings.find((item) => item.id === proposal.findingId)
          const lecture = data.lectures.find((item) => item.id === proposal.lectureId)
          if (!finding) return null
          return <article key={proposal.id} className="rounded-xl border border-border bg-muted/25 p-3">
            <div className="flex flex-wrap items-start justify-between gap-2"><div><p className="text-xs font-extrabold uppercase tracking-[0.1em] text-primary">{finding.timestamp} · {finding.label}</p><p className="mt-2 font-display text-base font-extrabold">“{finding.quote}”</p></div><Badge variant="outline">Pending</Badge></div>
            <p className="mt-2 text-sm font-semibold text-muted-foreground">{finding.detail}</p>
            <p className="mt-2 text-xs font-semibold text-muted-foreground">Source: {lecture?.title || 'Lecture transcript'} · {finding.timestamp}</p>
            <div className="mt-3 flex flex-wrap gap-2"><Button size="sm" onClick={() => accept(proposal.id)}>Add to class notes</Button><Button size="sm" variant="outline" onClick={() => void playSource(proposal.id)}>{playingId === proposal.id ? 'Playing…' : lecture?.audioBlobRef ? 'Listen locally' : 'View in Materials'}</Button><Button size="sm" variant="ghost" onClick={() => dismiss(proposal.id)}>Dismiss</Button></div>
          </article>
        })}
      </CardContent>
    </Card>
  )
}

function ExamScope({ exam, topics, allTopics, events }: { exam: ClassAssignment; topics: Topic[]; allTopics: Topic[]; events: ReviewEvent[] }) {
  // §4.1-L entry 2: the exam-scope panel is where the exam-day question is
  // actually asked, so each scoped topic opens its curve here.
  const [curveTopicId, setCurveTopicId] = useState<string | null>(null)
  const curveTopic = topics.find((item) => item.id === curveTopicId)
  if (!(exam.coveredTopicIds?.length)) return <EmptyState icon={Target} title="Scope not mapped" detail={`Link covered topics to ${exam.title} to record its scope.`} />
  const counts = {
    ready: topics.filter((item) => item.status === 'ready').length,
    reviewing: topics.filter((item) => ['reviewing', 'notes-made', 'seen'].includes(item.status)).length,
    review: topics.filter((item) => item.status === 'weak').length,
    notStarted: topics.filter((item) => item.status === 'not-started').length,
  }
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 text-xs font-bold sm:grid-cols-4" aria-label="Student-recorded topic states">
        <Legend color="bg-emerald-500" label={`Marked ready ${counts.ready}`} />
        <Legend color="bg-amber-400" label={`Reviewing ${counts.reviewing}`} />
        <Legend color="bg-destructive" label={`Marked for review ${counts.review}`} />
        <Legend color="bg-muted-foreground" label={`Not started ${counts.notStarted}`} />
      </div>
      <p className="rounded-xl bg-muted/35 p-3 text-xs font-semibold text-muted-foreground">
        Scope comes from the {exam.coveredTopicIds.length} topic links recorded on {exam.title}; {topics.length} match this class’s {allTopics.length} current topics.
      </p>
      <div className="flex flex-wrap gap-1.5">
        {topics.map((item) => (
          <Button
            key={item.id} size="sm" variant={curveTopicId === item.id ? 'default' : 'outline'}
            aria-pressed={curveTopicId === item.id}
            onClick={() => setCurveTopicId((current) => current === item.id ? null : item.id)}
          >
            <TrendingDown className="size-4" /> {item.title}
          </Button>
        ))}
      </div>
      {curveTopic && <ForgettingCurve topic={curveTopic} events={events} exam={exam} />}
    </div>
  )
}

function RecallHistory({ events }: { events: ReviewEvent[] }) {
  const recent = [...events].sort((a, b) => b.timestamp - a.timestamp).slice(0, 6)
  if (!recent.length) return <EmptyState icon={Brain} title="No recall activity yet" detail="Completed topic reviews will appear here as recorded events." />
  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {recent.map((event) => (
        <div key={event.id} className="rounded-xl border border-border bg-muted/25 p-3">
          <p className="font-extrabold">{titleCase(event.grade)}</p>
          <p className="mt-1 text-xs font-semibold text-muted-foreground">{new Date(event.timestamp).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</p>
        </div>
      ))}
    </div>
  )
}

function WhatIf({ assignments, categories }: { assignments: ClassAssignment[]; categories: GradeCategory[] }) {
  const weighted = categories.filter((item) => item.weight > 0)
  const [categoryId, setCategoryId] = useState(weighted[0]?.id ?? '')
  const [assumption, setAssumption] = useState('90')
  const [target, setTarget] = useState('90')
  const selected = weighted.find((item) => item.id === categoryId) ?? weighted[0]
  const scenario = calculateCourseScenario({ assignments, categories: weighted, selectedCategoryId: selected?.id, assumedPercent: Number(assumption), targetPercent: Number(target) })
  return (
    <Card className="class-hub-panel">
      <CardHeader className="class-hub-panel-header"><CardTitle>What-if calculator</CardTitle><p className="text-sm text-muted-foreground">Local scratch work only — nothing here is saved or applied to your grade record.</p></CardHeader>
      <CardContent className="class-hub-panel-content">
        {weighted.length ? (
          <div className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-[1fr_180px_180px]">
            <label className="text-sm font-bold">Category
              <Select value={selected?.id ?? ''} onValueChange={setCategoryId}>
                <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
                <SelectContent>{weighted.map((item) => <SelectItem key={item.id} value={item.id}>{item.name} · {formatNumber(item.weight)}% weight</SelectItem>)}</SelectContent>
              </Select>
            </label>
            <label className="text-sm font-bold">Assumed category %
              <Input className="mt-2" inputMode="decimal" value={assumption} onChange={(event) => setAssumption(event.target.value)} />
            </label>
            <label className="text-sm font-bold">Target course %
              <Input className="mt-2" inputMode="decimal" value={target} onChange={(event) => setTarget(event.target.value)} />
            </label>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="class-hub-record-row rounded-[13px] p-4"><p className="text-xs font-extrabold uppercase tracking-wide text-muted-foreground">Projected course result</p><p className="mt-1 font-display text-3xl font-extrabold tabular-nums">{scenario.projectedPercent == null ? '—' : `${formatNumber(scenario.projectedPercent)}%`}</p><p className="mt-1 text-xs text-muted-foreground">Assumes every other recorded category stays at its current average.</p></div>
              <div className="class-hub-record-row rounded-[13px] p-4"><p className="text-xs font-extrabold uppercase tracking-wide text-muted-foreground">Needed in {selected?.name ?? 'selected category'}</p><p className="mt-1 font-display text-3xl font-extrabold tabular-nums">{scenario.requiredPercent == null ? '—' : `${formatNumber(scenario.requiredPercent)}%`}</p><p className="mt-1 text-xs text-muted-foreground">To reach the target above, based only on recorded category weights.</p></div>
            </div>
            <div className="grid gap-2 text-xs font-semibold text-muted-foreground md:grid-cols-2"><p>{scenario.highestLeverageCategory ? `${scenario.highestLeverageCategory} has the most recorded leverage.` : 'No weighted category has enough data yet.'}</p><p>GPA knock-on stays in Planning until a final letter-grade assumption is chosen.</p></div>
            {scenario.reason && <p className="rounded-[13px] border border-dashed border-[var(--border)] p-3 text-xs font-semibold text-muted-foreground">{scenario.reason}</p>}
            {categories.some((item) => item.policyNote || item.dropLowestCount != null || item.replacementRule != null || item.curvePublished != null) && <div className="rounded-[13px] border border-[var(--border)] bg-[var(--muted)] p-3 text-xs font-semibold text-muted-foreground"><p className="font-extrabold text-foreground">Recorded policies</p>{categories.map((item) => (item.policyNote || item.dropLowestCount != null || item.replacementRule != null || item.curvePublished != null) && <p key={item.id} className="mt-1">{item.name}: {item.policyNote || 'Structured policy recorded'} <span className="text-muted-foreground">— listed, not applied automatically until its rule is fully structured and student-confirmed.</span></p>)}</div>}
          </div>
        ) : <EmptyState icon={HelpCircle} title="Not enough weighted categories yet" detail="Record category, points, and weight before testing a grade scenario." />}
      </CardContent>
    </Card>
  )
}

function TopicRow({ topic, data, exam, onOpenNotes }: {
  topic: Topic
  data: ClassCenterData
  exam?: ClassAssignment
  /** Both menu items route here — one record, two entry points. */
  onOpenNotes: (topicId: string) => void
}) {
  const [curveOpen, setCurveOpen] = useState(false)
  const lastRecall = topic.fsrs.lastReview ? new Date(topic.fsrs.lastReview).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Never'
  const nextReview = topic.fsrs.reps > 0 ? new Date(topic.fsrs.due).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Not scheduled'
  const noteCount = data.notes.filter((note) => note.topicIds.includes(topic.id)).length
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div className="grid gap-3 rounded-xl border border-border bg-muted/25 p-3 md:grid-cols-[minmax(0,1fr)_120px_130px_110px_auto_auto] md:items-center">
          <div><p className="font-extrabold">{topic.title}</p><p className="text-xs text-muted-foreground">MCAT tag not set · {noteCount} notes</p></div>
          <span className="text-xs font-bold text-muted-foreground">Last recall {lastRecall}</span>
          <span className="text-xs font-bold text-muted-foreground">Next review {nextReview}</span>
          <Badge className={cn('justify-self-start', STATUS_TONE[topic.status])}>{STATUS_LABELS[topic.status]}</Badge>
          <StudyMethodTrack topic={topic} events={data.reviewEvents} linkedTopicIds={new Set((data.topicLinks ?? []).flatMap((link) => [link.fromTopicId, link.toTopicId]))} />
          <div className="flex items-center gap-1.5">
            <Button size="sm" variant="ghost" aria-expanded={curveOpen} onClick={() => setCurveOpen((open) => !open)}>
              <TrendingDown className="size-4" /> Will I still know this?
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild><Button size="sm" variant="outline"><Brain className="size-4" /> Quiz me</Button></DropdownMenuTrigger>
              <DropdownMenuContent align="end"><DropdownMenuItem asChild><Link to={`/academics/review/${topic.courseId}?topicId=${topic.id}`}>Recall this topic</Link></DropdownMenuItem><DropdownMenuItem onClick={() => onOpenNotes(topic.id)}>Open linked notes</DropdownMenuItem></DropdownMenuContent>
            </DropdownMenu>
          </div>
          {/* The same link record, written from the topic side. */}
          <AssignmentLinkField topic={topic} />
          {/* §6.6 Connect — the topic graph, authored one relation at a time. */}
          <TopicConnectField topic={topic} />
          {curveOpen && <div className="md:col-span-6"><ForgettingCurve topic={topic} events={data.reviewEvents} exam={exam} /></div>}
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent><ContextMenuItem asChild><Link to={`/academics/review/${topic.courseId}?topicId=${topic.id}`}><Brain className="size-4" /> Quiz me</Link></ContextMenuItem><ContextMenuItem onSelect={() => onOpenNotes(topic.id)}><NotebookText className="size-4" /> Open notes</ContextMenuItem></ContextMenuContent>
    </ContextMenu>
  )
}

function AssignmentRow({ item, topics, classType }: { item: ClassAssignment; topics: Topic[]; classType?: ClassWorkspaceType }) {
  const linked = topics.filter((topic) => [...(item.coveredTopicIds ?? []), ...item.linkedTopicIds].includes(topic.id))
  return (
    <div className="rounded-xl border border-border bg-muted/25 p-3">
      <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_140px_110px_auto] md:items-center">
        <div><p className="font-extrabold">{item.title}</p><p className="text-xs text-muted-foreground">{linked.length ? linked.map((topic) => topic.title).join(', ') : 'No linked topics'}</p></div>
        <span className="text-sm font-bold text-muted-foreground">{assignmentDateLabel(item)}</span>
        <Badge variant={isComplete(item) ? 'success' : item.dueDate && item.dueDate < isoToday() ? 'danger' : 'outline'}>{titleCase(item.status)}</Badge>
        <span className="text-right text-sm font-extrabold tabular-nums">{hasGrade(item) ? `${item.pointsEarned}/${item.pointsPossible}` : item.weight != null ? `${item.weight}%` : '—'}</span>
      </div>
      {/* §4.1: what the work covers, and — on an exam only — what it tests.
          Two fields, never merged. */}
      <TopicLinkField assignment={item} field="coverage" classType={classType} />
      {item.type === 'exam' && <TopicLinkField assignment={item} field="scope" classType={classType} />}
    </div>
  )
}

function FileRow({ file, ownership, onReimport }: { file: AcademicFile; ownership: 'course' | 'mine' | 'generated'; onReimport?: () => void }) {
  const toast = useToast()
  const chunks = useStore((s) => s.academics.classCenter.sourceChunks)
  const [summarising, setSummarising] = useState(false)
  const label = ownership === 'course' ? 'Course' : ownership === 'mine' ? 'Mine' : 'Generated'
  const content = (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/25 p-3 transition hover:-translate-y-0.5 hover:bg-muted/45 motion-reduce:transform-none">
      <div className="flex min-w-0 items-center gap-3"><FileText className="size-4 shrink-0 text-primary" /><div className="min-w-0"><p className="truncate font-extrabold">{file.title}</p><p className="text-xs text-muted-foreground">{titleCase(file.type)} · {file.sourceType}</p></div></div>
      <div className="flex items-center gap-2">
        <Badge variant={ownership === 'generated' ? 'secondary' : 'outline'}>{label}</Badge>
        {file.url && <span className="text-xs font-bold text-primary">Open ↗</span>}
        {onReimport && <Button type="button" size="sm" variant="outline" onClick={(event) => { event.preventDefault(); onReimport() }}>Re-import</Button>}
        <Button
          type="button"
          size="sm"
          variant="ghost"
          disabled={summarising}
          onClick={async (event) => {
            event.preventDefault()
            // §6.2 "summarize / explain a file", grounded in this file's own
            // chunks. A file with none says so rather than generating from the
            // rest of the class behind the student's back.
            setSummarising(true)
            const sources = sourcesFor(chunks, file.courseId, file.id)
            const outcome = await generateStudyGuide({ courseId: file.courseId, chunks: sources, label: file.title })
            setSummarising(false)
            if (!outcome.ok) {
              toast({ title: 'Nothing was saved', description: outcome.message ?? 'This material could not be summarized.' })
              return
            }
            useStore.getState().update((draft) => {
              draft.academics.classCenter.notes.push({
                id: uid(),
                courseId: file.courseId,
                title: outcome.title!,
                type: 'study-guide',
                kind: 'on-material',
                date: isoToday(),
                unit: '',
                topicIds: [],
                content: `${outcome.content}\n\n---\nGenerated from ${file.title} · spec ${outcome.specHash}`,
                syncStatus: 'local-only',
                linkedFileIds: [file.id],
                createdAt: Date.now(),
                updatedAt: Date.now(),
                order: draft.academics.classCenter.notes.length,
              })
            })
            toast({ title: 'Summary generated', description: `Saved to notes as “${outcome.title}”.` })
          }}
        >
          {summarising ? 'Summarizing…' : 'Summarize'}
        </Button>
      </div>
    </div>
  )
  return file.url ? <a href={file.url} target="_blank" rel="noreferrer">{content}</a> : content
}

function NoteRow({ note, checkbox = false }: { note: ClassNote; checkbox?: boolean }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/25 p-3">
      {checkbox ? <Checkbox aria-label={`Mark ${note.title} addressed`} /> : <NotebookText className="mt-0.5 size-4 text-primary" />}
      <div><p className="font-extrabold">{note.title}</p><p className="text-sm text-muted-foreground">{note.content || 'No note text yet.'}</p><p className="mt-1 text-xs text-muted-foreground">{note.unit || 'Unit not mapped'} · {note.date || 'Date not set'}</p></div>
    </div>
  )
}

function LinksMenu({ workspace, contacts }: { workspace: ClassWorkspace; contacts: ClassContact[] }) {
  const contact = contacts[0]
  const links = [
    ['Syllabus', workspace.syllabusUrl], ['Canvas', workspace.canvasUrl],
    ['Drive', workspace.driveFolderUrl], ['GoodNotes', workspace.goodNotesUrl],
  ].filter(([, value]) => Boolean(value))
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="inline-flex items-center gap-1 rounded-md font-bold text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        Office hours & links <ChevronDown className="size-3.5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuLabel>{contact?.officeHours || 'Office hours not set'}</DropdownMenuLabel>
        {contact?.email && <DropdownMenuItem asChild><a href={`mailto:${contact.email}`}><Mail className="size-4" /> Email</a></DropdownMenuItem>}
        <DropdownMenuSeparator />
        {links.map(([label, value]) => <DropdownMenuItem key={label} asChild><a href={value} target="_blank" rel="noreferrer">{label}</a></DropdownMenuItem>)}
        {!links.length && <DropdownMenuItem disabled>No class links yet</DropdownMenuItem>}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/** Level 2 of the three-level nav (01 §4b-i): underline tabs on the banner's
 *  lower edge. Same `.academics-banner-tab` treatment the Academics page tabs
 *  use — one component per job, so the two never drift apart again. */
function HubTabTrigger({ value, label, count }: { value: HubTab; label: string; count?: number }) {
  return (
    <TabsTrigger value={value} className="academics-banner-tab">
      {label}
      {count != null && <span className="tab-count">{count}</span>}
    </TabsTrigger>
  )
}

function Panel({ title, action, className, children }: { title: string; action?: React.ReactNode; className?: string; children: React.ReactNode }) {
  return <Card className={cn('class-hub-panel', className)}><CardHeader className="class-hub-panel-header flex-row items-center justify-between gap-3"><CardTitle>{title}</CardTitle>{action}</CardHeader><CardContent className="class-hub-panel-content">{children}</CardContent></Card>
}

function SectionToolbar({ title, detail, action }: { title: string; detail: string; action?: React.ReactNode }) {
  return <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-display text-2xl font-extrabold">{title}</h2><p className="text-sm font-semibold text-muted-foreground">{detail}</p></div>{action}</div>
}

/** Materials-owned preview. The deck remains inspectable and exportable later;
 * it is never a card-review queue. */
function FlashcardDecks({ courseId, data }: { courseId: string; data: ClassCenterData }) {
  const toast = useToast()
  const decks = data.generatedFlashcardDecks.filter((deck) => deck.courseId === courseId)
  if (!decks.length) return null
  const deck = decks[0]
  const card = deck.cards[0]
  if (!card) return null
  async function downloadApkg() {
    try {
      await downloadFlashcardApkg(deck)
      toast({ title: 'Anki package downloaded', description: 'Import the .apkg in Anki. Anki will own all review and scheduling.' })
    } catch {
      toast({ title: 'Anki export could not start', description: 'Download the TSV instead, then try the package export again.', tone: 'error' })
    }
  }

  return <Card className="class-hub-panel"><CardHeader className="class-hub-panel-header flex-row items-start justify-between gap-3"><div><CardTitle>Flashcards</CardTitle><p className="mt-1 text-sm text-muted-foreground">Generated from your selected class material. Premed OS does not schedule or review these cards.</p></div><Badge variant="outline">{deck.cards.length} cards</Badge></CardHeader><CardContent className="class-hub-panel-content grid gap-4 lg:grid-cols-[minmax(0,1fr)_14rem]"><div className="class-hub-record-row rounded-[13px] p-5"><p className="text-xs font-extrabold uppercase tracking-[0.14em] text-primary">{card.type}</p><p className="mt-3 font-display text-xl font-extrabold">{card.cloze ?? card.front}</p><p className="mt-4 text-sm text-muted-foreground">{card.back}</p>{card.extra && <p className="mt-4 border-l-2 border-primary/40 pl-3 text-sm text-muted-foreground">{card.extra}</p>}</div><aside className="class-hub-record-row rounded-[13px] p-4 text-sm"><p className="font-extrabold">Source</p><p className="mt-1 text-muted-foreground">Material chunk {card.sourceChunkId}</p><p className="mt-4 font-extrabold">Export</p><Button size="sm" className="mt-2 w-full" onClick={() => void downloadApkg()}>Download Anki package</Button><Button size="sm" variant="outline" className="mt-2 w-full" onClick={() => downloadFlashcardTsv(deck)}>Download TSV</Button><p className="mt-3 text-xs text-muted-foreground">One-way export. Anki schedules and reviews cards after import.</p></aside></CardContent></Card>
}

function Stat({ label, value }: { label: string; value: string }) {
  return <div className="border-b border-border/70 p-3 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0"><p className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">{label}</p><p className="mt-1 font-display text-xl font-extrabold tabular-nums">{value}</p></div>
}

function StatusMetric({ label, value }: { label: string; value: string }) {
  return <div className="class-hub-metric rounded-2xl p-4"><p className="text-xs font-extrabold uppercase tracking-wide text-muted-foreground">{label}</p><p className="mt-1 font-display text-2xl font-extrabold tabular-nums">{value}</p></div>
}

function EmptyState({ icon: Icon, title, detail }: { icon: typeof BookOpen; title: string; detail: string }) {
  return <div className="rounded-2xl border border-dashed border-border p-5 text-center"><Icon className="mx-auto size-6 text-muted-foreground" /><p className="mt-2 font-extrabold">{title}</p><p className="mt-1 text-sm text-muted-foreground">{detail}</p></div>
}

function AssignmentMini({ item }: { item: ClassAssignment }) {
  return <div className="class-hub-record-row flex items-center justify-between gap-3 rounded-xl px-3 py-2"><div className="min-w-0"><p className="truncate font-bold">{item.title}</p><p className="text-xs text-muted-foreground">{titleCase(item.type)}</p></div><Badge variant={item.dueDate && item.dueDate < isoToday() ? 'danger' : 'outline'}>{assignmentDateLabel(item)}</Badge></div>
}

function Legend({ color, label }: { color: string; label: string }) {
  return <span className="inline-flex items-center gap-1.5"><span className={cn('size-2 rounded-full', color)} />{label}</span>
}

function ContactRow({ contact, person }: { contact: ClassContact; person?: Person }) {
  const name = person?.name || contact.name
  const email = person?.email || contact.email
  return <div className="class-hub-record-row rounded-xl p-3"><p className="font-extrabold">{name}</p><p className="text-xs text-muted-foreground">{titleCase(contact.role)} · {contact.officeHours || 'Office hours not set'}</p>{email && <a className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-primary" href={`mailto:${email}`}><Mail className="size-3" /> {email}</a>}</div>
}

function CategoryBar({ item }: { item: CategoryStat }) {
  return <div><div className="mb-1 flex justify-between gap-3 text-sm font-bold"><span>{item.name}</span><span className="tabular-nums text-muted-foreground">{item.average == null ? 'Not graded' : `${formatNumber(item.average)}%`} · {formatNumber(item.weight)}% wt</span></div>{item.average != null && <Progress value={item.average} />}</div>
}

function addQuestionNote(courseId: string, unit: string) {
  const now = Date.now()
  useStore.getState().update((draft) => {
    const notes = draft.academics.classCenter.notes
    notes.unshift({ id: uid(), courseId, title: `Prime: ${unit}`, type: 'reading', kind: 'about-class', date: isoToday(), unit, topicIds: [], content: '', syncStatus: 'local-only', linkedFileIds: [], createdAt: now, updatedAt: now, order: notes.length })
  })
}

function addBlankNote(courseId: string) {
  const now = Date.now()
  useStore.getState().update((draft) => {
    const notes = draft.academics.classCenter.notes
    notes.unshift({ id: uid(), courseId, title: 'Untitled class note', type: 'lecture', kind: 'about-class', date: isoToday(), unit: '', topicIds: [], content: '', syncStatus: 'local-only', linkedFileIds: [], createdAt: now, updatedAt: now, order: notes.length })
  })
}

function addCoveredTopic(courseId: string) {
  const now = Date.now()
  useStore.getState().update((draft) => {
    const topics = draft.academics.classCenter.topics
    topics.push({ id: uid(), courseId, title: 'Topic covered today', unit: '', status: 'seen', confidence: 3, sourceNoteIds: [], linkedNoteIds: [], linkedAssignmentIds: [], linkedFileIds: [], fsrs: createTopicFsrsState(now), createdAt: now, updatedAt: now, order: topics.filter((item) => item.courseId === courseId).length })
  })
}

function hubStats(course: Course, topics: Topic[], assignments: ClassAssignment[]) {
  const today = isoToday()
  const exam = assignments.filter((item) => item.type === 'exam' && !isComplete(item) && item.dueDate).sort((a, b) => String(a.dueDate).localeCompare(String(b.dueDate)))[0]
  const next = assignments.filter((item) => !isComplete(item) && item.dueDate).sort((a, b) => String(a.dueDate).localeCompare(String(b.dueDate)))[0]
  return {
    grade: course.grade || (coursePercent(assignments) == null ? '—' : `${formatNumber(coursePercent(assignments)!)}%`),
    ready: topics.filter((item) => item.status === 'ready').length,
    dueToday: assignments.filter((item) => item.dueDate === today && !isComplete(item)).length,
    nextDue: next ? assignmentDateLabel(next) : '—',
    // Banner metrics are short by design (04 §0c "6d"), so the empty case is a
    // dash rather than a sentence that has to truncate inside the strip.
    examCountdown: exam ? assignmentDateLabel(exam) : '—',
  }
}

function currentDraftStage(drafts: PaperDraft[]) {
  return titleCase(drafts.find((item) => item.stage !== 'submitted')?.stage ?? '—')
}

function coursePercent(assignments: ClassAssignment[]) {
  const graded = assignments.filter(hasGrade)
  const earned = graded.reduce((sum, item) => sum + (item.pointsEarned ?? 0), 0)
  const possible = graded.reduce((sum, item) => sum + (item.pointsPossible ?? 0), 0)
  return possible ? earned / possible * 100 : null
}

interface CategoryStat { name: string; average: number | null; weight: number }

function categoryStats(assignments: ClassAssignment[]): CategoryStat[] {
  const groups = groupAssignments(assignments)
  return groups.map(([name, items]) => {
    const graded = items.filter(hasGrade)
    const earned = graded.reduce((sum, item) => sum + (item.pointsEarned ?? 0), 0)
    const possible = graded.reduce((sum, item) => sum + (item.pointsPossible ?? 0), 0)
    return { name, average: possible ? earned / possible * 100 : null, weight: items.reduce((sum, item) => sum + (item.weight ?? 0), 0) }
  })
}

function groupAssignments(assignments: ClassAssignment[]) {
  const map = new Map<string, ClassAssignment[]>()
  for (const item of assignments) {
    const key = item.category?.trim() || 'Uncategorized'
    map.set(key, [...(map.get(key) ?? []), item])
  }
  return [...map.entries()]
}

function groupTopics(topics: Topic[]) {
  const map = new Map<string, Topic[]>()
  for (const topic of topics) {
    const key = topic.unit?.trim() || 'Unit not mapped'
    map.set(key, [...(map.get(key) ?? []), topic])
  }
  return [...map.entries()]
}

function groupFiles(files: AcademicFile[], topics: Topic[], notes: ClassNote[]) {
  const map = new Map<string, AcademicFile[]>()
  for (const file of files) {
    const linkedIds = new Set([file.topicId, ...file.linkedTopicIds].filter(Boolean))
    const units = [...new Set(topics.filter((topic) => linkedIds.has(topic.id)).map((topic) => topic.unit?.trim()).filter(Boolean))]
    const key = units.join(', ') || 'Unassigned'
    map.set(key, [...(map.get(key) ?? []), file])
  }
  return [...map.entries()].map(([unit, groupedFiles]) => {
    const unitTopics = topics.filter((topic) => topic.unit === unit)
    return { unit, files: groupedFiles, ready: unitTopics.filter((topic) => topic.status === 'ready').length, topicCount: unitTopics.length, ownership: groupedFiles.map((file) => fileOwnership(file, notes)) }
  })
}

function fileOwnership(file: AcademicFile, notes: ClassNote[]): 'course' | 'mine' | 'generated' {
  if (notes.some((note) => note.linkedFileIds.includes(file.id))) return 'mine'
  if (file.type === 'study-guide') return 'generated'
  return 'course'
}

function hasGrade(item: ClassAssignment) {
  return item.status === 'graded' && item.pointsEarned != null && item.pointsPossible != null && item.pointsPossible > 0
}

function isComplete(item: ClassAssignment) {
  return item.status === 'submitted' || item.status === 'graded'
}

function meetingText(workspace: ClassWorkspace) {
  const value = [workspace.meetingDays, workspace.meetingTime].filter(Boolean).join(' · ')
  return value || 'Meeting time not set'
}

function assignmentDateLabel(item: Pick<ClassAssignment, 'dueDate' | 'type'>) {
  return item.type === 'exam' ? fmtEventDate(item.dueDate) : fmtDeadline(item.dueDate)
}

function ordered<T extends { order: number }>(items: T[]) {
  return [...items].sort((a, b) => a.order - b.order)
}

function isHubTab(value: string | null): value is HubTab {
  return value === 'overview' || value === 'materials' || value === 'topics' || value === 'readings' || value === 'assignments' || value === 'notes'
}

function isoToday() {
  return new Date().toISOString().slice(0, 10)
}

function titleCase(value: string) {
  return value.replace(/-/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function formatNumber(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1)
}
