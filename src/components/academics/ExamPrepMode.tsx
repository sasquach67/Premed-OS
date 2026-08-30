import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, BookOpen, CheckCircle2, Clock3, Flag, ListChecks, Plus, RotateCcw, Target } from 'lucide-react'
import type { ClassAssignment, ClassCenterData, Course, ExamPrepIntensity, ExamPrepPlan, ExamPrepPlanItem, GeneratedMockAttempt } from '@/lib/types'
import { uid } from '@/lib/id'
import { buildExamPrepPlan, applyCatchUpProposal, closeExamPrepPlan, getCatchUpProposal } from '@/lib/academics/examPrep'
import { useStore } from '@/store/store'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  endGeneratedMock,
  formatGeneratedMockElapsed,
  fullMockDormantReasons,
  generatedMockElapsedSeconds,
  generatedMockResumeIndex,
  startGeneratedMock,
} from '@/lib/academics/fullMock'
import { generateFullMock } from '@/lib/academics/generateFullMock'
import { useToast } from '@/components/common/useToast'
import { WeeklyCapacityCard } from '@/components/common/WeeklyCapacityCard'
import { isCapacityCaptured, weeklyCapacityTotal } from '@/store/migrations/shellV9'

interface ExamPrepModeProps {
  course: Course
  data: ClassCenterData
  exam: ClassAssignment
  onExit: () => void
  onOpenTab: (tab: 'materials' | 'topics' | 'assignments') => void
}

const paceCopy: Record<ExamPrepIntensity, { label: string; detail: string }> = {
  accelerated: { label: 'Accelerated', detail: 'Front-loads the recorded scope into the first available days.' },
  steady: { label: 'Steady', detail: 'Spreads the same recorded scope across the available days.' },
}

function todayIso() {
  const date = new Date()
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
  return local.toISOString().slice(0, 10)
}

function dateLabel(value: string) {
  return new Date(`${value}T12:00:00`).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
}

