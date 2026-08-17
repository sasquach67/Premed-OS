import { useEffect, useMemo, useState, type ClipboardEvent, type DragEvent, type ReactNode } from 'react'
import {
  AlertCircle, ArrowLeft, BarChart3, BookOpen, Brain, CalendarDays, CalendarRange, CheckCircle2, ClipboardList,
  Clock3, Filter, Flame, LibraryBig, MessageCircle, Play, Plus, Search, Target,
  Trash2, TrendingUp, UploadCloud,
} from 'lucide-react'
import {
  Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip as RTooltip, XAxis, YAxis,
} from 'recharts'
import { useStore } from '@/store/store'
import { ROUTE_MAP } from '@/app/routes'
import { bestMcat } from '@/lib/selectors'
import { daysUntil, fmtEventDate, fmtRecordedDate, pickDaily } from '@/lib/date'
import { uid } from '@/lib/id'
import { MCAT_QOTD } from '@/data/mcatQotd'
import {
  PREPCAT_CONTENT_COUNTS,
  PREPCAT_CONTENT_ITEMS,
  type PrepCatContentItem,
  type PrepCatContentType,
} from '@/data/prepcatContent'
import { PageHeader } from '@/components/common/PageHeader'
import { McatSessionSetupDialog } from '@/components/mcat/McatSessionSetupDialog'
import { EmptyState } from '@/components/common/EmptyState'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DateField } from '@/components/common/DateField'
import { cn } from '@/lib/utils'

type SectionKey = 'bb' | 'cp' | 'cars' | 'ps'
type ContentType = PrepCatContentType

const SECTION_META: Record<SectionKey, { label: string; short: string; color: string; soft: string }> = {
  bb: { label: 'Bio/Biochem', short: 'Bio', color: '#76b86c', soft: 'bg-leaf/15 text-leaf' },
  cp: { label: 'Chem/Phys', short: 'Chem', color: '#e4a24f', soft: 'bg-amber/20 text-amber-foreground' },
  cars: { label: 'CARS', short: 'CARS', color: '#62b7ee', soft: 'bg-primary/15 text-primary' },
  ps: { label: 'Psych/Soc', short: 'Psych', color: '#ef86b4', soft: 'bg-rose/15 text-rose-foreground' },
}

const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  guide: 'Guides',
  'hack-sheet': 'Hack sheets',
  pathway: 'Pathways',
  lesson: 'Lessons',
  'rapid-fire': 'Rapid fire',
  match: 'Match',
  flashcards: 'Flashcards',
  sequence: 'Sequences',
  'bucket-sort': 'Bucket sort',
}

const CONTENT_TYPE_OPTIONS: Array<ContentType | 'all'> = [
  'all',
  'guide',
  'hack-sheet',
  'pathway',
  'lesson',
  'rapid-fire',
  'match',
  'flashcards',
  'sequence',
  'bucket-sort',
]

const PLAN_DAYS = [
  {
    day: 'Mon', date: 'Jul 6', phase: 'Foundation', hours: 3.0,
    sessions: [
      { section: 'bb' as SectionKey, time: '9:00', task: 'Anki', detail: 'MileDown · 200 due cards' },
      { section: 'cp' as SectionKey, time: '2:00', task: 'Content block', detail: 'Gen Chem equilibrium review' },
    ],
  },
  {
    day: 'Tue', date: 'Jul 7', phase: 'Foundation', hours: 2.5,
    sessions: [
      { section: 'cars' as SectionKey, time: '10:00', task: 'CARS set', detail: '3 passages · review tone traps' },
      { section: 'bb' as SectionKey, time: '7:00', task: 'Pathway map', detail: 'Glycolysis + regulation sheet' },
    ],
  },
  {
    day: 'Wed', date: 'Jul 8', phase: 'Practice', hours: 3.5,
    sessions: [
      { section: 'cp' as SectionKey, time: '9:30', task: '100 AAMC questions', detail: 'Chem/Phys mixed discrete + passage' },
      { section: 'bb' as SectionKey, time: '4:00', task: 'Review mistakes', detail: '25 from your error log' },
    ],
  },
  {
    day: 'Thu', date: 'Jul 9', phase: 'Practice', hours: 2.0,
    sessions: [
      { section: 'ps' as SectionKey, time: '11:00', task: 'Psych/Soc doc', detail: 'Motivation + learning terms' },
      { section: 'cars' as SectionKey, time: '8:00', task: 'Timed set', detail: '2 passages · no pausing' },
    ],
  },
  { day: 'Fri', date: 'Jul 10', phase: 'Rest', hours: 0, sessions: [] },
  {
    day: 'Sat', date: 'Jul 11', phase: 'Full length', hours: 7.5,
    sessions: [
      { section: 'cars' as SectionKey, time: '8:00', task: 'AAMC FL block', detail: 'Full length + light same-day notes' },
    ],
  },
  {
    day: 'Sun', date: 'Jul 12', phase: 'Polish', hours: 3.0,
    sessions: [
      { section: 'bb' as SectionKey, time: '1:00', task: 'FL review', detail: 'Bio/Biochem misses + make fixes' },
      { section: 'ps' as SectionKey, time: '5:00', task: 'Recall drill', detail: 'Missed vocab + examples' },
    ],
  },
  { day: 'Exam', date: 'Test day', phase: 'Exam day', hours: 0, sessions: [] },
]

const HEATMAP = Array.from({ length: 70 }, (_, i) => ((i * 7 + 3) % 5))

