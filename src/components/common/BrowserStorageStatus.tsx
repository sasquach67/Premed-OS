import { useEffect, useSyncExternalStore } from 'react'
import { persistentStorage, type PersistentStorageStatus } from '@/lib/persistentStorage'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

const descriptions: Record<PersistentStorageStatus, { label: string; detail: string }> = {
  checking: { label: 'Checking', detail: 'Checking this browser’s storage protection.' },
  granted: { label: 'Granted', detail: 'This browser reports persistent storage is enabled for Premed OS, protecting it from automatic storage eviction.' },
  'not-granted': { label: 'Not enabled', detail: 'Persistent storage is not enabled. Premed OS requests it after a successful workspace save.' },
  denied: { label: 'Not granted', detail: 'This browser has not granted persistent storage. Saved work may be removed when the browser needs space.' },
  unsupported: { label: 'Unavailable', detail: 'This browser does not expose the persistence controls needed to confirm protection.' },
  error: { label: 'Could not verify', detail: 'The browser’s storage protection status could not be checked. This does not change your workspace save status.' },
}

export function BrowserStorageStatus() {
  const status = useSyncExternalStore(persistentStorage.subscribe, persistentStorage.getSnapshot)
  useEffect(() => {
    const check = () => { void persistentStorage.recheck() }
    check()
    window.addEventListener('focus', check)
    return () => window.removeEventListener('focus', check)
  }, [])
  const { label, detail } = descriptions[status]
  return (
    <div className="space-y-2 rounded-lg border p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold">Browser storage protection</p>
        <Badge variant="muted">{label}</Badge>
      </div>
      <p className="text-sm text-muted-foreground" role="status">{detail}</p>
      <p className="text-sm text-muted-foreground">Clearing site data or losing this browser profile still removes local work. This protection does not replace a backup.</p>
      <Button variant="ghost" size="sm" disabled={status === 'checking'} onClick={() => void persistentStorage.recheck()}>Recheck protection</Button>
    </div>
  )
}