export function ExamPrepMode({ course, data, exam, onExit, onOpenTab }: ExamPrepModeProps) {
  const update = useStore((state) => state.update)
  const weeklyCapacity = useStore((state) => state.settings.weeklyCapacity)
  const existing = data.examPrepPlans.find((plan) => plan.courseId === course.id && plan.examAssignmentId === exam.id)
  const [draftIntensity, setDraftIntensity] = useState<ExamPrepIntensity>(existing?.intensity ?? 'accelerated')
  const [manualLabel, setManualLabel] = useState('')
  const [closeoutOpen, setCloseoutOpen] = useState(false)
  const [returnedGrade, setReturnedGrade] = useState(existing?.returnedGrade ?? '')
  const [feedback, setFeedback] = useState(existing?.feedback ?? '')
  const [mockBusy, setMockBusy] = useState(false)
  const [capacityOpen, setCapacityOpen] = useState(false)
  const [continueWithoutCapacity, setContinueWithoutCapacity] = useState(false)
  const toast = useToast()
  const courseTopics = data.topics.filter((item) => item.courseId === course.id)
  const scopedChunkIds = new Set(data.files.filter((file) => file.courseId === course.id && (exam.coveredTopicIds ?? []).some((id) => file.linkedTopicIds.includes(id))).map((file) => file.id))
  // A full mock is allowed to read only files explicitly linked to this
  // exam's covered topics. Falling back to every course chunk when no linked
  // file exists silently widens the exam contract and can test material the
  // student never selected.
  const mockChunks = data.sourceChunks.filter((chunk) => chunk.courseId === course.id && scopedChunkIds.has(chunk.fileId))
  const mockDormant = fullMockDormantReasons(exam, courseTopics, mockChunks)
  const activeMock = data.generatedMockAttempts.find((attempt) => attempt.courseId === course.id && attempt.examAssignmentId === exam.id && !attempt.endedAt)
  const completedMock = data.generatedMockAttempts.find((attempt) => attempt.courseId === course.id && attempt.examAssignmentId === exam.id && attempt.endedAt)
  const capacityCaptured = isCapacityCaptured(weeklyCapacity)
  const capacityTotal = weeklyCapacityTotal(weeklyCapacity)

  const preview = useMemo(() => buildExamPrepPlan({
    id: `exam-prep-${exam.id}`,
    courseId: course.id,
    exam,
    topics: data.topics.filter((item) => item.courseId === course.id),
    assignments: data.assignments.filter((item) => item.courseId === course.id),
    files: data.files.filter((item) => item.courseId === course.id),
    intensity: draftIntensity,
  }), [course.id, data.assignments, data.files, data.topics, draftIntensity, exam])
  const catchUp = existing ? getCatchUpProposal(existing, todayIso()) : null
  const isClosed = Boolean(existing?.closedAt)

  function persistPlan() {
    if (!preview.plan) return
    update((draft) => {
      draft.academics.classCenter.examPrepPlans.push(preview.plan!)
    })
  }

  function setIntensity(intensity: ExamPrepIntensity) {
    setDraftIntensity(intensity)
    if (!existing) return
    update((draft) => {
      const plan = draft.academics.classCenter.examPrepPlans.find((item) => item.id === existing.id)
      if (plan) Object.assign(plan, { intensity, updatedAt: Date.now() })
    })
  }

  function patchItem(id: string, patch: Partial<ExamPrepPlanItem>) {
    if (!existing) return
    update((draft) => {
      const item = draft.academics.classCenter.examPrepPlans.find((plan) => plan.id === existing.id)?.items.find((row) => row.id === id)
      if (item) Object.assign(item, patch, { updatedAt: Date.now() })
    })
  }

  function addManualItem() {
    if (!existing || !manualLabel.trim()) return
    update((draft) => {
      const plan = draft.academics.classCenter.examPrepPlans.find((item) => item.id === existing.id)
      if (!plan) return
      const now = Date.now()
      plan.items.push({
        id: uid(), owner: 'manual', manualLabel: manualLabel.trim(), plannedDate: todayIso(),
        order: plan.items.length, state: 'planned', createdAt: now, updatedAt: now,
      })
      plan.updatedAt = now
    })
    setManualLabel('')
  }

  function applyCatchUp() {
    if (!existing || !catchUp) return
    update((draft) => {
      const index = draft.academics.classCenter.examPrepPlans.findIndex((item) => item.id === existing.id)
      if (index >= 0) draft.academics.classCenter.examPrepPlans[index] = applyCatchUpProposal(draft.academics.classCenter.examPrepPlans[index], catchUp)
    })
  }

  function closePlan() {
    if (!existing) return
    update((draft) => {
      const index = draft.academics.classCenter.examPrepPlans.findIndex((item) => item.id === existing.id)
      if (index >= 0) draft.academics.classCenter.examPrepPlans[index] = closeExamPrepPlan(draft.academics.classCenter.examPrepPlans[index], { returnedGrade, feedback })
    })
    setCloseoutOpen(false)
  }

  async function startMock() {
    if (mockDormant.length) return
    setMockBusy(true)
    const outcome = await generateFullMock({ courseId: course.id, chunks: mockChunks, label: exam.title })
    setMockBusy(false)
    if (!outcome.ok || !outcome.questions || !outcome.specHash) { toast({ title: 'Mock not started', description: outcome.message ?? 'Nothing was saved.' }); return }
    update((draft) => {
      const attempts = draft.academics.classCenter.generatedMockAttempts
      attempts.unshift(startGeneratedMock({ id: uid(), courseId: course.id, examAssignmentId: exam.id, topicIds: exam.coveredTopicIds ?? [], sourceChunkIds: mockChunks.map((chunk) => chunk.id), specId: 'class-full-mock-v1', specHash: outcome.specHash!, questions: outcome.questions!, startedAt: Date.now() }))
    })
  }

  if (activeMock) return <FullMockRunner attempt={activeMock} course={course} exam={exam} data={data} onExit={onExit} />

  if (!exam.dueDate) {
    return <main className="mx-auto max-w-4xl space-y-5 px-4 py-6 sm:px-6" aria-labelledby="exam-prep-title">
      <Button variant="ghost" onClick={onExit}><ArrowLeft className="size-4" /> Back to {course.code}</Button>
      <Card><CardHeader><CardTitle id="exam-prep-title" className="font-display text-2xl">Date this exam first</CardTitle></CardHeader><CardContent className="space-y-4 text-muted-foreground">
        <p>{exam.title} is recorded, but it has no exam date yet. Exam Prep only assembles work around a dated exam.</p>
        <Button onClick={() => onOpenTab('assignments')}><Target className="size-4" /> Open assignments</Button>
      </CardContent></Card>
    </main>
  }

  return <main className="min-h-full bg-background" aria-labelledby="exam-prep-title">
    <section className="relative overflow-hidden border-b border-border bg-gradient-to-br from-primary/22 via-card to-card">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,hsl(var(--primary)/0.18),transparent_36%)]" aria-hidden="true" />
      <div className="relative mx-auto max-w-6xl px-4 py-5 sm:px-6 lg:px-8">
        <Button variant="ghost" className="mb-4 text-foreground" onClick={onExit}><ArrowLeft className="size-4" /> Back to {course.code}</Button>
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div><p className="text-xs font-extrabold uppercase tracking-[0.16em] text-primary">Exam prep mode</p><h1 id="exam-prep-title" className="mt-1 font-display text-3xl font-extrabold tracking-tight">{exam.title}</h1><p className="mt-1 text-sm font-semibold text-muted-foreground">{course.code} · {dateLabel(exam.dueDate)}</p></div>
          <div className="glass-surface rounded-2xl px-4 py-3 text-sm shadow-sm"><p className="font-extrabold">Finish time</p><p className="mt-0.5 text-muted-foreground">Set your own study window per day—no time is assumed.</p></div>
        </div>
      </div>
    </section>

    <div className="mx-auto grid max-w-6xl gap-5 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_18rem] lg:px-8">
      <section className="space-y-5">
        {isClosed ? <ClosedPlan plan={existing!} onExit={onExit} /> : <>
          {capacityOpen && <WeeklyCapacityCard />}
          <Card className="border-primary/20 shadow-md"><CardHeader className="gap-3 sm:flex-row sm:items-center sm:justify-between"><div><CardTitle className="font-display text-2xl">Today’s plan</CardTitle><p className="mt-1 text-sm text-muted-foreground">Only recorded class work appears here. Completing it ends today’s ask.</p></div>{existing ? <Badge variant="outline">{paceCopy[existing.intensity].label}</Badge> : null}</CardHeader>
            <CardContent className="space-y-4">
              {!existing ? <PlanPreview preview={preview} onOpenTab={onOpenTab} onCreate={persistPlan} capacityReady={capacityCaptured || continueWithoutCapacity} /> : <PlanRows plan={existing} data={data} onOpenTab={onOpenTab} onPatch={patchItem} />}
              {existing && <div className="flex flex-col gap-2 border-t border-border pt-4 sm:flex-row"><Input value={manualLabel} onChange={(event) => setManualLabel(event.target.value)} placeholder="Add a specific study task" aria-label="Manual study task" /><Button variant="outline" onClick={addManualItem} disabled={!manualLabel.trim()}><Plus className="size-4" /> Add task</Button></div>}
            </CardContent>
          </Card>
          {catchUp && <Card className="border-amber-500/30"><CardHeader><CardTitle className="flex items-center gap-2 text-lg"><RotateCcw className="size-5 text-amber-600" /> Catch-up proposal</CardTitle></CardHeader><CardContent className="space-y-3 text-sm text-muted-foreground"><p>{catchUp.missedItemIds.length} planned item{catchUp.missedItemIds.length === 1 ? '' : 's'} passed without being marked complete. Nothing has moved automatically.</p><p>Applying this records the missed work as unscheduled; it does not add a backlog or change later rows.</p><Button variant="outline" onClick={applyCatchUp}>Apply this plan change</Button></CardContent></Card>}
          {existing && <Card><CardHeader><CardTitle className="text-lg">After the exam</CardTitle></CardHeader><CardContent><p className="mb-3 text-sm text-muted-foreground">When it is over, you can keep a factual returned grade or feedback note here. Nothing is predicted.</p><Button variant="outline" onClick={() => setCloseoutOpen((open) => !open)}>{closeoutOpen ? 'Hide closeout' : 'Close this plan'}</Button>{closeoutOpen && <div className="mt-4 space-y-3"><Input value={returnedGrade} onChange={(event) => setReturnedGrade(event.target.value)} placeholder="Returned grade (optional)" /><Textarea value={feedback} onChange={(event) => setFeedback(event.target.value)} placeholder="What would you revisit next time? (optional)" /><Button onClick={closePlan}>Save closeout</Button></div>}</CardContent></Card>}
          {completedMock && <MockAutopsy attempt={completedMock} data={data} onOpenTab={onOpenTab} />}
        </>}
      </section>
      <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
        <Card><CardHeader><CardTitle className="text-lg">Pace</CardTitle></CardHeader><CardContent className="space-y-2">{(['accelerated', 'steady'] as const).map((intensity) => <button key={intensity} type="button" onClick={() => setIntensity(intensity)} className={cn('w-full rounded-xl border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring', (existing?.intensity ?? draftIntensity) === intensity ? 'border-primary bg-primary/10' : 'border-border bg-muted hover:bg-muted/45')}><span className="font-extrabold">{paceCopy[intensity].label}</span><span className="mt-1 block text-xs leading-relaxed text-muted-foreground">{paceCopy[intensity].detail}</span></button>)}</CardContent></Card>
        <Card><CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Clock3 className="size-4 text-primary" /> Study availability</CardTitle></CardHeader><CardContent className="space-y-3 text-sm text-muted-foreground">
          {capacityCaptured ? <><p><strong className="text-foreground">{capacityTotal}h a week</strong> is shared by Academics and MCAT.</p><Button size="sm" variant="outline" onClick={() => setCapacityOpen((open) => !open)}>{capacityOpen ? 'Hide availability' : 'Edit availability'}</Button></> : <><p>No weekly availability is recorded. Set it before building the plan, or continue with an un-timed plan.</p><div className="flex flex-wrap gap-2"><Button size="sm" onClick={() => setCapacityOpen(true)}>Set study hours</Button><Button size="sm" variant="ghost" onClick={() => setContinueWithoutCapacity(true)}>Continue without it</Button></div>{continueWithoutCapacity && <Badge variant="outline">Un-timed plan</Badge>}</>}
        </CardContent></Card>
        <Card><CardHeader><CardTitle className="text-lg">Exam scope</CardTitle></CardHeader><CardContent className="space-y-2 text-sm text-muted-foreground"><p>{exam.coveredTopicIds?.length ? `${exam.coveredTopicIds.length} linked topic${exam.coveredTopicIds.length === 1 ? '' : 's'} recorded for this exam.` : 'No linked topics recorded yet.'}</p><Button size="sm" variant="outline" onClick={() => onOpenTab('topics')}><Target className="size-4" /> Open topics</Button></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-lg">Full mock</CardTitle></CardHeader><CardContent className="space-y-3 text-sm text-muted-foreground">{mockDormant.length ? <><p>Not ready yet: {mockDormant.join(', ')}.</p><Button size="sm" variant="outline" onClick={() => onOpenTab(mockDormant.includes('study-material') ? 'materials' : 'topics')}>Resolve missing evidence</Button></> : <><p>Generated only from this exam’s linked student material. It is not a professor or past exam.</p><Button size="sm" onClick={startMock} disabled={mockBusy}>{mockBusy ? 'Building…' : 'Start full mock'}</Button></>}{completedMock && <p className="border-t border-border pt-3 text-xs">A completed attempt is available below for source-based review.</p>}</CardContent></Card>
      </aside>
    </div>
  </main>
}

