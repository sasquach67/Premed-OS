import { useSyncExternalStore } from 'react'
import { hasRetainedOutgoingWorkspace, subscribeOutgoingWorkspace } from '@/store/workspaceTransitionRecovery'

/** No outgoing account content is exposed while another workspace is open. */
export function OutgoingWorkspaceNotice() {
  const retained = useSyncExternalStore(subscribeOutgoingWorkspace, hasRetainedOutgoingWorkspace)
  return retained ? <aside role="status" className="m-4 rounded-lg border border-amber-500/50 bg-card p-3 text-sm">Unsaved work was kept in this tab when a workspace closed. Return to that workspace to download it before closing this tab.</aside> : null
}
