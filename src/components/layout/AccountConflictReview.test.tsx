import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { createPersonalInitialData } from '@/data/personalInitialData'
import { AccountConflictReview } from './AccountConflictReview'
import { compareAccountCopies } from '@/store/accountCopyComparison'
const mock = vi.hoisted(() => ({ prepare: vi.fn(), apply: vi.fn(), dispose: vi.fn() }))
vi.mock('@/store/accountMutationSafety', () => ({ prepareAccountConflictResolution: mock.prepare }))
let root: Root, container: HTMLDivElement
beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  mock.prepare.mockReset(); mock.apply.mockReset(); mock.dispose.mockReset()
  const device = createPersonalInitialData(), cloud = createPersonalInitialData()
  device.notes['device-note'] = 'Device only'; cloud.notes['cloud-note'] = 'Cloud only'
  mock.prepare.mockResolvedValue({ device, cloud, updatedAt: '2026-09-21T00:00:00Z', apply: mock.apply, dispose: mock.dispose })
  container = document.createElement('div'); document.body.append(container); root = createRoot(container)
})
afterEach(async () => { await act(async () => root.unmount()); container.remove(); vi.unstubAllGlobals() })
function button(name: string) { return [...container.querySelectorAll('button')].find(b => b.textContent === name)! }
it('requires comparison, an unselected explicit choice, and acknowledgement before applying', async () => {
  await act(async () => root.render(<AccountConflictReview userId="synthetic" conflict={{ localRaw: '{}', remote: createPersonalInitialData(), saved: true, message: '' }} />))
  expect(mock.prepare).not.toHaveBeenCalled()
  await act(async () => button('Compare copies and resume sync').click())
  expect(container.textContent).toContain('Device only'); expect(container.textContent).toContain('Cloud only')
  expect(container.querySelector('input:checked')).toBeNull()
  expect(button('Use selected copy and resume sync').disabled).toBe(true)
  await act(async () => container.querySelector<HTMLInputElement>('input[type="radio"]')!.click())
  expect(button('Use selected copy and resume sync').disabled).toBe(true)
  await act(async () => container.querySelector<HTMLInputElement>('input[type="checkbox"]')!.click())
  await act(async () => button('Use selected copy and resume sync').click())
  expect(mock.apply).toHaveBeenCalledExactlyOnceWith('device')
})
it('compares records by ID and bounds the rendered differences without treating key order as a change', () => {
  const device = createPersonalInitialData(), cloud = structuredClone(device)
  for (let i = 0; i < 100; i++) device.notes[String(i)] = `note ${i}`
  expect(compareAccountCopies(device, cloud)).toHaveLength(60)
  expect(compareAccountCopies(cloud, structuredClone(cloud))).toEqual([])
})
