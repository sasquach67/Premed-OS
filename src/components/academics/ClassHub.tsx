import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft, BookOpen, Brain, CalendarClock, CheckCircle2, ChevronDown,
  Clock3, FileText, Filter, FolderOpen, GraduationCap, HelpCircle,
  Mail, MapPin, MoreHorizontal, NotebookText, Play, Plus,
  Sparkles, Target, UserRound, Users,
} from 'lucide-react'
import type {
  AcademicFile, ClassAssignment, ClassCenterData, ClassContact, ClassNote,
  AssignedReading, ClassWorkspace, ClassWorkspaceType, Course, FeedbackNote, GradeCategory, PaperDraft, Person, ReviewEvent, Topic, TopicStatus,
} from '@/lib/types'
import { useStore } from '@/store/store'
import { uid } from '@/lib/id'
import { createTopicFsrsState } from '@/lib/academics/fsrs'
import { calculateCourseCoverage } from '@/lib/academics/coverage'
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
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { StatStrip } from '@/components/common/StatStrip'

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
    <div className="space-y-5">
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

        <TabsContent value="overview"><Overview course={course} data={data} type={classType} topics={courseTopics} drafts={courseDrafts} assignments={courseAssignments} notes={courseNotes} contacts={courseContacts} persons={persons} onTab={changeTab} /></TabsContent>
        <TabsContent value="materials"><Materials courseId={course.id} data={data} files={courseFiles} topics={courseTopics} notes={courseNotes} onTab={changeTab} /></TabsContent>
        <TabsContent value="topics"><Topics courseId={course.id} data={data} topics={courseTopics} assignments={courseAssignments} /></TabsContent>
        <TabsContent value="readings"><WritingTools courseId={course.id} drafts={courseDrafts} readings={courseReadings} feedback={courseFeedback} /></TabsContent>
        <TabsContent value="assignments"><Assignments assignments={courseAssignments} topics={courseTopics} /></TabsContent>
        <TabsContent value="notes"><Notes courseId={course.id} notes={courseNotes} topics={courseTopics} /></TabsContent>
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
    ...due.map((item) => ({ id: `a-${item.id}`, title: item.title, meta: item.dueDate ? relativeDate(item.dueDate) : 'No date', type: 'assignment' })),
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
  course, data, type, topics, drafts, assignments, notes, contacts, persons, onTab,
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
    <div className="grid grid-cols-12 gap-4">
      <Panel className="col-span-12" title="Class status" action={<Button size="sm" variant="outline" onClick={() => onTab('topics')}>Open topics</Button>}>
        <div className="grid gap-3 sm:grid-cols-3">
          <StatusMetric label="Course grade" value={course.grade || 'Not graded yet'} />
          <StatusMetric label="Topics ready" value={`${topics.filter((item) => item.status === 'ready').length} of ${topics.length}`} />
          <StatusMetric label="Open work" value={String(open.length)} />
        </div>
      </Panel>

      <Panel className="col-span-12" title="Material coverage" action={<Button size="sm" variant="outline" onClick={() => onTab('materials')}>Open materials</Button>}>
        <CoverageLedger courseId={course.id} data={data} topics={topics} onOpenMaterials={() => onTab('materials')} />
      </Panel>

      <Panel className="col-span-12 lg:col-span-4" title="Due today">
        {today.length ? <div className="space-y-2">{today.map((item) => <AssignmentMini key={item.id} item={item} />)}</div> : <EmptyState icon={CheckCircle2} title="Clear for today" detail="No unfinished class work is dated today." />}
        {today.length > 0 && graded.length > 1 && <p className="mt-3 text-xs font-bold text-muted-foreground">At your recorded completion pace, today’s queue is within one focused block.</p>}
      </Panel>

      <Panel className="col-span-12 lg:col-span-4" title="Exam scope">
        {exam ? (
          <ExamScope exam={exam} topics={scopedTopics} allTopics={topics} />
        ) : <EmptyState icon={CalendarClock} title="No upcoming exam" detail="Add an exam and link its covered topics to see scope." />}
      </Panel>

      <Panel className="col-span-12 lg:col-span-4" title="Coming up">
        <div className="space-y-2">
          {open.slice(0, 4).map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-3 rounded-xl bg-muted/35 px-3 py-2">
              <div className="min-w-0"><p className="truncate font-bold">{item.title}</p><p className="text-xs text-muted-foreground">{item.category || titleCase(item.type)}</p></div>
              <div className="text-right"><p className="text-xs font-extrabold">{item.dueDate ? relativeDate(item.dueDate) : 'No date'}</p><p className="text-xs text-muted-foreground">{item.weight != null ? `${item.weight}% weight` : 'Weight not set'}</p></div>
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
    <div className="grid grid-cols-12 gap-4">
      <Panel className="col-span-12" title="Class status" action={<Button size="sm" variant="outline" onClick={() => onTab(destination)}>{label}</Button>}>
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

function WritingTools({ courseId, drafts, readings, feedback }: { courseId: string; drafts: PaperDraft[]; readings: AssignedReading[]; feedback: FeedbackNote[] }) {
  const update = useStore((state) => state.update)
  const incompleteReadings = readings.filter((item) => item.status !== 'read')
  const current = drafts.find((item) => item.stage !== 'submitted')
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
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <Panel title="Drafts" action={<Button size="sm" variant="outline" onClick={() => {
        const now = Date.now(); update((draft) => draft.academics.classCenter.paperDrafts.push({ id: uid(), courseId, title: 'Untitled paper', stage: 'outline', createdAt: now, updatedAt: now, order: draft.academics.classCenter.paperDrafts.filter((item) => item.courseId === courseId).length }))
      }}><Plus className="size-4" /> Add paper</Button>}>
        <div className="space-y-3">{drafts.map((draft) => <div key={draft.id} className="rounded-xl border border-border bg-muted/25 p-3"><div className="flex items-center justify-between gap-3"><p className="font-extrabold">{draft.title}</p><Badge variant={draft.stage === 'submitted' ? 'success' : 'outline'}>{titleCase(draft.stage)}</Badge></div><div className="mt-3 flex flex-wrap gap-2">{(['outline', 'draft', 'revision', 'submitted'] as const).map((stage) => <Button key={stage} size="sm" variant={draft.stage === stage ? 'default' : 'outline'} onClick={() => patchDraft(draft.id, stage)}>{titleCase(stage)}</Button>)}</div>{draft.selfDeadline && <p className="mt-2 text-xs font-semibold text-muted-foreground">Your deadline · {relativeDate(draft.selfDeadline)}</p>}</div>)}{!drafts.length && <EmptyState icon={FileText} title="No papers assigned yet" detail="Add a paper when it appears in the syllabus or course site." />}</div>
      </Panel>
      <Panel title="Readings" action={<Button size="sm" variant="outline" onClick={() => {
        const now = Date.now(); update((draft) => draft.academics.classCenter.assignedReadings.push({ id: uid(), courseId, week: 'This week', title: 'Untitled reading', status: 'not-started', createdAt: now, updatedAt: now, order: draft.academics.classCenter.assignedReadings.filter((item) => item.courseId === courseId).length }))
      }}><Plus className="size-4" /> Add reading</Button>}>
        <div className="space-y-2">{readings.map((reading) => <div key={reading.id} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/25 p-3"><div className="min-w-0"><p className="font-extrabold">{reading.title}</p><p className="text-xs text-muted-foreground">{reading.week}{reading.source ? ` · ${reading.source}` : ''}</p></div><Select value={reading.status} onValueChange={(status) => patchReading(reading.id, status as AssignedReading['status'])}><SelectTrigger className="w-32"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="not-started">Not started</SelectItem><SelectItem value="skimmed">Skimmed</SelectItem><SelectItem value="read">Read</SelectItem></SelectContent></Select></div>)}{!readings.length && <EmptyState icon={BookOpen} title="No readings listed yet" detail="Your syllabus doesn't list readings by week — add them as they are assigned." />}</div>
      </Panel>
      <Panel className="xl:col-span-2" title="Feedback log">
        <div className="space-y-2">{feedback.map((note) => <div key={note.id} className="rounded-xl border border-border bg-muted/25 p-3"><p className="font-extrabold">{note.theme}</p>{note.quote && <p className="mt-1 text-sm text-muted-foreground">“{note.quote}”</p>}</div>)}{!feedback.length && <EmptyState icon={NotebookText} title="No feedback logged yet" detail="Capture a professor's recurring note after your first draft returns." />}</div>
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
        <div className="rounded-2xl border border-border bg-card/66 p-4 shadow-sm backdrop-blur">
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
    <div className={cn('rounded-2xl border p-4 shadow-sm backdrop-blur', tone === 'warning' ? 'border-amber-500/25 bg-amber-500/7' : 'border-border bg-card/66')}>
      <p className="text-xs font-extrabold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-3xl font-extrabold tabular-nums">{value}</p>
    </div>
  )
}

function Materials({
  courseId, data, files, topics, notes, onTab,
}: { courseId: string; data: ClassCenterData; files: AcademicFile[]; topics: Topic[]; notes: ClassNote[]; onTab: (tab: string) => void }) {
  const navigate = useNavigate()
  const [filter, setFilter] = useState<'all' | 'course' | 'mine' | 'generated' | 'unassigned'>('all')
  const groups = useMemo(() => groupFiles(files, topics, notes), [files, notes, topics])
  const visible = groups.map((group) => ({
    ...group,
    files: group.files.filter((file) => filter === 'all' || (filter === 'unassigned' ? group.unit === 'Unassigned' : fileOwnership(file, notes) === filter)),
  })).filter((group) => group.files.length)
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
        action={<div className="flex items-center gap-2"><Button size="sm" variant="outline" onClick={() => navigate(`/academics?mode=daily&tab=class-center&importFor=${courseId}`)}><FileText className="size-4" /> Import syllabus</Button><StudyToolActions onOpenNotes={() => onTab('notes')} /></div>}
      />
      <div className="flex flex-wrap gap-2" aria-label="Material filters">
        {(['all', 'course', 'mine', 'generated', 'unassigned'] as const).map((value) => (
          <Button key={value} size="sm" variant={filter === value ? 'default' : 'outline'} onClick={() => setFilter(value)}>
            {value === 'all' ? 'All' : value === 'course' ? 'From course' : value === 'mine' ? 'My notes' : titleCase(value)}
          </Button>
        ))}
      </div>
      {!!categories.length && <Card>
        <CardHeader><CardTitle>Grade categories</CardTitle><p className="mt-1 text-sm text-muted-foreground">Saved from your syllabus. These are editable records only—grade calculations are not enabled here.</p></CardHeader>
        <CardContent className="space-y-2">{categories.map((category) => <div key={category.id} className="grid gap-2 rounded-xl border border-border bg-muted/20 p-3 sm:grid-cols-[1fr_7rem]">
          <Input aria-label="Grade category" value={category.name} onChange={(event) => patchCategory(category.id, { name: event.target.value })} />
          <Input aria-label="Grade category weight" type="number" min="0" max="100" value={category.weight} onChange={(event) => patchCategory(category.id, { weight: Number(event.target.value) || 0 })} />
          {category.policyNote && <p className="text-xs font-semibold text-muted-foreground sm:col-span-2">Policy (verbatim): {category.policyNote}</p>}
          {category.source && <p className="text-xs text-muted-foreground sm:col-span-2">{category.source}</p>}
        </div>)}</CardContent>
      </Card>}
      {visible.map((group) => (
        <Card key={group.unit}>
          <CardHeader className="flex-row items-start justify-between gap-3">
            <div><CardTitle>{group.unit}</CardTitle><p className="mt-1 text-sm text-muted-foreground">Weeks not mapped · {group.ready}/{group.topicCount} linked topics ready</p></div>
            <Badge variant={group.unit === 'Unassigned' ? 'warning' : 'outline'}>{group.files.length} files</Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            {group.unit === 'Unassigned' && <div className="rounded-xl border border-dashed border-amber-500/45 bg-amber-500/8 p-3 text-sm font-semibold">These files have no linked topic, so their position is not known yet. Link a topic to file them without moving or deleting anything.</div>}
            {group.files.map((file) => <FileRow key={file.id} file={file} ownership={fileOwnership(file, notes)} />)}
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
  courseId, data, topics, assignments,
}: { courseId: string; data: ClassCenterData; topics: Topic[]; assignments: ClassAssignment[] }) {
  const [filter, setFilter] = useState<'all' | TopicStatus>('all')
  const units = groupTopics(topics.filter((item) => filter === 'all' || item.status === filter))
  const examTopicIds = new Set(assignments.filter((item) => item.type === 'exam' && !isComplete(item)).flatMap((item) => item.coveredTopicIds ?? []))
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
          <Card key={unit}>
            <CardHeader>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div><CardTitle>{unit}</CardTitle><p className="mt-1 text-sm text-muted-foreground">Weeks not mapped · {ready}/{unitTopics.length} ready</p></div>
                {inScope && <Badge variant="warning">Upcoming exam scope</Badge>}
              </div>
              <Progress value={unitTopics.length ? (ready / unitTopics.length) * 100 : 0} />
            </CardHeader>
            <CardContent className="space-y-2">
              {unitTopics.map((topic) => <TopicRow key={topic.id} topic={topic} data={data} />)}
            </CardContent>
          </Card>
        )
      })}
      {!units.length && <EmptyState icon={Target} title="No topics in this view" detail={topics.length ? 'Choose another status filter.' : 'Capture the first topic covered in class.'} />}
    </div>
  )
}

