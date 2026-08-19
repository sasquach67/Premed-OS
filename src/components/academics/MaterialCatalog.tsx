/**
 * The material shelf (§4.1 materials extensions · Resource catalog).
 *
 * Drawing:   mockup-lab/01-academics/academics-materials-extensions.html
 * Decisions: academics-materials-extensions.md — a shelf, not a sixth tab:
 *            unit spine at left, compact tiles at centre, one restrained
 *            empty rail at right. Hierarchy is unit → material → provenance.
 * Model:     lib/academics/materialCatalog.ts.
 *
 * ⚠️ The two views this drawing also contains — Calendar review and
 * source-selected generation — are NOT built. Calendar needs an OAuth client
 * only Andy can create; generation has no engine yet (`study-tools` has no
 * generate action). Offering either as a shell would advertise something the
 * app cannot do. See `T1-academics-build-7.md` §1f.
 */
import { useState } from 'react'
import { FileText, FolderOpen, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  PROVENANCE_LABEL, catalogEntries, catalogUnits, type Provenance,
} from '@/lib/academics/materialCatalog'
import type { AcademicFile, Topic } from '@/lib/types'
import { Button } from '@/components/ui/button'

const CARD = 'rounded-2xl border border-border bg-card shadow-[0_10px_26px_-14px_rgba(0,0,0,0.55)]'
const EYEBROW = 'font-display text-[10px] font-extrabold uppercase tracking-[0.1em] text-muted-foreground'

/** Unknown origin reads as a caution, because private-by-default is the point. */
const BADGE: Record<Provenance, string> = {
  course: 'border-[color-mix(in_srgb,var(--cat-gpa)_36%,var(--border))] bg-[color-mix(in_srgb,var(--cat-gpa)_10%,transparent)]',
  mine: 'border-border bg-muted/40',
  generated: 'border-[color-mix(in_srgb,var(--cat-mcat)_36%,var(--border))] bg-[color-mix(in_srgb,var(--cat-mcat)_10%,transparent)]',
  unknown: 'border-dashed border-amber-500/50 bg-amber-500/8',
}

export function MaterialCatalog({ files, topics, onAdd }: {
  files: AcademicFile[]
  topics: Topic[]
  onAdd?: () => void
}) {
  const units = catalogUnits(files, topics)
  const [selected, setSelected] = useState<string | undefined>()
  const unit = selected && units.some((row) => row.unit === selected) ? selected : units[0]?.unit
  const entries = catalogEntries(files, topics, unit)

  if (!files.length) {
    return (
      <section className={cn(CARD, 'p-4')}>
        <p className={EYEBROW}>Course shelf</p>
        <h3 className="mt-0.5 font-display text-base font-extrabold">Nothing filed yet</h3>
        <p className="mt-1 text-xs font-bold text-muted-foreground">
          Add a past exam, a review sheet, or your own returned work when one becomes useful.
        </p>
        {onAdd && <Button size="sm" className="mt-3" onClick={onAdd}><Plus className="size-4" /> Add material</Button>}
      </section>
    )
  }

  return (
    <div className="grid gap-3 lg:grid-cols-[13rem_minmax(0,1fr)_15rem]">
      <aside className={cn(CARD, 'h-fit p-3.5')}>
        <p className={EYEBROW}>Course shelf</p>
        <h3 className="mt-0.5 font-display text-sm font-extrabold">By unit</h3>
        <p className="mt-1 text-[11px] font-bold text-muted-foreground">
          Material is filed to the work it can support.
        </p>
        <div className="mt-2.5 space-y-1.5">
          {units.map((row) => (
            <button
              key={row.unit} type="button" onClick={() => setSelected(row.unit)}
              className={cn(
                'flex w-full items-center justify-between gap-2 rounded-lg border px-2.5 py-2 text-left transition-colors duration-150 ease-[cubic-bezier(.16,1,.3,1)] motion-reduce:transition-none',
                row.unit === unit
                  ? 'border-[color-mix(in_srgb,var(--cat-gpa)_44%,var(--border))] bg-[color-mix(in_srgb,var(--cat-gpa)_10%,transparent)]'
                  : 'border-border bg-muted/25 hover:bg-muted/45',
              )}
            >
              <span className="min-w-0 truncate font-display text-xs font-extrabold">{row.unit}</span>
              <span className="text-[10.5px] font-bold text-muted-foreground">
                {row.count} {row.count === 1 ? 'material' : 'materials'}
              </span>
            </button>
          ))}
        </div>
      </aside>

      <article className={cn(CARD, 'p-4')}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className={EYEBROW}>{unit} · selected</p>
            <h3 className="mt-0.5 font-display text-base font-extrabold">Material, with its provenance</h3>
            <p className="mt-0.5 text-xs font-bold text-muted-foreground">
              Only material you added is here. Origin is visible before anything becomes part of a study plan.
            </p>
          </div>
          <span className="shrink-0 rounded-lg border border-border bg-muted px-2 py-1 font-display text-[10.5px] font-extrabold text-muted-foreground">
            {entries.length} {entries.length === 1 ? 'material' : 'materials'}
          </span>
        </div>

        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {entries.map(({ file, provenance }) => (
            <div key={file.id} className="rounded-xl border border-border bg-muted/25 p-3">
              <div className="flex items-center gap-2">
                <FileText className="size-3.5 shrink-0 text-[var(--cat-gpa)]" />
                <b className="min-w-0 truncate font-display text-sm font-extrabold">{file.title}</b>
              </div>
              <p className="mt-1 text-[11px] font-bold text-muted-foreground">
                {file.notes || `${file.type.replace(/-/g, ' ')} · ${file.sourceType}`}
              </p>
              <span className={cn('mt-2 inline-block rounded-md border px-1.5 py-0.5 font-display text-[10px] font-extrabold', BADGE[provenance])}>
                {PROVENANCE_LABEL[provenance]}
              </span>
            </div>
          ))}
        </div>
      </article>

      <aside className={cn(CARD, 'h-fit p-3.5')}>
        <p className={EYEBROW}>Adding more</p>
        <h3 className="mt-0.5 font-display text-sm font-extrabold">Nothing relevant yet?</h3>
        <p className="mt-1 text-[11px] font-bold text-muted-foreground">
          Add a past exam, review sheet, or your own returned work when one becomes useful.
        </p>
        <div className="mt-3 flex h-16 items-center justify-center rounded-xl border border-dashed border-border text-muted-foreground">
          <FolderOpen className="size-5" />
        </div>
        {onAdd && <Button size="sm" variant="outline" className="mt-3 w-full" onClick={onAdd}><Plus className="size-4" /> Add material</Button>}
      </aside>
    </div>
  )
}
