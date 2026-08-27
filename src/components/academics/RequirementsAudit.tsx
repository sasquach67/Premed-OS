import { useMemo, useState, type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AlertTriangle, ChevronRight, FileText, Plus, ShieldCheck } from 'lucide-react'
import type { AppData, Course, RequirementItem, TranscriptCourseType } from '@/lib/types'
import { uid } from '@/lib/id'
import { createEmptyClassCenterData } from '@/data/personalInitialData'
import { addCatalogWarningAcknowledgements, isCatalogWarningAcknowledged } from '@/lib/academics/requirementsAudit'
import { candidatePlanCoverage, UNC_PLANNING_LIBRARY, planningRequirementSet } from '@/lib/academics/uncPlanningLibrary'
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

const planningSurface = 'border-[#d8cabb] bg-[#f8f2e8] text-[#211b17] shadow-[0_10px_26px_rgb(54_38_24_/_0.12)] dark:border-[#4a4038] dark:bg-[#241f1b] dark:text-[#f8f2e8] dark:shadow-[0_10px_26px_rgb(0_0_0_/_0.25)]'
const planningInset = 'border-[#dfd0c0] bg-[#eee5d8] text-[#211b17] dark:border-[#51463d] dark:bg-[#302922] dark:text-[#f8f2e8]'

export function planningProgramLabel(set: (typeof UNC_PLANNING_LIBRARY)[number]) {
  return set.trackOrConcentration
    ? set.program + ' ' + set.degree + ' — ' + set.trackOrConcentration
    : set.program + ' ' + set.degree
}

const sortedPlanningPrograms = [...UNC_PLANNING_LIBRARY].sort((a, b) => planningProgramLabel(a).localeCompare(planningProgramLabel(b)))

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
  // A damaged legacy local payload can omit Class Center while it is being
  // hydrated. The audit remains readable, and the first local interaction
  // repairs that container rather than throwing while opening the requirement map.
  const center = useStore((state) => state.academics.classCenter) ?? createEmptyClassCenterData()
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
      const writableCenter = draft.academics.classCenter ?? (draft.academics.classCenter = createEmptyClassCenterData())
      writableCenter.acknowledgedCatalogWarnings = addCatalogWarningAcknowledgements(
        writableCenter.acknowledgedCatalogWarnings,
        items,
        now,
      )
    })
  }

  return (
    <section aria-labelledby="requirements-heading" className="space-y-4">
      <header className={cn('rounded-[18px] border p-5', planningSurface)}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex max-w-2xl gap-3">
            <div className="grid size-10 shrink-0 place-items-center rounded-xl border border-[#8fc8b4]/45 bg-[#8fc8b4]/15 text-[#427f70] dark:text-[#8fc8b4]"><ShieldCheck className="size-5" /></div>
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#427f70] dark:text-[#8fc8b4]">Academics · Planning</p>
              <h2 id="requirements-heading" className="mt-1 font-display text-2xl font-extrabold">Requirement map</h2>
              <p className="mt-1 text-sm font-semibold text-[#6a5f54] dark:text-[#d0c3b5]">Source-versioned planning evidence and local coursework. Live official audit access is not configured.</p>
            </div>
          </div>
          <span className="rounded-[9px] border border-[#9e7040] bg-[#f0e5d4] px-3 py-2 text-xs font-extrabold text-[#6a5f54] dark:bg-[#3a2b1e] dark:text-[#f0c489]">Official audit · unconfigured</span>
        </div>
        <div className="mt-5 inline-flex rounded-[9px] border border-[#5b5047] bg-[#eee5d8] p-[3px] dark:bg-[#302922]" role="group" aria-label="Requirements view">
          {views.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => selectView(item.id)}
              className={cn('rounded-[7px] px-3 py-1.5 text-xs font-extrabold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring', view === item.id ? 'bg-[#f8f2e8] text-[#211b17] shadow-sm' : 'text-[#6a5f54] hover:text-[#211b17] dark:text-[#d0c3b5] dark:hover:text-[#f8f2e8]')}
              aria-pressed={view === item.id}
            >{item.label}</button>
          ))}
        </div>
      </header>

      <PlanningLibraryContext
        context={center.planningProgramContext ?? {}}
        courseCodes={courses.map((course) => course.code)}
        onChange={(patch) => update((draft) => {
          const writableCenter = draft.academics.classCenter ?? (draft.academics.classCenter = createEmptyClassCenterData())
          writableCenter.planningProgramContext = {
            ...writableCenter.planningProgramContext,
            ...patch,
            updatedAt: Date.now(),
          }
        })}
      />

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
      {view === 'prior-credit' && <PriorCreditView courses={priorCourses} onCreate={addItem} onUpdate={update} />}
    </section>
  )
}

