import { useEffect, useMemo, useState, type ComponentType } from 'react'
import { AnimatePresence, m, useReducedMotion } from 'motion/react'
import { useParams, useSearchParams } from 'react-router-dom'
import {
  Archive,
  AlertTriangle, Calculator, CalendarDays, CheckCircle2, ChevronDown,
  Clock, Flame, FlaskConical, GraduationCap, Library, MoreHorizontal, Plus,
  Search, ShieldCheck, Sparkles, Trash2, X,
} from 'lucide-react'
import { useStore } from '@/store/store'
import { ROUTE_MAP } from '@/app/routes'
import { gpaStats, fmtGpa, GRADE_POINTS } from '@/lib/selectors'
import type { Course, LetterGrade, RequirementItem } from '@/lib/types'
import { uid } from '@/lib/id'
import { PageHeader } from '@/components/common/PageHeader'
import { InfoTip } from '@/components/common/InfoTip'
import { Ring } from '@/components/common/Ring'
import { TrackerTable, type ColumnDef } from '@/components/common/TrackerTable'
import { Collapsible } from '@/components/common/Collapsible'
import { ResourceGrid } from '@/components/common/ResourceGrid'
import { AssignmentCreateDialog, AssignmentsPanel } from '@/components/common/AssignmentsPanel'
import { NotesDB } from '@/components/common/NotesDB'
import { ClassCenter } from '@/components/academics/ClassCenter'
import { GradeDecisions } from '@/components/academics/GradeDecisions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { ModeSwitch } from '@/components/common/ModeSwitch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/components/common/useToast'
import { instantCrossfade, sharedAxis } from '@/lib/motion'
import { AcademicMigrationReview } from '@/components/academics/AcademicMigrationReview'
import { StatStrip } from '@/components/common/StatStrip'

