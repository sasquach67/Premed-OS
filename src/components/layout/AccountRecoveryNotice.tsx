import { useSyncExternalStore } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2 } from 'lucide-react'
import { getAccountRecoveryNotice, subscribeAccountConflicts } from '@/store/accountSyncSafety'

export function AccountRecoveryNotice({ userId }: { userId?: string }) {
  const message = useSyncExternalStore(subscribeAccountConflicts, () => getAccountRecoveryNotice(userId))
  if (!message) return null
  return <p role="status" className="mx-4 mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
    <CheckCircle2 aria-hidden="true" className="size-4 shrink-0" /><span className="min-w-0 flex-1">{message}</span>
    <Link to="/settings" className="underline">Open Settings</Link>
  </p>
}
