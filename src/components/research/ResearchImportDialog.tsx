import { useRef, useState } from 'react'
import { AlertTriangle, ArrowLeft, Check, FileUp } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { SelectField } from '@/components/ui/select-field'
import { AnimatedFileUpload } from '@/components/motion'
import { SyllabusReadingProgress, SyllabusSelectedFiles } from '@/components/academics/SyllabusReadingProgress'
import type { DocumentExtractionProgress } from '@/lib/academics/documentText'
import { fmtDate } from '@/lib/date'
import { activeResearchLabs, currentResearchLab, validResearchDay } from '@/lib/research'
import { applyResearchImport, extractResearchFile, parseResearchText, reminderText, RESEARCH_IMPORT_KINDS, RESEARCH_IMPORT_TITLES, type ResearchImportItem, type ResearchImportKind, type ResearchImportProposal, type ResearchImportSummary } from '@/lib/researchImport'
import type { AppData } from '@/lib/types'
import { cn } from '@/lib/utils'
import { SaveState } from './ResearchEditors'
import type { ResearchSave } from './useResearchSave'

const DOCUMENT_LABEL: Record<ResearchImportProposal['documentKind'], string> = {
  'lab-notes': 'Lab notes', onboarding: 'Lab onboarding document', mixed: 'Lab notes and onboarding details', unrecognized: 'Not recognised as lab material',
}
const WHERE: Record<ResearchImportKind, string> = {
  lab: 'Your lab (empty fields only)', people: 'People', logs: 'Log', upcoming: 'Upcoming',
  meetings: 'Pinned reminders', checklist: 'Pinned reminders', reading: 'Pinned reminders', guidelines: 'Pinned reminders',
}

type Step = 'source' | 'review' | 'done'

