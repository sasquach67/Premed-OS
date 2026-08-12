import { useEffect, useState, type ReactNode } from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { Maximize2, Minimize2, PanelLeft, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { SidePeek } from '@/components/common/SidePeek'
import { cn } from '@/lib/utils'

export const RECORD_OPEN_MODES = ['peek', 'split', 'expanded'] as const
export type RecordOpenMode = (typeof RECORD_OPEN_MODES)[number]

export function CenterPeek({
  open,
  mode,
  label,
  hasUnsavedChanges = false,
  children,
  onOpenChange,
  onModeChange,
}: {
  open: boolean
  mode: RecordOpenMode
  label: string
  hasUnsavedChanges?: boolean
  children: ReactNode
  onOpenChange: (open: boolean) => void
  onModeChange: (mode: RecordOpenMode) => void
}) {
  const [confirmClose, setConfirmClose] = useState(false)
  const [mobile, setMobile] = useState(() => typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches)

  function requestClose() {
    if (hasUnsavedChanges) {
      setConfirmClose(true)
      return
    }
    onOpenChange(false)
  }

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      const command = event.metaKey || event.ctrlKey
      if (command && event.key === '\\') {
        event.preventDefault()
        onModeChange(mode === 'split' ? 'peek' : 'split')
      }
      if (command && event.key === '.') {
        event.preventDefault()
        onModeChange(mode === 'expanded' ? 'peek' : 'expanded')
      }
      if (event.key === 'Escape' && mode !== 'peek') {
        event.preventDefault()
        onModeChange('peek')
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [mode, onModeChange, open])

  useEffect(() => {
    const media = window.matchMedia('(max-width: 767px)')
    const onChange = () => setMobile(media.matches)
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

  if (!open) return null

  const controls = (
    <div className="flex shrink-0 items-center gap-1" aria-label="Record view controls">
      <Button
        type="button"
        size="sm"
        variant={mode === 'split' ? 'secondary' : 'ghost'}
        onClick={() => onModeChange(mode === 'split' ? 'peek' : 'split')}
        aria-label="Split record view"
      >
        <PanelLeft className="size-4" aria-hidden="true" />
        <span className="hidden sm:inline">Split</span>
      </Button>
      <Button
        type="button"
        size="sm"
        variant={mode === 'expanded' ? 'secondary' : 'ghost'}
        onClick={() => onModeChange(mode === 'expanded' ? 'peek' : 'expanded')}
        aria-label={mode === 'expanded' ? 'Collapse record' : 'Expand record'}
      >
        {mode === 'expanded'
          ? <Minimize2 className="size-4" aria-hidden="true" />
          : <Maximize2 className="size-4" aria-hidden="true" />}
        <span className="hidden sm:inline">{mode === 'expanded' ? 'Collapse' : 'Expand'}</span>
      </Button>
      <Button type="button" size="sm" variant="ghost" onClick={requestClose} aria-label="Close record">
        <X className="size-4" aria-hidden="true" />
        <span className="hidden sm:inline">Close</span>
      </Button>
    </div>
  )

  const content = (
    <>
      <div className="flex min-h-14 items-center justify-between gap-3 border-b border-border bg-card/70 px-3 py-2 md:px-4">
        <span className="min-w-0 truncate text-sm font-bold text-muted-foreground">{label}</span>
        {controls}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
    </>
  )

  return (
    <>
      {mobile ? (
        <SidePeek
          open
          fullScreen
          hideClose
          title={label}
          headerActions={controls}
          onOpenChange={(next) => {
            if (!next) requestClose()
          }}
        >
          {children}
        </SidePeek>
      ) : mode === 'expanded' ? (
        <section className="min-h-[calc(100svh-10rem)] overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          {content}
        </section>
      ) : (
        <DialogPrimitive.Root
          open
          onOpenChange={(next) => {
            if (!next) requestClose()
          }}
        >
          <DialogPrimitive.Portal>
            <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-foreground/35 backdrop-blur-sm motion-safe:data-[state=open]:animate-in motion-safe:data-[state=open]:fade-in-0" />
            <DialogPrimitive.Content
              aria-label={label}
              className={cn(
                'fixed z-50 flex overflow-hidden border border-border glass-surface shadow-2xl outline-none',
                'inset-0 h-svh w-screen flex-col rounded-none',
                'lg:inset-auto lg:left-1/2 lg:top-1/2 lg:h-[85vh] lg:-translate-x-1/2 lg:-translate-y-1/2 lg:rounded-3xl',
                mode === 'peek' && 'lg:w-[min(920px,72vw)]',
                mode === 'split' && 'lg:w-[min(1180px,92vw)]',
                'motion-safe:data-[state=open]:animate-in motion-safe:data-[state=open]:fade-in-0 motion-safe:lg:data-[state=open]:zoom-in-95'
              )}
              onEscapeKeyDown={(event) => {
                if (mode !== 'peek') event.preventDefault()
              }}
            >
              <DialogPrimitive.Title className="sr-only">{label}</DialogPrimitive.Title>
              {content}
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
      )}

      <Dialog open={confirmClose} onOpenChange={setConfirmClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Discard unsaved changes?</DialogTitle>
            <DialogDescription>Your latest edits have not been saved yet.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmClose(false)}>Keep editing</Button>
            <Button
              variant="destructive"
              onClick={() => {
                setConfirmClose(false)
                onOpenChange(false)
              }}
            >
              Discard changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
