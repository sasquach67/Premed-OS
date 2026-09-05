import { useContext } from 'react'
import { ConfirmContext } from '@/components/common/confirm-context'

/**
 * Themed replacement for `window.confirm`.
 *
 *     if (!(await confirm({ title: 'Delete BIOL 103?', tone: 'danger' }))) return
 *
 * A native `confirm()` cannot be styled, ignores both themes, blocks the main
 * thread, and on several browsers offers a "prevent this page from creating
 * more dialogs" checkbox that silently turns every later confirmation into an
 * automatic no. Destructive actions in this app must not be able to fail that
 * way, and must not fail open.
 */
export function useConfirm() {
  const confirm = useContext(ConfirmContext)
  if (!confirm) throw new Error('useConfirm must be used within ConfirmProvider')
  return confirm
}
