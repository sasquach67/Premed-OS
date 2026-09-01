import { lazy, Suspense, useEffect, useLayoutEffect, useMemo, useState, type ComponentType } from 'react'
import { AnimatePresence, m, useReducedMotion } from 'motion/react'
import { useLocation, useParams, useSearchParams } from 'react-router-dom'
import {
  Archive,
  Calculator, CalendarDays, GraduationCap, Library, Plus,
} from 'lucide-react'
import { useStore } from '@/store/store'
import { inferAcademicTerm } from '@/store/migrations/academicsV4'
import { ROUTE_MAP } from '@/app/routes'
import { gpaStats, fmtGpa } from '@/lib/selectors'
import { PageHeader } from '@/components/common/PageHeader'
import { AssignmentCreateDialog, AssignmentsPanel } from '@/components/common/AssignmentsPanel'
import { ClassCenter } from '@/components/academics/ClassCenter'
import { PlanningDecisions } from '@/components/academics/PlanningDecisions'
import { coldStartPlanningTerms, PlanningColdStart } from '@/components/academics/PlanningColdStart'
import type { PlannerCatalogRequest } from '@/components/academics/PlannerBoard'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ModeSwitch } from '@/components/common/ModeSwitch'
import { instantCrossfade, sharedAxis } from '@/lib/motion'
import { AcademicMigrationReview } from '@/components/academics/AcademicMigrationReview'
import { StatStrip } from '@/components/common/StatStrip'
import { GradesArchive } from '@/components/academics/GradesArchive'
import { daysUntil } from '@/lib/date'
import { LectureCaptureGuide } from '@/components/academics/LectureCaptureGuide'

const ACADEMICS_TABS_BY_MODE = {
  daily: ['class-center', 'assignments'],
  planning: ['planner', 'archive'],
} as const

// The UNC catalog snapshot is intentionally comprehensive and several MB.
// Keep it out of the Daily/Class Center path; loading Academics must not also
// download the complete Planning catalog before the student opens Planning.
const PlannerBoard = lazy(() => import('@/components/academics/PlannerBoard')
  .then((module) => ({ default: module.PlannerBoard })))
const PlannerCourseDiscoveryDialog = lazy(() => import('@/components/academics/PlannerBoard')
  .then((module) => ({ default: module.PlannerCourseDiscoveryDialog })))