function Assignments({ assignments, topics }: { assignments: ClassAssignment[]; topics: Topic[] }) {
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
          <Card key={category}>
            <CardHeader className="flex-row items-start justify-between gap-3">
              <div><CardTitle>{category}</CardTitle><p className="mt-1 text-sm text-muted-foreground">{complete.length}/{items.length} completed · {possible ? `${formatNumber((earned / possible) * 100)}% average` : 'Not enough graded work yet'}</p></div>
              <Badge variant="outline">{weight ? `${formatNumber(weight)}% weight` : 'Weight not set'}</Badge>
            </CardHeader>
            <CardContent className="space-y-2">{items.map((item) => <AssignmentRow key={item.id} item={item} topics={topics} />)}</CardContent>
          </Card>
        )
      })}
      {!groups.length && <EmptyState icon={FileText} title="No assignments yet" detail="Import a syllabus or add work from the Assignments page." />}
      <WhatIf assignments={assignments} />
    </div>
  )
}

function Notes({ courseId, notes, topics }: { courseId: string; notes: ClassNote[]; topics: Topic[] }) {
  const sections = [
    { key: 'exam', title: 'Exam intel', notes: notes.filter((item) => item.type === 'exam-review') },
    { key: 'questions', title: 'Questions to ask', notes: notes.filter((item) => item.type === 'question-log') },
    { key: 'priming', title: 'Priming rollup', notes: notes.filter((item) => item.type === 'reading' && item.title.startsWith('Prime:')) },
    { key: 'lecture', title: 'Lecture notes by unit', notes: notes.filter((item) => ['lecture', 'lab', 'other'].includes(item.type)) },
  ]
  const topicNotes = topics.map((topic) => ({ topic, notes: notes.filter((note) => note.topicIds.includes(topic.id)) })).filter((item) => item.notes.length)
  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
      <div className="space-y-4">
        <SectionToolbar title="Notes" detail="About this class. Material files remain separate in Materials." action={<Button onClick={() => addBlankNote(courseId)}><Plus className="size-4" /> New note</Button>} />
        {sections.map((section) => (
          <Card key={section.key}>
            <CardHeader><CardTitle>{section.title}</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {section.notes.map((note) => <NoteRow key={note.id} note={note} checkbox={section.key === 'questions'} />)}
              {!section.notes.length && <p className="text-sm font-semibold text-muted-foreground">Nothing recorded here yet.</p>}
            </CardContent>
          </Card>
        ))}
      </div>
      <aside className="space-y-3 xl:sticky xl:top-20 xl:self-start">
        <h2 className="font-display text-xl font-extrabold">Topic notes</h2>
        {topicNotes.map(({ topic, notes: linked }) => (
          <Card key={topic.id}><CardContent className="p-4"><p className="font-extrabold">{topic.title}</p><p className="mt-1 text-sm text-muted-foreground">{linked.map((note) => note.title).join(' · ')}</p></CardContent></Card>
        ))}
        {!topicNotes.length && <EmptyState icon={NotebookText} title="No linked topic notes" detail="Link a class note to a topic to build this rail." />}
      </aside>
    </div>
  )
}

