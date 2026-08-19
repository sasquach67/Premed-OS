import { useEffect, useState, type ReactNode } from 'react'
import { AlertCircle, Pin, PinOff } from 'lucide-react'
import { CenterPeek, type RecordOpenMode } from '@/components/common/CenterPeek'
import { Button } from '@/components/ui/button'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable'
import { cn } from '@/lib/utils'

export interface OpenableRecord {
  id: string
  label: string
  description?: string
}

export function RecordOpenWorkspace({
  records,
  activeId,
  open,
  mode,
  parentLabel,
  loading = false,
  hasUnsavedChanges,
  onOpenChange,
  onModeChange,
  onSelect,
  renderRecord,
}: {
  records: OpenableRecord[]
  activeId: string | null
  open: boolean
  mode: RecordOpenMode
  parentLabel: string
  loading?: boolean
  hasUnsavedChanges?: boolean
  onOpenChange: (open: boolean) => void
  onModeChange: (mode: RecordOpenMode) => void
  onSelect: (id: string) => void
  renderRecord: (id: string) => ReactNode
}) {
  const [pinnedId, setPinnedId] = useState<string | null>(null)
  const [mobilePane, setMobilePane] = useState<'list' | 'record' | 'pinned'>('record')
  const active = records.find((record) => record.id === activeId)
  const pinned = records.find((record) => record.id === pinnedId)

  useEffect(() => {
    if (!open || mode !== 'split') return
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (target?.matches('input, textarea, select, [contenteditable="true"]')) return
      if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return
      const index = records.findIndex((record) => record.id === activeId)
      if (index < 0) return
      const delta = event.key === 'ArrowDown' ? 1 : -1
      const next = records[Math.max(0, Math.min(records.length - 1, index + delta))]
      if (next && next.id !== activeId) {
        event.preventDefault()
        onSelect(next.id)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [activeId, mode, onSelect, open, records])

  if (!activeId) return null

  if (loading || !active) {
    return (
      <CenterPeek
        open={open}
        mode={mode}
        label={`${parentLabel} / ${loading ? 'Loading record' : 'Record unavailable'}`}
        hasUnsavedChanges={hasUnsavedChanges}
        onOpenChange={onOpenChange}
        onModeChange={onModeChange}
      >
        {loading ? (
          <div className="space-y-4 p-6" aria-label="Loading record">
            <div className="h-7 w-2/5 animate-pulse rounded-lg bg-muted motion-reduce:animate-none" />
            <div className="h-32 animate-pulse rounded-2xl bg-muted motion-reduce:animate-none" />
            <div className="h-24 animate-pulse rounded-2xl bg-muted motion-reduce:animate-none" />
          </div>
        ) : (
          <div className="grid min-h-72 place-items-center p-6 text-center">
            <div>
              <AlertCircle className="mx-auto size-7 text-destructive" aria-hidden="true" />
              <h2 className="mt-3 font-display text-lg font-extrabold">Record unavailable</h2>
              <p className="mt-1 text-sm text-muted-foreground">This record may have been archived or removed.</p>
              <Button className="mt-4" variant="outline" onClick={() => onOpenChange(false)}>Return to {parentLabel}</Button>
            </div>
          </div>
        )}
      </CenterPeek>
    )
  }

  const listPane = (
    <section className="h-full overflow-y-auto border-r border-border bg-muted" aria-label={`${parentLabel} records`}>
      <div className="sticky top-0 z-10 border-b border-border bg-card px-4 py-3">
        <h2 className="font-display text-base font-extrabold">{parentLabel}</h2>
        <p className="text-xs text-muted-foreground">Choose a record or pin one for paired work.</p>
      </div>
      <div className="space-y-2 p-3">
        {records.map((record) => (
          <div
            key={record.id}
            className={cn(
              'flex items-center gap-2 rounded-xl border bg-card p-2',
              record.id === activeId && 'border-primary/50 bg-primary/5'
            )}
          >
            <button
              type="button"
              className="min-w-0 flex-1 rounded-lg px-2 py-1.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onClick={() => {
                onSelect(record.id)
                setMobilePane('record')
              }}
            >
              <span className="block truncate text-sm font-bold">{record.label}</span>
              {record.description && <span className="block truncate text-xs text-muted-foreground">{record.description}</span>}
            </button>
            {record.id !== activeId && (
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={() => {
                  setPinnedId(record.id)
                  setMobilePane('pinned')
                }}
                aria-label={`Pin ${record.label}`}
              >
                <Pin className="size-4" aria-hidden="true" />
              </Button>
            )}
          </div>
        ))}
      </div>
    </section>
  )

  const pinnedPane = pinned ? (
    <section className="relative h-full overflow-y-auto border-r border-border" aria-label={`Pinned record: ${pinned.label}`}>
      <Button
        type="button"
        size="sm"
        variant="secondary"
        className="absolute right-4 top-4 z-10"
        onClick={() => {
          setPinnedId(null)
          setMobilePane('list')
        }}
      >
        <PinOff className="size-4" aria-hidden="true" /> Unpin
      </Button>
      {renderRecord(pinned.id)}
    </section>
  ) : listPane

  return (
    <CenterPeek
      open={open}
      mode={mode}
      label={`${parentLabel} / ${active.label}`}
      hasUnsavedChanges={hasUnsavedChanges}
      onOpenChange={onOpenChange}
      onModeChange={onModeChange}
    >
      {mode === 'split' ? (
        <>
          <div className="flex border-b border-border bg-muted lg:hidden" role="tablist" aria-label="Split view panes">
            {(pinned
              ? ([['record', active.label], ['pinned', pinned.label]] as const)
              : ([['list', parentLabel], ['record', active.label]] as const)
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={mobilePane === id}
                onClick={() => setMobilePane(id)}
                className={cn(
                  'min-w-0 flex-1 truncate border-b-2 px-3 py-3 text-sm font-bold',
                  mobilePane === id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'
                )}
              >
                {label}
              </button>
            ))}
          </div>
          <ResizablePanelGroup orientation="horizontal" className="hidden h-full min-h-0 lg:flex">
            <ResizablePanel defaultSize={50} minSize={30}>{pinnedPane}</ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={50} minSize={30}>
              <section className="h-full overflow-y-auto" aria-label={`Active record: ${active.label}`}>{renderRecord(active.id)}</section>
            </ResizablePanel>
          </ResizablePanelGroup>
          <div className="h-full min-h-0 lg:hidden">
            {mobilePane === 'list' && listPane}
            {mobilePane === 'record' && <section className="h-full overflow-y-auto">{renderRecord(active.id)}</section>}
            {mobilePane === 'pinned' && pinnedPane}
          </div>
        </>
      ) : (
        renderRecord(active.id)
      )}
    </CenterPeek>
  )
}
