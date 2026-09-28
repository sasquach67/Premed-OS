import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { createPersonalInitialData } from '@/data/personalInitialData'
import type { AccountConflict } from '@/store/accountSyncSafety'
import { AccountSyncNotice } from './AccountSyncNotice'
const mock = vi.hoisted(() => ({ conflict: undefined as AccountConflict | undefined, review: vi.fn() }))
vi.mock('@/store/accountSyncSafety', () => ({
  getAccountConflict: () => mock.conflict,
  subscribeAccountConflicts: () => () => {},
  captureSyncSession: () => ({ id: 'synthetic' }),
  assertSyncSession: vi.fn(),
}))
vi.mock('./AccountConflictReview', () => ({ AccountConflictReview: (props: { downloads: React.ReactNode }) => { mock.review(props); return <details><summary>See differences</summary>{props.downloads}</details> } }))
let root: Root, container: HTMLDivElement
beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  const data = createPersonalInitialData()
  mock.conflict = { localRaw: JSON.stringify({ state: data }), remote: data, saved: true, message: 'Original recovery detail' }
  mock.review.mockClear()
  container = document.createElement('div'); document.body.append(container); root = createRoot(container)
})
afterEach(async () => { await act(async () => root.unmount()); container.remove(); vi.unstubAllGlobals() })
it('keeps download links inside differences for a verified ordinary conflict', async () => {
  await act(async () => root.render(<AccountSyncNotice userId="synthetic" />))
  expect(mock.review).toHaveBeenCalled()
  expect(container.textContent).toContain('Choose which copy to keep')
  expect(container.textContent).not.toContain('Original recovery detail')
  expect(container.querySelector('details')?.open).toBe(false)
  expect([...container.querySelectorAll('details button')].map(b => b.textContent)).toEqual(['Download exact device cache', 'Download device account JSON', 'Download cloud account JSON'])
})
it.each(['schema', 'unverified', 'unreadable', 'open'] as const)('retains immediate recovery instructions and downloads for %s', async kind => {
  if (kind === 'schema') mock.conflict!.schemaBlocked = true
  if (kind === 'unverified') mock.conflict!.saved = false
  if (kind === 'unreadable') mock.conflict!.localRaw = 'unreadable'
  if (kind === 'open') mock.conflict!.open = { data: createPersonalInitialData(), key: 'synthetic', raw: null }
  await act(async () => root.render(<AccountSyncNotice userId="synthetic" />))
  expect(mock.review).not.toHaveBeenCalled()
  expect(container.querySelector('[role="alert"]')?.textContent).toBe('Original recovery detail')
  expect(container.querySelector('details')).toBeNull()
  expect([...container.querySelectorAll('button')].some(b => b.textContent === 'Download exact device cache')).toBe(true)
})
