import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { createPersonalInitialData } from '@/data/personalInitialData'
import { AccountConflictReview } from './AccountConflictReview'
import { compareAccountCopies } from '@/store/accountCopyComparison'
const mock = vi.hoisted(() => ({ prepare: vi.fn(), apply: vi.fn(), dispose: vi.fn() }))
vi.mock('@/store/accountMutationSafety', () => ({ prepareAccountConflictResolution: mock.prepare }))
let root: Root, container: HTMLDivElement
const conflict = () => ({ localRaw: '{}', remote: createPersonalInitialData(), saved: true, message: '' })
const fixture = () => {
  const device = createPersonalInitialData(), cloud = createPersonalInitialData()
  device.notes['device-note'] = 'Device only'; cloud.notes['cloud-note'] = 'Cloud only'
  return { device, cloud, deviceSavedAt: Date.parse('2026-09-22T00:00:00Z'), updatedAt: '2026-09-21T00:00:00Z', apply: mock.apply, dispose: mock.dispose }
}
beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  mock.prepare.mockReset(); mock.apply.mockReset(); mock.dispose.mockReset()
  mock.prepare.mockResolvedValue(fixture())
  container = document.createElement('div'); document.body.append(container); root = createRoot(container)
})
afterEach(async () => { await act(async () => root.unmount()); container.remove(); vi.unstubAllGlobals() })
function button(name: string) { return [...container.querySelectorAll('button')].find(b => b.textContent === name)! }
it('prepares verified copies automatically and keeps detailed review collapsed', async () => {
  await act(async () => root.render(<AccountConflictReview userId="synthetic" conflict={conflict()} downloads={<a href="#download">Download cloud account JSON</a>} />))
  expect(mock.prepare).toHaveBeenCalledTimes(1)
  expect(mock.apply).not.toHaveBeenCalled()
  expect(container.querySelector('details')?.open).toBe(false)
  expect(container.querySelector('summary')?.textContent).toBe('See differences')
  expect(container.querySelector('details a')?.textContent).toBe('Download cloud account JSON')
  expect(button('Keep newest').getAttribute('aria-label')).toBe('Keep newest — this device')
  await act(async () => button('Keep newest').click())
  expect(mock.apply).toHaveBeenCalledExactlyOnceWith('device', expect.any(Function))
})
it('recommends cloud when it is newer, and the other-copy button selects device', async () => {
  mock.prepare.mockResolvedValue({ ...fixture(), deviceSavedAt: Date.parse('2026-09-20T00:00:00Z') })
  await act(async () => root.render(<AccountConflictReview userId="synthetic" conflict={conflict()} />))
  expect(button('Keep newest').getAttribute('aria-label')).toBe('Keep newest — cloud')
  expect(button('Keep the other copy').getAttribute('aria-label')).toBe('Keep the other copy — this device')
  await act(async () => button('Keep the other copy').click())
  expect(mock.apply).toHaveBeenCalledExactlyOnceWith('device', expect.any(Function))
})
it.each([null, Date.parse('2026-09-21T00:00:00Z')])('uses explicit choices when no newer copy is known (%s)', async deviceSavedAt => {
  mock.prepare.mockResolvedValue({ ...fixture(), deviceSavedAt })
  await act(async () => root.render(<AccountConflictReview userId="synthetic" conflict={conflict()} />))
  expect(button('Keep newest')).toBeUndefined()
  expect(button('Keep this device')).toBeTruthy()
  await act(async () => button('Keep cloud').click())
  expect(mock.apply).toHaveBeenCalledExactlyOnceWith('cloud', expect.any(Function))
})
it('retains the detailed unselected choice and acknowledgement', async () => {
  await act(async () => root.render(<AccountConflictReview userId="synthetic" conflict={conflict()} />))
  await act(async () => container.querySelector('summary')!.click())
  expect(container.querySelector('details')?.open).toBe(true)
  expect(container.textContent).toContain('Device only'); expect(container.textContent).toContain('Cloud only')
  expect(container.querySelector('input:checked')).toBeNull()
  expect(button('Use selected copy and resume sync').disabled).toBe(true)
  await act(async () => container.querySelector<HTMLInputElement>('input[type="radio"]')!.click())
  expect(button('Use selected copy and resume sync').disabled).toBe(true)
  await act(async () => container.querySelector<HTMLInputElement>('input[type="checkbox"]')!.click())
  await act(async () => button('Use selected copy and resume sync').click())
  expect(mock.apply).toHaveBeenCalledExactlyOnceWith('device', expect.any(Function))
})
it('compares records by ID and bounds the rendered differences without treating key order as a change', () => {
  const device = createPersonalInitialData(), cloud = structuredClone(device)
  for (let i = 0; i < 100; i++) device.notes[String(i)] = `note ${i}`
  expect(compareAccountCopies(device, cloud)).toHaveLength(60)
  expect(compareAccountCopies(cloud, structuredClone(cloud))).toEqual([])
})
it('disposes a stale preparation when a new conflict arrives', async () => {
  let resolve!: (review: unknown) => void
  const abandoned = { ...fixture(), dispose: vi.fn(), apply: vi.fn() }
  mock.prepare.mockImplementationOnce(() => new Promise(r => { resolve = r }))
  await act(async () => root.render(<AccountConflictReview userId="synthetic" conflict={conflict()} />))
  expect(container.textContent).toContain('Checking saved copies…')
  await act(async () => root.render(<AccountConflictReview userId="synthetic" conflict={conflict()} />))
  expect(button('Keep newest')).toBeTruthy()
  await act(async () => resolve(abandoned))
  expect(abandoned.dispose).toHaveBeenCalledTimes(1)
  expect(button('Keep newest')).toBeTruthy()
  expect(mock.apply).not.toHaveBeenCalled()
})
it('does not offer ordinary resolution for unsaved or blocked copies', async () => {
  for (const overrides of [{ saved: false }, { schemaBlocked: true }, { remote: null }, { open: { data: createPersonalInitialData(), key: 'synthetic', raw: null } }]) {
    await act(async () => root.render(<AccountConflictReview userId="synthetic" conflict={{ ...conflict(), ...overrides }} />))
    expect(button('Keep newest')).toBeUndefined()
  }
  expect(mock.prepare).not.toHaveBeenCalled()
})
it('keeps failure actionable and requires a fresh preparation after a rejected choice', async () => {
  mock.apply.mockRejectedValueOnce(new Error('The cloud copy changed after review.'))
  await act(async () => root.render(<AccountConflictReview userId="synthetic" conflict={conflict()} />))
  await act(async () => button('Keep newest').click())
  expect(container.querySelector('[role="alert"]')?.textContent).toContain('cloud copy changed')
  expect(button('Keep newest')).toBeUndefined()
  await act(async () => button('Retry checking copies').click())
  expect(mock.prepare).toHaveBeenCalledTimes(2)
  expect(button('Keep newest')).toBeTruthy()
})
it('shows only known-section differences and explains opaque preservation before approval', async () => {
  const device = { ...createPersonalInitialData(), futureCollection: { secretOpaqueLabel: 'device unknown' }, _schema: 1 }
  const cloud = { ...createPersonalInitialData(), futureCollection: { secretOpaqueLabel: 'cloud unknown' }, futureOnly: ['opaque'], _schema: 1 }
  device.notes.changed = 'Known device note'; cloud.notes.changed = 'Known cloud note'
  expect(compareAccountCopies(device, cloud)).toEqual([{ path: 'notes.changed', device: '"Known device note"', cloud: '"Known cloud note"' }])
  mock.prepare.mockResolvedValue({ ...fixture(), device, cloud })
  await act(async () => root.render(<AccountConflictReview userId="synthetic" conflict={conflict()} />))
  expect(container.textContent).toContain('Known device note')
  expect(container.textContent).toContain('Unknown sections are carried through')
  expect(container.textContent).toContain('this review cannot delete them')
  expect(container.textContent).not.toContain('futureCollection')
  expect(container.textContent).not.toContain('secretOpaqueLabel')
})

