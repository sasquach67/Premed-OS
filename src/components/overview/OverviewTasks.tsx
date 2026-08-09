import { AnimatePresence, m, Reorder, useReducedMotion } from 'motion/react'
import {
  CalendarDays,
  Check,
  Copy,
  Ellipsis,
  GripVertical,
  NotebookPen,
  Search,
  Star,
  Tag,
  Trash2,
} from 'lucide-react'
import { useMemo, useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useToast } from '@/components/common/useToast'
import { MascotNote } from '@/components/common/MascotNote'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { DateField } from '@/components/common/DateField'
import { CenterPeek, type RecordOpenMode } from '@/components/common/CenterPeek'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Toggle } from '@/components/ui/toggle'
import { daysUntil, fmtRelative } from '@/lib/date'
import { uid } from '@/lib/id'
import { MOTION_TRANSITION } from '@/lib/motion'
import { overviewTasks, type OverviewTaskTab } from '@/lib/overview'
import type { CollectionRecord, TaskItem } from '@/lib/types'
import { useStore } from '@/store/store'
import { cn } from '@/lib/utils'

const TABS: Array<{ value: OverviewTaskTab; label: string }> = [
  { value: 'now', label: 'Now' },
  { value: 'soon', label: 'Soon' },
  { value: 'done', label: 'Done' },
]
const CATEGORIES = ['Personal', 'Application', 'Advising', 'MCAT', 'Academics', 'Clinical', 'Letters', 'Essays']