export function Mcat() {
  const route = ROUTE_MAP.mcat
  const mcat = useStore((s) => s.mcat)
  const best = bestMcat(mcat)
  const goal = mcat.goalScore ?? 515
  const currentScore = best ?? mcat.baselineScore ?? 472
  const weeklyHours = mcat.weeklyStudyHours ?? 0
  const preferredSessionLength = mcat.preferredSessionLength ?? 90
  const targetDate = mcat.targetDate
  const planIntensity = mcat.planIntensity ?? 'balanced'
  const projectedLift = Math.max(10, Math.min(32, Math.round(weeklyHours * 0.9) + (planIntensity === 'aggressive' ? 7 : planIntensity === 'light' ? 2 : 4)))
  const projectedScore = Math.min(goal, currentScore + projectedLift)
  const readiness = Math.max(18, Math.min(92, Math.round(((currentScore - 472) / (goal - 472 || 1)) * 100)))
  const projectedReadiness = Math.max(readiness + 8, Math.min(96, Math.round(((projectedScore - 472) / (goal - 472 || 1)) * 100)))
  const qotd = pickDaily(MCAT_QOTD, 13) ?? MCAT_QOTD[0]
  const days = daysUntil(targetDate)
  const openTasks = mcat.schedule.filter((s) => !s.done).length + mcat.errorLog.filter((e) => !e.resolved).length
  const debtHours = Math.round(openTasks * (preferredSessionLength / 60))

  const chartData = useMemo(
    () => {
      const attempts = mcat.attempts.filter((a) => a.total)
      if (attempts.length) return attempts.map((a, i) => ({ name: a.source || `#${i + 1}`, score: a.total }))
      return [
        { name: 'Diagnostic', score: 480 },
        { name: 'Week 2', score: 486 },
        { name: 'Projected', score: projectedScore },
      ]
    },
    [mcat.attempts, projectedScore]
  )

  const sectionReadiness = useMemo(() => buildSectionReadiness(mcat.attempts), [mcat.attempts])

  return (
    <div>
      <PageHeader title={route.label} />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-2.5 text-sm card-soft">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <span className="flex items-center gap-1.5"><CalendarRange className="size-4 text-primary" /> Sit date <b>{fmtEventDate(targetDate)}</b></span>
          <span>Goal <b className="text-foreground">{mcat.goalScore ?? 'Set'}</b></span>
          <span>Baseline <b className="text-foreground">{mcat.baselineScore ?? best ?? 'Set'}</b></span>
          <span className="text-muted-foreground">Best so far <b className="text-foreground">{best ?? '—'}</b></span>
        </div>
        <McatSetupDialog />
      </div>

      <McatFocusLaunchStrip
        setup={{ weeklyHours, preferredSessionLength, currentPhase: mcat.currentPhase, focusSection: mcat.focusSection }}
        openTasks={openTasks}
      />

      <Tabs defaultValue="dashboard" className="space-y-4">
        <TabsList>
          <TabsTrigger value="dashboard"><Target className="size-4" /> Dashboard</TabsTrigger>
          <TabsTrigger value="plan"><CalendarDays className="size-4" /> Plan</TabsTrigger>
          <TabsTrigger value="content"><LibraryBig className="size-4" /> Content</TabsTrigger>
          <TabsTrigger value="mistakes"><AlertCircle className="size-4" /> Mistakes</TabsTrigger>
          <TabsTrigger value="stats"><BarChart3 className="size-4" /> Stats</TabsTrigger>
          <TabsTrigger value="advisor"><MessageCircle className="size-4" /> Advisor</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <McatDashboard
            currentScore={currentScore}
            projectedScore={projectedScore}
            goal={goal}
            readiness={readiness}
            projectedReadiness={projectedReadiness}
            days={days}
            openTasks={openTasks}
            debtHours={debtHours}
            sectionReadiness={sectionReadiness}
            qotd={qotd}
            setup={{ weeklyHours, preferredSessionLength, currentPhase: mcat.currentPhase, focusSection: mcat.focusSection }}
          />
        </TabsContent>

        <TabsContent value="plan">
          <McatPlan currentScore={currentScore} projectedScore={projectedScore} goal={goal} />
        </TabsContent>

        <TabsContent value="content">
          <McatContent />
        </TabsContent>

        <TabsContent value="mistakes">
          <MistakeMap />
        </TabsContent>

        <TabsContent value="stats">
          <McatStats
            currentScore={currentScore}
            projectedScore={projectedScore}
            goal={goal}
            readiness={readiness}
            projectedReadiness={projectedReadiness}
            sectionReadiness={sectionReadiness}
            chartData={chartData}
          />
        </TabsContent>

        <TabsContent value="advisor">
          <McatAdvisor />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function McatSetupDialog() {
  const mcat = useStore((s) => s.mcat)
  const update = useStore((s) => s.update)
  const [open, setOpen] = useState(false)
  const [targetDate, setTargetDate] = useState(mcat.targetDate ?? '')
  const [goalScore, setGoalScore] = useState(mcat.goalScore?.toString() ?? '')
  const [baselineScore, setBaselineScore] = useState(mcat.baselineScore?.toString() ?? '')
  const [weeklyStudyHours, setWeeklyStudyHours] = useState(mcat.weeklyStudyHours?.toString() ?? '')
  const [preferredSessionLength, setPreferredSessionLength] = useState((mcat.preferredSessionLength ?? 90).toString())
  const [currentPhase, setCurrentPhase] = useState(mcat.currentPhase ?? '')
  const [planIntensity, setPlanIntensity] = useState(mcat.planIntensity ?? 'balanced')
  const [focusSection, setFocusSection] = useState(mcat.focusSection ?? '')

  function save() {
    update((d) => {
      d.mcat.targetDate = targetDate || undefined
      d.mcat.goalScore = parseOptionalNumber(goalScore)
      d.mcat.baselineScore = parseOptionalNumber(baselineScore)
      d.mcat.weeklyStudyHours = parseOptionalNumber(weeklyStudyHours)
      d.mcat.preferredSessionLength = parseOptionalNumber(preferredSessionLength) ?? 90
      d.mcat.currentPhase = currentPhase || undefined
      d.mcat.planIntensity = planIntensity
      d.mcat.focusSection = focusSection || undefined
    })
    setOpen(false)
  }

  function clearSetup() {
    setTargetDate('')
    setGoalScore('')
    setBaselineScore('')
    setWeeklyStudyHours('')
    setPreferredSessionLength('90')
    setCurrentPhase('')
    setPlanIntensity('balanced')
    setFocusSection('')
    update((d) => {
      d.mcat.targetDate = undefined
      d.mcat.goalScore = undefined
      d.mcat.baselineScore = undefined
      d.mcat.weeklyStudyHours = undefined
      d.mcat.preferredSessionLength = undefined
      d.mcat.currentPhase = undefined
      d.mcat.planIntensity = undefined
      d.mcat.focusSection = undefined
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm"><Target className="size-4" /> Setup MCAT</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[88vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Set up MCAT preferences</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          <section className="space-y-3">
            <h3 className="text-xs font-extrabold uppercase tracking-wide text-muted-foreground">Exam goal</h3>
            <div className="grid gap-4 md:grid-cols-3">
              <Label className="space-y-1.5">
                <span>Sit date</span>
                <DateField value={targetDate} onChange={setTargetDate} ariaLabel="Sit date" display="event" />
              </Label>
              <Label className="space-y-1.5">
                <span>Goal score</span>
                <Input type="number" min={472} max={528} placeholder="515" value={goalScore} onChange={(e) => setGoalScore(e.target.value)} />
              </Label>
              <Label className="space-y-1.5">
                <span>Baseline</span>
                <Input type="number" min={472} max={528} placeholder="Latest diagnostic" value={baselineScore} onChange={(e) => setBaselineScore(e.target.value)} />
              </Label>
            </div>
          </section>
          <section className="space-y-3 border-t border-border pt-4">
            <h3 className="text-xs font-extrabold uppercase tracking-wide text-muted-foreground">Study plan</h3>
            <div className="grid gap-4 md:grid-cols-3">
              <Label className="space-y-1.5">
                <span>Weekly hours</span>
                <Input type="number" min={0} max={80} placeholder="12" value={weeklyStudyHours} onChange={(e) => setWeeklyStudyHours(e.target.value)} />
              </Label>
              <Label className="space-y-1.5">
                <span>Session length</span>
                <Input type="number" min={15} max={240} step={15} value={preferredSessionLength} onChange={(e) => setPreferredSessionLength(e.target.value)} />
              </Label>
              <Label className="space-y-1.5">
                <span>Current phase</span>
                <Select value={currentPhase || '__none__'} onValueChange={(value) => setCurrentPhase(value === '__none__' ? '' : value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{['Choose phase', 'Foundation', 'Content Review', 'Practice', 'Full Lengths', 'Polish'].map((label, index) => <SelectItem key={label} value={index === 0 ? '__none__' : label}>{label}</SelectItem>)}</SelectContent></Select>
              </Label>
            </div>
          </section>
          <details className="rounded-2xl border border-border bg-muted/25 p-3">
            <summary className="cursor-pointer text-sm font-extrabold">Preferences</summary>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Label className="space-y-1.5">
                <span>Plan intensity</span>
                <Select value={planIntensity} onValueChange={(value) => setPlanIntensity(value as 'light' | 'balanced' | 'aggressive')}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{['light', 'balanced', 'aggressive'].map((value) => <SelectItem key={value} value={value}>{value[0].toUpperCase() + value.slice(1)}</SelectItem>)}</SelectContent></Select>
              </Label>
              <Label className="space-y-1.5">
                <span>Priority section</span>
                <Select value={focusSection || '__auto__'} onValueChange={(value) => setFocusSection(value === '__auto__' ? '' : value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="__auto__">Auto from scores</SelectItem>{Object.values(SECTION_META).map((section) => <SelectItem key={section.label} value={section.label}>{section.label}</SelectItem>)}</SelectContent></Select>
              </Label>
            </div>
          </details>
        </div>

        <DialogFooter>
          <Button variant="ghost" type="button" onClick={clearSetup}>Clear setup</Button>
          <Button type="button" onClick={save}>Save setup</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function McatFocusLaunchStrip({
  setup, openTasks,
}: {
  setup: { weeklyHours: number; preferredSessionLength: number; currentPhase?: string; focusSection?: string }
  openTasks: number
}) {
  const section = setup.focusSection || 'Mixed review'
  const length = setup.preferredSessionLength || 90
  const phase = setup.currentPhase || 'Set your phase'

  return (
    <section className="mb-4 rounded-2xl border border-leaf/35 bg-[linear-gradient(135deg,color-mix(in_srgb,var(--leaf)_18%,var(--card)),var(--card)_58%,color-mix(in_srgb,var(--primary)_14%,var(--card)))] p-4 shadow-sm card-soft">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-leaf/15 px-2.5 py-1 text-xs font-extrabold text-leaf">
              <Play className="size-3.5 fill-current" /> Focus session
            </span>
            <span className="text-xs font-bold text-muted-foreground">{phase} · {length} min · {section}</span>
          </div>
          <h2 className="mt-2 font-display text-2xl font-extrabold">Start the next MCAT block</h2>
          <p className="mt-1 max-w-2xl text-sm font-semibold text-muted-foreground">
            Choose the section, length, and goal before the timer takes over the screen.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="rounded-xl border border-border/70 bg-card px-3 py-2 text-xs font-bold text-muted-foreground">
            {openTasks ? `${openTasks} unfinished MCAT items` : 'No MCAT debt logged'}
          </div>
          <McatSessionSetupDialog
            triggerClassName="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-leaf px-6 text-base font-extrabold text-white shadow-sm transition hover:bg-leaf/90"
            trigger={<><Play className="size-4 fill-current" /> Start session</>}
          />
        </div>
      </div>
    </section>
  )
}

function McatDashboard({
  currentScore, projectedScore, goal, readiness, projectedReadiness, days, openTasks, debtHours, sectionReadiness, qotd, setup,
}: {
  currentScore: number
  projectedScore: number
  goal: number
  readiness: number
  projectedReadiness: number
  days: number | null
  openTasks: number
  debtHours: number
  sectionReadiness: ReturnType<typeof buildSectionReadiness>
  qotd: (typeof MCAT_QOTD)[number]
  setup: { weeklyHours: number; preferredSessionLength: number; currentPhase?: string; focusSection?: string }
}) {
  const today = new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date())
  const statusLabel = readiness >= 70 ? 'On track' : readiness >= 40 ? 'Building momentum' : 'Just getting started'
  const focusLabel = setup.focusSection || lowestSectionLabel(sectionReadiness)
  const hasDebt = openTasks > 0

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_21rem]">
      <div className="space-y-4">
        <section className="rounded-2xl border border-border bg-[linear-gradient(135deg,#211d18,#2a251f_55%,#17231b)] p-5 text-white shadow-sm">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-white/60">{today}</p>
              <h2 className="mt-1 font-display text-3xl font-extrabold">MCAT readiness, Andy</h2>
            </div>
            <span className="rounded-full border border-leaf/40 bg-leaf/15 px-3 py-1 text-xs font-extrabold text-leaf">{statusLabel}</span>
          </div>

          <div className="grid gap-5 lg:grid-cols-[15rem_minmax(0,1fr)]">
            <ReadinessRing value={readiness} />
            <div className="space-y-4">
              <div className="rounded-2xl bg-white/8 p-4 ring-1 ring-white/10">
                <p className="text-sm font-bold text-white/65">Projected {projectedReadiness}% by exam day</p>
                <p className="mt-1 text-2xl font-extrabold text-leaf">+{projectedReadiness - readiness} readiness points</p>
                <div className="mt-4 grid gap-2 sm:grid-cols-3">
                  <ScoreTile label="Score now" value={currentScore} />
                  <ScoreTile label="Projected" value={projectedScore} />
                  <ScoreTile label="Gap" value={`${Math.max(0, goal - projectedScore)} pts`} />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {sectionReadiness.map((section) => (
                  <MiniBar key={section.key} label={SECTION_META[section.key].label} value={section.now} projected={section.projected} color={SECTION_META[section.key].color} />
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.05fr_.95fr]">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><ClipboardList className="size-4 text-primary" /> Today’s study queue</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {PLAN_DAYS[0].sessions.map((session) => (
                <StudyQueueRow key={`${session.section}-${session.task}`} session={session} />
              ))}
              <div className="rounded-xl border border-dashed border-border px-3 py-2 text-sm font-semibold text-muted-foreground">Quick add — type a study task and press Enter...</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Brain className="size-4 text-primary" /> QOTD + Missed bank</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-2xl bg-muted/45 p-3">
                <p className="text-xs font-extrabold uppercase tracking-wide text-primary">{qotd.section}</p>
                <p className="mt-1 line-clamp-3 text-sm font-semibold">{qotd.question}</p>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-2xl bg-muted/35 p-3"><b>0</b><br /><span className="text-muted-foreground">review due</span></div>
                <div className="rounded-2xl bg-muted/35 p-3"><b>streak 4</b><br /><span className="text-muted-foreground">keep it alive</span></div>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>

      <aside className="space-y-3">
        <Card className="border-destructive/30 bg-destructive/10">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 size-5 text-destructive" />
              <div>
                <p className="font-display text-lg font-extrabold">{hasDebt ? 'You need to catch up!' : 'Plan debt is clear'}</p>
                <p className="text-sm font-semibold text-muted-foreground">
                  {hasDebt ? `${openTasks} unfinished tasks · ~${debtHours}h` : 'No unfinished MCAT tasks or unresolved misses yet.'}
                </p>
              </div>
            </div>
            <Button size="sm" className="mt-3 w-full">Rebuild catch-up plan</Button>
          </CardContent>
        </Card>

        <Card className="border-leaf/30 bg-leaf/10">
          <CardContent className="p-4">
            <p className="text-xs font-extrabold uppercase tracking-wide text-leaf">Smart nudge</p>
            <p className="mt-1 font-bold">Focus on {focusLabel}; your setup marks it as the priority.</p>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-3">
          <MetricTile icon={Clock3} label="Countdown" value={days != null ? `${days}d` : '—'} />
          <MetricTile icon={Flame} label="Phase" value={setup.currentPhase || 'Set'} />
          <MetricTile icon={BookOpen} label="Weekly" value={setup.weeklyHours ? `${setup.weeklyHours}h` : 'Set'} />
          <MetricTile icon={CheckCircle2} label="Session" value={`${setup.preferredSessionLength}m`} />
        </div>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Study consistency</CardTitle></CardHeader>
          <CardContent><Heatmap /></CardContent>
        </Card>
      </aside>
    </div>
  )
}

function McatPlan({ currentScore, projectedScore, goal }: { currentScore: number; projectedScore: number; goal: number }) {
  const [rebuilt, setRebuilt] = useState(false)
  return (
    <div className="space-y-4">
      <Card className="border-primary/25 bg-primary/8">
        <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-wide text-primary">Adaptive plan</p>
            <h2 className="font-display text-2xl font-extrabold">Projected {projectedScore} · {Math.max(0, goal - projectedScore)} pts to go</h2>
            <p className="text-sm font-semibold text-muted-foreground">Current baseline {currentScore}. The plan shifts toward debt, weak topics, and upcoming full lengths.</p>
          </div>
          <Button onClick={() => setRebuilt(true)}><TrendingUp className="size-4" /> Rebuild my plan to close the gap</Button>
        </CardContent>
      </Card>
      {rebuilt && <div className="rounded-xl border border-leaf/30 bg-leaf/10 px-4 py-2 text-sm font-semibold text-leaf">Plan rebuilt locally: Bio/Biochem review and error-log sessions were moved earlier this week.</div>}

      <div className="overflow-x-auto rounded-2xl border border-border bg-card p-3 card-soft">
        <div className="grid min-w-[980px] grid-cols-8 gap-3">
          {PLAN_DAYS.map((day) => <PlanDay key={`${day.day}-${day.date}`} day={day} />)}
        </div>
      </div>
    </div>
  )
}

function McatContent() {
  const [query, setQuery] = useState('')
  const [type, setType] = useState<ContentType | 'all'>('all')
  const [section, setSection] = useState<SectionKey | 'all'>('all')
  const [selectedItem, setSelectedItem] = useState<PrepCatContentItem | null>(null)
  const normalizedQuery = query.trim().toLowerCase()
  const items = PREPCAT_CONTENT_ITEMS.filter((item) =>
    (type === 'all' || item.type === type) &&
    (section === 'all' || item.section === section) &&
    (!normalizedQuery ||
      item.title.toLowerCase().includes(normalizedQuery) ||
      item.description.toLowerCase().includes(normalizedQuery) ||
      item.meta.toLowerCase().includes(normalizedQuery))
  )
  const featured = items
    .filter((item) => item.featured)
    .slice(0, 6)
  const gameCount =
    PREPCAT_CONTENT_COUNTS['rapid-fire'] +
    PREPCAT_CONTENT_COUNTS.match +
    PREPCAT_CONTENT_COUNTS.sequence +
    PREPCAT_CONTENT_COUNTS['bucket-sort']

  if (selectedItem) {
    return <ContentReaderPage item={selectedItem} onBack={() => setSelectedItem(null)} />
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 card-soft">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search PrepCat guides, pathways, drills..." className="pl-9" />
          </div>
          <div className="flex flex-wrap gap-2 text-xs font-bold">
            {[
              `${PREPCAT_CONTENT_COUNTS.guide} guides`,
              `${PREPCAT_CONTENT_COUNTS['hack-sheet']} hack sheets`,
              `${PREPCAT_CONTENT_COUNTS.pathway} pathways`,
              `${gameCount} drills`,
            ].map((pill) => <span key={pill} className="rounded-full bg-muted px-3 py-1">{pill}</span>)}
          </div>
        </div>
        <FilterRow
          value={type}
          options={CONTENT_TYPE_OPTIONS}
          labeler={(v) => v === 'all' ? 'All types' : CONTENT_TYPE_LABELS[v as ContentType]}
          onChange={(v) => setType(v as ContentType | 'all')}
        />
        <FilterRow
          value={section}
          options={['all', 'bb', 'cp', 'cars', 'ps']}
          labeler={(v) => v === 'all' ? 'All sections' : SECTION_META[v as SectionKey].label}
          onChange={(v) => setSection(v as SectionKey | 'all')}
          toneFor={(v) => v === 'all' ? undefined : SECTION_META[v as SectionKey]}
        />
      </div>

      {featured.length > 0 && (
        <section>
          <h3 className="mb-2 font-display text-xl font-extrabold">Featured PrepCat sheets</h3>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {featured.map((item) => <ContentCard key={`${item.number}-${item.title}`} item={item} featured onOpen={() => setSelectedItem(item)} />)}
          </div>
        </section>
      )}

      <section>
        <div className="mb-2 flex items-end justify-between gap-3">
          <h3 className="font-display text-xl font-extrabold">Study library</h3>
          <p className="text-xs font-bold text-muted-foreground">{items.length} of {PREPCAT_CONTENT_ITEMS.length} items</p>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => <ContentCard key={`${item.number}-${item.title}`} item={item} onOpen={() => setSelectedItem(item)} />)}
        </div>
        {items.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm font-bold text-muted-foreground">
            No PrepCat content matches those filters yet.
          </div>
        )}
      </section>
    </div>
  )
}

function MistakeMap() {
  const errorLog = useStore((s) => s.mcat.errorLog)
  const update = useStore((s) => s.update)
  const [filter, setFilter] = useState<string>('All')
  const [hideResolved, setHideResolved] = useState(false)
  const [lastUpload, setLastUpload] = useState<string>('')

  const shown = errorLog.filter((e) => (filter === 'All' || e.section === filter) && (!hideResolved || !e.resolved))
  const pendingCount = errorLog.filter((e) => e.section === 'Needs classification').length
  const counts = useMemo(() => {
    const m: Record<string, number> = {}
    for (const e of errorLog) m[e.section] = (m[e.section] ?? 0) + 1
    return m
  }, [errorLog])

  function patch(id: string, p: Partial<(typeof errorLog)[number]>) {
    update((d) => { const x = d.mcat.errorLog.find((e) => e.id === id); if (x) Object.assign(x, p) })
  }

  function add(sectionName = filter === 'All' || filter === 'Needs classification' ? 'Bio/Biochem' : filter, source = '') {
    update((d) => d.mcat.errorLog.unshift({
      id: uid(), date: new Date().toISOString().slice(0, 10), section: sectionName,
      topic: '', whyMissed: '', fix: '', source, resolved: false, order: 0,
    }))
  }

  function addPendingScreenshot(source = 'Screenshot pending analysis') {
    update((d) => d.mcat.errorLog.unshift({
      id: uid(),
      date: new Date().toISOString().slice(0, 10),
      section: 'Needs classification',
      topic: 'Screenshot pending analysis',
      whyMissed: 'Screenshot saved. Classify it after OCR or manual review.',
      fix: 'Identify the MCAT section/topic, then add the fix and drill it again.',
      source,
      resolved: false,
      order: 0,
    }))
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (!file) return
    setLastUpload(file.name)
    addPendingScreenshot(`Screenshot upload · ${file.name}`)
  }

  function handlePaste(e: ClipboardEvent<HTMLDivElement>) {
    const imageItem = Array.from(e.clipboardData.items).find((item) => item.type.startsWith('image/'))
    if (!imageItem) return
    e.preventDefault()
    setLastUpload('pasted screenshot')
    addPendingScreenshot('Pasted screenshot')
  }

  return (
    <div className="space-y-4" onPaste={handlePaste}>
      <div
        tabIndex={0}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        className="rounded-2xl border border-dashed border-primary/50 bg-primary/8 p-8 text-center outline-none transition hover:border-primary focus-visible:ring-2 focus-visible:ring-primary/60 card-soft"
      >
        <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-primary/15 text-primary">
          <UploadCloud className="size-7" />
        </div>
        <h2 className="mt-3 font-display text-2xl font-extrabold">Log a mistake</h2>
        <p className="mx-auto mt-1 max-w-2xl text-sm font-semibold text-muted-foreground">
          Drop a screenshot here, or paste with Cmd+V. You can enter it manually if there is no screenshot.
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <Button onClick={() => addPendingScreenshot()}><UploadCloud className="size-4" /> Save for analysis</Button>
          <Button variant="outline" onClick={() => add()}><Plus className="size-4" /> Enter manually</Button>
        </div>
        {(lastUpload || pendingCount > 0) && (
          <p className="mt-3 text-xs font-bold text-primary">
            {lastUpload ? `Queued from ${lastUpload}` : `${pendingCount} screenshot${pendingCount === 1 ? '' : 's'} waiting to be classified`}
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <Filter className="mr-0.5 size-4 text-muted-foreground" />
          {['All', ...(pendingCount ? ['Needs classification'] : []), ...Object.values(SECTION_META).map((s) => s.label)].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={cn(
                'rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors',
                filter === s ? 'border-transparent bg-primary text-primary-foreground' : 'border-border bg-card hover:bg-muted'
              )}
            >
              {s}{s !== 'All' && counts[s] ? ` · ${counts[s]}` : ''}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <label className="flex cursor-pointer items-center gap-1.5 text-xs text-muted-foreground">
            <Checkbox checked={hideResolved} onCheckedChange={(v) => setHideResolved(Boolean(v))} /> Hide resolved
          </label>
          <Button size="sm" onClick={() => add()}><Plus className="size-4" /> Enter manually</Button>
        </div>
      </div>

      {shown.length === 0 ? (
        <EmptyState icon={AlertCircle} title="No mistakes logged yet" hint="Paste a screenshot above, or enter one manually if you already know the section and topic." action={<Button size="sm" onClick={() => add()}><Plus className="size-4" /> Enter manually</Button>} />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {shown.map((er) => (
            <div key={er.id} className={cn('rounded-xl border border-border bg-card p-3.5 card-soft', er.resolved && 'opacity-60')}>
              <div className="mb-2 flex items-center gap-2">
                <Select
                  value={er.section}
                  onValueChange={(section) => patch(er.id, {
                    section,
                    topic: section !== 'Needs classification' && er.topic === 'Screenshot pending analysis' ? '' : er.topic,
                    whyMissed: section !== 'Needs classification' && er.whyMissed === 'Screenshot saved. Classify it after OCR or manual review.' ? '' : er.whyMissed,
                    fix: section !== 'Needs classification' && er.fix === 'Identify the MCAT section/topic, then add the fix and drill it again.' ? '' : er.fix,
                  })}
                >
                  <SelectTrigger className="h-8 w-44 rounded-full border-0 px-2 text-xs font-bold text-primary-foreground" style={{ background: sectionColorByLabel(er.section) }}><SelectValue /></SelectTrigger>
                  <SelectContent>{er.section === 'Needs classification' && <SelectItem value="Needs classification">Needs classification</SelectItem>}{Object.values(SECTION_META).map((section) => <SelectItem key={section.label} value={section.label}>{section.label}</SelectItem>)}</SelectContent>
                </Select>
                <Input defaultValue={er.section === 'Needs classification' ? '' : er.topic} placeholder={er.section === 'Needs classification' ? 'Choose a section to classify this screenshot' : 'Topic (e.g. amino acid pKa)'} onBlur={(e) => patch(er.id, { topic: e.target.value || (er.section === 'Needs classification' ? 'Screenshot pending analysis' : '') })} className="h-7 flex-1 border-0 px-1 text-sm font-bold shadow-none focus-visible:ring-0" />
                <label className="flex cursor-pointer items-center gap-1 text-[10px] font-semibold uppercase text-muted-foreground">
                  <Checkbox checked={er.resolved} onCheckedChange={(v) => patch(er.id, { resolved: Boolean(v) })} /> Got it
                </label>
                <button onClick={() => update((d) => { d.mcat.errorLog = d.mcat.errorLog.filter((e) => e.id !== er.id) })} className="rounded-md p-1 text-muted-foreground hover:text-destructive"><Trash2 className="size-3.5" /></button>
              </div>
              <p className="mb-2 text-xs font-semibold text-muted-foreground">{fmtRecordedDate(er.date)}</p>
              <div className="space-y-2">
                <Field label="Why I missed it"><Textarea defaultValue={er.whyMissed} onBlur={(e) => patch(er.id, { whyMissed: e.target.value })} placeholder="Misread? Content gap? Timing?" className="min-h-14 text-sm" /></Field>
                <Field label="The fix"><Textarea defaultValue={er.fix} onBlur={(e) => patch(er.id, { fix: e.target.value })} placeholder="The rule/strategy to remember next time" className="min-h-14 text-sm" /></Field>
                <Input defaultValue={er.source} onBlur={(e) => patch(er.id, { source: e.target.value })} placeholder="Source (AAMC FL2 · UWorld …)" className="h-7 text-xs" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function McatStats({
  currentScore, projectedScore, goal, readiness, projectedReadiness, sectionReadiness, chartData,
}: {
  currentScore: number
  projectedScore: number
  goal: number
  readiness: number
  projectedReadiness: number
  sectionReadiness: ReturnType<typeof buildSectionReadiness>
  chartData: { name: string; score?: number }[]
}) {
  const errorLog = useStore((s) => s.mcat.errorLog)
  const topicCounts = rankTopics(errorLog)
  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-border bg-card p-5 card-soft">
        <div className="grid gap-5 lg:grid-cols-[16rem_minmax(0,1fr)]">
          <ReadinessRing value={Math.round((projectedScore / 528) * 100)} label={`${projectedScore}/528`} sublabel="projected score" />
          <div className="space-y-4">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wide text-primary">You are here</p>
              <h2 className="font-display text-3xl font-extrabold">Diagnostic → goal trajectory</h2>
              <p className="text-sm font-semibold text-muted-foreground">Current {currentScore} · projected {projectedScore} · goal {goal}</p>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartData} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                <YAxis domain={[472, 528]} tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                <RTooltip />
                <ReferenceLine y={goal} stroke="var(--cat-mcat)" strokeDasharray="4 4" label={{ value: `goal ${goal}`, fontSize: 10, fill: 'var(--cat-mcat)' }} />
                <Line type="monotone" dataKey="score" stroke="var(--cat-mcat)" strokeWidth={2.5} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <div className="grid gap-3 md:grid-cols-4">
        <MetricTile icon={Target} label="Ready now" value={`${readiness}%`} />
        <MetricTile icon={TrendingUp} label="Projected" value={`${projectedReadiness}%`} />
        <MetricTile icon={Flame} label="Streak" value="4d" />
        <MetricTile icon={BookOpen} label="This week" value="18h" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_22rem]">
        <Card>
          <CardHeader><CardTitle>Readiness by section</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {sectionReadiness.map((section) => (
              <MiniBar key={section.key} label={SECTION_META[section.key].label} value={section.now} projected={section.projected} color={SECTION_META[section.key].color} />
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Most missed topics</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {topicCounts.length === 0 && <p className="text-sm text-muted-foreground">No misses yet. Log misses to build the ranking.</p>}
            {topicCounts.map((topic, i) => (
              <div key={topic.topic} className="flex items-center justify-between rounded-xl bg-muted/35 px-3 py-2 text-sm">
                <span className="font-bold">{i + 1}. {topic.topic}</span>
                <span className="font-extrabold text-destructive">{topic.count}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Consistency heatmap</CardTitle></CardHeader>
        <CardContent><Heatmap /></CardContent>
      </Card>
    </div>
  )
}

function McatAdvisor() {
  const [messages, setMessages] = useState([
    { role: 'assistant', text: 'Tell me what changed, and I’ll translate it into plan adjustments you can actually follow.' },
  ])
  const replies = ['I am falling behind', 'Make next week lighter', 'I have an exam this week']

  function quickReply(text: string) {
    setMessages((prev) => [
      ...prev,
      { role: 'user', text },
      { role: 'assistant', text: advisorResponse(text) },
    ])
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><MessageCircle className="size-4 text-primary" /> MCAT advisor</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            {messages.map((message, i) => (
              <div key={`${message.role}-${i}`} className={cn('max-w-[85%] rounded-2xl px-3 py-2 text-sm font-semibold', message.role === 'assistant' ? 'bg-muted text-foreground' : 'ml-auto bg-primary text-primary-foreground')}>
                {message.text}
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {replies.map((reply) => <Button key={reply} variant="outline" size="sm" onClick={() => quickReply(reply)}>{reply}</Button>)}
          </div>
          <Textarea placeholder="Ask for a lighter week, a catch-up plan, or a section focus..." className="min-h-24" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>What this can change</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm font-semibold text-muted-foreground">
          <p>• Rebalance hour budgets</p>
          <p>• Move weak-section sessions earlier</p>
          <p>• Protect rest days after full lengths</p>
          <p>• Turn missed-question trends into review blocks</p>
          <p className="pt-2 text-xs">Local scaffold only for now. Future backend can persist generated plan changes.</p>
        </CardContent>
      </Card>
    </div>
  )
}

function ReadinessRing({ value, label = `${value}%`, sublabel = 'ready' }: { value: number; label?: string; sublabel?: string }) {
  return (
    <div className="mx-auto grid aspect-square w-full max-w-[15rem] place-items-center rounded-full p-4" style={{ background: `conic-gradient(var(--primary) ${value * 3.6}deg, rgba(255,255,255,.14) 0deg)` }}>
      <div className="grid size-full place-items-center rounded-full bg-[#211d18] text-center text-white shadow-inner">
        <div>
          <p className="font-display text-4xl font-extrabold">{label}</p>
          <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-white/55">{sublabel}</p>
        </div>
      </div>
    </div>
  )
}

function ScoreTile({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-xl bg-black/20 p-3">
      <p className="text-[10px] font-extrabold uppercase tracking-wide text-white/50">{label}</p>
      <p className="mt-1 text-xl font-extrabold text-white">{value}</p>
    </div>
  )
}

function MetricTile({ icon: Icon, label, value }: { icon: typeof Target; label: string; value: ReactNode }) {
  return (
    <Card>
      <CardContent className="p-3">
        <Icon className="mb-2 size-4 text-primary" />
        <p className="text-xs font-extrabold uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="mt-1 font-display text-2xl font-extrabold">{value}</p>
      </CardContent>
    </Card>
  )
}

function MiniBar({ label, value, projected, color }: { label: string; value: number; projected: number; color: string }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs font-bold">
        <span>{label}</span>
        <span className="text-muted-foreground">{value}% → {projected}%</span>
      </div>
      <div className="relative h-2 overflow-hidden rounded-full bg-muted">
        <div className="absolute inset-y-0 left-0 rounded-full opacity-35" style={{ width: `${projected}%`, backgroundColor: color }} />
        <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${value}%`, backgroundColor: color }} />
      </div>
    </div>
  )
}

function Heatmap() {
  return (
    <div className="grid grid-flow-col grid-rows-7 gap-1">
      {HEATMAP.map((value, i) => (
        <span
          key={i}
          className="size-3 rounded-[3px]"
          style={{ backgroundColor: value === 0 ? 'var(--muted)' : `color-mix(in srgb, var(--primary) ${25 + value * 15}%, var(--muted))` }}
          title={`${value} study blocks`}
        />
      ))}
    </div>
  )
}

function StudyQueueRow({ session }: { session: (typeof PLAN_DAYS)[number]['sessions'][number] }) {
  const meta = SECTION_META[session.section]
  return (
    <div className="flex items-start justify-between gap-3 rounded-xl bg-muted/35 px-3 py-2">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase', meta.soft)}>{meta.short}</span>
          <p className="truncate font-bold">{session.task}</p>
        </div>
        <p className="mt-1 text-xs font-semibold text-muted-foreground">{session.detail}</p>
      </div>
      <span className="shrink-0 text-xs font-extrabold text-primary">{session.time}</span>
    </div>
  )
}

function PlanDay({ day }: { day: (typeof PLAN_DAYS)[number] }) {
  const phaseTone = day.phase === 'Foundation' ? 'border-leaf/50 bg-leaf/10' :
    day.phase === 'Practice' ? 'border-primary/50 bg-primary/10' :
      day.phase === 'Polish' ? 'border-amber/50 bg-amber/10' :
        day.phase === 'Full length' ? 'border-rose/50 bg-rose/10' :
          day.phase === 'Exam day' ? 'border-foreground bg-foreground text-background' :
            'border-border bg-muted/35'

  return (
    <div className={cn('min-h-[22rem] rounded-2xl border p-3', phaseTone)}>
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <p className="font-display text-lg font-extrabold">{day.day}</p>
          <p className="text-xs font-bold opacity-65">{day.date}</p>
        </div>
        <span className="rounded-full bg-card/80 px-2 py-1 text-[10px] font-extrabold text-foreground">{day.hours ? `${day.hours}h` : day.phase}</span>
      </div>
      <p className="mb-3 text-[10px] font-extrabold uppercase tracking-wide opacity-65">{day.phase}</p>
      {day.phase === 'Rest' && <div className="grid h-40 place-items-center rounded-xl border border-dashed border-border text-center text-sm font-bold text-muted-foreground">Rest day<br />Protect recovery</div>}
      {day.phase === 'Exam day' && <div className="grid h-40 place-items-center rounded-xl bg-background/10 text-center text-sm font-bold">Exam-day card<br />Sleep, breakfast, arrive early.</div>}
      <div className="space-y-2">
        {day.sessions.map((session) => {
          const meta = SECTION_META[session.section]
          return (
            <div key={`${day.day}-${session.time}-${session.task}`} className="rounded-xl bg-card/85 p-2 text-foreground ring-1 ring-border/70">
              <div className="flex items-center justify-between gap-2">
                <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase', meta.soft)}>{meta.short}</span>
                <span className="text-[10px] font-bold text-muted-foreground">{session.time}</span>
              </div>
              <p className="mt-2 text-sm font-extrabold">{session.task}</p>
              <p className="mt-1 text-xs font-semibold text-muted-foreground">{session.detail}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function FilterRow({
  value, options, onChange, labeler, toneFor,
}: {
  value: string
  options: string[]
  onChange: (value: string) => void
  labeler?: (value: string) => string
  toneFor?: (value: string) => { color: string; soft: string } | undefined
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const tone = toneFor?.(option)
        const active = value === option
        return (
          <button
            key={option}
            onClick={() => onChange(option)}
            className={cn(
              'rounded-full border px-3 py-1 text-xs font-extrabold capitalize transition',
              active && !tone && 'border-transparent bg-primary text-primary-foreground',
              active && tone && tone.soft,
              !active && 'border-border bg-card hover:bg-muted'
            )}
            style={tone ? { borderColor: active ? tone.color : `${tone.color}55` } : undefined}
          >
            {labeler ? labeler(option) : option.replace('-', ' ')}
          </button>
        )
      })}
    </div>
  )
}

function ContentCard({ item, featured = false, onOpen }: { item: PrepCatContentItem; featured?: boolean; onOpen: () => void }) {
  const meta = SECTION_META[item.section]
  const typeLabel = CONTENT_TYPE_LABELS[item.type] ?? item.sourceType
  const detailMeta = [
    item.mins ? `~${item.mins} min` : null,
    item.sections ? `${item.sections} sections` : null,
    typeLabel,
  ].filter(Boolean).join(' · ')

  return (
    <button
      type="button"
      onClick={onOpen}
      style={{ borderLeftColor: meta.color }}
      className={cn(
        'flex min-h-[210px] flex-col rounded-2xl border border-l-4 border-border bg-card p-4 text-left card-soft transition hover:-translate-y-0.5 hover:border-primary/45 hover:bg-primary/8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60',
        featured && 'border-primary/35 bg-primary/8'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase', meta.soft)}>{meta.label}</span>
          <h4 className="mt-3 font-display text-xl font-extrabold">{item.title}</h4>
        </div>
        <BookOpen className="size-5" style={{ color: meta.color }} />
      </div>
      <p className="mt-3 line-clamp-3 text-sm font-semibold leading-relaxed text-muted-foreground">{item.description}</p>
      <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-4">
        <p className="text-xs font-bold text-muted-foreground">{detailMeta}</p>
        <span className="rounded-full bg-background px-3 py-1 text-xs font-extrabold text-primary">Open page</span>
      </div>
    </button>
  )
}

function ContentReaderPage({ item, onBack }: { item: PrepCatContentItem; onBack: () => void }) {
  const [markdown, setMarkdown] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setMarkdown('')
    fetch(`${import.meta.env.BASE_URL}prepcatcontent/${item.file}`)
      .then((response) => response.ok ? response.text() : Promise.reject(new Error('Content unavailable')))
      .then((text) => {
        if (!cancelled) setMarkdown(cleanPrepCatMarkdown(text, item))
      })
      .catch(() => {
        if (!cancelled) setMarkdown('Unable to load this PrepCat page yet.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [item])

  const meta = SECTION_META[item.section]
  const sourceHref = `${import.meta.env.BASE_URL}prepcatcontent/${item.file}`

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-2 text-sm font-extrabold text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
      >
        <ArrowLeft className="size-4" />
        Back to Content
      </button>

      <article className="overflow-hidden rounded-3xl border border-border bg-card card-soft">
        <header className="border-b border-border bg-muted/10 px-5 py-5 md:px-7">
          <div className="flex flex-wrap gap-2">
            <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase', meta.soft)}>{meta.label}</span>
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-extrabold uppercase text-muted-foreground">
              {CONTENT_TYPE_LABELS[item.type] ?? item.sourceType}
            </span>
          </div>
          <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <h2 className="font-display text-3xl font-extrabold">{item.title}</h2>
              <div className="mt-2 flex flex-wrap gap-2">
                {item.meta.split('·').map((piece) => (
                  <span key={piece.trim()} className="rounded-full border border-border bg-card px-2.5 py-1 text-xs font-bold text-muted-foreground">
                    {piece.trim()}
                  </span>
                ))}
              </div>
              <p className="mt-3 max-w-4xl text-sm font-semibold leading-relaxed text-muted-foreground">{item.description}</p>
            </div>
            <Button asChild variant="outline" size="sm" className="self-start lg:self-auto">
              <a href={sourceHref} target="_blank" rel="noreferrer">Open source</a>
            </Button>
          </div>
        </header>
        <div className="min-h-[34rem] bg-card px-5 py-6 md:px-7">
          <div className="mx-auto max-w-4xl">
            {loading ? (
              <p className="text-sm font-semibold text-muted-foreground">Loading PrepCat content...</p>
            ) : (
              <MarkdownPreview markdown={markdown} />
            )}
          </div>
        </div>
      </article>
    </div>
  )
}

function cleanPrepCatMarkdown(markdown: string, item?: PrepCatContentItem) {
  const cleaned = markdown
    .replace(/^---[\s\S]*?---\s*/, '')
    .replace(/^(Guide|Cheat sheet|BIO & BIOCHEM|CHEM\/PHYS|CARS|PSYCH\/SOC|~\d+ min read)\s*$/gim, '')
    .trim()
  if (!item) return cleaned

  const title = item.title.toLowerCase()
  const description = item.description.toLowerCase()
  return cleaned
    .split('\n')
    .filter((line) => {
      const stripped = line.replace(/^#{1,3}\s+/, '').trim().toLowerCase()
      return stripped !== title && stripped !== description
    })
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function MarkdownPreview({ markdown }: { markdown: string }) {
  const blocks = parsePrepCatBlocks(markdown)
  return (
    <div className="space-y-4">
      {blocks.map((block, index) => {
        if (block.kind === 'space') return <div key={index} className="h-1" />
        if (block.kind === 'heading') {
          const Tag = block.level === 1 ? 'h1' : block.level === 2 ? 'h2' : 'h3'
          return (
            <Tag
              key={index}
              className={cn(
                'font-display font-extrabold leading-tight text-foreground',
                block.level === 1 && 'text-3xl',
                block.level === 2 && 'mt-8 border-t border-border pt-6 text-2xl first:mt-0 first:border-t-0 first:pt-0',
                block.level === 3 && 'pt-3 text-lg'
              )}
            >
              {block.text}
            </Tag>
          )
        }
        if (block.kind === 'contents') {
          return (
            <div key={index} className="rounded-2xl border border-border bg-muted/20 p-4">
              <p className="text-xs font-extrabold uppercase tracking-wide text-muted-foreground">On this page</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {block.items.map((item) => (
                  <div key={item} className="rounded-xl border border-border bg-card px-3 py-2 text-sm font-bold leading-snug text-foreground">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          )
        }
        if (block.kind === 'callout') {
          return (
            <div key={index} className={cn(
              'rounded-2xl border px-4 py-3 text-sm font-semibold leading-relaxed',
              block.tone === 'trap'
                ? 'border-destructive/30 bg-destructive/10 text-foreground'
                : block.tone === 'tip'
                  ? 'border-leaf/30 bg-leaf/10 text-foreground'
                  : 'border-primary/25 bg-primary/10 text-foreground'
            )}>
              <p className="mb-1 text-[10px] font-extrabold uppercase tracking-wide text-muted-foreground">{block.label}</p>
              <p>{block.text}</p>
            </div>
          )
        }
        if (block.kind === 'worked-example') {
          return (
            <div key={index} className="overflow-hidden rounded-2xl border border-primary/25 bg-primary/8">
              <div className="border-b border-primary/15 bg-primary/10 px-4 py-3">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-primary">Worked example</p>
              </div>
              <div className="grid gap-0 md:grid-cols-[0.95fr_1.25fr]">
                <div className="border-b border-primary/15 p-4 md:border-b-0 md:border-r">
                  <p className="mb-2 text-[10px] font-extrabold uppercase tracking-wide text-muted-foreground">Question</p>
                  <p className="text-sm font-semibold leading-7 text-foreground">{block.prompt}</p>
                </div>
                <div className="p-4">
                  <p className="mb-2 text-[10px] font-extrabold uppercase tracking-wide text-muted-foreground">Walkthrough</p>
                  {block.explanation ? (
                    <div className="space-y-3">
                      {block.explanation.split(/\n{2,}/).map((paragraph, paragraphIndex) => (
                        <p key={paragraphIndex} className="text-sm font-medium leading-7 text-muted-foreground">{paragraph}</p>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm font-medium leading-7 text-muted-foreground">Work through the prompt, then compare with the surrounding guide explanation.</p>
                  )}
                </div>
              </div>
            </div>
          )
        }
        if (block.kind === 'formula') {
          return (
            <div key={index} className="rounded-2xl border border-primary/20 bg-primary/8 p-3">
              <div className="space-y-2">
                {block.lines.map((line, lineIndex) => (
                  <FormulaLine key={`${index}-${lineIndex}`} line={line} />
                ))}
              </div>
            </div>
          )
        }
        if (block.kind === 'table') {
          const [head, ...rows] = block.rows
          return (
            <div key={index} className="overflow-x-auto rounded-2xl border border-border bg-card">
              <table className="w-full min-w-[34rem] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/35">
                    {head.map((cell, cellIndex) => <th key={cellIndex} className="px-3 py-2 text-xs font-extrabold uppercase tracking-wide text-muted-foreground">{cell}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, rowIndex) => (
                    <tr key={rowIndex} className="border-b border-border/70 last:border-0">
                      {row.map((cell, cellIndex) => <td key={cellIndex} className="px-3 py-2 align-top font-semibold leading-relaxed text-muted-foreground">{cell}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        }
        if (block.kind === 'list') {
          return (
            <ul key={index} className="space-y-2 rounded-2xl border border-border bg-muted/20 px-4 py-3">
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex} className="flex gap-2 text-sm font-semibold leading-relaxed text-muted-foreground">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          )
        }
        return <p key={index} className="max-w-3xl text-[0.95rem] font-medium leading-7 text-muted-foreground">{block.text}</p>
      })}
    </div>
  )
}

type PrepCatBlock =
  | { kind: 'space' }
  | { kind: 'heading'; level: 1 | 2 | 3; text: string }
  | { kind: 'contents'; items: string[] }
  | { kind: 'paragraph'; text: string }
  | { kind: 'list'; items: string[] }
  | { kind: 'table'; rows: string[][] }
  | { kind: 'formula'; lines: string[] }
  | { kind: 'callout'; label: string; text: string; tone: 'key' | 'tip' | 'trap' }
  | { kind: 'worked-example'; prompt: string; explanation: string }

function parsePrepCatBlocks(markdown: string): PrepCatBlock[] {
  const rawLines = markdown.split('\n')
  const blocks: PrepCatBlock[] = []
  let i = 0

  while (i < rawLines.length) {
    const line = rawLines[i]
    const trimmed = line.trim()

    if (!trimmed) {
      if (blocks.at(-1)?.kind !== 'space') blocks.push({ kind: 'space' })
      i += 1
      continue
    }

    if (trimmed === '→' || trimmed === '!') {
      const next = rawLines[i + 1]?.trim()
      if (next) {
        blocks.push({
          kind: 'callout',
          label: trimmed === '!' ? 'Watch' : 'Shortcut',
          text: next,
          tone: trimmed === '!' ? 'trap' : 'tip',
        })
        i += 2
        continue
      }
    }

    if (isWorkedExampleLabel(trimmed)) {
      const example = collectWorkedExample(rawLines, i + 1)
      if (example.prompt) {
        blocks.push({ kind: 'worked-example', prompt: example.prompt, explanation: example.explanation })
        i = example.nextIndex
        continue
      }
    }

    const heading = /^(#{1,3})\s+(.+)$/.exec(trimmed)
    if (heading) {
      const text = heading[2].trim()
      if (text.toUpperCase() === 'ON THIS PAGE') {
        const contents = collectContents(rawLines, i + 1)
        if (contents.items.length) blocks.push({ kind: 'contents', items: contents.items })
        i = contents.nextIndex
        continue
      }
      const calloutTone = calloutHeadingTone(text)
      if (isWorkedExampleLabel(text)) {
        const example = collectWorkedExample(rawLines, i + 1)
        if (example.prompt) {
          blocks.push({ kind: 'worked-example', prompt: example.prompt, explanation: example.explanation })
          i = example.nextIndex
          continue
        }
      }
      if (calloutTone) {
        const next = collectUntilBreak(rawLines, i + 1)
        if (next.text) {
          blocks.push({ kind: 'callout', label: text, text: next.text, tone: calloutTone })
          i = next.nextIndex
          continue
        }
      }
      blocks.push({ kind: 'heading', level: Math.min(heading[1].length, 3) as 1 | 2 | 3, text })
      i += 1
      continue
    }

    if (isTableLine(trimmed)) {
      const rows: string[][] = []
      while (i < rawLines.length && isTableLine(rawLines[i].trim())) {
        rows.push(rawLines[i].trim().split(/\t+/).map((cell) => cell.trim()).filter(Boolean))
        i += 1
      }
      if (rows.length > 1 && rows[0].length > 1) {
        blocks.push({ kind: 'table', rows })
        continue
      }
    }

    if (/^[-*]\s+/.test(trimmed)) {
      const items: string[] = []
      while (i < rawLines.length && /^[-*]\s+/.test(rawLines[i].trim())) {
        items.push(rawLines[i].trim().replace(/^[-*]\s+/, ''))
        i += 1
      }
      blocks.push({ kind: 'list', items })
      continue
    }

    if (isFormulaLine(trimmed)) {
      const formulas: string[] = []
      while (i < rawLines.length && isFormulaLine(rawLines[i].trim())) {
        formulas.push(rawLines[i].trim())
        i += 1
      }
      blocks.push({ kind: 'formula', lines: formulas })
      continue
    }

    blocks.push({ kind: 'paragraph', text: trimmed })
    i += 1
  }

  return blocks.filter((block, index, all) => !(block.kind === 'space' && (index === 0 || index === all.length - 1)))
}

function collectContents(lines: string[], startIndex: number) {
  const items: string[] = []
  let index = startIndex

  while (index < lines.length) {
    const trimmed = lines[index].trim()
    if (!trimmed) {
      index += 1
      continue
    }

    const heading = /^#{1,3}\s+(.+)$/.exec(trimmed)
    if (!heading) break

    const text = heading[1].trim()
    if (calloutHeadingTone(text)) break

    items.push(text)
    index += 1
  }

  return { items, nextIndex: index }
}

function collectWorkedExample(lines: string[], startIndex: number) {
  const paragraphs: string[] = []
  let buffer: string[] = []
  let index = startIndex

  const flush = () => {
    if (buffer.length) {
      paragraphs.push(buffer.join(' '))
      buffer = []
    }
  }

  while (index < lines.length) {
    const trimmed = lines[index].trim()

    if (!trimmed) {
      flush()
      index += 1
      continue
    }

    if (
      /^#{1,3}\s+/.test(trimmed)
      || isWorkedExampleLabel(trimmed)
      || isStandaloneCalloutLabel(trimmed)
    ) {
      break
    }

    buffer.push(trimmed)
    index += 1
  }

  flush()

  return {
    prompt: paragraphs[0] ?? '',
    explanation: paragraphs.slice(1).join('\n\n'),
    nextIndex: index,
  }
}

function FormulaLine({ line }: { line: string }) {
  const pieces = line.split(/\s{2,}/).map((piece) => piece.trim()).filter(Boolean)
  return (
    <div className="flex flex-wrap gap-2">
      {pieces.map((piece, index) => {
        const [formula, note] = piece.split(/←|—/, 2).map((part) => part.trim())
        return (
          <span key={index} className="inline-flex min-h-8 items-center gap-2 rounded-xl border border-border bg-card px-3 py-1.5 font-mono text-sm font-bold text-foreground shadow-sm">
            <span>{renderMathText(formula)}</span>
            {note && <span className="font-sans text-xs font-semibold text-muted-foreground">{note}</span>}
          </span>
        )
      })}
    </div>
  )
}

function renderMathText(text: string) {
  const nodes: ReactNode[] = []
  const tokenPattern = /([_^])(?:\{([^}]+)\}|([A-Za-z]+[A-Za-z0-9]*|-?\d+))/g
  let cursor = 0
  let match: RegExpExecArray | null

  while ((match = tokenPattern.exec(text)) !== null) {
    if (match.index > cursor) nodes.push(text.slice(cursor, match.index))

    const marker = match[1]
    const value = match[2] ?? match[3] ?? ''
    const key = `${marker}-${match.index}-${value}`

    nodes.push(
      marker === '_' ? (
        <sub key={key} className="text-[0.72em] leading-none">
          {value}
        </sub>
      ) : (
        <sup key={key} className="text-[0.72em] leading-none">
          {value}
        </sup>
      ),
    )

    cursor = tokenPattern.lastIndex
  }

  if (cursor < text.length) nodes.push(text.slice(cursor))
  return nodes
}

function calloutHeadingTone(text: string): 'key' | 'tip' | 'trap' | null {
  const normalized = text.trim().toUpperCase()
  if (normalized === 'KEY' || normalized === 'KEY ESSENTIALS') return 'key'
  if (normalized === 'TIP') return 'tip'
  if (normalized === 'TRAP') return 'trap'
  return null
}

function isWorkedExampleLabel(text: string) {
  return text.trim().toUpperCase() === 'WORKED EXAMPLE'
}

function isStandaloneCalloutLabel(text: string) {
  return ['KEY', 'KEY ESSENTIALS', 'TIP', 'TRAP'].includes(text.trim().toUpperCase())
}

function collectUntilBreak(lines: string[], startIndex: number) {
  const parts: string[] = []
  let index = startIndex
  while (index < lines.length) {
    const trimmed = lines[index].trim()
    if (!trimmed) break
    if (/^#{1,3}\s+/.test(trimmed) || isTableLine(trimmed) || isFormulaLine(trimmed)) break
    parts.push(trimmed)
    index += 1
  }
  return { text: parts.join(' '), nextIndex: index }
}

function isTableLine(line: string) {
  return line.includes('\t') && line.split(/\t+/).filter((cell) => cell.trim()).length >= 2
}

function isFormulaLine(line: string) {
  if (!line || line.length > 140) return false
  if (/^#{1,3}\s+/.test(line) || /^[-*]\s+/.test(line)) return false
  if (line === '→' || line === '!') return false
  return /(?:=|≈|≤|≥|<|>|Σ|Δ|μ|θ|τ|π|√|²|₀|ₓ|ᵧ|₁|₂|₃|\/)/.test(line) && /[A-Za-z0-9]/.test(line)
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="mb-0.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{label}</p>
      {children}
    </div>
  )
}

function parseOptionalNumber(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return undefined
  const parsed = Number(trimmed)
  return Number.isFinite(parsed) ? parsed : undefined
}

function buildSectionReadiness(attempts: ReturnType<typeof useStore.getState>['mcat']['attempts']) {
  const latest = [...attempts].reverse().find((a) => a.cp || a.cars || a.bb || a.ps)
  const fallback: Record<SectionKey, number> = { bb: 30, cp: 39, cars: 45, ps: 42 }
  return (Object.keys(SECTION_META) as SectionKey[]).map((key) => {
    const raw = latest?.[key]
    const now = raw ? Math.max(10, Math.min(95, Math.round(((raw - 118) / 14) * 100))) : fallback[key]
    return { key, now, projected: Math.min(96, now + (key === 'bb' ? 23 : 14)) }
  })
}

function lowestSectionLabel(sectionReadiness: ReturnType<typeof buildSectionReadiness>) {
  const lowest = [...sectionReadiness].sort((a, b) => a.now - b.now)[0]
  return lowest ? SECTION_META[lowest.key].label : 'your weakest section'
}

function sectionColorByLabel(label: string) {
  if (label === 'Needs classification') return '#e4a24f'
  return Object.values(SECTION_META).find((s) => s.label === label)?.color ?? 'var(--primary)'
}

function rankTopics(errorLog: ReturnType<typeof useStore.getState>['mcat']['errorLog']) {
  const counts = new Map<string, number>()
  for (const miss of errorLog) {
    if (miss.section === 'Needs classification') continue
    const topic = miss.topic?.trim()
    if (topic) counts.set(topic, (counts.get(topic) ?? 0) + 1)
  }
  if (counts.size === 0) {
    return [
      { topic: 'Cell signaling', count: 3 },
      { topic: 'Electrochemistry', count: 2 },
      { topic: 'CARS tone shifts', count: 2 },
    ]
  }
  return [...counts.entries()].map(([topic, count]) => ({ topic, count })).sort((a, b) => b.count - a.count).slice(0, 6)
}

function advisorResponse(prompt: string) {
  if (prompt.includes('falling')) return 'Okay. I would protect one rest day, move two Bio/Biochem catch-up blocks earlier, and convert one content block into error-log review so the debt shrinks instead of hiding.'
  if (prompt.includes('lighter')) return 'I would cap weekdays at 90 minutes, keep the weekend full-length review, and move low-yield content into next week’s optional buffer.'
  return 'For exam week, I would lower new content, prioritize class exam prep, and keep MCAT work to CARS maintenance plus Anki reviews.'
}
