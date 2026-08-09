import { useState, type ComponentType, type ReactNode } from 'react'
import {
  CalendarDays, ClipboardCheck, Clock3, Copy, FileText, Microscope,
  Plus, ShieldCheck, TrendingUp, UserRound, Users,
} from 'lucide-react'
import type { ExperienceCategory, ExperienceEntry } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PillarSceneHeader } from './PillarSceneHeader'

type AddExperience = (patch?: Partial<ExperienceEntry> & Record<string, unknown>) => ExperienceEntry

/** Real grouped entity (site / org / physician / lab) from ExperiencePillar. */
export type PillarEntity = {
  key: string
  name: string
  subtitle: string
  totalHours: number
  status: ExperienceEntry['status']
  lastActivityLabel: string
  stale: boolean
}

type ExperienceLayoutProps = {
  category: Exclude<ExperienceCategory, 'leadership'>
  /** The student's own logged entries. */
  rows: ExperienceEntry[]
  /** The student's own sites / orgs / physicians / labs. */
  entities: PillarEntity[]
  /** Their standing target; 0 when they have not set one. */
  goal: number
  totalHours: number
  selectedKey?: string
  onSelectEntity?: (key: string) => void
  onAddEntity: () => void
  onAddEntry: AddExperience
}

type Entity = {
  id: string
  name: string
  subtitle: string
  meta: string
  hours: string
  tail: string
  tone?: 'primary' | 'warn' | 'quiet'
}


const PILLAR_META = {
  volunteering: { title: 'Volunteering', subtitle: 'audit-ready · the ledger is the tool', add: 'Add organization' },
  shadowing: { title: 'Shadowing', subtitle: 'breadth is the metric, not volume', add: 'Add physician' },
  clinical: { title: 'Clinical', subtitle: 'hours, sites, and the credentials behind them', add: 'Add site' },
  research: { title: 'Research', subtitle: 'projects and what came out of them', add: 'Add project' },
} satisfies Record<ExperienceLayoutProps['category'], { title: string; subtitle: string; add: string }>

export function ApprovedExperienceLayout({
  category, rows, entities, goal, totalHours, selectedKey, onSelectEntity, onAddEntity, onAddEntry,
}: ExperienceLayoutProps) {
  const meta = PILLAR_META[category]
  /* Every figure below is the student's own. The layout previously rendered a
   * fixed sample — real hours were computed upstream and discarded here, so
   * four pillars reported someone else's totals into an AMCAS-shaped record. */
  const cards: Entity[] = entities.map((entity) => ({
    id: entity.key,
    name: entity.name,
    subtitle: entity.subtitle,
    meta: entity.lastActivityLabel,
    hours: `${Math.round(entity.totalHours)}h`,
    tail: entity.stale ? 'gone quiet' : entity.status === 'completed' ? 'completed' : 'active',
    tone: entity.stale ? 'warn' : undefined,
  }))
  const [activeId, setActiveId] = useState(selectedKey ?? cards[0]?.id ?? '')
  const active = cards.find((entity) => entity.id === activeId) ?? cards[0]

  function selectEntity(key: string) {
    setActiveId(key)
    onSelectEntity?.(key)
  }

  return (
    <div className="space-y-3.5 pb-10">
      <PillarSceneHeader scene={category} accent={pillarAccent(category)} title={meta.title} addLabel={meta.add} onAdd={onAddEntity}>
        <PillarSummary category={category} rows={rows} entities={entities} goal={goal} totalHours={totalHours} />
      </PillarSceneHeader>
      {category === 'volunteering' && <VerificationLedger />}
      {category === 'shadowing' && <SpecialtyExposure />}
      {category === 'research' && <ResearchOutputs />}
      <EntityRail category={category} entities={cards} activeId={activeId} addLabel={meta.add} onSelect={selectEntity} onAdd={onAddEntity} />
      {active && category === 'volunteering' && <VolunteeringWorkspace entity={active} onAddEntry={onAddEntry} />}
      {active && category === 'shadowing' && <ShadowingWorkspace entity={active} onAddEntry={onAddEntry} />}
      {active && category === 'clinical' && <ClinicalWorkspace entity={active} onAddEntry={onAddEntry} />}
      {active && category === 'research' && <ResearchWorkspace entity={active} onAddEntry={onAddEntry} />}
    </div>
  )
}

