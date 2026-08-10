import { useState } from 'react'
import { m } from 'motion/react'
import {
  Archive, Building2, Download, FolderInput, MoreHorizontal, Tags, Trash2, X,
} from 'lucide-react'
import type { CollectionKey } from '@/lib/types'
import { dependencyImpacts, reassignDependencies, recordLabel } from '@/lib/dependencies'
import { useStore, snapshotData } from '@/store/store'
import { useToast } from '@/components/common/useToast'
import { DependencyConfirmDialog } from '@/components/common/DependencyConfirmDialog'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { MOTION_TRANSITION } from '@/lib/motion'

type Row = { id: string }
type ValueAction = 'tag' | 'status' | 'term' | 'organization'

const STATUS_OPTIONS: Partial<Record<CollectionKey, string[]>> = {
  tasks: ['Not started', 'Working on', 'Finished'],
  letters: ['identified', 'asked', 'agreed', 'submitted', 'declined'],
  schools: ['researching', 'will-apply', 'applied', 'secondary', 'interview', 'accepted', 'waitlist', 'rejected'],
  experiences: ['active', 'completed', 'planned'],
  orgs: ['interested', 'member', 'leader', 'inactive'],
}

const TAG_COLLECTIONS = new Set<CollectionKey>(['experiences', 'persons', 'stories'])
const TERM_COLLECTIONS = new Set<CollectionKey>(['courses'])
const ORGANIZATION_COLLECTIONS = new Set<CollectionKey>(['experiences', 'persons'])
const ARCHIVE_COLLECTIONS = new Set<CollectionKey>([
  'courses', 'requirements', 'experiences', 'persons', 'organizations', 'tasks', 'letters',
  'stories', 'secondaries', 'interviewQs', 'schools', 'resources', 'focusTargets',
  'quarterlyGoals', 'advisingQs', 'notePages', 'orgs',
])

function rowValue(row: Row, key: string) {
  return (row as Record<string, unknown>)[key]
}