function ExamScope({ exam, topics, allTopics }: { exam: ClassAssignment; topics: Topic[]; allTopics: Topic[] }) {
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

function WhatIf({ assignments }: { assignments: ClassAssignment[] }) {
  const categories = categoryStats(assignments).filter((item) => item.weight > 0)
  const [category, setCategory] = useState(categories[0]?.name ?? '')
  const [assumption, setAssumption] = useState('90')
  const selected = categories.find((item) => item.name === category)
  const target = Number(assumption)
  const currentWeighted = categories.reduce((sum, item) => sum + (item.average ?? 0) * item.weight / 100, 0)
  const projected = selected && Number.isFinite(target)
    ? currentWeighted - (selected.average ?? 0) * selected.weight / 100 + target * selected.weight / 100
    : null
  return (
    <Card>
      <CardHeader><CardTitle>What-if calculator</CardTitle><p className="text-sm text-muted-foreground">Local scratch work only — nothing here is saved.</p></CardHeader>
      <CardContent>
        {categories.length ? (
          <div className="grid gap-4 lg:grid-cols-[1fr_180px_1fr]">
            <label className="text-sm font-bold">Category
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
                <SelectContent>{categories.map((item) => <SelectItem key={item.name} value={item.name}>{item.name}</SelectItem>)}</SelectContent>
              </Select>
            </label>
            <label className="text-sm font-bold">Assumed category %
              <Input className="mt-2" inputMode="decimal" value={assumption} onChange={(event) => setAssumption(event.target.value)} />
            </label>
            <div className="rounded-2xl bg-muted/35 p-4">
              <p className="text-xs font-extrabold uppercase tracking-wide text-muted-foreground">Projected course result</p>
              <p className="mt-1 font-display text-3xl font-extrabold tabular-nums">{projected == null ? '—' : `${formatNumber(projected)}%`}</p>
              <p className="mt-1 text-xs text-muted-foreground">Assumes every other recorded category stays at its current average. GPA knock-on cannot be calculated until the projected course grade is mapped to a final letter grade.</p>
            </div>
          </div>
        ) : <EmptyState icon={HelpCircle} title="Not enough weighted categories yet" detail="Record category, points, and weight before testing a grade scenario." />}
      </CardContent>
    </Card>
  )
}

function TopicRow({ topic, data }: { topic: Topic; data: ClassCenterData }) {
  const lastRecall = topic.fsrs.lastReview ? new Date(topic.fsrs.lastReview).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Never'
  const nextReview = topic.fsrs.reps > 0 ? new Date(topic.fsrs.due).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Not scheduled'
  const noteCount = data.notes.filter((note) => note.topicIds.includes(topic.id)).length
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div className="grid gap-3 rounded-xl border border-border bg-muted/25 p-3 md:grid-cols-[minmax(0,1fr)_120px_130px_110px_auto] md:items-center">
          <div><p className="font-extrabold">{topic.title}</p><p className="text-xs text-muted-foreground">MCAT tag not set · {noteCount} notes</p></div>
          <span className="text-xs font-bold text-muted-foreground">Last recall {lastRecall}</span>
          <span className="text-xs font-bold text-muted-foreground">Next review {nextReview}</span>
          <Badge className={cn('justify-self-start', STATUS_TONE[topic.status])}>{STATUS_LABELS[topic.status]}</Badge>
          <DropdownMenu>
            <DropdownMenuTrigger asChild><Button size="sm" variant="outline"><Brain className="size-4" /> Quiz me</Button></DropdownMenuTrigger>
            <DropdownMenuContent align="end"><DropdownMenuItem asChild><Link to={`/academics/review/${topic.courseId}?topicId=${topic.id}`}>Recall this topic</Link></DropdownMenuItem><DropdownMenuItem>Open linked notes</DropdownMenuItem></DropdownMenuContent>
          </DropdownMenu>
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent><ContextMenuItem asChild><Link to={`/academics/review/${topic.courseId}?topicId=${topic.id}`}><Brain className="size-4" /> Quiz me</Link></ContextMenuItem><ContextMenuItem><NotebookText className="size-4" /> Open context</ContextMenuItem></ContextMenuContent>
    </ContextMenu>
  )
}