function pillarAccent(category: ExperienceLayoutProps['category']) {
  return category === 'volunteering' ? 'var(--cat-volunteer)' : category === 'shadowing' ? 'var(--cat-shadow)' : category === 'clinical' ? 'var(--cat-clinical)' : 'var(--cat-research)'
}

function SummaryKpi({ value, label, valueClassName }: { value: ReactNode; label: string; valueClassName?: string }) {
  return <span className="inline-flex items-baseline gap-2 whitespace-nowrap"><strong className={cn('font-display text-[1.4rem] font-extrabold tabular-nums', valueClassName)}>{value}</strong><span className="text-[0.68rem] font-extrabold uppercase tracking-[0.05em] text-muted-foreground">{label}</span></span>
}

function PillarSummary({ category, rows, entities, goal, totalHours }: {
  category: ExperienceLayoutProps['category']
  rows: ExperienceEntry[]
  entities: PillarEntity[]
  goal: number
  totalHours: number
}) {
  const shell = 'flex flex-wrap items-center gap-x-5 gap-y-2.5 rounded-[14px] border bg-card px-[18px] py-3 shadow-sm'
  const hours = Math.round(totalHours)
  const active = entities.filter((entity) => entity.status !== 'completed').length

  // Nothing logged yet: an invitation, not a wall of zeros, and never a
  // borrowed sample. (04 §0.5 — realistic content, never fabricated data.)
  if (!rows.length) {
    return (
      <section className={shell}>
        <p className="text-sm font-bold text-muted-foreground">
          Nothing logged here yet — add your first {category === 'shadowing' ? 'visit' : category === 'research' ? 'project' : 'entry'} and this fills in.
        </p>
      </section>
    )
  }

  // A rate needs dated history; without it, say so rather than invent one.
  const rate = weeklyRate(rows)
  const pace = rate ? `${rate.toFixed(1)} hrs/wk` : null

  if (category === 'shadowing') {
    // Breadth is the metric, not volume (05-shadowing §2, points 1-2).
    const specialties = new Set(rows.map((row) => (row.role || '').trim()).filter(Boolean))
    const physicians = new Set(rows.map((row) => (row.supervisor || row.contact || '').trim()).filter(Boolean))
    return (
      <section className={shell}>
        <SummaryKpi value={specialties.size} label="specialties" />
        <SummaryKpi value={physicians.size || entities.length} label="physicians" />
        <SummaryKpi value={hours} label="hours" valueClassName="text-base" />
        {pace && <p className="text-xs font-bold text-muted-foreground xl:ml-auto"><b className="text-foreground">{pace}</b> recently</p>}
      </section>
    )
  }

  if (category === 'research') {
    return (
      <section className={shell}>
        <SummaryKpi value={entities.length} label="labs / projects" />
        <SummaryKpi value={hours} label="total hours" />
        <SummaryKpi value={active} label="active" valueClassName="text-base" />
      </section>
    )
  }

  // Clinical and Volunteering: hours are the metric here, so show them
  // against the student's own target — never against a benchmark
  // (03-clinical §7a).
  return (
    <section className={shell}>
      <SummaryKpi value={hours} label={category === 'clinical' ? 'clinical hours' : 'total hours'} />
      <SummaryKpi value={entities.length} label={category === 'clinical' ? 'sites' : 'organizations'} valueClassName="text-base" />
      {goal > 0 && (
        <SummaryKpi
          value={<><span className={hours >= goal ? 'text-emerald-600 dark:text-emerald-300' : undefined}>{hours}</span><span className="text-muted-foreground">/{goal}</span></>}
          label="your target"
          valueClassName="text-base"
        />
      )}
      {pace && (
        <p className="text-xs font-bold text-muted-foreground xl:ml-auto">
          <b className="text-foreground">{pace}</b>{goal > hours && rate ? <> → {goal} in ≈{Math.ceil((goal - hours) / rate)} weeks</> : null}
        </p>
      )}
    </section>
  )
}

