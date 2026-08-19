import { useMemo, useState } from 'react'
import { History, RotateCcw, Trash2 } from 'lucide-react'
import { recordLabel } from '@/lib/dependencies'
import { useStore } from '@/store/store'
import { useToast } from '@/components/common/useToast'
import { PermanentDeleteDialog } from '@/components/common/DependencyConfirmDialog'
import { EmptyState } from '@/components/common/EmptyState'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import type { CollectionKey } from '@/lib/types'

const GENERIC_ARCHIVE_KEYS: CollectionKey[] = [
  'courses', 'requirements', 'experiences', 'persons', 'organizations', 'letters',
  'stories', 'secondaries', 'interviewQs', 'schools', 'resources', 'quarterlyGoals',
  'advisingQs', 'notePages', 'orgs',
]

export function TrashRecovery() {
  const trash = useStore((state) => state.trash)
  const recoveryStack = useStore((state) => state.meta.recoveryStack)
  const restoreTrashItems = useStore((state) => state.restoreTrashItems)
  const permanentlyDeleteTrashItems = useStore((state) => state.permanentlyDeleteTrashItems)
  const undoRecovery = useStore((state) => state.undoRecovery)
  const bulkPatchItems = useStore((state) => state.bulkPatchItems)
  const store = useStore()
  const toast = useToast()
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set())
  const [permanentOpen, setPermanentOpen] = useState(false)
  const selected = trash.filter((entry) => selectedIds.has(entry.id))
  const grouped = useMemo(() => {
    const groups = new Map<string, typeof trash>()
    for (const entry of trash) {
      const current = groups.get(entry.collection) ?? []
      current.push(entry)
      groups.set(entry.collection, current)
    }
    return [...groups.entries()]
  }, [trash])
  const archived = GENERIC_ARCHIVE_KEYS.flatMap((collection) => (
    (store[collection] as unknown as Array<{ id: string; archived?: boolean; [key: string]: unknown }>)
      .filter((record) => record.archived)
      .map((record) => ({ collection, record }))
  ))

  function toggle(id: string) {
    setSelectedIds((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function restore(ids = [...selectedIds]) {
    restoreTrashItems(ids)
    setSelectedIds(new Set())
    toast({ title: 'Restored from Trash', description: `${ids.length} ${ids.length === 1 ? 'record' : 'records'} returned to the owning list.` })
  }

  return (
    <div className="space-y-4">
      {archived.length > 0 && (
        <section className="rounded-xl border border-border bg-muted p-3">
          <div className="mb-3">
            <h3 className="text-sm font-bold">Archived records</h3>
            <p className="text-xs text-muted-foreground">Restore records that were archived from their owning list.</p>
          </div>
          <div className="max-h-64 space-y-1 overflow-y-auto">
            {archived.map(({ collection, record }) => (
              <div key={`${collection}-${record.id}`} className="flex min-h-11 items-center gap-3 rounded-lg bg-card px-3 py-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">{recordLabel(record)}</p>
                  <p className="text-xs text-muted-foreground">{collection}</p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    const recoveryId = bulkPatchItems(collection, [record.id], { archived: false }, 'Restored archived record')
                    toast({ title: 'Restored from Archive', onUndo: recoveryId ? () => undoRecovery(recoveryId) : undefined })
                  }}
                >
                  <RotateCcw className="size-3.5" /> Restore
                </Button>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="rounded-xl border border-border bg-muted p-3">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <div className="mr-auto">
            <h3 className="text-sm font-bold">Trash</h3>
            <p className="text-xs text-muted-foreground">Deleted records stay recoverable until permanently removed.</p>
          </div>
          {selectedIds.size > 0 && (
            <>
              <Button size="sm" variant="outline" onClick={() => restore()}><RotateCcw className="size-4" /> Restore {selectedIds.size}</Button>
              <Button size="sm" variant="destructive" onClick={() => setPermanentOpen(true)}><Trash2 className="size-4" /> Delete permanently</Button>
            </>
          )}
        </div>

        {trash.length === 0 ? (
          <EmptyState icon={Trash2} title="Trash is empty" hint="Deleted records will stay here until you restore or permanently remove them." />
        ) : (
          <div className="max-h-96 space-y-4 overflow-y-auto">
            {grouped.map(([collection, entries]) => (
              <section key={collection}>
                <h4 className="mb-1 text-xs font-extrabold uppercase tracking-wide text-muted-foreground">{collection}</h4>
                <div className="space-y-1">
                  {entries.map((entry) => (
                    <div key={entry.id} className="flex min-h-11 items-center gap-3 rounded-lg bg-card px-3 py-2">
                      <Checkbox checked={selectedIds.has(entry.id)} onCheckedChange={() => toggle(entry.id)} aria-label={`Select ${recordLabel(entry.record)}`} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold">{recordLabel(entry.record)}</p>
                        <p className="text-xs text-muted-foreground">Deleted {new Date(entry.deletedAt).toLocaleString()}</p>
                      </div>
                      <Button size="sm" variant="ghost" onClick={() => restore([entry.id])}><RotateCcw className="size-3.5" /> Restore</Button>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </section>

      {recoveryStack.length > 0 && (
        <section className="rounded-xl border border-border bg-muted p-3">
          <h3 className="mb-1 flex items-center gap-2 text-sm font-bold"><History className="size-4 text-primary" /> Recent reversible changes</h3>
          <p className="mb-3 text-xs text-muted-foreground">The latest local changes stay available after reload. This is recovery, not version history.</p>
          <div className="max-h-56 space-y-1 overflow-y-auto">
            {recoveryStack.slice(0, 10).map((entry) => (
              <div key={entry.id} className="flex min-h-10 items-center gap-3 rounded-lg bg-card px-3 py-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">{entry.label}</p>
                  <p className="text-xs text-muted-foreground">{entry.collection} · {new Date(entry.at).toLocaleString()}</p>
                </div>
                <Button size="sm" variant="ghost" onClick={() => { undoRecovery(entry.id); toast({ title: 'Change undone' }) }}>
                  Undo
                </Button>
              </div>
            ))}
          </div>
        </section>
      )}

      <PermanentDeleteDialog
        open={permanentOpen}
        onOpenChange={setPermanentOpen}
        count={selected.length}
        onConfirm={() => {
          permanentlyDeleteTrashItems([...selectedIds])
          setSelectedIds(new Set())
          setPermanentOpen(false)
          toast({ title: 'Permanently deleted', description: `${selected.length} ${selected.length === 1 ? 'record' : 'records'} removed.` })
        }}
      />
    </div>
  )
}