export function OverviewTasks({ expanded = false }: { expanded?: boolean } = {}) {
  const tasks = useStore((state) => state.tasks)
  const addItem = useStore((state) => state.addItem)
  const update = useStore((state) => state.update)
  const logActivity = useStore((state) => state.logActivity)
  const [tab, setTab] = useState<OverviewTaskTab>('now')
  const [quickTitle, setQuickTitle] = useState('')
  /* The expansion adds room to filter and search and NOTHING else — any
   * behaviour here that the widget lacks is a defect (03-overview §6.4). */
  const [query, setQuery] = useState('')
  const reduceMotion = useReducedMotion()

  const counts = useMemo(() => ({
    now: overviewTasks(tasks, 'now').length,
    soon: overviewTasks(tasks, 'soon').length,
    done: overviewTasks(tasks, 'done').length,
  }), [tasks])
  const visible = useMemo(() => {
    const forTab = overviewTasks(tasks, tab)
    const needle = query.trim().toLowerCase()
    if (!needle) return forTab
    return forTab.filter((task) => `${task.title} ${task.type} ${task.notes ?? ''}`.toLowerCase().includes(needle))
  }, [query, tab, tasks])
  const important = visible.filter((task) => task.important)
  const everythingElse = visible.filter((task) => !task.important)
  const overdue = visible.filter((task) => {
    const days = daysUntil(task.deadline)
    return days != null && days < 0 && task.progress !== 'Finished'
  }).length

  function quickAdd(event: FormEvent) {
    event.preventDefault()
    const title = quickTitle.trim()
    if (!title) return
    addItem('tasks', {
      id: uid(),
      title,
      type: 'Personal',
      progress: 'Not started',
      kanban: 'todo',
      archived: false,
      milestone: false,
      horizon: tab === 'soon' ? 'soon' : 'now',
      important: false,
      order: visible.length,
    })
    logActivity('home', `Added task: ${title}`)
    setQuickTitle('')
    if (tab === 'done') setTab('now')
  }

  function applyOrder(next: CollectionRecord<TaskItem>[]) {
    update((draft) => {
      const rank = new Map(next.map((task, index) => [task.id, index]))
      for (const task of draft.tasks) {
        const order = rank.get(task.id)
        if (order != null) task.order = order
      }
    })
  }

  return (
    <Card className={cn('h-full', expanded ? 'min-h-[70vh]' : 'min-h-[34rem]')} role="region" aria-labelledby="overview-tasks-heading">
      <CardHeader className="flex-row items-start justify-between gap-3">
        <div>
          <CardTitle id="overview-tasks-heading" className="text-lg">Tasks</CardTitle>
          <p className="mt-1 text-xs font-semibold text-muted-foreground">
            {important.length} important{overdue ? ` · ${overdue} overdue` : ''}
          </p>
        </div>
        {!expanded && <Button asChild size="sm" variant="outline"><Link to="/overview/tasks">Expand</Link></Button>}
      </CardHeader>
      <CardContent className="flex h-[calc(100%-5rem)] flex-col">
        <Tabs value={tab} onValueChange={(value) => setTab(value as OverviewTaskTab)}>
          <TabsList className="grid w-full grid-cols-3">
            {TABS.map((item) => (
              <TabsTrigger key={item.value} value={item.value}>
                {item.label}
                <Badge variant="muted" className="px-1.5 py-0 text-[10px]">{counts[item.value]}</Badge>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {expanded && (
          <div className="relative mt-3">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search titles, categories, notes…"
              aria-label="Search tasks"
              className="pl-9"
            />
          </div>
        )}
        <div className="relative mt-4 min-h-0 flex-1">
          <AnimatePresence initial={false} mode="popLayout">
            <m.div
              key={tab}
              initial={reduceMotion ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -4 }}
              transition={reduceMotion ? MOTION_TRANSITION.instant : MOTION_TRANSITION.standard}
              className="w-full"
            >
              {!visible.length ? (
                <MascotNote
                  variant="empty-state"
                  priority={20}
                  title={tab === 'done' ? 'Nothing completed yet' : `Nothing in ${tab}`}
                  actions={tab === 'done'
                    ? null
                    : <Button type="button" size="sm" onClick={() => document.getElementById('overview-quick-task')?.focus()}>Add a task</Button>}
                  className="min-h-56 items-center"
                >
                  {tab === 'done' ? 'Finish a task and it will collect here.' : 'Add a title below to get started.'}
                </MascotNote>
              ) : (
                <Reorder.Group axis="y" values={visible} onReorder={applyOrder} className="space-y-3">
                  <TaskGroup label="Important" tasks={important} tab={tab} reduceMotion={Boolean(reduceMotion)} expanded={expanded} />
                  <TaskGroup label={important.length ? 'Everything else' : undefined} tasks={everythingElse} tab={tab} reduceMotion={Boolean(reduceMotion)} expanded={expanded} />
                </Reorder.Group>
              )}
            </m.div>
          </AnimatePresence>
        </div>

        {tab !== 'done' && (
          <form onSubmit={quickAdd} className="mt-4 flex items-center gap-2 border-t border-dashed border-border pt-3">
            <Input
              id="overview-quick-task"
              value={quickTitle}
              onChange={(event) => setQuickTitle(event.target.value)}
              placeholder="Quick add — type and hit enter…"
              aria-label="Quick-add a general task"
              className="h-9 border-0 bg-transparent px-1 shadow-none focus-visible:ring-0"
            />
            <Button type="submit" size="sm" variant="ghost" disabled={!quickTitle.trim()}>Add</Button>
          </form>
        )}
      </CardContent>
    </Card>
  )
}

function TaskGroup({
  label,
  tasks,
  tab,
  reduceMotion,
  expanded,
}: {
  label?: string
  tasks: CollectionRecord<TaskItem>[]
  tab: OverviewTaskTab
  reduceMotion: boolean
  expanded: boolean
}) {
  const cap = expanded ? tasks.length : 7
  if (!tasks.length) return null
  return (
    <section aria-label={label}>
      {label && (
        <div className="mb-1 flex items-center gap-2 px-1 text-[11px] font-extrabold uppercase tracking-[0.12em] text-muted-foreground">
          {label === 'Important' && <Star className="size-3.5 fill-warning text-warning" />}
          <span>{label}</span>
          <span className="h-px flex-1 bg-border" />
        </div>
      )}
      {tasks.slice(0, cap).map((task) => (
        <TaskRow key={task.id} task={task} tab={tab} reduceMotion={reduceMotion} />
      ))}
      {tasks.length > cap && (
        <Link to="/overview/tasks" className="mt-2 block px-2 text-xs font-bold text-primary">
          +{tasks.length - cap} more →
        </Link>
      )}
    </section>
  )
}

function TaskRow({
  task,
  tab,
  reduceMotion,
}: {
  task: CollectionRecord<TaskItem>
  tab: OverviewTaskTab
  reduceMotion: boolean
}) {
  const toast = useToast()
  const patchItem = useStore((state) => state.patchItem)
  const addItem = useStore((state) => state.addItem)
  const softDeleteItems = useStore((state) => state.softDeleteItems)
  const undoRecovery = useStore((state) => state.undoRecovery)
  const logActivity = useStore((state) => state.logActivity)
  const rowRef = useRef<HTMLLIElement>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailMode, setDetailMode] = useState<RecordOpenMode>('peek')
  const days = daysUntil(task.deadline)

  function complete() {
    const previous = { progress: task.progress, kanban: task.kanban, archived: task.archived }
    patchItem('tasks', task.id, { progress: 'Finished', kanban: 'done', archived: false })
    logActivity('home', `Finished: ${task.title}`)
    toast({
      title: 'Task completed',
      description: task.title,
      tone: 'success',
      onUndo: () => patchItem('tasks', task.id, previous),
    })
  }

  function reopen() {
    patchItem('tasks', task.id, { progress: 'Not started', kanban: 'todo', archived: false })
    logActivity('home', `Reopened: ${task.title}`)
  }

  function duplicate() {
    addItem('tasks', {
      ...task,
      id: uid(),
      title: `${task.title} copy`,
      progress: 'Not started',
      kanban: 'todo',
      archived: false,
      order: task.order + 1,
    })
  }

  function remove() {
    const recoveryId = softDeleteItems('tasks', [task.id], `Deleted ${task.title}`)
    toast({
      title: 'Task moved to Trash',
      description: task.title,
      onUndo: recoveryId ? () => undoRecovery(recoveryId) : undefined,
    })
  }

  /* The menu item is a shortcut to the row's own date control, never a
   * separate path — 01 §4b: the context menu must not contain an action with
   * no visible equivalent. */
  function openDatePicker() {
    const trigger = rowRef.current?.querySelector<HTMLButtonElement>('[aria-label^="Due "],[aria-label^="Set a due date"]')
    trigger?.click()
  }

  function setCategory(category: string) {
    patchItem('tasks', task.id, { type: category })
  }

  const row = (
    <Reorder.Item
      ref={rowRef}
      value={task}
      layout={reduceMotion ? undefined : 'position'}
      transition={reduceMotion ? MOTION_TRANSITION.instant : MOTION_TRANSITION.standard}
      className={cn(
        'group mb-1 flex min-w-0 items-center gap-2 rounded-xl border border-transparent px-2 py-2 transition-colors hover:border-border hover:bg-muted/45',
        task.important && 'border-l-warning bg-warning/5 border-l-2',
      )}
    >
      <button type="button" className="cursor-grab touch-none rounded-md p-1 text-muted-foreground active:cursor-grabbing" aria-label={`Reorder ${task.title}`}>
        <GripVertical className="size-4" />
      </button>
      <Checkbox
        checked={task.progress === 'Finished'}
        onCheckedChange={(checked) => checked ? complete() : reopen()}
        aria-label={task.progress === 'Finished' ? `${task.title} completed` : `Complete ${task.title}`}
      />
      <TaskTitle task={task} onRename={(title) => patchItem('tasks', task.id, { title })} onOpen={() => setDetailOpen(true)} />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button type="button" aria-label={`Category: ${task.type}. Change it`} className="hidden sm:block">
            <Badge variant="muted" className="max-w-24 truncate">{task.type}</Badge>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Category</DropdownMenuLabel>
          {CATEGORIES.map((category) => <DropdownMenuItem key={category} onClick={() => setCategory(category)}><Tag />{category}</DropdownMenuItem>)}
        </DropdownMenuContent>
      </DropdownMenu>
      {/* The date badge is the visible equivalent the context menu's "Set due
       *  date" requires (01 §4b). It renders even with no date set, or a task
       *  without one could never get a first date without the menu. */}
      <DateField
        value={task.deadline ?? ''}
        onChange={(iso) => patchItem('tasks', task.id, { deadline: iso || undefined })}
        ariaLabel={task.deadline ? `Due ${fmtRelative(task.deadline)}. Change it` : `Set a due date for ${task.title}`}
        align="end"
        className={cn(
          // DateField's trigger is w-full by default; unconstrained it eats the
          // row and squeezes the title to nothing.
          'h-7 w-auto shrink-0 rounded-full border-0 px-2 text-xs font-bold shadow-none',
          task.deadline
            ? days != null && days < 0 ? 'bg-destructive/12 text-destructive' : days != null && days <= 3 ? 'bg-warning/15 text-warning-foreground' : 'bg-muted text-muted-foreground'
            : 'bg-transparent text-muted-foreground opacity-0 group-hover:opacity-100 group-focus-within:opacity-100',
        )}
      />
      <Toggle
        pressed={Boolean(task.important)}
        onPressedChange={(pressed) => patchItem('tasks', task.id, { important: pressed })}
        size="sm"
        aria-label={task.important ? `Remove important from ${task.title}` : `Mark ${task.title} important`}
      >
        <Star className={cn('size-4', task.important && 'fill-warning text-warning')} />
      </Toggle>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button type="button" size="icon" className="size-8" variant="ghost" aria-label={`More actions for ${task.title}`}>
            <Ellipsis className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => patchItem('tasks', task.id, { important: !task.important })}><Star />{task.important ? 'Remove important' : 'Mark important'}</DropdownMenuItem>
          <DropdownMenuItem onClick={openDatePicker}><CalendarDays />Set due date</DropdownMenuItem>
          <DropdownMenuItem onClick={() => patchItem('tasks', task.id, { horizon: tab === 'soon' ? 'now' : 'soon' })}>
            <Check />Move to {tab === 'soon' ? 'Now' : 'Soon'}
          </DropdownMenuItem>
          <DropdownMenuLabel>Category</DropdownMenuLabel>
          {CATEGORIES.map((category) => <DropdownMenuItem key={category} onClick={() => setCategory(category)}><Tag />{category}</DropdownMenuItem>)}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={duplicate}><Copy />Duplicate</DropdownMenuItem>
          <DropdownMenuItem className="text-destructive" onClick={remove}><Trash2 />Delete</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </Reorder.Item>
  )

  return (
    <>
    <ContextMenu>
      <ContextMenuTrigger asChild>{row}</ContextMenuTrigger>
      <ContextMenuContent className="min-w-52">
        <ContextMenuCheckboxItem checked={Boolean(task.important)} onCheckedChange={(checked) => patchItem('tasks', task.id, { important: checked === true })}>
          Mark important
          <ContextMenuShortcut>⌘I</ContextMenuShortcut>
        </ContextMenuCheckboxItem>
        <ContextMenuSub>
          <ContextMenuSubTrigger><Tag />Tag</ContextMenuSubTrigger>
          <ContextMenuSubContent>
            {CATEGORIES.map((category) => <ContextMenuItem key={category} onSelect={() => setCategory(category)}>{category}</ContextMenuItem>)}
          </ContextMenuSubContent>
        </ContextMenuSub>
        <ContextMenuItem onSelect={openDatePicker}><CalendarDays />Set due date</ContextMenuItem>
        <ContextMenuItem onSelect={() => patchItem('tasks', task.id, { horizon: tab === 'soon' ? 'now' : 'soon' })}>
          <Check />Move to {tab === 'soon' ? 'Now' : 'Soon'}
        </ContextMenuItem>
        <ContextMenuItem onSelect={duplicate}><Copy />Duplicate</ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem variant="destructive" onSelect={remove}><Trash2 />Delete</ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
    {/* notes and fileUrl cannot fit a row at either size, so they open in the
     *  shared one-record peek (01 §2.1) — reachable identically from the
     *  widget and from /overview/tasks, so neither size has a capability the
     *  other lacks (03-overview §6.4). */}
    <CenterPeek
      open={detailOpen}
      mode={detailMode}
      label={task.title || 'Task'}
      onOpenChange={setDetailOpen}
      onModeChange={setDetailMode}
    >
      <TaskDetail task={task} onPatch={(patch) => patchItem('tasks', task.id, patch)} />
    </CenterPeek>
    </>
  )
}