export function ResearchImportDialog({ open, onOpenChange, data, writer }: { open: boolean; onOpenChange: (open: boolean) => void; data: AppData; writer: ResearchSave }) {
  const [step, setStep] = useState<Step>('source')
  const [files, setFiles] = useState<File[]>([])
  const [pasted, setPasted] = useState('')
  const [reading, setReading] = useState(false)
  const [progress, setProgress] = useState<DocumentExtractionProgress | null>(null)
  const [error, setError] = useState('')
  const [proposal, setProposal] = useState<ResearchImportProposal | null>(null)
  const [items, setItems] = useState<ResearchImportItem[]>([])
  const [target, setTarget] = useState('')
  const [newName, setNewName] = useState('')
  const [summary, setSummary] = useState<ResearchImportSummary | null>(null)
  const abort = useRef<AbortController | null>(null)
  const labs = activeResearchLabs(data.experiences)

  function reset() {
    abort.current?.abort(); abort.current = null
    setStep('source'); setFiles([]); setPasted(''); setReading(false); setProgress(null); setError(''); setProposal(null); setItems([]); setSummary(null)
  }
  function close(next: boolean) {
    if (!next && writer.pending) return
    if (!next) reset()
    onOpenChange(next)
  }

  async function read() {
    setError(''); setReading(true); setProgress(null)
    const controller = new AbortController(); abort.current = controller
    try {
      const result = pasted.trim() ? parseResearchText(pasted, 'Pasted text') : await extractResearchFile(files[0], { signal: controller.signal, onProgress: setProgress })
      if (controller.signal.aborted) return
      const labName = result.items.find((item) => item.labField === 'org')?.label ?? ''
      const current = currentResearchLab(data.experiences, data.experienceHourEntries)
      const named = labs.find((lab) => labName && lab.org.trim().toLowerCase() === labName.toLowerCase())
      // The named lab if it exists; otherwise a new lab, unless the document names
      // no lab at all, in which case the current lab is the natural home.
      setTarget(named?.id ?? (!labs.length || labName ? 'new' : current?.id ?? labs[0].id))
      setNewName(labName || 'My lab')
      setProposal(result); setItems(result.items); setStep('review')
    } catch (cause) {
      if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : 'This file could not be read.')
    } finally {
      if (abort.current === controller) abort.current = null
      setReading(false); setProgress(null)
    }
  }

  const patch = (id: string, change: Partial<ResearchImportItem>) => setItems((list) => list.map((item) => item.id === id ? { ...item, ...change } : item))
  const reviewable = items.filter((item) => item.labField !== 'org')
  const chosen = reviewable.filter((item) => item.selected && item.label.trim() && (item.kind !== 'logs' && item.kind !== 'upcoming' || validResearchDay(item.date)))

  async function save() {
    if (!proposal || !chosen.length) return
    let result: ResearchImportSummary | null = null
    const ok = await writer.save((draft) => {
      result = applyResearchImport(draft, target === 'new' ? { kind: 'new', name: newName } : { kind: 'existing', labId: target }, chosen)
    })
    if (ok && result) { setSummary(result); setStep('done') }
  }

  return <Dialog open={open} onOpenChange={close}>
    <DialogContent className="research-import max-h-[88vh] max-w-2xl overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{step === 'source' ? 'Import from a document' : step === 'review' ? 'Review what was found' : 'Imported'}</DialogTitle>
        <DialogDescription>{step === 'source'
          ? 'Lab notes, an hours spreadsheet, or your lab’s onboarding document. It’s read on this device, and nothing is saved until you review it.'
          : step === 'review' ? `${proposal?.sourceName} · ${DOCUMENT_LABEL[proposal?.documentKind ?? 'unrecognized']}. Check what to keep; unchecked items are not saved.`
            : 'Saved to your Research tab.'}</DialogDescription>
      </DialogHeader>

      {step === 'source' && <div className="grid gap-4">
        <AnimatedFileUpload accept=".pdf,.docx,.txt,.csv,.tsv,.md,text/plain,text/csv" multiple={false} onFiles={(next) => { setFiles(next.slice(0, 1)); setError('') }} label="Drop a lab document here" description="DOCX, PDF, TXT or CSV. The file stays on this device." />
        <SyllabusSelectedFiles files={files} disabled={reading} onRemove={() => setFiles([])} />
        <label className="grid gap-1 text-xs font-bold">Or paste text
          <Textarea className="min-h-28 font-normal" value={pasted} onChange={(event) => setPasted(event.target.value)} placeholder={'10/6 — DPPH run 3 on extract B (1–4:30pm)\nAbsorbance drifted on replicate 2'} />
        </label>
        <p className="text-xs text-muted-foreground">Each dated entry becomes a lab day. A future date, or a dated deadline inside an entry, goes to Upcoming instead.</p>
        {error && <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm font-bold">{error} Try another file or paste the text instead.</p>}
        {reading && progress && files[0] && <SyllabusReadingProgress progress={{ ...progress, fileIndex: 1, fileCount: 1, fileName: files[0].name, overallProgress: progress.progress }} />}
        <div className="flex justify-end"><Button disabled={reading || (!files.length && !pasted.trim())} onClick={() => void read()}><FileUp />{reading ? 'Reading…' : 'Read document'}</Button></div>
      </div>}

      {step === 'review' && proposal && <div className="grid gap-3">
        {(proposal.scanDetected || proposal.documentKind === 'unrecognized') && <p className="flex gap-2 rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm" role="status"><AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" />{proposal.scanDetected ? 'Little or no text could be read from this file. Try a clearer copy or paste the text.' : 'This doesn’t look like lab notes or an onboarding document. Anything listed below can still be kept.'}</p>}
        <section className="research-import-group">
          <h3>Save to</h3>
          <SelectField aria-label="Save to lab" value={target} onValueChange={setTarget} options={[...labs.map((lab) => ({ value: lab.id, label: lab.org })), { value: 'new', label: 'A new lab' }]} />
          {target === 'new' && <label className="grid gap-1 text-xs font-bold">New lab name<Input value={newName} onChange={(event) => setNewName(event.target.value)} /></label>}
          {target === 'new' && <p className="text-xs text-muted-foreground">The new lab becomes your current lab.</p>}
        </section>
        {RESEARCH_IMPORT_KINDS.filter((kind) => reviewable.some((item) => item.kind === kind)).map((kind) => <ReviewGroup key={kind} kind={kind} items={reviewable.filter((item) => item.kind === kind)} onPatch={patch} />)}
        {proposal.notFound.length > 0 && <p className="text-xs text-muted-foreground">Not found in this document: {proposal.notFound.map((kind) => RESEARCH_IMPORT_TITLES[kind].toLowerCase()).join(', ')}.</p>}
        <SaveState writer={writer} />
      </div>}

      {step === 'done' && summary && <div className="grid gap-2" role="status">
        <p className="flex items-center gap-2 font-bold"><Check className="size-4 text-primary" />{Object.keys(summary.added).length ? summary.lab === 'created' ? 'Created your lab and added:' : 'Added:' : summary.lab === 'updated' ? 'Lab details filled in. Nothing else was new.' : 'Nothing new. Everything checked was already in Research.'}</p>
        <ul className="grid gap-1 text-sm">{RESEARCH_IMPORT_KINDS.filter((kind) => summary.added[kind]).map((kind) => <li key={kind}>{summary.added[kind]} · {RESEARCH_IMPORT_TITLES[kind].toLowerCase()} → {WHERE[kind]}</li>)}
          {summary.lab === 'updated' && Object.keys(summary.added).length > 0 && <li>Lab details filled in</li>}</ul>
        {summary.skipped > 0 && <p className="text-xs text-muted-foreground">{summary.skipped} already in Research, so skipped.</p>}
        <p className="text-xs text-muted-foreground">Reminders can be edited or removed from the Your lab panel. Deleted items go to Trash.</p>
      </div>}

      <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-between">
        {step === 'review' ? <Button variant="ghost" disabled={writer.pending} onClick={() => { setStep('source'); setProposal(null) }}><ArrowLeft />Choose another file</Button> : <span />}
        {step === 'review' && <Button disabled={writer.pending || !chosen.length} onClick={() => void save()}>{writer.pending ? 'Saving…' : `Save ${chosen.length} ${chosen.length === 1 ? 'item' : 'items'}`}</Button>}
        {step !== 'review' && <Button variant={step === 'done' ? 'default' : 'ghost'} onClick={() => close(false)}>{step === 'done' ? 'Done' : 'Cancel'}</Button>}
      </DialogFooter>
    </DialogContent>
  </Dialog>
}

function ReviewGroup({ kind, items, onPatch }: { kind: ResearchImportKind; items: ResearchImportItem[]; onPatch: (id: string, change: Partial<ResearchImportItem>) => void }) {
  const selected = items.filter((item) => item.selected).length
  const [open, setOpen] = useState(selected > 0)
  const all = selected === items.length
  return <section className="research-import-group" aria-label={RESEARCH_IMPORT_TITLES[kind]}>
    <div className="flex flex-wrap items-center justify-between gap-2">
      <button type="button" className="research-import-toggle" aria-expanded={open} onClick={() => setOpen(!open)}>
        <h3>{RESEARCH_IMPORT_TITLES[kind]}</h3><span className="text-muted-foreground">{selected} of {items.length} · {WHERE[kind]}</span>
      </button>
      <Button variant="link" size="sm" onClick={() => { items.forEach((item) => onPatch(item.id, { selected: !all })); setOpen(true) }}>{all ? 'Clear' : 'Select all'}</Button>
    </div>
    {open && <ul className="grid gap-1.5">{items.map((item) => <ReviewItem key={item.id} item={item} onPatch={onPatch} />)}</ul>}
  </section>
}

function ReviewItem({ item, onPatch }: { item: ResearchImportItem; onPatch: (id: string, change: Partial<ResearchImportItem>) => void }) {
  const [editing, setEditing] = useState(false)
  const preview = item.kind === 'meetings' || item.kind === 'checklist' || item.kind === 'reading' || item.kind === 'guidelines' ? reminderText(item) : item.label
  return <li className={cn('research-import-item', !item.selected && 'is-off')}>
    <Checkbox animated={false} checked={item.selected} aria-label={`Keep ${item.label}`} onCheckedChange={(value) => onPatch(item.id, { selected: value === true })} />
    <div className="min-w-0 flex-1">
      {editing ? <div className="grid gap-1.5">
        {(item.kind === 'logs' || item.kind === 'upcoming') && <div className="grid grid-cols-2 gap-1.5">
          <Input type="date" aria-label="Date" value={item.date ?? ''} onChange={(event) => onPatch(item.id, { date: event.target.value })} />
          {item.kind === 'logs' && <Input type="number" min="0" step="any" aria-label="Hours" placeholder="Hours" value={item.hours ?? ''} onChange={(event) => onPatch(item.id, { hours: event.target.value ? Number(event.target.value) : undefined })} />}
        </div>}
        <Input aria-label="Text" value={item.label} onChange={(event) => onPatch(item.id, { label: event.target.value })} />
        {item.kind === 'logs' && <Textarea aria-label="Thoughts" value={item.detail ?? ''} onChange={(event) => onPatch(item.id, { detail: event.target.value })} />}
        <Button variant="secondary" size="sm" className="justify-self-start" onClick={() => setEditing(false)}>Done</Button>
      </div> : <>
        <p className="break-words">
          {item.date && <time className="mr-2 font-bold" dateTime={item.date}>{fmtDate(item.date, { month: 'short', day: 'numeric', year: 'numeric' })}</time>}
          {item.hours ? <span className="research-hours mr-2">{item.hours} h</span> : null}
          <span className={item.kind === 'people' || item.kind === 'lab' ? 'font-bold' : undefined}>{item.kind === 'lab' ? `${item.labField === 'since' ? 'Since' : item.labField === 'pi' ? 'PI' : 'Institution'}: ${item.label}` : preview}</span>
          {item.confidence === 'low' && <span className="research-import-check">Check</span>}
        </p>
        {item.detail && item.kind !== 'checklist' && <p className="line-clamp-2 whitespace-pre-wrap break-words text-muted-foreground">{item.detail}</p>}
        <p className="line-clamp-1 break-all text-xs text-muted-foreground" title={`${item.evidence.location}: ${item.evidence.quote}`}>From “{item.evidence.quote}”{item.labField === 'pi' ? ' · makes this person your lab’s PI' : ''}</p>
      </>}
    </div>
    {!editing && item.kind !== 'lab' && item.kind !== 'people' && <Button variant="ghost" size="sm" aria-label={`Edit ${item.label}`} onClick={() => setEditing(true)}>Edit</Button>}
  </li>
}
