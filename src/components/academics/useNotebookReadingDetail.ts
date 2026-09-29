import { useSyncExternalStore } from 'react'
import { workspaceScopedKey } from '@/lib/demoMode'
import { useStore } from '@/store/store'

export type NotebookReadingDetail = 'full' | 'condensed'
const BASE = 'premed-os:notebook-reading-detail:v1'
const CHANGED = 'premed:notebook-reading-detail'
// If browser storage is unavailable, the choice still works for this session.
const sessionChoices = new Map<string, NotebookReadingDetail>()
export function notebookReadingDetailKey() {
  try { return workspaceScopedKey(BASE) } catch { return null }
}
function snapshot() {
  const key = notebookReadingDetailKey()
  if (!key) return '\nfull\nunavailable'
  let value: string | null = null
  try { value = localStorage.getItem(key) } catch { /* Full detail is the safe default. */ }
  return `${key}\n${sessionChoices.get(key) ?? (value === 'condensed' ? 'condensed' : 'full')}\n${sessionChoices.has(key) ? 'temporary' : 'saved'}`
}
function subscribe(notify: () => void) {
  const unsubscribe = useStore.subscribe(notify)
  window.addEventListener('storage', notify)
  window.addEventListener(CHANGED, notify)
  return () => { unsubscribe(); window.removeEventListener('storage', notify); window.removeEventListener(CHANGED, notify) }
}
/** Browser-local presentation preference, partitioned by account, guest and demo. */
export function useNotebookReadingDetail() {
  const value = useSyncExternalStore(subscribe, snapshot, () => '\nfull')
  const [key, detail, persistence] = value.split('\n') as [string, NotebookReadingDetail, string]
  function choose(next: NotebookReadingDetail) {
    // A retained event handler must not write into the next account's namespace.
    if (!key || key !== notebookReadingDetailKey()) return
    try {
      localStorage.setItem(key, next)
      sessionChoices.delete(key)
    } catch {
      sessionChoices.set(key, next)
    }
    window.dispatchEvent(new Event(CHANGED))
  }
  return { detail, choose, temporary: persistence === 'temporary', available: Boolean(key) }
}