function PlanningLibraryContext({ context, courseCodes, onChange }: { context: import('@/lib/types').PlanningProgramContext; courseCodes: string[]; onChange: (patch: Partial<import('@/lib/types').PlanningProgramContext>) => void }) {
  const { selectedProgramId, matriculationTerm, ideasCatalogYear, gillingsAdmissionTerm, programAdmissionStatus = 'not-applicable' } = context
  const selected = selectedProgramId ? planningRequirementSet(selectedProgramId) : undefined
  const coverage = selected ? candidatePlanCoverage(selected, courseCodes) : []
  return <section className={cn('rounded-[18px] border p-5', planningSurface)}>
    <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#427f70] dark:text-[#8fc8b4]">Selected catalog plan</p><h3 className="mt-1 font-display text-xl font-extrabold">{selected ? planningProgramLabel(selected) : 'Choose a program and track'}</h3><p className="mt-1 text-sm font-semibold text-[#6a5f54] dark:text-[#d0c3b5]">Local course matches are candidate evidence only. They never decide official fulfillment or graduation.</p></div>{selected && <span className="rounded-[9px] border border-[#5b5047] bg-[#eee5d8] px-3 py-2 text-xs font-extrabold text-[#427f70] dark:bg-[#302922] dark:text-[#8fc8b4]">Source record · {selected.catalogYear} · {selected.retrievedAt}</span>}</div>
    <div className="mt-4 grid max-w-4xl gap-3 sm:grid-cols-2">
      <label className="text-xs font-extrabold text-[#6a5f54] dark:text-[#d0c3b5]">Degree / track<select value={selectedProgramId ?? ''} onChange={(event) => onChange({ selectedProgramId: event.target.value || undefined })} className={cn('mt-1 h-10 w-full rounded-[10px] border px-3 text-sm font-bold', planningInset)}><option value="">Select a catalog program</option>{sortedPlanningPrograms.map((set) => <option key={set.id} value={set.id}>{planningProgramLabel(set)}</option>)}</select></label>
      <label className="text-xs font-extrabold text-[#6a5f54] dark:text-[#d0c3b5]">Matriculation term (as recorded)<Input className={cn('mt-1 border', planningInset)} value={matriculationTerm ?? ''} onChange={(event) => onChange({ matriculationTerm: event.target.value || undefined })} placeholder="For example: Fall 2026" /></label>
      <label className="text-xs font-extrabold text-[#6a5f54] dark:text-[#d0c3b5]">IDEAs catalog year (exact)<Input className={cn('mt-1 border', planningInset)} value={ideasCatalogYear ?? ''} onChange={(event) => onChange({ ideasCatalogYear: event.target.value || undefined })} placeholder="For example: 2026–2027" /></label>
      <label className="text-xs font-extrabold text-[#6a5f54] dark:text-[#d0c3b5]">Program admission status<select value={programAdmissionStatus} onChange={(event) => onChange({ programAdmissionStatus: event.target.value as import('@/lib/types').PlanningProgramContext['programAdmissionStatus'] })} className={cn('mt-1 h-10 w-full rounded-[10px] border px-3 text-sm font-bold', planningInset)}><option value="not-applicable">Not admission-gated</option><option value="planning">Planning only</option><option value="applied">Application submitted</option><option value="admitted">Admission recorded locally</option></select></label>
      {selected?.degree === 'B.S.P.H.' && <label className="text-xs font-extrabold text-[#6a5f54] dark:text-[#d0c3b5] sm:col-span-2">Gillings admission term (as recorded)<Input className={cn('mt-1 border', planningInset)} value={gillingsAdmissionTerm ?? ''} onChange={(event) => onChange({ gillingsAdmissionTerm: event.target.value || undefined })} placeholder="Exact catalog/admission term" /></label>}
    </div>
    {!selected ? <p className="mt-3 rounded-[12px] border border-dashed border-[#9e7040] bg-[#f0e5d4] p-3 text-sm font-semibold text-[#6a5f54] dark:bg-[#3a2b1e] dark:text-[#d0c3b5]">No program is assumed. Select the exact degree and track before using catalog planning nodes.</p> : <><div className={cn('mt-3 rounded-[12px] border p-3 text-xs font-semibold', planningInset)}><b>2026–27 catalog source, retrieved {selected.retrievedAt}.</b> {selected.sourceStatus === 'official-source-gap' ? 'This record still needs a direct table capture.' : 'Live official verification is not configured.'}{selected.admissionGate ? ' Admission: ' + selected.admissionGate : ''}<span className="mt-1 block">Context: {matriculationTerm ? 'matriculation ' + matriculationTerm : 'matriculation not recorded'} · {ideasCatalogYear ? 'IDEAs catalog ' + ideasCatalogYear : 'IDEAs catalog year not recorded'} · {programAdmissionStatus.replace('-', ' ')}{selected.degree === 'B.S.P.H.' ? ' · Gillings term ' + (gillingsAdmissionTerm || 'not recorded') : ''}.</span></div><div className="mt-3 grid gap-2 md:grid-cols-2">{coverage.map(({ node, state, scheduledCourses, detail }) => <article key={node.id} className={cn('rounded-[12px] border p-3', planningInset)}><div className="flex items-start justify-between gap-2"><p className="text-sm font-extrabold">{node.label}</p><span className="rounded-full border border-[#65584b] px-2 py-0.5 text-[10px] font-extrabold">{state === 'scheduled' ? 'Course recorded' : state === 'not-scheduled' ? 'Not scheduled' : 'Manual review'}</span></div><p className="mt-1 text-xs font-semibold text-[#6a5f54] dark:text-[#d0c3b5]">{node.detail}</p>{scheduledCourses.length > 0 && <p className="mt-2 text-xs font-extrabold text-[#427f70] dark:text-[#8fc8b4]">Local record: {scheduledCourses.join(' · ')}</p>}<p className="mt-2 text-[11px] font-semibold text-[#6a5f54] dark:text-[#d0c3b5]">{detail}</p>{node.exclusions?.length ? <p className="mt-2 text-[11px] font-semibold text-[#966536] dark:text-[#f0c489]">Constraint: {node.exclusions.join(' ')}</p> : null}{node.noDoubleCountWith?.length ? <p className="mt-2 text-[11px] font-semibold text-[#966536] dark:text-[#f0c489]">No double-count: {node.noDoubleCountWith.join(' ')}</p> : null}</article>)}</div><div className="mt-3 rounded-[12px] border border-[#9e7040] bg-[#f0e5d4] p-3 text-xs font-semibold text-[#6a5f54] dark:bg-[#3a2b1e] dark:text-[#d0c3b5]"><b className="text-[#211b17] dark:text-[#f8f2e8]">Manual review needed:</b> {selected.manualReview.join(' · ')}</div></>}
  </section>
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
  return <section className={cn('rounded-[18px] border p-5', planningSurface, className)}><div className="mb-3 flex items-center justify-between gap-3"><h3 className="font-display text-lg font-extrabold">{title}</h3>{action}</div>{children}</section>
}