/** Click to rename in place. The title was previously set once at quick-add
 *  and editable nowhere in the app. */
function TaskTitle({ task, onRename, onOpen }: { task: CollectionRecord<TaskItem>; onRename: (title: string) => void; onOpen: () => void }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(task.title)

  function commit() {
    const next = draft.trim()
    setEditing(false)
    if (next && next !== task.title) onRename(next)
    else setDraft(task.title)
  }

  if (editing) {
    return (
      <Input
        autoFocus
        value={draft}
        aria-label={`Rename ${task.title}`}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === 'Enter') commit()
          if (event.key === 'Escape') { setDraft(task.title); setEditing(false) }
        }}
        className="h-7 min-w-0 flex-1 px-2 text-sm font-bold"
      />
    )
  }

  return (
    <span className="flex min-w-0 flex-1 items-center gap-1">
      <button
        type="button"
        onClick={() => { setDraft(task.title); setEditing(true) }}
        className={cn('min-w-0 flex-1 truncate rounded px-1 text-left text-sm font-bold hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring', task.progress === 'Finished' && 'text-muted-foreground line-through')}
      >
        {task.title || 'Untitled task'}
      </button>
      <button
        type="button"
        onClick={onOpen}
        aria-label={`Open details for ${task.title}`}
        className="shrink-0 rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:text-foreground focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring group-hover:opacity-100"
      >
        <NotebookPen className="size-3.5" />
      </button>
    </span>
  )
}