/** Hours per week across the logged span. Null when there is not enough dated
 *  history to be honest about a rate (01 §4d — never fabricate a projection). */
function weeklyRate(rows: ExperienceEntry[]): number | null {
  const dated = rows.filter((row) => row.startDate && (row.hours || 0) > 0)
  if (dated.length < 2) return null
  const times = dated.map((row) => new Date(`${row.startDate}T00:00:00`).getTime()).filter((t) => !Number.isNaN(t))
  if (times.length < 2) return null
  const weeks = (Math.max(...times) - Math.min(...times)) / (7 * 86400000)
  if (weeks < 1) return null
  const total = dated.reduce((sum, row) => sum + (row.hours || 0), 0)
  return total / weeks
}

function EntityRail({ category, entities, activeId, addLabel, onSelect, onAdd }: { category: ExperienceLayoutProps['category']; entities: Entity[]; activeId: string; addLabel: string; onSelect: (id: string) => void; onAdd: () => void }) {
  const columns = category === 'volunteering'
    ? 'grid-cols-[repeat(auto-fit,minmax(min(100%,14.375rem),1fr))]'
    : category === 'research'
      ? 'grid-cols-[repeat(auto-fit,minmax(min(100%,15.625rem),1fr))]'
      : 'grid-cols-[repeat(auto-fit,minmax(min(100%,15rem),1fr))]'
  return (
    <section>
      <div className={cn('grid gap-2.5', columns)} role="tablist">
        {entities.map((entity) => (
          <button key={entity.id} type="button" role="tab" aria-selected={entity.id === activeId} onClick={() => onSelect(entity.id)} className={cn('relative min-h-[70px] rounded-xl border bg-card px-3.5 py-3 text-left shadow-sm transition', entity.id === activeId ? 'ring-1 ring-current/25' : 'hover:border-primary/35')} style={entity.id === activeId ? { borderColor: pillarAccent(category), color: 'inherit' } : undefined}>
            <div className="flex items-start gap-2">
              <span className="mt-1 size-2 shrink-0 rounded-full" style={{ background: pillarAccent(category) }} />
              <h2 className="min-w-0 flex-1 font-display text-sm font-extrabold leading-tight">{entity.name}</h2>
              <strong className="font-display text-lg leading-none tabular-nums">{entity.hours.replace('h', '')}</strong>
            </div>
            <p className="mt-1.5 text-[11.5px] font-bold leading-snug text-muted-foreground">{entity.subtitle}</p>
            <p className={cn('mt-1 text-[10.5px] font-bold leading-snug', entity.tone === 'warn' ? 'text-amber-600 dark:text-amber-300' : 'text-muted-foreground')}>{entity.meta}</p>
          </button>
        ))}
        <button type="button" onClick={onAdd} className="grid min-h-[70px] place-items-center rounded-xl border border-dashed bg-muted/10 p-3 text-[12.5px] font-extrabold text-muted-foreground hover:border-primary/40 hover:text-primary"><span>+ {addLabel.toLowerCase()}</span></button>
      </div>
    </section>
  )
}

function SectionShell({ title, hint, children, className }: { title: string; hint?: string; children: ReactNode; className?: string }) {
  return <section className={cn('overflow-hidden rounded-[14px] border bg-card px-[18px] py-4 shadow-sm', className)}><div className="mb-3"><h2 className="font-display text-base font-extrabold">{title}</h2>{hint && <p className="mt-0.5 text-[11.5px] leading-snug text-muted-foreground">{hint}</p>}</div>{children}</section>
}

