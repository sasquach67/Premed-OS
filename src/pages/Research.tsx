import { envelope } from '@/components/research/researchRecord'
import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search } from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { InlineAddRow } from '@/components/common/InlineAddRow'
import { ExpandableEntryRow } from '@/components/common/ExpandableEntryRow'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { SelectField } from '@/components/ui/select-field'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { captureWorkspaceIdentity, useStore } from '@/store/store'
import type { AppData, CollectionRecord, ExperienceEntry, ExperienceHourEntry } from '@/lib/types'
import { activeResearchLabs, currentResearchLab, filterResearchLogs, researchDateRange, researchLogs, researchStats, researchWeeks, validResearchDay } from '@/lib/research'
import { useLocalDay } from '@/hooks/useLocalDay'
import { totalsForExperience } from '@/lib/experienceHours'
import { trashResearchRecord } from '@/lib/researchLifecycle'
import { fmtDate } from '@/lib/date'
import { useResearchSave, type ResearchSave } from '@/components/research/useResearchSave'
import { LabEditor, LabList, LastContact, ResearchField, ResearchPeople, SaveState } from '@/components/research/ResearchEditors'
import './research.css'

/** Workspace-keyed drafts cannot spill into a different signed-in account. */
export function Research() {
  useStore()
  const owner = captureWorkspaceIdentity()
  return <ResearchWorkspace key={`${owner.key}:${owner.epoch}`} />
}

