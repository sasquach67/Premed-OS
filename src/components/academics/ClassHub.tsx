import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft, BookOpen, Brain, Check, ChevronDown,
  FileStack, FileText, Filter, FolderOpen, HelpCircle,
  ListChecks, Mail, MoreHorizontal, NotebookText, Plus, Target,
} from 'lucide-react'
import type {
  AcademicFile, ClassAssignment, ClassCenterData, ClassContact, ClassNote,
  AcademicTagColor, AssignedReading, ClassWorkspace, ClassWorkspaceType, Course, FeedbackNote, GradeCategory, PaperDraft, Person, Topic,
} from '@/lib/types'
import { useStore } from '@/store/store'
import { uid } from '@/lib/id'
import { fmtDeadline, fmtEventDate } from '@/lib/date'
import { calculateCourseCoverage } from '@/lib/academics/coverage'
import { calculateCourseScenario } from '@/lib/academics/gradeLedger'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/common/useToast'
import { InfoTip } from '@/components/common/InfoTip'
import { Collapsible } from '@/components/common/Collapsible'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger,
} from '@/components/ui/context-menu'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { StatStrip } from '@/components/common/StatStrip'
import { ExamPrepMode } from '@/components/academics/ExamPrepMode'
import { AssignmentLinkField } from '@/components/academics/TopicLinkFields'
import { TopicConnectField } from '@/components/academics/TopicConnectField'
import { MaterialCatalog } from '@/components/academics/MaterialCatalog'
import { MaterialIntakeDialog } from '@/components/academics/MaterialIntakeDialog'
import { RevisedNotesPanel } from '@/components/academics/RevisedNotesPanel'
import { ProfessorEvidencePanel } from '@/components/academics/ProfessorEvidencePanel'
import { generateStudyGuide, sourcesFor } from '@/lib/academics/generateStudyGuide'
import { LectureCapturePanel, type LectureDestination } from '@/components/academics/LectureCapturePanel'
import { buildLectureBrief, buildLectureMasteryMap, sourceChunksForLecture } from '@/lib/academics/lectureWorkspace'
import { AssignmentsPanel } from '@/components/common/AssignmentsPanel'
import { CalendarReview } from '@/components/academics/CalendarReview'
import { MaterialGenerationIntake, type MaterialArtifact } from '@/components/academics/MaterialGenerationIntake'
import { MaterialFolderIntake } from '@/components/academics/MaterialFolderIntake'
import { GenerationProgress } from '@/components/academics/GenerationProgress'
import { startGenerationProgress, waitForGenerationProgress, type GenerationPhase } from '@/lib/generation/progress'
import { AssessmentCatalog } from '@/components/academics/AssessmentCatalog'
import { readLocalBlob } from '@/lib/localBlobStore'
import { readingDebt, READING_LIST_STATE_COPY, recurringFeedbackThemes } from '@/lib/academics/writingEvidence'
import { normalizeMeetingDays } from '@/lib/academics/meetingSchedule'
import {
  acceptGuideProposal, buildSyllabusGuideProposals, dismissGuideProposal, editGuideProposal,
  ensureSyllabusGuideProposals, guideProposalsForCourse, isGuideSourceValid,
} from '@/lib/academics/guideContract'
import './classHubVariantA.css'

type HubTab = 'overview' | 'materials' | 'topics' | 'assignments' | 'guide'

function isMaterialArtifact(value: string | null): value is MaterialArtifact {
  return value === 'flashcards' || value === 'study-guide' || value === 'study-outline' || value === 'revised-notes' || value === 'unit-mastery-outline' || value === 'unit-question-bank'
}

export interface ClassHubProps {
  course: Course
  workspace: ClassWorkspace
  data: ClassCenterData
  persons: Person[]
}

const COLOR_DOT: Record<string, string> = {
  gray: 'bg-slate-400', brown: 'bg-stone-500', orange: 'bg-orange-500', coral: 'bg-[#e67d69]',
  yellow: 'bg-yellow-500', lime: 'bg-lime-500', green: 'bg-emerald-500',
  mint: 'bg-[#62c6a2]', teal: 'bg-teal-500', cyan: 'bg-cyan-500', sky: 'bg-[#65bfe7]', blue: 'bg-sky-500',
  navy: 'bg-[#506f9d]', indigo: 'bg-indigo-500', purple: 'bg-violet-500', plum: 'bg-[#aa6aa3]', pink: 'bg-pink-500', red: 'bg-rose-500',
}

const CLASS_HUB_ACCENT: Record<AcademicTagColor, { hex: string; rgb: string }> = {
  gray: { hex: '#9aa3ad', rgb: '154 163 173' },
  brown: { hex: '#a38465', rgb: '163 132 101' },
  orange: { hex: '#df9b52', rgb: '223 155 82' },
  coral: { hex: '#e67d69', rgb: '230 125 105' },
  yellow: { hex: '#d5b768', rgb: '213 183 104' },
  lime: { hex: '#98bd63', rgb: '152 189 99' },
  green: { hex: '#6fc0a8', rgb: '111 192 168' },
  mint: { hex: '#62c6a2', rgb: '98 198 162' },
  teal: { hex: '#54b5ad', rgb: '84 181 173' },
  cyan: { hex: '#58b9cf', rgb: '88 185 207' },
  sky: { hex: '#65bfe7', rgb: '101 191 231' },
  blue: { hex: '#6fb3de', rgb: '111 179 222' },
  navy: { hex: '#506f9d', rgb: '80 111 157' },
  indigo: { hex: '#7f8fd3', rgb: '127 143 211' },
  purple: { hex: '#a987ca', rgb: '169 135 202' },
  plum: { hex: '#aa6aa3', rgb: '170 106 163' },
  pink: { hex: '#c98ac9', rgb: '201 138 201' },
  red: { hex: '#e8806f', rgb: '232 128 111' },
}

function classHubColor(color: unknown): AcademicTagColor {
  return typeof color === 'string' && color in CLASS_HUB_ACCENT ? color as AcademicTagColor : 'blue'
}

function classHubAccentStyle(color: AcademicTagColor): CSSProperties {
  const accent = CLASS_HUB_ACCENT[color]
  return {
    '--class-hub-accent': accent.hex,
    '--class-hub-accent-rgb': accent.rgb,
  } as CSSProperties
}

export function ClassHub({ course, workspace, data }: ClassHubProps) {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const requestedTab = params.get('classTab')
  // Preserve old deep links while keeping the public shell at five tabs.
  const canonicalRequestedTab = requestedTab === 'notes' ? 'guide' : requestedTab === 'readings' ? 'materials' : requestedTab
  const classType: ClassWorkspaceType = workspace.type ?? (course.bcpm ? 'stem' : 'general')
  const courseColor = classHubColor(workspace.color)
  // A class has one stable five-tab shell. Writing-specific tools live inside
  // Materials rather than replacing the syllabus-led Topics surface.
  const availableTabs: HubTab[] = ['overview', 'materials', 'topics', 'assignments', 'guide']
  const initialTab = isHubTab(canonicalRequestedTab) && availableTabs.includes(canonicalRequestedTab) ? canonicalRequestedTab : 'overview'
  const [tab, setTab] = useState<HubTab>(initialTab)
  useEffect(() => {
    const nextTab = isHubTab(canonicalRequestedTab) && availableTabs.includes(canonicalRequestedTab) ? canonicalRequestedTab : 'overview'
    setTab((current) => current === nextTab ? current : nextTab)
  }, [canonicalRequestedTab])
  const courseTopics = ordered(data.topics.filter((item) => item.courseId === course.id))
  const courseFiles = ordered(data.files.filter((item) => item.courseId === course.id))
  const courseNotes = [...data.notes.filter((item) => item.courseId === course.id)].sort((a, b) => b.updatedAt - a.updatedAt)
  const courseMaterialNotes = courseNotes.filter(isMaterialNote)
  const courseGuideNotes = courseNotes.filter(isGuideNote)
  const courseAssignments = ordered(data.assignments.filter((item) => item.courseId === course.id))
  const courseContacts = ordered(data.contacts.filter((item) => item.courseId === course.id))
  const courseDrafts = ordered(data.paperDrafts.filter((item) => item.courseId === course.id))
  const courseReadings = ordered(data.assignedReadings.filter((item) => item.courseId === course.id))
  const courseFeedback = ordered(data.feedbackNotes.filter((item) => item.courseId === course.id))
  const readingListState = workspace.readingListState ?? 'unknown'
  const readingsBehind = readingDebt(courseReadings, readingListState, isoToday())
  const stats = hubStats(course, courseAssignments)
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
    return <DropdownMenu><DropdownMenuTrigger asChild><Button size="sm" className="class-hub-primary-action" aria-label="Create study resources"><FileStack className="size-4" /> Create <span className="class-hub-primary-action-optional">study </span>resources <ChevronDown className="size-3.5" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><ResourceMenuItems classType={classType} onChoose={(artifact) => { changeTab('materials'); const next = new URLSearchParams(params); next.set('classTab', 'materials'); next.set('createMaterial', artifact); setParams(next) }} /></DropdownMenuContent></DropdownMenu>
  }

  const counts = {
    materials: courseFiles.length + courseMaterialNotes.length,
    topics: courseTopics.length,
    readings: courseReadings.length,
    assignments: courseAssignments.filter((item) => !isComplete(item)).length,
    notes: courseGuideNotes.length,
  }

  return (
    <div className="class-hub space-y-5">
      <Tabs value={tab} onValueChange={changeTab}>
        {/* Visual provenance: mockup-lab/01-academics/academics-class-hub.html,
            Variant A, shared Class Hub banner. This is an app-native
            reconstruction of that exact composition; the mockup is not
            embedded at runtime. */}
        <section
          className="class-hub-banner"
          aria-label={`${course.code} header`}
          data-course-color={courseColor}
          style={classHubAccentStyle(courseColor)}
        >
          <button type="button" className="class-hub-crumb" onClick={() => navigate('/academics?mode=daily&tab=class-center')}>
            <ArrowLeft aria-hidden="true" /> Class Center
          </button>
          <div className="class-hub-banner-main">
            <div className="class-hub-identity">
              <h1>
                <span className={cn('class-hub-course-dot', COLOR_DOT[courseColor])} aria-hidden="true" />
                <span className="class-hub-course-code">{course.code}</span>
                <span className="class-hub-course-title">{course.title}</span>
              </h1>
              <div className="class-hub-info-line">
                <span>{workspace.instructor || 'Instructor not set'}</span><i>·</i>
                <span>{meetingText(workspace)}</span><i>·</i>
                <span>{workspace.location || 'Location not set'}</span><i>·</i>
                <span className="inline-flex items-center gap-1">{course.bcpm ? 'BCPM' : 'Non-BCPM'}<InfoTip field="course.bcpm" value={course.bcpm} className="border-white/30 text-white/70 hover:bg-white/15 hover:text-white" /></span><i>·</i>
                <LinksMenu workspace={workspace} contacts={courseContacts} />
              </div>
            </div>
            <div className="class-hub-banner-actions">
              <StatStrip
                variant="banner"
                metrics={[
                  { id: 'grade', label: 'Grade', value: stats.grade, cadence: 'variable' },
                  ...(classType === 'stem' ? [
                    { id: 'topics', label: 'Topics', value: String(courseTopics.length), cadence: 'variable' as const },
                    { id: 'materials', label: 'Materials', value: String(courseFiles.length), cadence: 'variable' as const },
                    { id: 'next-exam', label: 'Next exam', value: stats.examCountdown, cadence: 'variable' as const },
                  ] : classType === 'writing' ? [
                    { id: 'next-due', label: 'Next due', value: stats.nextDue, cadence: 'variable' as const },
                    { id: 'draft-stage', label: 'Draft stage', value: currentDraftStage(courseDrafts), cadence: 'variable' as const },
                    { id: 'readings', label: readingListState === 'complete' ? 'Readings behind' : 'Reading list', value: readingListState === 'complete' ? String(readingsBehind) : 'Not complete', cadence: 'variable' as const },
                  ] : [
                    { id: 'next-deadline', label: 'Next deadline', value: stats.nextDue, cadence: 'variable' as const },
                    { id: 'credits', label: 'Credits', value: String(course.credits), cadence: 'variable' as const },
                  ]),
                ]}
              />
              {primaryAction()}
              <DropdownMenu>
                <DropdownMenuTrigger asChild><Button variant="outline" size="icon" aria-label="Class actions" className="class-hub-more"><MoreHorizontal className="size-4" /></Button></DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Class actions</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => navigate(`/academics?mode=daily&tab=class-center&importFor=${course.id}`)}><FileText className="size-4" /> Import / refresh syllabus</DropdownMenuItem>
                  {classType === 'writing' && <DropdownMenuItem onClick={() => changeTab('materials')}><NotebookText className="size-4" /> Manage drafts and readings</DropdownMenuItem>}
                  {classType === 'general' && <DropdownMenuItem onClick={() => changeTab('assignments')}><Plus className="size-4" /> Add coursework</DropdownMenuItem>}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <TabsList className="class-hub-tabs h-auto w-full justify-start overflow-x-auto rounded-none border-0 bg-transparent p-0">
            <HubTabTrigger value="overview" label="Overview" />
            <HubTabTrigger value="materials" label="Materials" count={counts.materials} />
            <HubTabTrigger value="topics" label="Topics" count={counts.topics} />
            <HubTabTrigger value="assignments" label="Assignments" count={counts.assignments} />
            <HubTabTrigger value="guide" label="Guide" count={counts.notes} />
          </TabsList>
        </section>

        <TabsContent value="overview" className="class-hub-tab"><Overview course={course} workspace={workspace} data={data} topics={courseTopics} assignments={courseAssignments} notes={courseNotes} onTab={changeTab} onOpenExamPrep={openExamPrep} /></TabsContent>
        <TabsContent value="materials" className="class-hub-tab"><Materials course={course} classType={classType} data={data} files={courseFiles} topics={courseTopics} notes={courseNotes} writingTools={classType === 'writing' ? <WritingTools courseId={course.id} readingListState={readingListState} drafts={courseDrafts} readings={courseReadings} feedback={courseFeedback} assignments={courseAssignments} /> : undefined} /></TabsContent>
        <TabsContent value="topics" className="class-hub-tab"><Topics
          courseId={course.id} data={data} topics={courseTopics} assignments={courseAssignments}
          onOpenNotes={(topicId) => {
            // The Guide tab filters to this topic, so the menu item lands on
            // something rather than on an unfiltered list.
            setParams((current) => {
              const next = new URLSearchParams(current)
              next.set('classTab', 'guide')
              next.set('noteTopic', topicId)
              return next
            }, { replace: true })
            changeTab('guide')
          }}
        /></TabsContent>
        <TabsContent value="assignments" className="class-hub-tab"><Assignments courseId={course.id} assignments={courseAssignments} categories={data.gradeCategories.filter((item) => item.courseId === course.id)} focusWhatIf={params.get('whatIf') === '1'} /></TabsContent>
        <TabsContent value="guide" className="class-hub-tab"><Guide courseId={course.id} workspace={workspace} notes={courseNotes} topics={courseTopics} assignments={courseAssignments} contacts={courseContacts} data={data} onOpenMaterials={() => changeTab('materials')} topicFilter={params.get('noteTopic') ?? undefined} /></TabsContent>
      </Tabs>
    </div>
  )
}

