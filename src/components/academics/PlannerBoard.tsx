/**
 * The Planner term board (§4.2) — the ruled **A + C** composition.
 *
 * Drawing:   mockup-lab/01-academics/academics-planner-prototype.html
 * Decisions: academics-planner-prototype.md — A's whole-plan board with C's
 *            selected-course inspector on demand. The handoff there is six
 *            numbered rules and this file implements them literally:
 *            the inspector opens from a chip, marks it, REPLACES the outcome
 *            rail rather than rendering beside it, swaps contents when another
 *            chip is picked, and commits nothing by opening.
 * Model:     lib/academics/planner.ts — every rule and every number.
 *
 * ⚠️ This board sequences; it does not edit. The per-term `TrackerTable`
 * collapsibles below keep that job, and duplicating them here would create a
 * second editor with its own idea of the truth.
 *
 * ⚠️ U-9: credits and named requirements only. No readiness score, no
 * composite, no "on track" badge.
 */
import { useMemo, useState } from 'react'
import { CalendarPlus, GraduationCap, Pencil, Search, Trash2, X } from 'lucide-react'
import { useStore } from '@/store/store'
import { cn } from '@/lib/utils'
import { uid } from '@/lib/id'
import { fmtGpa } from '@/lib/selectors'
import {
  courseEffects, mcatDividerAfter, outcomeProjection,
  plannerTerms, prereqVsMcat, unplacedRequirements,
} from '@/lib/academics/planner'
import { isProtected } from '@/lib/academics/savedPlans'
import { buildAdvisorSnapshot } from '@/lib/academics/advisorExport'
import {
  candidatePlanCoverage,
  planningRequirementSet,
  UNC_PLANNING_LIBRARY,
} from '@/lib/academics/uncPlanningLibrary'
import {
  localCatalogCandidates,
  UNC_CATALOG_INTEGRATION,
  type LocalCatalogCandidate,
} from '@/lib/academics/planningCatalogAdapter'
import type { Course, PlannerTerm } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { RequirementsAudit, planningProgramLabel } from '@/components/academics/RequirementsAudit'
import './PlanningWorkspace.css'

const EYEBROW = 'font-display text-[10px] font-extrabold uppercase tracking-[0.1em] text-muted-foreground'

/**
 * Visual source: mockup-lab/01-academics/academics-planner-prototype.html
 * Approved target: Variant A · view=plan, with requirements/catalog in-context.
 */
