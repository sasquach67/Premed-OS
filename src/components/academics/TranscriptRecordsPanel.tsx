import { useRef, useState } from 'react'
import { Download, FileText, Paperclip, Pencil, Plus, Trash2, X } from 'lucide-react'
import type { Course, TranscriptCourseRecord, TranscriptCourseType } from '@/lib/types'
import { uid } from '@/lib/id'
import { retainLocalBlob } from '@/lib/localBlobStore'
import { courseworkExport } from '@/lib/academics/evidence'
import { useStore } from '@/store/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'

const emptyForm = { institution: '', courseNumberExact: '', titleExact: '', creditsExact: '', gradeExact: '', term: '', year: '', courseType: '', displayName: '', classificationSource: '', classificationReason: '', evidenceFileId: '' }
const COURSE_TYPES: TranscriptCourseType[] = ['regular', 'ap', 'ib', 'transfer', 'dual-enrollment', 'repeat', 'withdrawal', 'pass-fail']
const PLANNER_TERM_TYPES = new Set<TranscriptCourseType>(['regular', 'repeat', 'withdrawal', 'pass-fail'])

function exactCourseType(value: string): TranscriptCourseType | undefined {
  const normalized = value.trim().toLocaleLowerCase() as TranscriptCourseType
  return COURSE_TYPES.includes(normalized) ? normalized : undefined
}