function Overview({
  course, workspace, data, topics, assignments, notes, onTab, onOpenExamPrep,
}: {
  course: Course
  workspace: ClassWorkspace
  data: ClassCenterData
  topics: Topic[]
  assignments: ClassAssignment[]
  notes: ClassNote[]
  onTab: (tab: string) => void
  onOpenExamPrep: (examId: string) => void
}) {
  const [overviewParams, setOverviewParams] = useSearchParams()
  const [lectureDialogOpen, setLectureDialogOpen] = useState(false)
  const [selectedLectureId, setSelectedLectureId] = useState<string | undefined>()
  const [lectureDestination, setLectureDestination] = useState<LectureDestination>('overview')
  const open = assignments.filter((item) => !isComplete(item) && item.dueDate).sort((a, b) => String(a.dueDate).localeCompare(String(b.dueDate)))
  const exam = open.find((item) => item.type === 'exam')
  const lectures = data.lectures.filter((item) => item.courseId === course.id).sort((a, b) => b.createdAt - a.createdAt)
  const chronologicalLectures = [...lectures].sort((a, b) => String(a.occurredOn ?? '').localeCompare(String(b.occurredOn ?? '')) || a.createdAt - b.createdAt)
  const lectureNumber = (lectureId: string) => chronologicalLectures.findIndex((lecture) => lecture.id === lectureId) + 1
  const activeLecture = selectedLectureId ? lectures.find((lecture) => lecture.id === selectedLectureId) : undefined
  const activeLectureSources = activeLecture ? data.files.filter((file) => activeLecture.selectedSourceFileIds?.includes(file.id) || file.id === activeLecture.transcriptFileId) : []
  const activeLectureChunks = activeLecture ? sourceChunksForLecture(data, activeLecture) : []
  const activeLecturePreviewRecord = activeLecture ? { ...activeLecture, selectedSourceFileIds: activeLectureSources.map((file) => file.id) } : undefined
  const activeLectureBrief = activeLecturePreviewRecord ? activeLecturePreviewRecord.lectureBrief ?? buildLectureBrief(activeLectureChunks, activeLecturePreviewRecord.selectedSourceFileIds, data.files) : undefined
  const activeMasteryMap = activeLecturePreviewRecord ? data.generatedMasteryOutlines.find((outline) => outline.id === activeLecturePreviewRecord.masteryMapId || outline.lectureId === activeLecturePreviewRecord.id) ?? buildLectureMasteryMap({ lecture: activeLecturePreviewRecord, topics, chunks: activeLectureChunks, files: activeLectureSources }) : undefined
  const courseFiles = data.files.filter((file) => file.courseId === course.id)
  const unfiledCount = courseFiles.filter((file) => !file.topicId && file.linkedTopicIds.length === 0).length
  const guideSuggestionCount = data.lectureNoteProposals.filter((proposal) => proposal.courseId === course.id && proposal.status === 'pending').length
  const nextLectureNumber = chronologicalLectures.length + 1
  const scheduleContext = [workspace.meetingTime, workspace.location].filter(Boolean).join(' · ')
  const examTopics = exam?.coveredTopicIds?.length ? topics.filter((topic) => exam.coveredTopicIds?.includes(topic.id)) : topics
  const examCovered = examTopics.filter((topic) => (topic.linkedFileIds?.length ?? 0) || topic.sourceNoteIds.length).length
  const recentStudyWork = notes.filter(isMaterialNote).filter((note) => note.type === 'study-guide' || note.type === 'lecture').slice(0, 3)

  useEffect(() => {
    if (overviewParams.get('captureLecture') !== '1') return
    setSelectedLectureId(undefined)
    setLectureDestination('transcript')
    setLectureDialogOpen(true)
    const next = new URLSearchParams(overviewParams)
    next.delete('captureLecture')
    setOverviewParams(next, { replace: true })
  }, [overviewParams, setOverviewParams])

  function openLecture(lectureId?: string, destination: LectureDestination = 'overview') {
    setSelectedLectureId(lectureId)
    setLectureDestination(destination)
    setLectureDialogOpen(true)
  }

  function openMaterialNote(noteId: string) {
    const next = new URLSearchParams(overviewParams)
    next.set('classTab', 'materials')
    next.set('materialNote', noteId)
    setOverviewParams(next)
  }

  return (
    <div className="class-hub-overview grid grid-cols-12 gap-4">
      {/* Visual provenance: mockup-lab/01-academics/academics-class-hub.html,
          Variant A, view=overview. Geometry and class names below map directly
          to the approved journal-shell / journal-rail / journal-stage recipe. */}
      <section className="lecture-overview-composition col-span-12" aria-labelledby="lecture-ledger-title">
        <aside className="lecture-rail">
          <div className="lecture-rail-heading">
            <div><p className="lecture-ledger-kicker">Class journal</p><h2 id="lecture-ledger-title">Lecture evidence</h2></div>
          </div>
          <p className="lecture-rail-caption">{lectures.length ? `${lectures.length} ${lectures.length === 1 ? 'lecture' : 'lectures'} · newest first` : 'No lectures yet'}</p>
          <div className="lecture-rail-list" tabIndex={0} aria-label="Lecture history">
            {lectures.length ? [...chronologicalLectures].reverse().map((lecture) => {
              const materialCount = data.files.filter((file) => file.lectureId === lecture.id && file.id !== lecture.transcriptFileId).length
              const generatedCount = data.files.filter((file) => file.lectureId === lecture.id && file.owner === 'generated').length
              const generatedTitle = lecture.aiTitle ?? (lecture.title.startsWith('Lecture #') ? undefined : lecture.title)
              const isActive = activeLecture?.id === lecture.id
              return <button key={lecture.id} type="button" onClick={() => setSelectedLectureId(lecture.id)} className={cn('lecture-rail-entry', isActive && 'is-active')} aria-current={isActive ? 'true' : undefined}>
                <b>Lecture {lectureNumber(lecture.id)}{generatedTitle ? ` · ${generatedTitle}` : ''}</b>
                <span>{lecture.occurredOn ? fmtEventDate(lecture.occurredOn) : 'Date not set'} · {lecture.transcriptFileId ? 'transcript saved' : 'no transcript'}{materialCount ? ` + ${materialCount} ${materialCount === 1 ? 'material' : 'materials'}` : ''}</span>
                <i className="lecture-journal-status">{generatedCount ? 'study work' : lecture.transcriptFileId ? 'captured' : 'new'}</i>
              </button>
            }) : <div className="lecture-ledger-empty"><span aria-hidden="true" /><p>Your first transcript starts the journal.</p></div>}
          </div>
          <button type="button" className="lecture-rail-add" onClick={() => openLecture(undefined, 'transcript')}><Plus aria-hidden="true" /> Add today’s lecture</button>
        </aside>

        <article className={cn('lecture-active-context', !activeLecture && 'lecture-capture-default')}>
          {activeLecture ? <>
            <div className="lecture-active-header">
              <div><p className="lecture-ledger-kicker">Saved lecture</p><h2>Lecture {lectureNumber(activeLecture.id)}{activeLecture.aiTitle ? ` · ${activeLecture.aiTitle}` : activeLecture.title.startsWith('Lecture #') ? '' : ` · ${activeLecture.title}`}</h2><p>{activeLecture.occurredOn ? fmtEventDate(activeLecture.occurredOn) : 'Date not set'}</p></div>
              <div className="lecture-saved-actions"><Button size="sm" variant="ghost" onClick={() => setSelectedLectureId(undefined)}>Close</Button><Button size="sm" onClick={() => openLecture(activeLecture.id, 'overview')}>Open full screen</Button></div>
            </div>
            {activeLecture.workspaceState === 'complete'
              ? <div className="lecture-inline-workspace"><LectureCapturePanel key={`embedded:${activeLecture.id}`} courseId={course.id} course={course} data={data} initialLectureId={activeLecture.id} initialDestination="overview" displayMode="embedded" onOpenNotes={() => onTab('guide')} /></div>
              : activeLectureBrief && <SavedLecturePreview brief={activeLectureBrief} mastery={activeMasteryMap} sourceCount={activeLectureSources.length} />}
          </> : <>
            <div className="lecture-active-header"><div><p className="lecture-ledger-kicker">{scheduleContext ? `Today · ${scheduleContext}` : 'Today'}</p><h2>Build a lecture page</h2></div><span className="lecture-number-pill">Lecture {nextLectureNumber}</span></div>
            <div className="lecture-capture-steps" aria-label="Lecture import workflow"><div className="is-current"><b>1 · Add source</b><span>Transcript</span></div><div><b>2 · Add materials</b><span>Optional</span></div><div><b>3 · Build page</b><span>Brief + Mastery</span></div></div>
            <button type="button" className="lecture-transcript-drop" onClick={() => openLecture(undefined, 'transcript')}><b>Paste or upload a lecture source</b><span>PDF, DOCX, TXT, image, or clipboard text</span></button>
            <div className="lecture-capture-actions"><Button size="sm" onClick={() => openLecture(undefined, 'transcript')}>Import lecture</Button></div>
            <p className="lecture-journal-next"><b>Result:</b> a Lecture Brief and Mastery Map, with transcript and materials kept under Sources.</p>
          </>}
        </article>
      </section>

      {/* Visual provenance: mockup-lab/01-academics/academics-class-hub.html,
          Variant A, view=overview, class-pulse. This replaces duplicate metric
          cards; every row is a real route or action. */}
      <section className="class-hub-course-pulse col-span-12" aria-label="Course pulse">
        <div className="course-pulse-heading"><p>Course pulse</p><b>What needs attention</b></div>
        <button type="button" className={cn('course-pulse-item', open[0] && 'is-urgent')} onClick={() => onTab('assignments')}><span>Assignments</span><b>{open[0]?.title ?? 'No dated work'}</b><i>{open[0] ? `${assignmentDateLabel(open[0])} · Open →` : 'Open assignments →'}</i></button>
        <button type="button" className="course-pulse-item" onClick={() => exam ? onOpenExamPrep(exam.id) : onTab('assignments')}><span>{exam?.title ?? 'Next exam'}</span><b>{exam ? `${examCovered} of ${examTopics.length} topics have material` : 'No exam dated'}</b><i>{exam ? 'Open exam plan →' : 'Add exam →'}</i></button>
        <button type="button" className="course-pulse-item" onClick={() => onTab('materials')}><span>Materials</span><b>{courseFiles.length ? `${courseFiles.length} course ${courseFiles.length === 1 ? 'item' : 'items'}` : 'No materials yet'}</b><i>{unfiledCount ? `${unfiledCount} need filing · Open →` : 'Open materials →'}</i></button>
        <button type="button" className="course-pulse-item" onClick={() => onTab('guide')}><span>Guide</span><b>{guideSuggestionCount ? `${guideSuggestionCount} ${guideSuggestionCount === 1 ? 'suggestion' : 'suggestions'}` : `${notes.filter(isGuideNote).length} saved ${notes.filter(isGuideNote).length === 1 ? 'item' : 'items'}`}</b><i>Review class context →</i></button>
      </section>

      <Dialog open={lectureDialogOpen} onOpenChange={setLectureDialogOpen}>
        <DialogContent className="max-h-[88vh] max-w-6xl overflow-y-auto !rounded-2xl !border-border !bg-card !p-0 !shadow-[0_22px_55px_-27px_rgba(0,0,0,0.8)] ![backdrop-filter:none]">
          <LectureCapturePanel key={`${selectedLectureId ?? 'new'}:${lectureDestination}`} courseId={course.id} course={course} data={data} initialLectureId={selectedLectureId} initialDestination={lectureDestination} onOpenNotes={() => { setLectureDialogOpen(false); onTab('guide') }} />
        </DialogContent>
      </Dialog>

      <Card className="class-hub-panel col-span-12">
        <CardHeader className="class-hub-panel-header flex-row items-start justify-between gap-3"><div><p className="text-xs font-extrabold uppercase tracking-[0.12em] text-primary">From selected class material</p><CardTitle>Recent study work</CardTitle></div><Button size="sm" variant="outline" onClick={() => onTab('materials')}>Open Materials</Button></CardHeader>
        <CardContent className="class-hub-panel-content grid gap-2 md:grid-cols-3">
          {recentStudyWork.map((note) => <button key={note.id} type="button" className="class-hub-record-row rounded-[13px] p-3 text-left" onClick={() => openMaterialNote(note.id)}><b>{note.title}</b><span className="mt-1 block text-xs font-semibold text-muted-foreground">{note.type === 'study-guide' ? 'Study guide' : 'Lecture note'} · source links retained</span></button>)}
          {!recentStudyWork.length && <p className="rounded-[13px] border border-dashed border-border p-4 text-sm font-semibold text-muted-foreground md:col-span-3">Create a Study Guide, Mastery Map, or Revised Notes from the sources you select.</p>}
        </CardContent>
      </Card>

    </div>
  )
}