export function PlannerBoard({ onAddCourse, onComparePlans, openRequirements = false }: {
  onAddCourse: (term: string) => void
  onComparePlans: () => void
  openRequirements?: boolean
}) {
  const courses = useStore((s) => s.courses)
  const requirements = useStore((s) => s.requirements)
  const planningContext = useStore((s) => s.academics.classCenter.planningProgramContext ?? {})
  const selectedProgramId = planningContext.selectedProgramId
  const mcatDate = useStore((s) => s.mcat.targetDate)
  const studentName = useStore((s) => s.profile.name)
  const slots = useStore((s) => s.academics.classCenter.plannerTerms ?? [])
  const savedPlans = useStore((s) => s.academics.classCenter.savedPlans ?? [])
  const transcriptRecords = useStore((s) => s.academics.classCenter.transcriptRecords ?? [])
  const [selectedId, setSelectedId] = useState<string | undefined>()
  const [placingCourse, setPlacingCourse] = useState<Course | undefined>()
  const [placementOpen, setPlacementOpen] = useState(false)
  const [editingSlot, setEditingSlot] = useState<PlannerTerm | undefined>()
  const [requirementsOpen, setRequirementsOpen] = useState(openRequirements)
  const [newTermLabel, setNewTermLabel] = useState('')
  const [newTermKind, setNewTermKind] = useState<PlannerTerm['kind']>('standard')

  const columns = plannerTerms(courses, slots)
  const divider = mcatDividerAfter(columns, mcatDate)
  const selectedProgram = selectedProgramId ? planningRequirementSet(selectedProgramId) : undefined
  const localCoverage = selectedProgram ? candidatePlanCoverage(selectedProgram, courses.map((course) => course.code)) : undefined
  const unplaced = localCoverage
    ? localCoverage.filter((item) => item.state !== 'scheduled').map((item) => ({ id: item.node.id, label: item.node.label, verificationStatus: item.state === 'manual-review' ? 'needs-verification' as const : 'verified' as const }))
    : unplacedRequirements(requirements, courses)
  const selected = courses.find((course) => course.id === selectedId)
  const planName = savedPlans.at(-1)?.name || 'Current course plan'
  const programSummary = selectedProgram
    ? `${planningProgramLabel(selectedProgram)} · ${selectedProgram.catalogYear}`
    : 'Program not selected · Catalog not recorded'
  const priorCreditCount = transcriptRecords.filter((record) => {
    const linked = courses.find((course) => course.id === record.courseId)
    return linked?.status === 'completed'
  }).length

  if (!columns.length) return null

  const addSlot = () => {
    const label = newTermLabel.trim()
    if (!label) return
    const already = slots.some((slot) => slot.label.trim().toLocaleLowerCase() === label.toLocaleLowerCase())
    if (already) return
    const now = Date.now()
    const slot: PlannerTerm = {
      id: uid(), label, kind: newTermKind, origin: 'student-created', createdAt: now, updatedAt: now, order: slots.length,
    }
    useStore.getState().update((draft) => { draft.academics.classCenter.plannerTerms.push(slot) })
    setNewTermLabel('')
  }

  const place = (course: Course, term: { id?: string; term: string; lockedAt?: number; registered: boolean }) => {
    if (term.lockedAt || term.registered || isProtected(course)) return
    useStore.getState().update((draft) => {
      const row = draft.courses.find((item) => item.id === course.id)
      if (row && !isProtected(row)) {
        row.term = term.term
        row.plannerTermId = term.id
      }
    })
    setPlacingCourse(undefined)
  }

  const exportAdvisorSnapshot = () => {
    const snapshot = buildAdvisorSnapshot({
      courses,
      requirements,
      catalogDate: selectedProgram?.catalogYear,
      studentName,
      planningContext,
    })
    const href = URL.createObjectURL(new Blob([snapshot.text], { type: 'text/plain;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = href
    link.download = 'premed-os-advisor-plan.txt'
    link.click()
    URL.revokeObjectURL(href)
  }

  return (
    <section className="planning-workspace" aria-label="Academic planner">
      <div className="planning-filter-bar" aria-label="Plan controls">
        <span className="planning-control" data-primary="true">{planName}</span>
        <button type="button" className="planning-control" onClick={() => setRequirementsOpen(true)}>{programSummary}</button>
        <button type="button" className="planning-control" onClick={() => onAddCourse(columns.find((column) => !column.registered && !column.lockedAt)?.term ?? columns[0].term)}>＋ Add course</button>
        <button type="button" className="planning-control" onClick={onComparePlans}>Compare plans</button>
        <span className="planning-control"><GraduationCap className="size-3.5" /> MCAT · {mcatDate || 'date not recorded'}</span>
        <span className="planning-control-spacer" />
        <button type="button" className="planning-control" onClick={exportAdvisorSnapshot}>Export for advisor</button>
        <details className="planning-more">
          <summary className="planning-control" aria-label="More plan actions">•••</summary>
          <div className="planning-more-menu">
            <button type="button" onClick={() => { setPlacingCourse(undefined); setPlacementOpen(true) }}><CalendarPlus className="size-3.5" /> Add term</button>
            <button type="button" onClick={() => setRequirementsOpen(true)}>Open requirement map</button>
          </div>
        </details>
      </div>

      <section className="planning-context-bar" aria-label="Planning context">
        <div className="planning-context-label"><b>Your planning context</b><span>These choices set the requirement map.</span></div>
        <button type="button" className="planning-context-field" onClick={() => setRequirementsOpen(true)}><small>Major / program</small><b>{selectedProgram ? planningProgramLabel(selectedProgram) : 'Not recorded'}</b></button>
        <button type="button" className="planning-context-field" onClick={() => setRequirementsOpen(true)}><small>Catalog + cohort</small><b>{selectedProgram?.catalogYear ?? 'Not recorded'}</b></button>
        <button type="button" className="planning-context-field" onClick={() => setRequirementsOpen(true)}><small>Premed path</small><b>{mcatDate ? `Not recorded · MCAT ${mcatDate}` : 'Not recorded'}</b></button>
        <button type="button" className="planning-context-field" data-action="true" onClick={() => setRequirementsOpen(true)}><small>Prior credit</small><b>{priorCreditCount ? `${priorCreditCount} completed transcript record${priorCreditCount === 1 ? '' : 's'}` : 'Not recorded'}</b></button>
        <div className="planning-context-field" data-unavailable="true"><small>Interests</small><b>Not recorded</b></div>
      </section>

      <div className="planning-canvas">
        <div className="planning-layout">
          <div className="planning-main">
            <section className="planning-card">
              <header className="planning-card-header">
                <div><div className="planning-card-title">Your academic plan</div><div className="planning-card-subtitle">past → registered → planned · scroll across terms</div></div>
                <button type="button" className="planning-control" onClick={() => { setPlacingCourse(undefined); setPlacementOpen(true) }}>＋ Add term</button>
              </header>
              <div className="planning-card-body">
                <div className="planning-board-scroll">
                  <div className="planning-terms">
                    {columns.map((column, index) => (
                      <div key={column.id ?? column.term} className="flex items-stretch gap-2.5">
                        <article className="planning-term" data-current={column.registered || undefined}>
                          <header className="planning-term-header">
                            <div><div className="planning-term-name">{column.term}</div><div className="planning-term-meta">{column.registered ? 'Registered' : column.lockedAt ? 'Locked' : 'Planned'} · {column.credits} credits</div></div>
                            {column.id ? <button type="button" className="planning-term-lock" data-locked={Boolean(column.lockedAt) || undefined} onClick={() => setEditingSlot(slots.find((slot) => slot.id === column.id))} aria-label={`Edit ${column.term}`}>{column.lockedAt ? 'Locked' : 'Draft'} <Pencil className="inline size-2.5" /></button> : <span className="planning-term-lock" data-locked={column.registered || undefined}>{column.registered ? 'Registered' : 'Recorded'}</span>}
                          </header>
                          {column.note && <p className="planning-term-meta">{column.note}</p>}
                          {column.courses.map((course) => {
                            const effects = courseEffects(course, requirements, courses)
                            return <button key={course.id} type="button" className="planning-course" data-selected={course.id === selectedId || undefined} onClick={() => setSelectedId(course.id === selectedId ? undefined : course.id)}>
                              <span className="planning-course-top"><span className="planning-course-code">{course.code || 'Course code'}</span><span className="planning-course-credits">{course.credits} cr</span></span>
                              <span className="planning-course-name">{course.title || 'Title not recorded'}</span>
                              <span className="planning-course-tags"><span className="planning-course-tag">{course.bcpm ? 'BCPM' : 'AO'}</span>{effects.clears.some((effect) => effect.confidence === 'verified') && <span className="planning-course-tag" data-tone="sage">✓ source</span>}</span>
                              <span className="planning-course-clear"><b>{effects.clears.length ? 'Planning effect:' : 'Requirement effect:'}</b> {effects.clears.map((effect) => effect.label).join(' · ') || 'No recorded mapping'}</span>
                            </button>
                          })}
                          {!column.courses.length && <p className="planning-term-empty">Nothing placed</p>}
                          {!column.registered && !column.lockedAt && <button type="button" className="planning-term-add" onClick={() => onAddCourse(column.term)}>＋ Add course</button>}
                          <p className="planning-term-load"><b>{column.credits} credits</b> · {column.bcpmCredits} BCPM</p>
                        </article>
                        {divider === index && <div className="planning-mcat-divider"><GraduationCap className="mb-2 size-5" /><b>MCAT</b><span>{mcatDate || 'Date not recorded'}</span></div>}
                      </div>
                    ))}
                    {divider === undefined && <div className="planning-mcat-divider"><GraduationCap className="mb-2 size-5" /><b>MCAT</b><span>Date not recorded</span></div>}
                  </div>
                </div>
              </div>
            </section>

            <CourseDiscoveryBay columns={columns} selectedProgramId={selectedProgramId} onInspect={setSelectedId} />

            <section className="planning-tray" aria-label="Unplaced planning work">
              <header className="planning-tray-header"><div><span className="planning-tray-title">Unplaced</span> <span className="planning-tray-copy">requirements and courses with no term yet</span></div></header>
              {unplaced.length ? <div className="planning-tray-items">{unplaced.map((item) => <div key={item.id} className="planning-tray-chip"><b>{item.label}</b><span>{item.verificationStatus === 'needs-verification' ? 'Manual review' : 'Source recorded'} · no term selected</span></div>)}</div> : <p className="planning-tray-copy">No uncaptured planning nodes are shown locally.</p>}
            </section>
          </div>

          <aside className="planning-rail">
            <PlanCoverage selectedProgram={selectedProgram} coverage={localCoverage ?? []} onOpen={() => setRequirementsOpen(true)} />
            {selected ? <Inspector course={selected} onClose={() => setSelectedId(undefined)} onPlace={() => { setPlacingCourse(selected); setPlacementOpen(true) }} /> : <OutcomeRail mcatDate={mcatDate} selectedProgramId={selectedProgramId} />}
          </aside>
        </div>
      </div>

      {requirementsOpen && <div className="planning-drawer" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setRequirementsOpen(false) }}>
        <aside className="planning-drawer-panel" role="dialog" aria-modal="true" aria-label="Planner requirement map">
          <header className="planning-drawer-top"><div><h2>Requirement map</h2><p>Local planning evidence · live official audit is not configured</p></div><button type="button" className="planning-control" onClick={() => setRequirementsOpen(false)} aria-label="Close requirement map"><X className="size-4" /></button></header>
          <RequirementsAudit />
        </aside>
      </div>}

      <PlacementDialog key={placingCourse?.id ?? 'new-term'}
        course={placingCourse}
        open={placementOpen}
        columns={columns}
        label={newTermLabel}
        onLabelChange={setNewTermLabel}
        kind={newTermKind}
        onKindChange={setNewTermKind}
        onAdd={addSlot}
        onPlace={place}
        onOpenChange={(open) => { setPlacementOpen(open); if (!open) setPlacingCourse(undefined) }}
      />
      <TermEditor key={editingSlot?.id ?? 'term-editor-closed'} term={editingSlot} onOpenChange={(open) => { if (!open) setEditingSlot(undefined) }} />
    </section>
  )
}

/**
 * Visual source: mockup-lab/01-academics/academics-planner-prototype.html
 * Approved target: Variant A · view=plan, persistent Plan coverage rail.
 */
function PlanCoverage({ selectedProgram, coverage, onOpen }: {
  selectedProgram?: NonNullable<ReturnType<typeof planningRequirementSet>>
  coverage: ReturnType<typeof candidatePlanCoverage>
  onOpen: () => void
}) {
  const courses = useStore((s) => s.courses)
  const completedCodes = new Set(courses.filter((course) => course.status === 'completed').map((course) => course.code.trim().toUpperCase()))
  const complete = coverage.filter((item) => item.state === 'scheduled' && item.scheduledCourses.some((code) => completedCodes.has(code.toUpperCase()))).length
  const planned = coverage.filter((item) => item.state === 'scheduled' && !item.scheduledCourses.some((code) => completedCodes.has(code.toUpperCase()))).length
  const notScheduled = coverage.filter((item) => item.state === 'not-scheduled').length
  const manualReview = coverage.filter((item) => item.state === 'manual-review').length
  return <section className="planning-card planning-coverage">
    <header className="planning-card-header"><div><p className="planning-eyebrow">Planner tool · Source-bearing context</p><h3 className="planning-card-title">Plan coverage</h3><p className="planning-card-subtitle">why each recorded course belongs in the sequence</p></div><button type="button" className="planning-control" onClick={onOpen}>Open map →</button></header>
    <div className="planning-card-body">
      <div className="planning-coverage-identity"><div><b>{selectedProgram ? planningProgramLabel(selectedProgram) : 'No program selected'}</b><span>{selectedProgram ? `${selectedProgram.catalogYear} · retrieved ${selectedProgram.retrievedAt}` : 'Choose an exact program before reading requirement effects.'}</span></div>{selectedProgram && <span className="planning-eyebrow">Local source record</span>}</div>
      <div className="planning-coverage-counts" aria-label="Local planning evidence"><div className="planning-coverage-count" data-tone="sage"><b>{complete}</b><span>Complete</span></div><div className="planning-coverage-count" data-tone="blue"><b>{planned}</b><span>Planned</span></div><div className="planning-coverage-count" data-tone="amber"><b>{notScheduled}</b><span>Not complete</span></div><div className="planning-coverage-count" data-tone="violet"><b>{manualReview}</b><span>Manual review</span></div></div>
      {selectedProgram ? coverage.slice(0, 4).map((item) => {
        const isComplete = item.state === 'scheduled' && item.scheduledCourses.some((code) => completedCodes.has(code.toUpperCase()))
        const state = item.state === 'manual-review' ? 'manual-review' : isComplete ? 'complete' : item.state === 'scheduled' ? 'planned' : 'not-complete'
        const label = state === 'complete' ? 'Complete' : state === 'planned' ? 'Planned' : state === 'not-complete' ? 'Not complete' : 'Manual review'
        return <div key={item.node.id} className="planning-coverage-row"><div className="planning-coverage-row-head"><span>{item.node.label}</span><span className="planning-coverage-state" data-state={state}>{label}</span></div><p>{item.scheduledCourses.length ? `Local record: ${item.scheduledCourses.join(' · ')}` : item.node.detail}</p></div>
      }) : <div className="planning-coverage-row"><div className="planning-coverage-row-head"><span>Planning context</span><span className="planning-coverage-state" data-state="manual-review">Choose program</span></div><p>No requirement status is inferred until an exact source plan is selected.</p></div>}
      <div className="planning-boundary">Local planning evidence only. Live catalog, enrollment, official audit, exceptions, and substitutions are not configured here.</div>
    </div>
  </section>
}

/**
 * Visual source: mockup-lab/01-academics/academics-planner-prototype.html
 * Approved target: Variant A · view=catalog, course-discovery bay.
 */
function CourseDiscoveryBay({ columns, selectedProgramId, onInspect }: {
  columns: ReturnType<typeof plannerTerms>
  selectedProgramId?: string
  onInspect: (courseId: string) => void
}) {
  const [query, setQuery] = useState('')
  const [scope, setScope] = useState<'all' | 'selected'>('all')
  const [selectedCandidate, setSelectedCandidate] = useState<LocalCatalogCandidate | undefined>()
  const [addOpen, setAddOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [credits, setCredits] = useState('')
  const [bcpm, setBcpm] = useState(false)
  const defaultDestination = columns.find((column) => !column.registered && !column.lockedAt)?.term ?? columns[0]?.term ?? 'New term'
  const [destination, setDestination] = useState(defaultDestination)
  const candidates = useMemo(() => localCatalogCandidates(), [])
  const normalizedQuery = query.trim().toLocaleLowerCase()
  const results = useMemo(() => candidates.filter((candidate) => {
    if (scope === 'selected' && selectedProgramId && !candidate.programIds.includes(selectedProgramId)) return false
    const requirementLabels = requirementLabelsForCandidate(candidate)
    return !normalizedQuery || `${candidate.code} ${requirementLabels.join(' ')}`.toLocaleLowerCase().includes(normalizedQuery)
  }).slice(0, 8), [candidates, normalizedQuery, scope, selectedProgramId])
  const selectedProgram = selectedProgramId ? planningRequirementSet(selectedProgramId) : undefined

  function openAdd(candidate: LocalCatalogCandidate) {
    setSelectedCandidate(candidate)
    setTitle('')
    setCredits('')
    setBcpm(false)
    setDestination(defaultDestination)
    setAddOpen(true)
  }

  function addCandidate() {
    if (!selectedCandidate || !title.trim()) return
    const parsedCredits = Number(credits)
    if (!Number.isFinite(parsedCredits) || parsedCredits <= 0) return
    const id = uid()
    const sourceVersion = `${selectedCandidate.catalogYears.join(', ')} · retrieved ${selectedCandidate.retrievedAt.join(', ')}`
    useStore.getState().addItem('courses', {
      id,
      term: destination,
      code: selectedCandidate.code,
      title: title.trim(),
      credits: parsedCredits,
      grade: '',
      bcpm,
      status: 'planned',
      inResidence: true,
      satisfies: [],
      notes: `Local Planning library reference · ${sourceVersion} · official audit required`,
      order: 0,
    })
    setAddOpen(false)
    onInspect(id)
  }

  return <section className="planning-catalog-dock" aria-label="In-app planning library">
    <header className="planning-catalog-head"><div><p className="planning-eyebrow">Planner tool · Local course library</p><h3>Find a course that fits the plan.</h3><p>Browse explicit course codes captured across {UNC_PLANNING_LIBRARY.length} source-versioned program records.</p></div><span className="planning-source-chip">2026–27 · retrieved 2026-08-25</span></header>
    <div className="planning-catalog-toolbar">
      <label className="planning-search-wrap" htmlFor="planner-course-search"><Search className="size-3" /><input id="planner-course-search" className="planning-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search captured course code or requirement" /></label>
      <label className="planning-library-filter"><span className="sr-only">Filter planning library</span><select value={scope} onChange={(event) => setScope(event.target.value as 'all' | 'selected')}><option value="all">All captured records</option><option value="selected" disabled={!selectedProgramId}>Selected program only</option></select></label>
    </div>
    <p className="planning-catalog-context"><b>Planning context:</b> {selectedProgram ? planningProgramLabel(selectedProgram) : 'No program selected'} · {defaultDestination}. Course titles, credits, offerings, and live sections are not included in this local evidence.</p>
    <div className="planning-library-grid">
      <div className="planning-catalog-results" aria-live="polite">{results.length ? results.map((candidate) => {
        const labels = requirementLabelsForCandidate(candidate)
        const selected = candidate.code === selectedCandidate?.code
        return <button type="button" key={candidate.code} className="planning-catalog-result" data-selected={selected || undefined} onClick={() => setSelectedCandidate(candidate)}><span><b>{candidate.code}</b><p>{labels.slice(0, 2).join(' · ') || 'Captured source mapping'}</p></span><span className="planning-eyebrow">Inspect →</span></button>
      }) : <div className="planning-catalog-empty"><b>No captured code matches.</b><br />This is a local evidence gap, not an official catalog result.</div>}</div>
      <div className="planning-library-detail">{selectedCandidate ? <>
        <p className="planning-eyebrow">Captured course detail</p>
        <h4>{selectedCandidate.code}</h4>
        <p>{requirementLabelsForCandidate(selectedCandidate).join(' · ') || 'No named requirement effect is captured.'}</p>
        <dl><div><dt>Catalog version</dt><dd>{selectedCandidate.catalogYears.join(' · ')}</dd></div><div><dt>Retrieved</dt><dd>{selectedCandidate.retrievedAt.join(' · ')}</dd></div><div><dt>Source records</dt><dd>{selectedCandidate.programIds.length} program record{selectedCandidate.programIds.length === 1 ? '' : 's'}</dd></div><div><dt>Evidence boundary</dt><dd>Code and planning relationship only</dd></div></dl>
        <button type="button" className="planning-control" data-primary="true" onClick={() => openAdd(selectedCandidate)}>＋ Add to plan</button>
      </> : <><p className="planning-eyebrow">Captured course detail</p><h4>Select a course code</h4><p>Its source version and local requirement relationship will appear here before you add anything.</p></>}</div>
    </div>
    <div className="planning-library-boundary"><b>{UNC_CATALOG_INTEGRATION.mode}.</b> {UNC_CATALOG_INTEGRATION.reason} No official completion or enrollment verdict is shown.</div>

    <Dialog open={addOpen} onOpenChange={setAddOpen}>
      <DialogContent className="planning-workspace bg-card sm:max-w-lg">
        <DialogHeader><DialogTitle>Add {selectedCandidate?.code ?? 'captured course'} to the plan</DialogTitle><DialogDescription>The library captured the code and source relationship only. Enter the missing course facts from your own record before saving.</DialogDescription></DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="planning-catalog-field sm:col-span-2"><span>Course title</span><input autoFocus required value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Enter the official title you have" /></label>
          <label className="planning-catalog-field"><span>Credits</span><input required inputMode="decimal" value={credits} onChange={(event) => setCredits(event.target.value)} placeholder="e.g. 3" /></label>
          <label className="planning-catalog-field"><span>Destination term</span><select value={destination} onChange={(event) => setDestination(event.target.value)}>{columns.filter((column) => !column.registered && !column.lockedAt).map((column) => <option key={column.id ?? column.term} value={column.term}>{column.term}</option>)}</select></label>
          <label className="planning-catalog-check sm:col-span-2"><input type="checkbox" checked={bcpm} onChange={(event) => setBcpm(event.target.checked)} /> Mark BCPM from your own classification evidence</label>
        </div>
        <div className="planning-boundary">Saved as a student-owned planned course. The source relationship remains candidate evidence and does not mark a requirement complete.</div>
        <DialogFooter><Button variant="ghost" onClick={() => setAddOpen(false)}>Cancel</Button><Button onClick={addCandidate} disabled={!title.trim() || !(Number(credits) > 0)}>Add to {destination}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  </section>
}

function requirementLabelsForCandidate(candidate: LocalCatalogCandidate) {
  const ids = new Set(candidate.requirementNodeIds)
  return UNC_PLANNING_LIBRARY.flatMap((program) => program.nodes
    .filter((node) => ids.has(`${program.id}:${node.id}`))
    .map((node) => node.label))
    .filter((label, index, labels) => labels.indexOf(label) === index)
}

function OutcomeRail({ mcatDate, selectedProgramId }: { mcatDate?: string; selectedProgramId?: string }) {
  const courses = useStore((s) => s.courses)
  const requirements = useStore((s) => s.requirements)
  const projection = outcomeProjection(courses)
  const late = prereqVsMcat(courses, mcatDate)
  const selectedProgram = selectedProgramId ? planningRequirementSet(selectedProgramId) : undefined
  const coverage = selectedProgram ? candidatePlanCoverage(selectedProgram, courses.map((course) => course.code)) : undefined
  const open = coverage
    ? coverage.filter((item) => item.state !== 'scheduled').map((item) => ({ id: item.node.id, label: item.node.label }))
    : unplacedRequirements(requirements, courses)

  return (
    <aside className="planning-card h-fit p-[14px]">
      <p className="planning-eyebrow">Plan outcome</p>
      <h4 className="mt-0.5 font-display text-sm font-extrabold">If this plan holds</h4>

      <div className="mt-2 grid grid-cols-2 gap-2">
        <Stat label="Cumulative" value={fmtGpa(projection.cumulative)} />
        <Stat label="Science (BCPM)" value={fmtGpa(projection.science)} />
      </div>
      {/* The inputs, named — a number without them is the thing U-9 forbids. */}
      <p className="mt-2 text-[10.5px] font-bold text-muted-foreground">
        From {projection.gradedCredits} graded credits. {projection.inProgressCredits} in progress and{' '}
        {projection.plannedCredits} planned are not included.
      </p>

      <div className="mt-3 border-t border-border pt-2.5">
        <p className={EYEBROW}>What this clears</p>
        {!mcatDate ? (
          <p className="mt-1 text-[11px] font-bold text-muted-foreground">
            MCAT sequencing is manual review until a test date is recorded.
          </p>
        ) : late.length ? (
          <ul className="mt-1 space-y-1 text-[11px] font-bold">
            {late.map((course) => (
              <li key={course.id} className="text-amber-700 dark:text-amber-300">
                {course.code} sits in {course.term}, at or after the test.
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-1 text-[11px] font-bold text-muted-foreground">
            Every recorded prerequisite is placed before the test date.
          </p>
        )}
      </div>

      <div className="mt-2.5">
        <p className="text-[10px] font-extrabold uppercase tracking-[0.08em] text-muted-foreground">Local selected-program coverage</p>
        {/* Named, not counted — a count is how one hides. */}
        <ul className="mt-1 space-y-0.5 text-[11px] font-bold text-muted-foreground">
          {open.slice(0, 6).map((item) => <li key={item.id}>{item.label}</li>)}
          {!open.length && <li>{selectedProgram ? 'No uncaptured selected-plan nodes are shown locally.' : 'None open against the recorded catalog.'}</li>}
        </ul>
        {open.length > 6 && (
          <p className="mt-1 text-[10.5px] font-bold text-muted-foreground/80">
            …and {open.length - 6} more in the requirement map.
          </p>
        )}
      </div>
      <div className="mt-3 border-t border-border pt-2.5">
        <p className={EYEBROW}>Best next move</p>
        <p className="mt-1 text-[11px] font-bold text-muted-foreground">{open[0] ? `Place a course against ${open[0].label}, then verify the mapping in the requirement map.` : 'Record a course or planning node when you are ready; this rail will not invent a recommendation.'}</p>
      </div>
    </aside>
  )
}

/** C — opens from a chip, commits nothing, and says which mappings are inferred. */
function Inspector({ course, onClose, onPlace }: { course: Course; onClose: () => void; onPlace: () => void }) {
  const courses = useStore((s) => s.courses)
  const requirements = useStore((s) => s.requirements)
  const patchItem = useStore((s) => s.patchItem)
  const softDeleteItems = useStore((s) => s.softDeleteItems)
  const [editing, setEditing] = useState(false)
  const effects = courseEffects(course, requirements, courses)

  const patch = (fields: Partial<Course>) => patchItem('courses', course.id, fields)
  // Soft delete, so an accidental removal is recoverable rather than final.
  const remove = () => { softDeleteItems('courses', [course.id], 'Removed course from plan'); onClose() }

  return (
    <aside className="planning-card h-fit p-[14px]">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className={EYEBROW}>Selected course</p>
          <h4 className="mt-0.5 font-display text-sm font-extrabold">{course.code}</h4>
          <p className="text-[11px] font-bold text-muted-foreground">{course.title}</p>
        </div>
        <Button size="sm" variant="ghost" onClick={onClose} aria-label="Close inspector">
          <X className="size-4" />
        </Button>
      </div>

      <div className="mt-2.5 border-t border-border pt-2.5">
        <p className={EYEBROW}>What it clears</p>
        {effects.clears.length ? (
          <ul className="mt-1.5 space-y-1.5">
            {effects.clears.map((effect) => (
              <li key={effect.label} className="rounded-lg border border-border bg-muted p-2">
                <b className="font-display text-[11.5px] font-extrabold">{effect.label}</b>
                <p className="text-[10.5px] font-bold text-muted-foreground">{effect.group}</p>
                <p className={cn(
                  'mt-0.5 text-[10px] font-bold',
                  effect.confidence === 'verified' ? 'text-muted-foreground' : 'text-amber-700 dark:text-amber-300',
                )}>
                  {effect.confidence === 'verified'
                    ? `Verified${effect.source ? ` · ${effect.source}` : ''}`
                    : 'Inferred mapping · confirm with an advisor'}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-1 text-[11px] font-bold text-muted-foreground">
            No recorded requirement names this course.
          </p>
        )}
      </div>

      {effects.unlocks.length > 0 && (
        <div className="mt-3 border-t border-border pt-2.5">
          <p className={EYEBROW}>What it unlocks</p>
          <ul className="mt-1 space-y-0.5 text-[11px] font-bold">
            {effects.unlocks.map((item) => <li key={item.id}>{item.code} — {item.title}</li>)}
          </ul>
        </div>
      )}

      {effects.offeringRisk && (
        <div className="mt-3 rounded-lg border border-amber-500/45 bg-amber-500/5 p-2 text-[11px] font-bold text-muted-foreground">
          <b className="font-display text-foreground">Offering risk. </b>{effects.offeringRisk}
        </div>
      )}

      <div className="mt-3 border-t border-border pt-2.5">
        {isProtected(course) ? (
          <p className="text-[10.5px] font-bold text-muted-foreground">This recorded course is locked from planning moves.</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            <Button size="sm" variant="outline" onClick={onPlace}>Choose term</Button>
            {/* A planned course had no edit or remove path: `Add course` writes
                the row immediately, so an empty or wrong record could be created
                and then never corrected or taken back. Both live here now. */}
            <Button size="sm" variant="outline" onClick={() => setEditing((open) => !open)}>
              {editing ? 'Done editing' : 'Edit details'}
            </Button>
            <Button size="sm" variant="ghost" onClick={remove}>
              <Trash2 className="size-3.5" /> Remove
            </Button>
          </div>
        )}
        {editing && !isProtected(course) && (
          <div className="mt-2.5 grid gap-1.5">
            <label className="planning-inspect-field">
              <small>Course code</small>
              <input value={course.code} placeholder="Not recorded" aria-label="Course code"
                onChange={(event) => patch({ code: event.target.value })} />
            </label>
            <label className="planning-inspect-field">
              <small>Title</small>
              <input value={course.title} placeholder="Not recorded" aria-label="Course title"
                onChange={(event) => patch({ title: event.target.value })} />
            </label>
            <label className="planning-inspect-field">
              <small>Credits</small>
              <input value={String(course.credits ?? '')} inputMode="decimal" aria-label="Credits"
                onChange={(event) => patch({ credits: Number(event.target.value) || 0 })} />
            </label>
          </div>
        )}
        <p className="mt-2 text-[10.5px] font-bold text-muted-foreground">Nothing changes until you choose a destination.</p>
      </div>
    </aside>
  )
}

function PlacementDialog({
  course, open, columns, label, onLabelChange, kind, onKindChange, onAdd, onPlace, onOpenChange,
}: {
  course?: Course
  open: boolean
  columns: ReturnType<typeof plannerTerms>
  label: string
  onLabelChange: (value: string) => void
  kind: PlannerTerm['kind']
  onKindChange: (value: PlannerTerm['kind']) => void
  onAdd: () => void
  onPlace: (course: Course, term: { id?: string; term: string; lockedAt?: number; registered: boolean }) => void
  onOpenChange: (open: boolean) => void
}) {
  const [previewTermId, setPreviewTermId] = useState<string | undefined>()
  const preview = columns.find((column) => (column.id ?? column.term) === previewTermId)
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{course ? `Place ${course.code}` : 'Add a planning term'}</DialogTitle>
          <DialogDescription>{course ? 'Choose a recorded term. Locked or registered terms cannot be changed here.' : 'A term is a planning slot, not an official registration record.'}</DialogDescription>
        </DialogHeader>
        {course && <div className="grid gap-2 sm:grid-cols-2">
          {columns.map((column) => {
            const blocked = Boolean(column.lockedAt || column.registered)
            return <Button key={column.id ?? column.term} variant={preview === column ? 'default' : 'outline'} className="h-auto justify-start py-3 text-left" disabled={blocked} onClick={() => setPreviewTermId(column.id ?? column.term)}>
              <span><b className="block font-display">{column.term}</b><span className="text-[11px] text-muted-foreground">{blocked ? (column.lockedAt ? 'Locked term' : 'Registered term') : `${column.credits} credits placed`}</span></span>
            </Button>
          })}
        </div>}
        {course && preview && <div className="rounded-xl border border-border bg-muted p-3 text-xs font-bold">
          <p><b className="font-display">Preview:</b> move {course.code} from {course.term} to {preview.term}.</p>
          <p className="mt-1 text-[11px] text-muted-foreground">The inspector names recorded requirement effects; no catalog substitute or official completion is inferred here.</p>
          <Button size="sm" className="mt-2" onClick={() => onPlace(course, preview)}>Place in {preview.term}</Button>
        </div>}
        <div className="border-t border-border pt-3">
          <p className={EYEBROW}>New term slot</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <input value={label} onChange={(event) => onLabelChange(event.target.value)} placeholder="e.g. Summer 2027" className="min-w-0 flex-1 rounded-lg border border-border bg-muted px-2.5 py-2 text-xs font-bold" />
            <select value={kind} onChange={(event) => onKindChange(event.target.value as PlannerTerm['kind'])} className="rounded-lg border border-border bg-muted px-2 text-xs font-bold"><option value="standard">Standard</option><option value="summer">Summer</option><option value="gap">Gap</option></select>
            <Button size="sm" variant="outline" onClick={onAdd} disabled={!label.trim()}>Add term</Button>
          </div>
        </div>
        <DialogFooter><Button variant="ghost" onClick={() => onOpenChange(false)}>Done</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function TermEditor({ term, onOpenChange }: { term?: PlannerTerm; onOpenChange: (open: boolean) => void }) {
  const [note, setNote] = useState(term?.note ?? '')
  const [locked, setLocked] = useState(Boolean(term?.lockedAt))
  const openedId = term?.id
  return (
    <Dialog open={Boolean(term)} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card">
        <DialogHeader><DialogTitle>Term details</DialogTitle><DialogDescription>Keep a short reason for a locked planning term. This is not an official registration status.</DialogDescription></DialogHeader>
        {term && <div className="space-y-3">
          <p className="font-display text-sm font-extrabold">{term.label}</p>
          <textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Optional note or constraint" className="min-h-20 w-full rounded-lg border border-border bg-muted p-2 text-xs font-bold" />
          <label className="flex items-center gap-2 text-xs font-bold"><input type="checkbox" checked={locked} onChange={(event) => setLocked(event.target.checked)} /> Lock this planning term</label>
        </div>}
        <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button onClick={() => {
          if (!openedId) return
          useStore.getState().update((draft) => {
            const target = draft.academics.classCenter.plannerTerms.find((slot) => slot.id === openedId)
            if (!target) return
            target.note = note.trim() || undefined
            target.lockedAt = locked ? (target.lockedAt ?? Date.now()) : undefined
            target.updatedAt = Date.now()
          })
          onOpenChange(false)
        }}>Save term details</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-muted p-2">
      <p className="text-[10px] font-bold text-muted-foreground">{label}</p>
      <p className="font-display text-lg font-extrabold tabular-nums">{value}</p>
    </div>
  )
}