const GRADES: LetterGrade[] = ['', 'A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'F', 'P', 'IP']
const COURSE_COLUMNS: ColumnDef[] = [
  { key: 'code', header: 'Course', type: 'text', width: '120px', placeholder: 'CHEM 241', validate: (value) => String(value ?? '').trim() ? undefined : 'Course code is required.' },
  { key: 'title', header: 'Title', type: 'text', placeholder: 'Course title' },
  { key: 'credits', header: 'Cr', type: 'number', width: '60px', align: 'right' },
  { key: 'grade', header: 'Grade', type: 'select', width: '80px', options: GRADES as string[] },
  { key: 'bcpm', header: 'AMCAS', type: 'toggle', width: '76px', toggleLabels: ['AO', 'BCPM'], glossaryField: 'course.bcpm' },
  { key: 'status', header: 'Status', type: 'select', width: '120px', options: ['planned', 'in-progress', 'completed'], glossaryField: 'course.status' },
]

export function Academics() {
  const reduceMotion = useReducedMotion()
  const [searchParams, setSearchParams] = useSearchParams()
  const { courseId } = useParams()
  const courses = useStore((s) => s.courses)
  const requirements = useStore((s) => s.requirements)
  const classCenter = useStore((s) => s.academics.classCenter)
  const currentTerm = useStore((s) => s.profile.startTerm)
  const addItem = useStore((s) => s.addItem)
  const undoRecovery = useStore((s) => s.undoRecovery)
  const storedMode = useStore((s) => s.settings.academicsMode)
  const update = useStore((s) => s.update)
  const route = ROUTE_MAP.academics
  const toast = useToast()
  const [studyGuideOpen, setStudyGuideOpen] = useState(false)
  const [assignmentCreateOpen, setAssignmentCreateOpen] = useState(false)

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
    planning: ['planner', 'tracker', 'archive'],
  } as const
  const requestedTab = searchParams.get('tab')
  const activeTab = tabsByMode[mode].includes(requestedTab as never) ? requestedTab! : tabsByMode[mode][0]
  const firstEditableTerm = terms.find((term) => !/transfer|ap credit/i.test(term))
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
                  <AcademicsTab value="tracker" icon={NcMark} count={tabCounts.requirements}>Tar Heel tracker</AcademicsTab>
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

        {/* ---- Planner & GPA ---- */}
        <TabsContent value="planner" className="space-y-6">
          <SharedPlanNote
            title="Planner & GPA is the course ledger"
            detail="Edit course names, credits, grades, BCPM status, and term placement here. Tar Heel Tracker uses this same course list to audit UNC, major, and premed requirements."
          />
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader><CardTitle>AMCAS GPA</CardTitle></CardHeader>
              <CardContent className="flex flex-wrap items-center justify-around gap-4">
                <Ring value={(gpa.cum / 4) * 100} color="var(--cat-gpa)" label="Cumulative" sublabel={fmtGpa(gpa.cum)} size={104} />
                <Ring value={(gpa.science / 4) * 100} color="var(--cat-research)" label="Science (BCPM)" sublabel={fmtGpa(gpa.science)} size={104} />
                <Ring value={(gpa.ao / 4) * 100} color="var(--cat-shadow)" label="All Other (AO)" sublabel={fmtGpa(gpa.ao)} size={104} />
                <div className="text-sm text-muted-foreground">
                  <p><b className="text-foreground">{gpa.credits}</b> graded credits</p>
                  <p><b className="text-foreground">{gpa.scienceCredits}</b> BCPM · <b className="text-foreground">{gpa.aoCredits}</b> AO</p>
                  <p className="mt-1 text-xs">No grade replacement · repeats averaged</p>
                </div>
              </CardContent>
            </Card>
            <WhatIf baseline={courses} />
          </div>

          {terms.map((term) => {
            const rows = courses.filter((c) => c.term === term)
            const credits = rows.reduce((m, c) => m + (c.credits || 0), 0)
            return (
              <Collapsible
                key={term}
                title={term}
                defaultOpen={term === firstEditableTerm}
                badge={<span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-bold text-secondary-foreground">{rows.length} courses · {credits} cr</span>}
              >
                <div className="mb-2 flex justify-end">
                  <Button size="sm" variant="outline" onClick={() => addCourse(term)}><Plus className="size-4" /> Add course</Button>
                </div>
                <TrackerTable collection="courses" rows={rows} columns={COURSE_COLUMNS} listId={`academics.${activeTab}.${term}`} />
              </Collapsible>
            )
          })}
          <Button variant="outline" onClick={() => addCourse('New term')}><Plus className="size-4" /> Add a term</Button>
        </TabsContent>

        {/* ---- Tar Heel Tracker ---- */}
        <TabsContent value="tracker" className="space-y-4">
          <SharedPlanNote
            title="Tar Heel Tracker is the requirement audit"
            detail="This view does not maintain a second plan. Moving or adding courses here updates the same course list used by Planner & GPA."
          />
          <TarHeelTracker />
        </TabsContent>

        {/* ---- Archive ---- */}
        <TabsContent value="archive" className="space-y-6">
          <ClassCenter archiveOnly />
          {/* §4.1: the record-decision layer, beneath the archive it reads. */}
          <GradeDecisionsSection />
          <ResourceGrid pillar="academics" />
          <NotesDB pillar="academics" title="Notes (study techniques, syllabi, brain dumps)" />
        </TabsContent>
          </m.div>
        </AnimatePresence>
      </Tabs>

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

/** "NC" lettermark for the Tar Heel tracker tab — the two letters in the app's
 *  rounded display face, inheriting the icon color (reads white on the dark
 *  Academics surface). A simple monogram, not the trademarked athletic logo. */
function NcMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <text
        x="12" y="13" textAnchor="middle" dominantBaseline="central"
        fontFamily="'Baloo 2', system-ui, sans-serif" fontWeight={800} fontSize={12.5}
        letterSpacing={-1} fill="currentColor"
      >
        NC
      </text>
    </svg>
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

/** What-if simulator: project GPA after hypothetical grades. */
function WhatIf({ baseline }: { baseline: Course[] }) {
  const [rows, setRows] = useState<{ id: string; credits: number; grade: LetterGrade; bcpm: boolean }[]>([])

  const projected = useMemo(() => {
    const hypo: Course[] = rows.map((r) => ({
      id: r.id, term: 'What-if', code: '', title: '', credits: r.credits, grade: r.grade,
      bcpm: r.bcpm, status: 'completed', inResidence: true, satisfies: [], order: 0,
    }))
    return gpaStats([...baseline, ...hypo])
  }, [rows, baseline])

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2"><FlaskConical className="size-4 text-primary" /> What-if</CardTitle>
        <Button size="sm" variant="ghost" onClick={() => setRows((r) => [...r, { id: uid(), credits: 3, grade: 'A', bcpm: true }])}>
          <Plus className="size-4" /> Add
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {rows.length === 0 && <p className="text-xs text-muted-foreground">Add hypothetical future grades to see your projected GPA.</p>}
        {rows.map((r) => (
          <div key={r.id} className="flex items-center gap-1.5">
            <input
              type="number" value={r.credits} min={0}
              onChange={(e) => setRows((rs) => rs.map((x) => x.id === r.id ? { ...x, credits: Number(e.target.value) || 0 } : x))}
              className="h-8 w-14 rounded-md border border-input bg-card px-2 text-sm"
            />
            <InlineSelect value={r.grade} options={Object.keys(GRADE_POINTS)} onChange={(grade) => setRows((rs) => rs.map((x) => x.id === r.id ? { ...x, grade: grade as LetterGrade } : x))} className="h-8 w-20" />
            <button
              onClick={() => setRows((rs) => rs.map((x) => x.id === r.id ? { ...x, bcpm: !x.bcpm } : x))}
              className={`rounded-full px-2 py-0.5 text-xs font-bold ${r.bcpm ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
            >{r.bcpm ? 'BCPM' : 'AO'}</button>
            <button onClick={() => setRows((rs) => rs.filter((x) => x.id !== r.id))} className="ml-auto text-xs text-muted-foreground hover:text-destructive">✕</button>
          </div>
        ))}
        {rows.length > 0 && (
          <div className="mt-2 grid grid-cols-2 gap-2 border-t border-border pt-2 text-center">
            <div><p className="font-display text-xl font-bold text-primary">{fmtGpa(projected.cum)}</p><p className="text-xs text-muted-foreground">proj. cumulative</p></div>
            <div><p className="font-display text-xl font-bold" style={{ color: 'var(--cat-research)' }}>{fmtGpa(projected.science)}</p><p className="text-xs text-muted-foreground">proj. science</p></div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function SharedPlanNote({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-primary/18 bg-primary/6 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="font-display text-base font-bold text-foreground">{title}</p>
        <p className="mt-0.5 text-xs font-medium leading-relaxed text-muted-foreground">{detail}</p>
      </div>
      <span className="shrink-0 rounded-full bg-card px-3 py-1 text-xs font-extrabold text-primary shadow-sm">One shared plan</span>
    </div>
  )
}

const TERM_PLAN = [
  { year: 'Freshman', terms: ['Fall 2026', 'Spring 2027', 'Summer 2027'] },
  { year: 'Sophomore', terms: ['Fall 2027', 'Spring 2028', 'Summer 2028'] },
  { year: 'Junior', terms: ['Fall 2028', 'Spring 2029', 'Summer 2029'] },
  { year: 'Senior', terms: ['Fall 2029', 'Spring 2030', 'Summer 2030'] },
]

const PROGRAMS = [
  { id: 'neuroscience-bs', label: 'Neuroscience B.S.', modeled: true },
  { id: 'psychology-bs', label: 'Psychology B.S.', modeled: false },
  { id: 'biology-bs', label: 'Biology B.S.', modeled: false },
  { id: 'chemistry-bs', label: 'Chemistry B.S.', modeled: false },
]

const PREMED_TAGS: Record<string, string> = {
  BIOL: 'biology',
  CHEM: 'chemistry',
  PHYS: 'physics',
  PSYC: 'psych/soc',
  SOCI: 'psych/soc',
  ENGL: 'writing',
  MATH: 'math/stat',
  STOR: 'math/stat',
}

type RequirementStatus = 'completed' | 'in-progress' | 'planned' | 'missing' | 'needs-verification'

function courseCode(code: string) {
  return code.trim().toUpperCase()
}

function requirementMatch(req: RequirementItem, courses: Course[]) {
  const codes = new Set((req.satisfiedBy ?? []).map(courseCode))
  return courses.filter((course) => codes.has(courseCode(course.code)))
}

function requiredCount(req: RequirementItem) {
  if (/select two/i.test(req.label)) return 2
  if (/\bor\b/i.test(req.label)) return 1
  return Math.max(1, req.satisfiedBy?.length ?? 1)
}

function requirementStatus(req: RequirementItem, courses: Course[]): RequirementStatus {
  if (req.verificationStatus === 'needs-verification' && !req.done) return 'needs-verification'
  if (req.done) return 'completed'
  const matches = requirementMatch(req, courses)
  if (!matches.length) return 'missing'
  const required = requiredCount(req)
  const completed = matches.filter((course) => course.status === 'completed').length
  const inProgress = matches.filter((course) => course.status === 'in-progress').length
  const planned = matches.filter((course) => course.status === 'planned').length
  if (/6 cr/i.test(req.label)) {
    const completedCredits = matches.filter((course) => course.status === 'completed').reduce((sum, course) => sum + course.credits, 0)
    const plannedCredits = matches.reduce((sum, course) => sum + course.credits, 0)
    if (completedCredits >= 6) return 'completed'
    if (completedCredits + inProgress > 0) return 'in-progress'
    if (plannedCredits >= 6 || planned > 0) return 'planned'
  }
  if (completed >= required) return 'completed'
  if (completed + inProgress >= required) return 'in-progress'
  if (completed + inProgress + planned >= required) return 'planned'
  return 'missing'
}

function statusTone(status: RequirementStatus) {
  if (status === 'completed') return 'text-success'
  if (status === 'in-progress') return 'text-primary'
  if (status === 'planned') return 'text-warning-foreground'
  if (status === 'needs-verification') return 'text-warning-foreground'
  return 'text-muted-foreground'
}

function statusLabel(status: RequirementStatus) {
  if (status === 'in-progress') return 'in progress'
  if (status === 'needs-verification') return 'needs verification'
  return status
}

function termCredits(courses: Course[]) {
  return courses.reduce((sum, course) => sum + (course.credits || 0), 0)
}

function progressPercent(done: number, total: number) {
  return total ? Math.round((done / total) * 100) : 0
}

function sourceMeta(reqs: RequirementItem[]) {
  const first = reqs[0]
  return {
    sourceType: first?.sourceType ?? 'planner-inspired',
    sourceLabel: first?.sourceLabel ?? 'Planner note',
    sourceUrl: first?.sourceUrl,
    verificationStatus: reqs.some((req) => req.verificationStatus === 'needs-verification') ? 'needs-verification' : first?.verificationStatus ?? 'needs-verification',
  }
}

function SourceBadge({ reqs }: { reqs: RequirementItem[] }) {
  const meta = sourceMeta(reqs)
  const official = meta.sourceType === 'official'
  const premed = meta.sourceType === 'premed-advice'
  return (
    <span className="inline-flex items-center gap-1">
      <span className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide',
        official ? 'border-primary/30 bg-primary/10 text-primary' : premed ? 'border-purple-400/30 bg-purple-500/10 text-purple-700 dark:text-purple-200' : 'border-warning/35 bg-warning/15 text-warning-foreground'
      )}>
        {official ? <ShieldCheck className="size-3" /> : premed ? <Sparkles className="size-3" /> : <AlertTriangle className="size-3" />}
        {meta.sourceLabel}{meta.verificationStatus === 'needs-verification' ? ' · needs verification' : ''}
      </span>
      {/* Official-vs-advice is the Category A/B trust split — the one thing a
          student must not have to guess at (knowledge-sources.md). */}
      <InfoTip field="requirement.sourceType" value={meta.sourceType} />
    </span>
  )
}

function isGenEdRequirement(req: RequirementItem) {
  return req.group.startsWith('IDEAs')
    || /first-year|focus|reflection|integration|lfit|campus life|american democracy|disciplinary distribution|gen ed/i.test(`${req.group} ${req.label}`)
}

function isMajorRequirement(req: RequirementItem) {
  return req.group.startsWith('Neuroscience') || /^Major/i.test(req.group)
}

function isPremedRequirement(req: RequirementItem) {
  return req.group.startsWith('Pre-Med') || /premed|pre-med|med prerequisite|UNC HPA/i.test(req.group)
}

function TarHeelTracker() {
  const courses = useStore((s) => s.courses)
  const requirements = useStore((s) => s.requirements)
  const addItem = useStore((s) => s.addItem)
  const patchItem = useStore((s) => s.patchItem)
  const [catalogYear, setCatalogYear] = useState('2026-2027')
  const [majorQuery, setMajorQuery] = useState('')
  const [selectedMajor, setSelectedMajor] = useState('neuroscience-bs')
  const [libraryOpen, setLibraryOpen] = useState(true)
  const [courseQuery, setCourseQuery] = useState('')
  const [termFilter, setTermFilter] = useState('Any term')
  const [requiredOnly, setRequiredOnly] = useState(false)
  const [remainingOnly, setRemainingOnly] = useState(false)
  const [selectedTerm, setSelectedTerm] = useState('Fall 2026')
  const [courseDetail, setCourseDetail] = useState<Course | null>(null)
  const [apOpen, setApOpen] = useState(false)
  const [customOpen, setCustomOpen] = useState(false)
  const [progressView, setProgressView] = useState<'bars' | 'rings'>('bars')
  const [toast, setToast] = useState('')

  const visibleRequirements = requirements.filter((req) => !/organismal/i.test(req.group) && !/^organismal$/i.test(req.label.trim()))
  const grouped = useMemo(() => {
    const map = new Map<string, RequirementItem[]>()
    for (const req of visibleRequirements) {
      const arr = map.get(req.group) ?? []
      arr.push(req)
      map.set(req.group, arr)
    }
    return [...map.entries()]
  }, [visibleRequirements])

  const reqStatus = useMemo(() => new Map(visibleRequirements.map((req) => [req.id, requirementStatus(req, courses)])), [visibleRequirements, courses])
  const unplacedRequirements = visibleRequirements.filter((req) => reqStatus.get(req.id) === 'missing')
  const genEdReqs = visibleRequirements.filter(isGenEdRequirement)
  const majorReqs = visibleRequirements.filter(isMajorRequirement)
  const premedReqs = visibleRequirements.filter(isPremedRequirement)
  const officialReqs = visibleRequirements.filter((req) => req.sourceType === 'official')
  const completedOfficial = officialReqs.filter((req) => reqStatus.get(req.id) === 'completed').length
  const completedGenEd = genEdReqs.filter((req) => reqStatus.get(req.id) === 'completed').length
  const completedMajor = majorReqs.filter((req) => reqStatus.get(req.id) === 'completed').length
  const completedPremed = premedReqs.filter((req) => ['completed', 'in-progress', 'planned'].includes(reqStatus.get(req.id) ?? 'missing')).length
  const totalCredits = courses.filter((course) => course.status !== 'planned' || !/unscheduled/i.test(course.term)).reduce((sum, course) => sum + course.credits, 0)
  const completedCredits = courses.filter((course) => course.status === 'completed').reduce((sum, course) => sum + course.credits, 0)

  const warnings = useMemo(() => {
    const out: string[] = []
    const missing = officialReqs.filter((req) => reqStatus.get(req.id) === 'missing').length
    const uncertain = visibleRequirements.filter((req) => req.verificationStatus === 'needs-verification').length
    if (missing) out.push(`${missing} official requirements still missing`)
    if (uncertain) out.push(`${uncertain} rules need source/advisor verification`)
    for (const year of TERM_PLAN) {
      for (const term of year.terms) {
        const credits = termCredits(courses.filter((course) => course.term === term))
        const termCourses = courses.filter((course) => course.term === term)
        const bcpmCredits = termCredits(termCourses.filter((course) => course.bcpm))
        if (credits > 18) out.push(`${term} is overloaded at ${credits} credits`)
        if (credits > 0 && credits < 12 && !/Summer/i.test(term)) out.push(`${term} is below full-time load`)
        if (credits >= 12 && bcpmCredits / credits >= 0.75) out.push(`${term} records ${bcpmCredits} of ${credits} credits as BCPM`)
      }
    }
    for (const course of courses) {
      if (/spring-only/i.test(course.notes ?? '') && !/Spring/i.test(course.term)) {
        out.push(`${course.code} is marked spring-only but placed in ${course.term}`)
      }
    }
    const seen = new Map<string, number>()
    for (const course of courses) {
      if (!course.code) continue
      seen.set(courseCode(course.code), (seen.get(courseCode(course.code)) ?? 0) + 1)
    }
    for (const [code, count] of seen) if (count > 1) out.push(`${code} appears ${count} times`)
    return out
  }, [courses, officialReqs, reqStatus, visibleRequirements])

  const requirementCodes = new Set(visibleRequirements.flatMap((req) => req.satisfiedBy ?? []).map(courseCode))
  const libraryCourses = courses
    .filter((course) => {
      const q = courseQuery.trim().toLowerCase()
      const matchesSearch = !q || `${course.code} ${course.title}`.toLowerCase().includes(q)
      const matchesTerm = termFilter === 'Any term' || course.term.includes(termFilter)
      const matchesRequired = !requiredOnly || requirementCodes.has(courseCode(course.code))
      const relatedReqs = visibleRequirements.filter((req) => (req.satisfiedBy ?? []).map(courseCode).includes(courseCode(course.code)))
      const matchesRemaining = !remainingOnly || relatedReqs.some((req) => reqStatus.get(req.id) !== 'completed')
      return matchesSearch && matchesTerm && matchesRequired && matchesRemaining
    })
    .slice(0, 60)

  const modeledProgram = PROGRAMS.find((program) => program.id === selectedMajor)

  function addCourseToTerm(course: Course, term: string) {
    patchItem('courses', course.id, { term, status: course.status === 'completed' ? 'completed' : 'planned' })
    setToast(`${course.code || 'Course'} added to ${term}`)
    setCourseDetail(null)
    window.setTimeout(() => setToast(''), 2600)
  }

  function addCustomCourse(payload: Pick<Course, 'code' | 'title' | 'credits' | 'term' | 'notes'>) {
    addItem('courses', {
      id: uid(),
      code: payload.code,
      title: payload.title || 'Custom course',
      credits: payload.credits,
      term: payload.term,
      grade: '',
      bcpm: false,
      status: 'planned',
      inResidence: true,
      satisfies: ['User-note / advisor review needed'],
      notes: payload.notes,
      order: 0,
    } as Course)
    setToast('Custom course added as user-note; official requirement credit still needs verification.')
    window.setTimeout(() => setToast(''), 3200)
  }

  function clearPlanner() {
    if (!window.confirm('Move planned/in-progress in-residence courses to Unscheduled? Completed and AP/transfer courses stay intact.')) return
    for (const course of courses) {
      if (course.inResidence && course.status !== 'completed') patchItem('courses', course.id, { term: 'Unscheduled' })
    }
  }

  return (
    <div className="relative">
      {toast && <div className="fixed bottom-5 right-5 z-50 rounded-xl border border-border bg-card px-4 py-3 text-sm font-bold shadow-xl">{toast}</div>}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-3 shadow-sm">
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid size-10 place-items-center rounded-xl bg-primary/12 text-primary"><GraduationCap className="size-5" /></div>
          <div>
            <h3 className="font-display text-xl font-bold">Tar Heel Tracker</h3>
            <p className="text-xs text-muted-foreground">Local planner · official requirements are labeled separately from premed advice.</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-muted px-3 py-1 text-xs font-extrabold">Total {totalCredits} / 120 credits</span>
          <Button size="sm" variant="outline" onClick={() => setApOpen(true)}><ShieldCheck className="size-4" /> AP Credit</Button>
          <Button size="sm" variant={libraryOpen ? 'default' : 'outline'} onClick={() => setLibraryOpen((open) => !open)}><Library className="size-4" /> Course Library</Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost" className="size-8 text-muted-foreground" aria-label="More planner actions">
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel>Planner actions</DropdownMenuLabel>
              <DropdownMenuItem
                onSelect={clearPlanner}
                className="text-destructive focus:bg-destructive/10 focus:text-destructive"
              >
                <Trash2 className="size-4" /> Clear planner
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className={cn('grid gap-4', libraryOpen ? 'xl:grid-cols-[20rem_minmax(0,1fr)_22rem]' : 'xl:grid-cols-[20rem_minmax(0,1fr)]')}>
        <aside className="max-h-[calc(100vh-9rem)] overflow-y-auto rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h4 className="font-display text-lg font-bold">Degree Progress</h4>
            <Button size="icon" variant="ghost" className="size-8 xl:hidden" onClick={() => setLibraryOpen(false)}><X className="size-4" /></Button>
          </div>
          <div className="space-y-3">
            <FieldLabel label="Catalog Year">
              <InlineSelect value={catalogYear} options={['2026-2027', '2025-2026', '2024-2025']} onChange={setCatalogYear} />
              <p className="mt-1 text-[11px] text-muted-foreground">Major/minor requirements follow the catalog year you entered under.</p>
            </FieldLabel>
            <FieldLabel label="Major">
              <div className="rounded-lg border border-input bg-background p-2">
                <div className="mb-1 flex items-center gap-1.5 rounded-md bg-muted px-2 py-1">
                  <Search className="size-3.5 text-muted-foreground" />
                  <input value={majorQuery} onChange={(e) => setMajorQuery(e.target.value)} placeholder="Search UNC programs..." className="min-w-0 flex-1 bg-transparent text-sm outline-none" />
                </div>
                <div className="max-h-28 overflow-y-auto">
                  {PROGRAMS.filter((program) => program.label.toLowerCase().includes(majorQuery.toLowerCase())).map((program) => (
                    <button key={program.id} onClick={() => setSelectedMajor(program.id)} className={cn('flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted', selectedMajor === program.id && 'bg-primary/10 text-primary')}>
                      {program.label}
                      {!program.modeled && <span className="text-[10px] font-bold text-muted-foreground">future-ready</span>}
                    </button>
                  ))}
                </div>
              </div>
              {!modeledProgram?.modeled && <p className="mt-1 text-[11px] text-warning-foreground">Only Neuroscience B.S. is modeled. Other programs are UI placeholders until official rules are seeded.</p>}
            </FieldLabel>
            <FieldLabel label="Second Major / Minor">
              <InlineSelect value="None" options={['None']} onChange={() => undefined} />
            </FieldLabel>
          </div>

          <div className="mt-5 space-y-3">
            <div className="flex items-center justify-between">
              <h5 className="text-xs font-extrabold uppercase tracking-wide text-muted-foreground">Progress</h5>
              <button onClick={() => setProgressView((v) => v === 'bars' ? 'rings' : 'bars')} className="rounded-md px-2 py-1 text-[11px] font-bold text-primary hover:bg-primary/10">
                {progressView === 'bars' ? 'Chart' : 'Bars'}
              </button>
            </div>
            <ProgressMetric label="Credits" value={completedCredits} total={120} ring={progressView === 'rings'} />
            <ProgressMetric label="Official UNC reqs" value={completedOfficial} total={officialReqs.length} ring={progressView === 'rings'} />
            <ProgressMetric label="Gen Eds" value={completedGenEd} total={genEdReqs.length} ring={progressView === 'rings'} />
            <ProgressMetric label="Major" value={completedMajor} total={majorReqs.length} ring={progressView === 'rings'} />
            <ProgressMetric label="Premed overlay" value={completedPremed} total={premedReqs.length} ring={progressView === 'rings'} />
          </div>

          <div className="mt-5 space-y-2">
            <h5 className="text-xs font-extrabold uppercase tracking-wide text-muted-foreground">Warnings</h5>
            {warnings.length === 0 ? (
              <div className="flex items-center gap-2 rounded-xl bg-success/10 px-3 py-2 text-xs font-bold text-success"><CheckCircle2 className="size-4" /> No major planner issues detected.</div>
            ) : (
              <div className="space-y-1.5">
                {warnings.slice(0, 5).map((warning) => (
                  <div key={warning} className="flex gap-2 rounded-xl bg-warning/15 px-3 py-2 text-xs font-bold text-warning-foreground"><AlertTriangle className="mt-0.5 size-3.5 shrink-0" /> {warning}</div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-5 space-y-2">
            {grouped.map(([group, items]) => {
              const done = items.filter((item) => reqStatus.get(item.id) === 'completed').length
              return (
                <details key={group} open={group.startsWith('Neuroscience') || group.startsWith('IDEAs')}>
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-2 rounded-lg px-1 py-2 text-sm font-extrabold hover:bg-muted/45">
                    <span className="min-w-0 truncate">{group}</span>
                    <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-[10px] text-secondary-foreground">{done}/{items.length}</span>
                  </summary>
                  <div className="space-y-1 pb-2 pl-1">
                    <SourceBadge reqs={items} />
                    {items.map((item) => <RequirementMini key={item.id} item={item} status={reqStatus.get(item.id) ?? 'missing'} />)}
                  </div>
                </details>
              )
            })}
          </div>
          <div className="mt-5 rounded-xl border border-border bg-muted/35 p-3 text-[11px] leading-relaxed text-muted-foreground">
            Carolina Compass inspired the planner layout only. Requirement labels come from Premed OS’s seeded UNC catalog data; uncertain rules are marked needs-verification and should be checked with the UNC catalog or an advisor.
          </div>
        </aside>

        <main className="min-w-0 space-y-4">
          <div className={cn('rounded-2xl border p-4', warnings.length ? 'border-warning/35 bg-warning/10' : 'border-success/30 bg-success/10')}>
            <button className="flex w-full items-center justify-between gap-3 text-left">
              <span className="flex items-center gap-2 font-bold">
                {warnings.length ? <AlertTriangle className="size-5 text-warning-foreground" /> : <CheckCircle2 className="size-5 text-success" />}
                {warnings.length ? `${warnings.length} planning issues need attention` : 'No prerequisite or term conflicts detected'}
              </span>
              <ChevronDown className="size-4 text-muted-foreground" />
            </button>
            {warnings.length > 0 && <ul className="mt-3 space-y-1 text-sm text-muted-foreground">{warnings.map((warning) => <li key={warning}>• {warning}</li>)}</ul>}
          </div>

          <section className="rounded-2xl border border-dashed border-border bg-card/70 p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h4 className="font-display text-lg font-bold">Unplaced requirements</h4>
                <p className="text-xs text-muted-foreground">Missing requirements with no completed or planned course attached yet.</p>
              </div>
              <Badge variant={unplacedRequirements.length ? 'warning' : 'success'}>{unplacedRequirements.length}</Badge>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {unplacedRequirements.slice(0, 6).map((requirement) => (
                <span key={requirement.id} className="rounded-full border border-border bg-muted/45 px-3 py-1 text-xs font-bold">{requirement.label}</span>
              ))}
              {unplacedRequirements.length > 6 && <span className="rounded-full bg-muted px-3 py-1 text-xs font-bold text-muted-foreground">+{unplacedRequirements.length - 6} more</span>}
              {!unplacedRequirements.length && <span className="text-sm font-semibold text-muted-foreground">Everything has a course placement.</span>}
            </div>
          </section>

          {TERM_PLAN.map((year) => {
            const yearCourses = courses.filter((course) => year.terms.includes(course.term))
            return (
              <section key={year.year} className="space-y-3">
                <div className="flex items-center gap-3">
                  <h4 className="font-display text-xl font-bold">{year.year}</h4>
                  <span className="text-sm font-bold text-muted-foreground">{termCredits(yearCourses)} credits</span>
                  <div className="h-px flex-1 bg-border" />
                </div>
                <div className="grid items-stretch gap-4 md:grid-cols-2 2xl:grid-cols-3">
                  {year.terms.map((term) => (
                    <TermCard
                      key={term}
                      term={term}
                      courses={courses.filter((course) => course.term === term)}
                      allTerms={TERM_PLAN.flatMap((plan) => plan.terms)}
                      requirements={visibleRequirements}
                      onOpenLibrary={() => { setSelectedTerm(term); setLibraryOpen(true) }}
                      onMove={(course, nextTerm) => patchItem('courses', course.id, { term: nextTerm })}
                      onRemove={(course) => patchItem('courses', course.id, { term: 'Unscheduled', status: 'planned' })}
                    />
                  ))}
                </div>
              </section>
            )
          })}
        </main>

        {libraryOpen && (
          <aside className="max-h-[calc(100vh-9rem)] overflow-y-auto rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h4 className="font-display text-lg font-bold">Course Library</h4>
                <p className="text-xs text-muted-foreground">{libraryCourses.length} courses from the seeded UNC plan</p>
              </div>
              <Button size="icon" variant="ghost" className="size-8" onClick={() => setLibraryOpen(false)}><X className="size-4" /></Button>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 rounded-lg border border-input bg-background px-2 py-1.5">
                <Search className="size-4 text-muted-foreground" />
                <input value={courseQuery} onChange={(e) => setCourseQuery(e.target.value)} placeholder="Search code or title..." className="min-w-0 flex-1 bg-transparent text-sm outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <InlineSelect value={termFilter} options={['Any term', 'Fall', 'Spring', 'Summer']} onChange={setTermFilter} />
                <InlineSelect value={selectedTerm} options={TERM_PLAN.flatMap((plan) => plan.terms)} onChange={setSelectedTerm} />
              </div>
              <label className="flex items-center gap-2 text-xs font-bold"><input type="checkbox" checked={requiredOnly} onChange={(e) => setRequiredOnly(e.target.checked)} /> Required only</label>
              <label className="flex items-center gap-2 text-xs font-bold"><input type="checkbox" checked={remainingOnly} onChange={(e) => setRemainingOnly(e.target.checked)} /> Show only remaining requirements</label>
            </div>
            <div className="mt-3 space-y-2">
              <Button size="sm" variant="outline" className="w-full" onClick={() => setCustomOpen(true)}><Plus className="size-4" /> Add custom course</Button>
              {libraryCourses.map((course) => (
                <CourseLibraryCard
                  key={course.id}
                  course={course}
                  requirements={visibleRequirements}
                  onOpen={() => setCourseDetail(course)}
                  onAdd={() => addCourseToTerm(course, selectedTerm)}
                />
              ))}
            </div>
          </aside>
        )}
      </div>

      <CourseDetailDialog
        course={courseDetail}
        requirements={visibleRequirements}
        selectedTerm={selectedTerm}
        onTerm={setSelectedTerm}
        onClose={() => setCourseDetail(null)}
        onAdd={(course) => addCourseToTerm(course, selectedTerm)}
      />
      <ApCreditDialog open={apOpen} onOpenChange={setApOpen} onAdd={(course) => addItem('courses', course)} />
      <CustomCourseDialog open={customOpen} onOpenChange={setCustomOpen} selectedTerm={selectedTerm} onAdd={addCustomCourse} />
    </div>
  )
}

function FieldLabel({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-extrabold uppercase tracking-wide text-muted-foreground">{label}</span>
      {children}
    </label>
  )
}

function ProgressMetric({ label, value, total, ring }: { label: string; value: number; total: number; ring: boolean }) {
  const pct = progressPercent(value, total)
  if (ring) {
    return (
      <div className="flex items-center gap-3 rounded-xl bg-muted/35 px-3 py-2">
        <Ring value={pct} color="var(--primary)" label={label} sublabel={`${value}/${total}`} size={54} />
        <div className="min-w-0"><p className="text-sm font-bold">{label}</p><p className="text-xs text-muted-foreground">{pct}% complete</p></div>
      </div>
    )
  }
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs font-bold"><span>{label}</span><span>{value}/{total}</span></div>
      <div className="h-2 rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} /></div>
    </div>
  )
}

function RequirementMini({ item, status }: { item: RequirementItem; status: RequirementStatus }) {
  return (
    <div className="flex items-start gap-2 rounded-lg px-1 py-1 text-xs">
      {status === 'completed' ? <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-success" /> : status === 'missing' ? <CircleIcon /> : <Clock className={cn('mt-0.5 size-3.5 shrink-0', statusTone(status))} />}
      <div className="min-w-0">
        <p className={cn('font-semibold leading-snug', status === 'completed' && 'text-muted-foreground line-through')}>{item.label}</p>
        <p className={cn('text-[10px] font-bold uppercase tracking-wide', statusTone(status))}>{statusLabel(status)}</p>
        {item.verificationStatus === 'needs-verification' && <p className="text-[10px] font-extrabold text-warning-foreground">◑ not yet verified</p>}
      </div>
    </div>
  )
}

function CircleIcon() {
  return <span className="mt-1 size-3.5 shrink-0 rounded-sm border border-muted-foreground/45" aria-hidden="true" />
}

function TermCard({
  term, courses, allTerms, requirements, onOpenLibrary, onMove, onRemove,
}: {
  term: string
  courses: Course[]
  allTerms: string[]
  requirements: RequirementItem[]
  onOpenLibrary: () => void
  onMove: (course: Course, term: string) => void
  onRemove: (course: Course) => void
}) {
  const isFall = /Fall/.test(term)
  const isSpring = /Spring/.test(term)
  const isSummer = /Summer/.test(term)
  const credits = termCredits(courses)
  return (
    <Card className="flex max-h-[38rem] h-full flex-col overflow-hidden">
      <div className={cn(
        'flex items-center justify-between px-4 py-3',
        isFall && 'bg-orange-50 text-orange-950 dark:bg-orange-950/20 dark:text-orange-100',
        isSpring && 'bg-emerald-50 text-emerald-950 dark:bg-emerald-950/20 dark:text-emerald-100',
        isSummer && 'bg-sky-50 text-sky-950 dark:bg-sky-950/20 dark:text-sky-100'
      )}>
        <div>
          <h5 className="font-display text-lg font-bold">{term.replace(/\s\d{4}/, '')}</h5>
          <p className="text-[11px] font-bold opacity-70">{term.match(/\d{4}/)?.[0] ?? ''}</p>
        </div>
        <span className={cn(
          'rounded-full bg-white/60 px-2 py-0.5 text-xs font-extrabold dark:bg-background/40',
          credits === 0 ? 'text-muted-foreground' : credits < 12 && !isSummer ? 'text-warning-foreground' : 'text-primary'
        )}>{credits} cr</span>
      </div>
      <CardContent className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
        {courses.length === 0 ? (
          <button onClick={onOpenLibrary} className="grid min-h-20 w-full place-items-center rounded-xl border border-dashed border-border text-sm font-bold text-muted-foreground transition hover:border-primary/40 hover:bg-primary/5">
            <span><Plus className="mx-auto mb-1 size-4" /> Plan {term.replace(/\s\d{4}/, '')}</span>
          </button>
        ) : courses.map((course) => (
          <CoursePlanCard key={course.id} course={course} requirements={requirements} allTerms={allTerms} onMove={onMove} onRemove={onRemove} />
        ))}
        {courses.length > 0 && <Button size="sm" variant="ghost" className="w-full" onClick={onOpenLibrary}><Plus className="size-4" /> Add another course</Button>}
      </CardContent>
    </Card>
  )
}

function CoursePlanCard({ course, requirements, allTerms, onMove, onRemove }: { course: Course; requirements: RequirementItem[]; allTerms: string[]; onMove: (course: Course, term: string) => void; onRemove: (course: Course) => void }) {
  const tags = requirementTags(course, requirements)
  const prefix = courseCode(course.code).split(' ')[0]
  return (
    <div className="rounded-xl border border-border bg-card p-3 transition hover:bg-muted/35">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-display text-base font-bold">{course.code || 'Custom'}</p>
          <p className="line-clamp-2 text-sm text-muted-foreground">{course.title || 'Untitled course'}</p>
        </div>
        <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-xs font-bold text-secondary-foreground">{course.credits} cr</span>
      </div>
      <div className="mt-2 flex flex-wrap gap-1">
        <StatusBadge status={course.status} />
        {PREMED_TAGS[prefix] && <span className="rounded-full bg-purple-500/10 px-2 py-0.5 text-[10px] font-bold text-purple-700 dark:text-purple-200">{PREMED_TAGS[prefix]}</span>}
        {/spring-only/i.test(course.notes ?? '') && <span className="rounded-full bg-sky-500/12 px-2 py-0.5 text-[10px] font-bold text-sky-700 dark:text-sky-200">❄ spring only</span>}
        {tags.slice(0, 2).map((tag) => <span key={tag} className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">{tag}</span>)}
      </div>
      <div className="mt-2 flex items-center gap-2">
        <InlineSelect value={course.term} options={[...allTerms, 'Unscheduled', 'Transfer / AP Credit']} onChange={(term) => onMove(course, term)} className="h-8 min-w-0 flex-1 text-xs" />
        <Button size="icon" variant="ghost" className="size-8" onClick={() => onRemove(course)}><Trash2 className="size-3.5" /></Button>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: Course['status'] }) {
  return <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-bold', status === 'completed' ? 'bg-success/10 text-success' : status === 'in-progress' ? 'bg-primary/10 text-primary' : 'bg-warning/15 text-warning-foreground')}>{status}</span>
}

function requirementTags(course: Course, requirements: RequirementItem[]) {
  const code = courseCode(course.code)
  return requirements
    .filter((req) => (req.satisfiedBy ?? []).map(courseCode).includes(code))
    .map((req) => req.group.replace('Neuroscience B.S. — ', '').replace('IDEAs in Action — ', '').replace('Pre-Med additions (UNC HPA)', 'Premed'))
}

function CourseLibraryCard({ course, requirements, onOpen, onAdd }: { course: Course; requirements: RequirementItem[]; onOpen: () => void; onAdd: () => void }) {
  const tags = requirementTags(course, requirements)
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <button onClick={onOpen} className="block w-full text-left">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-display text-base font-bold">{course.code}</p>
            <p className="line-clamp-2 text-sm text-muted-foreground">{course.title}</p>
          </div>
          <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-bold text-secondary-foreground">{course.credits} cr</span>
        </div>
        <div className="mt-2 flex flex-wrap gap-1">
          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground">{/Fall/.test(course.term) ? 'Fall' : /Spring/.test(course.term) ? 'Spring' : /Summer/.test(course.term) ? 'Summer' : 'Any term'}</span>
          {tags.slice(0, 3).map((tag) => <span key={tag} className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">{tag}</span>)}
        </div>
      </button>
      <Button size="sm" variant="outline" className="mt-2 w-full" onClick={onAdd}><Plus className="size-4" /> Add to selected term</Button>
    </div>
  )
}

function CourseDetailDialog({ course, requirements, selectedTerm, onTerm, onClose, onAdd }: { course: Course | null; requirements: RequirementItem[]; selectedTerm: string; onTerm: (term: string) => void; onClose: () => void; onAdd: (course: Course) => void }) {
  const tags = course ? requirementTags(course, requirements) : []
  return (
    <Dialog open={Boolean(course)} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent>
        {course && (
          <>
            <DialogHeader>
              <DialogTitle>{course.code} · {course.title}</DialogTitle>
              <DialogDescription>{course.credits} credits · Course ID {course.id}</DialogDescription>
            </DialogHeader>
            <div className="space-y-3 text-sm">
              <p className="text-muted-foreground">{course.notes || 'No official course description is seeded yet. Use the UNC catalog/course library to verify details before relying on this plan.'}</p>
              <div className="flex flex-wrap gap-1">{tags.length ? tags.map((tag) => <span key={tag} className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">{tag}</span>) : <span className="text-xs text-muted-foreground">No mapped requirement tags.</span>}</div>
              <div className="rounded-xl bg-muted/45 p-3">
                <p className="mb-2 text-xs font-extrabold uppercase tracking-wide text-muted-foreground">Add to schedule</p>
                <InlineSelect value={selectedTerm} options={TERM_PLAN.flatMap((plan) => plan.terms)} onChange={onTerm} className="h-10" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button onClick={() => onAdd(course)}>Add</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

function ApCreditDialog({ open, onOpenChange, onAdd }: { open: boolean; onOpenChange: (open: boolean) => void; onAdd: (course: Course) => void }) {
  const [exam, setExam] = useState('AP Biology')
  const [score, setScore] = useState(5)
  const [credits, setCredits] = useState(3)
  const [mappedCourse, setMappedCourse] = useState('BIOL 101')
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>AP Credit</DialogTitle>
          <DialogDescription>Mappings are saved as needs-verification unless already present in Andy’s seeded AP/transfer notes.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <FieldInput label="Exam" value={exam} onChange={setExam} />
          <label className="text-sm font-bold">Score<input type="number" min={1} max={5} value={score} onChange={(e) => setScore(Number(e.target.value) || 0)} className="mt-1 h-10 w-full rounded-md border border-input bg-background px-2" /></label>
          <FieldInput label="Mapped course" value={mappedCourse} onChange={setMappedCourse} />
          <label className="text-sm font-bold">Credits<input type="number" min={0} value={credits} onChange={(e) => setCredits(Number(e.target.value) || 0)} className="mt-1 h-10 w-full rounded-md border border-input bg-background px-2" /></label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => {
            onAdd({ id: uid(), term: 'Transfer / AP Credit', code: mappedCourse, title: `${exam} score ${score}`, credits, grade: '', bcpm: /BIOL|CHEM|PHYS|MATH|STOR/.test(mappedCourse), status: 'completed', inResidence: false, satisfies: ['AP credit mapping needs verification'], notes: 'Added from AP Credit scaffold; verify against UNC credit rules.', order: 0 } as Course)
            onOpenChange(false)
          }}>Add AP credit</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function CustomCourseDialog({ open, onOpenChange, selectedTerm, onAdd }: { open: boolean; onOpenChange: (open: boolean) => void; selectedTerm: string; onAdd: (payload: Pick<Course, 'code' | 'title' | 'credits' | 'term' | 'notes'>) => void }) {
  const [code, setCode] = useState('')
  const [title, setTitle] = useState('')
  const [credits, setCredits] = useState(3)
  const [term, setTerm] = useState(selectedTerm)
  const [notes, setNotes] = useState('')
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add custom course</DialogTitle>
          <DialogDescription>Custom courses are user/advisor notes and do not automatically satisfy official UNC requirements.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <FieldInput label="Course code" value={code} onChange={setCode} />
          <FieldInput label="Title" value={title} onChange={setTitle} />
          <label className="text-sm font-bold">Credits<input type="number" min={0} value={credits} onChange={(e) => setCredits(Number(e.target.value) || 0)} className="mt-1 h-10 w-full rounded-md border border-input bg-background px-2" /></label>
          <label className="text-sm font-bold">Term<InlineSelect value={term} options={TERM_PLAN.flatMap((plan) => plan.terms)} onChange={setTerm} className="mt-1 h-10" /></label>
          <label className="sm:col-span-2 text-sm font-bold">Notes<textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-1 min-h-20 w-full rounded-md border border-input bg-background px-2 py-2" /></label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => { onAdd({ code, title, credits, term, notes }); onOpenChange(false); setCode(''); setTitle(''); setNotes('') }}>Add course</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function FieldInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="text-sm font-bold">{label}<input value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 h-10 w-full rounded-md border border-input bg-background px-2" /></label>
}

function InlineSelect({
  value,
  options,
  onChange,
  className,
}: {
  value: string
  options: string[]
  onChange: (value: string) => void
  className?: string
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={className}><SelectValue /></SelectTrigger>
      <SelectContent>{options.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}</SelectContent>
    </Select>
  )
}

/**
 * §4.1 grade decisions, one section per in-progress course. Courses with
 * nothing to decide about render nothing at all — `GradeDecisions` owns that
 * rule, so this wrapper stays a lookup and never a second empty state.
 */
function GradeDecisionsSection() {
  const courses = useStore((s) => s.courses)
  const center = useStore((s) => s.academics.classCenter)
  const active = courses.filter((course) => course.status === 'in-progress')

  return (
    <div className="space-y-6">
      {active.map((course) => (
        <GradeDecisions
          key={course.id}
          course={course}
          assignments={center.assignments.filter((item) => item.courseId === course.id)}
          categories={(center.gradeCategories ?? []).filter((item) => item.courseId === course.id)}
          mistakes={(center.mistakes ?? []).filter((item) => item.courseId === course.id)}
        />
      ))}
    </div>
  )
}
