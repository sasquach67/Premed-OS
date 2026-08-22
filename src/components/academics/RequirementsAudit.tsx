import { useMemo, useState, type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AlertTriangle, ArrowUpRight, ChevronRight, FileText, Plus, ShieldCheck } from 'lucide-react'
import type { Course, RequirementItem, TranscriptCourseType } from '@/lib/types'
import { uid } from '@/lib/id'
import { addCatalogWarningAcknowledgements, isCatalogWarningAcknowledged } from '@/lib/academics/requirementsAudit'
import { useStore } from '@/store/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

type RequirementsView = 'audit' | 'requirements' | 'prior-credit'

const views: Array<{ id: RequirementsView; label: string }> = [
  { id: 'audit', label: 'Audit' },
  { id: 'requirements', label: 'All requirements' },
  { id: 'prior-credit', label: 'Prior credit' },
]

const officialAuditUrl = 'https://connectcarolina.unc.edu/'

function groupRequirements(requirements: RequirementItem[]) {
  const groups = new Map<string, RequirementItem[]>()
  for (const item of requirements) groups.set(item.group, [...(groups.get(item.group) ?? []), item])
  return [...groups.entries()]
}

function hasTranscriptFidelityGap(course: Course) {
  return !course.inResidence && !course.transcript
}

function sourceLabel(item: RequirementItem) {
  return item.sourceLabel || (item.sourceType === 'official' ? 'Official source' : 'Planning-library source')
}

export function RequirementsAudit() {
  const [searchParams, setSearchParams] = useSearchParams()
  const requirements = useStore((state) => state.requirements)
  const courses = useStore((state) => state.courses)
  const center = useStore((state) => state.academics.classCenter)
  const addItem = useStore((state) => state.addItem)
  const update = useStore((state) => state.update)
  const requestedView = searchParams.get('requirementsView')
  const view: RequirementsView = requestedView === 'requirements' || requestedView === 'prior-credit' ? requestedView : 'audit'

  const grouped = useMemo(() => groupRequirements(requirements), [requirements])
  const acknowledged = center.acknowledgedCatalogWarnings ?? []
  const unverified = requirements.filter((item) => item.verificationStatus === 'needs-verification')
  const fidelityGaps = courses.filter(hasTranscriptFidelityGap)
  const earliestPlannedTerm = useMemo(() => {
    const terms = [...(center.plannerTerms ?? [])].filter((term) => !term.lockedAt).sort((a, b) => a.order - b.order)
    return terms.find((term) => courses.some((course) => course.plannerTermId === term.id || (!course.plannerTermId && course.term === term.label)))
  }, [center.plannerTerms, courses])
  const plannedCourses = earliestPlannedTerm
    ? courses.filter((course) => course.plannerTermId === earliestPlannedTerm.id || (!course.plannerTermId && course.term === earliestPlannedTerm.label))
    : []
  const overlapEvidence = courses.filter((course) => course.satisfies.length > 1).slice(0, 4)
  const priorCourses = courses.filter((course) => Boolean(course.transcript) || !course.inResidence)

  function selectView(next: RequirementsView) {
    const params = new URLSearchParams(searchParams)
    if (next === 'audit') params.delete('requirementsView')
    else params.set('requirementsView', next)
    setSearchParams(params)
  }

  function acknowledge(items: RequirementItem[]) {
    const now = Date.now()
    update((draft) => {
      draft.academics.classCenter.acknowledgedCatalogWarnings = addCatalogWarningAcknowledgements(
        draft.academics.classCenter.acknowledgedCatalogWarnings,
        items,
        now,
      )
    })
  }

  return (
    <section aria-labelledby="requirements-heading" className="space-y-4">
      <header className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-primary">Planning library</p>
            <h2 id="requirements-heading" className="mt-1 font-display text-2xl font-extrabold">Requirements</h2>
            <p className="mt-1 text-sm font-semibold text-muted-foreground">Use this local record to inspect catalog evidence and your own coursework. ConnectCarolina is the official degree audit.</p>
          </div>
          <Button asChild size="sm" variant="outline">
            <a href={officialAuditUrl} target="_blank" rel="noreferrer"><ArrowUpRight className="size-4" /> Open official degree audit</a>
          </Button>
        </div>
        <div className="mt-5 inline-flex rounded-[9px] border border-border bg-muted p-[3px]" role="group" aria-label="Requirements view">
          {views.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => selectView(item.id)}
              className={cn('rounded-[7px] px-3 py-1.5 text-xs font-extrabold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring', view === item.id ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}
              aria-pressed={view === item.id}
            >{item.label}</button>
          ))}
        </div>
      </header>

      {view === 'audit' && <AuditView
        requirements={requirements}
        grouped={grouped}
        unverified={unverified}
        fidelityGaps={fidelityGaps}
        plannedTerm={earliestPlannedTerm?.label}
        plannedCourses={plannedCourses}
        overlapEvidence={overlapEvidence}
        onViewAll={() => selectView('requirements')}
      />}
      {view === 'requirements' && <AllRequirementsView grouped={grouped} acknowledged={acknowledged} onAcknowledge={acknowledge} />}
      {view === 'prior-credit' && <PriorCreditView courses={priorCourses} onCreate={addItem} />}
    </section>
  )
}

