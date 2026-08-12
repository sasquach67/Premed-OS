import { useMemo, useState } from 'react'
import type { ComponentType, ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertTriangle, ArrowLeft, Award, BookOpen, CalendarDays,
  ChevronDown, ClipboardCheck, Clock, Copy, FileText,
  HeartHandshake,
  ListChecks, Mail, Map as MapIcon, Network, Plus, Search,
  ShieldCheck, Stethoscope, Trash2, TrendingUp, UserRound, Users,
} from 'lucide-react'
import { useStore } from '@/store/store'
import { ROUTE_MAP } from '@/app/routes'
import type { ExperienceCategory, ExperienceEntry, Goals, NotePage, StoryEntry } from '@/lib/types'
import { hourTotals } from '@/lib/selectors'
import { uid } from '@/lib/id'
import { cn } from '@/lib/utils'
import { ApprovedExperienceLayout } from '@/components/experiences/ApprovedPillarLayouts'
import { DocEmbed } from '@/components/common/DocEmbed'
import { EmptyState } from '@/components/common/EmptyState'
import { CreateExperienceDialog } from '@/components/common/CreateExperienceDialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { DateField } from '@/components/common/DateField'
import { InlineAddRow } from '@/components/common/InlineAddRow'

type ExperiencePatch = Partial<ExperienceEntry> & Record<string, unknown>
type PillarTab = { id: string; label: string; icon: ComponentType<{ className?: string }>; count?: number }
type ExperienceEntity = {
  key: string
  name: string
  role: string
  subtitle: string
  rows: ExperienceEntry[]
  totalHours: number
  startDate?: string
  endDate?: string
  status: ExperienceEntry['status']
  contact?: string
  supervisor?: string
  lastActivityLabel: string
  stale: boolean
  openLoops: string[]
}

const ROUTE_BY_CATEGORY: Record<ExperienceCategory, string> = {
  clinical: 'clinical',
  volunteering: 'volunteering',
  shadowing: 'shadowing',
  research: 'research',
  leadership: 'ecs',
}

const GOAL_KEY: Record<ExperienceCategory, keyof Goals> = {
  clinical: 'clinical',
  volunteering: 'volunteering',
  shadowing: 'shadowing',
  research: 'research',
  leadership: 'activities',
}

const SKILLS = [
  'Vitals and patient intake',
  'Bedside communication',
  'Patient transport',
  'Chart-ready documentation',
  'Team handoff',
  'Sterile technique',
]

const SHADOW_SPECIALTIES = ['All', 'Primary care', 'Surgery', 'Pediatrics', 'Emergency', 'Specialty']
const SERVICE_THEMES = ['Access', 'Education', 'Food security', 'Community trust', 'Mentorship']
const RESEARCH_STAGES = ['Question', 'Protocol', 'Data', 'Analysis', 'Output']

export function ExperiencePillar({ category }: { category: ExperienceCategory }) {
  const navigate = useNavigate()
  const experiences = useStore((s) => s.experiences)
  const goals = useStore((s) => s.goals)
  const notePages = useStore((s) => s.notePages)
  const addItem = useStore((s) => s.addItem)
  const patchItem = useStore((s) => s.patchItem)
  const removeItem = useStore((s) => s.removeItem)
  const logActivity = useStore((s) => s.logActivity)

  const routeId = ROUTE_BY_CATEGORY[category]
  const route = ROUTE_MAP[routeId]
  const rows = useMemo(
    () => experiences.filter((entry) => entry.category === category).sort(sortByOrderThenDate),
    [experiences, category]
  )
  const entities = useMemo(() => buildExperienceEntities(rows, category), [rows, category])
  const notes = useMemo(
    () => notePages.filter((note) => note.pillar === routeId || note.pillar === `pillar-${routeId}`).sort((a, b) => b.updatedAt - a.updatedAt),
    [notePages, routeId]
  )
  const [selectedEntityKey, setSelectedEntityKey] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const selectedEntity = entities.find((entity) => entity.key === selectedEntityKey) ?? entities[0] ?? null

  const totals = hourTotals(experiences)
  const goal = goals[GOAL_KEY[category]]
  const totalHours = Math.round(totals[category])

  function addEntry(patch: ExperiencePatch = {}) {
    const entry: ExperienceEntry = {
      id: uid(),
      category,
      org: '',
      role: '',
      startDate: new Date().toISOString().slice(0, 10),
      hours: 0,
      status: 'active',
      description: '',
      mostMeaningful: '',
      supervisor: '',
      tags: [],
      order: rows.length,
      ...patch,
    }
    addItem('experiences', entry)
    logActivity(routeId, `Added a ${route.label.toLowerCase()} entry`)
    return entry
  }

  function patchEntry(id: string, patch: ExperiencePatch) {
    patchItem('experiences', id, patch as Partial<ExperienceEntry>)
  }

  function requestLetter(entry: ExperienceEntry) {
    addItem('letters', {
      id: uid(),
      recommender: entry.supervisor || entry.contact || entry.org || 'New recommender',
      recommenderId: entry.supervisorId,
      role: `${route.label} contact`,
      relationship: entry.org || entry.role || route.label,
      type: routeId === 'research' ? 'Research PI' : routeId === 'shadowing' ? 'Physician' : 'Other',
      status: 'identified',
      notes: `Linked from ${route.label}: ${entry.org || entry.description || 'experience entry'}`,
      order: 0,
    })
    logActivity('letters', `Started a letter record from ${route.label}`)
    navigate('/letters')
  }

  function draftStory(entry: ExperienceEntry, theme = route.label) {
    const story: StoryEntry = {
      id: uid(),
      prompt: `Draft the story from ${theme}`,
      title: entry.org ? `${entry.org} reflection` : `${route.label} reflection`,
      commentary: entry.mostMeaningful || entry.description || '',
      tags: [routeId, theme.toLowerCase()],
      relatedExperienceId: entry.id,
      order: 0,
    }
    addItem('stories', story)
    logActivity('essays', `Created a story draft from ${route.label}`)
    navigate('/essays')
  }

  function addLabNote() {
    const note: NotePage = {
      id: uid(),
      title: 'New lab note',
      body: '',
      tag: 'lab notebook',
      pillar: routeId,
      updatedAt: Date.now(),
      order: notes.length,
    }
    addItem('notePages', note)
    logActivity(routeId, 'Added a lab notebook entry')
  }

  return (
    <>
      <ApprovedPillarPage
        category={category}
        title={route.label}
        rows={rows}
        entities={entities}
        selectedEntity={selectedEntity}
        goal={goal}
        totalHours={totalHours}
        notes={notes}
        onSelect={(entity) => setSelectedEntityKey(entity.key)}
        onAddEntity={() => setCreateOpen(true)}
        onAddEntry={addEntry}
        onPatchEntry={patchEntry}
        onRemoveEntry={(id) => removeItem('experiences', id)}
        onRequestLetter={requestLetter}
        onDraftStory={draftStory}
        onAddLabNote={addLabNote}
      />
      <CreateExperienceDialog
        open={createOpen}
        category={category}
        defaultRole={defaultRoleForCategory(category)}
        onOpenChange={setCreateOpen}
        onCreate={(patch) => {
          const created = addEntry(patch)
          setSelectedEntityKey(entityKeyFor(created, category))
        }}
      />
    </>
  )
}

type ApprovedPillarProps = {
  category: ExperienceCategory
  title: string
  rows: ExperienceEntry[]
  entities: ExperienceEntity[]
  selectedEntity: ExperienceEntity | null
  goal: number
  totalHours: number
  notes: NotePage[]
  onSelect: (entity: ExperienceEntity) => void
  onAddEntity: () => void
  onAddEntry: (patch?: ExperiencePatch) => ExperienceEntry
  onPatchEntry: (id: string, patch: ExperiencePatch) => void
  onRemoveEntry: (id: string) => void
  onRequestLetter: (entry: ExperienceEntry) => void
  onDraftStory: (entry: ExperienceEntry, theme?: string) => void
  onAddLabNote: () => void
}

function ApprovedPillarPage(props: ApprovedPillarProps) {
  const { category, rows, entities, goal, totalHours, selectedEntity, onSelect, onAddEntity, onAddEntry } = props

  return (
    <ApprovedExperienceLayout
      category={category as Exclude<ExperienceCategory, 'leadership'>}
      rows={rows}
      entities={entities}
      goal={goal}
      totalHours={totalHours}
      selectedKey={selectedEntity?.key}
      onSelectEntity={(key) => {
        const match = entities.find((entity) => entity.key === key)
        if (match) onSelect(match)
      }}
      onAddEntity={onAddEntity}
      onAddEntry={onAddEntry}
    />
  )
}

