import { useMemo, useState } from 'react'
import { ExternalLink, Plus, Trash2, BadgeCheck, FolderOpen } from 'lucide-react'
import type { ResourceLink } from '@/lib/types'
import { useStore } from '@/store/store'
import { uid } from '@/lib/id'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'

/** Resources for one pillar, organized into clickable categories.
 *  Each card opens its link in a new tab. */
export function ResourceGrid({ pillar }: { pillar: string }) {
  const resources = useStore((s) => s.resources)
  const removeItem = useStore((s) => s.removeItem)

  const grouped = useMemo(() => {
    const mine = resources.filter((r) => r.pillar === pillar).sort((a, b) => a.order - b.order)
    const map = new Map<string, ResourceLink[]>()
    for (const r of mine) {
      const arr = map.get(r.category) ?? []
      arr.push(r)
      map.set(r.category, arr)
    }
    return [...map.entries()]
  }, [resources, pillar])

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-bold"><FolderOpen className="size-4 text-primary" /> Resources</h3>
        <AddResource pillar={pillar} categories={grouped.map((g) => g[0])} />
      </div>

      {grouped.length === 0 && (
        <p className="rounded-lg border border-dashed border-border bg-muted px-4 py-6 text-center text-sm text-muted-foreground">
          No resources yet — add your first link.
        </p>
      )}

      {grouped.map(([category, items]) => (
        <div key={category}>
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">{category}</p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((r) => (
              <a
                key={r.id}
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative flex items-start gap-2 rounded-xl border border-border bg-card p-3 card-soft transition-all hover:-translate-y-0.5 hover:border-primary/40"
              >
                <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg bg-secondary text-secondary-foreground">
                  <ExternalLink className="size-3.5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1 text-sm font-semibold leading-tight">
                    <span className="truncate">{r.label}</span>
                    {r.official && <BadgeCheck className="size-3.5 shrink-0 text-primary" />}
                  </span>
                  {r.note && <span className="mt-0.5 block truncate text-xs text-muted-foreground">{r.note}</span>}
                </span>
                <button
                  onClick={(e) => { e.preventDefault(); removeItem('resources', r.id) }}
                  className="absolute right-1.5 top-1.5 rounded-md p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-muted hover:text-destructive group-hover:opacity-100"
                  aria-label="Remove resource"
                >
                  <Trash2 className="size-3" />
                </button>
              </a>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function AddResource({ pillar, categories }: { pillar: string; categories: string[] }) {
  const addItem = useStore((s) => s.addItem)
  const [label, setLabel] = useState('')
  const [url, setUrl] = useState('')
  const [category, setCategory] = useState(categories[0] ?? 'General')

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm"><Plus className="size-4" /> Add link</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Add a resource</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Label</Label>
            <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. UWorld QBank" />
          </div>
          <div className="space-y-1.5">
            <Label>URL</Label>
            <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" />
          </div>
          <div className="space-y-1.5">
            <Label>Category</Label>
            <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. Anki / Exams / Content" list="rg-cats" />
            <datalist id="rg-cats">{categories.map((c) => <option key={c} value={c} />)}</datalist>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button
              disabled={!label || !url}
              onClick={() => addItem('resources', { id: uid(), pillar, category: category || 'General', label, url, official: false } as ResourceLink)}
            >
              Add resource
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
