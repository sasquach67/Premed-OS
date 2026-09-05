import { useMemo, useState, type ReactNode } from 'react'
import { ShellActionsContext, type QuickAddKind, type ShellActionsValue } from './shellActions'

export function ShellActionsProvider({ children, onRequestSignOut, onToggleSidebar }: { children: ReactNode; onRequestSignOut: () => void; onToggleSidebar?: () => void }) {
  const [state, setState] = useState<{ open: boolean; kind?: QuickAddKind }>({ open: false })
  const value = useMemo<ShellActionsValue>(() => ({
    openQuickAdd: (kind) => setState({ open: true, kind }),
    closeQuickAdd: () => setState({ open: false }),
    requestSignOut: onRequestSignOut,
    toggleSidebar: onToggleSidebar,
    quickAddOpen: state.open,
    quickAddKind: state.kind,
  }), [onRequestSignOut, onToggleSidebar, state])
  return <ShellActionsContext.Provider value={value}>{children}</ShellActionsContext.Provider>
}
