import { useMemo, useState } from 'react'
import { Clock3, Plus, ShieldCheck } from 'lucide-react'
import type { AcademicFile, AcademicMistakeCause, AssessmentMaterialPermission, ClassCenterData } from '@/lib/types'
import { uid } from '@/lib/id'
import { ASSESSMENT_PERMISSION_LABEL, canShareAssessmentMaterial } from '@/lib/academics/evidence'
import { useStore } from '@/store/store'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const PERMISSIONS: AssessmentMaterialPermission[] = ['instructor-provided', 'publicly-posted', 'my-returned-work', 'unknown-origin']

export function AssessmentCatalog({ courseId, data, files }: { courseId: string; data: ClassCenterData; files: AcademicFile[] }) {
  const update = useStore((state) => state.update)
  const materials = data.assessmentMaterials.filter((item) => item.courseId === courseId).sort((a, b) => a.order - b.order)
  const attempts = data.assessmentAttempts.filter((item) => item.courseId === courseId).sort((a, b) => b.startedAt - a.startedAt)
  const [fileId, setFileId] = useState('')
  const [title, setTitle] = useState('')
  const [permission, setPermission] = useState<AssessmentMaterialPermission>('instructor-provided')
  const [activeAttemptId, setActiveAttemptId] = useState('')
  const [result, setResult] = useState('')
  const [mistakeLabel, setMistakeLabel] = useState('')
  const [mistakeCause, setMistakeCause] = useState<AcademicMistakeCause | ''>('')
  const activeAttempt = attempts.find((attempt) => attempt.id === activeAttemptId && !attempt.endedAt)
  const activeMaterial = materials.find((material) => material.id === activeAttempt?.materialId)

  function addMaterial() {
    const file = files.find((item) => item.id === fileId)
    const recordTitle = title.trim() || file?.title
    if (!recordTitle) return
    const now = Date.now()
    update((draft) => {
      draft.academics.classCenter.assessmentMaterials.push({
        id: uid(), courseId, fileId: file?.id, title: recordTitle, permission,
        sourceLabel: file?.url || file?.fileName || 'Student-entered material', topicIds: [],
        createdAt: now, updatedAt: now,
        order: draft.academics.classCenter.assessmentMaterials.filter((item) => item.courseId === courseId).length,
      })
    })
    setFileId(''); setTitle('')
  }
  function startAttempt(materialId: string) {
    const now = Date.now(); const id = uid()
    update((draft) => draft.academics.classCenter.assessmentAttempts.push({ id, courseId, materialId, topicIds: [], startedAt: now, createdAt: now, updatedAt: now, order: draft.academics.classCenter.assessmentAttempts.filter((item) => item.courseId === courseId).length }))
    setActiveAttemptId(id)
  }
  function returnAttempt() {
    if (!activeAttempt) return
    update((draft) => {
      const attempt = draft.academics.classCenter.assessmentAttempts.find((item) => item.id === activeAttempt.id)
      if (attempt) Object.assign(attempt, { endedAt: Date.now(), result: result.trim() || undefined, updatedAt: Date.now() })
    })
    setResult(''); setActiveAttemptId('')
  }
  function addMistake() {
    const label = mistakeLabel.trim()
    if (!label) return
    const now = Date.now()
    update((draft) => draft.academics.classCenter.mistakes.push({
      id: uid(), courseId, label, cause: mistakeCause || undefined, createdAt: now, updatedAt: now,
      order: draft.academics.classCenter.mistakes.filter((item) => item.courseId === courseId).length,
    }))
    setMistakeLabel(''); setMistakeCause('')
  }
  const availableFiles = useMemo(() => files.filter((file) => ['exam', 'study-guide', 'other'].includes(file.type)), [files])

  return <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-display text-lg font-extrabold">Actual assessment material</p><p className="mt-1 text-sm font-semibold text-muted-foreground">Practice from a named source—separate from generated full mocks.</p></div><Badge variant="outline">{materials.length} source{materials.length === 1 ? '' : 's'}</Badge></div>
    {activeAttempt && activeMaterial && <div className="mt-4 rounded-xl border border-primary/35 bg-primary/10 p-3"><div className="flex items-center gap-2 font-extrabold"><Clock3 className="size-4 text-primary" /> Working from {activeMaterial.title}</div><p className="mt-1 text-sm text-muted-foreground">{ASSESSMENT_PERMISSION_LABEL[activeMaterial.permission]} · a named, bounded material attempt.</p><div className="mt-3 flex flex-wrap gap-2"><Input value={result} onChange={(event) => setResult(event.target.value)} placeholder="Record a result or leave blank" className="max-w-sm" /><Button size="sm" onClick={returnAttempt}>Finish and record</Button></div></div>}
    <div className="mt-4 space-y-2">{materials.map((material) => <div key={material.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-muted p-3"><div><p className="font-bold">{material.title}</p><p className="mt-1 text-xs font-semibold text-muted-foreground">{ASSESSMENT_PERMISSION_LABEL[material.permission]} · {material.sourceLabel}</p>{!canShareAssessmentMaterial(material.permission) && <p className="mt-1 text-xs font-bold text-amber-700 dark:text-amber-200">Private only · no sharing action</p>}</div><Button size="sm" variant="outline" disabled={!!activeAttempt} onClick={() => startAttempt(material.id)}>Take this material</Button></div>)}{!materials.length && <p className="rounded-xl border border-dashed border-border bg-muted p-3 text-sm font-semibold text-muted-foreground">No actual assessment material yet. Add only a source you can identify and use.</p>}</div>
    {attempts.some((attempt) => attempt.endedAt) && <div className="mt-4 rounded-xl border border-border bg-muted p-3"><p className="font-extrabold">Mark one mistake, if there was one</p><p className="mt-1 text-xs font-semibold text-muted-foreground">Optional and unclassified is valid. This creates the existing single mistake record; it never changes a generated mock.</p><div className="mt-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_13rem_auto]"><Input value={mistakeLabel} onChange={(event) => setMistakeLabel(event.target.value)} placeholder="What went wrong?" /><Select value={mistakeCause} onValueChange={(value) => setMistakeCause(value as AcademicMistakeCause)}><SelectTrigger><SelectValue placeholder="Cause (optional)" /></SelectTrigger><SelectContent><SelectItem value="didnt-know">Did not know</SelectItem><SelectItem value="knew-it-but-blanked">Knew it, but blanked</SelectItem><SelectItem value="misread-the-question">Misread the question</SelectItem><SelectItem value="arithmetic">Arithmetic</SelectItem><SelectItem value="ran-out-of-time">Ran out of time</SelectItem><SelectItem value="wrong-method">Wrong method</SelectItem></SelectContent></Select><Button size="sm" variant="outline" disabled={!mistakeLabel.trim()} onClick={addMistake}>Save mistake</Button></div></div>}
    <div className="mt-4 grid gap-2 border-t border-border pt-4 sm:grid-cols-3"><Select value={fileId} onValueChange={setFileId}><SelectTrigger><SelectValue placeholder="Existing material (optional)" /></SelectTrigger><SelectContent>{availableFiles.map((file) => <SelectItem key={file.id} value={file.id}>{file.title}</SelectItem>)}</SelectContent></Select><Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Assessment title" /><Select value={permission} onValueChange={(value) => setPermission(value as AssessmentMaterialPermission)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{PERMISSIONS.map((item) => <SelectItem key={item} value={item}>{ASSESSMENT_PERMISSION_LABEL[item]}</SelectItem>)}</SelectContent></Select><Button size="sm" className="sm:col-span-3 sm:justify-self-start" disabled={!title.trim() && !fileId} onClick={addMaterial}><Plus className="size-4" /> Add assessment material</Button></div>
    {attempts.filter((attempt) => attempt.endedAt).length > 0 && <p className="mt-3 text-xs font-semibold text-muted-foreground"><ShieldCheck className="mr-1 inline size-3.5" /> {attempts.filter((attempt) => attempt.endedAt).length} returned attempt record{attempts.filter((attempt) => attempt.endedAt).length === 1 ? '' : 's'}; these are history, not a readiness trend.</p>}
  </section>
}