function AuditView({ requirements, grouped, unverified, fidelityGaps, plannedTerm, plannedCourses, overlapEvidence, onViewAll }: {
  requirements: RequirementItem[]
  grouped: Array<[string, RequirementItem[]]>
  unverified: RequirementItem[]
  fidelityGaps: Course[]
  plannedTerm?: string
  plannedCourses: Course[]
  overlapEvidence: Course[]
  onViewAll: () => void
}) {
  return <div className="grid gap-4 xl:grid-cols-12">
    <section className="xl:col-span-12 rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex gap-3">
        <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><ShieldCheck className="size-5" /></div>
        <div><h3 className="font-display text-lg font-extrabold">This is a planning-library view, not a degree verdict.</h3><p className="mt-1 text-sm text-muted-foreground">Catalog relationships are shown exactly as recorded and may need review by you, an advisor, or the official degree audit.</p></div>
      </div>
    </section>

    <AuditPanel title="Attention" className="xl:col-span-5">
      {unverified.length === 0 && fidelityGaps.length === 0 ? <p className="text-sm font-semibold text-muted-foreground">No source or transcript-record details need attention right now.</p> : <div className="space-y-2">
        {unverified.map((item) => <EvidenceRow key={item.id} icon={<AlertTriangle className="size-4 text-warning-foreground" />} title={item.label} detail={`${sourceLabel(item)} needs source verification.`} />)}
        {fidelityGaps.map((course) => <EvidenceRow key={course.id} icon={<FileText className="size-4 text-warning-foreground" />} title={course.code || course.title || 'Course record'} detail="Record details are missing. Add the exact transcript context before relying on this record elsewhere." />)}
      </div>}
    </AuditPanel>

    <AuditPanel title="Planned next term" className="xl:col-span-7">
      {plannedTerm ? <><p className="text-sm font-extrabold">{plannedTerm}</p><div className="mt-3 flex flex-wrap gap-2">{plannedCourses.map((course) => <span key={course.id} className="rounded-[9px] border border-border bg-muted px-3 py-1.5 text-xs font-bold">{course.code || course.title || 'Untitled course'}</span>)}</div></> : <p className="text-sm font-semibold text-muted-foreground">No unlocked Planner term has recorded courses yet. Build your own term in Planner when you are ready.</p>}
    </AuditPanel>

    <AuditPanel title="Recorded overlap context" className="xl:col-span-7">
      {overlapEvidence.length ? <div className="space-y-2">{overlapEvidence.map((course) => <EvidenceRow key={course.id} icon={<ChevronRight className="size-4 text-primary" />} title={course.code || course.title || 'Course'} detail={course.satisfies.join(' · ')} />)}</div> : <p className="text-sm font-semibold text-muted-foreground">No multi-label course relationships are recorded yet.</p>}
    </AuditPanel>

    <AuditPanel title="Catalog-library preview" className="xl:col-span-5" action={<Button size="sm" variant="ghost" onClick={onViewAll}>View all requirements <ChevronRight className="size-4" /></Button>}>
      {!requirements.length ? <p className="text-sm font-semibold text-muted-foreground">No catalog entries are available in this local store.</p> : <div className="space-y-2">{grouped.slice(0, 2).map(([group, entries]) => <div key={group} className="rounded-[13px] border border-border bg-muted p-3"><p className="font-display text-sm font-extrabold">{group}</p><p className="mt-1 text-xs font-semibold text-muted-foreground">{entries.map((entry) => entry.label).slice(0, 2).join(' · ')}</p></div>)}</div>}
    </AuditPanel>
  </div>
}

function AuditPanel({ title, className, action, children }: { title: string; className?: string; action?: ReactNode; children: ReactNode }) {
  return <section className={cn('rounded-2xl border border-border bg-card p-5 shadow-sm', className)}><div className="mb-3 flex items-center justify-between gap-3"><h3 className="font-display text-lg font-extrabold">{title}</h3>{action}</div>{children}</section>
}

function EvidenceRow({ icon, title, detail }: { icon: ReactNode; title: string; detail: string }) {
  return <div className="flex gap-3 rounded-[13px] border border-border bg-muted p-3"><span className="mt-0.5 shrink-0">{icon}</span><div className="min-w-0"><p className="text-sm font-extrabold">{title}</p><p className="mt-0.5 text-xs font-semibold leading-relaxed text-muted-foreground">{detail}</p></div></div>
}