function MockAutopsy({ attempt, data, onOpenTab }: { attempt: GeneratedMockAttempt; data: ClassCenterData; onOpenTab: ExamPrepModeProps['onOpenTab'] }) {
  const actionable = attempt.questions.filter((question) => attempt.flaggedQuestionIds.includes(question.id) || !attempt.answers[question.id]?.trim())
  return <Card className="border-primary/20"><CardHeader><CardTitle className="text-lg">Post-mock autopsy</CardTitle><p className="mt-1 text-sm text-muted-foreground">Only unanswered or self-flagged evidence appears here. This is not a score or exam forecast.</p></CardHeader><CardContent className="space-y-3">
    {!actionable.length && <div className="rounded-[13px] border border-dashed border-border p-4 text-sm text-muted-foreground"><p className="font-bold text-foreground">Nothing was flagged or left unanswered.</p><p className="mt-1">The attempt remains saved, but there is no weakness claim to infer.</p></div>}
    {actionable.map((question) => {
      const topic = question.topicId ? data.topics.find((item) => item.id === question.topicId) : undefined
      const chunk = data.sourceChunks.find((item) => item.id === question.sourceChunkId)
      const file = chunk ? data.files.find((item) => item.id === chunk.fileId) : undefined
      const unanswered = !attempt.answers[question.id]?.trim()
      return <div key={question.id} className="grid gap-3 rounded-[13px] border border-border bg-muted/20 p-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"><div><div className="flex flex-wrap items-center gap-2"><p className="font-bold">{topic?.title ?? 'Question evidence'}</p><Badge variant={unanswered ? 'warning' : 'outline'}>{unanswered ? 'Unanswered' : 'Self-flagged'}</Badge></div><p className="mt-1 text-sm text-muted-foreground">{question.prompt}</p><p className="mt-2 text-xs font-semibold text-primary">Source: {file?.title ?? 'Selected course material'}</p></div><div className="flex flex-wrap gap-2">{topic && <Button size="sm" variant="outline" onClick={() => onOpenTab('topics')}><Target className="size-4" /> Review topic</Button>}{file && <Button size="sm" variant="outline" onClick={() => onOpenTab('materials')}><BookOpen className="size-4" /> Open source</Button>}</div></div>
    })}
  </CardContent></Card>
}