// Kept while existing stored pillar records are migrated to the approved layouts.
void [ApprovedMetric, ApprovedCenterpiece, ApprovedEntityWorkspace]

function ApprovedMetric({ icon: Icon, label, value, detail, accent = false }: { icon: typeof Clock; label: string; value: string; detail: string; accent?: boolean }) {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-extrabold uppercase tracking-[0.13em] text-muted-foreground">{label}</p>
        <Icon className={cn('size-4 text-primary', accent && 'text-emerald-500')} />
      </div>
      <p className="mt-3 font-display text-2xl font-extrabold">{value}</p>
      <p className="mt-1 text-xs font-semibold text-muted-foreground">{detail}</p>
    </div>
  )
}

function ApprovedCenterpiece({ category, rows, entities }: { category: ExperienceCategory; rows: ExperienceEntry[]; entities: ExperienceEntity[] }) {
  if (category === 'clinical') {
    const certDue = rows.filter((row) => row.tags.some((tag) => /cert|cpr|bls/i.test(tag))).length
    return (
      <section className="grid gap-3 rounded-2xl border bg-card p-4 md:grid-cols-[1.2fr_0.8fr]">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-muted-foreground">Clinical continuity</p>
          <h2 className="mt-1 font-display text-xl font-extrabold">Your sites, shifts, and credentials in one record</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{coverageForCategory(category, rows).detail}</p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <MiniMetric label="Sites" value={String(entities.length)} />
          <MiniMetric label="Cert records" value={String(certDue)} />
        </div>
      </section>
    )
  }

  if (category === 'volunteering') {
    return <ApprovedLedger rows={rows} />
  }

  if (category === 'shadowing') {
    const specialties = siteSummaries(rows)
    const total = Math.max(1, rows.reduce((sum, row) => sum + Number(row.hours || 0), 0))
    return (
      <section className="overflow-hidden rounded-2xl border bg-card">
        <div className="flex flex-wrap items-end justify-between gap-3 border-b p-4">
          <div><h2 className="font-display text-lg font-extrabold">Specialty exposure</h2><p className="text-sm text-muted-foreground">Coverage and the next relationship gap to close.</p></div>
          <span className="rounded-full bg-amber-500/12 px-3 py-1 text-xs font-bold text-amber-700 dark:text-amber-200">Primary care still matters</span>
        </div>
        <div className="overflow-x-auto"><table className="w-full min-w-[46rem] text-sm"><thead className="bg-muted/30 text-left text-xs uppercase tracking-wide text-muted-foreground"><tr><th className="px-4 py-3">Specialty</th><th>Hours</th><th>Share</th><th>Settings</th><th className="pr-4">Next move</th></tr></thead><tbody>
          {specialties.map((site) => <tr key={site.key} className="border-t"><td className="px-4 py-3 font-bold">{site.org || 'Unspecified specialty'}</td><td>{site.hours}h</td><td><div className="h-1.5 w-28 rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${Math.round((site.hours / total) * 100)}%` }} /></div></td><td className="text-muted-foreground">{rows.filter((row) => (row.org || row.id) === site.key).length} session{rows.filter((row) => (row.org || row.id) === site.key).length === 1 ? '' : 's'}</td><td className="pr-4 text-primary">Maintain contact</td></tr>)}
        </tbody></table></div>
      </section>
    )
  }

  return (
    <section className="overflow-hidden rounded-2xl border bg-card">
      <div className="border-b p-4"><h2 className="font-display text-lg font-extrabold">Research outputs</h2><p className="text-sm text-muted-foreground">Translate time in the lab into concrete lines for a CV and application.</p></div>
      <div className="overflow-x-auto"><table className="w-full min-w-[45rem] text-sm"><thead className="bg-muted/30 text-left text-xs uppercase tracking-wide text-muted-foreground"><tr><th className="px-4 py-3">Project / output</th><th>Type</th><th>Venue</th><th>Deadline</th><th className="pr-4">Status</th></tr></thead><tbody>
        {(rows.length ? rows : [{ id: 'empty', category: 'research', org: 'No research output yet', role: '', description: '', tags: [], status: 'planned', hours: 0, order: 0 } satisfies ExperienceEntry]).map((row) => <tr key={row.id} className="border-t"><td className="px-4 py-3 font-bold">{row.description || row.org || 'Untitled project'}</td><td>{row.tags[0] || 'Project'}</td><td className="text-muted-foreground">{row.org || 'Add venue'}</td><td className="text-muted-foreground">{formatDate(row.endDate)}</td><td className="pr-4"><span className={cn('rounded-full px-2 py-1 text-xs font-bold', statusTone(row.status))}>{row.status}</span></td></tr>)}
      </tbody></table></div>
    </section>
  )
}

function ApprovedLedger({ rows }: { rows: ExperienceEntry[] }) {
  const sites = siteSummaries(rows)
  return (
    <section className="overflow-hidden rounded-2xl border bg-card">
      <div className="border-b p-4"><h2 className="font-display text-lg font-extrabold">Verification ledger</h2><p className="text-sm text-muted-foreground">The audit-ready record behind the final AMCAS entry.</p></div>
      <div className="overflow-x-auto"><table className="w-full min-w-[48rem] text-sm"><thead className="bg-muted/30 text-left text-xs uppercase tracking-wide text-muted-foreground"><tr><th className="px-4 py-3">Organization</th><th>Total hrs</th><th>Avg / wk</th><th>Dates</th><th>Verifier</th><th>Type</th><th className="pr-4">AMCAS</th></tr></thead><tbody>
        {sites.map((site) => { const row = site.entry; const count = rows.filter((item) => (item.org || item.id) === site.key).length; return <tr key={site.key} className="border-t"><td className="px-4 py-3 font-bold">{site.org || 'Unnamed organization'}</td><td>{site.hours}h</td><td>{Math.max(1, Math.round(site.hours / Math.max(1, count * 4)))}h</td><td className="text-muted-foreground">{dateRangeLabel([row])}</td><td>{row.supervisor || row.contact || 'Add verifier'}</td><td>{row.tags[0] || 'Non-clinical'}</td><td className="pr-4"><button type="button" className="inline-flex items-center gap-1 text-xs font-bold text-primary"><Copy className="size-3.5" /> Copy</button></td></tr> })}
      </tbody></table></div>
    </section>
  )
}

function ApprovedEntityWorkspace({ category, entity, notes, onAddEntry, onPatchEntry, onRemoveEntry, onRequestLetter, onDraftStory, onAddLabNote }: ApprovedPillarProps & { entity: ExperienceEntity }) {
  const latest = [...entity.rows].sort((a, b) => String(b.startDate ?? '').localeCompare(String(a.startDate ?? '')))
  const base = entity.rows[0]
  const contacts = uniqueContacts(entity.rows)

  const addLog = (values: string[]) => {
    const [date, hours, description] = values
    onAddEntry({
      org: entity.name,
      organizationId: base?.organizationId,
      role: entity.role,
      startDate: date || new Date().toISOString().slice(0, 10),
      hours: Number(hours) || 0,
      description,
      supervisor: base?.supervisor,
      supervisorId: base?.supervisorId,
      contact: base?.contact,
      status: 'active',
    })
  }

  return (
    <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
      <div className="flex flex-col gap-4 border-b p-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 gap-3">
          <span className={cn('grid size-12 shrink-0 place-items-center rounded-xl text-primary', categoryAccent(category))}>{categoryIcon(category)}</span>
          <div className="min-w-0"><h2 className="truncate font-display text-2xl font-extrabold">{entity.name}</h2><p className="mt-1 text-sm font-semibold text-muted-foreground">{entity.role || entity.subtitle} · {dateRangeLabel(entity.rows)}</p></div>
        </div>
        <div className="flex flex-wrap gap-2"><span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">{entity.totalHours}h logged</span><span className={cn('rounded-full px-3 py-1 text-xs font-bold', statusTone(entity.status))}>{entity.status}</span></div>
      </div>

      {category === 'clinical' && <ClinicalWorkspace entity={entity} latest={latest} onPatch={onPatchEntry} onRemove={onRemoveEntry} addLog={addLog} />}
      {category === 'volunteering' && <VolunteeringWorkspace entity={entity} latest={latest} contacts={contacts} onDraftStory={onDraftStory} addLog={addLog} />}
      {category === 'shadowing' && <ShadowingWorkspace entity={entity} latest={latest} contacts={contacts} onRequestLetter={onRequestLetter} addLog={addLog} />}
      {category === 'research' && <ResearchWorkspace entity={entity} latest={latest} notes={notes} onAddLabNote={onAddLabNote} addLog={addLog} />}
    </section>
  )
}

function ClinicalWorkspace({ entity, latest, onPatch, onRemove, addLog }: { entity: ExperienceEntity; latest: ExperienceEntry[]; onPatch: ApprovedPillarProps['onPatchEntry']; onRemove: (id: string) => void; addLog: (values: string[]) => void }) {
  return <div className="grid gap-0 lg:grid-cols-[0.9fr_1.1fr]"><div className="space-y-5 border-b p-5 lg:border-b-0 lg:border-r"><WorkspaceBlock title="Certifications" icon={ShieldCheck}>{['BLS / CPR', 'HIPAA', 'Site onboarding'].map((name, index) => <div key={name} className="flex items-center justify-between rounded-lg bg-muted/25 px-3 py-2 text-sm"><span className="font-bold">{name}</span><span className={cn('text-xs font-bold', index ? 'text-muted-foreground' : 'text-emerald-500')}>{index ? 'Add expiry' : 'Current'}</span></div>)}</WorkspaceBlock><WorkspaceBlock title="Skills observed / performed" icon={ClipboardCheck}><div className="flex flex-wrap gap-2">{SKILLS.slice(0, 5).map((skill, index) => <span key={skill} className={cn('rounded-full border px-2.5 py-1 text-xs font-bold', index < Math.min(3, entity.rows.length) ? 'border-primary/30 bg-primary/10 text-primary' : 'text-muted-foreground')}>{skill}</span>)}</div></WorkspaceBlock></div><div className="p-5"><LogList title="Shift log" rows={latest} onPatch={onPatch} onRemove={onRemove} addLog={addLog} /></div></div>
}

function VolunteeringWorkspace({ entity, latest, contacts, onDraftStory, addLog }: { entity: ExperienceEntity; latest: ExperienceEntry[]; contacts: ExperienceEntry[]; onDraftStory: ApprovedPillarProps['onDraftStory']; addLog: (values: string[]) => void }) {
  const people = new Set(entity.rows.map((row) => row.contact).filter(Boolean)).size
  return <div className="grid gap-0 lg:grid-cols-[0.85fr_1.15fr]"><div className="space-y-5 border-b p-5 lg:border-b-0 lg:border-r"><WorkspaceBlock title="Impact numbers" icon={HeartHandshake}><div className="grid grid-cols-2 gap-2"><MiniMetric label="Hours" value={`${entity.totalHours}h`} /><MiniMetric label="Relationships" value={String(Math.max(people, contacts.length))} /></div></WorkspaceBlock><WorkspaceBlock title="Application notes" icon={FileText}><p className="text-sm leading-relaxed text-muted-foreground">{categorySpecificInsight('volunteering', entity).detail}</p>{entity.rows[0] && <Button className="mt-3" size="sm" variant="outline" onClick={() => onDraftStory(entity.rows[0], 'service impact')}><BookOpen className="size-4" /> Draft story</Button>}</WorkspaceBlock></div><div className="p-5"><SimpleLog title="Hours log" rows={latest} addLog={addLog} prompt="What changed for the people or community you served?" /></div></div>
}

function ShadowingWorkspace({ entity, latest, contacts, onRequestLetter, addLog }: { entity: ExperienceEntity; latest: ExperienceEntry[]; contacts: ExperienceEntry[]; onRequestLetter: ApprovedPillarProps['onRequestLetter']; addLog: (values: string[]) => void }) {
  const base = entity.rows[0]
  return <div className="grid gap-0 lg:grid-cols-[0.75fr_1.25fr]"><div className="space-y-4 border-b p-5 lg:border-b-0 lg:border-r"><WorkspaceBlock title="Physician relationship" icon={UserRound}>{contacts.length ? contacts.map((row) => <div key={row.id} className="rounded-lg bg-muted/25 p-3"><p className="font-bold">{row.supervisor || row.contact}</p><p className="text-xs text-muted-foreground">{row.contact || 'Add contact details'}</p></div>) : <p className="text-sm text-muted-foreground">Add the physician and contact details.</p>}{base && <Button size="sm" variant="outline" onClick={() => onRequestLetter(base)}><Mail className="size-4" /> Track relationship</Button>}</WorkspaceBlock><div className="grid grid-cols-2 gap-2"><MiniMetric label="Thank-you" value={base?.tags.some((tag) => /thank/i.test(tag)) ? 'Sent' : 'Due'} /><MiniMetric label="Letter potential" value={entity.totalHours >= 20 ? 'Strong' : 'Developing'} /></div></div><div className="p-5"><SimpleLog title="Shadowing sessions" rows={latest} addLog={addLog} prompt="Capture the setting, specialty, and one clinical insight." /></div></div>
}

function ResearchWorkspace({ entity, latest, notes, onAddLabNote, addLog }: { entity: ExperienceEntity; latest: ExperienceEntry[]; notes: NotePage[]; onAddLabNote: () => void; addLog: (values: string[]) => void }) {
  return <div className="grid gap-0 lg:grid-cols-[0.9fr_1.1fr]"><div className="space-y-5 border-b p-5 lg:border-b-0 lg:border-r"><WorkspaceBlock title="Meetings with PI" icon={Users}><div className="space-y-2">{['Clarify next analysis', 'Confirm authorship expectations', 'Ask about the next abstract deadline'].map((item) => <label key={item} className="flex items-center gap-2 rounded-lg bg-muted/25 px-3 py-2 text-sm"><input type="checkbox" className="size-4 rounded" /> {item}</label>)}</div></WorkspaceBlock><WorkspaceBlock title="Output trajectory" icon={Award}><p className="text-sm text-muted-foreground">{categorySpecificInsight('research', entity).detail}</p></WorkspaceBlock></div><div className="space-y-5 p-5"><div className="flex items-center justify-between"><h3 className="font-display text-lg font-extrabold">Lab notebook</h3><Button size="sm" variant="outline" onClick={onAddLabNote}><Plus className="size-4" /> Note</Button></div>{notes.slice(0, 3).map((note) => <div key={note.id} className="rounded-lg bg-muted/25 px-3 py-2"><p className="font-bold">{note.title}</p><p className="text-xs text-muted-foreground">{new Date(note.updatedAt).toLocaleDateString()}</p></div>)}<SimpleLog title="Hours and milestones" rows={latest} addLog={addLog} prompt="Record the experiment, decision, result, or output." /></div></div>
}

function WorkspaceBlock({ title, icon: Icon, children }: { title: string; icon: typeof Clock; children: ReactNode }) { return <section><div className="mb-3 flex items-center gap-2"><Icon className="size-4 text-primary" /><h3 className="font-display text-base font-extrabold">{title}</h3></div><div className="space-y-2">{children}</div></section> }

function SimpleLog({ title, rows, addLog, prompt }: { title: string; rows: ExperienceEntry[]; addLog: (values: string[]) => void; prompt: string }) { return <section className="space-y-3"><div><h3 className="font-display text-lg font-extrabold">{title}</h3><p className="text-xs text-muted-foreground">{prompt}</p></div><div className="space-y-2">{rows.slice(0, 6).map((row) => <div key={row.id} className="grid gap-2 rounded-lg border bg-muted/10 px-3 py-2 sm:grid-cols-[7rem_4rem_1fr]"><span className="text-xs font-bold text-muted-foreground">{formatDate(row.startDate)}</span><span className="font-extrabold">{row.hours || 0}h</span><span className="text-sm text-muted-foreground">{row.description || row.role || 'Add detail'}</span></div>)}</div><InlineAddRow label="Add log" fields={['Date', 'Hours', 'What happened?']} onAdd={addLog} /></section> }

function LogList({ title, rows, onPatch, onRemove, addLog }: { title: string; rows: ExperienceEntry[]; onPatch: ApprovedPillarProps['onPatchEntry']; onRemove: (id: string) => void; addLog: (values: string[]) => void }) { return <section className="space-y-3"><h3 className="font-display text-lg font-extrabold">{title}</h3>{rows.slice(0, 6).map((row) => <ExpandableEntryRow key={row.id} entry={row} onPatch={(patch) => onPatch(row.id, patch)} onDelete={() => onRemove(row.id)} />)}<InlineAddRow label="Add shift" fields={['Date', 'Hours', 'Call type / note']} onAdd={addLog} /></section> }

function PillarInsightStrip({
  category,
  rows,
  goal,
  entities,
}: {
  category: ExperienceCategory
  rows: ExperienceEntry[]
  goal: number
  entities: ExperienceEntity[]
}) {
  const totalHours = rows.reduce((sum, row) => sum + Number(row.hours || 0), 0)
  const projected = Math.round(projectedHoursFor(rows))
  const contacts = uniqueContacts(rows).length
  const staleCount = entities.filter((entity) => entity.stale).length
  const openLoops = entities.reduce((sum, entity) => sum + entity.openLoops.length, 0)
  const coverage = coverageForCategory(category, rows)

  return (
    <div className="grid gap-3 md:grid-cols-3">
      <InsightCard
        icon={TrendingUp}
        label="Pace"
        title={projected >= goal ? `On pace for about ${projected}h` : `${Math.max(0, goal - projected)}h gap at current pace`}
        detail={`${totalHours}h logged now · ${goal}h target`}
        tone={projected >= goal ? 'good' : 'warn'}
      />
      <InsightCard
        icon={Network}
        label="Relationships"
        title={contacts ? `${contacts} verification ${contacts === 1 ? 'contact' : 'contacts'} identified` : 'No verification contacts yet'}
        detail={openLoops ? `${openLoops} open loops across ${entities.length || 0} ${categoryNoun(category, true)}` : 'Relationships are cleanly documented'}
        tone={contacts ? 'good' : 'warn'}
      />
      <InsightCard
        icon={MapIcon}
        label="Admissions read"
        title={coverage.title}
        detail={staleCount ? `${staleCount} ${categoryNoun(category, staleCount !== 1)} need a recent touchpoint` : coverage.detail}
        tone={coverage.tone}
      />
    </div>
  )
}

function InsightCard({
  icon: Icon,
  label,
  title,
  detail,
  tone = 'neutral',
}: {
  icon: typeof Clock
  label: string
  title: string
  detail: string
  tone?: 'good' | 'warn' | 'neutral'
}) {
  return (
    <div className={cn(
      'rounded-xl border bg-card p-4 shadow-sm',
      tone === 'good' && 'border-emerald-500/25 bg-emerald-500/5',
      tone === 'warn' && 'border-amber-500/25 bg-amber-500/5'
    )}>
      <div className="mb-3 flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.14em] text-muted-foreground">
        <Icon className="size-4 text-primary" />
        {label}
      </div>
      <p className="font-display text-lg font-extrabold leading-tight">{title}</p>
      <p className="mt-1 text-sm font-semibold text-muted-foreground">{detail}</p>
    </div>
  )
}

function ExperienceEntityCatalog({
  category,
  entities,
  onOpen,
  onAdd,
}: {
  category: ExperienceCategory
  entities: ExperienceEntity[]
  onOpen: (entity: ExperienceEntity) => void
  onAdd: () => void
}) {
  const title = categoryCatalogTitle(category)

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-extrabold">{title}</h2>
          <p className="text-sm text-muted-foreground">Open a workspace to see trajectory, relationships, stories, and gaps.</p>
        </div>
        <Button onClick={onAdd}>
          <Plus className="size-4" />
          Add {categoryNoun(category)}
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {entities.map((entity) => (
          <button
            key={entity.key}
            type="button"
            onClick={() => onOpen(entity)}
            className="group min-h-[13rem] rounded-xl border bg-card p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-primary/45 hover:shadow-md"
          >
            <div className="flex items-start gap-3">
              <span className={cn('grid size-11 shrink-0 place-items-center rounded-xl text-primary', categoryAccent(category))}>
                {categoryIcon(category)}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="truncate font-display text-lg font-extrabold">{entity.name}</h3>
                    <p className="truncate text-sm font-semibold text-muted-foreground">{entity.role || entity.subtitle}</p>
                  </div>
                  <span className={cn('rounded-full px-2 py-0.5 text-xs font-bold', statusTone(entity.status))}>{entity.status}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <MiniMetric label="Hours" value={`${entity.totalHours}h`} />
              <MiniMetric label="Rows" value={String(entity.rows.length)} />
              <MiniMetric label="Last" value={entity.lastActivityLabel} />
            </div>

            <div className="mt-4 space-y-2">
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, Math.max(8, entity.totalHours))}%` }} />
              </div>
              <div className="flex flex-wrap gap-1">
                {entity.openLoops.length ? (
                  entity.openLoops.slice(0, 2).map((loop) => (
                    <span key={loop} className="rounded-full bg-amber-500/12 px-2 py-0.5 text-xs font-bold text-amber-700 dark:text-amber-200">{loop}</span>
                  ))
                ) : (
                  <span className="rounded-full bg-emerald-500/12 px-2 py-0.5 text-xs font-bold text-emerald-700 dark:text-emerald-200">verification-ready</span>
                )}
              </div>
            </div>
          </button>
        ))}

        <button
          type="button"
          onClick={onAdd}
          className="flex min-h-[13rem] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/15 p-4 text-center font-extrabold text-muted-foreground transition hover:border-primary/40 hover:text-primary"
        >
          <Plus className="mb-2 size-5" />
          Add {categoryNoun(category)}
          <span className="mt-1 text-xs font-semibold normal-case">Start with the site, lab, person, or organization.</span>
        </button>
      </div>
    </section>
  )
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-muted/35 px-2 py-2">
      <p className="text-[0.65rem] font-extrabold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-0.5 truncate text-sm font-extrabold">{value}</p>
    </div>
  )
}

function ExperienceEntityWorkspace({
  category,
  entity,
  goal,
  onBack,
}: {
  category: ExperienceCategory
  entity: ExperienceEntity
  goal: number
  onBack: () => void
}) {
  const total = entity.totalHours
  const pct = Math.min(100, Math.round((total / Math.max(goal, 1)) * 100))
  const contacts = uniqueContacts(entity.rows)
  const stories = entity.rows.filter((row) => row.mostMeaningful?.trim() || row.description?.trim())
  const latestRows = [...entity.rows].sort((a, b) => String(b.startDate ?? '').localeCompare(String(a.startDate ?? ''))).slice(0, 5)
  const insight = categorySpecificInsight(category, entity)

  return (
    <section className="mt-6 space-y-5">
      <div className="rounded-2xl border bg-card p-4 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <Button variant="ghost" size="icon" aria-label="Back to catalog" onClick={onBack} className="shrink-0">
              <ArrowLeft className="size-4" />
            </Button>
            <span className={cn('grid size-12 shrink-0 place-items-center rounded-2xl text-primary', categoryAccent(category))}>
              {categoryIcon(category)}
            </span>
            <div className="min-w-0">
              <h2 className="truncate font-display text-2xl font-extrabold">{entity.name}</h2>
              <p className="text-sm font-semibold text-muted-foreground">{entity.subtitle}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-muted px-3 py-1 text-xs font-bold text-muted-foreground">{total}h logged</span>
            <span className={cn('rounded-full px-3 py-1 text-xs font-bold', statusTone(entity.status))}>{entity.status}</span>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_0.9fr]">
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">What this means</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-3">
              <MiniMetric label="Readiness" value={`${pct}%`} />
              <MiniMetric label="Last touch" value={entity.lastActivityLabel} />
              <MiniMetric label="Evidence" value={`${stories.length} stories`} />
              <div className="md:col-span-3 rounded-xl bg-muted/25 p-3">
                <p className="font-bold">{insight.title}</p>
                <p className="mt-1 text-sm font-semibold text-muted-foreground">{insight.detail}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between pb-3">
              <CardTitle className="text-base">Timeline</CardTitle>
              <span className="text-xs font-bold text-muted-foreground">{entity.rows.length} logs</span>
            </CardHeader>
            <CardContent className="space-y-2">
              {latestRows.map((row) => (
                <div key={row.id} className="grid gap-3 rounded-xl border bg-muted/15 p-3 md:grid-cols-[8rem_1fr_5rem] md:items-center">
                  <span className="text-sm font-bold text-muted-foreground">{formatDate(row.startDate)}</span>
                  <div className="min-w-0">
                    <p className="truncate font-bold">{row.role || entity.role}</p>
                    <p className="line-clamp-2 text-sm text-muted-foreground">{row.description || row.mostMeaningful || 'No reflection yet'}</p>
                  </div>
                  <span className="text-right font-extrabold">{row.hours || 0}h</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Open loops</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {(entity.openLoops.length ? entity.openLoops : ['No major gaps flagged']).map((loop) => (
                <div key={loop} className="flex items-center gap-2 rounded-xl bg-muted/25 p-3 text-sm font-bold">
                  <AlertTriangle className={cn('size-4', entity.openLoops.length ? 'text-amber-500' : 'text-emerald-500')} />
                  {loop}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Relationships</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {contacts.length ? contacts.map((row) => (
                <div key={row.id} className="rounded-xl bg-muted/25 p-3">
                  <p className="font-bold">{row.supervisor || row.contact || row.org}</p>
                  <p className="text-xs font-semibold text-muted-foreground">{row.role || 'contact'} · {row.contact || 'add email/phone'}</p>
                </div>
              )) : (
                <p className="rounded-xl bg-muted/25 p-3 text-sm font-semibold text-muted-foreground">Add a supervisor or contact so verification season is less chaotic.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}

function PillarTabStrip({ tabs, value, onChange }: { tabs: PillarTab[]; value: string; onChange: (value: string) => void }) {
  return (
    <div className="border-b border-border">
      <div className="flex max-w-full gap-1 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const active = value === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className={cn(
                'relative inline-flex items-center gap-2 px-3 pb-3 pt-1 text-sm font-extrabold text-muted-foreground transition hover:text-foreground',
                active && 'text-primary'
              )}
            >
              <Icon className="size-4" />
              {tab.label}
              {typeof tab.count === 'number' && <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{tab.count}</span>}
              <span className={cn('absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-transparent', active && 'bg-primary')} />
            </button>
          )
        })}
      </div>
    </div>
  )
}

function HoursAndSitesView({
  rows, addEntry, patchEntry, removeItem, requestLetter, draftStory, category, label, requestLabel, themes = [],
}: {
  rows: ExperienceEntry[]
  addEntry: (patch?: ExperiencePatch) => ExperienceEntry
  patchEntry: (id: string, patch: ExperiencePatch) => void
  removeItem: (key: 'experiences', id: string) => void
  requestLetter: (entry: ExperienceEntry) => void
  draftStory: (entry: ExperienceEntry, theme?: string) => void
  category: ExperienceCategory
  label: string
  requestLabel: string
  themes?: string[]
}) {
  const sites = useMemo(() => siteSummaries(rows), [rows])
  return (
    <div className="space-y-5">
      <div className="grid gap-4 lg:grid-cols-[1.1fr_1.4fr]">
        <WeeklyHoursCard rows={rows} />
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="size-4 text-primary" /> Sites and roles
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 md:grid-cols-2">
            {sites.length ? sites.map((site) => (
              <div key={site.key} className="rounded-xl border bg-muted/20 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-bold">{site.org || 'Unnamed site'}</p>
                    <p className="truncate text-xs font-semibold text-muted-foreground">{site.role || 'Role TBD'} · {site.hours}h</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => requestLetter(site.entry)}>{requestLabel}</Button>
                </div>
              </div>
            )) : (
              <EmptyState icon={Users} title={`No ${label.toLowerCase()} sites yet`} hint="Add the first shift below and this area will organize your sites automatically." />
            )}
          </CardContent>
        </Card>
      </div>

      {themes.length > 0 && <ThemeRollup rows={rows} themes={themes} />}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{label} log</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {rows.map((row) => (
            <ExpandableEntryRow
              key={row.id}
              entry={row}
              onPatch={(patch) => patchEntry(row.id, patch)}
              onDelete={() => removeItem('experiences', row.id)}
              onDraftStory={() => draftStory(row, category === 'volunteering' ? 'service' : label)}
            />
          ))}
          <InlineAddRow
            label={`Add ${label.toLowerCase()} shift`}
            fields={['Site or org', 'Role', 'Hours']}
            onAdd={(values) => addEntry({ org: values[0], role: values[1], hours: Number(values[2] || 0) })}
          />
        </CardContent>
      </Card>
    </div>
  )
}

function WeeklyHoursCard({ rows }: { rows: ExperienceEntry[] }) {
  const weeks = useMemo(() => buildWeeks(rows), [rows])
  const max = Math.max(1, ...weeks.map((week) => week.hours))
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base"><Clock className="size-4 text-primary" /> Weekly hours</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex h-44 items-end gap-2">
          {weeks.map((week) => (
            <div key={week.label} className="flex min-w-0 flex-1 flex-col items-center gap-2">
              <div className="flex h-32 w-full items-end rounded-lg bg-muted/30 p-1">
                <div className="w-full rounded-md bg-primary/80" style={{ height: `${Math.max(6, (week.hours / max) * 100)}%` }} />
              </div>
              <span className="text-[0.68rem] font-bold text-muted-foreground">{week.label}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function ExpandableEntryRow({
  entry, onPatch, onDelete, onDraftStory,
}: {
  entry: ExperienceEntry
  onPatch: (patch: ExperiencePatch) => void
  onDelete: () => void
  onDraftStory?: () => void
}) {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-xl border bg-card">
      <button type="button" onClick={() => setOpen((value) => !value)} className="flex w-full items-center gap-3 p-3 text-left">
        <ChevronDown className={cn('size-4 shrink-0 text-muted-foreground transition', open && 'rotate-180')} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-bold">{entry.org || 'Unnamed entry'}</p>
          <p className="truncate text-xs font-semibold text-muted-foreground">{entry.role || 'Role TBD'} · {entry.hours || 0}h · {formatDate(entry.startDate)}</p>
        </div>
        <span className={cn('rounded-full px-2 py-1 text-xs font-bold', entry.status === 'active' ? 'bg-success/15 text-success' : 'bg-muted text-muted-foreground')}>
          {entry.status}
        </span>
      </button>
      {open && (
        <div className="grid gap-3 border-t border-border p-3 md:grid-cols-2">
          <Field label="Site / org"><Input value={entry.org} onChange={(event) => onPatch({ org: event.target.value })} /></Field>
          <Field label="Role"><Input value={entry.role} onChange={(event) => onPatch({ role: event.target.value })} /></Field>
          <Field label="Date"><DateField value={entry.startDate ?? ''} onChange={(startDate) => onPatch({ startDate })} /></Field>
          <Field label="Hours"><Input type="number" value={entry.hours} onChange={(event) => onPatch({ hours: Number(event.target.value || 0) })} /></Field>
          <Field label="Supervisor"><Input value={entry.supervisor ?? ''} onChange={(event) => onPatch({ supervisor: event.target.value })} /></Field>
          <Field label="Theme tags"><Input value={entry.tags.join(', ')} onChange={(event) => onPatch({ tags: event.target.value.split(',').map((tag) => tag.trim()).filter(Boolean) })} /></Field>
          <Field label="What happened?" className="md:col-span-2"><Textarea value={entry.description} onChange={(event) => onPatch({ description: event.target.value })} className="min-h-24" /></Field>
          <Field label="Reflection for essays" className="md:col-span-2"><Textarea value={entry.mostMeaningful ?? ''} onChange={(event) => onPatch({ mostMeaningful: event.target.value })} className="min-h-24" /></Field>
          <div className="flex flex-wrap justify-end gap-2 md:col-span-2">
            {onDraftStory && <Button variant="outline" onClick={onDraftStory}><FileText className="size-4" /> Draft the story</Button>}
            <Button variant="ghost" className="text-destructive hover:text-destructive" onClick={onDelete}><Trash2 className="size-4" /> Delete</Button>
          </div>
        </div>
      )}
    </div>
  )
}

function SkillsView({ rows, onPatch, onAdd }: { rows: ExperienceEntry[]; onPatch: (id: string, patch: ExperiencePatch) => void; onAdd: (patch?: ExperiencePatch) => void }) {
  const observations = (skill: string) => rows.filter((row) => textFor(row).toLowerCase().includes(skill.split(' ')[0].toLowerCase())).length
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base"><ListChecks className="size-4 text-primary" /> Skills closest to competent</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {SKILLS.map((skill) => {
          const count = observations(skill)
          const readiness = Math.min(100, count * 28 + rows.length * 6)
          return (
            <div key={skill} className="grid gap-3 rounded-xl border bg-card p-3 md:grid-cols-[1fr_11rem_8rem_auto] md:items-center">
              <div>
                <p className="font-bold">{skill}</p>
                <p className="text-xs font-semibold text-muted-foreground">{count} observed {count === 1 ? 'time' : 'times'}</p>
              </div>
              <div className="h-2 rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${readiness}%` }} /></div>
              <span className="text-sm font-bold text-muted-foreground">{readiness >= 70 ? 'competent' : readiness >= 35 ? 'building' : 'needs reps'}</span>
              <Button size="sm" variant="outline" onClick={() => onAdd({ description: `Observed skill: ${skill}`, tags: [skill] })}>Log rep</Button>
            </div>
          )
        })}
        {rows.length > 0 && <Button variant="ghost" size="sm" onClick={() => onPatch(rows[0].id, { tags: [...new Set([...rows[0].tags, 'skills reviewed'])] })}>Mark reviewed</Button>}
      </CardContent>
    </Card>
  )
}