function SavedLecturePreview({ brief, mastery, sourceCount }: {
  brief: ReturnType<typeof buildLectureBrief>
  mastery?: ReturnType<typeof buildLectureMasteryMap>
  sourceCount: number
}) {
  const flow = brief.conceptMap?.nodes.filter((node) => node.lane === 'flow').slice(0, 4) ?? []
  const connection = brief.connections[0]
  const vocabulary = brief.vocabulary.slice(0, 3)
  return <div className="lecture-saved-preview">
    <section className="lecture-saved-brief" aria-label="Lecture Brief preview">
      <p className="lecture-saved-label">Lecture Brief · Start here</p>
      {brief.summary.length ? <div className="lecture-saved-summary">{brief.summary.slice(0, 2).map((item) => <p key={item.id}>{item.text}</p>)}</div> : <div className="lecture-saved-empty"><b>No readable lecture content yet</b><span>Add a transcript or another processed source to build the study front.</span></div>}
      {flow.length > 1 ? <ol className="lecture-saved-flow" aria-label="Concept flow preview">{flow.map((node, index) => <li key={node.id} className="contents"><span>{node.label}</span>{index < flow.length - 1 && <i aria-hidden="true">→</i>}</li>)}</ol> : connection ? <p className="lecture-saved-connection"><b>Connection:</b> {connection.text}</p> : null}
      {vocabulary.length > 0 && <div className="lecture-saved-vocabulary"><b>Key language</b>{vocabulary.map((item) => <span key={item.id}>{item.term}</span>)}</div>}
    </section>
    <aside className="lecture-saved-mastery" aria-label="Mastery Map preview">
      <div className="lecture-saved-mastery-heading"><ListChecks aria-hidden="true" /><p className="lecture-saved-label">Mastery Map</p>{mastery && <span>{mastery.standards.length} objectives</span>}</div>
      {mastery ? <ol>{mastery.standards.slice(0, 3).map((standard, index) => <li key={standard.id}><span>{index + 1}</span><b>{standard.title}</b></li>)}</ol> : <div className="lecture-saved-empty"><b>Objectives need a course source</b><span>Add learning objectives or syllabus material; transcript topics are not treated as official objectives.</span></div>}
    </aside>
    <footer><span><b>{sourceCount} selected {sourceCount === 1 ? 'source' : 'sources'}</b> · {brief.usedSourceFileIds.length} used here</span><span>Transcript and supporting files stay under Sources; figures are not interpreted</span></footer>
  </div>
}

export function WritingTools({ courseId, readingListState, drafts, readings, feedback, assignments }: {
  courseId: string
  readingListState: NonNullable<ClassWorkspace['readingListState']>
  drafts: PaperDraft[]
  readings: AssignedReading[]
  feedback: FeedbackNote[]
  assignments: ClassAssignment[]
}) {
  const update = useStore((state) => state.update)
  const current = drafts.find((item) => item.stage !== 'submitted')
  const feedbackThemes = recurringFeedbackThemes(feedback)
  const [pastedReadings, setPastedReadings] = useState('')
  const [feedbackTheme, setFeedbackTheme] = useState('')
  const [feedbackQuote, setFeedbackQuote] = useState('')
  const [feedbackAssignmentId, setFeedbackAssignmentId] = useState('')
  const currentDebt = readingDebt(readings, readingListState, isoToday())

  function setReadingListState(next: NonNullable<ClassWorkspace['readingListState']>) {
    update((draft) => {
      // ClassHub receives a display view whose `id` is deliberately the course id;
      // `courseId` is the stable link back to the persisted workspace.
      const workspace = draft.academics.classCenter.workspaces.find((item) => item.courseId === courseId)
      if (workspace) Object.assign(workspace, { readingListState: next, updatedAt: Date.now() })
    })
  }
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
  function addReading(week: string) {
    const now = Date.now()
    update((draft) => {
      const center = draft.academics.classCenter
      center.assignedReadings.push({ id: uid(), courseId, week, title: 'Untitled reading', status: 'not-started', createdAt: now, updatedAt: now, order: center.assignedReadings.filter((item) => item.courseId === courseId).length })
      const workspace = center.workspaces.find((item) => item.courseId === courseId)
      if (workspace && workspace.readingListState !== 'complete') Object.assign(workspace, { readingListState: 'partial', updatedAt: now })
    })
  }
  function addPastedReadings() {
    const rows = pastedReadings.split('\n').map((item) => item.trim()).filter(Boolean)
    if (!rows.length) return
    const now = Date.now()
    update((draft) => {
      const center = draft.academics.classCenter
      rows.forEach((title, index) => center.assignedReadings.push({ id: uid(), courseId, week: 'Unscheduled', title, status: 'not-started', createdAt: now, updatedAt: now, order: center.assignedReadings.filter((item) => item.courseId === courseId).length + index }))
      const workspace = center.workspaces.find((item) => item.courseId === courseId)
      if (workspace && workspace.readingListState !== 'complete') Object.assign(workspace, { readingListState: 'partial', updatedAt: now })
    })
    setPastedReadings('')
  }
  function logFeedback() {
    const theme = feedbackTheme.trim()
    if (!theme) return
    const now = Date.now()
    update((draft) => {
      const target = draft.academics.classCenter.feedbackNotes
      target.push({ id: uid(), courseId, assignmentId: feedbackAssignmentId || undefined, theme, quote: feedbackQuote.trim() || undefined, createdAt: now, updatedAt: now, order: target.filter((item) => item.courseId === courseId).length })
    })
    setFeedbackTheme('')
    setFeedbackQuote('')
    setFeedbackAssignmentId('')
  }
  return (
    <div className="writing-type-tools space-y-4">
      <Panel title="Current draft" action={<Button size="sm" variant="outline" onClick={() => {
        const now = Date.now()
        update((draft) => draft.academics.classCenter.paperDrafts.push({
          id: uid(), courseId, title: 'Untitled paper', stage: 'outline', createdAt: now, updatedAt: now,
          order: draft.academics.classCenter.paperDrafts.filter((item) => item.courseId === courseId).length,
        }))
      }}><Plus className="size-4" /> Add paper</Button>}>
        <div className="space-y-2">
          {drafts.map((draft) => {
            const assignment = assignments.find((item) => item.id === draft.assignmentId)
            return <WritingDraftRow key={draft.id} draft={draft} assignment={assignment} onStage={patchDraft} onTarget={(selfDeadline) => update((state) => {
              const item = state.academics.classCenter.paperDrafts.find((row) => row.id === draft.id)
              if (item) Object.assign(item, { selfDeadline: selfDeadline || undefined, updatedAt: Date.now() })
            })} />
          })}
          {!drafts.length && <WritingEmptyState icon={FileText} title="No papers assigned yet" detail="Add a paper when it appears in the syllabus or course site." />}
        </div>
      </Panel>

      <Panel title="Readings" action={<div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={() => addReading('Unscheduled')}><Plus className="size-4" /> Add reading</Button><Button size="sm" variant="outline" onClick={() => addReading('This week')}><Plus className="size-4" /> Add this week&apos;s reading</Button></div>}>
        <div className="writing-boundary-row">
          <p>{READING_LIST_STATE_COPY[readingListState]}</p>
          {readingListState === 'complete' && <p className="mt-1 text-xs">{currentDebt ? `${currentDebt} reading${currentDebt === 1 ? '' : 's'} behind before discussion.` : 'No readings are behind.'}</p>}
          <div className="mt-3 flex flex-wrap gap-2">
            {readingListState !== 'complete' && <Button size="sm" variant="outline" onClick={() => setReadingListState('complete')}>Mark list complete</Button>}
            {readingListState !== 'not-applicable' && <Button size="sm" variant="ghost" onClick={() => setReadingListState('not-applicable')}>This class has no assigned readings</Button>}
            {readingListState === 'not-applicable' && <Button size="sm" variant="outline" onClick={() => setReadingListState('partial')}>Start a reading list</Button>}
          </div>
        </div>
        <div className="mt-3 space-y-2">
          {readings.map((reading) => <WritingReadingRow key={reading.id} reading={reading} onStatus={patchReading} />)}
          {!readings.length && <WritingEmptyState icon={BookOpen} title="No readings listed yet" detail="Add one, paste a list, or add this week's reading." />}
        </div>
        {!!readings.length && <ReadingTermDots readings={readings} />}
        <Collapsible title="Paste a reading list">
          <Textarea value={pastedReadings} onChange={(event) => setPastedReadings(event.target.value)} className="min-h-20" placeholder="One reading per line" aria-label="Paste a reading list" />
          <Button size="sm" variant="outline" className="mt-2" disabled={!pastedReadings.trim()} onClick={addPastedReadings}>Add pasted readings</Button>
        </Collapsible>
      </Panel>

      <Panel title="What keeps coming back" action={<Button size="sm" variant="outline" onClick={logFeedback} disabled={!feedbackTheme.trim()}><Plus className="size-4" /> Log feedback</Button>}>
        <p className="text-sm font-semibold text-muted-foreground">Themes appear only after the same feedback comes back on another paper.</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2"><Input value={feedbackTheme} onChange={(event) => setFeedbackTheme(event.target.value)} placeholder="Feedback theme" aria-label="Feedback theme" /><Select value={feedbackAssignmentId || 'none'} onValueChange={(value) => setFeedbackAssignmentId(value === 'none' ? '' : value)}><SelectTrigger aria-label="Paper for feedback"><SelectValue placeholder="Link a paper (optional)" /></SelectTrigger><SelectContent><SelectItem value="none">No paper linked</SelectItem>{assignments.map((assignment) => <SelectItem key={assignment.id} value={assignment.id}>{assignment.title}</SelectItem>)}</SelectContent></Select></div>
        <Textarea value={feedbackQuote} onChange={(event) => setFeedbackQuote(event.target.value)} className="mt-2 min-h-20" placeholder="Professor quote (optional)" aria-label="Professor quote" />
        <div className="mt-3 space-y-2">{feedbackThemes.map((theme) => <WritingFeedbackTheme key={theme.key} theme={theme} assignments={assignments} />)}{!feedbackThemes.length && <p className="writing-empty-copy">No recurring feedback theme yet. Individual notes are saved, but one comment is not a pattern.</p>}</div>
      </Panel>
      {current && <p className="sr-only">Current draft: {current.title}</p>}
    </div>
  )
}

const DRAFT_STAGES: PaperDraft['stage'][] = ['outline', 'draft', 'revision', 'submitted']

function WritingDraftRow({ draft, assignment, onStage, onTarget }: {
  draft: PaperDraft
  assignment?: ClassAssignment
  onStage: (id: string, stage: PaperDraft['stage']) => void
  onTarget: (value: string) => void
}) {
  const stageIndex = DRAFT_STAGES.indexOf(draft.stage)
  return <div className="writing-record-row">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="font-extrabold">{draft.title}</p>
        <p className="mt-1 text-xs font-semibold text-muted-foreground">Professor deadline · {assignment?.dueDate ? fmtDeadline(assignment.dueDate) : 'Not recorded'}</p>
      </div>
      <label className="min-w-[10rem] text-xs font-bold text-muted-foreground">Your target
        <Input type="date" value={draft.selfDeadline ?? ''} onChange={(event) => onTarget(event.target.value)} className="mt-1 h-8 rounded-[11px] bg-card text-xs" aria-label={`Your target for ${draft.title}`} />
      </label>
    </div>
    <div className="writing-draft-rail" aria-label={`Draft stage for ${draft.title}`}>
      {DRAFT_STAGES.map((stage, index) => <div key={stage} className="contents">
        <button type="button" onClick={() => onStage(draft.id, stage)} data-state={index < stageIndex ? 'done' : index === stageIndex ? 'current' : 'upcoming'} className="writing-draft-stage" aria-pressed={draft.stage === stage} aria-label={`Set ${draft.title} to ${titleCase(stage)}${draft.stage === stage ? ', current stage' : ''}`}>
          <span className="writing-stage-pip" aria-hidden="true">{index < stageIndex && <Check className="size-2.5 stroke-[3]" />}</span>
          <span>{titleCase(stage)}</span>
        </button>
        {index < DRAFT_STAGES.length - 1 && <span className={cn('writing-stage-link', index < stageIndex && 'is-done')} aria-hidden="true" />}
      </div>)}
    </div>
    {draft.selfDeadline && <p className="writing-target-note">Your target · {fmtDeadline(draft.selfDeadline)}. The professor&apos;s deadline stays separate.</p>}
  </div>
}

function WritingReadingRow({ reading, onStatus }: { reading: AssignedReading; onStatus: (id: string, status: AssignedReading['status']) => void }) {
  const status = readingStatus(reading.status)
  return <div className="writing-record-row flex flex-wrap items-center justify-between gap-3">
    <div className="min-w-0"><p className="font-extrabold">{reading.title}</p><p className="mt-1 text-xs font-semibold text-muted-foreground">{reading.week}{reading.dueForDiscussion ? ` · ${fmtEventDate(reading.dueForDiscussion)} discussion` : reading.source ? ` · ${reading.source}` : ''}</p></div>
    <DropdownMenu>
      <DropdownMenuTrigger asChild><Button size="sm" variant="outline" className={cn('writing-reading-status', status.className)} aria-label={`Reading status for ${reading.title}: ${status.label}`}>{status.label}<ChevronDown className="size-3.5" /></Button></DropdownMenuTrigger>
      <DropdownMenuContent align="end"><DropdownMenuItem onClick={() => onStatus(reading.id, 'read')}>Read</DropdownMenuItem><DropdownMenuItem onClick={() => onStatus(reading.id, 'skimmed')}>Skimmed</DropdownMenuItem><DropdownMenuItem onClick={() => onStatus(reading.id, 'not-started')}>Not started</DropdownMenuItem></DropdownMenuContent>
    </DropdownMenu>
  </div>
}

function ReadingTermDots({ readings }: { readings: AssignedReading[] }) {
  return <div className="writing-term-dots" role="list" aria-label={`${readings.length} recorded reading${readings.length === 1 ? '' : 's'} this term`}><span>Term</span>{readings.map((reading) => <i key={reading.id} role="listitem" title={`${reading.title}: ${readingStatus(reading.status).label}`} aria-label={`${reading.title}: ${readingStatus(reading.status).label}`} className={cn('writing-term-dot', reading.status)} />)}</div>
}

