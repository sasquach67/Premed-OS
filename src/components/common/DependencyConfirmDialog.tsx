import { useState } from 'react'
import { AlertTriangle, Archive, Link2, Trash2 } from 'lucide-react'
import type { DependencyImpact } from '@/lib/dependencies'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

export function DependencyConfirmDialog({
  open, onOpenChange, impacts, replacements = [], canArchive = false,
  onMoveToTrash, onArchive, onReassignAndTrash,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  impacts: DependencyImpact[]
  replacements?: Array<{ id: string; label: string }>
  canArchive?: boolean
  onMoveToTrash: () => void
  onArchive?: () => void
  onReassignAndTrash?: (replacementId: string) => void
}) {
  const [replacementId, setReplacementId] = useState('')
  const dependentCount = impacts.reduce((sum, impact) => sum + impact.dependents.length, 0)
  const canReassign = dependentCount > 0 && replacements.length > 0 && Boolean(onReassignAndTrash)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><AlertTriangle className="size-4 text-warning" /> Review affected records</DialogTitle>
          <DialogDescription>
            {impacts.length} {impacts.length === 1 ? 'record' : 'records'} will move to Trash. Restore remains available until you permanently delete them.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-72 space-y-2 overflow-y-auto rounded-xl border border-border bg-muted p-3">
          {impacts.map((impact) => (
            <section key={impact.recordId} className="rounded-lg bg-card p-3">
              <h3 className="text-sm font-bold">{impact.recordLabel}</h3>
              {impact.dependents.length ? (
                <ul className="mt-1 space-y-1 text-xs text-muted-foreground">
                  {impact.dependents.map((dependent) => (
                    <li key={`${dependent.collection}-${dependent.id}`} className="flex gap-2">
                      <Link2 className="mt-0.5 size-3 shrink-0" />
                      <span>{dependent.label} · {dependent.relationship}</span>
                    </li>
                  ))}
                </ul>
              ) : <p className="mt-1 text-xs text-muted-foreground">No linked records depend on this item.</p>}
            </section>
          ))}
        </div>

        {canReassign && (
          <label className="text-sm font-bold">
            Reassign linked records
            <Select value={replacementId} onValueChange={setReplacementId}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Choose a replacement" /></SelectTrigger>
              <SelectContent>{replacements.map((option) => <SelectItem key={option.id} value={option.id}>{option.label}</SelectItem>)}</SelectContent>
            </Select>
          </label>
        )}

        <DialogFooter className="flex-wrap">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          {canArchive && onArchive && <Button variant="outline" onClick={onArchive}><Archive className="size-4" /> Archive instead</Button>}
          {canReassign && (
            <Button variant="outline" disabled={!replacementId} onClick={() => onReassignAndTrash?.(replacementId)}>
              Reassign and move
            </Button>
          )}
          <Button variant="destructive" onClick={onMoveToTrash}><Trash2 className="size-4" /> Move to Trash</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function PermanentDeleteDialog({
  open, onOpenChange, count, onConfirm,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  count: number
  onConfirm: () => void
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Permanently delete {count === 1 ? 'record' : `${count} records`}?</AlertDialogTitle>
          <AlertDialogDescription>This removes the selected data from Trash and cannot be undone.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={onConfirm}>Delete permanently</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