function ShadowingSessionsView({
  rows, onAdd, onPatch, onRemove,
}: {
  rows: ExperienceEntry[]
  onAdd: (patch?: ExperiencePatch) => void
  onPatch: (id: string, patch: ExperiencePatch) => void
  onRemove: (id: string) => void
}) {
  const [filter, setFilter] = useState('All')
  const filtered = rows.filter((row) => filter === 'All' || (row.tags ?? []).includes(filter) || row.role.includes(filter))
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1 rounded-full bg-muted p-1">
          {SHADOW_SPECIALTIES.map((item) => (
            <button key={item} type="button" onClick={() => setFilter(item)} className={cn('rounded-full px-3 py-1.5 text-xs font-extrabold', filter === item ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground')}>
              {item}
            </button>
          ))}
        </div>
        <Button onClick={() => onAdd({ role: 'Shadowing session', tags: filter === 'All' ? [] : [filter] })}><Plus className="size-4" /> Add session</Button>
      </div>
      <div className="space-y-2">
        {filtered.length ? filtered.map((row) => (
          <ShadowingRow key={row.id} entry={row} onPatch={(patch) => onPatch(row.id, patch)} onDelete={() => onRemove(row.id)} />
        )) : <EmptyState icon={Search} title="No sessions match this filter" hint="Change the specialty family or add a new session." />}
      </div>
    </div>
  )
}

function ShadowingRow({ entry, onPatch, onDelete }: { entry: ExperienceEntry; onPatch: (patch: ExperiencePatch) => void; onDelete: () => void }) {
  const [open, setOpen] = useState(false)
  const fit = Number((entry as unknown as Record<string, unknown>).careerFit ?? 3)
  return (
    <div className="rounded-xl border bg-card">
      <button type="button" onClick={() => setOpen((value) => !value)} className="grid w-full gap-3 p-3 text-left md:grid-cols-[1fr_8rem_8rem] md:items-center">
        <div>
          <p className="font-bold">{entry.org || 'Physician / clinic'}</p>
          <p className="text-xs font-semibold text-muted-foreground">{entry.role || 'Shadowing'} · {formatDate(entry.startDate)} · {entry.hours || 0}h</p>
        </div>
        <span className="rounded-full bg-muted px-2 py-1 text-center text-xs font-bold">fit {fit}/5</span>
        <span className="text-sm font-bold text-primary">Reflect</span>
      </button>
      {open && (
        <div className="grid gap-3 border-t border-border p-3 md:grid-cols-2">
          <Field label="Specialty / physician"><Input value={entry.org} onChange={(event) => onPatch({ org: event.target.value })} /></Field>
          <Field label="Career fit"><Input type="range" min={1} max={5} value={fit} onChange={(event) => onPatch({ careerFit: Number(event.target.value) })} /></Field>
          <Field label="Reflection" className="md:col-span-2"><Textarea value={entry.mostMeaningful ?? ''} onChange={(event) => onPatch({ mostMeaningful: event.target.value })} className="min-h-28" /></Field>
          <div className="flex justify-end md:col-span-2"><Button variant="ghost" className="text-destructive hover:text-destructive" onClick={onDelete}><Trash2 className="size-4" /> Delete</Button></div>
        </div>
      )}
    </div>
  )
}

function PhysiciansView({ rows, onPatch, onRequestLetter }: { rows: ExperienceEntry[]; onPatch: (id: string, patch: ExperiencePatch) => void; onRequestLetter: (entry: ExperienceEntry) => void }) {
  const contacts = uniqueContacts(rows)
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {contacts.length ? contacts.map((entry) => (
        <ContactCard
          key={entry.id}
          name={entry.supervisor || entry.contact || entry.org || 'Physician'}
          role={entry.role || 'Physician'}
          detail={entry.org}
          followUp={entry.status === 'active' ? 'Follow up ready' : 'Logged'}
          onLetter={() => onRequestLetter(entry)}
          onTouch={() => onPatch(entry.id, { contact: `Last touched ${new Date().toLocaleDateString()}` })}
        />
      )) : <EmptyState icon={UserRound} title="No physicians yet" hint="Add a shadowing session and the physician directory will build itself." />}
    </div>
  )
}