function LogEditor({ entry, writer, close }: { entry: ExperienceHourEntry; writer: ResearchSave; close: () => void }) {
  const [date, setDate] = useState(entry.date ?? '')
  const [hours, setHours] = useState(entry.hours ? String(entry.hours) : '')
  const [note, setNote] = useState(entry.note ?? '')
  const [thoughts, setThoughts] = useState(entry.thoughts ?? '')
  const [error, setError] = useState('')
  return <form onSubmit={async event => {
    event.preventDefault()
    const value = hours.trim() ? Number(hours) : 0
    if (!validResearchDay(date) || !Number.isFinite(value) || value < 0 || (!value && !note.trim())) { setError('Add a valid date, nonnegative hours, and a note when no hours are recorded.'); return }
    if (await writer.save(draft => { const row = draft.experienceHourEntries.find(row => row.id === entry.id); if (!row) throw new Error('Entry no longer exists'); Object.assign(row, { date, hours: value, note, thoughts, updatedAt: Date.now() }) })) close()
  }}><fieldset disabled={writer.pending} className="grid gap-2">
    <div className="grid grid-cols-2 gap-2"><ResearchField label="Edit date"><Input type="date" required value={date} onChange={event => setDate(event.target.value)} /></ResearchField><ResearchField label="Edit hours (optional)"><Input type="number" min="0" step="any" value={hours} onChange={event => setHours(event.target.value)} /></ResearchField></div>
    <ResearchField label="Edit what I did"><Textarea value={note} onChange={event => setNote(event.target.value)} /></ResearchField>
    <ResearchField label="Edit thoughts"><Textarea value={thoughts} onChange={event => setThoughts(event.target.value)} /></ResearchField>
    {error && <p role="alert">{error}</p>}
    <div className="flex gap-1"><Button type="submit" variant="secondary" size="sm">Save entry</Button><Button type="button" variant="ghost" size="sm" onClick={close}>Cancel</Button></div>
  </fieldset></form>
}
function LogRow({ entry, lab, labelLab, writer, editLab }: { entry: ExperienceHourEntry; lab?: CollectionRecord<ExperienceEntry>; labelLab: boolean; writer: ResearchSave; editLab: () => void }) {
  const [editing, setEditing] = useState(false)
  return <ExpandableEntryRow className="research-entry" label={`Lab entry ${entry.date}: ${entry.note ?? 'No note'}`} summary={<div className="research-entry-summary min-w-0 flex-1"><time dateTime={entry.date}>{fmtDate(entry.date, { weekday: 'short', month: 'short', day: 'numeric' })}</time><span className={entry.hours ? 'research-hours' : 'research-hours no-hours'}>{entry.hours ? `${entry.hours} h` : 'No hours recorded'}</span><div className="min-w-0"><p className="whitespace-pre-wrap break-words font-bold">{entry.note || 'No note recorded'}</p>{entry.thoughts && <p className="line-clamp-1 text-muted-foreground">{entry.thoughts}</p>}{labelLab && <p className="text-muted-foreground">{lab?.org}</p>}</div></div>}>
    {editing ? <LogEditor entry={entry} writer={writer} close={() => setEditing(false)} /> : <><p className="whitespace-pre-wrap break-words">{entry.thoughts || 'No thoughts recorded.'}</p><div className="mt-2 flex flex-wrap gap-1"><Button variant="ghost" size="sm" disabled={writer.pending} onClick={() => setEditing(true)}>Edit</Button><Button variant="ghost" size="sm" disabled={writer.pending} onClick={() => void writer.save(draft => { trashResearchRecord(draft, 'experienceHourEntries', entry.id) })}>Delete</Button><Button variant="ghost" size="sm" disabled={writer.pending} onClick={editLab}>Edit {lab?.org || 'lab'}</Button></div></>}
  </ExpandableEntryRow>
}
function EarlierNotes({ data }: { data: AppData }) {
  const notes = data.notePages.filter(note => note.pillar === 'research' && !note.deletedAt)
  if (!notes.length) return null
  return <section className="research-panel" aria-label="Earlier notes"><div className="research-panel-heading"><h2>Earlier notes</h2></div><div className="research-panel-body"><p className="text-muted-foreground">Research-wide notes · not assigned to a lab</p>{notes.map(note => <details key={note.id} className="rounded-lg border bg-muted p-3"><summary className="cursor-pointer font-bold">{note.title || 'Untitled note'}</summary><div className="mt-2 whitespace-pre-wrap break-words">{note.body}</div></details>)}</div></section>
}
function ResearchWorkspace() {
  const data = useStore()
  const today = useLocalDay()
  const now = new Date(`${today}T12:00:00`)
  const writer = useResearchSave()
  const stats = researchStats(data, now)
  const labs = activeResearchLabs(data.experiences)
  const current = currentResearchLab(data.experiences, data.experienceHourEntries)
  const [labEditor, setLabEditor] = useState<CollectionRecord<ExperienceEntry> | 'new' | null>(null)
  const [search, setSearch] = useState('')
  const [range, setRange] = useState<'term' | '30-days' | 'all' | 'custom'>('term')
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [limit, setLimit] = useState(20)
  const [chosenDate, setChosenDate] = useState<string | null>(null)
  const date = chosenDate ?? today
  const setDate = (value: string) => setChosenDate(value)
  const [hours, setHours] = useState('')
  const [note, setNote] = useState('')
  const [thoughts, setThoughts] = useState('')
  const [showThoughts, setShowThoughts] = useState(false)
  const [captureError, setCaptureError] = useState('')
  const capture = useRef<HTMLInputElement>(null)
  const rangeError = range === 'custom' && ((start && !validResearchDay(start)) || (end && !validResearchDay(end)) || (start && end && start > end))
  const allLogs = researchLogs(data.experiences, data.experienceHourEntries)
  const logs = rangeError ? [] : filterResearchLogs(allLogs, search, researchDateRange(range, now, { start: start || undefined, end: end || undefined }))
  const visible = new Set(logs.slice(0, limit).map(log => log.id))
  const weeks = researchWeeks(logs).map(week => ({ ...week, entries: week.entries.filter(log => visible.has(log.id)) })).filter(week => week.entries.length)
  const begin = () => current ? capture.current?.focus() : setLabEditor('new')
  const empty = !labs.length
  return <div className="research-page">
    <PageHeader title="Research" scene="research" subtitle={current?.org || 'Your lab and the work you record'} contentGlass={false} className="research-header" footer={<nav aria-label="Research sections"><span aria-current="page" className="research-log-tab">Log <span>{allLogs.length}</span></span></nav>}>
      <div className="research-stats" role="group" aria-label="Research totals"><div><strong>{stats.termHours} <small>h</small></strong><span>This term · {stats.term.label}</span></div>{stats.goal && <div><strong>Total {stats.totals.total} / {stats.goal} <small>h</small></strong><span>Goal</span>{stats.projection ? <small>At your logged pace: {fmtDate(stats.projection.projectedDate)}</small> : <small>Two dated logs on different days give a pace.</small>}</div>}<div><strong>{stats.totals.total} <small>h</small></strong><span>Total{stats.totals.estimated ? ` · ${stats.totals.estimated} est.` : ''}</span></div><div><strong>{stats.labDays}</strong><span>Lab days</span></div></div>
    </PageHeader>
    {!empty && <div className="research-controls"><label className="research-search"><Search className="size-4 shrink-0" /><Input aria-label="Search log" placeholder="Search what you did and your thoughts" value={search} onChange={event => { setSearch(event.target.value); setLimit(20) }} /></label><SelectField aria-label="Date range" value={range} onValueChange={value => { setRange(value as typeof range); setLimit(20) }} options={[{ value: 'term', label: `This term (${stats.term.label})` }, { value: '30-days', label: 'Last 30 days' }, { value: 'all', label: 'All time' }, { value: 'custom', label: 'Custom range' }]} /><Button className="rounded-full" onClick={begin}><Plus />Log a lab day</Button>{range === 'custom' && <div className="flex w-full min-w-0 flex-wrap gap-2"><ResearchField label="From"><Input type="date" value={start} onChange={event => setStart(event.target.value)} /></ResearchField><ResearchField label="Through"><Input type="date" value={end} onChange={event => setEnd(event.target.value)} /></ResearchField>{rangeError && <p role="alert">Choose a valid date range with the start before the end.</p>}</div>}</div>}
    {empty ? <section className="research-panel p-5"><p className="mb-3">Add your lab to start keeping your research days together.</p><Button className="rounded-full" onClick={() => setLabEditor('new')}><Plus />Add your lab</Button></section> : <div className="research-layout">
      <div className="grid min-w-0 content-start gap-3"><section className="research-panel" aria-label="Lab log"><div className="research-panel-heading"><h2>{allLogs.length ? 'Log a lab day' : 'Log your first lab day'}</h2><span className="text-muted-foreground">Hours optional</span></div><div className="research-panel-body">
        <InlineAddRow label="Save" className="research-capture-shell" onSubmit={async () => {
          const value = hours.trim() ? Number(hours) : 0
          if (!current || !validResearchDay(date) || !Number.isFinite(value) || value < 0 || (!value && !note.trim())) { setCaptureError('Add a valid date, nonnegative hours, and a note when no hours are recorded.'); return }
          setCaptureError('')
          const record: ExperienceHourEntry = { ...envelope(), experienceId: current.id, kind: 'logged', date, hours: value, note, thoughts }
          if (await writer.save(draft => { if (!draft.experiences.some(lab => lab.id === current.id && !lab.deletedAt && !lab.archived)) throw new Error('Lab unavailable'); draft.experienceHourEntries.push(record) })) { setChosenDate(null); setHours(''); setNote(''); setThoughts(''); setShowThoughts(false) }
        }}><fieldset disabled={writer.pending} className="research-capture">
          <ResearchField label="Date"><Input aria-label="Date" type="date" value={date} onChange={event => setDate(event.target.value)} required /></ResearchField>
          <ResearchField label="Hours"><Input aria-label="Hours" type="number" min="0" step="any" inputMode="decimal" placeholder="Optional" value={hours} onChange={event => setHours(event.target.value)} /></ResearchField>
          <label className="research-what"><span className="text-xs font-bold">What I did</span><Input ref={capture} aria-label="What I did" placeholder="What I did — one line" value={note} onChange={event => setNote(event.target.value)} /></label><Button type="submit" variant="secondary" className="research-capture-save">Save</Button>
          <Button type="button" variant="ghost" size="sm" className="research-thoughts-toggle" onClick={() => setShowThoughts(!showThoughts)}><Plus />Thoughts</Button>{showThoughts && <label className="research-thoughts"><span className="text-xs font-bold">Thoughts</span><Textarea aria-label="Thoughts" value={thoughts} onChange={event => setThoughts(event.target.value)} /></label>}
        </fieldset></InlineAddRow>
        {captureError && <p role="alert" className="text-destructive">{captureError}</p>}
        <SaveState writer={writer} />
        {weeks.map(week => <section key={week.start} aria-label={`Week of ${week.start}`}><div className="research-week"><span>Week of {fmtDate(week.start, { month: 'short', day: 'numeric' })}</span><span>{week.hours} h · {week.labDays} lab {week.labDays === 1 ? 'day' : 'days'}</span></div><div className="grid gap-2">{week.entries.map(entry => <LogRow key={entry.id} entry={entry} lab={labs.find(lab => lab.id === entry.experienceId)} labelLab={labs.length > 1} writer={writer} editLab={() => setLabEditor(labs.find(lab => lab.id === entry.experienceId) ?? null)} />)}</div></section>)}
        {!logs.length && <p className="py-3 text-muted-foreground">{allLogs.length ? 'No entries match these filters.' : 'Your first lab day will appear here.'}</p>}
        {logs.length > limit && <Button variant="link" onClick={() => setLimit(value => value + 20)}>Show earlier entries</Button>}
        <Link to="/settings?tab=archive" className="text-xs text-muted-foreground underline">Restore deleted entries in Trash</Link>
      </div></section><EarlierNotes data={data} /></div>
      {current && <aside className="grid min-w-0 content-start gap-3"><section className="research-panel" aria-label="Your lab"><div className="research-panel-heading"><h2>Your lab</h2><Button variant="link" size="sm" disabled={writer.pending} onClick={() => setLabEditor(current)}>Edit</Button></div><div className="research-panel-body"><strong className="break-words">{current.org}</strong><p className="text-muted-foreground">{[current.research?.department, current.research?.institution, current.research?.researchType, (current.research?.since || current.startDate) ? `since ${validResearchDay(current.research?.since || current.startDate) ? fmtDate(current.research?.since || current.startDate) : current.research?.since || current.startDate}` : ''].filter(Boolean).join(' · ') || 'Add your lab details when you know them.'}</p>{(data.persons.find(person => person.id === current.supervisorId && !person.deletedAt)?.name || current.supervisor) && <p className="text-muted-foreground">PI / supervisor: {data.persons.find(person => person.id === current.supervisorId && !person.deletedAt)?.name || current.supervisor}</p>}<LastContact key={current.id} lab={current} writer={writer} />
        {totalsForExperience(data.experienceHourEntries, current.id).estimated > 0 && <details className="research-estimates"><summary>Estimated hours · {totalsForExperience(data.experienceHourEntries, current.id).estimated} h</summary>{data.experienceHourEntries.filter(entry => entry.experienceId === current.id && entry.kind === 'estimated' && !entry.deletedAt && !entry.archived).map(entry => <div key={entry.id} className="mt-2"><p>{entry.hours} h · estimate{entry.periodStart ? ` · ${fmtDate(entry.periodStart)}` : ''}{entry.periodEnd ? ` – ${fmtDate(entry.periodEnd)}` : ''}</p><p className="whitespace-pre-wrap">{entry.note}</p><Button variant="ghost" size="sm" disabled={writer.pending} onClick={() => void writer.save(draft => { trashResearchRecord(draft, 'experienceHourEntries', entry.id) })}>Delete estimate</Button></div>)}</details>}
        {(['researchUpcomingItems', 'researchReminders', 'researchTimelineNotes'] as const).map(kind => <LabList key={`${current.id}:${kind}`} kind={kind} labId={current.id} data={data} today={today} writer={writer} />)}<SaveState writer={writer} /></div></section><ResearchPeople key={current.id} labId={current.id} data={data} writer={writer} /></aside>}
    </div>}
    {empty && <EarlierNotes data={data} />}
    <Dialog open={!!labEditor} onOpenChange={open => { if (!open && !writer.pending) setLabEditor(null) }}><DialogContent className="max-h-[85vh] overflow-y-auto"><DialogTitle>{labEditor === 'new' ? 'Add your lab' : 'Edit lab'}</DialogTitle><DialogDescription>Keep the lab and your role in your own words.</DialogDescription>{labEditor && <LabEditor key={labEditor === 'new' ? 'new' : labEditor.id} lab={labEditor === 'new' ? undefined : labEditor} data={data} writer={writer} close={() => setLabEditor(null)} />}{labEditor && labEditor !== 'new' && <div className="flex flex-wrap gap-2"><Button variant="ghost" size="sm" disabled={writer.pending} onClick={() => setLabEditor('new')}><Plus />Add another lab</Button><Button variant="ghost" size="sm" disabled={writer.pending} onClick={async () => { if (await writer.save(draft => { trashResearchRecord(draft, 'experiences', labEditor.id) })) setLabEditor(null) }}>Delete lab</Button></div>}{labs.length > 1 && <div className="grid gap-1 border-t pt-3"><p className="text-xs font-bold">Edit another lab</p>{labs.filter(lab => labEditor === 'new' || lab.id !== labEditor?.id).map(lab => <Button key={lab.id} variant="ghost" size="sm" disabled={writer.pending} onClick={() => setLabEditor(lab)}>{lab.org}</Button>)}</div>}</DialogContent></Dialog>
  </div>
}
