import { useMemo, useState } from 'react'
import { ArrowUpRight, FileText, Info, Sparkles } from 'lucide-react'
import type { TermReport, TermReportEvidenceItem } from '@/lib/types'
import { useStore } from '@/store/store'
import { uid } from '@/lib/id'
import { createTermReport, termReportEvidence } from '@/lib/academics/termReport'
import { aiBlocks, validateTermReportArtifact } from '@/lib/academics/termReportSynthesis'
import { assembleGenerationRequest } from '@/lib/generation/assemble'
import { studyTools, acceptStudySourceDisclosure, hasAcceptedStudySourceDisclosure } from '@/lib/intelligence/studyTools'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

const CARD = 'rounded-2xl border border-border bg-card shadow-[0_10px_26px_-14px_rgba(0,0,0,0.55)]'
const EYEBROW = 'font-display text-[10px] font-extrabold uppercase tracking-[0.1em] text-muted-foreground'

/**
 * The report is an Archive document, not a new Academics dashboard. It reads a
 * frozen snapshot, so the evidence control always explains the exact record
 * that supported the saved wording.
 */
export function TermReportPanel({ focusReportId }: { focusReportId?: string }) {
  const reports = useStore((state) => state.academics.classCenter.termReports ?? [])
  const center = useStore((state) => state.academics.classCenter)
  const courses = useStore((state) => state.courses)
  const update = useStore((state) => state.update)
  const [selectedId, setSelectedId] = useState(focusReportId ?? reports.at(-1)?.id ?? '')
  const [evidence, setEvidence] = useState<TermReportEvidenceItem | null>(null)
  const [sourceReviewOpen, setSourceReviewOpen] = useState(false)
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([])
  const [acceptedDisclosure, setAcceptedDisclosure] = useState(() => hasAcceptedStudySourceDisclosure())
  const [generating, setGenerating] = useState(false)
  const report = reports.find((item) => item.id === selectedId) ?? reports.at(-1)
  const courseNames = useMemo(() => new Map(courses.map((course) => [course.id, `${course.code} · ${course.title}`])), [courses])
  const factsById = useMemo(() => new Map(report?.snapshot.facts.map((fact) => [fact.id, fact]) ?? []), [report])
  const sourceFiles = useMemo(() => center.files.filter((file) => report?.courseIds.includes(file.courseId) && center.sourceChunks.some((chunk) => chunk.fileId === file.id && chunk.content.trim())), [center.files, center.sourceChunks, report?.courseIds])
  const nextTerm = useMemo(() => {
    // Only offer a real future planning slot. Selecting the first differently
    // named term could otherwise send an end-of-term reflection backwards.
    const plannedTerms = new Set(courses
      .filter((course) => course.status === 'planned' && course.term !== report?.term)
      .map((course) => course.term))
    return center.plannerTerms.find((term) => plannedTerms.has(term.label) && !/transfer|ap credit/i.test(term.label))
  }, [center.plannerTerms, courses, report?.term])

  if (!report) return null

  return (
    <section id={`term-report-${report.id}`} className={cn(CARD, 'scroll-mt-24 p-5')}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className={EYEBROW}>Term report</p>
          <h2 className="mt-1 font-display text-xl font-extrabold">{report.term}: what to take into next term.</h2>
          <p className="mt-1 text-sm font-semibold text-muted-foreground">
            Created from the course record you saved on {new Date(report.createdAt).toLocaleDateString()}.
          </p>
        </div>
        {reports.length > 1 && (
          <select
            aria-label="Choose a saved term report"
            value={report.id}
            onChange={(event) => setSelectedId(event.target.value)}
            className="h-9 rounded-lg border border-border bg-muted px-2 text-xs font-bold"
          >
            {reports.slice().reverse().map((item) => <option key={item.id} value={item.id}>{item.term} · {statusLabel(item)}</option>)}
          </select>
        )}
      </div>

      {report.status === 'insufficient-evidence' && (
        <div className="mt-4 rounded-xl border border-dashed border-border bg-muted p-4">
          <p className="font-display text-sm font-extrabold">Too little saved evidence to make a useful report.</p>
          <p className="mt-1 text-sm font-semibold text-muted-foreground">{report.providerMessage}</p>
          <p className="mt-2 text-xs font-semibold text-muted-foreground">The records below are still yours to revisit. No generic study advice was generated.</p>
        </div>
      )}

      {report.status === 'unavailable' && (
        <div className="mt-4 rounded-xl border border-border bg-muted p-4">
          <p className="font-display text-sm font-extrabold">AI observations are unavailable right now.</p>
          <p className="mt-1 text-sm font-semibold text-muted-foreground">{report.providerMessage || 'Your local facts are still available below; nothing was sent or saved as a partial report.'}</p>
        </div>
      )}

      {report.status === 'draft' && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-muted p-3.5">
          <div><p className="font-display text-sm font-extrabold">Your local facts are ready.</p><p className="mt-0.5 text-xs font-semibold text-muted-foreground">Choose reviewed supporting material before asking AI to turn this closed record into plain-language observations.</p></div>
          <Button size="sm" variant="outline" onClick={() => setSourceReviewOpen(true)}><Sparkles className="size-4" /> Generate observations</Button>
        </div>
      )}
      {report.status === 'unavailable' && <Button size="sm" variant="outline" className="mt-3" onClick={() => setSourceReviewOpen(true)}><Sparkles className="size-4" /> Try again</Button>}

      <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,1fr)_17rem]">
        <div className="space-y-3">
          {report.blocks.filter((block) => block.kind !== 'limit').map((block) => (
            <article key={block.id} className="rounded-xl border border-border bg-muted p-4">
              <p className={EYEBROW}>{block.kind === 'experiment' ? 'Carry into next term' : block.source === 'ai' ? 'What stands out' : 'Your term at a glance'}</p>
              <h3 className="mt-1 font-display text-base font-extrabold">{block.title}</h3>
              <p className="mt-1.5 text-sm font-semibold leading-relaxed text-muted-foreground">{block.text}</p>
              {block.evidenceIds.length > 0 && <div className="mt-3 flex flex-wrap gap-1.5">
                {block.evidenceIds.map((id) => {
                  const fact = factsById.get(id)
                  if (!fact) return null
                  return <button key={id} type="button" onClick={() => setEvidence(fact)} className="rounded-md border border-border bg-card px-2 py-1 text-[11px] font-bold text-[var(--cat-gpa)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Why this appears</button>
                })}
              </div>}
            </article>
          ))}
          {!report.blocks.some((block) => block.kind !== 'limit') && <p className="rounded-xl border border-dashed border-border bg-muted p-4 text-sm font-semibold text-muted-foreground">No report claims were saved for this term.</p>}
        </div>

        <aside className="rounded-xl border border-border bg-muted p-4">
          <p className={EYEBROW}>How to read this</p>
          <p className="mt-1.5 text-sm font-semibold leading-relaxed text-muted-foreground">{report.snapshot.evidenceLimit}</p>
          <div className="mt-4 border-t border-border pt-3">
            <p className={EYEBROW}>Courses included</p>
            <ul className="mt-1.5 space-y-1.5 text-xs font-bold text-muted-foreground">
              {report.courseIds.map((courseId) => <li key={courseId} className="flex gap-1.5"><FileText className="mt-0.5 size-3.5 text-[var(--cat-gpa)]" />{courseNames.get(courseId) ?? 'Saved course'}</li>)}
            </ul>
          </div>
          {report.status === 'ready' && nextTerm && <Button size="sm" variant="outline" className="mt-4 w-full" onClick={() => saveCarryForward(report, nextTerm.id, update)}><ArrowUpRight className="size-4" /> {report.carryForwardDraft ? 'Planning draft saved' : 'Save a planning draft'}</Button>}
        </aside>
      </div>

      <Dialog open={Boolean(evidence)} onOpenChange={(open) => { if (!open) setEvidence(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Why this appears</DialogTitle>
            <DialogDescription>This report points to the record it used; it does not create a second editor here.</DialogDescription>
          </DialogHeader>
          {evidence && <div className="rounded-xl border border-border bg-muted p-4"><p className="font-display text-sm font-extrabold">{evidence.label}</p><p className="mt-1 text-sm font-semibold text-muted-foreground">{evidence.detail}</p><p className="mt-3 flex items-center gap-1.5 text-xs font-bold text-muted-foreground"><Info className="size-3.5" /> {evidence.ref.kind.replace('-', ' ')} record · {courseNames.get(evidence.ref.courseId) ?? evidence.ref.label}</p></div>}
        </DialogContent>
      </Dialog>

      <Dialog open={sourceReviewOpen} onOpenChange={setSourceReviewOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Generate Term Report observations</DialogTitle>
            <DialogDescription>Your saved term facts are included. Class material below is optional and leaves this device only if you select it.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="rounded-xl border border-border bg-muted p-3"><p className="font-display text-sm font-extrabold">Local facts already included</p><p className="mt-1 text-xs font-semibold text-muted-foreground">Final grades you recorded, returned work, review history, marked mistakes, class notes, and feedback—nothing else.</p></div>
            <div>
              <p className={EYEBROW}>Optional supporting material</p>
              {sourceFiles.length ? <div className="mt-2 space-y-2">{sourceFiles.map((file) => <label key={file.id} className="flex cursor-pointer gap-2 rounded-lg border border-border bg-muted p-2.5 text-sm font-semibold"><input type="checkbox" checked={selectedFileIds.includes(file.id)} onChange={() => setSelectedFileIds((current) => current.includes(file.id) ? current.filter((id) => id !== file.id) : [...current, file.id])} /><span>{file.title}<span className="ml-1 text-xs text-muted-foreground">· selected excerpts only</span></span></label>)}</div> : <p className="mt-2 rounded-lg border border-dashed border-border bg-muted p-3 text-sm font-semibold text-muted-foreground">No processed class material is available for this report. You can still use the saved local facts.</p>}
            </div>
            <label className="flex gap-2 rounded-xl border border-border bg-card p-3 text-xs font-semibold text-muted-foreground"><input type="checkbox" checked={acceptedDisclosure} onChange={(event) => { setAcceptedDisclosure(event.target.checked); if (event.target.checked) acceptStudySourceDisclosure() }} /><span>I understand that the compact facts above and any selected excerpts will be sent to the configured AI provider only to generate this report.</span></label>
          </div>
          <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setSourceReviewOpen(false)}>Cancel</Button><Button disabled={!acceptedDisclosure || generating} onClick={() => void generateReport()}><Sparkles className="size-4" /> {generating ? 'Generating…' : 'Generate report'}</Button></div>
        </DialogContent>
      </Dialog>
    </section>
  )

  async function generateReport() {
    if (!report || generating) return
    const now = Date.now()
    const compilation = termReportEvidence({ courses, center, term: report.term, selectedFileIds, now })
    if (!compilation.eligible) {
      update((draft) => {
        const existing = draft.academics.classCenter.termReports.find((item) => item.id === report.id)
        if (existing) { existing.status = 'insufficient-evidence'; existing.snapshot = compilation.snapshot; existing.blocks = compilation.localBlocks; existing.providerMessage = compilation.reason; existing.updatedAt = now }
      })
      setSourceReviewOpen(false)
      return
    }
    setGenerating(true)
    const request = assembleGenerationRequest({
      specId: 'term-report-v1',
      chunkIds: [],
      request: `Create a concise report for ${report.term}.`,
      controls: { source_mode: 'SOURCE_ONLY' },
    })
    const response = await studyTools.termReport({
      action: 'term-report', term: report.term, specId: request.specId, specHash: request.specHash, systemPrompt: request.systemPrompt,
      evidence: compilation.snapshot.facts.map((item) => ({ id: item.id, label: item.label, content: item.sourceText || `${item.label}\n${item.detail}` })),
    })
    setGenerating(false)
    if (!response.ok || !validateTermReportArtifact(response.data.artifact, new Set(compilation.snapshot.facts.map((item) => item.id)))) {
      const message = response.ok ? 'The generated report did not pass its evidence checks. Nothing new was saved.' : response.message
      update((draft) => {
        const existing = draft.academics.classCenter.termReports.find((item) => item.id === report.id)
        if (existing) { existing.status = 'unavailable'; existing.providerMessage = message; existing.updatedAt = now }
      })
      return
    }
    const revision = createTermReport({ id: uid(), input: { courses, center, term: report.term, selectedFileIds, now }, order: reports.length })
    revision.status = 'ready'
    revision.blocks = [...compilation.localBlocks.filter((block) => block.kind !== 'limit'), ...aiBlocks(response.data.artifact)]
    revision.supersedesReportId = report.id
    update((draft) => { draft.academics.classCenter.termReports.push(revision) })
    setSelectedId(revision.id)
    setSourceReviewOpen(false)
  }
}

function statusLabel(report: TermReport) {
  return ({ draft: 'local facts', ready: 'report ready', unavailable: 'AI unavailable', 'insufficient-evidence': 'too little evidence' } as const)[report.status]
}

function saveCarryForward(report: TermReport, plannerTermId: string, update: ReturnType<typeof useStore.getState>['update']) {
  const experiments = report.blocks.filter((block) => block.kind === 'experiment').map((block) => `${block.title}: ${block.text}`).join('\n')
  if (!experiments) return
  update((draft) => {
    const saved = draft.academics.classCenter.termReports.find((item) => item.id === report.id)
    if (!saved || saved.carryForwardDraft) return
    const plannerTerm = draft.academics.classCenter.plannerTerms.find((item) => item.id === plannerTermId)
    if (!plannerTerm) return
    const prefix = `Term Report · ${report.term}`
    plannerTerm.note = [plannerTerm.note, `${prefix}\n${experiments}`].filter(Boolean).join('\n\n')
    plannerTerm.updatedAt = Date.now()
    saved.carryForwardDraft = experiments
    saved.updatedAt = Date.now()
  })
}
