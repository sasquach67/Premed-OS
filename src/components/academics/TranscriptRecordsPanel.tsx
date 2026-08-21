import { useState } from 'react'
import { Download, FileText, Plus } from 'lucide-react'
import type { Course } from '@/lib/types'
import { uid } from '@/lib/id'
import { courseworkExport } from '@/lib/academics/evidence'
import { useStore } from '@/store/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const emptyForm = { institution: '', courseNumberExact: '', titleExact: '', creditsExact: '', gradeExact: '', term: '', year: '', courseType: '', displayName: '', classificationSource: '', classificationReason: '', evidenceFileId: '' }

export function TranscriptRecordsPanel({ courses }: { courses: Course[] }) {
  const center = useStore((state) => state.academics.classCenter)
  const update = useStore((state) => state.update)
  const [courseId, setCourseId] = useState(courses[0]?.id ?? '')
  const [form, setForm] = useState(emptyForm)
  const records = [...center.transcriptRecords].sort((a, b) => a.order - b.order)
  const currentCourse = courses.find((course) => course.id === courseId)
  const formFields = Object.keys(emptyForm) as Array<keyof typeof emptyForm>

  function createRecord() {
    if (!courseId || !form.institution.trim() || !form.courseNumberExact.trim() || !form.titleExact.trim()) return
    const now = Date.now()
    update((draft) => draft.academics.classCenter.transcriptRecords.push({
      id: uid(), courseId,
      institution: form.institution.trim(), courseNumberExact: form.courseNumberExact.trim(), titleExact: form.titleExact.trim(), creditsExact: form.creditsExact.trim(), gradeExact: form.gradeExact.trim(), term: form.term.trim(), year: form.year.trim(), courseType: form.courseType.trim(),
      displayName: form.displayName.trim() || undefined, evidenceFileId: form.evidenceFileId || undefined, classificationSource: form.classificationSource.trim() || undefined, classificationReason: form.classificationReason.trim() || undefined,
      createdAt: now, updatedAt: now, order: draft.academics.classCenter.transcriptRecords.length,
    }))
    setForm(emptyForm)
  }
  function downloadPreview() {
    const payload = { notice: 'Student-controlled coursework preview only. Not an official transcript, registrar action, AMCAS submission, or degree audit.', coursework: courseworkExport(records) }
    const href = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }))
    const link = document.createElement('a'); link.href = href; link.download = 'premed-os-coursework-preview.json'; link.click(); URL.revokeObjectURL(href)
  }

  return <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-display text-xl font-extrabold">Transcript-faithful coursework</h2><p className="mt-1 text-sm font-semibold text-muted-foreground">Enter each printed field exactly as it appears. This does not connect to a registrar.</p></div><Button size="sm" variant="outline" disabled={!records.length} onClick={downloadPreview}><Download className="size-4" /> Export coursework preview</Button></div>
    {!records.length && <p className="mt-4 rounded-xl border border-dashed border-border bg-muted p-4 text-sm font-semibold text-muted-foreground">No transcript records yet. Add only the details you can see on your own transcript or transfer evaluation.</p>}
    {records.length > 0 && <div className="mt-4 space-y-2">{records.map((record) => <div key={record.id} className="rounded-xl border border-border bg-muted p-3"><div className="flex flex-wrap items-baseline justify-between gap-2"><p className="font-extrabold">{record.courseNumberExact} · {record.titleExact}</p><span className="text-xs font-semibold text-muted-foreground">{record.institution} · {record.term} {record.year}</span></div><p className="mt-1 text-sm text-muted-foreground">{record.creditsExact || 'Credits not entered'} · {record.gradeExact || 'Grade not entered'} · {record.courseType || 'Type not entered'}</p>{(record.classificationSource || record.classificationReason) && <p className="mt-1 text-xs font-semibold text-muted-foreground">Classification evidence · {record.classificationSource || 'Source not recorded'}{record.classificationReason ? ` — ${record.classificationReason}` : ''}</p>}</div>)}</div>}
    <div className="mt-5 border-t border-border pt-4"><p className="font-display font-extrabold">Add transcript record</p><div className="mt-3 grid gap-2 md:grid-cols-2"><Select value={courseId} onValueChange={setCourseId}><SelectTrigger><SelectValue placeholder="Link to your course" /></SelectTrigger><SelectContent>{courses.map((course) => <SelectItem key={course.id} value={course.id}>{course.code} · {course.title}</SelectItem>)}</SelectContent></Select><Input value={form.institution} onChange={(event) => setForm({ ...form, institution: event.target.value })} placeholder="Institution (exact)" />{formFields.filter((field) => field !== 'institution' && field !== 'evidenceFileId').map((field) => <Input key={field} value={form[field]} onChange={(event) => setForm({ ...form, [field]: event.target.value })} placeholder={labelFor(field)} />)}<Select value={form.evidenceFileId} onValueChange={(evidenceFileId) => setForm({ ...form, evidenceFileId })}><SelectTrigger><SelectValue placeholder="Transcript-line image (optional)" /></SelectTrigger><SelectContent>{center.files.filter((file) => file.courseId === courseId).map((file) => <SelectItem key={file.id} value={file.id}>{file.title}</SelectItem>)}</SelectContent></Select></div><Button size="sm" className="mt-3" disabled={!currentCourse || !form.institution.trim() || !form.courseNumberExact.trim() || !form.titleExact.trim()} onClick={createRecord}><Plus className="size-4" /> Save transcript record</Button><p className="mt-2 flex items-center gap-1 text-xs font-semibold text-muted-foreground"><FileText className="size-3.5" /> Transcript-line image support is optional, private, and local to the course material you selected.</p></div>
  </section>
}

function labelFor(field: keyof typeof emptyForm) {
  return ({ courseNumberExact: 'Course number (exact)', titleExact: 'Course title (exact)', creditsExact: 'Credits (exact)', gradeExact: 'Grade (exact)', term: 'Term', year: 'Year', courseType: 'Course type', displayName: 'Display name (optional)', classificationSource: 'Classification source (optional)', classificationReason: 'Classification reason (optional)', evidenceFileId: 'Transcript-line image (optional)' } as Record<keyof typeof emptyForm, string>)[field]
}
