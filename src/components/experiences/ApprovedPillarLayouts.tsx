import { useState, type ReactNode } from 'react'
import type { ExperienceCategory, ExperienceEntry } from '@/lib/types'
import { cn } from '@/lib/utils'
import { PillarSceneHeader } from './PillarSceneHeader'

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
  /** The student's own recorded position rows. */
  rows: ExperienceEntry[]
  /** The student's own sites / orgs / physicians / labs. */
  entities: PillarEntity[]
  /** Their standing target; 0 when they have not set one. */
  goal: number
  totalHours: number
  selectedKey?: string
  onSelectEntity?: (key: string) => void
  onAddEntity: () => void
}

type Entity = {
  id: string
  name: string
  subtitle: string
  hours: string
  tail: string
  tone?: 'primary' | 'warn' | 'quiet'
}

const PILLAR_META = {
  volunteering: { title: 'Volunteering', subtitle: 'positions and the people behind them', add: 'Add organization' },
  shadowing: { title: 'Shadowing', subtitle: 'physicians and the visits you record', add: 'Add physician' },
  clinical: { title: 'Clinical', subtitle: 'positions, credentials, and verified context', add: 'Add site' },
  research: { title: 'Research', subtitle: 'projects and the work you record', add: 'Add project' },
} satisfies Record<ExperienceLayoutProps['category'], { title: string; subtitle: string; add: string }>

export function ApprovedExperienceLayout({
  category, rows, entities, goal, totalHours, selectedKey, onSelectEntity, onAddEntity,
}: ExperienceLayoutProps) {
  const meta = PILLAR_META[category]
  const cards: Entity[] = entities.map((entity) => ({
    id: entity.key,
    name: entity.name,
    subtitle: entity.subtitle,
    hours: `${Math.round(entity.totalHours)}h`,
    tail: entity.status === 'completed' ? 'ended' : entity.status,
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
      <PositionRecords category={category} entities={cards} />
      <EntityRail category={category} entities={cards} activeId={activeId} addLabel={meta.add} onSelect={selectEntity} onAdd={onAddEntity} />
      {active && <PositionDetail entity={active} />}
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

  if (!rows.length) {
    return (
      <section className={shell}>
        <p className="text-sm font-bold text-muted-foreground">
          No positions recorded yet — add your first {category === 'shadowing' ? 'physician' : category === 'research' ? 'project' : 'position'} to begin.
        </p>
      </section>
    )
  }

  return (
    <section className={shell}>
      <SummaryKpi value={hours} label="recorded hours" />
      <SummaryKpi value={entities.length} label={category === 'shadowing' ? 'physicians' : category === 'research' ? 'projects' : category === 'clinical' ? 'sites' : 'organizations'} valueClassName="text-base" />
      {goal > 0 && (
        <SummaryKpi
          value={<><span className={hours >= goal ? 'text-emerald-600 dark:text-emerald-300' : undefined}>{hours}</span><span className="text-muted-foreground">/{goal}</span></>}
          label="your target"
          valueClassName="text-base"
        />
      )}
      {category === 'research' && <SummaryKpi value={active} label="active" valueClassName="text-base" />}
      <p className="text-xs font-bold text-muted-foreground xl:ml-auto">Weekly pace needs dated hour logs.</p>
    </section>
  )
}

function PositionRecords({ category, entities }: { category: ExperienceLayoutProps['category']; entities: Entity[] }) {
  if (!entities.length) return null
  const noun = category === 'shadowing' ? 'physician' : category === 'research' ? 'project' : 'position'
  return (
    <section className="overflow-hidden rounded-[14px] border bg-card px-[18px] py-4 shadow-sm">
      <div className="mb-3">
        <h2 className="font-display text-base font-extrabold">Recorded {noun}s</h2>
        <p className="mt-0.5 text-[11.5px] leading-snug text-muted-foreground">Totals come from your existing position records. Dated pace is unavailable until individual hour logs exist.</p>
      </div>
      <div className="divide-y divide-border/70">
        {entities.map((entity) => (
          <div key={entity.id} className="grid gap-2 py-2.5 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center sm:gap-5">
            <div className="min-w-0"><strong className="block truncate text-sm">{entity.name}</strong><span className="block truncate text-[11.5px] font-semibold text-muted-foreground">{entity.subtitle}</span></div>
            <strong className="font-display text-base tabular-nums">{entity.hours}</strong>
            <StatusChip tone={entity.tone === 'warn' ? 'warn' : 'quiet'}>{entity.tail}</StatusChip>
          </div>
        ))}
      </div>
    </section>
  )
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
            <p className={cn('mt-1 text-[10.5px] font-bold leading-snug', entity.tone === 'warn' ? 'text-amber-600 dark:text-amber-300' : 'text-muted-foreground')}>{entity.tail}</p>
          </button>
        ))}
        <button type="button" onClick={onAdd} className="grid min-h-[70px] place-items-center rounded-xl border border-dashed bg-muted/10 p-3 text-[12.5px] font-extrabold text-muted-foreground hover:border-primary/40 hover:text-primary"><span>+ {addLabel.toLowerCase()}</span></button>
      </div>
    </section>
  )
}

function PositionDetail({ entity }: { entity: Entity }) {
  return (
    <section className="rounded-[14px] border bg-card p-[18px] shadow-sm">
      <div className="grid gap-3 rounded-xl border bg-muted/20 px-[17px] py-[15px] sm:grid-cols-[1fr_auto]">
        <div className="min-w-0">
          <h2 className="font-display text-[19px] font-extrabold leading-tight">{entity.name}</h2>
          <p className="mt-1.5 text-[12.5px] font-bold text-muted-foreground">{entity.subtitle}</p>
        </div>
        <div><strong className="font-display text-[38px] font-extrabold leading-none tabular-nums">{entity.hours.replace('h', '')}</strong><span className="block text-[10px] font-extrabold uppercase tracking-[0.06em] text-muted-foreground">recorded hours</span></div>
        <div className="border-t border-dashed border-border pt-2 sm:col-span-2">
          <StatusChip tone={entity.tone === 'warn' ? 'warn' : 'quiet'}>{entity.tail}</StatusChip>
          <p className="mt-2 text-[12px] font-semibold leading-relaxed text-muted-foreground">Dated hour history is not available for this position yet, so Premed OS does not show a weekly rate, trend, projection, or sample shifts.</p>
        </div>
      </div>
    </section>
  )
}

function StatusChip({ children, tone = 'quiet' }: { children: ReactNode; tone?: 'warn' | 'quiet' }) {
  return <span className={cn('inline-flex rounded-full px-2 py-0.5 text-[10.5px] font-bold', tone === 'warn' ? 'bg-amber-500/12 text-amber-700 dark:text-amber-300' : 'bg-muted text-muted-foreground')}>{children}</span>
}