function FullMockRunner({ attempt, course, exam, data, onExit }: { attempt: GeneratedMockAttempt; course: Course; exam: ClassAssignment; data: ClassCenterData; onExit: () => void }) {
  const update = useStore((state) => state.update)
  const [index, setIndex] = useState(() => generatedMockResumeIndex(attempt))
  const [elapsed, setElapsed] = useState(() => generatedMockElapsedSeconds(attempt))
  const question = attempt.questions[index]
  const chunk = data.sourceChunks.find((item) => item.id === question?.sourceChunkId)
  const source = chunk ? data.files.find((item) => item.id === chunk.fileId) : undefined
  const answer = attempt.answers[question.id] ?? ''
  useEffect(() => {
    const timer = window.setInterval(() => setElapsed(generatedMockElapsedSeconds(attempt)), 1_000)
    return () => window.clearInterval(timer)
  }, [attempt])
  function patch(patch: Partial<GeneratedMockAttempt>) { update((draft) => { const item = draft.academics.classCenter.generatedMockAttempts.find((row) => row.id === attempt.id); if (item) Object.assign(item, patch, { updatedAt: Date.now() }) }) }
  function visit(next: number) {
    const bounded = Math.max(0, Math.min(attempt.questions.length - 1, next))
    patch({ currentQuestionId: attempt.questions[bounded].id })
    setIndex(bounded)
  }
  function end() { update((draft) => { const at = draft.academics.classCenter.generatedMockAttempts.findIndex((row) => row.id === attempt.id); if (at >= 0) draft.academics.classCenter.generatedMockAttempts[at] = endGeneratedMock(draft.academics.classCenter.generatedMockAttempts[at]) }) }
  return <main className="fixed inset-0 z-50 overflow-y-auto bg-background" aria-labelledby="mock-question"><header className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b border-border bg-card px-5 py-3"><div><p className="font-display font-extrabold">{course.code} · {exam.title} practice set</p><p className="text-xs font-semibold text-muted-foreground">Generated only from selected course material</p></div><div className="flex items-center gap-3"><p role="timer" aria-label="Elapsed attempt time" className="font-display text-lg font-extrabold tabular-nums">{formatGeneratedMockElapsed(elapsed)}</p><Button variant="outline" size="sm" onClick={onExit}>Save and exit</Button><Button variant="destructive" size="sm" onClick={end}>End attempt</Button></div></header><section className="mx-auto grid max-w-5xl gap-5 px-5 py-10 lg:grid-cols-[minmax(0,1fr)_14rem]"><div className="rounded-2xl border border-border bg-card p-6 shadow-lg"><div className="flex items-center justify-between gap-4 text-xs font-extrabold uppercase tracking-[.14em] text-muted-foreground"><span>Practice question {index + 1}</span><span>{question.topicId ? 'Linked topic' : 'Selected source'}</span></div><h1 id="mock-question" className="mt-4 font-display text-2xl font-extrabold">{question.prompt}</h1><p className="mt-2 text-sm text-muted-foreground">Answer from what you know. There is no answer peek or pause in this attempt.</p><Textarea className="mt-6 min-h-40" value={answer} onChange={(event) => patch({ answers: { ...attempt.answers, [question.id]: event.target.value } })} placeholder="Write your answer" aria-label="Your answer" /><div className="mt-5 flex flex-wrap items-center justify-between gap-2"><Button variant="outline" disabled={index === 0} onClick={() => visit(index - 1)}>Previous</Button><Button variant="outline" aria-pressed={attempt.flaggedQuestionIds.includes(question.id)} onClick={() => patch({ flaggedQuestionIds: attempt.flaggedQuestionIds.includes(question.id) ? attempt.flaggedQuestionIds.filter((id) => id !== question.id) : [...attempt.flaggedQuestionIds, question.id] })}><Flag className="size-4" /> {attempt.flaggedQuestionIds.includes(question.id) ? 'Flagged' : 'Mark for review'}</Button><Button disabled={index === attempt.questions.length - 1} onClick={() => visit(index + 1)}>Next question</Button></div></div><aside className="rounded-2xl border border-border bg-muted/20 p-4 text-sm"><p className="font-extrabold">Source context</p><p className="mt-2 text-muted-foreground">{source?.title ?? 'Selected course material'}</p><p className="mt-3 text-xs text-muted-foreground">This is generated practice, not a professor-authored or past exam item.</p><p className="mt-6 border-t border-border pt-3 text-xs font-semibold text-muted-foreground">Your answer and place are saved as you work.</p></aside></section></main>
}