function WritingFeedbackTheme({ theme, assignments }: { theme: ReturnType<typeof recurringFeedbackThemes>[number]; assignments: ClassAssignment[] }) {
  const linkedPapers = theme.paperIds.map((id) => assignments.find((assignment) => assignment.id === id)?.title).filter((title): title is string => Boolean(title))
  const quote = theme.notes.find((note) => note.quote)?.quote
  const evidenceLabel = theme.paperIds.length ? `${theme.paperIds.length} paper${theme.paperIds.length === 1 ? '' : 's'}` : `${theme.notes.length} recorded note${theme.notes.length === 1 ? '' : 's'}`
  return <div className="writing-feedback-theme"><div className="flex flex-wrap items-center justify-between gap-2"><p className="font-display text-base font-extrabold">{theme.label}</p><Badge variant="warning">{evidenceLabel}</Badge></div>{quote && <q>{quote}</q>}<p className="writing-feedback-source">{linkedPapers.length ? linkedPapers.join(' · ') : `${theme.notes.length} recorded note${theme.notes.length === 1 ? '' : 's'} without a linked paper`} · most recent {fmtFeedbackDate(theme.notes)}</p></div>
}

function WritingEmptyState({ icon: Icon, title, detail }: { icon: typeof BookOpen; title: string; detail: string }) {
  return <div className="writing-empty-state"><Icon className="size-5 text-muted-foreground" /><div><p className="font-extrabold">{title}</p><p className="mt-1 text-sm font-semibold text-muted-foreground">{detail}</p></div></div>
}

function readingStatus(status: AssignedReading['status']) {
  if (status === 'read') return { label: 'Read', className: 'is-read' }
  if (status === 'skimmed') return { label: 'Skimmed', className: 'is-skimmed' }
  return { label: 'Not started', className: 'is-not-started' }
}

function fmtFeedbackDate(notes: FeedbackNote[]) {
  const latest = notes.reduce((current, note) => Math.max(current, note.createdAt), 0)
  return latest ? new Date(latest).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'date not recorded'
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
      <div className="rounded-2xl border border-dashed border-border bg-muted p-5">
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
  course, classType, data, files, topics, notes, writingTools,
}: { course: Course; classType: ClassWorkspaceType; data: ClassCenterData; files: AcademicFile[]; topics: Topic[]; notes: ClassNote[]; writingTools?: React.ReactNode }) {
  const courseId = course.id
  const navigate = useNavigate()
  const [materialParams, setMaterialParams] = useSearchParams()
  const [filter, setFilter] = useState<'all' | 'course' | 'mine' | 'generated' | 'unassigned'>('all')
  const [groupBy, setGroupBy] = useState<MaterialGroupBy>('week')
  const requestedArtifact = isMaterialArtifact(materialParams.get('createMaterial')) ? materialParams.get('createMaterial') as MaterialArtifact : null
  const requestedNoteId = materialParams.get('materialNote')
  const [artifact, setArtifact] = useState<MaterialArtifact | null>(requestedArtifact)
  const folderIntakeOpen = materialParams.get('folderIntake') === '1'
  const materialNotes = useMemo(() => notes.filter(isMaterialNote), [notes])
  const groups = useMemo(() => groupMaterials(files, materialNotes, topics, groupBy), [files, groupBy, materialNotes, topics])
  const visible = groups.map((group) => ({
    ...group,
    files: group.files.filter((file) => materialFilterMatches(filter, file.owner, materialIsUnassigned(file, topics))),
    notes: group.notes.filter((note) => materialFilterMatches(filter, materialNoteOwner(note), materialNoteIsUnassigned(note, topics, files))),
  })).filter((group) => group.files.length || group.notes.length)
  const categories = data.gradeCategories.filter((item) => item.courseId === courseId).sort((a, b) => a.order - b.order)
  useEffect(() => setArtifact(requestedArtifact), [requestedArtifact])

  function openArtifact(nextArtifact: MaterialArtifact) {
    setArtifact(nextArtifact)
    const next = new URLSearchParams(materialParams)
    next.set('classTab', 'materials')
    next.set('createMaterial', nextArtifact)
    setMaterialParams(next, { replace: true })
  }

  function closeArtifact() {
    setArtifact(null)
    const next = new URLSearchParams(materialParams)
    next.delete('createMaterial')
    setMaterialParams(next, { replace: true })
  }
  function patchCategory(id: string, patch: Partial<GradeCategory>) {
    useStore.getState().update((draft) => {
      const category = draft.academics.classCenter.gradeCategories.find((item) => item.id === id)
      if (category) Object.assign(category, patch, { updatedAt: Date.now() })
    })
  }

  function openFolderIntake() {
    const next = new URLSearchParams(materialParams)
    next.set('classTab', 'materials')
    next.set('folderIntake', '1')
    setMaterialParams(next, { replace: true })
  }

  function closeFolderIntake() {
    const next = new URLSearchParams(materialParams)
    next.delete('folderIntake')
    next.delete('driveConnection')
    setMaterialParams(next, { replace: true })
  }

  if (folderIntakeOpen) return <MaterialFolderIntake course={course} onBack={closeFolderIntake} />

  return (
    // Visual provenance: mockup-lab/01-academics/academics-class-hub.html,
    // approved Variant A, view=materials.
    <div className="class-hub-materials space-y-3">
      <SectionToolbar
        title="Materials"
        detail={`${files.length + materialNotes.length} ${(files.length + materialNotes.length) === 1 ? 'course item' : 'course items'} · week first`}
        action={<div className="class-hub-material-add"><MaterialIntakeDialog courseId={courseId} trigger={<Button size="sm"><Plus className="size-4" /> Add material</Button>} /></div>}
      />
      <div className="class-hub-material-filters" aria-label="Material filters">
        {(['all', 'course', 'mine', 'generated', 'unassigned'] as const).map((value) => (
          <button key={value} type="button" aria-pressed={filter === value} className={cn('class-hub-material-filter', filter === value && 'is-active')} onClick={() => setFilter(value)}>
            {value === 'all' ? `All ${files.length + materialNotes.length}` : value === 'course' ? 'From the course' : value === 'mine' ? 'My notes' : titleCase(value)}
          </button>
        ))}
        <label className="class-hub-material-sort">
          <span className="sr-only">Group materials</span>
          <Select value={groupBy} onValueChange={(value) => setGroupBy(value as MaterialGroupBy)}>
            <SelectTrigger aria-label="Group materials"><SelectValue /></SelectTrigger>
            <SelectContent align="end">
              <SelectItem value="week">By week</SelectItem>
              <SelectItem value="unit">By unit</SelectItem>
              <SelectItem value="category">By category</SelectItem>
            </SelectContent>
          </Select>
        </label>
      </div>
      {artifact === 'revised-notes'
        ? <div className="space-y-2"><div className="flex justify-end"><Button size="sm" variant="ghost" onClick={closeArtifact}>Close revised notes</Button></div><RevisedNotesPanel courseId={courseId} files={files} data={data} /></div>
        : artifact && <MaterialGenerationIntake artifact={artifact} courseId={courseId} courseLabel={course.code} course={{ code: course.code, title: course.title, type: classType }} files={files} onClose={closeArtifact} />}
      {writingTools}
      {visible.map((group) => (
        <Card key={group.key} className="class-hub-material-group">
          <CardHeader className="class-hub-panel-header flex-row items-start justify-between gap-3">
            <div><p className="class-hub-material-eyebrow">{group.eyebrow}</p><CardTitle>{group.label}</CardTitle><p className="mt-1 text-xs font-bold text-muted-foreground">{group.topicCount ? `${group.topicCount} linked syllabus ${group.topicCount === 1 ? 'objective' : 'objectives'}` : group.unassigned ? 'No syllabus placement yet' : `${group.files.length + group.notes.length} ${(group.files.length + group.notes.length) === 1 ? 'item' : 'items'}`}</p></div>
            <Badge variant={group.unassigned ? 'warning' : 'outline'}>{group.files.length + group.notes.length} {group.files.length + group.notes.length === 1 ? 'item' : 'items'}</Badge>
          </CardHeader>
          <CardContent className="class-hub-material-group-content">
            {group.unassigned && <div className="rounded-xl border border-dashed border-amber-500/45 bg-amber-500/8 p-3 text-sm font-semibold">Unassigned items stay available here until a syllabus objective gives them a week or unit.</div>}
            {group.files.map((file) => <FileRow key={file.id} file={file} ownership={file.owner} unassigned={materialIsUnassigned(file, topics)} onReimport={file.type === 'syllabus' ? () => navigate(`/academics?mode=daily&tab=class-center&importFor=${courseId}&reimport=1&reimportFile=${file.id}`) : undefined} />)}
            {group.notes.map((note) => <MaterialNoteRow key={note.id} note={note} open={note.id === requestedNoteId} unassigned={materialNoteIsUnassigned(note, topics, files)} />)}
            {groupBy !== 'category' && !group.unassigned && <div className="class-hub-material-prime">
              <div><p>Prime yourself</p><span>Hold one question in mind before this module&apos;s next lecture.</span></div>
              <Button size="sm" variant="outline" onClick={() => addQuestionNote(courseId, group.unitLabel ?? group.label)}>Add to Guide</Button>
            </div>}
          </CardContent>
        </Card>
      ))}
      {!visible.length && <EmptyState icon={FolderOpen} title="No materials in this view" detail={files.length ? 'Try another filter.' : 'Add course files from the class actions menu.'} />}

      <Collapsible title="Material tools" badge={<span className="class-hub-material-tools-badge">Import · generate · prepare</span>}>
        <div className="class-hub-material-tools-actions">
          <Button size="sm" variant="outline" onClick={() => navigate(`/academics?mode=daily&tab=class-center&importFor=${courseId}`)}><FileText className="size-4" /> Import syllabus</Button>
          <DropdownMenu><DropdownMenuTrigger asChild><Button size="sm" variant="outline"><FileStack className="size-4" /> Create study resources <ChevronDown className="size-3.5" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><ResourceMenuItems classType={classType} onChoose={openArtifact} /><DropdownMenuSeparator /><DropdownMenuItem onClick={openFolderIntake}><FolderOpen className="size-4" /> Connect a notes folder</DropdownMenuItem></DropdownMenuContent></DropdownMenu>
        </div>
        <div className="mt-3 space-y-3">
          <MaterialCatalog files={files} topics={topics} />
          <AssessmentCatalog courseId={courseId} data={data} files={files} />
          <GeneratedFlashcardDecks courseId={courseId} data={data} />
          <GeneratedMasteryOutlines courseId={courseId} data={data} />
          <GeneratedUnitQuestionBanks courseId={courseId} data={data} />
          <CalendarReview assignments={data.assignments.filter((item) => item.courseId === courseId)} />
          {!!categories.length && <Card className="class-hub-panel"><CardHeader className="class-hub-panel-header"><CardTitle>Grade categories</CardTitle><p className="mt-1 text-sm text-muted-foreground">Saved from your syllabus. Editable records only.</p></CardHeader><CardContent className="class-hub-panel-content space-y-2">{categories.map((category) => <div key={category.id} className="class-hub-record-row grid gap-2 rounded-xl p-3 sm:grid-cols-[1fr_7rem]"><Input aria-label="Grade category" value={category.name} onChange={(event) => patchCategory(category.id, { name: event.target.value })} /><Input aria-label="Grade category weight" type="number" min="0" max="100" value={category.weight} onChange={(event) => patchCategory(category.id, { weight: Number(event.target.value) || 0 })} />{category.policyNote && <p className="text-xs font-semibold text-muted-foreground sm:col-span-2">Policy (verbatim): {category.policyNote}</p>}{category.source && <p className="text-xs text-muted-foreground sm:col-span-2">{category.source}</p>}</div>)}</CardContent></Card>}
        </div>
      </Collapsible>
      <p className="sr-only">{data.files.length} files are stored across all classes.</p>
    </div>
  )
}

function ResourceMenuItems({ classType, onChoose }: { classType: ClassWorkspaceType; onChoose: (artifact: MaterialArtifact) => void }) {
  return <>
    <DropdownMenuLabel>{classType === 'stem' ? 'Choose a format' : 'Formats for this class'}</DropdownMenuLabel>
    {classType === 'stem' && <DropdownMenuItem onClick={() => onChoose('flashcards')}><Brain className="size-4" /> Flashcards</DropdownMenuItem>}
    <DropdownMenuItem onClick={() => onChoose('study-guide')}><BookOpen className="size-4" /> Study guide</DropdownMenuItem>
    <DropdownMenuItem onClick={() => onChoose('unit-mastery-outline')}><ListChecks className="size-4" /> Mastery Map</DropdownMenuItem>
    {classType !== 'writing' && <DropdownMenuItem onClick={() => onChoose('unit-question-bank')}><FileText className="size-4" /> {classType === 'stem' ? 'Unit question bank' : 'Practice questions'}</DropdownMenuItem>}
    <DropdownMenuItem onClick={() => onChoose('revised-notes')}><NotebookText className="size-4" /> Revised notes</DropdownMenuItem>
  </>
}

