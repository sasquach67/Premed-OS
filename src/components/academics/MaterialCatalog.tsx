/** Course materials with visible source provenance, independent of legacy topic links. */
import { FileText, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  PROVENANCE_LABEL, catalogEntries, type Provenance,
} from '@/lib/academics/materialCatalog'
import type { AcademicFile } from '@/lib/types'
import { Button } from '@/components/ui/button'

const CARD = 'rounded-2xl border border-border bg-card shadow-[0_10px_26px_-14px_rgba(0,0,0,0.55)]'
const EYEBROW = 'font-display text-[10px] font-extrabold uppercase tracking-[0.1em] text-muted-foreground'

/** Unknown origin reads as a caution, because private-by-default is the point. */
const BADGE: Record<Provenance, string> = {
  course: 'border-[color-mix(in_srgb,var(--cat-gpa)_36%,var(--border))] bg-[color-mix(in_srgb,var(--cat-gpa)_10%,transparent)]',
  mine: 'border-border bg-muted',
  generated: 'border-[color-mix(in_srgb,var(--cat-mcat)_36%,var(--border))] bg-[color-mix(in_srgb,var(--cat-mcat)_10%,transparent)]',
  unknown: 'border-dashed border-amber-500/50 bg-amber-500/8',
}

export function MaterialCatalog({ files, onAdd }: {
  files: AcademicFile[]
  onAdd?: () => void
}) {
  const entries = catalogEntries(files, [])

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
    <div className={cn('grid gap-3', onAdd && 'lg:grid-cols-[minmax(0,1fr)_15rem]')}>
      <article className={cn(CARD, 'p-4')}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className={EYEBROW}>Course shelf</p>
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
            <div key={file.id} className="rounded-xl border border-border bg-muted p-3">
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

      {onAdd && <aside className={cn(CARD, 'h-fit p-3.5')}>
        <p className={EYEBROW}>Adding more</p>
        <h3 className="mt-0.5 font-display text-sm font-extrabold">Nothing relevant yet?</h3>
        <p className="mt-1 text-[11px] font-bold text-muted-foreground">
          Add a past exam, review sheet, or your own returned work when one becomes useful.
        </p>
        <Button size="sm" variant="outline" className="mt-3 w-full" onClick={onAdd}><Plus className="size-4" /> Add material</Button>
      </aside>}
    </div>
  )
}
