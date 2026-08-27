import { useEffect, useMemo, useState, type ComponentType } from 'react'
import { AnimatePresence, m, useReducedMotion } from 'motion/react'
import { useParams, useSearchParams } from 'react-router-dom'
import {
  Archive,
  Calculator, CalendarDays, Flame, GraduationCap, Library, Plus,
} from 'lucide-react'
import { useStore } from '@/store/store'
import { inferAcademicTerm } from '@/store/migrations/academicsV4'
import { ROUTE_MAP } from '@/app/routes'
import { gpaStats, fmtGpa } from '@/lib/selectors'
import type { Course } from '@/lib/types'
import { uid } from '@/lib/id'
import { PageHeader } from '@/components/common/PageHeader'
import { AssignmentCreateDialog, AssignmentsPanel } from '@/components/common/AssignmentsPanel'
import { ClassCenter } from '@/components/academics/ClassCenter'
import { PlanningDecisions } from '@/components/academics/PlanningDecisions'
import { PlanningColdStart } from '@/components/academics/PlanningColdStart'
import { PlannerBoard } from '@/components/academics/PlannerBoard'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { ModeSwitch } from '@/components/common/ModeSwitch'
import { useToast } from '@/components/common/useToast'
import { instantCrossfade, sharedAxis } from '@/lib/motion'
import { AcademicMigrationReview } from '@/components/academics/AcademicMigrationReview'
import { StatStrip } from '@/components/common/StatStrip'
import { GradesArchive } from '@/components/academics/GradesArchive'