function EvidenceRow({ icon, title, detail }: { icon: ReactNode; title: string; detail: string }) {
  return <div className={cn('flex gap-3 rounded-[12px] border p-3', planningInset)}><span className="mt-0.5 shrink-0">{icon}</span><div className="min-w-0"><p className="text-sm font-extrabold">{title}</p><p className="mt-0.5 text-xs font-semibold leading-relaxed text-[#6a5f54] dark:text-[#d0c3b5]">{detail}</p></div></div>
}

function AllRequirementsView({ grouped, acknowledged, onAcknowledge }: { grouped: Array<[string, RequirementItem[]]>; acknowledged: Array<{ requirementId: string; sourceVersion: string; acknowledgedAt: number }>; onAcknowledge: (items: RequirementItem[]) => void }) {
  const [query, setQuery] = useState('')
  const filtered = grouped
    .map(([group, entries]) => [group, entries.filter((entry) => `${entry.label} ${entry.note ?? ''} ${entry.group}`.toLowerCase().includes(query.toLowerCase()))] as const)
    .filter(([, entries]) => entries.length)
    .sort(([, a], [, b]) => Number(b.some((entry) => entry.verificationStatus === 'needs-verification')) - Number(a.some((entry) => entry.verificationStatus === 'needs-verification')))

  return <section className={cn('rounded-[18px] border p-5', planningSurface)}>
    <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#427f70] dark:text-[#8fc8b4]">Catalog evidence</p><h3 className="mt-1 font-display text-xl font-extrabold">All requirements</h3><p className="mt-1 text-sm font-semibold text-[#6a5f54] dark:text-[#d0c3b5]">Uncertain source entries lead. This screen does not determine completion or equivalencies.</p></div><label className="w-full sm:w-72"><span className="sr-only">Search catalog entries</span><Input className={cn('border', planningInset)} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search the local catalog library" /></label></div>
    <div className="mt-5 space-y-3">{filtered.length ? filtered.map(([group, entries]) => {
      const uncertain = entries.filter((item) => item.verificationStatus === 'needs-verification')
      const acknowledgedCurrent = uncertain.length > 0 && uncertain.every((item) => isCatalogWarningAcknowledged(acknowledged, item))
      return <section key={group} className="overflow-hidden rounded-2xl border border-border bg-card"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-muted px-4 py-3"><div><h4 className="font-display font-extrabold">{group}</h4><p className="mt-0.5 text-xs font-semibold text-muted-foreground">{sourceLabel(entries[0])}{entries[0].lastVerified ? ` · reviewed ${entries[0].lastVerified}` : ' · review date not recorded'}</p></div>{uncertain.length ? <span className="rounded-full border border-warning/35 bg-warning/15 px-2.5 py-1 text-[11px] font-extrabold text-warning-foreground">Needs verification</span> : <span className="rounded-full border border-primary/25 bg-primary/10 px-2.5 py-1 text-[11px] font-extrabold text-primary">Source recorded</span>}</div>
        {uncertain.length > 0 && !acknowledgedCurrent && <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-warning/10 px-4 py-3"><p className="text-xs font-semibold text-muted-foreground">This local source needs review. Your acknowledgement is personal and does not change the catalog record.</p><Button size="sm" variant="outline" onClick={() => onAcknowledge(uncertain)}>I reviewed this source</Button></div>}
        {uncertain.length > 0 && acknowledgedCurrent && <p className="border-b border-border bg-muted px-4 py-2 text-xs font-semibold text-muted-foreground">You acknowledged this source version. A changed source version will ask again.</p>}
        <div className="space-y-2 p-3">{entries.map((entry) => <details key={entry.id} className="rounded-[13px] border border-border bg-muted"><summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-3 text-sm font-extrabold marker:content-none"><span>{entry.label}</span><ChevronRight className="size-4 shrink-0 text-muted-foreground" /></summary><div className="space-y-2 border-t border-border px-3 py-3 text-xs font-semibold leading-relaxed text-muted-foreground">{entry.note && <p>{entry.note}</p>}<p><span className="font-extrabold text-foreground">Recorded mapping:</span> {entry.satisfiedBy?.join(' · ') || 'No course mapping is recorded.'}</p><p><span className="font-extrabold text-foreground">Exclusions / catalog instructions:</span> Not separately published in this local entry.</p>{entry.sourceUrl ? <p>Source record saved · {entry.lastVerified || 'review date not recorded'}</p> : <p>Source link not recorded.</p>}</div></details>)}</div>
      </section>
    }) : <p className="rounded-[13px] border border-dashed border-border bg-muted p-4 text-sm font-semibold text-muted-foreground">No local catalog entry matches that search.</p>}</div>
  </section>
}

function PriorCreditView({ courses, onCreate, onUpdate }: { courses: Course[]; onCreate: (key: 'courses', item: Course) => void; onUpdate: (mutator: (draft: AppData) => void) => void }) {
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ institution: '', courseNumber: '', courseTitle: '', termLabel: '', creditHours: '', gradeRecorded: '', courseType: 'transfer' as TranscriptCourseType })

  function save() {
    if (!form.institution.trim() || !form.courseNumber.trim() || !form.courseTitle.trim()) return
    const now = Date.now()
    const credits = form.creditHours.trim() === '' ? null : Number(form.creditHours)
    const courseId = uid()
    onCreate('courses', {
      id: courseId, term: 'Prior credit', code: form.courseNumber.trim(), title: form.courseTitle.trim(), credits: Number.isFinite(credits) && credits !== null ? credits : 0,
      grade: '', bcpm: false, status: 'completed', inResidence: form.courseType === 'regular', satisfies: [], order: 0,
      transcript: { institution: form.institution.trim(), courseNumber: form.courseNumber.trim(), courseTitle: form.courseTitle.trim(), termLabel: form.termLabel.trim(), creditHours: Number.isFinite(credits) ? credits : null, gradeRecorded: form.gradeRecorded.trim(), courseType: form.courseType, capturedAt: now, updatedAt: now },
    })
    // Grades & Archive builds its ledger from `classCenter.transcriptRecords`,
    // not from the legacy `course.transcript` blob. Writing only the latter
    // left prior credit invisible there: the student entered a transcript line
    // and the archive stayed empty. Both are written, with the same exact
    // strings, so neither view can disagree with the other.
    onUpdate((draft) => {
      const records = draft.academics.classCenter.transcriptRecords
      records.push({
        id: uid(),
        courseId,
        institution: form.institution.trim(),
        courseNumberExact: form.courseNumber.trim(),
        titleExact: form.courseTitle.trim(),
        creditsExact: form.creditHours.trim(),
        gradeExact: form.gradeRecorded.trim(),
        term: form.termLabel.trim(),
        year: '',
        courseType: form.courseType,
        // Classification is never inferred from a prior-credit entry.
        createdAt: now,
        updatedAt: now,
        order: records.length,
      })
    })
    setForm({ institution: '', courseNumber: '', courseTitle: '', termLabel: '', creditHours: '', gradeRecorded: '', courseType: 'transfer' })
    setAdding(false)
  }

  return <section className={cn('rounded-[18px] border p-5', planningSurface)}><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#427f70] dark:text-[#8fc8b4]">Student record</p><h3 className="mt-1 font-display text-xl font-extrabold">Prior credit</h3><p className="mt-1 text-sm font-semibold text-[#6a5f54] dark:text-[#d0c3b5]">Exact transcript fields stay separate from planning labels. This is not a registrar, transfer, BCPM, or degree decision.</p></div><Button size="sm" className="bg-[#427f70] text-white hover:bg-[#35695d] dark:bg-[#8fc8b4] dark:text-[#211b17] dark:hover:bg-[#a8ddc8]" onClick={() => setAdding((open) => !open)}><Plus className="size-4" /> Add prior credit</Button></div>
    {adding && <form className="mt-5 rounded-[13px] border border-border bg-muted p-4" onSubmit={(event) => { event.preventDefault(); save() }}><h4 className="font-display text-base font-extrabold">Record the transcript exactly</h4><div className="mt-3 grid gap-3 md:grid-cols-2"><Input required value={form.institution} onChange={(event) => setForm({ ...form, institution: event.target.value })} placeholder="Institution (exact)" /><Input required value={form.courseNumber} onChange={(event) => setForm({ ...form, courseNumber: event.target.value })} placeholder="Course number (exact)" /><Input required value={form.courseTitle} onChange={(event) => setForm({ ...form, courseTitle: event.target.value })} placeholder="Course title (exact)" /><Input value={form.termLabel} onChange={(event) => setForm({ ...form, termLabel: event.target.value })} placeholder="Term label" /><Input inputMode="decimal" value={form.creditHours} onChange={(event) => setForm({ ...form, creditHours: event.target.value })} placeholder="Credit hours" /><Input value={form.gradeRecorded} onChange={(event) => setForm({ ...form, gradeRecorded: event.target.value })} placeholder="Grade as recorded" /><label className="text-xs font-extrabold text-muted-foreground">Course type<select value={form.courseType} onChange={(event) => setForm({ ...form, courseType: event.target.value as TranscriptCourseType })} className="field-solid mt-1 h-9 w-full rounded-md border px-3 text-sm text-foreground"><option value="transfer">Transfer</option><option value="ap">AP</option><option value="dual-enrollment">Dual enrollment</option><option value="repeat">Repeat</option><option value="withdrawal">Withdrawal</option><option value="pass-fail">Pass/fail</option><option value="regular">Regular</option></select></label></div><div className="mt-4 flex flex-wrap gap-2"><Button type="submit" size="sm">Save prior credit</Button><Button type="button" size="sm" variant="ghost" onClick={() => setAdding(false)}>Cancel</Button></div><p className="mt-3 text-xs font-semibold text-muted-foreground">No transcript-line scan is attached. This local record keeps only the typed fields above.</p></form>}
    {!courses.length ? <div className="mt-5 rounded-[13px] border border-dashed border-border bg-muted p-5 text-sm font-semibold text-muted-foreground">No prior-credit record yet. Exact course details now make a future AMCAS export reliable.</div> : <div className="mt-5 space-y-2">{courses.map((course) => { const context = course.transcript; return <article key={course.id} className="rounded-[13px] border border-border bg-muted p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-display text-base font-extrabold">{context?.courseNumber || course.code || 'Course number not recorded'} · {context?.courseTitle || course.title || 'Course title not recorded'}</p><p className="mt-1 text-xs font-semibold text-muted-foreground">{context ? `${context.institution || 'Institution not recorded'} · ${context.termLabel || 'Term not recorded'} · ${context.courseType}` : 'Exact transcript context not recorded.'}</p></div><span className="rounded-full border border-border bg-card px-2.5 py-1 text-xs font-extrabold">{context?.creditHours ?? 'Credits not recorded'}{context?.creditHours !== null && context?.creditHours !== undefined ? ' cr' : ''}</span></div><div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-border pt-3 text-xs font-semibold text-muted-foreground"><span>Planning label: {course.code || course.title || 'Not recorded'}</span><span>Grade: {context?.gradeRecorded || 'Not recorded'}</span><span>{context?.transcriptLineBlobRef ? 'Transcript-line reference recorded' : 'No scan attached'}</span></div></article> })}</div>}
  </section>
}