export function BulkActionBar({
  collection, rows, selectedIds, onClear,
}: {
  collection: CollectionKey
  rows: Row[]
  selectedIds: Set<string>
  onClear: () => void
}) {
  const toast = useToast()
  const bulkPatchItems = useStore((state) => state.bulkPatchItems)
  const bulkTransformItems = useStore((state) => state.bulkTransformItems)
  const softDeleteItems = useStore((state) => state.softDeleteItems)
  const undoRecovery = useStore((state) => state.undoRecovery)
  const update = useStore((state) => state.update)
  const organizations = useStore((state) => state.organizations)
  const allRows = useStore((state) => state[collection]) as unknown as Row[]
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [valueAction, setValueAction] = useState<ValueAction | null>(null)
  const selected = rows.filter((row) => selectedIds.has(row.id))
  const ids = selected.map((row) => row.id)
  const impacts = dependencyImpacts(snapshotData(), collection, ids)
  const replacements = allRows
    .filter((row) => !selectedIds.has(row.id) && !rowValue(row, 'archived') && !rowValue(row, 'deletedAt'))
    .map((row) => ({ id: row.id, label: recordLabel(row as Record<string, unknown>) }))

  function notifyRecovery(title: string, recoveryId: string | null) {
    toast({
      title,
      description: `${ids.length} ${ids.length === 1 ? 'record' : 'records'} updated.`,
      onUndo: recoveryId ? () => undoRecovery(recoveryId) : undefined,
    })
    onClear()
  }

  function archiveSelected() {
    notifyRecovery('Archived', bulkPatchItems(collection, ids, { archived: true }, 'Archived records'))
  }

  function exportSelected() {
    const blob = new Blob([JSON.stringify(selected, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `premedos-${collection}-export.json`
    anchor.click()
    URL.revokeObjectURL(url)
    toast({ title: 'Export prepared', description: `${ids.length} ${ids.length === 1 ? 'record' : 'records'} included.` })
  }

  function moveToTrash() {
    const recoveryId = softDeleteItems(collection, ids, 'Moved records to trash')
    setDeleteOpen(false)
    notifyRecovery('Moved to Trash', recoveryId)
  }

  function archiveInstead() {
    setDeleteOpen(false)
    archiveSelected()
  }

  function reassignAndTrash(replacementId: string) {
    update((draft) => reassignDependencies(draft, collection, ids, replacementId))
    moveToTrash()
  }

  if (!selectedIds.size) return null

  return (
    <>
      <m.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={MOTION_TRANSITION.standard} className="sticky bottom-3 z-20 mx-3 mb-3 flex min-h-12 flex-wrap items-center gap-2 rounded-xl border border-border bg-card/95 px-3 py-2 shadow-xl backdrop-blur" role="toolbar" aria-label="Bulk actions">
        <span className="mr-auto text-sm font-bold">{selectedIds.size} selected</span>
        {ARCHIVE_COLLECTIONS.has(collection) && <Button size="sm" variant="ghost" onClick={archiveSelected}><Archive className="size-4" /> Archive</Button>}
        <Button size="sm" variant="ghost" onClick={exportSelected}><Download className="size-4" /> Export</Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild><Button size="sm" variant="ghost">More <MoreHorizontal className="size-4" /></Button></DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {TAG_COLLECTIONS.has(collection) && <DropdownMenuItem onSelect={() => setValueAction('tag')}><Tags className="size-4" /> Add tag</DropdownMenuItem>}
            {STATUS_OPTIONS[collection] && <DropdownMenuItem onSelect={() => setValueAction('status')}><FolderInput className="size-4" /> Change status</DropdownMenuItem>}
            {TERM_COLLECTIONS.has(collection) && <DropdownMenuItem onSelect={() => setValueAction('term')}><FolderInput className="size-4" /> Assign term</DropdownMenuItem>}
            {ORGANIZATION_COLLECTIONS.has(collection) && <DropdownMenuItem onSelect={() => setValueAction('organization')}><Building2 className="size-4" /> Link organization</DropdownMenuItem>}
            <DropdownMenuItem className="text-destructive" onSelect={() => setDeleteOpen(true)}><Trash2 className="size-4" /> Move to Trash</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <button type="button" className="grid size-9 place-items-center rounded-md text-muted-foreground hover:bg-muted" onClick={onClear} aria-label="Clear selection"><X className="size-4" /></button>
      </m.div>

      <BulkValueDialog
        action={valueAction}
        collection={collection}
        rows={selected}
        statusOptions={STATUS_OPTIONS[collection] ?? []}
        organizationOptions={organizations.filter((organization) => !organization.archived).map((organization) => ({ id: organization.id, label: organization.name }))}
        onOpenChange={(open) => { if (!open) setValueAction(null) }}
        onApply={(value) => {
          let recoveryId: string | null = null
          if (valueAction === 'tag') {
            recoveryId = bulkTransformItems(collection, ids, (row) => {
              const tags = Array.isArray(row.tags) ? row.tags.map(String) : []
              row.tags = [...new Set([...tags, value])]
            }, 'Added tag')
          } else if (valueAction === 'status') {
            const key = collection === 'tasks' ? 'progress' : 'status'
            recoveryId = bulkPatchItems(collection, ids, { [key]: value }, 'Changed status')
          } else if (valueAction === 'term') {
            recoveryId = bulkPatchItems(collection, ids, { term: value }, 'Assigned term')
          } else if (valueAction === 'organization') {
            recoveryId = bulkPatchItems(collection, ids, { organizationId: value }, 'Linked organization')
          }
          setValueAction(null)
          notifyRecovery('Bulk update applied', recoveryId)
        }}
      />

      <DependencyConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        impacts={impacts}
        replacements={replacements}
        canArchive={ARCHIVE_COLLECTIONS.has(collection)}
        onArchive={archiveInstead}
        onMoveToTrash={moveToTrash}
        onReassignAndTrash={reassignAndTrash}
      />
    </>
  )
}

function BulkValueDialog({
  action, collection, rows, statusOptions, organizationOptions, onOpenChange, onApply,
}: {
  action: ValueAction | null
  collection: CollectionKey
  rows: Row[]
  statusOptions: string[]
  organizationOptions: Array<{ id: string; label: string }>
  onOpenChange: (open: boolean) => void
  onApply: (value: string) => void
}) {
  const [value, setValue] = useState('')
  const terms = [...new Set(rows.map((row) => String(rowValue(row, 'term') ?? '')).filter(Boolean))]
  const label = action === 'tag' ? 'Tag' : action === 'status' ? 'Status' : action === 'term' ? 'Term' : 'Organization'
  const options = action === 'status' ? statusOptions : action === 'organization' ? organizationOptions.map((option) => option.id) : terms

  return (
    <Dialog open={Boolean(action)} onOpenChange={(open) => { if (!open) setValue(''); onOpenChange(open) }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{action === 'tag' ? 'Add tag' : action === 'status' ? 'Change status' : action === 'term' ? 'Assign term' : 'Link organization'}</DialogTitle>
          <DialogDescription>Apply this value to {rows.length} selected {collection} {rows.length === 1 ? 'record' : 'records'}.</DialogDescription>
        </DialogHeader>
        {(action === 'tag' || action === 'term') ? (
          <label className="text-sm font-bold">{label}<Input value={value} onChange={(event) => setValue(event.target.value)} placeholder={action === 'tag' ? 'Service' : 'Fall 2027'} /></label>
        ) : (
          <label className="text-sm font-bold">
            {label}
            <Select value={value} onValueChange={setValue}>
              <SelectTrigger className="mt-1"><SelectValue placeholder={`Choose ${label.toLowerCase()}`} /></SelectTrigger>
              <SelectContent>
                {options.map((option) => {
                  const display = action === 'organization' ? organizationOptions.find((item) => item.id === option)?.label ?? option : option
                  return <SelectItem key={option} value={option}>{display}</SelectItem>
                })}
              </SelectContent>
            </Select>
          </label>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={!value.trim()} onClick={() => { onApply(value.trim()); setValue('') }}>Apply</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