it('shows the selected copy and real image progress while saving, then offers a fresh check after a stall', async () => {
  let progress!: (message: string) => void
  let rejectSave!: (cause: Error) => void
  mock.apply.mockImplementationOnce((_selected: string, onProgress: (message: string) => void) => {
    progress = onProgress
    return new Promise((_resolve, reject) => { rejectSave = reject })
  })
  await act(async () => root.render(<AccountConflictReview userId="synthetic" conflict={conflict()} />))
  await act(async () => button('Keep the other copy').click())
  expect(container.textContent).toContain('Keeping: Cloud')
  expect(container.querySelector<HTMLInputElement>('input[type="radio"]:checked')?.parentElement?.textContent).toContain('Use cloud')
  expect(container.querySelector('[role="status"]')?.textContent).toBe('Preparing your choice…')
  expect(button('Keep newest').disabled).toBe(true)
  await act(async () => progress('Checking notebook images (3 of 12)…'))
  expect(container.querySelector('[role="status"]')?.textContent).toBe('Checking notebook images (3 of 12)…')
  expect(container.textContent).not.toContain('Checking saved copies…')
  await act(async () => rejectSave(new Error('Image check stopped responding. Retry checking copies.')))
  expect(container.querySelector('[role="status"]')).toBeNull()
  expect(container.textContent).not.toContain('Keeping: Cloud')
  expect(button('Retry checking copies').disabled).toBe(false)
  await act(async () => progress('Late result from abandoned check'))
  expect(container.textContent).not.toContain('Late result')
  await act(async () => button('Retry checking copies').click())
  expect(mock.prepare).toHaveBeenCalledTimes(2)
  expect(container.querySelector('input:checked')).toBeNull()
})
it('ignores progress from a choice belonging to an older conflict', async () => {
  let progress!: (message: string) => void
  let resolveSave!: () => void
  mock.apply.mockImplementationOnce((_selected: string, onProgress: (message: string) => void) => {
    progress = onProgress
    return new Promise<void>(resolve => { resolveSave = resolve })
  })
  await act(async () => root.render(<AccountConflictReview userId="synthetic" conflict={conflict()} />))
  await act(async () => button('Keep newest').click())
  expect(container.textContent).toContain('Keeping: This device')
  await act(async () => root.render(<AccountConflictReview userId="synthetic" conflict={conflict()} />))
  await act(async () => progress('Old image progress'))
  expect(container.textContent).not.toContain('Old image progress')
  expect(button('Keep newest').disabled).toBe(false)
  await act(async () => resolveSave())
})
