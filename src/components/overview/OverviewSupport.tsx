import {
  Archive,
  Clock3,
  FileUp,
  Lightbulb,
  Link2,
  Plus,
  X,
} from 'lucide-react'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CenterPeek, type RecordOpenMode } from '@/components/common/CenterPeek'
import { MascotNote } from '@/components/common/MascotNote'
import { useToast } from '@/components/common/useToast'
import { McatSessionSetupDialog } from '@/components/mcat/McatSessionSetupDialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'
import { fmtTimeAgo } from '@/lib/date'
import { uid } from '@/lib/id'
import { totalsForCategory } from '@/lib/experienceHours'
import { gpaStats } from '@/lib/selectors'
import type { ActivityEvent, Goals, QuarterlyGoal, StoryEntry } from '@/lib/types'
import { useStore } from '@/store/store'

export function QuickAccess() {
  const mcat = useStore((state) => state.mcat)
  const nextMcat = mcat.schedule.find((item) => !item.done)

  return (
    <Card className="h-full" role="region" aria-labelledby="quick-access-heading">
      <CardHeader><CardTitle id="quick-access-heading">Quick access</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        {nextMcat && (
          <McatSessionSetupDialog
            triggerClassName="group flex w-full items-center gap-3 rounded-xl border border-border bg-muted px-3 py-2.5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/45 hover:bg-muted/65 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            trigger={(
              <>
                <span className="grid size-9 place-items-center rounded-xl bg-[var(--cat-mcat)] text-white"><Clock3 className="size-4" /></span>
                <span className="min-w-0"><span className="block text-sm font-extrabold">Start MCAT block</span><span className="block truncate text-xs text-muted-foreground">{nextMcat.focus}</span></span>
              </>
            )}
          />
        )}
        <button
          type="button"
          onClick={() => document.getElementById('quick-capture')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
          className="group flex w-full items-center gap-3 rounded-xl border border-border bg-muted px-3 py-2.5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/45 hover:bg-muted/65 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground"><Lightbulb className="size-4" /></span>
          <span><span className="block text-sm font-extrabold">Capture a thought</span><span className="block text-xs text-muted-foreground">Saves directly to Story Bank</span></span>
        </button>
      </CardContent>
    </Card>
  )
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(bytes < 10 * 1024 ? 1 : 0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(bytes < 10 * 1024 * 1024 ? 1 : 0)} MB`
}

function currentForTarget(target: keyof Goals, goals: Goals) {
  const state = useStore.getState()
  if (target === 'gpaTarget') return gpaStats(state.courses).cum
  if (target === 'mcatTarget') {
    const latest = [...state.mcat.attempts]
      .filter((attempt) => attempt.total != null)
      .sort((a, b) => String(b.date ?? '').localeCompare(String(a.date ?? '')) || b.order - a.order)[0]
    return latest?.total ?? 0
  }
  if (target === 'clinical') return totalsForCategory(state.experiences, state.experienceHourEntries, 'clinical').total
  if (target === 'volunteering') return totalsForCategory(state.experiences, state.experienceHourEntries, 'volunteering').total
  if (target === 'shadowing') return totalsForCategory(state.experiences, state.experienceHourEntries, 'shadowing').total
  if (target === 'research') return totalsForCategory(state.experiences, state.experienceHourEntries, 'research').total
  if (target === 'activities') return totalsForCategory(state.experiences, state.experienceHourEntries, 'leadership').total
  return goals[target]
}

function formatGoalValue(target: keyof Goals, value: number): string {
  return target === 'gpaTarget' ? value.toFixed(2) : String(Math.round(value))
}

function normalizedGoalKind(goal: QuarterlyGoal): 'check-off' | 'cumulative' | 'period' {
  return goal.kind === 'measured' ? 'cumulative' : goal.kind
}

function goalKindLabel(kind: ReturnType<typeof normalizedGoalKind>): string {
  if (kind === 'cumulative') return 'Cumulative'
  if (kind === 'period') return 'Period'
  return 'Check-off'
}

function standingTargetUnit(target: keyof Goals): string {
  if (target === 'gpaTarget') return 'GPA'
  if (target === 'mcatTarget') return 'points'
  return 'hours'
}

export function QuarterlyGoalsPanel() {
  const goals = useStore((state) => state.goals)
  const quarterlyGoals = useStore((state) => state.quarterlyGoals)
  const patchItem = useStore((state) => state.patchItem)
  const softDeleteItems = useStore((state) => state.softDeleteItems)
  const toast = useToast()
  const navigate = useNavigate()
  const [editor, setEditor] = useState<QuarterlyGoal | null | 'new'>(null)
  const [targetsOpen, setTargetsOpen] = useState(false)
  const [mode, setMode] = useState<RecordOpenMode>('peek')

  const visibleGoals = quarterlyGoals.filter((goal) => !goal.deletedAt).slice(0, 4)
  function openGoalEditor(goal: QuarterlyGoal | 'new') {
    setTargetsOpen(false)
    setMode('peek')
    setEditor(goal)
  }
  function openTargetEditor() {
    setEditor(null)
    setMode('peek')
    setTargetsOpen(true)
  }
  function closeGoalEditor() {
    setEditor(null)
    setMode('peek')
  }
  function closeTargetEditor() {
    setTargetsOpen(false)
    setMode('peek')
  }
  function archiveGoal(goal: QuarterlyGoal) {
    const recoveryId = softDeleteItems('quarterlyGoals', [goal.id], 'Archived quarterly goal')
    toast({ title: 'Goal archived', description: goal.text, onUndo: recoveryId ? () => useStore.getState().undoRecovery(recoveryId) : undefined })
  }
  function expandGoalEditor() {
    if (editor === 'new') navigate('/overview/goals/new')
    else if (editor) navigate(`/overview/goals/${editor.id}`)
  }

  return (
    <>
      <Card className="h-full" role="region" aria-labelledby="quarterly-goals-heading">
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle id="quarterly-goals-heading">Quarterly goals</CardTitle>
          <div className="flex items-center gap-1">
            <Button size="sm" variant="ghost" onClick={openTargetEditor}>Edit targets</Button>
            <Button size="sm" onClick={() => openGoalEditor('new')}><Plus className="size-3.5" />Add goal</Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {!visibleGoals.length && (
            <MascotNote
              variant="empty-state"
              priority={40}
              title="No quarterly goal yet"
              actions={<Button type="button" size="sm" onClick={() => openGoalEditor('new')}>Set a goal</Button>}
            >
              Add one focused push to connect today’s work to a standing target.
            </MascotNote>
          )}
          {visibleGoals.map((goal) => {
            const kind = normalizedGoalKind(goal)
            const target = goal.standingTarget
            const targetValue = target ? goals[target] : 0
            const current = target ? currentForTarget(target, goals) : 0
            const periodHasMeasurement = kind === 'period' && goal.currentValue != null && Boolean(goal.targetValue && goal.targetValue > 0)
            const cumulativeHasMeasurement = kind === 'cumulative' && Boolean(target && targetValue > 0 && current > 0)
            const progress = periodHasMeasurement
              ? Math.min(100, Math.max(0, (goal.currentValue! / goal.targetValue!) * 100))
              : cumulativeHasMeasurement
                ? Math.min(100, Math.max(0, (current / targetValue) * 100))
                : null
            return (
              <div key={goal.id} className={`rounded-xl border bg-background p-3 ${goal.done ? 'border-[color-mix(in_srgb,var(--success)_38%,var(--border))]' : 'border-border'}`}>
                <div className="flex items-start gap-2">
                  {kind === 'check-off' ? (
                    <Checkbox
                      checked={goal.done}
                      onCheckedChange={(checked) => patchItem('quarterlyGoals', goal.id, { done: Boolean(checked) })}
                      aria-label={goal.done ? `${goal.text} completed` : `Complete ${goal.text}`}
                    />
                  ) : <span className="mt-0.5 size-4 shrink-0 rounded-full border border-primary/35 bg-primary/10" aria-hidden="true" />}
                  <button type="button" onClick={() => openGoalEditor(goal)} className="min-w-0 flex-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    <p className={`text-sm font-bold leading-snug ${goal.done ? 'text-muted-foreground line-through' : ''}`}>{goal.text}</p>
                    {kind === 'cumulative' && target ? (
                      <>
                        <p className="mt-2 text-lg font-extrabold tabular-nums">
                          {current > 0 ? `${formatGoalValue(target, current)} / ${formatGoalValue(target, targetValue)} ${standingTargetUnit(target)}` : 'No recorded value yet'}
                        </p>
                        {progress != null && <Progress value={progress} className="mt-2 h-1.5" aria-label={`${goal.text}: ${Math.round(progress)}% of student-set target`} />}
                        <p className="mt-2 text-[11px] font-semibold text-muted-foreground">
                          {current > 0 ? `Connected to recorded ${standingTargetUnit(target).toLowerCase()}` : `${formatGoalValue(target, targetValue)} ${standingTargetUnit(target)} student-set target`}
                        </p>
                      </>
                    ) : kind === 'period' ? (
                      <>
                        <p className="mt-2 text-lg font-extrabold tabular-nums">
                          {periodHasMeasurement ? `${goal.currentValue} / ${goal.targetValue}${goal.unit ? ` ${goal.unit}` : ''}` : 'No measured value yet'}
                        </p>
                        {progress != null && <Progress value={progress} className="mt-2 h-1.5" indicatorClassName="bg-[var(--cat-mcat)]" aria-label={`${goal.text}: ${Math.round(progress)}% for ${goal.periodLabel || 'this period'}`} />}
                        <p className="mt-2 text-[11px] font-semibold text-muted-foreground">
                          {[goal.periodLabel || 'Current period', goal.evidenceLabel || 'Student-entered measurement'].join(' · ')}
                        </p>
                      </>
                    ) : <p className="mt-2 text-xs font-semibold text-muted-foreground">{goal.done ? 'Completed manually' : 'Open'}</p>}
                  </button>
                  <Badge variant="muted" className="shrink-0 px-1.5 text-[9px]">{goalKindLabel(kind)}</Badge>
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>
      <CenterPeek open={editor != null} mode={mode} label={editor === 'new' ? 'New quarterly goal' : 'Edit quarterly goal'} onOpenChange={(open) => !open && closeGoalEditor()} onModeChange={setMode} onExpand={expandGoalEditor} allowSplit={false}>
        {editor != null && <QuarterlyGoalEditor goal={editor === 'new' ? undefined : editor} onDone={closeGoalEditor} onArchive={editor === 'new' ? undefined : () => { archiveGoal(editor); closeGoalEditor() }} />}
      </CenterPeek>
      <CenterPeek open={targetsOpen} mode={mode} label="Standing domain targets" onOpenChange={(open) => !open && closeTargetEditor()} onModeChange={setMode} onExpand={() => navigate('/overview/goals/targets')} allowSplit={false}>
        <GoalTargetEditor />
      </CenterPeek>
    </>
  )
}

export function QuarterlyGoalEditor({ goal, onDone, onArchive }: { goal?: QuarterlyGoal; onDone: () => void; onArchive?: () => void }) {
  const addItem = useStore((state) => state.addItem)
  const patchItem = useStore((state) => state.patchItem)
  const existingCount = useStore((state) => state.quarterlyGoals.length)
  const [text, setText] = useState(goal?.text ?? '')
  const [quarter, setQuarter] = useState(goal?.quarter ?? 'Current term')
  const [kind, setKind] = useState<'check-off' | 'cumulative' | 'period'>(goal ? normalizedGoalKind(goal) : 'check-off')
  const [standingTarget, setStandingTarget] = useState<keyof Goals | ''>(goal?.standingTarget ?? '')
  const [currentValue, setCurrentValue] = useState(goal?.currentValue == null ? '' : String(goal.currentValue))
  const [targetValue, setTargetValue] = useState(goal?.targetValue == null ? '' : String(goal.targetValue))
  const [unit, setUnit] = useState(goal?.unit ?? '')
  const [periodLabel, setPeriodLabel] = useState(goal?.periodLabel ?? 'Current week')
  const [evidenceLabel, setEvidenceLabel] = useState(goal?.evidenceLabel ?? '')
  const targetOptions: Array<{ value: keyof Goals; label: string }> = [
    { value: 'gpaTarget', label: 'GPA' }, { value: 'mcatTarget', label: 'MCAT' },
    { value: 'clinical', label: 'Clinical hours' }, { value: 'volunteering', label: 'Volunteering hours' },
    { value: 'shadowing', label: 'Shadowing hours' }, { value: 'research', label: 'Research hours' }, { value: 'activities', label: 'Activities hours' },
  ]
  function submit(event: FormEvent) {
    event.preventDefault()
    if (!text.trim() || (kind === 'cumulative' && !standingTarget) || (kind === 'period' && (!targetValue || Number(targetValue) <= 0))) return
    const patch = {
      quarter: quarter.trim() || 'Current term',
      text: text.trim(),
      kind,
      standingTarget: kind === 'cumulative' ? standingTarget as keyof Goals : undefined,
      currentValue: kind === 'period' && currentValue !== '' ? Math.max(0, Number(currentValue) || 0) : undefined,
      targetValue: kind === 'period' ? Math.max(0, Number(targetValue) || 0) : undefined,
      unit: kind === 'period' ? unit.trim() || undefined : undefined,
      periodLabel: kind === 'period' ? periodLabel.trim() || 'Current period' : undefined,
      evidenceLabel: kind === 'period' ? evidenceLabel.trim() || undefined : undefined,
    }
    if (goal) patchItem('quarterlyGoals', goal.id, patch)
    else addItem('quarterlyGoals', { id: uid(), ...patch, done: false, order: existingCount })
    onDone()
  }
  return (
    <form onSubmit={submit} className="mx-auto max-w-2xl space-y-5 p-5 md:p-7">
      <div><h2 className="font-display text-2xl font-extrabold">{goal ? 'Edit quarterly goal' : 'Add a quarterly goal'}</h2><p className="mt-1 text-sm text-muted-foreground">You choose how this goal is represented; nothing is inferred from its wording.</p></div>
      <label className="block text-sm font-bold">Goal <Textarea value={text} onChange={(event) => setText(event.target.value)} className="mt-2" rows={3} placeholder="What do you want to make true this term?" /></label>
      <label className="block text-sm font-bold">Quarter or term <Input value={quarter} onChange={(event) => setQuarter(event.target.value)} className="mt-2" /></label>
      <fieldset className="space-y-2"><legend className="text-sm font-bold">Goal type</legend><div className="grid gap-2 md:grid-cols-3">
        {([
          ['check-off', 'Check-off', 'One finish line that you complete manually.'],
          ['cumulative', 'Cumulative metric', 'Progress from an owned lifetime tracker and its standing target.'],
          ['period', 'Period metric', 'A measured value that resets over a named period.'],
        ] as const).map(([option, label, description]) => <button key={option} type="button" onClick={() => setKind(option)} className={`rounded-xl border p-3 text-left text-sm font-bold transition-colors ${kind === option ? 'border-primary bg-primary/10' : 'border-border bg-background hover:bg-muted/60'}`}><span className="block">{label}</span><span className="mt-1 block text-xs font-semibold text-muted-foreground">{description}</span></button>)}
      </div></fieldset>
      {/* Shared Select, not a raw <select>: every other field in this form uses
          the shared controls, and the native element rendered a browser-default
          arrow and focus ring instead of `field-solid` and `--ring`. */}
      {kind === 'cumulative' && <div className="text-sm font-bold">
        <span id="standing-target-label">Connected standing target</span>
        <Select value={standingTarget} onValueChange={(value) => setStandingTarget(value as keyof Goals)}>
          <SelectTrigger className="mt-2 font-semibold" aria-labelledby="standing-target-label">
            <SelectValue placeholder="Choose a target" />
          </SelectTrigger>
          <SelectContent>
            {targetOptions.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <span className="mt-2 block text-xs font-semibold text-muted-foreground">Premed OS uses only the recorded value and target owned by that tracker.</span>
      </div>}
      {kind === 'period' && <div className="space-y-4 rounded-xl border border-border bg-background p-4"><div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm font-bold">Current value <Input type="number" min={0} value={currentValue} onChange={(event) => setCurrentValue(event.target.value)} className="mt-2" placeholder="Optional until measured" /></label><label className="block text-sm font-bold">Target <Input type="number" min={0} value={targetValue} onChange={(event) => setTargetValue(event.target.value)} className="mt-2" /></label><label className="block text-sm font-bold">Unit <Input value={unit} onChange={(event) => setUnit(event.target.value)} className="mt-2" placeholder="questions, pages, hours…" /></label><label className="block text-sm font-bold">Period <Input value={periodLabel} onChange={(event) => setPeriodLabel(event.target.value)} className="mt-2" placeholder="Current week" /></label></div><label className="block text-sm font-bold">Evidence note <Input value={evidenceLabel} onChange={(event) => setEvidenceLabel(event.target.value)} className="mt-2" placeholder="Where this measured value came from" /><span className="mt-2 block text-xs font-semibold text-muted-foreground">Leave the current value blank until you have a real record. Premed OS will not invent zero progress.</span></label></div>}
      <div className="flex flex-wrap justify-between gap-2"><div>{onArchive && <Button type="button" variant="ghost" onClick={onArchive}><Archive className="size-4" />Archive</Button>}</div><Button type="submit" disabled={!text.trim() || (kind === 'cumulative' && !standingTarget) || (kind === 'period' && (!targetValue || Number(targetValue) <= 0))}>Save goal</Button></div>
    </form>
  )
}

export function GoalTargetEditor() {
  const goals = useStore((state) => state.goals)
  const update = useStore((state) => state.update)
  const labels: Array<{ key: keyof Goals; label: string; unit: string }> = [
    { key: 'gpaTarget', label: 'GPA', unit: 'GPA' },
    { key: 'mcatTarget', label: 'MCAT', unit: 'score' },
    { key: 'clinical', label: 'Clinical', unit: 'hours' },
    { key: 'volunteering', label: 'Volunteering', unit: 'hours' },
    { key: 'shadowing', label: 'Shadowing', unit: 'hours' },
  ]
  return (
    <div className="mx-auto max-w-2xl space-y-5 p-5 md:p-7">
      <div>
        <h2 className="font-display text-2xl font-extrabold">Standing targets</h2>
        <p className="mt-1 text-sm text-muted-foreground">These long-horizon targets feed the Overview domain rows and quarterly-goal links.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {labels.map((item) => (
          <label key={item.key} className="rounded-2xl border border-border bg-card p-4 text-sm font-bold shadow-sm">
            {item.label}
            <span className="mt-1 block text-xs font-semibold text-muted-foreground">{item.unit}</span>
            <Input
              type="number"
              min={0}
              step={item.key === 'gpaTarget' ? 0.01 : 1}
              value={goals[item.key]}
              onChange={(event) => update((draft) => { draft.goals[item.key] = Number(event.target.value) || 0 })}
              className="mt-3"
            />
          </label>
        ))}
      </div>
    </div>
  )
}

export function ActivityAndCapture() {
  const activity = useStore((state) => state.meta.activity).slice(0, 4)
  const stories = useStore((state) => state.stories)
  const addItem = useStore((state) => state.addItem)
  const logActivity = useStore((state) => state.logActivity)
  const softDeleteItems = useStore((state) => state.softDeleteItems)
  const undoRecovery = useStore((state) => state.undoRecovery)
  const update = useStore((state) => state.update)
  const createOverviewFileCapture = useStore((state) => state.createOverviewFileCapture)
  const toast = useToast()
  const [value, setValue] = useState('')
  const [url, setUrl] = useState('')
  const [localOnly, setLocalOnly] = useState(false)
  const [captureKind, setCaptureKind] = useState<'thought' | 'link' | 'file'>('thought')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isSavingFile, setIsSavingFile] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState<'thought' | 'link' | 'file' | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!saved) return
    const timer = window.setTimeout(() => setSaved(null), 4500)
    return () => window.clearTimeout(timer)
  }, [saved])

  function addCapture(content: string, sourceUrl?: string) {
    const trimmed = content.trim()
    if (!trimmed) return
    const now = Date.now()
    addItem('stories', {
      id: uid(),
      prompt: '',
      title: '',
      commentary: trimmed,
      tags: [],
      capturedAt: now,
      updatedAt: now,
      origin: 'overview',
      localOnly,
      sourceUrl,
      order: stories.length,
    })
    logActivity('essays', sourceUrl ? `Captured Story Bank link: ${trimmed}` : `Captured Story Bank thought: ${trimmed}`)
  }

  function clearSelectedFile() {
    setSelectedFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    const trimmedUrl = url.trim()
    if (captureKind === 'file') {
      if (!selectedFile || isSavingFile) return
      setError(null)
      setIsSavingFile(true)
      let id: string | null = null
      try {
        id = await createOverviewFileCapture(selectedFile, { commentary: value.trim(), localOnly })
      } catch {
        id = null
      } finally {
        setIsSavingFile(false)
      }
      if (!id) {
        setError('We couldn’t save this file on this device. Try again.')
        return
      }
      clearSelectedFile()
      setValue('')
      setLocalOnly(false)
      setError(null)
      setSaved('file')
      return
    }
    if (captureKind === 'link') {
      try {
        const parsed = new URL(trimmedUrl)
        if (!/^https?:$/.test(parsed.protocol)) throw new Error('unsupported protocol')
      } catch {
        setError('Paste a complete http or https link, then try again.')
        return
      }
      addCapture(value.trim() || trimmedUrl, trimmedUrl)
    } else if (value.trim()) addCapture(value)
    else return
    setValue('')
    setUrl('')
    setLocalOnly(false)
    setError(null)
    setSaved(captureKind)
  }

  function captureForActivity(entry: ActivityEvent) {
    const matches = stories.filter((story) => story.origin === 'overview' && (
      entry.label === `Captured Story Bank thought: ${story.commentary}` || entry.label === `Captured Story Bank link: ${story.commentary}`
    ))
    return matches.sort((a, b) => Math.abs((a.capturedAt ?? 0) - entry.at) - Math.abs((b.capturedAt ?? 0) - entry.at))[0]
  }

  function deleteCapture(entry: ActivityEvent, capture: StoryEntry) {
    const recoveryId = softDeleteItems('stories', [capture.id], 'Deleted captured thought')
    update((draft) => {
      draft.meta.activity = draft.meta.activity.filter((candidate) => candidate.id !== entry.id)
    })
    toast({
      title: 'Capture moved to Trash',
      description: capture.commentary,
      onUndo: recoveryId
        ? () => {
            undoRecovery(recoveryId)
            update((draft) => {
              if (!draft.meta.activity.some((candidate) => candidate.id === entry.id)) {
                draft.meta.activity.push(entry)
                draft.meta.activity.sort((a, b) => b.at - a.at)
                draft.meta.activity = draft.meta.activity.slice(0, 30)
              }
            })
          }
        : undefined,
    })
  }

  return (
    <Card id="quick-capture" className="h-full scroll-mt-24" role="region" aria-labelledby="activity-capture-heading">
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle id="activity-capture-heading">Recent activity + capture</CardTitle>
        <Button asChild size="sm" variant="ghost"><Link to="/essays">Open Story Bank</Link></Button>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1">
          {!activity.length && (
            <MascotNote
              variant="empty-state"
              priority={41}
              title="No recent activity yet"
              actions={<Button type="button" size="sm" onClick={() => document.getElementById('overview-capture')?.focus()}>Capture something</Button>}
            >
              Add a thought below and it will appear in Story Bank immediately.
            </MascotNote>
          )}
          {activity.map((entry) => {
            const capture = captureForActivity(entry)
            return (
              <div key={entry.id} className="group flex items-center gap-2 rounded-lg px-1 py-1.5 text-xs transition-colors hover:bg-muted/40">
                <span className="size-2 rounded-full bg-primary" />
                <span className="min-w-0 flex-1 truncate font-bold">{entry.label}</span>
                <span className="relative flex min-w-16 shrink-0 justify-end">
                  <span className={capture ? 'transition-opacity group-hover:opacity-0 group-focus-within:opacity-0' : ''}>
                    {fmtTimeAgo(entry.at)}
                  </span>
                  {capture && (
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => deleteCapture(entry, capture)}
                      aria-label={`Delete captured thought: ${capture.commentary}`}
                      title="Delete capture"
                      className="pointer-events-none absolute right-0 top-1/2 size-6 -translate-y-1/2 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100 focus-visible:pointer-events-auto focus-visible:opacity-100"
                    >
                      <X className="size-3.5" />
                    </Button>
                  )}
                </span>
              </div>
            )
          })}
        </div>
        <form onSubmit={submit} className="space-y-2 border-t border-border pt-3">
          <div className="flex items-center justify-between gap-2">
            <label htmlFor="overview-capture" className="flex items-center gap-2 text-sm font-extrabold"><Lightbulb className="size-4 text-primary" />Quick Capture</label>
            <Badge variant="muted">Story Bank</Badge>
          </div>
          <div className="flex items-center gap-1" role="tablist" aria-label="Capture type">
            <Button type="button" size="sm" role="tab" aria-selected={captureKind === 'thought'} variant={captureKind === 'thought' ? 'secondary' : 'ghost'} onClick={() => { setCaptureKind('thought'); setError(null); setSaved(null) }}>Thought</Button>
            <Button type="button" size="sm" role="tab" aria-selected={captureKind === 'link'} variant={captureKind === 'link' ? 'secondary' : 'ghost'} onClick={() => { setCaptureKind('link'); setError(null); setSaved(null) }}><Link2 className="size-3.5" />Link</Button>
            <Button type="button" size="sm" role="tab" aria-selected={captureKind === 'file'} variant={captureKind === 'file' ? 'secondary' : 'ghost'} onClick={() => { setCaptureKind('file'); setError(null); setSaved(null) }}><FileUp className="size-3.5" />File</Button>
          </div>
          {captureKind === 'thought'
            ? <Textarea id="overview-capture" value={value} onChange={(event) => { setValue(event.target.value); setError(null) }} rows={2} placeholder="Type or paste a thought…" />
            : captureKind === 'link'
              ? <><Input id="overview-capture-link" aria-label="Link to save in Story Bank" value={url} onChange={(event) => { setUrl(event.target.value); setError(null) }} placeholder="https://…" /><Input aria-label="Optional note about this link" value={value} onChange={(event) => setValue(event.target.value)} placeholder="Optional note" /></>
              : <div className="space-y-2 rounded-lg border border-border bg-muted p-2.5">
                <input
                  ref={fileInputRef}
                  id="overview-capture-file"
                  type="file"
                  className="sr-only"
                  onChange={(event) => {
                    setSelectedFile(event.currentTarget.files?.item(0) ?? null)
                    setError(null)
                    setSaved(null)
                  }}
                />
                <div className="flex flex-wrap items-center gap-2">
                  <Button id="overview-capture-file-choose" type="button" size="sm" variant="outline" onClick={() => fileInputRef.current?.click()}><FileUp className="size-3.5" />{selectedFile ? 'Choose another file' : 'Choose file'}</Button>
                  {selectedFile
                    ? <span className="min-w-0 flex-1 truncate text-xs font-bold" aria-live="polite" title={selectedFile.name}>{selectedFile.name} · {formatFileSize(selectedFile.size)}</span>
                    : <span className="text-xs font-semibold text-muted-foreground">Select a file to save to Story Bank.</span>}
                  {selectedFile && <Button type="button" size="icon" variant="ghost" onClick={clearSelectedFile} aria-label={`Remove ${selectedFile.name}`} title="Remove selected file"><X className="size-3.5" /></Button>}
                </div>
                <Input aria-label="Optional note about this file" value={value} onChange={(event) => setValue(event.target.value)} placeholder="Optional note" />
                <p className="text-[11px] font-semibold text-muted-foreground">File bytes stay on this device and are not included in JSON backup or restore.</p>
              </div>}
          {error && <p role="alert" className="border-l-2 border-destructive pl-2 text-xs font-semibold text-destructive">{error} <Button type="button" size="sm" variant="link" onClick={() => document.getElementById(captureKind === 'link' ? 'overview-capture-link' : captureKind === 'file' ? 'overview-capture-file-choose' : 'overview-capture')?.focus()}>Retry</Button></p>}
          {saved && <p role="status" className="rounded-lg border border-success/30 bg-success/10 px-2.5 py-2 text-xs font-bold text-[color-mix(in_srgb,var(--success)_55%,var(--foreground))]">{saved === 'file' ? 'Saved file to Story Bank.' : 'Saved to Story Bank.'} <Link className="underline underline-offset-2" to="/essays">Open it</Link></p>}
          {captureKind !== 'file' && <p className="text-[11px] font-semibold text-muted-foreground">Atlas connection: reserved for a later phase.</p>}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <label htmlFor="overview-capture-local" className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-muted-foreground">
              <Checkbox id="overview-capture-local" checked={localOnly} onCheckedChange={(checked) => setLocalOnly(Boolean(checked))} />
              Keep local; never sync
            </label>
            <Button type="submit" disabled={captureKind === 'thought' ? !value.trim() : captureKind === 'link' ? !url.trim() : !selectedFile || isSavingFile}><Plus className="size-4" />{isSavingFile ? 'Saving…' : 'Capture'}</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
