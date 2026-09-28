import { useState, type ReactNode } from 'react'
import { Plus, ArrowUp, ArrowDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { SelectField } from '@/components/ui/select-field'
import { ContactCard } from '@/components/common/ContactCard'
import { PersonLinkPicker } from '@/components/common/PersonLinkPicker'
import type { AppData, CollectionRecord, ExperienceEntry, ResearchMembership } from '@/lib/types'
import { localDay, validResearchDay, researchUpcoming } from '@/lib/research'
import { trashResearchRecord } from '@/lib/researchLifecycle'
import { fmtDate } from '@/lib/date'
import type { ResearchSave } from './useResearchSave'

import { envelope } from './researchRecord'
export function ResearchField({ label, children }: { label: string; children: ReactNode }) { return <label className="grid min-w-0 gap-1 text-xs font-bold">{label}{children}</label> }
export function SaveState({ writer }: { writer: ResearchSave }) { return <div aria-live="polite" className="research-save-state">{writer.pending ? 'Saving on this device…' : writer.error ? <span role="alert" className="text-destructive">{writer.error}</span> : writer.savedAt ? 'Saved on this device' : null}{!writer.pending && !writer.error && writer.savedAt ? <span> · {writer.sync}</span> : null}</div> }

export function LabEditor({ lab, data, writer, close }: { lab?: CollectionRecord<ExperienceEntry>; data: AppData; writer: ResearchSave; close: () => void }) {
  const [name, setName] = useState(lab?.org ?? '')
  const [role, setRole] = useState(lab?.role ?? '')
  const [facts, setFacts] = useState(lab?.research ?? {})
  const [organizationId, setOrganizationId] = useState(lab?.organizationId ?? '')
  const [supervisorId, setSupervisorId] = useState(lab?.supervisorId ?? '')
  const [current, setCurrent] = useState(lab?.research?.current ?? !data.experiences.some(entry => entry.category === 'research' && !entry.deletedAt && !entry.archived))
  return <form onSubmit={async event => {
    event.preventDefault()
    if (!name.trim() || (facts.lastPiContact && !validResearchDay(facts.lastPiContact))) return
    const ok = await writer.save(draft => {
      if (current) draft.experiences.forEach(entry => { if (entry.category === 'research' && entry.research?.current) entry.research = { ...entry.research, current: false } })
      const existing = lab && draft.experiences.find(entry => entry.id === lab.id && !entry.deletedAt && !entry.archived)
      if (lab && !existing) throw new Error("The lab changed; reopen it before saving.")
      const values = { org: name, role, organizationId: organizationId || undefined, supervisorId: supervisorId || undefined, research: { ...facts, current }, updatedAt: Date.now() }
      if (existing) Object.assign(existing, values)
      else draft.experiences.push({ ...envelope(), category: 'research', description: '', status: 'active', tags: [], ...values })
    })
    if (ok) close()
  }}>
    <fieldset disabled={writer.pending} className="grid gap-3">
      <ResearchField label="Lab name"><Input required value={name} onChange={event => setName(event.target.value)} /></ResearchField>
      <ResearchField label="Your role"><Input value={role} onChange={event => setRole(event.target.value)} /></ResearchField>
      {(['department', 'institution', 'researchType'] as const).map(key => <ResearchField key={key} label={key === 'researchType' ? 'Research type' : key === 'department' ? 'Department' : 'Institution'}><Input value={facts[key] ?? ''} onChange={event => setFacts({ ...facts, [key]: event.target.value })} /></ResearchField>)}
      <ResearchField label="Since"><Input type="text" placeholder="Date or period, if known" value={facts.since ?? lab?.startDate ?? ''} onChange={event => setFacts({ ...facts, since: event.target.value || undefined })} /></ResearchField>
      <ResearchField label="Last PI contact"><Input type="date" value={facts.lastPiContact ?? ''} onChange={event => setFacts({ ...facts, lastPiContact: event.target.value || undefined })} /></ResearchField>
      <ResearchField label="Linked organization"><SelectField value={organizationId} onValueChange={setOrganizationId} options={[{ value: '', label: 'Not linked' }, ...data.organizations.filter(org => !org.deletedAt).map(org => ({ value: org.id, label: org.name }))]} /></ResearchField>
      <ResearchField label="PI"><SelectField value={supervisorId} onValueChange={setSupervisorId} options={[{ value: '', label: lab?.supervisor || 'Not linked' }, ...data.persons.filter(person => !person.deletedAt).map(person => ({ value: person.id, label: `${person.name} · ${person.id.slice(-6)}` }))]} /></ResearchField>
      <label className="flex gap-2 text-xs"><input type="checkbox" checked={current} onChange={event => setCurrent(event.target.checked)} />Make this my current lab</label>
      <div className="flex gap-2"><Button type="submit" variant="secondary">Save lab</Button><Button type="button" variant="ghost" onClick={close}>Cancel</Button></div>
    </fieldset>
    <SaveState writer={writer} />
  </form>
}

type RailKind = 'researchUpcomingItems' | 'researchReminders' | 'researchTimelineNotes'
const TITLES: Record<RailKind, string> = { researchUpcomingItems: 'Upcoming', researchReminders: 'Pinned reminders', researchTimelineNotes: 'Timeline' }
export function LabList({ kind, labId, data, today, writer }: { kind: RailKind; labId: string; data: AppData; today: string; writer: ResearchSave }) {
  const [editor, setEditor] = useState<{ id?: string; date: string; text: string; note: string } | null>(null)
  const rows = kind === 'researchUpcomingItems' ? researchUpcoming(data, labId, today) : data[kind].filter(row => row.experienceId === labId && !row.deletedAt && !row.archived).sort((a, b) => kind === 'researchReminders' ? a.order - b.order : String('date' in b ? b.date : '').localeCompare(String('date' in a ? a.date : '')))
  return <section className="research-rail-section" aria-label={TITLES[kind]}>
    <div className="flex items-center justify-between gap-2"><h3>{TITLES[kind]}</h3><Button variant="link" size="sm" disabled={writer.pending} aria-label={`Add ${TITLES[kind].toLowerCase()}`} onClick={() => setEditor({ date: today, text: '', note: '' })}><Plus />Add</Button></div>
    {!rows.length && <p className="text-muted-foreground">{kind === 'researchUpcomingItems' ? 'Nothing upcoming. Add a date to remember.' : kind === 'researchReminders' ? 'Keep useful reminders here.' : 'Record how your role changes over time.'}</p>}
    <ul className="grid gap-2">{rows.map((row, index) => <li key={row.id} className="min-w-0">
      <div className="flex items-start gap-2">{'date' in row && <time dateTime={row.date} className="shrink-0 text-muted-foreground">{fmtDate(row.date, { month: 'short', day: 'numeric' })}</time>}<span className="min-w-0 flex-1 break-words">{'title' in row ? row.title : row.text}</span></div>
      {'note' in row && row.note && <p className="whitespace-pre-wrap break-words text-muted-foreground">{row.note}</p>}
      <div className="flex flex-wrap gap-1"><Button variant="ghost" size="sm" disabled={writer.pending} aria-label={`Edit ${'title' in row ? row.title : row.text}`} onClick={() => setEditor({ id: row.id, date: 'date' in row ? row.date : today, text: 'title' in row ? row.title : row.text, note: 'note' in row ? row.note ?? '' : '' })}>Edit</Button><Button variant="ghost" size="sm" disabled={writer.pending} aria-label={`Remove ${'title' in row ? row.title : row.text}`} onClick={() => void writer.save(draft => { trashResearchRecord(draft, kind, row.id) })}>Remove</Button>
      {kind === 'researchReminders' && <>{([-1, 1] as const).map(direction => <Button key={direction} size="sm" variant="ghost" disabled={writer.pending || !rows[index + direction]} aria-label={`Move ${'text' in row ? row.text : ''} ${direction < 0 ? 'up' : 'down'}`} onClick={() => void writer.save(draft => {
        const ordered = rows.map(item => item.id); [ordered[index], ordered[index + direction]] = [ordered[index + direction], ordered[index]]
        ordered.forEach((id, order) => { const item = draft.researchReminders.find(item => item.id === id); if (item) { item.order = order; item.updatedAt = Date.now() } })
      })}>{direction < 0 ? <ArrowUp /> : <ArrowDown />}</Button>)}</>}
      </div>
    </li>)}</ul>
    {editor && <form className="mt-2" onSubmit={async event => {
      event.preventDefault(); if (!editor.text.trim() || (kind !== 'researchReminders' && !validResearchDay(editor.date))) return
      const ok = await writer.save(draft => {
        if (!draft.experiences.some(lab => lab.id === labId && !lab.archived && !lab.deletedAt)) throw new Error("Lab no longer active")
        if (editor.id && !draft[kind].some(row => row.id === editor.id && !row.archived && !row.deletedAt)) throw new Error("Record no longer active")
        const common = { experienceId: labId, updatedAt: Date.now() }
        if (kind === 'researchUpcomingItems') { const values = { ...common, date: editor.date, title: editor.text, note: editor.note }; const row = draft.researchUpcomingItems.find(row => row.id === editor.id); if (row) Object.assign(row, values); else draft.researchUpcomingItems.push({ ...envelope(), ...values }) }
        if (kind === 'researchReminders') { const values = { ...common, text: editor.text }; const row = draft.researchReminders.find(row => row.id === editor.id); if (row) Object.assign(row, values); else draft.researchReminders.push({ ...envelope(), ...values }) }
        if (kind === 'researchTimelineNotes') { const values = { ...common, date: editor.date, text: editor.text }; const row = draft.researchTimelineNotes.find(row => row.id === editor.id); if (row) Object.assign(row, values); else draft.researchTimelineNotes.push({ ...envelope(), ...values }) }
      }); if (ok) setEditor(null)
    }}><fieldset disabled={writer.pending} className="grid gap-2">
      {kind !== 'researchReminders' && <ResearchField label={`${TITLES[kind]} date`}><Input required type="date" value={editor.date} onChange={event => setEditor({ ...editor, date: event.target.value })} /></ResearchField>}
      <ResearchField label={kind === 'researchUpcomingItems' ? 'Title' : 'Text'}><Input required value={editor.text} onChange={event => setEditor({ ...editor, text: event.target.value })} /></ResearchField>
      {kind === 'researchUpcomingItems' && <ResearchField label="Optional note"><Textarea value={editor.note} onChange={event => setEditor({ ...editor, note: event.target.value })} /></ResearchField>}
      <div className="flex gap-1"><Button type="submit" variant="secondary" size="sm">Save {TITLES[kind].toLowerCase()}</Button><Button type="button" variant="ghost" size="sm" onClick={() => setEditor(null)}>Cancel</Button></div>
    </fieldset></form>}
  </section>
}

function PersonEditor({ labId, member, data, writer, close }: { labId: string; member?: ResearchMembership; data: AppData; writer: ResearchSave; close: () => void }) {
  const [personId, setPersonId] = useState(member?.personId ?? '')
  const [name, setName] = useState('')
  const [bio, setBio] = useState(data.persons.find(person => person.id === member?.personId)?.bio ?? '')
  const [role, setRole] = useState(member?.roleInLab ?? '')
  const [project, setProject] = useState(member?.projectText ?? '')
  const duplicate = data.researchMemberships.some(link => !link.deletedAt && !link.archived && link.experienceId === labId && link.personId === personId && link.id !== member?.id)
  return <form onSubmit={async event => {
    event.preventDefault(); if ((!personId && !name.trim()) || duplicate) return
    const ok = await writer.save(draft => {
      if (!draft.experiences.some(lab => lab.id === labId && !lab.archived && !lab.deletedAt)) throw new Error("Lab no longer active")
      if (member && !draft.researchMemberships.some(link => link.id === member.id && !link.archived && !link.deletedAt)) throw new Error("Membership no longer active")
      if (personId && !draft.persons.some(person => person.id === personId && !person.deletedAt && !person.archived)) throw new Error("Person no longer active")
      const id = personId || crypto.randomUUID()
      if (draft.researchMemberships.some(link => link.id !== member?.id && !link.deletedAt && !link.archived && link.experienceId === labId && link.personId === id)) throw new Error('Person already linked')
      const person = draft.persons.find(person => person.id === id)
      if (person) { person.bio = bio; person.updatedAt = Date.now() }
      else draft.persons.push({ ...envelope(), id, name, bio })
      const existing = draft.researchMemberships.find(link => link.id === member?.id)
      const values = { experienceId: labId, personId: id, roleInLab: role, projectText: project, updatedAt: Date.now() }
      if (existing) Object.assign(existing, values); else draft.researchMemberships.push({ ...envelope(), ...values })
    }); if (ok) close()
  }}><fieldset disabled={writer.pending} className="grid gap-2">
    {member ? <p className="font-bold">{data.persons.find(person => person.id === personId)?.name}</p> : <PersonLinkPicker persons={data.persons} personId={personId} name={name} onNameChange={setName} onPersonChange={id => { setPersonId(id); setBio(data.persons.find(person => person.id === id)?.bio ?? '') }} />}
    <ResearchField label="Role in this lab"><Input value={role} onChange={event => setRole(event.target.value)} /></ResearchField>
    <ResearchField label="Bio (shared wherever this person appears)"><Textarea value={bio} onChange={event => setBio(event.target.value)} /></ResearchField>
    <ResearchField label="Their project"><Input value={project} onChange={event => setProject(event.target.value)} /></ResearchField>
    {duplicate && <p role="alert">This person is already linked to this lab.</p>}
    <div className="flex gap-1"><Button type="submit" variant="secondary" size="sm" disabled={duplicate}>Save person</Button><Button type="button" variant="ghost" size="sm" onClick={close}>Cancel</Button></div>
  </fieldset></form>
}

export function ResearchPeople({ labId, data, writer }: { labId: string; data: AppData; writer: ResearchSave }) {
  const [editor, setEditor] = useState<ResearchMembership | 'new' | null>(null)
  const members = data.researchMemberships.filter(link => link.experienceId === labId && !link.deletedAt && !link.archived && data.persons.some(person => person.id === link.personId && !person.deletedAt && !person.archived))
  return <section className="research-panel" aria-label="People"><div className="research-panel-heading"><h2>People</h2><Button variant="link" size="sm" disabled={writer.pending} onClick={() => setEditor('new')}><Plus />Add person</Button></div>
    <div className="research-panel-body">{!members.length && <p className="text-muted-foreground">Add the people you work with.</p>}
    {members.map(member => { const person = data.persons.find(person => person.id === member.personId)!; return <ContactCard wrapText key={member.id} name={person.name} role={member.roleInLab} initials={person.name.split(/\s+/).slice(0,2).map(part => part[0]).join('')} className="research-person" actions={<><Button variant="ghost" size="sm" disabled={writer.pending} onClick={() => setEditor(member)}>Edit {person.name}</Button><Button variant="ghost" size="sm" disabled={writer.pending} onClick={() => void writer.save(draft => { trashResearchRecord(draft, 'researchMemberships', member.id) })}>Unlink {person.name}</Button></>}>
      {person.bio && <p className="mt-2 whitespace-pre-wrap break-words text-muted-foreground">{person.bio}</p>}{member.projectText && <p className="mt-1 break-words">Project: {member.projectText}</p>}
    </ContactCard> })}
    {editor && <PersonEditor key={editor === 'new' ? 'new' : editor.id} labId={labId} member={editor === 'new' ? undefined : editor} data={data} writer={writer} close={() => setEditor(null)} />}
    <SaveState writer={writer} /></div>
  </section>
}

export function LastContact({ lab, writer }: { lab: CollectionRecord<ExperienceEntry>; writer: ResearchSave }) {
  const [editing, setEditing] = useState(false)
  const [date, setDate] = useState(lab.research?.lastPiContact ?? localDay())
  return <div className="text-muted-foreground">Last PI contact {lab.research?.lastPiContact ? fmtDate(lab.research.lastPiContact) : 'not recorded'} <Button variant="link" size="sm" disabled={writer.pending} onClick={() => { if (!editing) setDate(lab.research?.lastPiContact ?? localDay()); setEditing(!editing) }}>Update</Button>
    {editing && <form onSubmit={async event => { event.preventDefault(); if (date && !validResearchDay(date)) return; if (await writer.save(draft => { const row = draft.experiences.find(row => row.id === lab.id)!; row.research = { ...row.research, lastPiContact: date || undefined }; row.updatedAt = Date.now() })) setEditing(false) }}><fieldset disabled={writer.pending} className="flex gap-1"><Input aria-label="Last PI contact date" type="date" value={date} onChange={event => setDate(event.target.value)} /><Button type="submit" variant="secondary" size="sm">Save contact date</Button></fieldset></form>}
  </div>
}
