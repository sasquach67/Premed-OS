import { useSyncExternalStore } from 'react'
import { workspaceScopedKey } from '@/lib/demoMode'
import { useStore } from '@/store/store'

export type NotebookGuideView = 'standard' | 'map'
const BASE = 'premed-os:notebook-guide-view:v1'
const CHANGED = 'premed:notebook-guide-view'
// If browser storage is unavailable, the choice still works for this session.
const sessionChoices = new Map<string, NotebookGuideView>()
export function notebookGuideViewKey() {
  try { return workspaceScopedKey(BASE) } catch { return null }
}
function snapshot() {
  const key = notebookGuideViewKey()
  if (!key) return '\nstandard'
  let value: string | null = null
  try { value = localStorage.getItem(key) } catch { /* Standard is the safe default. */ }
  return `${key}\n${sessionChoices.get(key) ?? (value === 'map' ? 'map' : 'standard')}`
}
function subscribe(notify: () => void) {
  const unsubscribe = useStore.subscribe(notify)
  window.addEventListener('storage', notify)
  window.addEventListener(CHANGED, notify)
  return () => { unsubscribe(); window.removeEventListener('storage', notify); window.removeEventListener(CHANGED, notify) }
}
/** Browser-local presentation preference, partitioned by account, guest and demo. */
export function useNotebookGuideView() {
  const value = useSyncExternalStore(subscribe, snapshot, () => '\nstandard')
  const [key, view] = value.split('\n') as [string, NotebookGuideView]
  function choose(next: NotebookGuideView) {
    if (!key || key !== notebookGuideViewKey()) return
    try { localStorage.setItem(key, next); sessionChoices.delete(key) } catch { sessionChoices.set(key, next) }
    window.dispatchEvent(new Event(CHANGED))
  }
  return { view, choose }
}