function PlanPreview({ preview, onOpenTab, onCreate, capacityReady }: { preview: ReturnType<typeof buildExamPrepPlan>; onOpenTab: ExamPrepModeProps['onOpenTab']; onCreate: () => void; capacityReady: boolean }) {
  if (!preview.plan) return <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">Add an exam date before starting a plan.</p>
  if (!preview.plan.items.length) return <div className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground"><p className="font-bold text-foreground">Nothing attributable to schedule yet.</p><p className="mt-1">Link topics or class materials first, then build this plan from them.</p><div className="mt-3 flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={() => onOpenTab('topics')}>Open topics</Button><Button size="sm" variant="outline" onClick={() => onOpenTab('materials')}>Open materials</Button></div></div>
  return <><p className="text-sm text-muted-foreground">{preview.plan.items.length} recorded item{preview.plan.items.length === 1 ? '' : 's'} will be arranged around this exam. You can adjust or add manual work after creating it.</p>{preview.dormant.length > 0 && <p className="text-xs font-semibold text-muted-foreground">Some evidence is still absent: {preview.dormant.join(', ')}.</p>}{!capacityReady && <p className="text-xs font-semibold text-amber-700 dark:text-amber-300">Set study availability or explicitly continue without it before creating the plan.</p>}<Button onClick={onCreate} disabled={!capacityReady}><ListChecks className="size-4" /> Create exam plan</Button></>
}