export function TranscriptRecordsPanel({ courses, entryOnly = false }: { courses: Course[]; entryOnly?: boolean }) {
  const center = useStore((state) => state.academics.classCenter)
  const evidenceInput = useRef<HTMLInputElement>(null)
  const [attaching, setAttaching] = useState(false)
  const update = useStore((state) => state.update)
  const [courseId, setCourseId] = useState('')
  const [form, setForm] = useState(emptyForm)
  const [editingRecordId, setEditingRecordId] = useState<string>()
  const [pendingRemovalId, setPendingRemovalId] = useState<string>()
  const records = [...center.transcriptRecords].sort((a, b) => a.order - b.order)
  const formFields = Object.keys(emptyForm) as Array<keyof typeof emptyForm>

  /**
   * The evidence picker could only choose a file that already existed, so a
   * student holding a photo of the transcript line had no way to attach it from
   * this flow. This retains the image on this device and links it in one step.
   */
  async function attachEvidence(file: File) {
    setAttaching(true)
    const fileId = uid()
    let blobRef: string | undefined
    try { blobRef = await retainLocalBlob(`idb://academics/transcript-line/${fileId}`, file) }
    catch { blobRef = undefined }
    update((draft) => {
      draft.academics.classCenter.files.push({
        id: fileId,
        ...(courseId ? { courseId } : {}),
        sourceType: 'upload',
        title: file.name,
        type: 'transcript',
        blobRef,
        fileName: file.name,
        mimeType: file.type || undefined,
        linkedTopicIds: [],
        owner: 'mine',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        order: draft.academics.classCenter.files.length,
      })
    })
    setForm((current) => ({ ...current, evidenceFileId: fileId }))
    setAttaching(false)
  }

  function createRecord() {
    if (!form.institution.trim() || !form.courseNumberExact.trim() || !form.titleExact.trim()) return
    const now = Date.now()
    update((draft) => {
      if (editingRecordId) {
        const record = draft.academics.classCenter.transcriptRecords.find((item) => item.id === editingRecordId)
        if (!record) return
        Object.assign(record, {
          ...(courseId ? { courseId } : {}),
          institution: form.institution.trim(),
          courseNumberExact: form.courseNumberExact.trim(),
          titleExact: form.titleExact.trim(),
          creditsExact: form.creditsExact.trim(),
          gradeExact: form.gradeExact.trim(),
          term: form.term.trim(),
          year: form.year.trim(),
          courseType: form.courseType.trim(),
          displayName: form.displayName.trim() || undefined,
          evidenceFileId: form.evidenceFileId || undefined,
          classificationSource: form.classificationSource.trim() || undefined,
          classificationReason: form.classificationReason.trim() || undefined,
          updatedAt: now,
        })
        if (!courseId) delete record.courseId
        return
      }
      // Ordinary coursework can link to the operational plan. AP/IB, transfer,
      // and dual-enrollment stay canonical in Grades & Archive and do not
      // create a shadow Planner course or "Prior credit" semester.
      let linkedId = courseId
      const courseType = exactCourseType(form.courseType)
      const isPriorCredit = Boolean(courseType && !PLANNER_TERM_TYPES.has(courseType))
      if (isPriorCredit) linkedId = ''
      if (!linkedId && !isPriorCredit) {
        const wanted = form.courseNumberExact.trim().toLowerCase().replace(/\s+/g, ' ')
        const exactTerm = [form.term.trim(), form.year.trim()].filter(Boolean).join(' ')
        const belongsOnPlanner = Boolean(courseType && PLANNER_TERM_TYPES.has(courseType) && exactTerm)
        const match = belongsOnPlanner ? draft.courses.find((c) =>
          c.code.trim().toLowerCase().replace(/\s+/g, ' ') === wanted
          && c.term.trim().toLocaleLowerCase() === exactTerm.toLocaleLowerCase()) : undefined
        if (match) linkedId = match.id
        else if (belongsOnPlanner) {
          linkedId = uid()
          const credits = Number(form.creditsExact) || 0
          draft.courses.push({
            id: linkedId,
            term: exactTerm,
            code: form.courseNumberExact.trim(),
            title: form.titleExact.trim(),
            credits,
            grade: '',
            bcpm: false,
            status: 'completed',
            inResidence: courseType === 'regular',
            satisfies: [],
            ...(courseType ? { transcript: {
              institution: form.institution.trim(),
              courseNumber: form.courseNumberExact.trim(),
              courseTitle: form.titleExact.trim(),
              termLabel: exactTerm,
              creditHours: credits || null,
              gradeRecorded: form.gradeExact.trim(),
              courseType,
              capturedAt: now,
              updatedAt: now,
            } } : {}),
            order: draft.courses.length,
          })
        }
      }
      draft.academics.classCenter.transcriptRecords.push({
      id: uid(), ...(linkedId ? { courseId: linkedId } : {}),
      institution: form.institution.trim(), courseNumberExact: form.courseNumberExact.trim(), titleExact: form.titleExact.trim(), creditsExact: form.creditsExact.trim(), gradeExact: form.gradeExact.trim(), term: form.term.trim(), year: form.year.trim(), courseType: form.courseType.trim(),
      displayName: form.displayName.trim() || undefined, evidenceFileId: form.evidenceFileId || undefined, classificationSource: form.classificationSource.trim() || undefined, classificationReason: form.classificationReason.trim() || undefined,
      createdAt: now, updatedAt: now, order: draft.academics.classCenter.transcriptRecords.length,
      })
    })
    setForm(emptyForm)
    setCourseId('')
    setEditingRecordId(undefined)
  }
  function startEditing(record: TranscriptCourseRecord) {
    setEditingRecordId(record.id)
    setCourseId(record.courseId ?? '')
    setForm({
      institution: record.institution,
      courseNumberExact: record.courseNumberExact,
      titleExact: record.titleExact,
      creditsExact: record.creditsExact,
      gradeExact: record.gradeExact,
      term: record.term,
      year: record.year,
      courseType: record.courseType,
      displayName: record.displayName ?? '',
      classificationSource: record.classificationSource ?? '',
      classificationReason: record.classificationReason ?? '',
      evidenceFileId: record.evidenceFileId ?? '',
    })
  }
  function cancelEditing() {
    setEditingRecordId(undefined)
    setCourseId('')
    setForm(emptyForm)
  }
  function removeRecord(recordId: string) {
    update((draft) => {
      draft.academics.classCenter.transcriptRecords = draft.academics.classCenter.transcriptRecords.filter((record) => record.id !== recordId)
    })
    if (editingRecordId === recordId) cancelEditing()
    setPendingRemovalId(undefined)
  }
  function downloadPreview() {
    const payload = { notice: 'Student-controlled coursework preview only. Not an official transcript, registrar action, AMCAS submission, or degree audit.', coursework: courseworkExport(records) }
    const href = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }))
    const link = document.createElement('a'); link.href = href; link.download = 'premed-os-coursework-preview.json'; link.click(); URL.revokeObjectURL(href)
  }

  return <section className={entryOnly ? 'grades-transcript-entry' : 'rounded-2xl border border-border bg-card p-5 shadow-sm'}>
    {!entryOnly && <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-display text-xl font-extrabold">Transcript-faithful coursework</h2><p className="mt-1 text-sm font-semibold text-muted-foreground">Enter each printed field exactly as it appears. This does not connect to a registrar.</p></div><Button size="sm" variant="outline" disabled={!records.length} onClick={downloadPreview}><Download className="size-4" /> Export coursework preview</Button></div>}
    {!entryOnly && !records.length && <p className="mt-4 rounded-xl border border-dashed border-border bg-muted p-4 text-sm font-semibold text-muted-foreground">No transcript records yet. Add only the details you can see on your own transcript or transfer evaluation.</p>}
    {!entryOnly && records.length > 0 && <div className="mt-4 space-y-2">{records.map((record) => <div key={record.id} className="rounded-xl border border-border bg-muted p-3"><div className="flex flex-wrap items-start justify-between gap-2"><div><p className="font-extrabold">{record.courseNumberExact} · {record.titleExact}</p><span className="text-xs font-semibold text-muted-foreground">{record.institution} · {record.term} {record.year}</span></div><div className="flex gap-1"><Button type="button" size="sm" variant="ghost" onClick={() => startEditing(record)} aria-label={`Edit ${record.courseNumberExact} transcript record`}><Pencil className="size-3.5" /> Edit</Button><Button type="button" size="sm" variant="ghost" onClick={() => setPendingRemovalId(record.id)} aria-label={`Remove ${record.courseNumberExact} transcript record`}><Trash2 className="size-3.5" /> Remove</Button></div></div><p className="mt-1 text-sm text-muted-foreground">{record.creditsExact || 'Credits not entered'} · {record.gradeExact || 'Grade not entered'} · {record.courseType || 'Type not entered'}</p>{(record.classificationSource || record.classificationReason) && <p className="mt-1 text-xs font-semibold text-muted-foreground">Classification evidence · {record.classificationSource || 'Source not recorded'}{record.classificationReason ? ` — ${record.classificationReason}` : ''}</p>}</div>)}</div>}
      <div className={entryOnly ? '' : 'mt-5 border-t border-border pt-4'}><div className="flex items-center justify-between gap-2"><p className="font-display font-extrabold">{editingRecordId ? 'Correct transcript record' : 'Add transcript record'}</p>{editingRecordId && <Button type="button" size="sm" variant="ghost" onClick={cancelEditing}><X className="size-3.5" /> Cancel edit</Button>}</div><div className="mt-3 grid gap-2 md:grid-cols-2"><Select value={courseId} onValueChange={setCourseId}><SelectTrigger><SelectValue placeholder="Link to your course (optional)" /></SelectTrigger><SelectContent>{courses.map((course) => <SelectItem key={course.id} value={course.id}>{course.code} · {course.title}</SelectItem>)}</SelectContent></Select><Input value={form.institution} onChange={(event) => setForm({ ...form, institution: event.target.value })} placeholder="Institution (exact)" />{formFields.filter((field) => field !== 'institution' && field !== 'evidenceFileId').map((field) => <Input key={field} value={form[field]} onChange={(event) => setForm({ ...form, [field]: event.target.value })} placeholder={labelFor(field)} />)}<div className="flex gap-2"><Select value={form.evidenceFileId} onValueChange={(evidenceFileId) => setForm({ ...form, evidenceFileId })}><SelectTrigger className="flex-1"><SelectValue placeholder="Transcript-line image (optional)" /></SelectTrigger><SelectContent>{center.files.filter((file) => file.courseId === (courseId || undefined) && file.type === 'transcript').map((file) => <SelectItem key={file.id} value={file.id}>{file.title}</SelectItem>)}</SelectContent></Select><Button type="button" size="sm" variant="outline" disabled={attaching} onClick={() => evidenceInput.current?.click()}><Paperclip className="size-4" /> {attaching ? 'Attaching…' : 'Attach'}</Button><input ref={evidenceInput} type="file" accept="image/*,application/pdf" className="sr-only" aria-label="Attach a transcript-line image" onChange={(event) => { const file = event.target.files?.[0]; if (file) void attachEvidence(file); event.target.value = '' }} /></div></div><Button size="sm" className="mt-3" disabled={!form.institution.trim() || !form.courseNumberExact.trim() || !form.titleExact.trim()} onClick={createRecord}>{editingRecordId ? <Pencil className="size-4" /> : <Plus className="size-4" />} {editingRecordId ? 'Save correction' : 'Save transcript record'}</Button><p className="mt-2 flex items-center gap-1 text-xs font-semibold text-muted-foreground"><FileText className="size-3.5" /> Transcript-line evidence is optional, private, and can stay in Grades &amp; Archive without creating a Planner course.</p></div>
      <AlertDialog open={Boolean(pendingRemovalId)} onOpenChange={(open) => { if (!open) setPendingRemovalId(undefined) }}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Remove this transcript record?</AlertDialogTitle><AlertDialogDescription>This removes the student-entered Grades &amp; Archive line. It does not delete the linked Planner course or the private evidence file.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Keep record</AlertDialogCancel><AlertDialogAction onClick={() => pendingRemovalId && removeRecord(pendingRemovalId)}>Remove record</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </section>
}

function labelFor(field: keyof typeof emptyForm) {
  return ({ courseNumberExact: 'Course number (exact)', titleExact: 'Course title (exact)', creditsExact: 'Credits (exact)', gradeExact: 'Grade (exact)', term: 'Term', year: 'Year', courseType: 'Course type', displayName: 'Display name (optional)', classificationSource: 'Classification source (optional)', classificationReason: 'Classification reason (optional)', evidenceFileId: 'Transcript-line image (optional)' } as Record<keyof typeof emptyForm, string>)[field]
}