function AssignmentRow({ item, topics }: { item: ClassAssignment; topics: Topic[] }) {
  const linked = topics.filter((topic) => [...(item.coveredTopicIds ?? []), ...item.linkedTopicIds].includes(topic.id))
  return (
    <div className="grid gap-2 rounded-xl border border-border bg-muted/25 p-3 md:grid-cols-[minmax(0,1fr)_140px_110px_auto] md:items-center">
      <div><p className="font-extrabold">{item.title}</p><p className="text-xs text-muted-foreground">{linked.length ? linked.map((topic) => topic.title).join(', ') : 'No linked topics'}</p></div>
      <span className="text-sm font-bold text-muted-foreground">{item.dueDate ? relativeDate(item.dueDate) : 'No due date'}</span>
      <Badge variant={isComplete(item) ? 'success' : item.dueDate && item.dueDate < isoToday() ? 'danger' : 'outline'}>{titleCase(item.status)}</Badge>
      <span className="text-right text-sm font-extrabold tabular-nums">{hasGrade(item) ? `${item.pointsEarned}/${item.pointsPossible}` : item.weight != null ? `${item.weight}%` : '—'}</span>
    </div>
  )
}

function FileRow({ file, ownership }: { file: AcademicFile; ownership: 'course' | 'mine' | 'generated' }) {
  const toast = useToast()
  const label = ownership === 'course' ? 'Course' : ownership === 'mine' ? 'Mine' : 'Generated'
  const content = (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/25 p-3 transition hover:-translate-y-0.5 hover:bg-muted/45 motion-reduce:transform-none">
      <div className="flex min-w-0 items-center gap-3"><FileText className="size-4 shrink-0 text-primary" /><div className="min-w-0"><p className="truncate font-extrabold">{file.title}</p><p className="text-xs text-muted-foreground">{titleCase(file.type)} · {file.sourceType}</p></div></div>
      <div className="flex items-center gap-2">
        <Badge variant={ownership === 'generated' ? 'secondary' : 'outline'}>{label}</Badge>
        {file.url && <span className="text-xs font-bold text-primary">Open ↗</span>}
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={(event) => {
            event.preventDefault()
            toast({ title: 'Source selected', description: `${file.title} is ready to summarize when the study generator is connected.` })
          }}
        >
          Summarize
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
  return <Card className={className}><CardHeader className="flex-row items-center justify-between gap-3"><CardTitle>{title}</CardTitle>{action}</CardHeader><CardContent>{children}</CardContent></Card>
}

function SectionToolbar({ title, detail, action }: { title: string; detail: string; action?: React.ReactNode }) {
  return <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-display text-2xl font-extrabold">{title}</h2><p className="text-sm font-semibold text-muted-foreground">{detail}</p></div>{action}</div>
}

function StudyToolActions({ onOpenNotes }: { onOpenNotes: () => void }) {
  const toast = useToast()
  return (
    <div className="flex items-center gap-2">
      <Button onClick={() => toast({ title: 'Choose your sources', description: 'Use the material rows below to open or summarize the sources for this guide.' })}>
        <Sparkles className="size-4" /> Generate study guide
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild><Button variant="outline" size="icon" aria-label="More study tools"><MoreHorizontal className="size-4" /></Button></DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onOpenNotes}><NotebookText className="size-4" /> Open class notes</DropdownMenuItem>
          <DropdownMenuItem onClick={() => toast({ title: 'Select one file', description: 'Use Summarize on the relevant material row.' })}><FileText className="size-4" /> Summarize a file</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return <div className="border-b border-border/70 p-3 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0"><p className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">{label}</p><p className="mt-1 font-display text-xl font-extrabold tabular-nums">{value}</p></div>
}

function StatusMetric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-border bg-muted/30 p-4"><p className="text-xs font-extrabold uppercase tracking-wide text-muted-foreground">{label}</p><p className="mt-1 font-display text-2xl font-extrabold tabular-nums">{value}</p></div>
}