function AllRequirementsView({ grouped, acknowledged, onAcknowledge }: { grouped: Array<[string, RequirementItem[]]>; acknowledged: Array<{ requirementId: string; sourceVersion: string; acknowledgedAt: number }>; onAcknowledge: (items: RequirementItem[]) => void }) {
  const [query, setQuery] = useState('')
  const filtered = grouped
    .map(([group, entries]) => [group, entries.filter((entry) => `${entry.label} ${entry.note ?? ''} ${entry.group}`.toLowerCase().includes(query.toLowerCase()))] as const)
    .filter(([, entries]) => entries.length)
    .sort(([, a], [, b]) => Number(b.some((entry) => entry.verificationStatus === 'needs-verification')) - Number(a.some((entry) => entry.verificationStatus === 'needs-verification')))

  return <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-display text-xl font-extrabold">Catalog library</h3><p className="mt-1 text-sm font-semibold text-muted-foreground">Uncertain source entries lead. This screen does not determine completion or equivalencies.</p></div><label className="w-full sm:w-72"><span className="sr-only">Search catalog entries</span><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search the local catalog library" /></label></div>
    <div className="mt-5 space-y-3">{filtered.length ? filtered.map(([group, entries]) => {
      const uncertain = entries.filter((item) => item.verificationStatus === 'needs-verification')
      const acknowledgedCurrent = uncertain.length > 0 && uncertain.every((item) => isCatalogWarningAcknowledged(acknowledged, item))
      return <section key={group} className="overflow-hidden rounded-2xl border border-border bg-card"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-muted px-4 py-3"><div><h4 className="font-display font-extrabold">{group}</h4><p className="mt-0.5 text-xs font-semibold text-muted-foreground">{sourceLabel(entries[0])}{entries[0].lastVerified ? ` · reviewed ${entries[0].lastVerified}` : ' · review date not recorded'}</p></div>{uncertain.length ? <span className="rounded-full border border-warning/35 bg-warning/15 px-2.5 py-1 text-[11px] font-extrabold text-warning-foreground">Needs verification</span> : <span className="rounded-full border border-primary/25 bg-primary/10 px-2.5 py-1 text-[11px] font-extrabold text-primary">Source recorded</span>}</div>
        {uncertain.length > 0 && !acknowledgedCurrent && <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-warning/10 px-4 py-3"><p className="text-xs font-semibold text-muted-foreground">This local source needs review. Your acknowledgement is personal and does not change the catalog record.</p><Button size="sm" variant="outline" onClick={() => onAcknowledge(uncertain)}>I reviewed this source</Button></div>}
        {uncertain.length > 0 && acknowledgedCurrent && <p className="border-b border-border bg-muted px-4 py-2 text-xs font-semibold text-muted-foreground">You acknowledged this source version. A changed source version will ask again.</p>}
        <div className="space-y-2 p-3">{entries.map((entry) => <details key={entry.id} className="rounded-[13px] border border-border bg-muted"><summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-3 text-sm font-extrabold marker:content-none"><span>{entry.label}</span><ChevronRight className="size-4 shrink-0 text-muted-foreground" /></summary><div className="space-y-2 border-t border-border px-3 py-3 text-xs font-semibold leading-relaxed text-muted-foreground">{entry.note && <p>{entry.note}</p>}<p><span className="font-extrabold text-foreground">Recorded mapping:</span> {entry.satisfiedBy?.join(' · ') || 'No course mapping is recorded.'}</p><p><span className="font-extrabold text-foreground">Exclusions / catalog instructions:</span> Not separately published in this local entry.</p>{entry.sourceUrl ? <a className="inline-flex items-center gap-1 font-extrabold text-primary underline-offset-4 hover:underline" href={entry.sourceUrl} target="_blank" rel="noreferrer">Open source <ArrowUpRight className="size-3.5" /></a> : <p>Source link not recorded.</p>}</div></details>)}</div>
      </section>
    }) : <p className="rounded-[13px] border border-dashed border-border bg-muted p-4 text-sm font-semibold text-muted-foreground">No local catalog entry matches that search.</p>}</div>
  </section>
}

function PriorCreditView({ courses, onCreate }: { courses: Course[]; onCreate: (key: 'courses', item: Course) => void }) {
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ institution: '', courseNumber: '', courseTitle: '', termLabel: '', creditHours: '', gradeRecorded: '', courseType: 'transfer' as TranscriptCourseType })

  function save() {
    if (!form.institution.trim() || !form.courseNumber.trim() || !form.courseTitle.trim()) return
    const now = Date.now()
    const credits = form.creditHours.trim() === '' ? null : Number(form.creditHours)
    onCreate('courses', {
      id: uid(), term: 'Prior credit', code: form.courseNumber.trim(), title: form.courseTitle.trim(), credits: Number.isFinite(credits) && credits !== null ? credits : 0,
      grade: '', bcpm: false, status: 'completed', inResidence: form.courseType === 'regular', satisfies: [], order: 0,
      transcript: { institution: form.institution.trim(), courseNumber: form.courseNumber.trim(), courseTitle: form.courseTitle.trim(), termLabel: form.termLabel.trim(), creditHours: Number.isFinite(credits) ? credits : null, gradeRecorded: form.gradeRecorded.trim(), courseType: form.courseType, capturedAt: now, updatedAt: now },
    })
    setForm({ institution: '', courseNumber: '', courseTitle: '', termLabel: '', creditHours: '', gradeRecorded: '', courseType: 'transfer' })
    setAdding(false)
  }

  return <section className="rounded-2xl border border-border bg-card p-5 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-display text-xl font-extrabold">Prior credit</h3><p className="mt-1 text-sm font-semibold text-muted-foreground">Exact transcript fields stay separate from planning labels. This is not a registrar, transfer, BCPM, or degree decision.</p></div><Button size="sm" onClick={() => setAdding((open) => !open)}><Plus className="size-4" /> Add prior credit</Button></div>
    {adding && <form className="mt-5 rounded-[13px] border border-border bg-muted p-4" onSubmit={(event) => { event.preventDefault(); save() }}><h4 className="font-display text-base font-extrabold">Record the transcript exactly</h4><div className="mt-3 grid gap-3 md:grid-cols-2"><Input required value={form.institution} onChange={(event) => setForm({ ...form, institution: event.target.value })} placeholder="Institution (exact)" /><Input required value={form.courseNumber} onChange={(event) => setForm({ ...form, courseNumber: event.target.value })} placeholder="Course number (exact)" /><Input required value={form.courseTitle} onChange={(event) => setForm({ ...form, courseTitle: event.target.value })} placeholder="Course title (exact)" /><Input value={form.termLabel} onChange={(event) => setForm({ ...form, termLabel: event.target.value })} placeholder="Term label" /><Input inputMode="decimal" value={form.creditHours} onChange={(event) => setForm({ ...form, creditHours: event.target.value })} placeholder="Credit hours" /><Input value={form.gradeRecorded} onChange={(event) => setForm({ ...form, gradeRecorded: event.target.value })} placeholder="Grade as recorded" /><label className="text-xs font-extrabold text-muted-foreground">Course type<select value={form.courseType} onChange={(event) => setForm({ ...form, courseType: event.target.value as TranscriptCourseType })} className="field-solid mt-1 h-9 w-full rounded-md border px-3 text-sm text-foreground"><option value="transfer">Transfer</option><option value="ap">AP</option><option value="dual-enrollment">Dual enrollment</option><option value="repeat">Repeat</option><option value="withdrawal">Withdrawal</option><option value="pass-fail">Pass/fail</option><option value="regular">Regular</option></select></label></div><div className="mt-4 flex flex-wrap gap-2"><Button type="submit" size="sm">Save prior credit</Button><Button type="button" size="sm" variant="ghost" onClick={() => setAdding(false)}>Cancel</Button></div><p className="mt-3 text-xs font-semibold text-muted-foreground">No transcript-line scan is attached. This local record keeps only the typed fields above.</p></form>}
    {!courses.length ? <div className="mt-5 rounded-[13px] border border-dashed border-border bg-muted p-5 text-sm font-semibold text-muted-foreground">No prior-credit record yet. Exact course details now make a future AMCAS export reliable.</div> : <div className="mt-5 space-y-2">{courses.map((course) => { const context = course.transcript; return <article key={course.id} className="rounded-[13px] border border-border bg-muted p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-display text-base font-extrabold">{context?.courseNumber || course.code || 'Course number not recorded'} · {context?.courseTitle || course.title || 'Course title not recorded'}</p><p className="mt-1 text-xs font-semibold text-muted-foreground">{context ? `${context.institution || 'Institution not recorded'} · ${context.termLabel || 'Term not recorded'} · ${context.courseType}` : 'Exact transcript context not recorded.'}</p></div><span className="rounded-full border border-border bg-card px-2.5 py-1 text-xs font-extrabold">{context?.creditHours ?? 'Credits not recorded'}{context?.creditHours !== null && context?.creditHours !== undefined ? ' cr' : ''}</span></div><div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-border pt-3 text-xs font-semibold text-muted-foreground"><span>Planning label: {course.code || course.title || 'Not recorded'}</span><span>Grade: {context?.gradeRecorded || 'Not recorded'}</span><span>{context?.transcriptLineBlobRef ? 'Transcript-line reference recorded' : 'No scan attached'}</span></div></article> })}</div>}
  </section>
}
