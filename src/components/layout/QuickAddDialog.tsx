import { useMemo, useState, type FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Brain, CalendarCheck, Clock3, FileText, GraduationCap, Lightbulb,
  ListTodo, Plus, School, Stethoscope,
} from 'lucide-react'
import { CreateExperienceDialog } from '@/components/common/CreateExperienceDialog'
import { DateField } from '@/components/common/DateField'
import { useToast } from '@/components/common/useToast'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { uid } from '@/lib/id'
import type { ExperienceCategory } from '@/lib/types'
import { useStore } from '@/store/store'
import { useShellActions } from './shellActions'
import type { QuickAddKind } from './shellActions'

const TYPES = [
  ['task', 'Task', ListTodo],
  ['course', 'Course', GraduationCap],
  ['assignment', 'Assignment', CalendarCheck],
  ['hours', 'Hour log', Clock3],
  ['experience', 'Experience', Stethoscope],
  ['mistake', 'MCAT mistake', Brain],
  ['school', 'School', School],
  ['story', 'Story', Lightbulb],
  ['note', 'Note', FileText],
] as const

function contextKind(pathname: string): QuickAddKind {
  if (pathname.startsWith('/academics')) return 'assignment'
  if (pathname.startsWith('/mcat')) return 'mistake'
  if (pathname.startsWith('/schools')) return 'school'
  if (pathname.startsWith('/essays')) return 'story'
  if (/^\/(clinical|volunteering|shadowing|research|ecs)/.test(pathname)) return 'experience'
  return 'task'
}

function categoryForPath(pathname: string): ExperienceCategory {
  const first = pathname.split('/').filter(Boolean)[0]
  return first === 'volunteering' || first === 'shadowing' || first === 'research' || first === 'clinical'
    ? first
    : 'leadership'
}

