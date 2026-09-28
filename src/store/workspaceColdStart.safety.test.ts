import { expect, it, vi } from 'vitest'
import { prepareWorkspaceData } from '@/lib/workspaceSchema'
import { createPersonalInitialData } from '@/data/personalInitialData'
import { CURRENT_STORE_VERSION } from './workspaceVersion'

it('hydrates an existing account when the export module is the cold entry point', async () => {
  vi.resetModules(); localStorage.clear(); sessionStorage.clear()
  const data = createPersonalInitialData(); data.notes.example = 'Existing cold-start note'
  const key = 'hq:app-data:account:synthetic-cold-start'
  localStorage.setItem('hq:workspace-owner', 'account:synthetic-cold-start')
  const raw = JSON.stringify({ state: prepareWorkspaceData(data), version: CURRENT_STORE_VERSION })
  localStorage.setItem(key, raw)
  await import('@/lib/dataIo')
  const { useStore, snapshotData } = await import('./store')
  expect(useStore.persist.hasHydrated()).toBe(true)
  expect(snapshotData().notes.example).toBe('Existing cold-start note')
  expect(localStorage.getItem(key)).toBe(raw)
})
