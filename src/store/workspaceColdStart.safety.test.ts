import { expect, it, vi } from 'vitest'
import { createPersonalInitialData } from '@/data/personalInitialData'

it('hydrates an existing account when the export module is the cold entry point', async () => {
  vi.resetModules(); localStorage.clear(); sessionStorage.clear()
  const data = createPersonalInitialData(); data.notes.example = 'Existing cold-start note'
  const key = 'hq:app-data:account:synthetic-cold-start'
  localStorage.setItem('hq:workspace-owner', 'account:synthetic-cold-start')
  const raw = JSON.stringify({ state: data, version: 50 })
  localStorage.setItem(key, raw)
  await import('@/lib/dataIo')
  const { useStore, snapshotData } = await import('./store')
  expect(useStore.persist.hasHydrated()).toBe(true)
  expect(snapshotData().notes.example).toBe('Existing cold-start note')
  expect(localStorage.getItem(key)).toBe(raw)
})