function GeneratedFlashcardDecks({ courseId, data }: { courseId: string; data: ClassCenterData }) {
  const decks = data.generatedFlashcardDecks.filter((deck) => deck.courseId === courseId)
  if (!decks.length) return null
  return <section className="rounded-2xl border border-border bg-card p-4" aria-label="Generated flashcards">
    <div className="flex flex-wrap items-end justify-between gap-2 border-b border-border pb-3"><div><p className="text-[10px] font-extrabold uppercase tracking-[0.13em] text-primary">Generated resource</p><h3 className="mt-1 font-display text-lg font-extrabold">Flashcards</h3></div><Badge variant="outline">{decks.reduce((total, deck) => total + deck.cards.length, 0)} cards</Badge></div>
    <div className="mt-3 space-y-2">{decks.map((deck) => <details key={deck.id} className="class-hub-record-row rounded-[13px] p-3"><summary className="cursor-pointer list-none font-display text-sm font-extrabold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{deck.title}<span className="ml-2 font-sans text-xs font-bold text-muted-foreground">{deck.cards.length} cards · {deck.sourceChunkIds.length} source passages</span></summary><div className="mt-3 divide-y divide-border border-t border-border">{deck.cards.map((card, index) => <div key={card.id} className="grid gap-1 py-3 text-sm sm:grid-cols-[2rem_minmax(0,1fr)_minmax(0,1fr)] sm:gap-3"><span className="text-xs font-extrabold text-primary">{index + 1}</span><p className="font-bold">{card.cloze ?? card.front}</p><p className="text-muted-foreground">{card.back ?? card.extra ?? 'Cloze answer is retained in the card.'}</p></div>)}</div></details>)}</div>
    <p className="mt-3 text-xs font-semibold text-muted-foreground">Source-backed class resource only. Review scheduling and Anki export are not part of Academics.</p>
  </section>
}

function GeneratedMasteryOutlines({ courseId, data }: { courseId: string; data: ClassCenterData }) {
  const outlines = data.generatedMasteryOutlines.filter((outline) => outline.courseId === courseId)
  if (!outlines.length) return null
  return <section className="rounded-2xl border border-border bg-card p-4" aria-label="Generated Mastery Maps">
    <div className="flex flex-wrap items-end justify-between gap-2 border-b border-border pb-3"><div><p className="text-[10px] font-extrabold uppercase tracking-[0.13em] text-primary">Generated resource</p><h3 className="mt-1 font-display text-lg font-extrabold">Mastery Maps</h3></div><Badge variant="outline">{outlines.length} {outlines.length === 1 ? 'scope' : 'scopes'}</Badge></div>
    <div className="mt-3 space-y-2">{outlines.map((outline) => <details key={outline.id} className="class-hub-record-row rounded-[13px] p-3"><summary className="cursor-pointer list-none font-display text-sm font-extrabold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{outline.title}<span className="ml-2 font-sans text-xs font-bold text-muted-foreground">{outline.unit} · {outline.standards.length} standards</span></summary><div className="mt-3 space-y-3 border-t border-border pt-3">{outline.standards.map((standard) => <div key={standard.id} className="grid gap-2 text-sm sm:grid-cols-3"><div><p className="font-display font-extrabold">{standard.title}</p><p className="mt-1 text-xs font-bold uppercase tracking-wide text-primary">Understand</p><p className="text-muted-foreground">{standard.understand.join(' ') || 'Not stated'}</p></div><div><p className="text-xs font-bold uppercase tracking-wide text-primary">Be able to do</p><p className="text-muted-foreground">{standard.beAbleToDo.join(' ') || 'Not stated'}</p></div><div><p className="text-xs font-bold uppercase tracking-wide text-primary">Watch for</p><p className="text-muted-foreground">{standard.watchFor.join(' ') || 'Not stated'}</p></div></div>)}</div></details>)}</div>
    <p className="mt-3 text-xs font-semibold text-muted-foreground">Syllabus standards remain the Topic contract; lecture concepts only provide supporting evidence.</p>
  </section>
}

function GeneratedUnitQuestionBanks({ courseId, data }: { courseId: string; data: ClassCenterData }) {
  const banks = data.generatedUnitQuestionBanks.filter((bank) => bank.courseId === courseId)
  if (!banks.length) return null
  return <section className="rounded-2xl border border-border bg-card p-4" aria-label="Generated unit question banks">
    <div className="flex flex-wrap items-end justify-between gap-2 border-b border-border pb-3"><div><p className="text-[10px] font-extrabold uppercase tracking-[0.13em] text-primary">Generated resource</p><h3 className="mt-1 font-display text-lg font-extrabold">Unit question banks</h3></div><Badge variant="outline">{banks.reduce((total, bank) => total + bank.questions.length, 0)} questions</Badge></div>
    <div className="mt-3 space-y-2">{banks.map((bank) => <details key={bank.id} className="class-hub-record-row rounded-[13px] p-3"><summary className="cursor-pointer list-none font-display text-sm font-extrabold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{bank.title}<span className="ml-2 font-sans text-xs font-bold text-muted-foreground">{bank.unit} · {bank.questions.length} questions · {bank.integrationPercent}% prior-unit</span></summary><div className="mt-3 divide-y divide-border border-t border-border">{bank.questions.map((question, index) => <div key={question.id} className="grid gap-1 py-3 text-sm sm:grid-cols-[2rem_minmax(0,1fr)_minmax(0,1fr)] sm:gap-3"><span className="text-xs font-extrabold text-primary">{index + 1}</span><div><p className="font-bold">{question.prompt}</p><p className="mt-1 text-xs font-semibold text-muted-foreground">{question.scope === 'prior-unit-integration' ? 'Prior-unit integration' : 'Current unit'} · {question.move}</p></div><div><p className="font-semibold">Answer: {question.answer}</p><p className="mt-1 text-muted-foreground">{question.rationale}</p></div></div>)}</div></details>)}</div>
    <p className="mt-3 text-xs font-semibold text-muted-foreground">Practice questions are source-grounded and never copied from private or official assessments.</p>
  </section>
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
  const navigate = useNavigate()
  const [filter, setFilter] = useState<'all' | 'with-materials' | 'needs-material' | 'exam-scope'>('all')
  const examTopicIds = new Set(assignments.filter((item) => item.type === 'exam' && !isComplete(item)).flatMap((item) => item.coveredTopicIds ?? []))
  const visibleTopics = topics.filter((item) => {
    const hasMaterial = Boolean((item.linkedFileIds?.length ?? 0) || item.sourceNoteIds.length)
    if (filter === 'with-materials') return hasMaterial
    if (filter === 'needs-material') return !hasMaterial
    if (filter === 'exam-scope') return examTopicIds.has(item.id)
    return true
  })
  const weeks = groupTopicsByWeek(visibleTopics)
  return (
    // Visual provenance: mockup-lab/01-academics/academics-class-hub.html,
    // approved Variant A, view=topics; Andy's ruled week-primary ordering.
    <div className="class-hub-topics space-y-3">
      <SectionToolbar
        title="Topics"
        detail="Syllabus standards, ordered by scheduled week."
        action={<Button size="sm" variant="outline" onClick={() => navigate(`/academics?mode=daily&tab=class-center&importFor=${courseId}`)}><FileText className="size-4" /> Import / refresh syllabus</Button>}
      />
      <div className="class-hub-topic-filters">
        <Button size="sm" variant={filter === 'all' ? 'default' : 'outline'} onClick={() => setFilter('all')}><Filter className="size-4" /> All</Button>
        <Button size="sm" variant={filter === 'with-materials' ? 'default' : 'outline'} onClick={() => setFilter('with-materials')}>With materials</Button>
        <Button size="sm" variant={filter === 'needs-material' ? 'default' : 'outline'} onClick={() => setFilter('needs-material')}>Needs material</Button>
        <Button size="sm" variant={filter === 'exam-scope' ? 'default' : 'outline'} disabled={!examTopicIds.size} onClick={() => setFilter('exam-scope')}>In exam scope</Button>
      </div>
      {weeks.map((week) => {
        const linked = week.topics.filter((item) => (item.linkedFileIds?.length ?? 0) || item.sourceNoteIds.length).length
        const inScope = week.topics.some((item) => examTopicIds.has(item.id))
        return (
          <Card key={week.key} className="class-hub-topic-week">
            <CardHeader className="class-hub-panel-header">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div><p className="class-hub-topic-eyebrow">Syllabus order</p><CardTitle>{week.label}</CardTitle><p className="mt-1 text-xs font-bold text-muted-foreground">{week.units.length ? week.units.join(' · ') : 'Unit not named'} · {linked}/{week.topics.length} with material</p></div>
                {inScope && <Badge variant="warning">Upcoming exam scope</Badge>}
              </div>
              <Progress value={week.topics.length ? (linked / week.topics.length) * 100 : 0} aria-label={`${linked} of ${week.topics.length} topics have linked material`} />
            </CardHeader>
            <CardContent className="class-hub-panel-content space-y-2">
              {week.topics.map((topic) => <TopicRow key={topic.id} topic={topic} data={data} onOpenNotes={onOpenNotes} />)}
            </CardContent>
          </Card>
        )
      })}
      {!weeks.length && <EmptyState icon={Target} title="No topics in this view" detail={topics.length ? 'Choose another status filter.' : 'Import the syllabus to create learning standards and objectives.'} />}
    </div>
  )
}

function Assignments({ courseId, assignments, categories, focusWhatIf = false }: { courseId: string; assignments: ClassAssignment[]; categories: GradeCategory[]; focusWhatIf?: boolean }) {
  const whatIfRef = useRef<HTMLElement>(null)
  useEffect(() => {
    if (!focusWhatIf) return
    const frame = window.requestAnimationFrame(() => {
      whatIfRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' })
      whatIfRef.current?.querySelector<HTMLElement>('button, input, [role="combobox"]')?.focus({ preventScroll: true })
    })
    return () => window.cancelAnimationFrame(frame)
  }, [focusWhatIf])
  return (
    <div className="class-hub-assignments space-y-4">
      <SectionToolbar title="Assignments" detail="Coursework execution, fixed to this class." />
      <AssignmentsPanel courseId={courseId} />
      <section ref={whatIfRef} aria-labelledby="course-grade-context" tabIndex={-1}>
        <p id="course-grade-context" className="class-hub-support-label">Course grade context · supporting</p>
        <WhatIf assignments={assignments} categories={categories} />
      </section>
    </div>
  )
}

function Guide({ courseId, workspace, notes, topics, assignments, contacts, data, onOpenMaterials, topicFilter }: {
  courseId: string
  workspace: ClassWorkspace
  notes: ClassNote[]
  topics: Topic[]
  assignments: ClassAssignment[]
  contacts: ClassContact[]
  data: ClassCenterData
  onOpenMaterials: () => void
  /** Set when arriving from a topic's menu, so the tab lands on that topic. */
  topicFilter?: string
}) {
  const guideNotes = notes.filter(isGuideNote)
  const scoped = topicFilter ? guideNotes.filter((item) => item.topicIds.includes(topicFilter)) : guideNotes
  const focus = topicFilter ? topics.find((item) => item.id === topicFilter) : undefined
  const [, setParams] = useSearchParams()
  useEffect(() => {
    const known = new Set(data.guideProposals.map((item) => `${item.source.sourceRecordKind}:${item.source.sourceRecordId}`))
    if (!buildSyllabusGuideProposals(data, courseId).some((item) => !known.has(`${item.source.sourceRecordKind}:${item.source.sourceRecordId}`))) return
    useStore.getState().update((draft) => { ensureSyllabusGuideProposals(draft.academics.classCenter, courseId) })
  }, [courseId, data])
  const sections = [
    { key: 'exam', title: 'Exam intel', notes: scoped.filter((item) => item.type === 'exam-review') },
    { key: 'questions', title: 'Questions to ask', notes: scoped.filter((item) => item.type === 'question-log') },
    { key: 'priming', title: 'Priming rollup', notes: scoped.filter((item) => item.type === 'reading' && item.title.startsWith('Prime:')) },
    { key: 'context', title: 'Course support & requirements', notes: scoped.filter((item) => item.type === 'other') },
  ]
  const topicNotes = topics.map((topic) => ({ topic, notes: guideNotes.filter((note) => note.topicIds.includes(topic.id)) })).filter((item) => item.notes.length)
  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
      <div className="space-y-4">
        <SectionToolbar title="Guide" detail="Exam intel, questions, priming, and class context. Material notes remain in Materials." action={<Button onClick={() => addBlankNote(courseId)}><Plus className="size-4" /> New Guide item</Button>} />
        {focus && (
          <div className="flex items-center gap-2 rounded-xl border border-border bg-muted px-3 py-2">
            <p className="text-xs font-bold">
              Showing Guide items linked to <b className="font-display">{focus.title}</b>
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
              Show all Guide items
            </Button>
          </div>
        )}
        <CourseLensPanel workspace={workspace} data={data} />
        <GuideSuggestions courseId={courseId} data={data} onOpenMaterials={onOpenMaterials} />
        <ProfessorEvidencePanel courseId={courseId} data={data} assignments={assignments} contacts={contacts} />
        {contacts.length > 0 && (
          <Card className="class-hub-panel">
            <CardHeader className="class-hub-panel-header"><CardTitle>People &amp; office hours</CardTitle></CardHeader>
            <CardContent className="class-hub-panel-content divide-y divide-border p-0">
              {contacts.map((contact) => (
                <div key={contact.id} className="grid gap-1 px-4 py-3 sm:grid-cols-[minmax(0,180px)_minmax(0,1fr)] sm:gap-4">
                  <div>
                    <p className="font-display text-sm font-extrabold">{contact.name}</p>
                    <p className="text-[10px] font-extrabold uppercase tracking-wide text-primary">{contact.role}</p>
                  </div>
                  <div className="text-sm font-semibold text-muted-foreground">
                    <p>{contact.officeHours || 'Office hours not listed'}</p>
                    {(contact.location || contact.email) && <p className="mt-0.5 text-xs">{[contact.location, contact.email].filter(Boolean).join(' · ')}</p>}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
        {sections.map((section) => (
          <Card key={section.key} className="class-hub-panel">
            <CardHeader className="class-hub-panel-header"><CardTitle>{section.title}</CardTitle></CardHeader>
            <CardContent className="class-hub-panel-content space-y-2">
              {section.notes.map((note) => <NoteRow key={note.id} note={note} />)}
              {!section.notes.length && <p className="text-sm font-semibold text-muted-foreground">Nothing recorded here yet.</p>}
            </CardContent>
          </Card>
        ))}
      </div>
      <aside className="space-y-3 xl:sticky xl:top-20 xl:self-start">
        <h2 className="font-display text-xl font-extrabold">Linked class context</h2>
        {topicNotes.map(({ topic, notes: linked }) => (
          <Card key={topic.id} className="class-hub-panel"><CardContent className="class-hub-panel-content p-4"><p className="font-extrabold">{topic.title}</p><p className="mt-1 text-sm text-muted-foreground">{linked.map((note) => note.title).join(' · ')}</p></CardContent></Card>
        ))}
        {!topicNotes.length && <EmptyState icon={NotebookText} title="No linked Guide items" detail="Link a class-context item to a syllabus topic to build this rail." />}
      </aside>
    </div>
  )
}

/**
 * Interpretive courses sometimes need a durable, attributable course frame.
 * This stays in Guide because it is context ABOUT how the course reads
 * material; it never becomes a generic material note or a Topic substitute.
 */
function CourseLensPanel({ workspace, data }: { workspace: ClassWorkspace; data: ClassCenterData }) {
  const toast = useToast()
  const lens = workspace.courseLens
  const [editing, setEditing] = useState(!lens)
  const [text, setText] = useState(lens?.text ?? '')
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>(lens?.sourceFileIds ?? [])
  const sources = useMemo(() => data.files.filter((file) => file.courseId === workspace.courseId && file.owner !== 'generated' && (file.type === 'syllabus' || file.type === 'transcript' || file.owner === 'course')).map((file) => ({
    file,
    chunks: data.sourceChunks.filter((chunk) => chunk.courseId === workspace.courseId && chunk.fileId === file.id && Boolean(chunk.content.trim())),
  })).filter((source) => source.chunks.length), [data.files, data.sourceChunks, workspace.courseId])
  const selectedSources = sources.filter((source) => selectedFileIds.includes(source.file.id))
  const selectedChunkIds = selectedSources.flatMap((source) => source.chunks.map((chunk) => chunk.id))
  const canSave = Boolean(text.trim() && selectedSources.length && selectedChunkIds.length)

  function toggle(fileId: string) {
    setSelectedFileIds((current) => current.includes(fileId) ? current.filter((id) => id !== fileId) : [...current, fileId])
  }

  function save() {
    if (!canSave) return
    const now = Date.now()
    useStore.getState().update((draft) => {
      // ClassHub receives a display view keyed by course. Persist through the
      // stable course link, as the other class-level settings do.
      const target = draft.academics.classCenter.workspaces.find((item) => item.courseId === workspace.courseId)
      if (!target) return
      target.courseLens = { text: text.trim(), sourceFileIds: selectedSources.map((source) => source.file.id), sourceChunkIds: selectedChunkIds, updatedAt: now }
      target.updatedAt = now
    })
    setEditing(false)
    toast({ title: 'Course lens saved', description: 'It can guide a study guide only when you explicitly include its listed evidence.' })
  }

  if (!editing && lens) {
    const labels = lens.sourceFileIds.map((id) => data.files.find((file) => file.id === id)?.title ?? 'Unavailable material')
    return <Card className="class-hub-panel"><CardHeader className="class-hub-panel-header flex-row items-start justify-between gap-3"><div><p className="text-[10px] font-extrabold uppercase tracking-[0.13em] text-primary">How this class reads material</p><CardTitle className="mt-1">Course lens</CardTitle><p className="mt-2 text-sm font-semibold text-muted-foreground">{lens.text}</p><p className="mt-3 text-xs font-semibold text-muted-foreground">Sourceable from: {labels.join(' · ')}</p></div><Button size="sm" variant="outline" onClick={() => setEditing(true)}>Review / edit</Button></CardHeader></Card>
  }

  if (!editing) {
    return <Card className="class-hub-panel"><CardHeader className="class-hub-panel-header flex-row items-start justify-between gap-3"><div><p className="text-[10px] font-extrabold uppercase tracking-[0.13em] text-primary">How this class reads material</p><CardTitle className="mt-1">Course lens</CardTitle><p className="mt-2 text-sm font-semibold text-muted-foreground">Optional, source-backed framing for interpretive course material.</p></div><Button size="sm" variant="outline" onClick={() => setEditing(true)}>Add course lens</Button></CardHeader></Card>
  }

  return <Card className="class-hub-panel"><CardHeader className="class-hub-panel-header"><p className="text-[10px] font-extrabold uppercase tracking-[0.13em] text-primary">How this class reads material</p><CardTitle className="mt-1">Course lens</CardTitle><p className="mt-1 text-sm text-muted-foreground">Optional course-level context for interpretive study. Ground it in the syllabus, learning goals, selected course material, or lecture evidence—not a course title or generic analysis.</p></CardHeader><CardContent className="class-hub-panel-content space-y-3"><label className="block text-sm font-extrabold">Course lens<Textarea aria-label="Course lens" className="mt-2 min-h-28" value={text} onChange={(event) => setText(event.target.value)} placeholder="Example: Read cases through the comparative healing systems, ethnographic context, and questions of authority this course has named." /></label><div><p className="text-sm font-extrabold">Evidence for this lens</p><p className="mt-1 text-xs font-semibold text-muted-foreground">Choose the course sources that support the frame. Only listed evidence can travel with a generated guide.</p>{sources.length ? <div className="mt-3 flex flex-wrap gap-2">{sources.map((source) => { const selected = selectedFileIds.includes(source.file.id); return <button key={source.file.id} type="button" aria-pressed={selected} onClick={() => toggle(source.file.id)} className={cn('rounded-xl border px-3 py-2 text-left text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring', selected ? 'border-primary bg-primary/8 text-primary' : 'border-border bg-card hover:border-primary/45')}><span className="block">{source.file.title}</span><span className="mt-1 block text-xs font-semibold text-muted-foreground">{source.chunks.length} readable {source.chunks.length === 1 ? 'passage' : 'passages'}</span></button> })}</div> : <p className="mt-3 rounded-xl border border-dashed border-border bg-muted/30 p-3 text-sm font-semibold text-muted-foreground">No readable syllabus, course material, or lecture evidence is ready yet. Keep the lens unset until there is something reviewable.</p>}</div><div className="flex flex-wrap justify-end gap-2"><Button size="sm" variant="ghost" onClick={() => { setText(lens?.text ?? ''); setSelectedFileIds(lens?.sourceFileIds ?? []); setEditing(false) }}>Cancel</Button><Button size="sm" disabled={!canSave} onClick={save}>Save course lens</Button></div></CardContent></Card>
}

/** Syllabus and lecture suggestions remain editable, sourceable drafts. */
function GuideSuggestions({ courseId, data, onOpenMaterials }: { courseId: string; data: ClassCenterData; onOpenMaterials: () => void }) {
  const toast = useToast()
  const [playingId, setPlayingId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draftTitle, setDraftTitle] = useState('')
  const [draftText, setDraftText] = useState('')
  const proposals = guideProposalsForCourse(data, courseId, 'pending')

  if (!proposals.length) return null

  async function playSource(proposalId: string) {
    const proposal = data.guideProposals.find((item) => item.id === proposalId && item.courseId === courseId)
    if (proposal?.source.sourceKind !== 'lecture') { onOpenMaterials(); return }
    const lecture = data.lectures.find((item) => item.id === proposal.source.sourceId && item.courseId === courseId)
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
    let outcome: ReturnType<typeof acceptGuideProposal> = { ok: false, reason: 'Nothing changed.' }
    useStore.getState().update((draft) => {
      outcome = acceptGuideProposal(draft.academics.classCenter, courseId, proposalId)
    })
    toast(outcome.ok ? { title: 'Added to Guide', description: 'The saved item keeps its reviewed source.' } : { title: 'Suggestion not saved', description: outcome.reason, tone: 'error' })
  }

  function dismiss(proposalId: string) {
    useStore.getState().update((draft) => {
      dismissGuideProposal(draft.academics.classCenter, courseId, proposalId)
    })
  }

  function startEditing(proposal: (typeof proposals)[number]) {
    setEditingId(proposal.id)
    setDraftTitle(proposal.draftTitle)
    setDraftText(proposal.draftText)
  }

  function saveDraft(proposalId: string) {
    useStore.getState().update((draft) => {
      editGuideProposal(draft.academics.classCenter, courseId, proposalId, { title: draftTitle, text: draftText })
    })
    setEditingId(null)
  }

  return (
    <Card className="class-hub-panel">
      <CardHeader className="class-hub-panel-header">
        <CardTitle>Suggested additions</CardTitle>
        <p className="mt-1 text-sm text-muted-foreground">Confirmed syllabus facts and exact saved lecture passages. Nothing enters Guide until you review it.</p>
      </CardHeader>
      <CardContent className="class-hub-panel-content space-y-3">
        {proposals.map((proposal) => {
          const lecture = proposal.source.sourceKind === 'lecture' ? data.lectures.find((item) => item.id === proposal.source.sourceId) : undefined
          const valid = isGuideSourceValid(data, courseId, proposal.source)
          const editing = editingId === proposal.id
          return <article key={proposal.id} className="rounded-xl border border-border bg-muted p-3">
            <div className="flex flex-wrap items-start justify-between gap-2"><div><p className="text-xs font-extrabold uppercase tracking-[0.1em] text-primary">{proposal.source.sourceLabel}{proposal.source.sourceLocation ? ` · ${proposal.source.sourceLocation}` : ''}</p><blockquote className="mt-2 font-display text-base font-extrabold">“{proposal.source.sourcePassage || 'Source passage unavailable'}”</blockquote></div><Badge variant={valid ? 'outline' : 'warning'}>{valid ? 'Pending' : 'Source unavailable'}</Badge></div>
            {editing ? <div className="mt-3 space-y-2"><Input value={draftTitle} onChange={(event) => setDraftTitle(event.target.value)} aria-label="Guide suggestion title" /><Textarea value={draftText} onChange={(event) => setDraftText(event.target.value)} aria-label="Guide suggestion text" /><div className="flex gap-2"><Button size="sm" onClick={() => saveDraft(proposal.id)}>Save draft</Button><Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button></div></div> : <><p className="mt-2 font-display text-sm font-extrabold">{proposal.draftTitle || 'Untitled suggestion'}</p><p className="mt-1 text-sm font-semibold text-muted-foreground">{proposal.draftText || 'No draft text is available.'}</p></>}
            {!editing && <div className="mt-3 flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={() => startEditing(proposal)}>Review / edit</Button><Button size="sm" onClick={() => accept(proposal.id)} disabled={!valid || !proposal.draftTitle.trim() || !proposal.draftText.trim()}>Add to Guide</Button><Button size="sm" variant="outline" onClick={() => void playSource(proposal.id)}>{playingId === proposal.id ? 'Playing…' : lecture?.audioBlobRef ? 'Listen locally' : 'Open source'}</Button><Button size="sm" variant="ghost" onClick={() => dismiss(proposal.id)}>Dismiss</Button></div>}
          </article>
        })}
      </CardContent>
    </Card>
  )
}

function WhatIf({ assignments, categories }: { assignments: ClassAssignment[]; categories: GradeCategory[] }) {
  const weighted = categories.filter((item) => item.weight > 0)
  const [categoryId, setCategoryId] = useState(weighted[0]?.id ?? '')
  const [assumption, setAssumption] = useState('90')
  const [target, setTarget] = useState('90')
  const selected = weighted.find((item) => item.id === categoryId) ?? weighted[0]
  const scenario = calculateCourseScenario({ assignments, categories: weighted, selectedCategoryId: selected?.id, assumedPercent: Number(assumption), targetPercent: Number(target) })
  const categoryRows = weighted.map((category) => {
    const graded = assignments.filter((assignment) => assignment.category === category.name && hasGrade(assignment))
    const earned = graded.reduce((total, assignment) => total + (assignment.pointsEarned ?? 0), 0)
    const possible = graded.reduce((total, assignment) => total + (assignment.pointsPossible ?? 0), 0)
    return { ...category, average: possible ? earned / possible * 100 : null }
  })
  const totalWeight = weighted.reduce((total, category) => total + category.weight, 0)
  const current = coursePercent(assignments)
  return (
    <Card className="class-hub-panel class-hub-what-if">
      <CardHeader className="class-hub-panel-header"><CardTitle>What if…</CardTitle><p className="text-sm text-muted-foreground">Assume a result for one remaining category.</p></CardHeader>
      <CardContent className="class-hub-panel-content">
        {weighted.length ? (
          <div className="class-hub-what-if-grid">
            <div className="class-hub-scenario-stage">
              <div className="class-hub-grade-row class-hub-grade-row-summary">
                <span>Locked in so far</span><b>{formatNumber(totalWeight)}% structured</b><strong>{current == null ? 'No graded work' : `${formatNumber(current)}% current`}</strong>
              </div>
              {categoryRows.map((category) => (
                <div key={category.id} className="class-hub-grade-row">
                  <span>{category.name}</span><b>{formatNumber(category.weight)}%</b><strong>{category.average == null ? 'Not graded' : `${formatNumber(category.average)}%`}</strong>
                </div>
              ))}
              <div className="class-hub-scenario-controls">
                <label>Category
                  <Select value={selected?.id ?? ''} onValueChange={setCategoryId}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{weighted.map((item) => <SelectItem key={item.id} value={item.id}>{item.name} · {formatNumber(item.weight)}%</SelectItem>)}</SelectContent>
                  </Select>
                </label>
                <label>Assume %
                  <Input inputMode="decimal" value={assumption} onChange={(event) => setAssumption(event.target.value)} />
                </label>
                <label>Target %
                  <Input inputMode="decimal" value={target} onChange={(event) => setTarget(event.target.value)} />
                </label>
              </div>
            </div>
            <aside className="class-hub-scenario-result">
              <p className="class-hub-scenario-label">Result</p>
              <p className="class-hub-scenario-number">{scenario.projectedPercent == null ? '—' : `${formatNumber(scenario.projectedPercent)}%`}</p>
              <p className="class-hub-scenario-copy">Projected course result</p>
              <div className="class-hub-scenario-needed"><b>{scenario.requiredPercent == null ? '—' : `${formatNumber(scenario.requiredPercent)}%`}</b><span>needed in {selected?.name ?? 'the selected category'} to reach {formatNumber(Number(target))}%</span></div>
              <p>{scenario.highestLeverageCategory ? `${scenario.highestLeverageCategory} has the most recorded leverage.` : 'No weighted category has enough data yet.'}</p>
              <p>Hypothetical · nothing is saved. GPA impact stays in Planning until a letter grade is chosen.</p>
            </aside>
            {scenario.reason && <p className="class-hub-scenario-reason">{scenario.reason}</p>}
            {categories.some((item) => item.policyNote || item.dropLowestCount != null || item.replacementRule != null || item.curvePublished != null) && <div className="rounded-[13px] border border-[var(--border)] bg-[var(--muted)] p-3 text-xs font-semibold text-muted-foreground"><p className="font-extrabold text-foreground">Recorded policies</p>{categories.map((item) => (item.policyNote || item.dropLowestCount != null || item.replacementRule != null || item.curvePublished != null) && <p key={item.id} className="mt-1">{item.name}: {item.policyNote || 'Structured policy recorded'} <span className="text-muted-foreground">— listed, not applied automatically until its rule is fully structured and student-confirmed.</span></p>)}</div>}
          </div>
        ) : <EmptyState icon={HelpCircle} title="Not enough weighted categories yet" detail="Record category, points, and weight before testing a grade scenario." />}
      </CardContent>
    </Card>
  )
}

function TopicRow({ topic, data, onOpenNotes }: {
  topic: Topic
  data: ClassCenterData
  /** Opens the linked operational context without starting a review session. */
  onOpenNotes: (topicId: string) => void
}) {
  const noteCount = data.notes.filter((note) => note.topicIds.includes(topic.id)).length
  const linkedFileCount = topic.linkedFileIds?.length ?? 0
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div className="grid gap-3 rounded-xl border border-border bg-muted p-3 md:grid-cols-[minmax(0,1fr)_auto_auto] md:items-center">
          <div><p className="font-extrabold">{topic.title}</p><p className="text-xs text-muted-foreground">{topic.unit || 'Syllabus objective'} · {linkedFileCount} {linkedFileCount === 1 ? 'material' : 'materials'} · {noteCount} {noteCount === 1 ? 'Guide item' : 'Guide items'}</p></div>
          <Badge className={cn('justify-self-start', linkedFileCount || noteCount ? 'bg-sky-500/12 text-sky-700 dark:text-sky-200' : 'bg-muted text-muted-foreground')}>{linkedFileCount || noteCount ? 'Evidence linked' : 'Needs material'}</Badge>
          <div className="flex items-center gap-1.5">
            <Button size="sm" variant="outline" onClick={() => onOpenNotes(topic.id)}><NotebookText className="size-4" /> Open Guide</Button>
          </div>
          {/* The same link record, written from the topic side. */}
          <AssignmentLinkField topic={topic} />
          {/* §6.6 Connect — the topic graph, authored one relation at a time. */}
          <TopicConnectField topic={topic} />
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent><ContextMenuItem onSelect={() => onOpenNotes(topic.id)}><NotebookText className="size-4" /> Open Guide</ContextMenuItem></ContextMenuContent>
    </ContextMenu>
  )
}

function FileRow({ file, ownership, unassigned, onReimport }: { file: AcademicFile; ownership: 'course' | 'mine' | 'generated'; unassigned?: boolean; onReimport?: () => void }) {
  const toast = useToast()
  const chunks = useStore((s) => s.academics.classCenter.sourceChunks)
  const [summarising, setSummarising] = useState(false)
  const [generationPhase, setGenerationPhase] = useState<GenerationPhase>('idle')
  const [generationError, setGenerationError] = useState('')
  const [opening, setOpening] = useState(false)
  const label = ownership === 'course' ? 'Course' : ownership === 'mine' ? 'Mine' : 'Generated'
  async function openFile() {
    if (file.url) {
      window.open(file.url, '_blank', 'noopener,noreferrer')
      return
    }
    if (!file.blobRef) return
    setOpening(true)
    const blob = await readLocalBlob(file.blobRef)
    setOpening(false)
    if (!blob) {
      toast({ title: 'Local file is unavailable', description: 'The material record remains, but its device-local bytes could not be opened.' })
      return
    }
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank', 'noopener,noreferrer')
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
  }
  const content = (
    <div className="rounded-xl border border-border bg-muted p-3 transition hover:-translate-y-0.5 hover:border-primary/45 motion-reduce:transform-none">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3"><FileText className="size-4 shrink-0 text-primary" /><div className="min-w-0"><p className="truncate font-extrabold">{file.title}</p><p className="text-xs text-muted-foreground">{titleCase(file.type)} · {file.sourceType}</p></div></div>
        <div className="flex items-center gap-2">
        {unassigned && <Badge variant="warning">Unassigned</Badge>}
        <Badge variant={ownership === 'generated' ? 'secondary' : 'outline'}>{label}</Badge>
        {(file.url || file.blobRef) && <Button type="button" size="sm" variant="outline" disabled={opening} onClick={() => void openFile()}>{opening ? 'Opening…' : 'Open'}</Button>}
        {onReimport && <Button type="button" size="sm" variant="outline" onClick={(event) => { event.preventDefault(); onReimport() }}>Re-import</Button>}
        <Button
          type="button"
          size="sm"
          variant="ghost"
          disabled={summarising}
          onClick={async (event) => {
            event.preventDefault()
            const courseId = file.courseId
            if (!courseId) {
              toast({ title: 'Nothing was saved', description: 'This material is not linked to a class yet.' })
              return
            }
            // §6.2 "summarize / explain a file", grounded in this file's own
            // chunks. A file with none says so rather than generating from the
            // rest of the class behind the student's back.
            setSummarising(true)
            setGenerationError('')
            startGenerationProgress(setGenerationPhase)
            try {
              const sources = sourcesFor(chunks, courseId, file.id)
              const outcome = await generateStudyGuide({ courseId, chunks: sources, label: file.title })
              if (!outcome.ok) {
                const description = outcome.message ?? 'This material could not be summarized.'
                setGenerationPhase('error')
                setGenerationError(description)
                toast({ title: 'Nothing was saved', description })
                return
              }
              setGenerationPhase('saving')
              await waitForGenerationProgress()
              useStore.getState().update((draft) => {
                draft.academics.classCenter.notes.push({
                  id: uid(),
                  courseId,
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
              setGenerationPhase('complete')
              toast({ title: 'Summary generated', description: `Saved in Materials as “${outcome.title}”.` })
            } catch (error) {
              const description = error instanceof Error && error.message ? error.message : 'Generation stopped unexpectedly. Nothing was saved.'
              setGenerationPhase('error')
              setGenerationError(description)
              toast({ title: 'Nothing was saved', description })
            } finally {
              setSummarising(false)
            }
          }}
        >
          {summarising ? 'Summarizing…' : 'Summarize'}
        </Button>
        </div>
      </div>
      {generationPhase !== 'idle' && <div className="mt-3"><GenerationProgress phase={generationPhase} outputLabel="Study guide summary" errorMessage={generationError} /></div>}
    </div>
  )
  return content
}

function MaterialNoteRow({ note, open, unassigned }: { note: ClassNote; open: boolean; unassigned?: boolean }) {
  const label = materialCategoryForNote(note)
  const owner = materialNoteOwner(note)
  return (
    <details id={`material-note-${note.id}`} open={open} className="class-hub-material-note class-hub-record-row rounded-[13px] px-3 py-2">
      <summary className="flex cursor-pointer list-none items-center gap-3 rounded-lg py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <NotebookText className="size-4 shrink-0 text-primary" />
        <span className="min-w-0 flex-1"><b className="block truncate">{note.title}</b><span className="block text-xs font-semibold text-muted-foreground">{label} · selected-source trace retained</span></span>
        {unassigned && <Badge variant="warning">Unassigned</Badge>}
        <Badge variant={owner === 'generated' ? 'secondary' : 'outline'}>{owner === 'generated' ? 'Generated' : 'Mine'}</Badge>
        <ChevronDown className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      </summary>
      <div className="class-hub-material-note-body mt-2 border-t border-border pt-3">
        <p className="whitespace-pre-wrap text-sm font-semibold leading-relaxed text-muted-foreground">{note.content || 'This generated resource has no saved content.'}</p>
        {note.externalDocUrl && <Button size="sm" variant="outline" className="mt-3" asChild><a href={note.externalDocUrl} target="_blank" rel="noreferrer">Open document</a></Button>}
      </div>
    </details>
  )
}

function NoteRow({ note }: { note: ClassNote }) {
  const toast = useToast()
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [title, setTitle] = useState(note.title)
  const [content, setContent] = useState(note.content)
  const sourceCount = note.guideSourceRefs?.length ?? 0

  function cancel() {
    setTitle(note.title)
    setContent(note.content)
    setEditing(false)
  }

  function save() {
    const nextTitle = title.trim()
    const nextContent = content.trim()
    if (!nextTitle) return
    useStore.getState().update((draft) => {
      const target = draft.academics.classCenter.notes.find((item) => item.id === note.id)
      if (!target) return
      Object.assign(target, { title: nextTitle, content: nextContent, updatedAt: Date.now() })
    })
    setEditing(false)
    toast({ title: 'Guide item saved', description: sourceCount ? 'Your wording changed; its reviewed source references stayed attached.' : undefined, tone: 'success' })
  }

  function remove() {
    const center = useStore.getState().academics.classCenter
    const savedNote = structuredClone(center.notes.find((item) => item.id === note.id) ?? note)
    const topicRefs = center.topics
      .filter((topic) => topic.sourceNoteIds.includes(note.id) || topic.linkedNoteIds?.includes(note.id))
      .map((topic) => ({ id: topic.id, sourceNoteIds: [...topic.sourceNoteIds], linkedNoteIds: [...(topic.linkedNoteIds ?? [])] }))
    const weakAreaRefs = center.weakAreas.filter((item) => item.relatedNoteId === note.id).map((item) => item.id)
    const examRefs = center.practiceExams.filter((item) => item.sourceNoteIds.includes(note.id)).map((item) => ({ id: item.id, sourceNoteIds: [...item.sourceNoteIds] }))
    const proposalSnapshot = note.guideProposalId
      ? structuredClone(center.guideProposals.find((item) => item.id === note.guideProposalId))
      : undefined

    useStore.getState().update((draft) => {
      const target = draft.academics.classCenter
      target.notes = target.notes.filter((item) => item.id !== note.id)
      target.topics.forEach((topic) => {
        topic.sourceNoteIds = topic.sourceNoteIds.filter((id) => id !== note.id)
        if (topic.linkedNoteIds) topic.linkedNoteIds = topic.linkedNoteIds.filter((id) => id !== note.id)
      })
      target.weakAreas.forEach((item) => { if (item.relatedNoteId === note.id) item.relatedNoteId = undefined })
      target.practiceExams.forEach((item) => { item.sourceNoteIds = item.sourceNoteIds.filter((id) => id !== note.id) })
      if (note.guideProposalId) {
        const proposal = target.guideProposals.find((item) => item.id === note.guideProposalId && item.acceptedNoteId === note.id)
        if (proposal) Object.assign(proposal, { status: 'pending', acceptedNoteId: undefined, updatedAt: Date.now() })
      }
    })
    setDeleting(false)
    toast({
      title: 'Guide item deleted',
      description: sourceCount ? 'The reviewed source was kept and returned to Suggested additions.' : undefined,
      onUndo: () => useStore.getState().update((draft) => {
        const target = draft.academics.classCenter
        if (!target.notes.some((item) => item.id === savedNote.id)) target.notes.push(savedNote)
        topicRefs.forEach((snapshot) => {
          const topic = target.topics.find((item) => item.id === snapshot.id)
          if (topic) Object.assign(topic, { sourceNoteIds: snapshot.sourceNoteIds, linkedNoteIds: snapshot.linkedNoteIds })
        })
        weakAreaRefs.forEach((id) => {
          const item = target.weakAreas.find((row) => row.id === id)
          if (item) item.relatedNoteId = savedNote.id
        })
        examRefs.forEach((snapshot) => {
          const item = target.practiceExams.find((row) => row.id === snapshot.id)
          if (item) item.sourceNoteIds = snapshot.sourceNoteIds
        })
        if (proposalSnapshot) {
          const proposal = target.guideProposals.find((item) => item.id === proposalSnapshot.id)
          if (proposal) Object.assign(proposal, proposalSnapshot)
        }
      }),
    })
  }

  return (
    <div className="rounded-xl border border-border bg-muted p-3">
      {editing ? <div className="space-y-3">
        <label className="block text-xs font-extrabold uppercase tracking-[0.1em] text-muted-foreground">Title<Input aria-label={`Guide item title for ${note.title}`} className="mt-1" value={title} onChange={(event) => setTitle(event.target.value)} autoFocus /></label>
        <label className="block text-xs font-extrabold uppercase tracking-[0.1em] text-muted-foreground">Details<Textarea aria-label={`Guide item details for ${note.title}`} className="mt-1 min-h-24" value={content} onChange={(event) => setContent(event.target.value)} /></label>
        {sourceCount > 0 && <p className="text-xs font-semibold text-muted-foreground">{sourceCount} reviewed {sourceCount === 1 ? 'source stays' : 'sources stay'} attached. Editing does not rewrite the evidence.</p>}
        <div className="flex flex-wrap justify-end gap-2"><Button size="sm" variant="ghost" onClick={cancel}>Cancel</Button><Button size="sm" disabled={!title.trim()} onClick={save}>Save changes</Button></div>
      </div> : <div className="flex items-start gap-3">
        <NotebookText className="mt-0.5 size-4 shrink-0 text-primary" />
        <div className="min-w-0 flex-1"><p className="font-extrabold">{note.title}</p><p className="text-sm text-muted-foreground">{note.content || 'No note text yet.'}</p><p className="mt-1 text-xs text-muted-foreground">{note.unit || 'Unit not mapped'} · {note.date || 'Date not set'}{sourceCount ? ` · ${sourceCount} reviewed ${sourceCount === 1 ? 'source' : 'sources'}` : ''}</p></div>
        <div className="flex shrink-0 gap-1"><Button size="sm" variant="ghost" aria-label={`Edit ${note.title}`} onClick={() => setEditing(true)}>Edit</Button><Button size="sm" variant="ghost" aria-label={`Delete ${note.title}`} className="text-destructive hover:text-destructive" onClick={() => setDeleting(true)}>Delete</Button></div>
      </div>}
      <AlertDialog open={deleting} onOpenChange={setDeleting}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete this Guide item?</AlertDialogTitle><AlertDialogDescription>{sourceCount ? 'This removes your saved Guide wording and its links. The reviewed syllabus or lecture source returns to Suggested additions, where you can use it again.' : 'This removes the saved item and clears its topic, review, and practice-exam links.'}</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Keep item</AlertDialogCancel><AlertDialogAction variant="destructive" onClick={remove}>Delete Guide item</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function LinksMenu({ workspace, contacts }: { workspace: ClassWorkspace; contacts: ClassContact[] }) {
  const links = [
    ['Syllabus', workspace.syllabusUrl], ['Canvas', workspace.canvasUrl],
    ['Drive', workspace.driveFolderUrl], ['GoodNotes', workspace.goodNotesUrl],
  ].filter(([, value]) => Boolean(value))
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" className="inline-flex items-center gap-1 rounded-md font-bold text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          Office hours &amp; links <ChevronDown className="size-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        aria-label="Office hours and class links"
        className="w-[min(27rem,calc(100vw-2rem))] overflow-hidden p-0"
      >
        <section aria-label="Course contacts" className="p-3.5">
          <div className="mb-2.5 flex items-center justify-between gap-3">
            <h2 className="font-display text-sm font-extrabold">Course contacts</h2>
            {contacts.length > 0 && <span className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-muted-foreground">{contacts.length} {contacts.length === 1 ? 'person' : 'people'}</span>}
          </div>
          {contacts.length > 0 ? (
            <div className="space-y-2">
              {contacts.map((contact) => (
                <article key={contact.id} className="rounded-lg border border-border/80 bg-muted/45 p-3">
                  <div className="flex min-w-0 items-baseline justify-between gap-3">
                    <h3 className="truncate font-display text-sm font-extrabold text-foreground">{contact.name}</h3>
                    <span className="shrink-0 text-[10px] font-extrabold uppercase tracking-[0.1em] text-primary">{contactRoleLabel(contact.role)}</span>
                  </div>
                  <dl className="mt-2 grid grid-cols-[5.5rem_minmax(0,1fr)] gap-x-2 gap-y-1 text-xs leading-5">
                    <dt className="font-bold text-muted-foreground">Office hours</dt>
                    <dd className="min-w-0 font-semibold text-foreground">{contact.officeHours || 'Not listed'}</dd>
                    {contact.location && <><dt className="font-bold text-muted-foreground">Location</dt><dd className="min-w-0 font-semibold text-foreground">{contact.location}</dd></>}
                    {contact.email && <><dt className="font-bold text-muted-foreground">Email</dt><dd className="min-w-0"><a className="inline-flex max-w-full items-center gap-1 font-bold text-primary hover:underline" href={`mailto:${contact.email}`}><Mail className="size-3.5 shrink-0" /><span className="truncate">{contact.email}</span></a></dd></>}
                  </dl>
                </article>
              ))}
            </div>
          ) : (
            <p className="rounded-lg border border-dashed border-border px-3 py-2.5 text-xs font-semibold text-muted-foreground">No professor or teaching-assistant contact details are saved yet.</p>
          )}
        </section>
        <section aria-label="Class links" className="border-t border-border p-3.5">
          <h2 className="mb-1.5 font-display text-xs font-extrabold uppercase tracking-[0.1em] text-muted-foreground">Class links</h2>
          {links.length > 0 ? (
            <div className="grid grid-cols-2 gap-1.5">
              {links.map(([label, value]) => <a className="rounded-lg border border-border/80 px-2.5 py-2 text-xs font-bold text-foreground transition-colors hover:border-primary/45 hover:bg-muted" key={label} href={value} target="_blank" rel="noreferrer">{label} ↗</a>)}
            </div>
          ) : (
            <p className="text-xs font-semibold text-muted-foreground">No class links saved yet.</p>
          )}
        </section>
      </PopoverContent>
    </Popover>
  )
}

function contactRoleLabel(role: ClassContact['role']) {
  if (role === 'professor') return 'Professor'
  if (role === 'TA') return 'Teaching assistant'
  if (role === 'study-partner') return 'Study partner'
  return role.charAt(0).toUpperCase() + role.slice(1)
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

function EmptyState({ icon: Icon, title, detail }: { icon: typeof BookOpen; title: string; detail: string }) {
  return <div className="rounded-2xl border border-dashed border-border p-5 text-center"><Icon className="mx-auto size-6 text-muted-foreground" /><p className="mt-2 font-extrabold">{title}</p><p className="mt-1 text-sm text-muted-foreground">{detail}</p></div>
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
    notes.unshift({ id: uid(), courseId, title: 'Untitled Guide item', type: 'lecture', kind: 'about-class', date: isoToday(), unit: '', topicIds: [], content: '', syncStatus: 'local-only', linkedFileIds: [], createdAt: now, updatedAt: now, order: notes.length })
  })
}

function hubStats(course: Course, assignments: ClassAssignment[]) {
  const exam = assignments.filter((item) => item.type === 'exam' && !isComplete(item) && item.dueDate).sort((a, b) => String(a.dueDate).localeCompare(String(b.dueDate)))[0]
  const next = assignments.filter((item) => !isComplete(item) && item.dueDate).sort((a, b) => String(a.dueDate).localeCompare(String(b.dueDate)))[0]
  return {
    grade: course.grade || (coursePercent(assignments) == null ? '—' : `${formatNumber(coursePercent(assignments)!)}%`),
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

function groupTopicsByWeek(topics: Topic[]) {
  const map = new Map<string, { key: string; label: string; sort: string; topics: Topic[]; units: string[] }>()
  for (const topic of [...topics].sort((a, b) => a.order - b.order)) {
    const week = scheduledWeek(topic.scheduledFor)
    const group = map.get(week.key) ?? { ...week, topics: [], units: [] }
    group.topics.push(topic)
    const unit = topic.unit?.trim()
    if (unit && !group.units.includes(unit)) group.units.push(unit)
    map.set(week.key, group)
  }
  return [...map.values()].sort((a, b) => a.sort.localeCompare(b.sort))
}

function scheduledWeek(scheduledFor?: string) {
  if (!scheduledFor) return { key: 'unmapped', label: 'Schedule not mapped', sort: '9999-99-99' }
  const date = new Date(`${scheduledFor}T00:00:00Z`)
  if (Number.isNaN(date.getTime())) return { key: 'unmapped', label: 'Schedule not mapped', sort: '9999-99-99' }
  const day = date.getUTCDay()
  date.setUTCDate(date.getUTCDate() - (day === 0 ? 6 : day - 1))
  const key = date.toISOString().slice(0, 10)
  return { key, label: `Week of ${date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' })}`, sort: key }
}

type MaterialGroupBy = 'week' | 'unit' | 'category'

type MaterialPlacement = {
  key: string
  label: string
  eyebrow: string
  sort: string
  topicIds: string[]
  unitLabel?: string
  unassigned: boolean
}

type MaterialGroup = MaterialPlacement & { files: AcademicFile[]; notes: ClassNote[]; topicCount: number }

function isMaterialNote(note: ClassNote) {
  return note.kind === 'on-material' || note.type === 'study-guide'
}

function isGuideNote(note: ClassNote) {
  return note.kind === 'about-class' && note.type !== 'study-guide'
}

function materialNoteOwner(note: ClassNote): 'mine' | 'generated' {
  return note.type === 'study-guide' ? 'generated' : 'mine'
}

function materialFilterMatches(filter: 'all' | 'course' | 'mine' | 'generated' | 'unassigned', owner: 'course' | 'mine' | 'generated', unassigned: boolean) {
  return filter === 'all' || (filter === 'unassigned' ? unassigned : filter === owner)
}

function linkedTopicsForFile(file: AcademicFile, topics: Topic[]) {
  const linkedIds = new Set([file.topicId, ...file.linkedTopicIds].filter((id): id is string => Boolean(id)))
  return topics.filter((topic) => linkedIds.has(topic.id))
}

function linkedTopicsForNote(note: ClassNote, topics: Topic[], files: AcademicFile[]) {
  const sourceFiles = files.filter((file) => note.linkedFileIds.includes(file.id))
  const linkedIds = new Set([
    ...note.topicIds,
    ...sourceFiles.flatMap((file) => [file.topicId, ...file.linkedTopicIds]),
  ].filter((id): id is string => Boolean(id)))
  return topics.filter((topic) => linkedIds.has(topic.id))
}

function materialIsUnassigned(file: AcademicFile, topics: Topic[]) {
  return linkedTopicsForFile(file, topics).length === 0
}

function materialNoteIsUnassigned(note: ClassNote, topics: Topic[], files: AcademicFile[]) {
  return linkedTopicsForNote(note, topics, files).length === 0 && !note.unit?.trim()
}

function materialCategoryForFile(file: AcademicFile) {
  const title = `${file.title} ${file.notes ?? ''}`.toLowerCase()
  if (file.owner === 'generated' || file.type === 'study-guide') return 'Generated resources'
  if (file.folderIntake?.category === 'homework' || /\b(homework|assignment|problem set)\b/.test(title)) return 'Homework'
  if (file.folderIntake?.category === 'practice-problems' || /\b(question|practice problem)\b/.test(title)) return 'Questions'
  if (/\b(learning objectives?|learning standards?|course goals?|mastery outline)\b/.test(title)) return 'Learning objectives'
  if (file.type === 'lecture-slides' || /\bslides?\b/.test(title)) return 'Slides'
  if (file.folderIntake?.category === 'notes' || file.owner === 'mine' || /\bnotes?\b/.test(title)) return 'Notes'
  if (file.type === 'reading') return 'Readings'
  if (file.type === 'syllabus' || file.type === 'rubric' || file.type === 'lab-handout' || file.type === 'past-exam') return 'Course documents'
  return 'Other'
}

function materialCategoryForNote(note: ClassNote) {
  const title = note.title.toLowerCase()
  if (/\b(learning objectives?|learning standards?|mastery outline)\b/.test(title)) return 'Learning objectives'
  if (/\bquestions?\b/.test(title)) return 'Questions'
  if (/\bhomework\b/.test(title)) return 'Homework'
  if (note.type === 'study-guide') return 'Generated resources'
  return 'Notes'
}

const MATERIAL_CATEGORY_ORDER = ['Slides', 'Learning objectives', 'Questions', 'Homework', 'Notes', 'Generated resources', 'Readings', 'Course documents', 'Other']

function placementForTopics(linkedTopics: Topic[], groupBy: Exclude<MaterialGroupBy, 'category'>, fallbackUnit?: string): MaterialPlacement {
  if (groupBy === 'week') {
    const weeks = linkedTopics.map((topic) => scheduledWeek(topic.scheduledFor)).filter((week) => week.key !== 'unmapped').sort((a, b) => a.sort.localeCompare(b.sort))
    const week = weeks[0]
    if (week) return { key: `week:${week.key}`, label: week.label, eyebrow: 'Scheduled week', sort: week.sort, topicIds: linkedTopics.map((topic) => topic.id), unitLabel: linkedTopics.find((topic) => topic.unit?.trim())?.unit?.trim(), unassigned: false }
  } else {
    const units = [...new Set([...linkedTopics.map((topic) => topic.unit?.trim()), fallbackUnit?.trim()].filter((unit): unit is string => Boolean(unit)))]
    if (units.length) return { key: `unit:${units.join('|')}`, label: units.join(' · '), eyebrow: 'Syllabus unit', sort: units.join('|').toLowerCase(), topicIds: linkedTopics.map((topic) => topic.id), unitLabel: units[0], unassigned: false }
  }
  return { key: 'unassigned', label: 'Unassigned', eyebrow: 'Placement needed', sort: 'zzzz', topicIds: linkedTopics.map((topic) => topic.id), unitLabel: fallbackUnit?.trim() || undefined, unassigned: true }
}

function categoryPlacement(label: string, topicIds: string[]): MaterialPlacement {
  const order = MATERIAL_CATEGORY_ORDER.indexOf(label)
  return { key: `category:${label}`, label, eyebrow: 'Material category', sort: String(order < 0 ? 999 : order).padStart(3, '0'), topicIds, unassigned: false }
}

function groupMaterials(files: AcademicFile[], notes: ClassNote[], topics: Topic[], groupBy: MaterialGroupBy): MaterialGroup[] {
  const map = new Map<string, MaterialGroup>()
  const insert = (placement: MaterialPlacement, kind: 'file' | 'note', item: AcademicFile | ClassNote) => {
    const current = map.get(placement.key) ?? { ...placement, files: [], notes: [], topicCount: 0 }
    if (kind === 'file') current.files.push(item as AcademicFile)
    else current.notes.push(item as ClassNote)
    current.topicIds = [...new Set([...current.topicIds, ...placement.topicIds])]
    current.topicCount = current.topicIds.length
    map.set(placement.key, current)
  }
  for (const file of files) {
    const linked = linkedTopicsForFile(file, topics)
    insert(groupBy === 'category' ? categoryPlacement(materialCategoryForFile(file), linked.map((topic) => topic.id)) : placementForTopics(linked, groupBy), 'file', file)
  }
  for (const note of notes) {
    const linked = linkedTopicsForNote(note, topics, files)
    insert(groupBy === 'category' ? categoryPlacement(materialCategoryForNote(note), linked.map((topic) => topic.id)) : placementForTopics(linked, groupBy, note.unit), 'note', note)
  }
  return [...map.values()].sort((a, b) => a.sort.localeCompare(b.sort) || a.label.localeCompare(b.label))
}

function hasGrade(item: ClassAssignment) {
  return item.status === 'graded' && item.pointsEarned != null && item.pointsPossible != null && item.pointsPossible > 0
}

function isComplete(item: ClassAssignment) {
  return item.status === 'submitted' || item.status === 'graded'
}

function meetingText(workspace: ClassWorkspace) {
  const value = [normalizeMeetingDays(workspace.meetingDays ?? ''), workspace.meetingTime].filter(Boolean).join(' · ')
  return value || 'Meeting time not set'
}

function assignmentDateLabel(item: Pick<ClassAssignment, 'dueDate' | 'type'>) {
  return item.type === 'exam' ? fmtEventDate(item.dueDate) : fmtDeadline(item.dueDate)
}

function ordered<T extends { order: number }>(items: T[]) {
  return [...items].sort((a, b) => a.order - b.order)
}

function isHubTab(value: string | null): value is HubTab {
  return value === 'overview' || value === 'materials' || value === 'topics' || value === 'assignments' || value === 'guide'
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

// These remain the app-native renderers for follow-on Materials/Assignments
// briefs. Keeping their typed contracts live prevents those tab implementations
// from drifting while the approved Overview no longer renders them.
void CoverageLedger
void CategoryBar
void categoryStats