/** The only surface in the app for a task's notes and attachment. */
function TaskDetail({ task, onPatch }: { task: CollectionRecord<TaskItem>; onPatch: (patch: Partial<TaskItem>) => void }) {
  return (
    <div className="space-y-4 p-5 md:p-7">
      <div>
        <Label htmlFor={`task-title-${task.id}`} className="mb-1 block text-xs font-extrabold uppercase tracking-wide text-muted-foreground">Title</Label>
        <Input id={`task-title-${task.id}`} value={task.title} onChange={(event) => onPatch({ title: event.target.value })} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label className="mb-1 block text-xs font-extrabold uppercase tracking-wide text-muted-foreground">Due</Label>
          <DateField value={task.deadline ?? ''} onChange={(iso) => onPatch({ deadline: iso || undefined })} ariaLabel="Due date" />
        </div>
        <div>
          <Label className="mb-1 block text-xs font-extrabold uppercase tracking-wide text-muted-foreground">Category</Label>
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => onPatch({ type: category })}
                className={cn('rounded-full border px-2.5 py-1 text-xs font-bold transition', task.type === category ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:bg-muted')}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div>
        <Label htmlFor={`task-notes-${task.id}`} className="mb-1 block text-xs font-extrabold uppercase tracking-wide text-muted-foreground">Notes</Label>
        <Textarea id={`task-notes-${task.id}`} value={task.notes ?? ''} onChange={(event) => onPatch({ notes: event.target.value })} placeholder="Anything that does not fit the title…" className="min-h-28" />
      </div>
      <div>
        <Label htmlFor={`task-file-${task.id}`} className="mb-1 block text-xs font-extrabold uppercase tracking-wide text-muted-foreground">Attachment</Label>
        <Input id={`task-file-${task.id}`} value={task.fileUrl ?? ''} onChange={(event) => onPatch({ fileUrl: event.target.value })} placeholder="Paste a link" />
        {task.fileUrl && <a href={task.fileUrl} target="_blank" rel="noreferrer" className="mt-1 inline-block text-xs font-bold text-primary">Open attachment →</a>}
      </div>
    </div>
  )
}
