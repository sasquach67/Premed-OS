import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from 'react'
import { flushSync } from 'react-dom'
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { AnimatePresence, m, useReducedMotion } from 'motion/react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Copy,
  Download,
  FileUp,
  List,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Star,
  TableProperties,
  Trash2,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { DateField } from '@/components/common/DateField'
import { MascotNote } from '@/components/common/MascotNote'
import { PaceProjectionLine } from '@/components/common/PaceProjectionLine'
import { CollectionState, type CollectionLoadState } from '@/components/common/CollectionState'
import { RecordActionOverflow, RecordContextMenu, type RecordAction } from '@/components/common/RecordActionMenu'
import { TrackerTable, type ColumnDef } from '@/components/common/TrackerTable'
import { useToast } from '@/components/common/useToast'
import { uid } from '@/lib/id'
import { daysUntil, fmtDeadline, fmtEventDate } from '@/lib/date'
import { MOTION_DISTANCE, MOTION_TRANSITION } from '@/lib/motion'
import type {
  ClassAssignment,
  ClassAssignmentStatus,
  ClassAssignmentType,
  Course,
  ListViewState,
  Topic,
} from '@/lib/types'
import { cn } from '@/lib/utils'
import { useStore } from '@/store/store'
import { assignmentBucket, workloadLabel, type AssignmentBucketId } from '@/components/common/assignmentsLogic'

type AssignmentView = 'agenda' | 'weekly' | 'calendar'
type BucketId = AssignmentBucketId

const LIST_ID = 'academics.assignments'
const COMPLETED = new Set<ClassAssignmentStatus>(['submitted', 'graded'])
const ASSIGNMENT_TYPES: ClassAssignmentType[] = ['homework', 'quiz', 'exam', 'project', 'reading', 'lab', 'discussion', 'other']
const BUCKETS: Array<{ id: BucketId; label: string; capped: boolean }> = [
  { id: 'overdue', label: 'Overdue', capped: false },
  { id: 'today', label: 'Today', capped: false },
  { id: 'this-week', label: 'This week', capped: true },
  { id: 'next-week', label: 'Next week', capped: true },
  { id: 'later', label: 'Later', capped: true },
  { id: 'completed', label: 'Completed', capped: false },
]
const COURSE_COLORS = ['#65b7e8', '#70bd83', '#9b7be8', '#e9a85f', '#e27f74', '#67bdb2', '#cf79ae']

function localDate(iso?: string) {
  if (!iso) return null
  const value = new Date(`${iso.slice(0, 10)}T12:00:00`)
  return Number.isNaN(value.getTime()) ? null : value
}

function isoDate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function startOfDay(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function addDays(date: Date, amount: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + amount)
  return next
}

function startOfWeek(date: Date) {
  return addDays(startOfDay(date), -date.getDay())
}

function courseColor(courseId: string, courses: Course[]) {
  const index = Math.max(0, courses.findIndex((course) => course.id === courseId))
  return COURSE_COLORS[index % COURSE_COLORS.length]
}

function courseLabel(courseId: string, courses: Course[]) {
  return courses.find((course) => course.id === courseId)?.code || 'Unknown class'
}

function relativeDue(iso?: string) {
  const days = daysUntil(iso)
  if (days == null) return { label: 'No due date', variant: 'muted' as const }
  if (days < 0) return { label: fmtDeadline(iso), variant: 'danger' as const }
  if (days <= 6) return { label: fmtDeadline(iso), variant: 'warning' as const }
  return { label: fmtDeadline(iso), variant: 'muted' as const }
}

function exactDue(iso?: string) {
  return localDate(iso)?.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) ?? 'Unscheduled'
}

function nextOrder(assignments: ClassAssignment[]) {
  return assignments.reduce((max, item) => Math.max(max, item.order), -1) + 1
}

function preferenceBase(current?: ListViewState): ListViewState {
  return current ?? { filters: {}, visibleColumns: [], density: 'comfortable', view: 'agenda' }
}

function isAssignmentView(value: string | null | undefined): value is AssignmentView {
  return value === 'agenda' || value === 'weekly' || value === 'calendar'
}