function LabNotebookView({ notes, onAdd }: { notes: NotePage[]; onAdd: () => void }) {
  const patchItem = useStore((s) => s.patchItem)
  const removeItem = useStore((s) => s.removeItem)
  const [query, setQuery] = useState('')
  const visible = notes.filter((note) => `${note.title} ${note.body} ${note.tag ?? ''}`.toLowerCase().includes(query.toLowerCase()))
  return (
    <div className="grid gap-4 lg:grid-cols-[18rem_1fr]">
      <Card>
        <CardContent className="space-y-3 p-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search notebook..." className="pl-9" />
          </div>
          <Button className="w-full" onClick={onAdd}><Plus className="size-4" /> New lab note</Button>
          <div className="space-y-2">
            {visible.map((note) => (
              <div key={note.id} className="rounded-xl border bg-muted/15 p-3">
                <Input value={note.title} onChange={(event) => patchItem('notePages', note.id, { title: event.target.value, updatedAt: Date.now() })} className="h-8 border-0 bg-transparent px-0 font-bold" />
                <p className="text-xs font-semibold text-muted-foreground">{note.tag || 'lab'} · {new Date(note.updatedAt).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="space-y-3 p-4">
          {visible[0] ? (
            <>
              <Input value={visible[0].title} onChange={(event) => patchItem('notePages', visible[0].id, { title: event.target.value, updatedAt: Date.now() })} className="border-0 bg-transparent px-0 font-display text-2xl font-extrabold" />
              <Textarea value={visible[0].body} onChange={(event) => patchItem('notePages', visible[0].id, { body: event.target.value, updatedAt: Date.now() })} className="min-h-[24rem]" />
              <div className="flex justify-end"><Button variant="ghost" className="text-destructive hover:text-destructive" onClick={() => removeItem('notePages', visible[0].id)}>Delete note</Button></div>
            </>
          ) : <EmptyState icon={BookOpen} title="No lab notes yet" hint="Create dated notes for experiments, papers, meetings, and next steps." action={<Button onClick={onAdd}><Plus className="size-4" /> New lab note</Button>} />}
        </CardContent>
      </Card>
    </div>
  )
}

function ResearchProgressView({
  rows, driveUrl, onDriveUrl, onAdd, onPatch, onRequestLetter,
}: {
  rows: ExperienceEntry[]
  notes: NotePage[]
  driveUrl: string
  onDriveUrl: (url: string) => void
  onAdd: (patch?: ExperiencePatch) => void
  onPatch: (id: string, patch: ExperiencePatch) => void
  onRequestLetter: (entry: ExperienceEntry) => void
}) {
  const projects = uniqueProjects(rows)
  const [project, setProject] = useState(projects[0] ?? 'General')
  const projectRows = rows.filter((row) => (row.org || 'General') === project)
  const contact = projectRows[0]
  return (
    <div className="space-y-5">
      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
          <div className="flex flex-wrap gap-1 rounded-full bg-muted p-1">
            {(projects.length ? projects : ['General']).map((item) => (
              <button key={item} type="button" onClick={() => setProject(item)} className={cn('rounded-full px-3 py-1.5 text-xs font-extrabold', project === item ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground')}>
                {item}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {contact && <Button variant="outline" onClick={() => onRequestLetter(contact)}><Mail className="size-4" /> PI letter</Button>}
            <Button onClick={() => onAdd({ org: project, role: 'Research milestone' })}><Plus className="size-4" /> Add milestone</Button>
          </div>
        </CardContent>
      </Card>
      <div className="grid gap-3 lg:grid-cols-5">
        {RESEARCH_STAGES.map((stage) => (
          <div key={stage} className="rounded-xl border bg-card p-3">
            <p className="mb-3 text-xs font-extrabold uppercase tracking-wide text-muted-foreground">{stage}</p>
            <div className="space-y-2">
              {projectRows.filter((row) => (row.tags ?? []).includes(stage.toLowerCase()) || row.role.toLowerCase().includes(stage.toLowerCase())).map((row) => (
                <button key={row.id} type="button" onClick={() => onPatch(row.id, { tags: [...new Set([...row.tags, stage.toLowerCase()])] })} className="w-full rounded-lg bg-muted/25 p-2 text-left text-sm font-semibold">
                  {row.description || row.role || 'Milestone'}
                </button>
              ))}
              <button type="button" onClick={() => onAdd({ org: project, role: stage, tags: [stage.toLowerCase()] })} className="w-full rounded-lg border border-dashed border-border p-2 text-xs font-bold text-muted-foreground hover:text-primary">
                Add {stage.toLowerCase()}
              </button>
            </div>
          </div>
        ))}
      </div>
      <Card>
        <CardHeader><CardTitle>Research Drive</CardTitle></CardHeader>
        <CardContent>
          <DocEmbed kind="folder" title="Papers, proposals and slide decks" value={driveUrl} onChange={onDriveUrl} height={360} />
        </CardContent>
      </Card>
    </div>
  )
}

function EventsView({ rows, onAdd, onPatch, onDraftStory }: { rows: ExperienceEntry[]; onAdd: (patch?: ExperiencePatch) => void; onPatch: (id: string, patch: ExperiencePatch) => void; onDraftStory: (entry: ExperienceEntry, theme?: string) => void }) {
  const dated = rows.filter((row) => row.startDate).sort((a, b) => String(a.startDate).localeCompare(String(b.startDate)))
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-3 pb-3">
        <CardTitle className="text-base">One-off service events</CardTitle>
        <Button onClick={() => onAdd({ role: 'Service event', tags: ['event'] })}><Plus className="size-4" /> Add event</Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {dated.length ? dated.map((entry) => (
          <div key={entry.id} className="grid gap-3 rounded-xl border bg-card p-3 md:grid-cols-[9rem_1fr_auto] md:items-center">
            <DateField value={entry.startDate ?? ''} onChange={(startDate) => onPatch(entry.id, { startDate })} />
            <div>
              <Input value={entry.org} onChange={(event) => onPatch(entry.id, { org: event.target.value })} placeholder="Organization or event" className="h-8 border-0 bg-transparent px-0 font-bold" />
              <p className="text-xs font-semibold text-muted-foreground">{entry.hours || 0}h · {(entry.tags ?? []).join(', ') || 'service'}</p>
            </div>
            <Button variant="outline" onClick={() => onDraftStory(entry, 'service')}>Draft the story</Button>
          </div>
        )) : <EmptyState icon={CalendarDays} title="No events yet" hint="Add date-anchored service days here. Ongoing roles stay under Orgs & Hours." />}
      </CardContent>
    </Card>
  )
}

function ThemeRollup({ rows, themes }: { rows: ExperienceEntry[]; themes: string[] }) {
  return (
    <div className="grid gap-2 md:grid-cols-5">
      {themes.map((theme) => {
        const count = rows.filter((row) => textFor(row).toLowerCase().includes(theme.toLowerCase()) || row.tags.includes(theme)).length
        return (
          <div key={theme} className="rounded-xl border bg-card p-3">
            <p className="text-xs font-extrabold uppercase tracking-wide text-muted-foreground">{theme}</p>
            <p className="mt-1 text-lg font-extrabold">{count}</p>
          </div>
        )
      })}
    </div>
  )
}

function ContactCard({ name, role, detail, followUp, onLetter, onTouch }: { name: string; role: string; detail?: string; followUp: string; onLetter: () => void; onTouch: () => void }) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><UserRound className="size-5" /></span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-bold">{name}</p>
          <p className="truncate text-xs font-semibold text-muted-foreground">{role}{detail ? ` · ${detail}` : ''}</p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-bold text-muted-foreground">{followUp}</span>
        <div className="flex gap-1">
          <Button size="sm" variant="outline" onClick={onTouch}>Follow up</Button>
          <Button size="sm" onClick={onLetter}><Mail className="size-4" /> Letter</Button>
        </div>
      </div>
    </div>
  )
}

function Field({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return <label className={cn('space-y-1.5 text-sm font-bold', className)}><span>{label}</span>{children}</label>
}

function buildWeeks(rows: ExperienceEntry[]) {
  const result = Array.from({ length: 7 }, (_, index) => ({ label: `W${index + 1}`, hours: 0 }))
  rows.forEach((row, index) => {
    const bucket = Math.min(result.length - 1, index % result.length)
    result[bucket].hours += Number(row.hours || 0)
  })
  return result
}

function siteSummaries(rows: ExperienceEntry[]) {
  const map = new Map<string, { key: string; org: string; role: string; hours: number; entry: ExperienceEntry }>()
  rows.forEach((entry) => {
    const key = entry.org || entry.id
    const current = map.get(key)
    if (current) current.hours += Number(entry.hours || 0)
    else map.set(key, { key, org: entry.org, role: entry.role, hours: Number(entry.hours || 0), entry })
  })
  return [...map.values()]
}

function buildExperienceEntities(rows: ExperienceEntry[], category: ExperienceCategory): ExperienceEntity[] {
  const grouped = new Map<string, ExperienceEntry[]>()

  rows.forEach((entry) => {
    const key = entityKeyFor(entry, category)
    grouped.set(key, [...(grouped.get(key) ?? []), entry])
  })

  return Array.from(grouped.entries())
    .map(([key, entityRows]) => {
      const sorted = [...entityRows].sort(sortByOrderThenDate)
      const first = sorted[0]
      const latest = sorted.reduce((best, row) => (latestDateValue(row) > latestDateValue(best) ? row : best), first)
      const earliest = sorted.reduce((best, row) => (dateValue(row.startDate) < dateValue(best.startDate) ? row : best), first)
      const totalHours = sorted.reduce((sum, row) => sum + Number(row.hours || 0), 0)
      const status: ExperienceEntry['status'] = sorted.some((row) => row.status === 'active')
        ? 'active'
        : sorted.some((row) => row.status === 'planned')
          ? 'planned'
          : 'completed'

      return {
        key,
        name: entityName(first, category),
        role: first.role || defaultRoleForCategory(category),
        subtitle: dateRangeLabel(sorted),
        rows: sorted,
        totalHours: Math.round(totalHours),
        startDate: earliest.startDate,
        endDate: latest.endDate,
        status,
        contact: latest.contact || first.contact,
        supervisor: latest.supervisor || first.supervisor,
        lastActivityLabel: lastActivityLabelFor(latest),
        stale: daysBetween(latestDateValue(latest), Date.now()) > 45 && status === 'active',
        openLoops: entityOpenLoops(category, sorted),
      }
    })
    .sort((a, b) => b.totalHours - a.totalHours || a.name.localeCompare(b.name))
}

function entityKeyFor(entry: ExperienceEntry, category: ExperienceCategory) {
  const raw = category === 'shadowing'
    ? entry.supervisor || entry.contact || entry.org || entry.role
    : entry.org || entry.supervisor || entry.contact || entry.role
  return raw?.trim().toLowerCase() || `${category}-unassigned`
}

function entityName(entry: ExperienceEntry, category: ExperienceCategory) {
  if (category === 'shadowing') return entry.supervisor || entry.contact || entry.org || entityFallbackName(category)
  return entry.org || entry.supervisor || entry.contact || entityFallbackName(category)
}

function entityFallbackName(category: ExperienceCategory) {
  const labels: Record<ExperienceCategory, string> = {
    clinical: 'New clinical site',
    volunteering: 'New service organization',
    shadowing: 'New physician',
    research: 'New lab or project',
    leadership: 'New organization',
  }
  return labels[category]
}

function defaultRoleForCategory(category: ExperienceCategory) {
  const labels: Record<ExperienceCategory, string> = {
    clinical: 'Clinical role',
    volunteering: 'Volunteer',
    shadowing: 'Observer',
    research: 'Research assistant',
    leadership: 'Member',
  }
  return labels[category]
}

function projectedHoursFor(rows: ExperienceEntry[]) {
  const total = rows.reduce((sum, row) => sum + Number(row.hours || 0), 0)
  const dated = rows.map((row) => latestDateValue(row)).filter(Boolean)
  if (dated.length < 2) return total

  const oldest = Math.min(...dated)
  const newest = Math.max(...dated)
  const weeks = Math.max(1, daysBetween(oldest, newest) / 7)
  const weeklyPace = total / weeks
  return Math.round(total + weeklyPace * 48)
}

function categoryNoun(category: ExperienceCategory, plural = false) {
  const labels: Record<ExperienceCategory, [string, string]> = {
    clinical: ['site', 'sites'],
    volunteering: ['service org', 'service orgs'],
    shadowing: ['physician', 'physicians'],
    research: ['project', 'projects'],
    leadership: ['organization', 'organizations'],
  }
  return labels[category][plural ? 1 : 0]
}

function categoryCatalogTitle(category: ExperienceCategory) {
  const labels: Record<ExperienceCategory, string> = {
    clinical: 'Clinical sites',
    volunteering: 'Service organizations',
    shadowing: 'Physicians shadowed',
    research: 'Labs and projects',
    leadership: 'Organizations',
  }
  return labels[category]
}

function categoryAccent(category: ExperienceCategory) {
  const classes: Record<ExperienceCategory, string> = {
    clinical: 'bg-sky-500/12',
    volunteering: 'bg-emerald-500/12',
    shadowing: 'bg-violet-500/12',
    research: 'bg-amber-500/12',
    leadership: 'bg-rose-500/12',
  }
  return classes[category]
}

function categoryIcon(category: ExperienceCategory) {
  const className = 'size-5'
  if (category === 'clinical') return <Stethoscope className={className} />
  if (category === 'volunteering') return <Users className={className} />
  if (category === 'shadowing') return <UserRound className={className} />
  if (category === 'research') return <BookOpen className={className} />
  return <Network className={className} />
}

function statusTone(status: ExperienceEntry['status']) {
  if (status === 'active') return 'bg-emerald-500/12 text-emerald-200'
  if (status === 'planned') return 'bg-sky-500/12 text-sky-200'
  return 'bg-muted text-muted-foreground'
}

function coverageForCategory(category: ExperienceCategory, rows: ExperienceEntry[]): { title: string; detail: string; tone: 'neutral' | 'warn' | 'good' } {
  const text = rows.map(textFor).join(' ').toLowerCase()
  if (!rows.length) return { title: 'No signal yet', detail: 'Start with one real entry so Premed OS can detect gaps.', tone: 'neutral' }

  if (category === 'clinical') {
    const primaryCare = /primary care|family medicine|internal medicine|pediatrics/.test(text)
    const emergency = /emergency|ed|er|ems/.test(text)
    if (!primaryCare) return { title: 'Coverage is narrow', detail: 'Strong exposure can still look narrow without primary care.', tone: 'warn' }
    if (emergency) return { title: 'Balanced clinical exposure', detail: 'Clinical story has both continuity and acute-care exposure.', tone: 'good' }
    return { title: 'Primary care covered', detail: 'Primary-care exposure is covered; add acute-care contrast if possible.', tone: 'neutral' }
  }

  if (category === 'volunteering') {
    const matched = SERVICE_THEMES.filter((theme) => text.includes(theme.toLowerCase()))
    return {
      title: matched.length ? 'Service theme visible' : 'Service purpose unclear',
      detail: matched.length ? `Service theme detected: ${matched.slice(0, 2).join(', ')}.` : 'Clarify the community need, not just the hours.',
      tone: matched.length ? 'good' : 'warn',
    }
  }

  if (category === 'shadowing') {
    const matched = SHADOW_SPECIALTIES.filter((specialty) => specialty !== 'All' && text.includes(specialty.toLowerCase()))
    return {
      title: matched.length >= 2 ? 'Specialty breadth visible' : 'Specialty gaps remain',
      detail: matched.length ? `Specialties represented: ${matched.join(', ')}.` : 'Specialty coverage is not clear yet.',
      tone: matched.length >= 2 ? 'good' : 'warn',
    }
  }

  if (category === 'research') {
    const hasOutput = /poster|abstract|presentation|publication|manuscript|conference/.test(text)
    return {
      title: hasOutput ? 'Output signal present' : 'Output gap',
      detail: hasOutput ? 'Research output is visible; keep linking artifacts.' : 'The next missing signal is an output: poster, abstract, or manuscript.',
      tone: hasOutput ? 'good' : 'warn',
    }
  }

  const leadership = rows.some((row) => /leader|president|chair|captain|officer|founder|director/.test(textFor(row).toLowerCase()))
  return {
    title: leadership ? 'Leadership signal present' : 'Leadership proof missing',
    detail: leadership ? 'Leadership evidence is present; capture decisions and outcomes.' : 'A role alone is not leadership yet; document what changed because of you.',
    tone: leadership ? 'good' : 'warn',
  }
}

function categorySpecificInsight(category: ExperienceCategory, entity: ExperienceEntity) {
  if (entity.openLoops.length) {
    return { title: 'Open loop', detail: entity.openLoops[0] }
  }
  if (category === 'clinical') return { title: 'Clinical read', detail: `${entity.name} can anchor patient-contact stories if reflections stay current.` }
  if (category === 'volunteering') return { title: 'Service read', detail: `${entity.name} shows continuity when entries include the community need and follow-through.` }
  if (category === 'shadowing') return { title: 'Specialty read', detail: `${entity.name} is useful when you log one clinical decision or workflow insight per visit.` }
  if (category === 'research') return { title: 'Research read', detail: `${entity.name} becomes stronger when outputs and mentor relationship are linked.` }
  return { title: 'Leadership read', detail: `${entity.name} should show responsibility, initiative, and a measurable change.` }
}

function latestDateValue(entry: ExperienceEntry) {
  return Math.max(dateValue(entry.endDate), dateValue(entry.startDate), 0)
}

function dateValue(value?: string) {
  if (!value) return 0
  const parsed = new Date(`${value}T12:00:00`).getTime()
  return Number.isNaN(parsed) ? 0 : parsed
}

function daysBetween(start: number, end: number) {
  if (!start || !end) return 999
  return Math.max(0, Math.round((end - start) / 86_400_000))
}

function lastActivityLabelFor(entry: ExperienceEntry) {
  const value = latestDateValue(entry)
  if (!value) return 'No date'
  const days = daysBetween(value, Date.now())
  if (days === 0) return 'Today'
  if (days < 31) return `${days}d ago`
  if (days < 370) return `${Math.round(days / 30)}mo ago`
  return `${Math.round(days / 365)}y ago`
}

function dateRangeLabel(rows: ExperienceEntry[]) {
  const starts = rows.map((row) => dateValue(row.startDate)).filter(Boolean)
  const ends = rows.map((row) => dateValue(row.endDate) || dateValue(row.startDate)).filter(Boolean)
  if (!starts.length && !ends.length) return `${rows.length} ${rows.length === 1 ? 'entry' : 'entries'}`
  const first = starts.length ? formatDate(new Date(Math.min(...starts)).toISOString().slice(0, 10)) : 'No start'
  const last = ends.length ? formatDate(new Date(Math.max(...ends)).toISOString().slice(0, 10)) : 'present'
  return `${first} – ${last}`
}

function entityOpenLoops(category: ExperienceCategory, rows: ExperienceEntry[]) {
  const loops: string[] = []
  const text = rows.map(textFor).join(' ').toLowerCase()
  const latest = rows.reduce((best, row) => (latestDateValue(row) > latestDateValue(best) ? row : best), rows[0])

  if (!rows.some((row) => row.contact || row.supervisor)) loops.push('Add a verifier or relationship contact.')
  if (!rows.some((row) => row.mostMeaningful?.trim() || row.description?.trim())) loops.push('Capture at least one interview-ready reflection.')
  if (latest && daysBetween(latestDateValue(latest), Date.now()) > 45) loops.push('Log a recent touchpoint so this does not look neglected.')
  if (category === 'research' && !/poster|abstract|presentation|publication|manuscript/.test(text)) loops.push('Link a research output or next output milestone.')
  if (category === 'clinical' && !/primary care|family medicine|internal medicine|pediatrics/.test(text)) loops.push('Add or label primary-care exposure if you have it.')
  if (category === 'shadowing' && rows.length < 2) loops.push('Add another visit or specialty contrast.')
  if (category === 'leadership' && !/leader|president|chair|captain|officer|founder|director/.test(text)) loops.push('Document the decision, initiative, or outcome that proves leadership.')

  return loops.slice(0, 3)
}

function uniqueContacts(rows: ExperienceEntry[]) {
  const seen = new Set<string>()
  return rows.filter((entry) => {
    const key = entry.supervisor || entry.contact || entry.org
    if (!key || seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function uniqueProjects(rows: ExperienceEntry[]) {
  return [...new Set(rows.map((row) => row.org || 'General'))].filter(Boolean)
}

function sortByOrderThenDate(a: ExperienceEntry, b: ExperienceEntry) {
  return (a.order ?? 0) - (b.order ?? 0) || String(b.startDate ?? '').localeCompare(String(a.startDate ?? ''))
}

function formatDate(value?: string) {
  if (!value) return 'No date'
  const date = new Date(`${value}T12:00:00`)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function textFor(entry: ExperienceEntry) {
  return `${entry.org} ${entry.role} ${entry.description} ${entry.mostMeaningful ?? ''} ${(entry.tags ?? []).join(' ')}`
}

// Kept temporarily while the approved pillar workspaces replace the former generic renderer.
// Referencing these components prevents the transition path from breaking local data utilities.
void [
  PillarInsightStrip,
  ExperienceEntityCatalog,
  ExperienceEntityWorkspace,
  PillarTabStrip,
  HoursAndSitesView,
  SkillsView,
  ShadowingSessionsView,
  PhysiciansView,
  LabNotebookView,
  ResearchProgressView,
  EventsView,
]
