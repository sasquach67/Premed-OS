import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { AlertTriangle, HelpCircle } from 'lucide-react'
import {
  AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogMedia, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { ConfirmContext } from '@/components/common/confirm-context'

export interface ConfirmInput {
  title: string
  description?: string
  /** Say what will happen, not "OK". The label is the last thing read before
   *  an irreversible action, so it carries the verb. */
  confirmLabel?: string
  onExport?: () => void
  cancelLabel?: string
  /** `danger` styles the action destructively. Use it only when something is
   *  actually removed or overwritten. */
  tone?: 'danger' | 'neutral'
}

interface PendingConfirm extends ConfirmInput {
  resolve: (confirmed: boolean) => void
}

/**
 * Hosts one themed confirmation dialog for the whole app.
 *
 * Mounted at the router root rather than inside AppShell because the public
 * layer (auth, nav) needs it too, and those routes render outside the shell.
 */
export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<PendingConfirm | null>(null)
  // A confirm that never settles would leave the caller awaiting forever, so
  // the resolver is held separately and always called on close.
  const resolveRef = useRef<((confirmed: boolean) => void) | null>(null)

  const settle = useCallback((confirmed: boolean) => {
    resolveRef.current?.(confirmed)
    resolveRef.current = null
    setPending(null)
  }, [])

  const confirm = useCallback((input: ConfirmInput) => new Promise<boolean>((resolve) => {
    // A second request while one is open resolves the first as declined
    // rather than dropping it. Nothing destructive proceeds by default.
    resolveRef.current?.(false)
    resolveRef.current = resolve
    setPending({ ...input, resolve })
  }), [])

  useEffect(() => () => { resolveRef.current?.(false) }, [])

  const danger = pending?.tone === 'danger'

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <AlertDialog
        open={Boolean(pending)}
        onOpenChange={(open) => { if (!open) settle(false) }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia className={danger ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}>
              {danger ? <AlertTriangle className="size-7" /> : <HelpCircle className="size-7" />}
            </AlertDialogMedia>
            <AlertDialogTitle>{pending?.title}</AlertDialogTitle>
            {pending?.description && (
              <AlertDialogDescription>{pending.description}</AlertDialogDescription>
            )}
          </AlertDialogHeader>
          <AlertDialogFooter>
            {pending?.onExport && <Button variant="outline" onClick={pending.onExport}>Export a backup first</Button>}
            <AlertDialogCancel onClick={() => settle(false)}>
              {pending?.cancelLabel ?? 'Cancel'}
            </AlertDialogCancel>
            <Button
              variant={danger ? 'destructive' : 'default'}
              onClick={() => settle(true)}
            >
              {pending?.confirmLabel ?? 'Confirm'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ConfirmContext.Provider>
  )
}