function PlanRows({ plan, data, onOpenTab, onPatch }: { plan: ExamPrepPlan; data: ClassCenterData; onOpenTab: ExamPrepModeProps['onOpenTab']; onPatch: (id: string, patch: Partial<ExamPrepPlanItem>) => void }) {
  const today = todayIso()
  const groups = plan.items.reduce<Record<string, ExamPrepPlanItem[]>>((all, item) => { (all[item.plannedDate] ??= []).push(item); return all }, {})
  const itemLabel = (item: ExamPrepPlanItem) => item.owner === 'manual' ? item.manualLabel ?? 'Manual task' : item.owner === 'topic' ? data.topics.find((topic) => topic.id === item.topicId)?.title ?? 'Removed topic' : item.owner === 'assignment' ? data.assignments.find((assignment) => assignment.id === item.assignmentId)?.title ?? 'Removed assignment' : data.files.find((file) => file.id === item.fileId)?.title ?? 'Removed material'
  const ownerTab = (item: ExamPrepPlanItem) => item.owner === 'topic' ? 'topics' : item.owner === 'assignment' ? 'assignments' : 'materials'
  if (!plan.items.length) return <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">This plan has no recorded scope yet. Add a manual task or link the exam to class topics.</p>
  return <div className="space-y-4">{Object.entries(groups).sort(([a], [b]) => a.localeCompare(b)).map(([date, items]) => <div key={date}><div className="mb-2 flex items-center justify-between"><p className="font-display font-extrabold">{date === today ? 'Today' : dateLabel(date)}</p><p className="text-xs font-semibold text-muted-foreground">Finish time not set</p></div><div className="space-y-2">{items.map((item) => <div key={item.id} className="flex items-center gap-3 rounded-xl border border-border bg-muted p-3"><input type="checkbox" className="size-4 accent-primary" checked={item.state === 'complete'} onChange={(event) => onPatch(item.id, event.target.checked ? { state: 'complete', completedAt: Date.now() } : { state: 'planned', completedAt: undefined })} aria-label={`Mark ${itemLabel(item)} complete`} /><div className="min-w-0 flex-1"><p className={cn('font-bold', item.state !== 'planned' && 'text-muted-foreground line-through')}>{itemLabel(item)}</p><p className="mt-0.5 text-xs text-muted-foreground">{item.owner === 'manual' ? 'Manual task' : 'From this class'}</p></div>{item.owner !== 'manual' && <Button size="sm" variant="ghost" onClick={() => onOpenTab(ownerTab(item))}>Open</Button>}</div>)}</div></div>)}</div>
}

function ClosedPlan({ plan, onExit }: { plan: ExamPrepPlan; onExit: () => void }) {
  return <Card className="mx-auto max-w-2xl"><CardHeader><CardTitle className="flex items-center gap-2 font-display text-2xl"><CheckCircle2 className="size-6 text-success" /> Plan closed</CardTitle></CardHeader><CardContent className="space-y-3 text-muted-foreground"><p>This plan is saved as a factual record of the work you chose to keep.</p>{plan.returnedGrade && <p><span className="font-bold text-foreground">Returned grade:</span> {plan.returnedGrade}</p>}{plan.feedback && <p><span className="font-bold text-foreground">Feedback:</span> {plan.feedback}</p>}<Button onClick={onExit}>Return to class workspace</Button></CardContent></Card>
}
