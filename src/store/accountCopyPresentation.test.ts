import { expect, it } from 'vitest'
import { createPersonalInitialData } from '@/data/personalInitialData'
import { accountCopySavedTime, accountCopyUniqueSummary, newestAccountCopy } from './accountCopyPresentation'

it('recommends by valid saved timestamps, not counts, with no guess for ties or missing times', () => {
  const time = Date.parse('2026-09-28T12:00:00Z')
  expect(newestAccountCopy(time, '2026-09-27T12:00:00Z')).toBe('device')
  expect(newestAccountCopy(time, '2026-09-29T12:00:00Z')).toBe('cloud')
  expect(newestAccountCopy(time, '2026-09-28T12:00:00Z')).toBeNull()
  for (const missing of [null, undefined, NaN, 0]) expect(newestAccountCopy(missing, '2026-09-28T12:00:00Z')).toBeNull()
  expect(newestAccountCopy(time, 'not a date')).toBeNull()
  expect(accountCopySavedTime(null)).toBe('Saved time unavailable')
  expect(accountCopySavedTime('not a date')).toBe('Saved time unavailable')
  expect(accountCopySavedTime(time)).toMatch(/^Saved /)
})
it('summarizes unique records by IDs, including notebooks and Research logs, without counting edits as additions', () => {
  const device = createPersonalInitialData(), cloud = structuredClone(device)
  device.academics.classCenter.lectures = [{ id: 'notebook-1' }] as typeof device.academics.classCenter.lectures
  device.experiences = [{ id: 'lab', category: 'research' }] as typeof device.experiences
  cloud.experiences = structuredClone(device.experiences)
  device.experienceHourEntries = [{ id: 'log-1', experienceId: 'lab', hours: 0 }] as typeof device.experienceHourEntries
  expect(accountCopyUniqueSummary(device, cloud, 'device')).toBe('1 notebook, 1 Research log entry only on this device. Other edits may differ too.')
  cloud.academics.classCenter.lectures = [{ id: 'notebook-1', title: 'edited' }] as typeof cloud.academics.classCenter.lectures
  cloud.experienceHourEntries = structuredClone(device.experienceHourEntries)
  expect(accountCopyUniqueSummary(device, cloud, 'device')).toContain('Existing records or other settings differ')
})