export function AssignmentCreateDialog({
  open,
  onOpenChange,
  assignment,
  fixedCourseId,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  assignment?: ClassAssignment | null
  /** Used by a Class Hub so new work cannot accidentally be filed elsewhere. */
  fixedCourseId?: string
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{assignment ? 'Edit assignment' : 'Add assignment'}</DialogTitle>
          <DialogDescription>Keep the first entry lightweight. A class and title are required.</DialogDescription>
        </DialogHeader>
        {open && <AssignmentForm key={assignment?.id ?? 'new'} assignment={assignment} fixedCourseId={fixedCourseId} onDone={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  )
}

function AssignmentForm({
  assignment,
  fixedCourseId,
  onDone,
}: {
  assignment?: ClassAssignment | null
  fixedCourseId?: string
  onDone: () => void
}) {
  const courses = useStore((state) => state.courses)
  const assignments = useStore((state) => state.academics.classCenter.assignments)
  const update = useStore((state) => state.update)
  const toast = useToast()
  const [title, setTitle] = useState(assignment?.title ?? '')
  const [courseId, setCourseId] = useState(assignment?.courseId ?? fixedCourseId ?? '')
  const [type, setType] = useState<ClassAssignmentType>(assignment?.type ?? 'homework')
  const [dueDate, setDueDate] = useState(assignment?.dueDate?.slice(0, 10) ?? '')
  const [weight, setWeight] = useState(assignment?.weight == null ? '' : String(assignment.weight))
  const [pointsPossible, setPointsPossible] = useState(assignment?.pointsPossible == null ? '' : String(assignment.pointsPossible))

  function submit(event: FormEvent) {
    event.preventDefault()
    if (!title.trim() || !courseId) return
    const now = Date.now()
    if (assignment) {
      const previous = structuredClone(assignment)
      update((draft) => {
        const target = draft.academics.classCenter.assignments.find((item) => item.id === assignment.id)
        if (!target) return
        Object.assign(target, {
          title: title.trim(),
          courseId,
          type,
          dueDate: dueDate || undefined,
          weight: weight === '' ? undefined : Number(weight),
          pointsPossible: pointsPossible === '' ? undefined : Number(pointsPossible),
          updatedAt: now,
        })
      })
      toast({
        title: 'Assignment updated',
        tone: 'success',
        onUndo: () => update((draft) => {
          const index = draft.academics.classCenter.assignments.findIndex((item) => item.id === previous.id)
          if (index >= 0) draft.academics.classCenter.assignments[index] = previous
        }),
      })
    } else {
      const created: ClassAssignment = {
        id: uid(),
        courseId,
        title: title.trim(),
        type,
        dueDate: dueDate || undefined,
        status: 'not-started',
        weight: weight === '' ? undefined : Number(weight),
        pointsPossible: pointsPossible === '' ? undefined : Number(pointsPossible),
        linkedTopicIds: [],
        linkedFileIds: [],
        createdAt: now,
        updatedAt: now,
        order: nextOrder(assignments),
      }
      update((draft) => { draft.academics.classCenter.assignments.push(created) })
      toast({
        title: 'Assignment created',
        tone: 'success',
        onUndo: () => update((draft) => {
          draft.academics.classCenter.assignments = draft.academics.classCenter.assignments.filter((item) => item.id !== created.id)
        }),
      })
    }
    onDone()
  }

  return (
    <form className="space-y-4" onSubmit={submit}>
          <div className="space-y-1.5">
            <Label htmlFor="assignment-title">Title</Label>
            <Input id="assignment-title" autoFocus value={title} onChange={(event) => setTitle(event.target.value)} required />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Class</Label>
              {fixedCourseId ? <div className="flex h-10 items-center rounded-md border border-input bg-muted px-3 text-sm font-semibold">{courses.find((course) => course.id === fixedCourseId)?.code ?? 'This class'}</div> : <Select value={courseId} onValueChange={setCourseId} required>
                <SelectTrigger aria-label="Class"><SelectValue placeholder="Choose a class" /></SelectTrigger>
                <SelectContent>
                  {courses.map((course) => <SelectItem key={course.id} value={course.id}>{course.code} · {course.title}</SelectItem>)}
                </SelectContent>
              </Select>}
            </div>
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={type} onValueChange={(value) => setType(value as ClassAssignmentType)}>
                <SelectTrigger aria-label="Assignment type"><SelectValue /></SelectTrigger>
                <SelectContent>{ASSIGNMENT_TYPES.map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Due date</Label>
            <DateField value={dueDate} onChange={setDueDate} ariaLabel="Assignment due date" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="assignment-weight">Weight (%)</Label>
              <Input id="assignment-weight" type="number" min="0" max="100" step="0.1" value={weight} onChange={(event) => setWeight(event.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="assignment-points">Points possible</Label>
              <Input id="assignment-points" type="number" min="0" step="0.1" value={pointsPossible} onChange={(event) => setPointsPossible(event.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onDone}>Cancel</Button>
            <Button type="submit" disabled={!title.trim() || !courseId}>{assignment ? 'Save changes' : 'Add assignment'}</Button>
          </DialogFooter>
    </form>
  )
}

export function AssignmentsPanel({
  onRequestAdd,
  state = 'ready',
  errorMessage,
  onRetry,
  courseId: scopedCourseId,
}: {
  onRequestAdd?: () => void
  state?: CollectionLoadState
  errorMessage?: string
  onRetry?: () => void
  /** Locks this instance to one course while retaining the global agenda UI. */
  courseId?: string
}) {
  const assignments = useStore((store) => store.academics.classCenter.assignments)
  const courses = useStore((store) => store.courses)
  const topics = useStore((store) => store.academics.classCenter.topics)
  const preference = useStore((store) => store.settings.listPreferences[LIST_ID])
  const update = useStore((store) => store.update)
  const toast = useToast()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const reduceMotion = useReducedMotion()
  const [createOpen, setCreateOpen] = useState(false)
  const [editing, setEditing] = useState<ClassAssignment | null>(null)
  const [tableOpen, setTableOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [courseFilter, setCourseFilter] = useState(scopedCourseId ?? 'all')
  const [expandedBuckets, setExpandedBuckets] = useState<Set<BucketId>>(() => new Set())
  const [weekCursor, setWeekCursor] = useState(() => startOfWeek(new Date()))
  const [calendarCursor, setCalendarCursor] = useState(() => startOfWeek(new Date()))
  const [selectedDay, setSelectedDay] = useState(() => startOfDay())

  const linked = useMemo(
    () => assignments.filter((assignment) => Boolean(assignment.courseId)),
    [assignments],
  )
  const scoped = useMemo(() => linked.filter((assignment) => !scopedCourseId || assignment.courseId === scopedCourseId), [linked, scopedCourseId])
  const filtered = useMemo(() => scoped.filter((assignment) => {
    if (!scopedCourseId && courseFilter !== 'all' && assignment.courseId !== courseFilter) return false
    const needle = query.trim().toLocaleLowerCase()
    return !needle || assignment.title.toLocaleLowerCase().includes(needle)
      || courseLabel(assignment.courseId, courses).toLocaleLowerCase().includes(needle)
  }), [courseFilter, courses, query, scoped, scopedCourseId])

  const requestedView = searchParams.get('view')
  const assignmentsRouteActive = searchParams.get('tab') === 'assignments' || searchParams.get('classTab') === 'assignments'
  const preferredView = isAssignmentView(preference?.view) ? preference.view : 'agenda'
  const view: AssignmentView = isAssignmentView(requestedView) ? requestedView : preferredView
  const collapsed = new Set(
    Array.isArray(preference?.filters.collapsedBuckets)
      ? preference.filters.collapsedBuckets as string[]
      : ['completed'],
  )
  const showCompleted = Boolean(preference?.filters.showCompleted)
  const workloadCollapsed = Boolean(preference?.filters.workloadCollapsed)

  function setPreference(mutator: (next: ListViewState) => void) {
    update((draft) => {
      const current = preferenceBase(draft.settings.listPreferences[LIST_ID])
      const next: ListViewState = {
        ...current,
        filters: { ...current.filters },
        visibleColumns: [...current.visibleColumns],
        sort: current.sort ? { ...current.sort } : undefined,
        dateRange: current.dateRange ? { ...current.dateRange } : undefined,
      }
      mutator(next)
      draft.settings.listPreferences[LIST_ID] = next
    })
  }

  useEffect(() => {
    if (!assignmentsRouteActive) return
    if (!isAssignmentView(requestedView)) {
      setSearchParams((current) => {
        const next = new URLSearchParams(current)
        next.set('view', preferredView)
        return next
      }, { replace: true })
      return
    }
    if (preference?.view !== requestedView) setPreference((next) => { next.view = requestedView })
  }, [assignmentsRouteActive, preferredView, requestedView])

  function selectView(nextView: AssignmentView) {
    if (nextView === view) return
    setPreference((next) => { next.view = nextView })
    setSearchParams((current) => {
      const next = new URLSearchParams(current)
      next.set('view', nextView)
      return next
    })
  }

  function requestAdd() {
    if (!scopedCourseId && !courses.length) {
      navigate('/academics?mode=daily&tab=class-center&importFor=new')
      return
    }
    if (onRequestAdd) onRequestAdd()
    else setCreateOpen(true)
  }

  useEffect(() => {
    function keyboard(event: KeyboardEvent) {
      if (!(event.metaKey || event.ctrlKey) || event.key.toLocaleLowerCase() !== 'n') return
      const target = event.target as HTMLElement | null
      if (target?.matches('input, textarea, [contenteditable="true"]')) return
      event.preventDefault()
      requestAdd()
    }
    window.addEventListener('keydown', keyboard)
    return () => window.removeEventListener('keydown', keyboard)
  })

  function patchAssignment(id: string, patch: Partial<ClassAssignment>) {
    update((draft) => {
      const target = draft.academics.classCenter.assignments.find((item) => item.id === id)
      if (target) Object.assign(target, patch, { updatedAt: Date.now() })
    })
  }

  function complete(assignment: ClassAssignment, checked: boolean) {
    const previous = assignment.status
    const next: ClassAssignmentStatus = checked ? 'submitted' : 'not-started'
    patchAssignment(assignment.id, { status: next })
    toast({
      title: checked ? 'Assignment completed' : 'Assignment reopened',
      onUndo: () => patchAssignment(assignment.id, { status: previous }),
    })
  }

  function reschedule(assignment: ClassAssignment, dueDate: string) {
    const previous = assignment.dueDate
    if (previous?.slice(0, 10) === dueDate) return
    patchAssignment(assignment.id, { dueDate })
    toast({
      title: 'Assignment rescheduled',
      description: `${assignment.title} moved to ${exactDue(dueDate)}.`,
      onUndo: () => patchAssignment(assignment.id, { dueDate: previous }),
    })
  }

  function duplicate(assignment: ClassAssignment) {
    const copy: ClassAssignment = {
      ...structuredClone(assignment),
      id: uid(),
      title: `${assignment.title} copy`,
      status: 'not-started',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      order: nextOrder(assignments),
    }
    update((draft) => { draft.academics.classCenter.assignments.push(copy) })
    toast({
      title: 'Assignment duplicated',
      onUndo: () => update((draft) => {
        draft.academics.classCenter.assignments = draft.academics.classCenter.assignments.filter((item) => item.id !== copy.id)
      }),
    })
  }

  function remove(assignment: ClassAssignment) {
    update((draft) => {
      draft.academics.classCenter.assignments = draft.academics.classCenter.assignments.filter((item) => item.id !== assignment.id)
    })
    toast({
      title: 'Assignment removed',
      onUndo: () => update((draft) => {
        if (!draft.academics.classCenter.assignments.some((item) => item.id === assignment.id)) {
          draft.academics.classCenter.assignments.push(assignment)
        }
      }),
    })
  }

  function exportCsv() {
    const escape = (value: unknown) => `"${String(value ?? '').replaceAll('"', '""')}"`
    const rows = scoped.map((item) => [
      item.title,
      courseLabel(item.courseId, courses),
      item.type,
      item.dueDate ?? '',
      item.status,
      item.weight ?? '',
      item.pointsPossible ?? '',
      item.important ? 'yes' : 'no',
    ].map(escape).join(','))
    const csv = [['Title', 'Course', 'Type', 'Due date', 'Status', 'Weight', 'Points possible', 'Important'].map(escape).join(','), ...rows].join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'premedos-assignments.csv'
    anchor.click()
    URL.revokeObjectURL(url)
    toast({ title: 'Assignments exported', description: `${scoped.length} course-linked records included.` })
  }

  if (state !== 'ready') return <CollectionState state={state} errorMessage={errorMessage} onRetry={onRetry} />

  if (!scopedCourseId && !courses.length) {
    return <MascotNote
      variant="empty-state"
      title="Add a class before an assignment"
      actions={<Button size="sm" asChild><Link to="/academics?mode=daily&tab=class-center&importFor=new"><Plus className="size-4" /> Import a syllabus</Link></Button>}
    >
      Assignments are coursework commitments, so each one needs a real class. Start with the syllabus you already have, or add the class manually from Class Center.
    </MascotNote>
  }

  return (
    <div className="daily-assignments space-y-5">
      <div className="daily-assignments-filter flex flex-col gap-2 rounded-xl border border-border bg-card p-2.5 lg:flex-row lg:items-center">
        <ToggleGroup
          type="single"
          value={view}
          onValueChange={(value) => isAssignmentView(value) && selectView(value)}
          variant="outline"
          aria-label="Assignment view"
          className="rounded-xl"
        >
          <ToggleGroupItem value="agenda" aria-label="Agenda view"><List className="size-4" /> Agenda</ToggleGroupItem>
          <ToggleGroupItem value="weekly" aria-label="Weekly view"><ClipboardList className="size-4" /> Weekly</ToggleGroupItem>
          <ToggleGroupItem value="calendar" aria-label="Calendar view"><CalendarDays className="size-4" /> Calendar</ToggleGroupItem>
        </ToggleGroup>
        {!scopedCourseId && <Select value={courseFilter} onValueChange={setCourseFilter}>
          <SelectTrigger className="w-full lg:w-44" aria-label="Filter by class"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All classes</SelectItem>
            {courses.map((course) => <SelectItem key={course.id} value={course.id}>{course.code}</SelectItem>)}
          </SelectContent>
        </Select>}
        <div className="relative min-w-52 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(event) => setQuery(event.target.value)} className="pl-9" placeholder="Search assignments…" />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild><Button variant="outline" size="icon" aria-label="Assignment options"><MoreHorizontal className="size-4" /></Button></DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => setTableOpen(true)}><TableProperties className="size-4" /> Edit as table</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => {
              const courseId = scopedCourseId ?? (courseFilter !== 'all' ? courseFilter : 'new')
              navigate(`/academics?mode=daily&tab=class-center&importFor=${courseId}`)
            }}><FileUp className="size-4" /> Import syllabus</DropdownMenuItem>
            <DropdownMenuCheckboxItem
              checked={showCompleted}
              onCheckedChange={(checked) => setPreference((next) => { next.filters.showCompleted = Boolean(checked) })}
            >
              Show completed
            </DropdownMenuCheckboxItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={exportCsv}><Download className="size-4" /> Export CSV</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {scopedCourseId && <div className="daily-assignments-handoff flex items-center justify-between gap-3 border-b border-border pb-3">
        <p className="text-sm font-semibold text-muted-foreground">This course’s execution view. Use all assignments to weigh work across classes.</p>
        <Button size="sm" variant="outline" asChild><Link to="/academics?mode=daily&tab=assignments">All assignments</Link></Button>
      </div>}

      <AnimatePresence mode="wait" initial={false}>
        <m.div
          key={view}
          initial={reduceMotion ? false : { opacity: 0, y: MOTION_DISTANCE.small }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -MOTION_DISTANCE.small }}
          transition={reduceMotion ? MOTION_TRANSITION.instant : MOTION_TRANSITION.standard}
        >
          {view === 'agenda' && (
            <AgendaView
              assignments={filtered}
              courses={courses}
              topics={topics}
              showCourseLabel={!scopedCourseId}
              collapsed={collapsed}
              expandedBuckets={expandedBuckets}
              showCompleted={showCompleted}
              onToggleBucket={(id) => setPreference((next) => {
                const values = new Set(Array.isArray(next.filters.collapsedBuckets) ? next.filters.collapsedBuckets as string[] : ['completed'])
                if (values.has(id)) values.delete(id)
                else values.add(id)
                next.filters.collapsedBuckets = [...values]
              })}
              onExpand={(id) => setExpandedBuckets((current) => new Set(current).add(id))}
              onComplete={complete}
              onEdit={setEditing}
              onDuplicate={duplicate}
              onImportant={(assignment) => patchAssignment(assignment.id, { important: !assignment.important })}
              onDelete={remove}
              onAdd={requestAdd}
            />
          )}
          {view === 'weekly' && (
            <WeeklyView
              assignments={filtered.filter((item) => !COMPLETED.has(item.status))}
              courses={courses}
              showCourseLabel={!scopedCourseId}
              cursor={weekCursor}
              onCursor={setWeekCursor}
              onReschedule={reschedule}
              onEdit={setEditing}
              onAdd={requestAdd}
            />
          )}
          {view === 'calendar' && (
            <AssignmentCalendar
              assignments={filtered.filter((item) => !COMPLETED.has(item.status))}
              courses={courses}
              showCourseLabel={!scopedCourseId}
              cursor={calendarCursor}
              selectedDay={selectedDay}
              onCursor={setCalendarCursor}
              onSelectDay={setSelectedDay}
              onEdit={setEditing}
              onAdd={requestAdd}
            />
          )}
        </m.div>
      </AnimatePresence>

      <ProjectedWorkload
        assignments={scoped}
        courses={courses}
        collapsed={workloadCollapsed}
        onToggle={() => setPreference((next) => { next.filters.workloadCollapsed = !workloadCollapsed })}
      />

      <AssignmentCreateDialog open={createOpen} onOpenChange={setCreateOpen} fixedCourseId={scopedCourseId} />
      <AssignmentCreateDialog open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)} assignment={editing} fixedCourseId={scopedCourseId} />
      <Dialog open={tableOpen} onOpenChange={setTableOpen}>
        <DialogContent className="max-h-[92svh] max-w-[min(96vw,86rem)] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit assignments as table</DialogTitle>
            <DialogDescription>Bulk-entry and grade-update mode. Agenda remains the default assignments view.</DialogDescription>
          </DialogHeader>
          <AssignmentTable
            assignments={scoped}
            courses={courses}
            onPatch={(id, key, value) => patchAssignment(id, { [key]: value } as Partial<ClassAssignment>)}
            onEdit={(assignment) => setEditing(assignment)}
            onDelete={(id) => {
              const assignment = scoped.find((item) => item.id === id)
              if (assignment) remove(assignment)
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}

function AgendaView({
  assignments,
  courses,
  topics,
  showCourseLabel,
  collapsed,
  expandedBuckets,
  showCompleted,
  onToggleBucket,
  onExpand,
  onComplete,
  onEdit,
  onDuplicate,
  onImportant,
  onDelete,
  onAdd,
}: {
  assignments: ClassAssignment[]
  courses: Course[]
  topics: Topic[]
  showCourseLabel: boolean
  collapsed: Set<string>
  expandedBuckets: Set<BucketId>
  showCompleted: boolean
  onToggleBucket: (id: BucketId) => void
  onExpand: (id: BucketId) => void
  onComplete: (assignment: ClassAssignment, checked: boolean) => void
  onEdit: (assignment: ClassAssignment) => void
  onDuplicate: (assignment: ClassAssignment) => void
  onImportant: (assignment: ClassAssignment) => void
  onDelete: (assignment: ClassAssignment) => void
  onAdd: () => void
}) {
  const reduceMotion = useReducedMotion()
  const grouped = useMemo(() => {
    const result = new Map<BucketId, ClassAssignment[]>(BUCKETS.map((bucket) => [bucket.id, []]))
    for (const assignment of assignments) result.get(assignmentBucket(assignment))?.push(assignment)
    for (const values of result.values()) values.sort((a, b) => (a.dueDate ?? '9999').localeCompare(b.dueDate ?? '9999') || a.order - b.order)
    return result
  }, [assignments])
  const empty = assignments.length === 0
  const visibleBuckets = BUCKETS.filter((bucket) => {
    const rows = grouped.get(bucket.id) ?? []
    return rows.length > 0 && (bucket.id !== 'completed' || showCompleted)
  })

  if (empty) {
    return (
      <MascotNote
        variant="empty-state"
        title="No class deadlines yet"
        actions={<Button size="sm" onClick={onAdd}><Plus className="size-4" /> Add your first assignment</Button>}
      >
        Add an assignment, exam, or important class date so the week has something honest to organize.
      </MascotNote>
    )
  }

  return (
    <div className="space-y-4">
      <section className="daily-assignment-agenda card-soft overflow-hidden rounded-2xl border border-border bg-card">
      <AnimatePresence initial={false}>
        {visibleBuckets.map((bucket, index) => {
          const rows = grouped.get(bucket.id) ?? []
          const isCollapsed = collapsed.has(bucket.id)
          const visible = bucket.capped && !expandedBuckets.has(bucket.id) ? rows.slice(0, 5) : rows
          return (
          <m.section
            key={bucket.id}
            layout={reduceMotion ? undefined : 'position'}
            exit={reduceMotion
              ? { opacity: 0, transition: MOTION_TRANSITION.instant }
              : {
                  opacity: 0,
                  height: 0,
                  transition: { duration: 0.24, delay: 0.44, ease: [0.16, 1, 0.3, 1] },
                }}
            className={cn('daily-assignment-bucket overflow-hidden', index > 0 && 'border-t border-border')}
          >
            <button
              type="button"
              onClick={() => onToggleBucket(bucket.id)}
              className="flex w-full items-center gap-2 px-4 py-3 text-left hover:bg-muted/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
              aria-expanded={!isCollapsed}
            >
              <ChevronDown className={cn('size-4 text-muted-foreground transition-transform motion-reduce:transition-none', isCollapsed && '-rotate-90')} />
              <span className="font-display text-base font-extrabold">{bucket.label}</span>
              <Badge variant={bucket.id === 'overdue' ? 'danger' : bucket.id === 'today' ? 'warning' : 'muted'}>{rows.length}</Badge>
            </button>
            <AnimatePresence initial={false}>
              {!isCollapsed && (
                <m.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="border-t border-border"
                >
                  <div className="divide-y divide-border/70">
                    <AnimatePresence initial={false}>
                      {visible.map((assignment) => (
                        <AssignmentRow
                          key={assignment.id}
                          assignment={assignment}
                          courses={courses}
                          topics={topics}
                          showCourseLabel={showCourseLabel}
                          onComplete={onComplete}
                          onEdit={onEdit}
                          onDuplicate={onDuplicate}
                          onImportant={onImportant}
                          onDelete={onDelete}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                  {visible.length < rows.length && (
                    <button type="button" onClick={() => onExpand(bucket.id)} className="w-full border-t border-border px-4 py-2 text-left text-sm font-bold text-primary hover:bg-primary/5">
                      +{rows.length - visible.length} more →
                    </button>
                  )}
                </m.div>
              )}
            </AnimatePresence>
          </m.section>
          )
        })}
      </AnimatePresence>
        <div className="border-t border-border p-3">
          <button
            type="button"
            onClick={onAdd}
            className="flex min-h-14 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-primary/45 bg-primary/5 font-display text-sm font-extrabold text-primary transition hover:-translate-y-0.5 hover:border-primary hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transform-none motion-reduce:transition-none"
          >
            <Plus className="size-4" /> Add an assignment, exam, or important date…
          </button>
        </div>
      </section>
    </div>
  )
}

function AssignmentRow({
  assignment,
  courses,
  topics,
  showCourseLabel,
  onComplete,
  onEdit,
  onDuplicate,
  onImportant,
  onDelete,
}: {
  assignment: ClassAssignment
  courses: Course[]
  topics: Topic[]
  showCourseLabel: boolean
  onComplete: (assignment: ClassAssignment, checked: boolean) => void
  onEdit: (assignment: ClassAssignment) => void
  onDuplicate: (assignment: ClassAssignment) => void
  onImportant: (assignment: ClassAssignment) => void
  onDelete: (assignment: ClassAssignment) => void
}) {
  const complete = COMPLETED.has(assignment.status)
  const reduceMotion = useReducedMotion()
  const [isCompleting, setIsCompleting] = useState(false)
  const examDays = daysUntil(assignment.dueDate)
  const due = assignment.type === 'exam'
    ? { label: fmtEventDate(assignment.dueDate), variant: examDays != null && examDays <= 6 ? 'warning' as const : 'muted' as const }
    : relativeDue(assignment.dueDate)
  const color = courseColor(assignment.courseId, courses)
  const covered = assignment.coveredTopicIds ?? assignment.linkedTopicIds
  const ready = topics.filter((topic) => covered.includes(topic.id) && topic.status === 'ready').length

  function requestCompletion(checked: boolean) {
    if (checked && !complete) {
      // Ensure the checked state and color sweep reach the screen before the
      // assignment changes buckets. The store update remains immediate.
      flushSync(() => setIsCompleting(true))
    }
    onComplete(assignment, checked)
  }

  const visibleActions = (
    <>
      <Button size="icon" variant="ghost" className="size-8" onClick={() => onImportant(assignment)} aria-label={assignment.important ? 'Remove important' : 'Mark important'}>
        <Star className={cn('size-4', assignment.important && 'fill-warning text-warning')} />
      </Button>
      <Button size="icon" variant="ghost" className="size-8" onClick={() => onEdit(assignment)} aria-label="Edit assignment"><Pencil className="size-4" /></Button>
    </>
  )

  const actions: RecordAction[] = [
    {
      id: 'complete',
      label: complete ? 'Reopen' : 'Mark submitted',
      icon: <Check className="size-4" />,
      onSelect: () => requestCompletion(!complete),
    },
    {
      id: 'important',
      label: assignment.important ? 'Remove important' : 'Mark important',
      icon: <Star className="size-4" />,
      onSelect: () => onImportant(assignment),
    },
    { id: 'edit', label: 'Edit', icon: <Pencil className="size-4" />, onSelect: () => onEdit(assignment) },
    { id: 'duplicate', label: 'Duplicate', icon: <Copy className="size-4" />, onSelect: () => onDuplicate(assignment) },
    {
      id: 'delete',
      label: 'Delete',
      icon: <Trash2 className="size-4" />,
      destructive: true,
      separatorBefore: true,
      onSelect: () => onDelete(assignment),
    },
  ]

  return (
    <RecordContextMenu actions={actions}>
        <m.article
          layout
          exit={isCompleting
            ? reduceMotion
              ? { opacity: 0, transition: MOTION_TRANSITION.instant }
              : {
                  opacity: 0,
                  x: 56,
                  height: 0,
                  paddingTop: 0,
                  paddingBottom: 0,
                  transition: { duration: 0.3, delay: 0.22, ease: [0.16, 1, 0.3, 1] },
                }
            : { opacity: 0, transition: reduceMotion ? MOTION_TRANSITION.instant : MOTION_TRANSITION.micro }}
          data-completion-state={isCompleting ? 'acknowledging' : 'idle'}
          className={cn(
            'daily-assignment-row',
            'group relative flex flex-col gap-3 overflow-hidden px-4 py-3 sm:flex-row sm:items-center',
            assignment.important && 'border-l-4 border-l-warning bg-gradient-to-r from-warning/10 to-transparent',
            complete && 'opacity-65',
            isCompleting && 'bg-success/10',
          )}
        >
          {isCompleting && !reduceMotion && (
            <m.span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 z-0 origin-left bg-gradient-to-r from-success/25 via-success/12 to-transparent"
              initial={{ scaleX: 0, opacity: 0.9 }}
              animate={{ scaleX: 1, opacity: [0.9, 0.6, 0] }}
              transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
            />
          )}
          <span className="relative z-10 shrink-0">
            {isCompleting && !reduceMotion && (
              <m.span
                aria-hidden="true"
                className="pointer-events-none absolute -inset-1.5 rounded-full border-2 border-success"
                initial={{ scale: 0.55, opacity: 0 }}
                animate={{ scale: [0.55, 1.45, 1.7], opacity: [0, 0.8, 0] }}
                transition={{ duration: 0.44, ease: 'easeOut' }}
              />
            )}
            <Checkbox
              checked={isCompleting || complete}
              disabled={isCompleting}
              onCheckedChange={(checked) => requestCompletion(Boolean(checked))}
              aria-label={isCompleting || complete ? `${assignment.title} completed` : `Complete ${assignment.title}`}
              className={cn(isCompleting && 'data-[state=checked]:border-success data-[state=checked]:bg-success data-[state=checked]:text-white')}
            />
          </span>
          <div className="relative z-10 min-w-0 flex-1">
            <p className={cn('font-bold text-foreground', (complete || isCompleting) && 'line-through')}>{assignment.title}</p>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              {showCourseLabel && (
                <Badge
                  data-assignment-course
                  variant="outline"
                  style={{ borderColor: `${color}88`, backgroundColor: `${color}1f` }}
                >
                  {courseLabel(assignment.courseId, courses)}
                </Badge>
              )}
              <Badge variant="muted" className="capitalize">{assignment.type}</Badge>
              {assignment.type === 'exam' && <Badge variant="outline">{ready} of {covered.length} topics ready</Badge>}
              {assignment.weight != null && <Badge variant="outline">{assignment.weight}%</Badge>}
              {assignment.pointsPossible != null && <Badge variant="outline">{assignment.pointsPossible} pts</Badge>}
            </div>
          </div>
          <div className="relative z-10 flex items-center gap-2 sm:ml-auto">
            <Badge variant={due.variant}>{due.label}</Badge>
            <span className="min-w-24 whitespace-nowrap text-right text-xs font-semibold tabular-nums text-muted-foreground">{exactDue(assignment.dueDate)}</span>
            {visibleActions}
            <RecordActionOverflow actions={actions} label={`Actions for ${assignment.title}`} />
          </div>
        </m.article>
    </RecordContextMenu>
  )
}

function WeeklyView({
  assignments,
  courses,
  showCourseLabel,
  cursor,
  onCursor,
  onReschedule,
  onEdit,
  onAdd,
}: {
  assignments: ClassAssignment[]
  courses: Course[]
  showCourseLabel: boolean
  cursor: Date
  onCursor: (date: Date) => void
  onReschedule: (assignment: ClassAssignment, date: string) => void
  onEdit: (assignment: ClassAssignment) => void
  onAdd: () => void
}) {
  const days = Array.from({ length: 7 }, (_, index) => addDays(cursor, index))
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor),
  )
  const byDay = new Map(days.map((day) => [isoDate(day), assignments.filter((item) => item.dueDate?.slice(0, 10) === isoDate(day))]))

  function dragEnd(event: DragEndEvent) {
    if (!event.over) return
    const assignment = assignments.find((item) => item.id === event.active.id)
    if (assignment) onReschedule(assignment, String(event.over.id))
  }

  return (
    <div className="space-y-3">
      <section className="card-soft rounded-2xl border border-border bg-card p-3">
      <div className="flex items-center justify-between border-b border-border pb-2">
        <Button variant="ghost" size="icon" onClick={() => onCursor(addDays(cursor, -7))} aria-label="Previous week"><ChevronLeft className="size-4" /></Button>
        <p className="font-bold tabular-nums">Week of {cursor.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</p>
        <Button variant="ghost" size="icon" onClick={() => onCursor(addDays(cursor, 7))} aria-label="Next week"><ChevronRight className="size-4" /></Button>
      </div>
      <DndContext sensors={sensors} onDragEnd={dragEnd}>
        <div className="mt-3 overflow-x-auto pb-1" tabIndex={0} aria-label="Weekly assignments, horizontally scrollable">
          <div
            data-week-layout="weekday-emphasis"
            className="grid min-w-[62rem] grid-cols-[minmax(6.25rem,.62fr)_repeat(5,minmax(9rem,1fr))_minmax(6.25rem,.62fr)] gap-2"
          >
            {days.map((day) => <WeekDay key={isoDate(day)} day={day} assignments={byDay.get(isoDate(day)) ?? []} courses={courses} showCourseLabel={showCourseLabel} onEdit={onEdit} />)}
          </div>
        </div>
      </DndContext>
      </section>
      <button type="button" onClick={onAdd} className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-primary/45 bg-primary/5 font-display font-extrabold text-primary hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <Plus className="size-4" /> Add an assignment, exam, or important date…
      </button>
    </div>
  )
}

function WeekDay({ day, assignments, courses, showCourseLabel, onEdit }: { day: Date; assignments: ClassAssignment[]; courses: Course[]; showCourseLabel: boolean; onEdit: (assignment: ClassAssignment) => void }) {
  const id = isoDate(day)
  const { setNodeRef, isOver } = useDroppable({ id })
  const total = assignments.reduce((sum, item) => sum + (item.weight ?? 0), 0)
  const weekend = day.getDay() === 0 || day.getDay() === 6
  return (
    <section
      ref={setNodeRef}
      data-week-scope={weekend ? 'weekend' : 'weekday'}
      className={cn(
        'min-h-48 rounded-xl border border-border bg-muted p-2.5 transition-colors',
        weekend && 'bg-muted/45 px-2 opacity-70',
        isOver && 'border-primary bg-primary/10 opacity-100',
      )}
    >
      <div className="mb-2 flex items-start justify-between gap-1">
        <div><p className="text-xs font-extrabold uppercase tracking-wide text-muted-foreground">{day.toLocaleDateString(undefined, { weekday: 'short' })}</p><p className="font-display text-xl font-extrabold tabular-nums">{day.getDate()}</p></div>
        <Badge variant={workloadLabel(total) === 'Heavy' ? 'danger' : workloadLabel(total) === 'Busy' ? 'warning' : workloadLabel(total) === 'Light' ? 'success' : 'muted'}>{workloadLabel(total)}</Badge>
      </div>
      <div className="space-y-2">
        {assignments.map((assignment) => <WeekCard key={assignment.id} assignment={assignment} courses={courses} showCourseLabel={showCourseLabel} onEdit={onEdit} />)}
        {!assignments.length && <p className="py-8 text-center text-xs text-muted-foreground">{weekend ? '—' : 'Nothing due'}</p>}
      </div>
    </section>
  )
}

function WeekCard({ assignment, courses, showCourseLabel, onEdit }: { assignment: ClassAssignment; courses: Course[]; showCourseLabel: boolean; onEdit: (assignment: ClassAssignment) => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: assignment.id })
  const dragged = useRef(false)
  const pointerStart = useRef<{ x: number; y: number } | null>(null)
  return (
    <button
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), borderLeftColor: courseColor(assignment.courseId, courses) }}
      {...listeners}
      {...attributes}
      type="button"
      onPointerMoveCapture={(event) => {
        if (!event.buttons || !pointerStart.current) return
        if (Math.hypot(event.clientX - pointerStart.current.x, event.clientY - pointerStart.current.y) >= 6) dragged.current = true
      }}
      onPointerDownCapture={(event) => {
        pointerStart.current = { x: event.clientX, y: event.clientY }
        dragged.current = false
      }}
      onClick={() => {
        if (isDragging || dragged.current) {
          dragged.current = false
          pointerStart.current = null
          return
        }
        pointerStart.current = null
        onEdit(assignment)
      }}
      onKeyDown={(event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return
        event.preventDefault()
        event.stopPropagation()
        onEdit(assignment)
      }}
      className={cn('w-full rounded-lg border border-border border-l-4 bg-card p-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring', isDragging && 'z-20 opacity-70 shadow-xl')}
    >
      <span className="block text-xs font-bold">{assignment.title}</span>
      {(showCourseLabel || assignment.weight != null) && (
        <span className="mt-1 block text-[11px] text-muted-foreground" data-assignment-course={showCourseLabel ? '' : undefined}>
          {showCourseLabel ? courseLabel(assignment.courseId, courses) : ''}{showCourseLabel && assignment.weight != null ? ' · ' : ''}{assignment.weight != null ? `${assignment.weight}%` : ''}
        </span>
      )}
    </button>
  )
}

function AssignmentCalendar({
  assignments,
  courses,
  showCourseLabel,
  cursor,
  selectedDay,
  onCursor,
  onSelectDay,
  onEdit,
  onAdd,
}: {
  assignments: ClassAssignment[]
  courses: Course[]
  showCourseLabel: boolean
  cursor: Date
  selectedDay: Date
  onCursor: (date: Date) => void
  onSelectDay: (date: Date) => void
  onEdit: (assignment: ClassAssignment) => void
  onAdd: () => void
}) {
  const windowStart = startOfWeek(cursor)
  const days = Array.from({ length: 28 }, (_, index) => addDays(windowStart, index))
  const weeks = Array.from({ length: 4 }, (_, week) => days.slice(week * 7, (week + 1) * 7))
  const windowEnd = days[days.length - 1]
  const selected = assignments.filter((item) => item.dueDate?.slice(0, 10) === isoDate(selectedDay))
  const rangeLabel = windowStart.getFullYear() === windowEnd.getFullYear()
    ? `${windowStart.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} – ${windowEnd.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`
    : `${windowStart.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} – ${windowEnd.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`
  function shiftWindow(daysToMove: number) {
    onCursor(addDays(windowStart, daysToMove))
    onSelectDay(addDays(selectedDay, daysToMove))
  }

  return (
    <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_20rem]">
      <section className="card-soft min-w-0 overflow-hidden rounded-2xl border border-border bg-card p-3">
        <div className="mb-3 flex items-center justify-between gap-3 px-1">
          <Button variant="ghost" size="icon" onClick={() => shiftWindow(-28)} aria-label="Previous four weeks">
            <ChevronLeft className="size-4" />
          </Button>
          <p className="calendar-window-caption text-center text-sm font-semibold" aria-live="polite">{rangeLabel}</p>
          <Button variant="ghost" size="icon" onClick={() => shiftWindow(28)} aria-label="Next four weeks">
            <ChevronRight className="size-4" />
          </Button>
        </div>
        <div role="grid" aria-label={`Assignments from ${rangeLabel}`} className="grid w-full max-w-full gap-1">
          <div role="row" className="grid h-8 grid-cols-7">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
              <span key={day} role="columnheader" className="text-center text-xs font-medium text-muted-foreground">{day}</span>
            ))}
          </div>
          {weeks.map((week) => (
            <div key={isoDate(week[0])} role="row" data-calendar-week className="grid h-36 grid-cols-7 gap-1 sm:h-40">
                {week.map((day) => {
                  const items = assignments.filter((item) => item.dueDate?.slice(0, 10) === isoDate(day))
                  const total = items.reduce((sum, item) => sum + (item.weight ?? 0), 0)
                  const isSelected = isoDate(day) === isoDate(selectedDay)
                  const isToday = isoDate(day) === isoDate(new Date())
                  return (
                    <button
                      key={isoDate(day)}
                      type="button"
                      role="gridcell"
                      aria-selected={isSelected}
                      aria-label={day.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                      aria-current={isToday ? 'date' : undefined}
                      data-calendar-cell-surface="clear"
                      data-day={day.toLocaleDateString()}
                      onClick={() => onSelectDay(day)}
                      className={cn(
                        'flex h-full min-w-0 flex-col items-stretch justify-start gap-1 overflow-hidden rounded-lg border border-border bg-muted p-1.5 text-left transition-colors',
                        'hover:border-primary/45 hover:bg-accent/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring',
                        isToday && !isSelected && 'border-primary/55',
                        isSelected && 'border-primary bg-primary text-primary-foreground hover:bg-primary/90',
                        total > 30 && !isSelected && 'bg-destructive/10',
                      )}
                    >
                      <span className="self-start text-xs font-bold tabular-nums">{day.getDate()}</span>
                      {items.slice(0, 3).map((item) => (
                        <span
                          key={item.id}
                          className={cn('block w-full truncate rounded bg-background/55 px-1 py-0.5 text-[10px] font-semibold', isSelected && 'bg-primary-foreground/15')}
                          style={{ borderLeft: `3px solid ${courseColor(item.courseId, courses)}` }}
                        >
                          {item.title}
                        </span>
                      ))}
                      {items.length > 3 && <span className={cn('block text-[10px] text-muted-foreground', isSelected && 'text-primary-foreground/80')}>+{items.length - 3} more</span>}
                    </button>
                  )
                })}
            </div>
          ))}
        </div>
      </section>
      <aside className="rounded-2xl border border-border bg-muted p-4">
        <p className="font-display text-lg font-extrabold">{selectedDay.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</p>
        <div className="mt-3 space-y-2">
          {selected.map((assignment) => (
            <button key={assignment.id} type="button" onClick={() => onEdit(assignment)} className="w-full rounded-xl border border-border bg-card p-3 text-left hover:border-primary/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <span className="block font-bold">{assignment.title}</span>
              <span className="mt-1 block text-xs text-muted-foreground">
                {showCourseLabel && <span data-assignment-course>{courseLabel(assignment.courseId, courses)} · </span>}{assignment.type}
              </span>
            </button>
          ))}
          {!selected.length && <p className="py-8 text-center text-sm text-muted-foreground">Nothing due this day.</p>}
        </div>
        <Button variant="outline" className="mt-3 w-full" onClick={onAdd}><Plus className="size-4" /> Add assignment</Button>
      </aside>
      <button type="button" onClick={onAdd} className="flex min-h-14 items-center justify-center gap-2 rounded-2xl border border-dashed border-primary/45 bg-primary/5 font-display font-extrabold text-primary hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring xl:col-span-2">
        <Plus className="size-4" /> Add an assignment, exam, or important date…
      </button>
    </div>
  )
}

function ProjectedWorkload({
  assignments,
  courses,
  collapsed,
  onToggle,
}: {
  assignments: ClassAssignment[]
  courses: Course[]
  collapsed: boolean
  onToggle: () => void
}) {
  const start = startOfWeek(new Date())
  const weeks = Array.from({ length: 6 }, (_, index) => {
    const weekStart = addDays(start, index * 7)
    const weekEnd = addDays(weekStart, 7)
    const items = assignments.filter((item) => {
      const due = localDate(item.dueDate)
      return due && !COMPLETED.has(item.status) && due >= weekStart && due < weekEnd && item.weight != null
    })
    const byCourse = courses.map((course) => ({
      course,
      total: items.filter((item) => item.courseId === course.id).reduce((sum, item) => sum + (item.weight ?? 0), 0),
    })).filter((item) => item.total > 0)
    return { weekStart, byCourse, total: byCourse.reduce((sum, item) => sum + item.total, 0) }
  })
  const weighted = assignments.filter((item) => item.weight != null && !COMPLETED.has(item.status))
  const relevantCourseIds = new Set(assignments.map((item) => item.courseId))
  const relevantCourses = courses.filter((course) => relevantCourseIds.has(course.id))
  const heavy = weeks.filter((week) => week.total > 30)
  const recommendation = weighted.length === 0
    ? 'Not enough graded work yet.'
    : heavy.length >= 2
      ? `${heavy.length} heavy weeks are ahead. Start the largest later assignment during the lightest week.`
      : heavy.length === 1
        ? `One heavy week is ahead around ${heavy[0].weekStart.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}. Start its largest item early.`
        : 'Your weighted deadlines are currently spread without a heavy week.'

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-muted">
      <button type="button" onClick={onToggle} className="flex w-full items-center gap-2 px-4 py-3 text-left hover:bg-muted/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring" aria-expanded={!collapsed}>
        <ChevronDown className={cn('size-4 text-muted-foreground transition-transform motion-reduce:transition-none', collapsed && '-rotate-90')} />
        <span className="font-display text-lg font-extrabold">Projected workload</span>
        <span className="ml-auto text-xs font-semibold text-muted-foreground">Next 6 weeks</span>
      </button>
      {!collapsed && (
        <div className="space-y-4 border-t border-border p-4">
          {weeks.map((week) => (
            <div key={isoDate(week.weekStart)} className="grid items-center gap-2 sm:grid-cols-[7rem_4rem_1fr_3rem]">
              <span className="text-sm font-bold tabular-nums">{week.weekStart === start ? 'This week' : week.weekStart.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
              <Badge variant={workloadLabel(week.total) === 'Heavy' ? 'danger' : workloadLabel(week.total) === 'Busy' ? 'warning' : workloadLabel(week.total) === 'Light' ? 'success' : 'muted'}>{workloadLabel(week.total)}</Badge>
              <div className="relative h-7 overflow-hidden rounded-full border border-border bg-muted">
                <div className="flex h-full">
                  {week.byCourse.map(({ course, total }) => (
                    <div
                      key={course.id}
                      className="grid min-w-fit place-items-center px-2 text-[10px] font-extrabold text-slate-950"
                      style={{ width: `${Math.min(100, total)}%`, backgroundColor: courseColor(course.id, courses) }}
                    >
                      {course.code} {total}%
                    </div>
                  ))}
                </div>
                <Progress value={Math.min(100, week.total)} className="sr-only" aria-label={`${week.total}% of course grade due`} />
              </div>
              <span className="text-right text-sm font-extrabold tabular-nums">{week.total}%</span>
            </div>
          ))}
          <div className="flex flex-wrap gap-3 border-t border-border pt-3 text-xs font-semibold text-muted-foreground">
            {relevantCourses.map((course) => <span key={course.id} className="inline-flex items-center gap-1.5"><i className="size-2.5 rounded-full" style={{ backgroundColor: courseColor(course.id, courses) }} />{course.code}</span>)}
          </div>
          <PaceProjectionLine id="academics.assignments.workload" insufficientLabel={recommendation} />
        </div>
      )}
    </section>
  )
}

function AssignmentTable({
  assignments,
  courses,
  onPatch,
  onEdit,
  onDelete,
}: {
  assignments: ClassAssignment[]
  courses: Course[]
  onPatch: (id: string, key: string, value: unknown) => void
  onEdit: (assignment: ClassAssignment) => void
  onDelete: (id: string) => void
}) {
  const columns: ColumnDef[] = [
    { key: 'title', header: 'Assignment', type: 'text', width: '240px', validate: (value) => String(value ?? '').trim() ? undefined : 'Title is required.' },
    {
      key: 'courseId',
      header: 'Class',
      type: 'custom',
      width: '140px',
      render: ({ value, onChange }) => (
        <Select value={String(value ?? '')} onValueChange={onChange}>
          <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
          <SelectContent>{courses.map((course) => <SelectItem key={course.id} value={course.id}>{course.code}</SelectItem>)}</SelectContent>
        </Select>
      ),
    },
    { key: 'type', header: 'Type', type: 'select', width: '120px', options: ASSIGNMENT_TYPES },
    { key: 'dueDate', header: 'Due', type: 'date', width: '140px' },
    { key: 'status', header: 'Status', type: 'select', width: '130px', options: ['not-started', 'in-progress', 'submitted', 'graded', 'dropped'] },
    { key: 'weight', header: 'Weight %', type: 'number', width: '100px', align: 'right' },
    { key: 'pointsPossible', header: 'Points', type: 'number', width: '90px', align: 'right' },
    { key: 'important', header: 'Important', type: 'toggle', width: '100px', toggleLabels: ['No', 'Starred'] },
  ]
  return (
    <TrackerTable
      rows={assignments}
      columns={columns}
      listId="academics.assignments.table"
      onPatch={onPatch}
      onOpen={(id) => {
        const assignment = assignments.find((item) => item.id === id)
        if (assignment) onEdit(assignment)
      }}
      onDelete={onDelete}
      reorder={false}
    />
  )
}