export function QuickAddDialog() {
  const { quickAddOpen, quickAddKind, closeQuickAdd } = useShellActions()
  const location = useLocation()
  const navigate = useNavigate()
  const addItem = useStore((state) => state.addItem)
  const update = useStore((state) => state.update)
  const undoRecovery = useStore((state) => state.undoRecovery)
  const data = useStore()
  const toast = useToast()
  const [kind, setKind] = useState<QuickAddKind>()
  const [choosing, setChoosing] = useState(false)
  const [title, setTitle] = useState('')
  const [detail, setDetail] = useState('')
  const [date, setDate] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState<ExperienceCategory>('clinical')
  const activeKind = choosing ? kind : (kind ?? quickAddKind ?? contextKind(location.pathname))
  const activeCategory = activeKind === 'experience' ? categoryForPath(location.pathname) : category

  const route = useMemo(() => ({
    task: '/overview/tasks', course: '/academics', assignment: '/academics', hours: `/${category === 'leadership' ? 'ecs' : category}`,
    experience: `/${category === 'leadership' ? 'ecs' : category}`, mistake: '/mcat', school: '/schools', story: '/essays', note: '/',
  })[activeKind ?? 'task'], [activeKind, category])

  function reset() {
    setTitle(''); setDetail(''); setDate(''); setAmount(''); setKind(undefined); setChoosing(false)
  }

  function created(label: string, recoveryId?: string, onUndo?: () => void, openRoute = route) {
    toast({
      title: `${label} created`,
      description: 'Saved locally. Stay here or open it now.',
      tone: 'success',
      onOpen: () => navigate(openRoute),
      onUndo: recoveryId ? () => undoRecovery(recoveryId) : onUndo,
    })
  }

  function submit(event: FormEvent) {
    event.preventDefault()
    if (!activeKind || !title.trim()) return
    const id = uid()
    const beforeRecovery = data.meta.recoveryStack[0]?.id
    const order = (key: 'tasks' | 'courses' | 'experiences' | 'schools' | 'stories' | 'notePages') => data[key].length
    if (activeKind === 'task') {
      addItem('tasks', { id, title: title.trim(), type: detail.trim() || 'Task', deadline: date || undefined, progress: 'Not started', kanban: 'todo', archived: false, horizon: 'now', order: order('tasks') })
    } else if (activeKind === 'course') {
      addItem('courses', { id, term: date || 'Planned', code: title.trim(), title: detail.trim() || 'Untitled course', credits: Number(amount) || 3, grade: '', bcpm: false, status: 'planned', inResidence: true, satisfies: [], order: order('courses') })
    } else if (activeKind === 'hours') {
      addItem('experiences', { id, category, org: title.trim(), role: detail.trim() || 'Hour log', startDate: date || undefined, hours: Number(amount) || 0, description: '', status: 'active', tags: [], order: order('experiences') })
    } else if (activeKind === 'school') {
      addItem('schools', { id, name: title.trim(), location: detail.trim() || undefined, type: 'MD', category: 'undecided', status: 'researching', order: order('schools') })
    } else if (activeKind === 'story') {
      addItem('stories', { id, title: title.trim(), prompt: detail.trim() || 'What did this experience teach me?', commentary: '', tags: [], order: order('stories') })
    } else if (activeKind === 'note') {
      addItem('notePages', { id, title: title.trim(), body: detail, pillar: location.pathname.split('/').filter(Boolean)[0] || 'home', updatedAt: Date.now(), order: order('notePages') })
    } else if (activeKind === 'assignment') {
      const courseId = data.academics.classCenter.workspaces[0]?.courseId
      const row = { id, courseId: courseId ?? '', title: title.trim(), type: 'homework' as const, dueDate: date || undefined, status: 'not-started' as const, linkedTopicIds: [], linkedFileIds: [], notes: detail, createdAt: Date.now(), updatedAt: Date.now(), order: data.academics.classCenter.assignments.length }
      update((draft) => { draft.academics.classCenter.assignments.push(row) })
      created('Assignment', undefined, () => update((draft) => { draft.academics.classCenter.assignments = draft.academics.classCenter.assignments.filter((item) => item.id !== id) }))
    } else if (activeKind === 'mistake') {
      const row = { id, date: date || undefined, section: detail.trim() || 'C/P', topic: title.trim(), whyMissed: '', fix: '', resolved: false, order: data.mcat.errorLog.length }
      update((draft) => { draft.mcat.errorLog.push(row) })
      created('MCAT mistake', undefined, () => update((draft) => { draft.mcat.errorLog = draft.mcat.errorLog.filter((item) => item.id !== id) }))
    }
    if (activeKind !== 'assignment' && activeKind !== 'mistake') {
      const recoveryId = useStore.getState().meta.recoveryStack[0]?.id
      created(TYPES.find(([value]) => value === activeKind)?.[1] ?? 'Record', recoveryId !== beforeRecovery ? recoveryId : undefined)
    }
    closeQuickAdd(); reset()
  }

  return (
    <>
      <Dialog open={quickAddOpen && activeKind !== 'experience'} onOpenChange={(open) => { if (!open) { closeQuickAdd(); reset() } }}>
        <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Plus className="size-5 text-primary" /> Quick Add</DialogTitle>
            <DialogDescription>Create a lightweight record now; add richer details from its page later.</DialogDescription>
          </DialogHeader>
          {!activeKind ? (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {TYPES.map(([value, label, Icon]) => (
                <button key={value} type="button" onClick={() => { setKind(value); setChoosing(false) }} className="flex min-h-20 flex-col items-start justify-between rounded-xl border border-border bg-card p-3 text-left text-sm font-bold hover:border-primary/40 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                  <Icon className="size-4 text-primary" /> {label}
                </button>
              ))}
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <div className="flex items-center justify-between rounded-xl bg-muted/50 px-3 py-2">
                <span className="text-sm font-bold">{TYPES.find(([value]) => value === activeKind)?.[1]}</span>
                <Button type="button" variant="ghost" size="sm" onClick={() => { setKind(undefined); setChoosing(true) }}>Change type</Button>
              </div>
              <div className="space-y-1.5"><Label htmlFor="quick-title">{activeKind === 'course' ? 'Course code' : activeKind === 'hours' ? 'Organization' : activeKind === 'mistake' ? 'Topic' : 'Title'}</Label><Input id="quick-title" autoFocus value={title} onChange={(event) => setTitle(event.target.value)} required /></div>
              {(activeKind === 'task' || activeKind === 'course' || activeKind === 'hours' || activeKind === 'school' || activeKind === 'story' || activeKind === 'note' || activeKind === 'assignment' || activeKind === 'mistake') && (
                <div className="space-y-1.5"><Label htmlFor="quick-detail">{activeKind === 'course' ? 'Course name' : activeKind === 'mistake' ? 'Section' : activeKind === 'hours' ? 'Role' : activeKind === 'note' ? 'Note' : 'Details'}</Label>{activeKind === 'note' ? <Textarea id="quick-detail" value={detail} onChange={(event) => setDetail(event.target.value)} /> : <Input id="quick-detail" value={detail} onChange={(event) => setDetail(event.target.value)} />}</div>
              )}
              {(activeKind === 'task' || activeKind === 'assignment' || activeKind === 'hours' || activeKind === 'mistake') && <div className="space-y-1.5"><Label>{activeKind === 'hours' ? 'Date' : 'Due date'}</Label><DateField value={date} onChange={setDate} ariaLabel={activeKind === 'hours' ? 'Date' : 'Due date'} /></div>}
              {(activeKind === 'course' || activeKind === 'hours') && <div className="space-y-1.5"><Label htmlFor="quick-amount">{activeKind === 'course' ? 'Credits' : 'Hours'}</Label><Input id="quick-amount" type="number" min="0" step="0.25" value={amount} onChange={(event) => setAmount(event.target.value)} /></div>}
              {activeKind === 'hours' && <div className="space-y-1.5"><Label>Experience type</Label><Select value={category} onValueChange={(value) => setCategory(value as ExperienceCategory)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{['clinical', 'volunteering', 'shadowing', 'research', 'leadership'].map((value) => <SelectItem key={value} value={value}>{value[0].toUpperCase() + value.slice(1)}</SelectItem>)}</SelectContent></Select></div>}
              <DialogFooter><Button type="button" variant="outline" onClick={() => { closeQuickAdd(); reset() }}>Cancel</Button><Button type="submit">Create</Button></DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
      <CreateExperienceDialog
        open={quickAddOpen && activeKind === 'experience'}
        category={activeCategory}
        onOpenChange={(open) => { if (!open) { closeQuickAdd(); reset() } }}
        onCreate={(patch) => {
          const id = uid()
          const before = useStore.getState().meta.recoveryStack[0]?.id
          addItem('experiences', { id, category: activeCategory, ...patch, hours: 0, description: '', status: 'active', tags: [], order: data.experiences.length })
          const recoveryId = useStore.getState().meta.recoveryStack[0]?.id
          created('Experience', recoveryId !== before ? recoveryId : undefined, undefined, `/${activeCategory === 'leadership' ? 'ecs' : activeCategory}`)
          closeQuickAdd()
          reset()
        }}
      />
    </>
  )
}
