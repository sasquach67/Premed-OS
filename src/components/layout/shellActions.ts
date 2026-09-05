import { createContext, useContext } from 'react'
export type QuickAddKind = 'task' | 'course' | 'assignment' | 'hours' | 'experience' | 'mistake' | 'school' | 'story' | 'note'

export interface ShellActionsValue {
  openQuickAdd: (kind?: QuickAddKind) => void
  closeQuickAdd: () => void
  requestSignOut: () => void
  toggleSidebar?: () => void
  quickAddOpen: boolean
  quickAddKind?: QuickAddKind
}

export const ShellActionsContext = createContext<ShellActionsValue | null>(null)

export function useShellActions() {
  const value = useContext(ShellActionsContext)
  if (!value) throw new Error('useShellActions must be used inside ShellActionsProvider')
  return value
}