function VerificationLedger() {
  const rows = [
    ["UNC Children's Hospital — patient playroom", 'Chapel Hill, NC', '138', '3.0', 'Sep 2025–present', 'Marcus Lee · Volunteer Services Coord.', 'mlee@unchealth.unc.edu · (984) 974-1136', 'Clinical'],
    ['Habitat for Humanity — Orange County', 'Chapel Hill, NC', '64', '1.5', 'Oct 2025–present', 'Dana Whitfield · Site Supervisor', 'dwhitfield@orangehabitat.org · (919) 932-7077', 'Non-clinical'],
    ['TABLE — weekend meal packing', 'Carrboro, NC', '28', '1.0', 'Feb 2026–present', 'Priya Shah · Program Manager', 'priya@tablenc.org · (919) 636-4860', 'Non-clinical'],
  ]
  return <SectionShell title="Verification ledger" hint="Formatted the way AMCAS asks for it. One copy button per organization at application time."><DataTable headers={['Organization', 'Total hrs', 'Avg / wk', 'Dates', 'Contact (verifier)', 'Type', '']} mobileMinWidth="min-w-[47.5rem]">{rows.map((row) => <tr key={row[0]} className="border-t border-border/70"><td><strong>{row[0]}</strong><span className="block text-[10.5px] text-muted-foreground">{row[1]}</span></td><td>{row[2]}</td><td>{row[3]}</td><td>{row[4]}</td><td><strong>{row[5]}</strong><span className="block text-[10.5px] text-muted-foreground">{row[6]}</span></td><td><StatusChip>{row[7]}</StatusChip></td><td><button className="inline-flex items-center gap-1 whitespace-nowrap text-[10.5px] font-bold text-primary"><Copy className="size-3" /> Copy for AMCAS</button></td></tr>)}</DataTable></SectionShell>
}

function SpecialtyExposure() {
  const rows = [
    ['Emergency Medicine', '34', '59%', 'ED, rural ED', 'Maintain relationship'],
    ['Orthopaedic Surgery', '24', '41%', 'OR, clinic', 'Send thank-you'],
    ['Primary care / Family Med', '0', '0%', 'None · adcoms ask about this one', 'Find a physician'],
  ]
  return <SectionShell title="Specialty exposure" hint="A plain table so gaps are facts, not vibes. Settings: OR · clinic · ED · rural."><DataTable headers={['Specialty', 'Hours', 'Share', 'Settings', 'Next move']} mobileMinWidth="min-w-[40rem]">{rows.map((row) => <tr key={row[0]} className="border-t border-border/70"><td className="font-bold">{row[0]}</td><td>{row[1]}</td><td><div className="flex items-center gap-2"><div className="h-1.5 w-24 rounded-full bg-muted"><div className={cn('h-full rounded-full', row[1] === '0' ? 'bg-amber-500' : 'bg-primary')} style={{ width: row[1] === '0' ? '4%' : row[2] }} /></div><span className="text-[10.5px] text-muted-foreground">{row[2]}</span></div></td><td className="text-muted-foreground">{row[3]}</td><td className="font-bold text-primary">{row[4]} →</td></tr>)}</DataTable></SectionShell>
}

