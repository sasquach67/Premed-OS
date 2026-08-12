import type { ReactNode } from 'react'
import { Activity, FileText, Link2, ListChecks, NotebookPen, ShieldCheck } from 'lucide-react'
import { Collapsible } from '@/components/common/Collapsible'
import { cn } from '@/lib/utils'
import { AutosaveStatus, type SaveStatus } from '@/components/common/AutosaveStatus'

export interface InspectorSection {
  content?: ReactNode
  emptyLabel: string
  addAction?: ReactNode
}

export interface ObjectInspectorConfig {
  overview: InspectorSection
  relations: InspectorSection
  files: InspectorSection
  activity: InspectorSection
  actions: InspectorSection
  notes: InspectorSection
  dataQuality: InspectorSection
}

export const CORE_INSPECTOR_SECTIONS = [
  { key: 'overview', title: 'Overview / Details', icon: ListChecks },
  { key: 'relations', title: 'Relations', icon: Link2 },
  { key: 'files', title: 'Files', icon: FileText },
  { key: 'activity', title: 'Activity', icon: Activity },
  { key: 'actions', title: 'Actions', icon: ListChecks },
] as const

export const PROGRESSIVE_INSPECTOR_SECTIONS = [
  { key: 'notes', title: 'Notes', icon: NotebookPen },
  { key: 'dataQuality', title: 'Data quality', icon: ShieldCheck },
] as const

export function ObjectInspector({
  title,
  subtitle,
  config,
  className,
  saveStatus = 'saved',
}: {
  title: ReactNode
  subtitle?: ReactNode
  config: ObjectInspectorConfig
  className?: string
  saveStatus?: SaveStatus
}) {
  return (
    <article className={cn('min-w-0', className)} aria-label="Object inspector">
      <header className="flex items-start justify-between gap-3 border-b border-border px-5 py-4 md:px-6">
        <div className="min-w-0">
          <h1 className="truncate font-display text-xl font-extrabold">{title}</h1>
          {subtitle && <div className="mt-1 text-sm font-semibold text-muted-foreground">{subtitle}</div>}
        </div>
        <AutosaveStatus status={saveStatus} />
      </header>

      <div className="space-y-4 p-4 md:p-6">
        {CORE_INSPECTOR_SECTIONS.map((definition) => (
          <InspectorRegion
            key={definition.key}
            title={definition.title}
            icon={definition.icon}
            section={config[definition.key]}
          />
        ))}

        {PROGRESSIVE_INSPECTOR_SECTIONS.map((definition) => (
          <ProgressiveRegion
            key={definition.key}
            title={definition.title}
            icon={definition.icon}
            section={config[definition.key]}
          />
        ))}
      </div>
    </article>
  )
}

function InspectorRegion({
  title,
  icon: Icon,
  section,
}: {
  title: string
  icon: typeof Activity
  section: InspectorSection
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-4" aria-labelledby={`inspector-${slug(title)}`}>
      <h2 id={`inspector-${slug(title)}`} className="mb-3 flex items-center gap-2 text-sm font-extrabold">
        <Icon className="size-4 text-primary" aria-hidden="true" />
        {title}
      </h2>
      <SectionContent section={section} />
    </section>
  )
}

function ProgressiveRegion({
  title,
  icon: Icon,
  section,
}: {
  title: string
  icon: typeof Activity
  section: InspectorSection
}) {
  return (
    <section>
      <Collapsible
        title={(
          <span className="flex items-center gap-2">
          <Icon className="size-4 text-primary" aria-hidden="true" />
          {title}
          </span>
        )}
        right={<span className="text-xs font-semibold text-muted-foreground">Show</span>}
      >
        <SectionContent section={section} />
      </Collapsible>
    </section>
  )
}

function SectionContent({ section }: { section: InspectorSection }) {
  if (section.content) return <>{section.content}</>
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
      <span>{section.emptyLabel.trim() || 'Nothing here yet.'}</span>
      {section.addAction}
    </div>
  )
}

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-')
}