function EmptyState({ icon: Icon, title, detail }: { icon: typeof BookOpen; title: string; detail: string }) {
  return <div className="rounded-2xl border border-dashed border-border p-5 text-center"><Icon className="mx-auto size-6 text-muted-foreground" /><p className="mt-2 font-extrabold">{title}</p><p className="mt-1 text-sm text-muted-foreground">{detail}</p></div>
}

function AssignmentMini({ item }: { item: ClassAssignment }) {
  return <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/25 px-3 py-2"><div className="min-w-0"><p className="truncate font-bold">{item.title}</p><p className="text-xs text-muted-foreground">{titleCase(item.type)}</p></div><Badge variant={item.dueDate && item.dueDate < isoToday() ? 'danger' : 'outline'}>{item.dueDate ? relativeDate(item.dueDate) : 'No date'}</Badge></div>
}

function Legend({ color, label }: { color: string; label: string }) {
  return <span className="inline-flex items-center gap-1.5"><span className={cn('size-2 rounded-full', color)} />{label}</span>
}

function ContactRow({ contact, person }: { contact: ClassContact; person?: Person }) {
  const name = person?.name || contact.name
  const email = person?.email || contact.email
  return <div className="rounded-xl border border-border bg-muted/25 p-3"><p className="font-extrabold">{name}</p><p className="text-xs text-muted-foreground">{titleCase(contact.role)} · {contact.officeHours || 'Office hours not set'}</p>{email && <a className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-primary" href={`mailto:${email}`}><Mail className="size-3" /> {email}</a>}</div>
}

function CategoryBar({ item }: { item: CategoryStat }) {
  return <div><div className="mb-1 flex justify-between gap-3 text-sm font-bold"><span>{item.name}</span><span className="tabular-nums text-muted-foreground">{item.average == null ? 'Not graded' : `${formatNumber(item.average)}%`} · {formatNumber(item.weight)}% wt</span></div><Progress value={item.average ?? 0} /></div>
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
    nextDue: next?.dueDate ? relativeDate(next.dueDate) : '—',
    // Banner metrics are short by design (04 §0c "6d"), so the empty case is a
    // dash rather than a sentence that has to truncate inside the strip.
    examCountdown: exam?.dueDate ? relativeDate(exam.dueDate) : '—',
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

function relativeDate(date: string) {
  const delta = Math.round((new Date(`${date}T00:00:00`).getTime() - new Date(`${isoToday()}T00:00:00`).getTime()) / 86400000)
  if (delta === 0) return 'Today'
  if (delta === 1) return 'Tomorrow'
  if (delta === -1) return 'Yesterday'
  return delta < 0 ? `${Math.abs(delta)}d overdue` : `${delta}d left`
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