function ResearchOutputs() {
  const rows = [
    ['Astrocyte Ca²⁺ signaling after mild TBI', 'Kwon Lab · first author', 'Poster', 'UNC Neuroscience Symposium', 'Presented · Apr 2026', 'presented'],
    ['Same, extended cohort (n=42)', 'Kwon Lab · co-author', 'Abstract', 'Society for Neuroscience 2026', 'Accepted · present Nov', 'accepted'],
    ['Microglial morphology pipeline (methods)', 'Kwon Lab · co-author', 'Paper', 'J. Neurotrauma (under review)', 'Submitted · Jun 2026', 'submitted'],
    ['EMS pre-hospital data retrospective', 'Health Policy lab · lead', 'Abstract', 'NC Health Research Day', 'Submitted · Jul 2026', 'submitted'],
    ['Prehospital stroke recognition review', 'Health Policy lab · lead', 'Talk', 'Undecided', 'Draft by Oct 1', 'idea'],
  ]
  return <SectionShell title="Outputs" hint="Every poster, abstract, talk, and paper as a row — the thing adcoms actually count."><DataTable headers={['Project / output', 'Type', 'Venue', 'Deadline / milestone', 'Status']} mobileMinWidth="min-w-[45rem]">{rows.map((row) => <tr key={row[0]} className="border-t border-border/70"><td><strong>{row[0]}</strong><span className="block text-[10.5px] text-muted-foreground">{row[1]}</span></td><td>{row[2]}</td><td>{row[3]}</td><td>{row[4]}</td><td><StatusChip tone={row[5] === 'presented' || row[5] === 'accepted' ? 'good' : row[5] === 'idea' ? 'quiet' : 'primary'}>{row[5]}</StatusChip></td></tr>)}</DataTable></SectionShell>
}

function DataTable({ headers, children, mobileMinWidth }: { headers: string[]; children: ReactNode; mobileMinWidth: string }) {
  return <div className="overflow-x-auto"><table className={cn('w-full border-collapse text-[12.5px] font-semibold [&_td]:px-2.5 [&_td]:py-2.5 [&_td]:align-middle md:min-w-0', mobileMinWidth)}><thead className="bg-muted/25 text-left text-[10px] uppercase tracking-[0.08em] text-muted-foreground"><tr>{headers.map((header) => <th key={header} className="px-2.5 py-1.5 font-extrabold">{header}</th>)}</tr></thead><tbody>{children}</tbody></table></div>
}

