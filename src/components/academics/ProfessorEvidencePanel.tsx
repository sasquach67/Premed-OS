import { useMemo, useState } from 'react'
import { BookOpenCheck, Plus } from 'lucide-react'
import type { ClassAssignment, ClassContact, ClassCenterData } from '@/lib/types'
import { uid } from '@/lib/id'
import { eligibleProfessorEvidence, professorEvidenceIsEligible } from '@/lib/academics/evidence'
import { useStore } from '@/store/store'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

export function ProfessorEvidencePanel({
  courseId, data, assignments, contacts,
}: {
  courseId: string
  data: ClassCenterData
  assignments: ClassAssignment[]
  contacts: ClassContact[]
}) {
  const update = useStore((state) => state.update)
  const returned = assignments.filter((assignment) => !!assignment.returnedAt)
  const observations = useMemo(
    () => eligibleProfessorEvidence(data.professorEvidence, assignments, courseId),
    [assignments, courseId, data.professorEvidence],
  )
  const [assignmentId, setAssignmentId] = useState('')
  const [contactId, setContactId] = useState('')
  const [observation, setObservation] = useState('')
  const eligible = professorEvidenceIsEligible(observations.length)

  function addObservation() {
    const trimmed = observation.trim()
    const assignment = returned.find((item) => item.id === assignmentId)
    if (!trimmed || !assignment) return
    const now = Date.now()
    update((draft) => {
      draft.academics.classCenter.professorEvidence.push({
        id: uid(), courseId, assignmentId: assignment.id,
        personId: contacts.find((contact) => contact.id === contactId)?.personId,
        observation: trimmed, observedAt: now, createdAt: now, updatedAt: now,
        order: draft.academics.classCenter.professorEvidence.filter((item) => item.courseId === courseId).length,
      })
    })
    setObservation('')
    setAssignmentId('')
  }

  return (
    <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-display text-lg font-extrabold">Professor evidence</p>
          <p className="mt-1 text-sm font-semibold text-muted-foreground">Your observations from returned work in this class only.</p>
        </div>
        <Badge variant={eligible ? 'success' : 'outline'}>{eligible ? `${observations.length} returned-work observations` : 'Not enough returned work yet'}</Badge>
      </div>
      {!eligible && <p className="mt-3 rounded-xl border border-dashed border-border bg-muted p-3 text-sm font-semibold text-muted-foreground">When at least two pieces of work come back, you can record what you noticed—such as emphasis or question format. This stays quiet until then; it does not predict an exam.</p>}
      {eligible && <div className="mt-3 space-y-2">{observations.map((item) => {
        const assignment = assignments.find((row) => row.id === item.assignmentId)
        return <div key={item.id} className="rounded-xl border border-border bg-muted p-3"><p className="font-bold">{item.observation}</p><p className="mt-1 text-xs font-semibold text-muted-foreground">{assignment?.title || 'Returned work'} · {new Date(item.observedAt).toLocaleDateString()}</p></div>
      })}</div>}
      {returned.length ? <div className="mt-4 grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Select value={assignmentId} onValueChange={setAssignmentId}><SelectTrigger aria-label="Returned work"><SelectValue placeholder="Returned work" /></SelectTrigger><SelectContent>{returned.map((item) => <SelectItem key={item.id} value={item.id}>{item.title}</SelectItem>)}</SelectContent></Select>
        <Select value={contactId} onValueChange={setContactId}><SelectTrigger aria-label="Instructor context"><SelectValue placeholder="Instructor context (optional)" /></SelectTrigger><SelectContent>{contacts.map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}</SelectContent></Select>
        <Textarea className="sm:col-span-2" value={observation} onChange={(event) => setObservation(event.target.value)} placeholder="What did this returned work show?" />
        <Button className="sm:justify-self-start" size="sm" disabled={!assignmentId || !observation.trim()} onClick={addObservation}><Plus className="size-4" /> Record observation</Button>
      </div> : <div className="mt-4 flex items-center gap-2 rounded-xl border border-dashed border-border bg-muted p-3 text-sm font-semibold text-muted-foreground"><BookOpenCheck className="size-4" /> Mark an assignment as returned first; only returned work can support this record.</div>}
    </section>
  )
}