export function Academics() {
  const reduceMotion = useReducedMotion()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const { courseId } = useParams()
  const courses = useStore((s) => s.courses)
  const requirements = useStore((s) => s.requirements)
  const classCenter = useStore((s) => s.academics.classCenter)
  const storedTerm = useStore((s) => s.profile.startTerm)
  // The store already infers a term when the profile has none — that is how
  // `currentTermFor` scopes workspaces. Reading `startTerm` raw made this page
  // disagree with it: after the cold import flow, `startTerm` is still empty,
  // so a real Fall 2026 class counted as zero and the header read
  // "Class center 0" directly above "1 class". Same fallback, one definition.
  const inferredTerm = useMemo(() => inferAcademicTerm(), [])
  const currentTerm = storedTerm.trim() || inferredTerm
  const storedMode = useStore((s) => s.settings.academicsMode)
  const update = useStore((s) => s.update)
  const route = ROUTE_MAP.academics
  const [studyGuideOpen, setStudyGuideOpen] = useState(false)
  const studyGuideRequested = searchParams.get('studyGuide') === 'open'
  const [assignmentCreateOpen, setAssignmentCreateOpen] = useState(false)
  const [planCompareOpen, setPlanCompareOpen] = useState(false)
  const [coldCatalogRequest, setColdCatalogRequest] = useState<PlannerCatalogRequest>()

  // Academics uses query parameters for both page-level navigation and modal
  // state. Reset only when the visible workspace changes so opening an intake
  // dialog does not unexpectedly move the page behind it.
  const scrollResetKey = useMemo(() => {
    const navigationKeys = ['tab', 'classTab', 'view', 'gradeView', 'plannerView', 'requirementsView']
    return [location.pathname, ...navigationKeys.map((key) => `${key}:${searchParams.get(key) ?? ''}`)].join('|')
  }, [location.pathname, searchParams])

  useLayoutEffect(() => {
    document.querySelector<HTMLElement>('[data-app-scroll-container]')
      ?.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [scrollResetKey])

  const gpa = useMemo(() => gpaStats(courses), [courses])

  // Terms in plan order (incoming credit last for display? keep first).
  const terms = useMemo(() => {
    const seen: string[] = []
    for (const c of courses) if (!seen.includes(c.term)) seen.push(c.term)
    return seen
  }, [courses])

  // Store is the single source of truth for the mode — synchronous and always
  // re-renders, so the Daily/Planning toggle can't desync under rapid clicks.
  const mode: 'daily' | 'planning' = storedMode === 'planning' ? 'planning' : 'daily'
  const tabsByMode = ACADEMICS_TABS_BY_MODE
  const requestedTab = searchParams.get('tab')
  const activeTab = tabsByMode[mode].includes(requestedTab as never) ? requestedTab! : tabsByMode[mode][0]
  // §4.1-M is intentionally a temporary import composition. ClassCenter
  // renders its own contextual header in that mode; keeping the Academics
  // banner around it creates two competing heroes and breaks the approved
  // full-screen-like hierarchy. The route and import state remain unchanged.
  const requestedImportFor = searchParams.get('importFor')
  const syllabusImportActive = searchParams.get('reviewImport') === '1'
    || requestedImportFor === 'new'
    || Boolean(requestedImportFor && courses.some((course) => course.id === requestedImportFor))
  const currentTermCourses = courses.filter((course) => course.term === currentTerm)
  const currentTermGpa = gpaStats(currentTermCourses)
  const currentTermIndex = terms.indexOf(currentTerm)
  const priorTerm = currentTermIndex > 0 ? terms[currentTermIndex - 1] : ''
  const priorTermGpa = priorTerm ? gpaStats(courses.filter((course) => course.term === priorTerm)) : null
  const priorCumulative = priorTerm
    ? gpaStats(courses.filter((course) => course.term !== currentTerm))
    : null
  const today = new Date().toISOString().slice(0, 10)
  const openAssignments = classCenter.assignments.filter((assignment) =>
    assignment.status !== 'graded'
    && assignment.status !== 'submitted'
    && assignment.status !== 'dropped'
  )
  const dueToday = openAssignments.filter((assignment) =>
    assignment.dueDate?.slice(0, 10) === today
  ).length
  const overdueAssignments = openAssignments.filter((assignment) => (daysUntil(assignment.dueDate) ?? 0) < 0).length
  const thisWeekAssignments = openAssignments.filter((assignment) => {
    const days = daysUntil(assignment.dueDate)
    return days != null && days >= 0 && days <= 6
  })
  const gradeDueThisWeek = Math.round(thisWeekAssignments.reduce((sum, assignment) => sum + (assignment.weight ?? 0), 0))
  const capturedLectures = classCenter.lectures.filter((lecture) => currentTermCourses.some((course) => course.id === lecture.courseId)).length
  const coldStartDestinations = coldStartPlanningTerms(currentTerm).map(({ term }) => ({ term, registered: false }))
  const tabCounts = {
    classes: currentTermCourses.length,
    assignments: classCenter.assignments.filter((assignment) =>
      assignment.status !== 'graded'
      && assignment.status !== 'submitted'
      && assignment.status !== 'dropped'
    ).length,
    courses: courses.length,
    requirements: requirements.filter((requirement) => !requirement.done).length,
    archive: courses.filter((course) => course.status === 'completed').length,
  }

  // Adopt an incoming ?mode= deep-link (from other pages), then canonicalize
  // the URL to the selected mode's first valid tab. Keeping one canonical URL
  // prevents stale mode/tab pairs from rendering a fallback that the address
  // bar does not describe.
  useEffect(() => {
    if (courseId) return
    const urlMode = searchParams.get('mode')
    const tab = searchParams.get('tab')
    const tabMode = tabsByMode.daily.includes(tab as never)
      ? 'daily'
      : tabsByMode.planning.includes(tab as never)
        ? 'planning'
        : null
    // A valid tab is a complete deep link even when `mode` is omitted. This
    // prevents a saved Planning preference from hijacking `?tab=class-center`
    // (and the inverse for Planner/Grades & archive). An explicit valid mode
    // still wins so authored cross-mode links remain deterministic.
    const linkedMode = urlMode === 'daily' || urlMode === 'planning'
      ? urlMode
      : urlMode == null && tabMode
        ? tabMode
        : mode
    const linkedTabs = tabsByMode[linkedMode]
    const linkedTab = linkedTabs.includes(tab as never)
      ? tab!
      : linkedTabs[0]
    if (linkedMode !== storedMode) update((draft) => { draft.settings.academicsMode = linkedMode })
    const next = new URLSearchParams(searchParams)
    next.delete('mode')
    next.set('tab', linkedTab)
    if (next.toString() !== searchParams.toString()) setSearchParams(next, { replace: true })
  }, [searchParams, storedMode, mode, courseId, update, setSearchParams, tabsByMode])

  // A stale or hand-edited import target must not suppress the entire
  // Academics shell. Keep valid new/scoped imports untouched; recover invalid
  // targets back to the normal Class Center route.
  useEffect(() => {
    if (!requestedImportFor || syllabusImportActive) return
    setSearchParams((current) => {
      const next = new URLSearchParams(current)
      next.delete('importFor')
      next.set('tab', 'class-center')
      return next
    }, { replace: true })
  }, [requestedImportFor, setSearchParams, syllabusImportActive])

  function changeStudyGuideOpen(open: boolean) {
    setStudyGuideOpen(open)
    if (open || !studyGuideRequested) return
    setSearchParams((current) => {
      const next = new URLSearchParams(current)
      next.delete('studyGuide')
      return next
    }, { replace: true })
  }

  if (courseId) {
    return <div className="academics-surface"><ClassCenter /></div>
  }

  function changeMode(nextMode: 'daily' | 'planning') {
    update((draft) => { draft.settings.academicsMode = nextMode })
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.delete('mode')
      next.set('tab', tabsByMode[nextMode][0])
      return next
    }, { replace: true })
  }

  function requestAssignmentCreation() {
    if (!courses.length) {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev)
        next.delete('mode')
        next.set('tab', 'class-center')
        next.set('importFor', 'new')
        return next
      })
      return
    }
    setAssignmentCreateOpen(true)
  }

  return (
    <div className="academics-surface">
      <Tabs value={activeTab} onValueChange={(tab) => setSearchParams((prev) => { const next = new URLSearchParams(prev); next.delete('mode'); next.set('tab', tab); return next })}>
        <PageHeader
          title={route.label}
          className={syllabusImportActive ? 'hidden' : undefined}
          actions={(
            <div className="flex items-center gap-2">
              {activeTab === 'assignments' && (
                <Button size="lg" className="font-display font-extrabold" onClick={requestAssignmentCreation}>
                  <Plus className="size-4" />
                  Add assignment
                  <kbd className="ml-1 rounded border border-primary-foreground/25 bg-primary-foreground/10 px-1.5 py-0.5 text-[10px] font-bold">⌘N</kbd>
                </Button>
              )}
              <Button
                variant="ghost"
                aria-label="How to study"
                className="text-white/90 hover:bg-white/10 hover:text-white"
                onClick={() => setStudyGuideOpen(true)}
              >
                <Library className="size-4" />
                <span className="hidden sm:inline">How to study</span>
              </Button>
            </div>
          )}
          footer={(
            <TabsList className="h-auto w-full justify-start gap-5 rounded-none border-0 bg-transparent p-0">
              {mode === 'daily' ? (
                <>
                  <AcademicsTab value="class-center" icon={GraduationCap} count={tabCounts.classes}>Class center</AcademicsTab>
                  <AcademicsTab value="assignments" icon={CalendarDays} count={tabCounts.assignments}>Assignments</AcademicsTab>
                </>
              ) : (
                <>
                  <AcademicsTab value="planner" icon={Calculator} count={tabCounts.courses}>Planner</AcademicsTab>
                  <AcademicsTab value="archive" icon={Archive} count={tabCounts.archive}>Grades &amp; archive</AcademicsTab>
                </>
              )}
            </TabsList>
          )}
          contentGlass={false}
        >
          <div className="flex flex-col gap-3 p-2 sm:flex-row sm:items-center sm:justify-between">
            <ModeSwitch
              value={mode}
              options={[{ id: 'daily', label: 'Daily' }, { id: 'planning', label: 'Planning' }]}
              onChange={changeMode}
              label="Academics mode"
              className="glass-surface--dark"
            />
            <StatStrip
              variant="banner"
              className="grid-flow-row grid-cols-2 sm:grid-flow-col sm:grid-cols-none"
              metrics={activeTab === 'assignments' ? [
                { id: 'overdue', label: 'Overdue', value: String(overdueAssignments), cadence: 'variable' },
                { id: 'this-week', label: 'This week', value: String(thisWeekAssignments.length), cadence: 'variable' },
                { id: 'grade-due', label: 'Grade due', value: gradeDueThisWeek ? `${gradeDueThisWeek}%` : '—', cadence: 'variable' },
              ] : [
                {
                  id: 'term-gpa', label: 'Term GPA', value: fmtGpa(currentTermGpa.cum), cadence: 'variable',
                  direction: !currentTermGpa.credits || !priorTermGpa?.credits ? undefined : currentTermGpa.cum >= priorTermGpa.cum ? 'up' : 'down',
                },
                {
                  id: 'cumulative-gpa', label: 'Cumulative', value: fmtGpa(gpa.cum), cadence: 'variable',
                  direction: !gpa.credits || !priorCumulative?.credits ? undefined : gpa.cum >= priorCumulative.cum ? 'up' : 'down',
                },
                { id: 'due-today', label: 'Due today', value: String(dueToday), cadence: 'variable' },
                { id: 'lectures', label: 'Lectures', value: String(capturedLectures), cadence: 'variable', icon: <Library className="size-3.5 text-sky-200" /> },
              ]}
            />
          </div>
        </PageHeader>
        <div className={syllabusImportActive ? 'hidden' : undefined}><AcademicMigrationReview /></div>
        <AnimatePresence mode="popLayout" initial={false} custom={mode === 'planning' ? 1 : -1}>
          <m.div
            key={mode}
            custom={mode === 'planning' ? 1 : -1}
            variants={reduceMotion ? instantCrossfade : sharedAxis}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* ---- Class Center (daily academic workflow) ---- */}
            <TabsContent value="class-center"><ClassCenter /></TabsContent>

        {/* ---- Assignments + Calendar (main dashboard) ---- */}
        <TabsContent value="assignments">
          <AssignmentsPanel onRequestAdd={requestAssignmentCreation} />
          <AssignmentCreateDialog open={assignmentCreateOpen} onOpenChange={setAssignmentCreateOpen} />
        </TabsContent>

        {/*
          Visual source: mockup-lab/01-academics/academics-planner-prototype.html
          Approved target: Variant A · view=plan. Planning has two destinations;
          requirement evidence and course discovery are in-context Planner tools.
        */}
        <TabsContent value="planner" className="planning-dossier">
          {/* §4.1 cold start: with no course recorded the Planner's metric
              surfaces would render zeros implying data exists. Suppress all of
              them and ask for the one durable fact instead. */}
          <Suspense fallback={<AcademicsPanelFallback label="Loading your planning tools…" />}>
            {!courses.length ? <div className="space-y-4">
              <PlanningColdStart currentTerm={currentTerm} onAddCourse={(destination) => setColdCatalogRequest((current) => ({ id: (current?.id ?? 0) + 1, destination }))} />
              <PlannerCourseDiscoveryDialog
                destinations={coldStartDestinations}
                selectedProgramId={classCenter.planningProgramContext?.selectedProgramId}
                request={coldCatalogRequest}
                onOpenChange={(open) => { if (!open) setColdCatalogRequest(undefined) }}
                onAdded={() => setColdCatalogRequest(undefined)}
              />
            </div> : <PlannerBoard onComparePlans={() => setPlanCompareOpen(true)} openRequirements={searchParams.get('plannerView') === 'requirements'} />}
          </Suspense>
        </TabsContent>

        {/* ---- Archive ---- */}
        <TabsContent value="archive" className="planning-dossier space-y-6">
          {/* §4.1: the end-of-term handoff, only when one is owed. */}
          <GradesArchive courses={courses} />
        </TabsContent>
          </m.div>
        </AnimatePresence>
      </Tabs>

      <Dialog open={planCompareOpen} onOpenChange={setPlanCompareOpen}>
        <DialogContent className="max-h-[88vh] overflow-y-auto bg-card sm:max-w-4xl">
          <DialogHeader><DialogTitle>Compare saved plans</DialogTitle><DialogDescription>Saved local sequences only. No plan is scored or labeled best.</DialogDescription></DialogHeader>
          <PlanningDecisions />
        </DialogContent>
      </Dialog>

      <LectureCaptureGuide open={studyGuideOpen || studyGuideRequested} onOpenChange={changeStudyGuideOpen} />
    </div>
  )
}

function AcademicsPanelFallback({ label }: { label: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card px-5 py-10 text-center shadow-sm" role="status">
      <p className="font-display text-sm font-extrabold">{label}</p>
    </div>
  )
}

function AcademicsTab({
  value,
  icon: Icon,
  count,
  children,
}: {
  value: string
  icon: ComponentType<{ className?: string }>
  count: number
  children: React.ReactNode
}) {
  return (
    <TabsTrigger
      value={value}
      className="academics-banner-tab"
    >
      <Icon className="size-4" /> {children}
      <span className="tab-count">
        {count}
      </span>
    </TabsTrigger>
  )
}