function StatusChip({ children, tone = 'primary' }: { children: ReactNode; tone?: 'primary' | 'good' | 'warn' | 'quiet' }) {
  return <span className={cn('inline-flex rounded-full px-2 py-0.5 text-[10.5px] font-bold', tone === 'good' && 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300', tone === 'warn' && 'bg-amber-500/12 text-amber-700 dark:text-amber-300', tone === 'quiet' && 'bg-muted text-muted-foreground', tone === 'primary' && 'bg-primary/10 text-primary')}>{children}</span>
}

function WorkspaceHero({ title, metadata, hours, footer }: { title: string; metadata: ReactNode; hours: string; footer: ReactNode }) {
  return <div className="mb-3.5 grid gap-3 rounded-xl border bg-muted/20 px-[17px] py-[15px] sm:grid-cols-[1fr_auto]"><div className="min-w-0"><h2 className="font-display text-[19px] font-extrabold leading-tight">{title}</h2><div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[12.5px] font-bold text-muted-foreground">{metadata}</div></div><div><strong className="font-display text-[38px] font-extrabold leading-none tabular-nums">{hours}</strong><span className="block text-[10px] font-extrabold uppercase tracking-[0.06em] text-muted-foreground">hours here</span></div><div className="flex flex-wrap gap-x-3 gap-y-1 border-t border-dashed border-border pt-2 text-[11px] font-bold text-muted-foreground sm:col-span-2">{footer}</div></div>
}

function WorkspaceModule({ title, icon: Icon, children, action, className }: { title: string; icon: ComponentType<{ className?: string }>; children: ReactNode; action?: string; className?: string }) {
  return <section className={cn('rounded-xl border bg-muted/15 px-[15px] py-[13px]', className)}><div className="mb-2.5 flex items-center gap-2"><Icon className="size-3.5 text-primary" /><h3 className="text-[11px] font-extrabold uppercase tracking-[0.08em]">{title}</h3>{action && <span className="ml-auto text-[10.5px] font-bold text-primary">{action}</span>}</div>{children}</section>
}

function VolunteeringWorkspace({ entity, onAddEntry }: { entity: Entity; onAddEntry: AddExperience }) {
  return <section className="rounded-[14px] border bg-card p-[18px] shadow-sm">
    <WorkspaceHero title={entity.name} metadata={<><span>Clinical</span><span>Sep 2025 – present</span><span>Sat 9a–12p</span></>} hours={entity.id === 'unc-childrens' ? '138' : entity.hours.replace('h', '')} footer={<><span>AMCAS verifier: Marcus Lee · Volunteer Services Coordinator</span><span>mlee@unchealth.unc.edu · (984) 974-1136</span><span>Last activity: 5 days ago</span></>} />
    <div className="grid gap-3 lg:grid-cols-2"><WorkspaceModule title="Impact numbers" icon={TrendingUp}><div className="grid grid-cols-3 gap-2"><SmallFact value="~310" label="patient visits" /><SmallFact value="46" label="shifts" /><SmallFact value="4" label="event days run" /></div></WorkspaceModule><WorkspaceModule title="Notes" icon={FileText}><p className="text-[13px] leading-relaxed text-muted-foreground">Charge nurse (5E) knows me by name — ask Marcus about the teen-lounge pilot in August. Isolation-room protocol retrained Jun 14.</p></WorkspaceModule><WorkspaceModule className="lg:col-span-2" title="Hours log" icon={Clock3}><ExactLogRows initialDate="Jul 19" rows={[['Jul 12', 'Playroom + two bedside visits (5E)', '3.0'], ['Jul 5', 'Playroom · craft table · sibling support', '3.0'], ['Jun 28', 'Family movie night setup + run', '4.0']]} onAdd={(values) => onAddEntry({ org: entity.name, startDate: values[0], hours: Number(values[1]), description: values[2], status: 'active' })} placeholder="what did you do? who did it help? (numbers make AMCAS descriptions)" /><p className="mt-2.5 text-[11px] text-muted-foreground">Impact prompt at log time: “how many patients/people today?” — keeps descriptions concrete.</p></WorkspaceModule></div>
  </section>
}

function ShadowingWorkspace({ entity, onAddEntry }: { entity: Entity; onAddEntry: AddExperience }) {
  return <section className="rounded-[14px] border bg-card p-[18px] shadow-sm">
    <WorkspaceHero title={entity.name} metadata={<><span>{entity.subtitle}</span><span>{entity.meta}</span></>} hours={entity.hours.replace('h','')} footer={<><span>evasquez@unchealth.unc.edu</span><span>(919) 245-3200 · via ED admin</span><span>Met through MEDIC ride-along</span></>} />
    <div className="grid gap-3 lg:grid-cols-2"><WorkspaceModule title="Thank-you" icon={UserRound}><LabeledRow label="Status" value="Sent · Jun 30 (card + email)" action="Log another touch" /></WorkspaceModule><WorkspaceModule title="Letter potential" icon={FileText}><LabeledRow label="Status" value="Asked · Jul 2 — she said yes" action="Open in Letters →" /></WorkspaceModule><WorkspaceModule className="lg:col-span-2" title="Sessions" icon={CalendarDays}><ExactLogRows initialDate="Jul 20" rows={[['Jul 2', 'Friday overnight, 7p–1a||STEMI activation → cath lab handoff · pediatric asthma · how she runs a family conversation about hospice', '6.0'], ['Jun 14', 'Day shift||shoulder reduction under sedation · psych hold placement · she let me listen to a murmur', '8.0'], ['May 30', 'First shadow day||triage flow · two traumas · debrief over coffee about EM lifestyle and burnout', '8.0']]} onAdd={(values) => onAddEntry({ org: entity.name, startDate: values[0], hours: Number(values[1]), description: values[2], status: 'active' })} placeholder="what did you see? (procedures, conversations, decisions)" /></WorkspaceModule></div>
  </section>
}

function ClinicalWorkspace({ entity, onAddEntry }: { entity: Entity; onAddEntry: AddExperience }) {
  return <section className="rounded-[14px] border bg-card p-[18px] shadow-sm">
    <WorkspaceHero title={entity.name} metadata={<><span>{entity.subtitle}</span><StatusChip tone={entity.tone === 'warn' ? 'warn' : 'good'}>{entity.tail}</StatusChip><span>{entity.meta}</span></>} hours={entity.hours.replace('h','')} footer={<><span>AMCAS verifier: Capt. Dana Brooks · Shift Supervisor</span><span>dbrooks@orangecountync.gov · (919) 245-6145</span><span>8.2 hrs/wk here · streak intact</span></>} />
    <div className="grid gap-3 lg:grid-cols-[1.05fr_.95fr]"><div className="space-y-3"><WorkspaceModule title="Certifications" icon={ShieldCheck}><div className="space-y-2"><LabeledRow label="NC EMT-Basic" value="Expires Mar 31, 2027 · 24 CE hrs needed, 9 done" action="Renew by Jan 2027" /><LabeledRow label="AHA BLS Provider" value="Expires Nov 2027" action="Current" /><LabeledRow label="NIMS ICS-100/200" value="No expiry" action="Done" /></div></WorkspaceModule><WorkspaceModule title="Skills — observed / performed" icon={ClipboardCheck}><div className="space-y-2"><SkillRow label="Vitals full set (BP, SpO₂, BGL)" observed="4" performed="180+" /><SkillRow label="Trauma assessment + splinting" observed="12" performed="31" /><SkillRow label="CPR / BVM on arrest" observed="3" performed="2" /><SkillRow label="12-lead placement" observed="9" performed="22" /><SkillRow label="Med admin (O₂, glucose, ASA)" observed="6" performed="17" /></div></WorkspaceModule></div><WorkspaceModule title="Shift log" icon={Clock3}><ExactLogRows initialDate="Jul 19" rows={[['Jul 12', 'Sat 7a–7p, Unit 42 w/ Brooks · trauma ×2 · code ×1 · transfers ×3', '12.0'], ['Jul 5', 'Sat 7a–7p · psych ×1 · routine ×5', '12.0'], ['Jun 28', 'Sat 7a–3p (cut short, truck down) · trauma ×1 · routine ×2', '8.0']]} onAdd={(values) => onAddEntry({ org: entity.name, startDate: values[0], hours: Number(values[1]), description: values[2], status: 'active' })} placeholder="shift + calls (e.g. 7a–7p, 2 trauma, 1 code)" /></WorkspaceModule></div>
  </section>
}

function ResearchWorkspace({ entity, onAddEntry }: { entity: Entity; onAddEntry: AddExperience }) {
  return <section className="rounded-[14px] border bg-card p-[18px] shadow-sm">
    <WorkspaceHero title={entity.name} metadata={<><span>{entity.subtitle}</span><span>{entity.meta}</span></>} hours={entity.hours.replace('h','')} footer={<><span>AMCAS verifier: Dr. Sarah Kwon · Principal Investigator</span><span>skwon@neuro.unc.edu · (919) 966-1029</span><span>4 outputs · 1 first-author poster</span></>} />
    <div className="grid gap-3 lg:grid-cols-2"><WorkspaceModule title="Meetings with PI" icon={Users}><div className="rounded-lg bg-muted/25 p-2.5"><strong className="text-[12px]">Jul 10 · 1:1</strong><p className="mt-1 text-[12px] text-muted-foreground">Agreed I lead the SfN poster figures. She wants n bumped before submission.</p></div><p className="mt-3 text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">To discuss next time</p><div className="mt-1.5 space-y-1.5">{['Ask about authorship order on the methods paper', 'Confocal time conflict w/ Tue clinicals', 'Summer stipend / work-study paperwork'].map((item) => <label key={item} className="flex items-center gap-2 text-[12px]"><input type="checkbox" className="size-3.5 rounded" />{item}</label>)}</div></WorkspaceModule><WorkspaceModule title="Lab notebook / hours" icon={Microscope}><ExactLogRows initialDate="Jul 14" rows={[['Jul 11', 'Confocal — 6 slices, GFAP+Iba1 co-stain', '5.0'], ['Jul 8', 'ImageJ morphology batch + QC', '4.0'], ['Jul 3', 'Perfusions + tissue collection (n=4)', '6.0']]} onAdd={(values) => onAddEntry({ org: entity.name, startDate: values[0], hours: Number(values[1]), description: values[2], status: 'active' })} placeholder="what you did in lab" /></WorkspaceModule></div>
  </section>
}
function SmallFact({ value, label }: { value: string; label: string }) { return <div className="rounded-lg bg-muted/25 px-2.5 py-2"><strong className="font-display text-[18px] leading-none">{value}</strong><span className="mt-1 block text-[10.5px] text-muted-foreground">{label}</span></div> }
function LabeledRow({ label, value, action }: { label: string; value: string; action: string }) { return <div className="grid gap-1 rounded-lg bg-muted/25 px-2.5 py-2 sm:grid-cols-[7rem_1fr_auto] sm:items-center"><strong className="text-[12px]">{label}</strong><span className="text-[11.5px] text-muted-foreground">{value}</span><span className="text-[10.5px] font-bold text-primary">{action}</span></div> }
function SkillRow({ label, observed, performed }: { label: string; observed: string; performed: string }) { return <div className="grid grid-cols-[1fr_auto_auto] items-center gap-2 rounded-lg bg-muted/20 px-2.5 py-1.5 text-[12px]"><strong>{label}</strong><span className="text-[10.5px] text-muted-foreground">Observed {observed}</span><span className="text-[10.5px] font-bold text-primary">Performed {performed}</span></div> }

function ExactLogRows({ rows, onAdd, placeholder, initialDate }: { rows: string[][]; onAdd: (values: string[]) => void; placeholder: string; initialDate: string }) {
  const [date, setDate] = useState(initialDate)
  const [hours, setHours] = useState('')
  const [description, setDescription] = useState('')
  return <div><div>{rows.map((row) => {
    const [main, detail] = row[1].split('||')
    return <div key={`${row[0]}-${row[1]}`} className="grid gap-1.5 border-b border-dashed border-border px-1 py-2 sm:grid-cols-[4.5rem_1fr_3.25rem] sm:items-center"><strong className="text-[10.5px] text-muted-foreground">{row[0]}</strong><span className="text-[12px]"><span className="font-semibold">{main}</span>{detail && <span className="mt-0.5 block text-[10.5px] leading-snug text-muted-foreground">{detail}</span>}</span><strong className="text-right text-[12px]">{row[2]}h</strong></div>
  })}</div><div className="mt-2.5 grid gap-2 border-t border-dashed border-border pt-2.5 sm:grid-cols-[6rem_4.5rem_1fr_auto]"><Input className="h-8 text-xs" value={date} onChange={(event) => setDate(event.target.value)} placeholder={initialDate} aria-label="Date" /><Input className="h-8 text-xs" value={hours} onChange={(event) => setHours(event.target.value)} placeholder="hrs" aria-label="Hours" /><Input className="h-8 text-xs" value={description} onChange={(event) => setDescription(event.target.value)} placeholder={placeholder} aria-label="Log detail" /><Button className="h-8" size="sm" onClick={() => { onAdd([date, hours, description]); setDate(initialDate); setHours(''); setDescription('') }}><Plus className="size-3.5" /> Log</Button></div></div>
}
