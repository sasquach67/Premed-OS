import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { AlertCircle, CheckCircle2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { uid } from '@/lib/id'
import { ToastContext } from '@/components/common/toast-context'

export interface ToastInput {
  title: string
  description?: string
  tone?: 'success' | 'error' | 'info'
  onOpen?: () => void
  onUndo?: () => void
  duration?: number
}

interface ToastEntry extends ToastInput {
  id: string
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastEntry[]>([])

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const toast = useCallback((input: ToastInput) => {
    const id = uid()
    setToasts((current) => [...current, { ...input, id }])
    return id
  }, [])

  const value = useMemo(() => ({ toast }), [toast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-20 right-4 z-[80] flex max-h-[80svh] w-[min(24rem,calc(100vw-2rem))] flex-col gap-2 overflow-y-auto" aria-live="polite" aria-atomic="false">
        {toasts.map((entry) => (
          <ToastSurface key={entry.id} entry={entry} dismiss={dismiss} className="pointer-events-auto rounded-2xl border border-border bg-card p-3 shadow-xl motion-safe:animate-in motion-safe:slide-in-from-bottom-2">
            <div className="flex items-start gap-3">
              {entry.tone === 'error'
                ? <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden="true" />
                : <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-extrabold">{entry.title}</p>
                {entry.description && <p className="mt-0.5 text-xs text-muted-foreground">{entry.description}</p>}
                {(entry.onOpen || entry.onUndo) && (
                  <div className="mt-2 flex gap-2">
                    {entry.onOpen && <Button size="sm" variant="ghost" onClick={() => { entry.onOpen?.(); dismiss(entry.id) }}>Open</Button>}
                    {entry.onUndo && <Button size="sm" variant="ghost" onClick={() => { entry.onUndo?.(); dismiss(entry.id) }}>Undo</Button>}
                  </div>
                )}
              </div>
              <button type="button" className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted" onClick={() => dismiss(entry.id)} aria-label="Dismiss notification">
                <X className="size-4" />
              </button>
            </div>
          </ToastSurface>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

function ToastSurface({ entry, dismiss, children, className }: { entry: ToastEntry; dismiss: (id: string) => void; children: ReactNode; className: string }) {
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  useEffect(() => {
    if (hovered || focused || entry.onUndo || entry.onOpen) return
    const timer = window.setTimeout(() => dismiss(entry.id), entry.duration ?? 5000)
    return () => window.clearTimeout(timer)
  }, [entry, dismiss, hovered, focused])
  return <div className={className} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} onFocusCapture={() => setFocused(true)} onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false) }}>{children}</div>
}