export function Academics() {
  const reduceMotion = useReducedMotion()
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
  const addItem = useStore((s) => s.addItem)
  const undoRecovery = useStore((s) => s.undoRecovery)
  const storedMode = useStore((s) => s.settings.academicsMode)
  const update = useStore((s) => s.update)
  const route = ROUTE_MAP.academics
  const toast = useToast()
  const [studyGuideOpen, setStudyGuideOpen] = useState(false)
  const [assignmentCreateOpen, setAssignmentCreateOpen] = useState(false)
  const [planCompareOpen, setPlanCompareOpen] = useState(false)

  const gpa = useMemo(() => gpaStats(courses), [courses])

  // Terms in plan order (incoming credit last for display? keep first).
  const terms = useMemo(() => {
    const seen: string[] = []
    for (const c of courses) if (!seen.includes(c.term)) seen.push(c.term)
    return seen
  }, [courses])

  function addCourse(term: string) {
    const id = uid()
    addItem('courses', {
      id, term, code: '', title: '', credits: 3, grade: '', bcpm: false,
      status: 'planned', inResidence: true, satisfies: [], order: 0,
    } as Course)
    const recoveryId = useStore.getState().meta.recoveryStack[0]?.id
    toast({
      title: 'Course created',
      description: `Added to ${term}.`,
      onOpen: () => setSearchParams({ mode: 'planning', tab: 'planner' }),
      onUndo: recoveryId ? () => undoRecovery(recoveryId) : undefined,
    })
  }

  // Store is the single source of truth for the mode — synchronous and always
  // re-renders, so the Daily/Planning toggle can't desync under rapid clicks.
  const mode: 'daily' | 'planning' = storedMode === 'planning' ? 'planning' : 'daily'
  const tabsByMode = {
    daily: ['class-center', 'assignments'],
    planning: ['planner', 'archive'],
  } as const
  const requestedTab = searchParams.get('tab')
  const activeTab = tabsByMode[mode].includes(requestedTab as never) ? requestedTab! : tabsByMode[mode][0]
  // §4.1-M is intentionally a temporary import composition. ClassCenter
  // renders its own contextual header in that mode; keeping the Academics
  // banner around it creates two competing heroes and breaks the approved
  // full-screen-like hierarchy. The route and import state remain unchanged.
  const syllabusImportActive = Boolean(searchParams.get('importFor'))
  const currentTermCourses = courses.filter((course) => course.term === currentTerm)
  const currentTermGpa = gpaStats(currentTermCourses)
  const currentTermIndex = terms.indexOf(currentTerm)
  const priorTerm = currentTermIndex > 0 ? terms[currentTermIndex - 1] : ''
  const priorTermGpa = priorTerm ? gpaStats(courses.filter((course) => course.term === priorTerm)) : null
  const priorCumulative = priorTerm
    ? gpaStats(courses.filter((course) => course.term !== currentTerm))
    : null
  const today = new Date().toISOString().slice(0, 10)
  const dueToday = classCenter.assignments.filter((assignment) =>
    assignment.dueDate?.slice(0, 10) === today
    && assignment.status !== 'graded'
    && assignment.status !== 'submitted'
    && assignment.status !== 'dropped'
  ).length
  const reviewStreak = consecutiveDayStreak(classCenter.reviewEvents.map((event) => event.timestamp))
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

  // Adopt an incoming ?mode= deep-link (from other pages) into the store, then
  // strip it from the URL so it can't linger and fight the toggle or re-fire.
  useEffect(() => {
    const urlMode = searchParams.get('mode')
    if (urlMode !== 'daily' && urlMode !== 'planning') return
    if (urlMode !== storedMode) update((draft) => { draft.settings.academicsMode = urlMode })
    const next = new URLSearchParams(searchParams)
    next.delete('mode')
    setSearchParams(next, { replace: true })
  }, [searchParams, storedMode, update, setSearchParams])

  if (courseId || syllabusImportActive) {
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

  return (
    <div className="academics-surface">
      <Tabs value={activeTab} onValueChange={(tab) => setSearchParams((prev) => { const next = new URLSearchParams(prev); next.delete('mode'); next.set('tab', tab); return next }, { replace: true })}>
        <PageHeader
          title={route.label}
          actions={(
            <div className="flex items-center gap-2">
              {activeTab === 'assignments' && (
                <Button onClick={() => setAssignmentCreateOpen(true)}>
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
              metrics={[
                {
                  id: 'term-gpa', label: 'Term GPA', value: fmtGpa(currentTermGpa.cum), cadence: 'variable',
                  direction: !currentTermGpa.credits || !priorTermGpa?.credits ? undefined : currentTermGpa.cum >= priorTermGpa.cum ? 'up' : 'down',
                },
                {
                  id: 'cumulative-gpa', label: 'Cumulative', value: fmtGpa(gpa.cum), cadence: 'variable',
                  direction: !gpa.credits || !priorCumulative?.credits ? undefined : gpa.cum >= priorCumulative.cum ? 'up' : 'down',
                },
                { id: 'due-today', label: 'Due today', value: String(dueToday), cadence: 'variable' },
                { id: 'day-streak', label: 'Day streak', value: String(reviewStreak), cadence: 'variable', icon: <Flame className="size-3.5 text-orange-300" /> },
              ]}
            />
          </div>
        </PageHeader>
        <AcademicMigrationReview />
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
          <AssignmentsPanel onRequestAdd={() => setAssignmentCreateOpen(true)} />
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
          {!courses.length ? <PlanningColdStart onAddCourse={() => addCourse('This term')} /> : <PlannerBoard onAddCourse={addCourse} onComparePlans={() => setPlanCompareOpen(true)} openRequirements={searchParams.get('plannerView') === 'requirements'} />}
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

      <Dialog open={studyGuideOpen} onOpenChange={setStudyGuideOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>How to study</DialogTitle>
            <DialogDescription>A simple loop for turning class material into retrievable knowledge.</DialogDescription>
          </DialogHeader>
          <ol className="space-y-3 text-sm">
            <li><strong>1. Capture the scope.</strong> Import the syllabus and connect topics to the next exam.</li>
            <li><strong>2. Review by retrieval.</strong> Answer before revealing; do not count rereading as mastery.</li>
            <li><strong>3. Choose the next review.</strong> Open a due topic or one you explicitly marked for review.</li>
          </ol>
        </DialogContent>
      </Dialog>
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

function consecutiveDayStreak(timestamps: number[]) {
  if (!timestamps.length) return 0
  const days = new Set(timestamps.map((timestamp) => new Date(timestamp).toISOString().slice(0, 10)))
  const cursor = new Date()
  let streak = 0
  while (days.has(cursor.toISOString().slice(0, 10))) {
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}
