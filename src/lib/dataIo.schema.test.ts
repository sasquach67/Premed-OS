import { expect, it, vi } from 'vitest'
import { createPersonalInitialData } from '@/data/personalInitialData'
vi.mock('@/store/store', () => ({ snapshotData: vi.fn() }))
import { readJsonFile } from './dataIo'

const file = (data: unknown) => ({ text: async () => JSON.stringify(data) }) as File
it('normalizes legacy JSON and preserves supported opaque metadata', async () => {
  const data = Object.assign(createPersonalInitialData(), { futureResearch: [{ id: 'synthetic', value: 1 }] })
  expect(await readJsonFile(file(data))).toEqual({ ...data, _schema: 1 })
  expect(await readJsonFile(file({ ...data, _schema: 1 }))).toEqual({ ...data, _schema: 1 })
})
it('rejects future and invalid JSON schema markers before restore', async () => {
  for (const _schema of [2, null, '1', 0.5]) {
    await expect(readJsonFile(file({ ...createPersonalInitialData(), _schema }))).rejects.toThrow()
  }
})

it('S1 refuses to import an unmarked Research (T4) backup into a schema-1 app', async () => {
  const data = { ...createPersonalInitialData(), researchTimelineNotes: [{ id: 'n', experienceId: 'e', date: '2026-09-01', text: 'x', createdAt: 1, updatedAt: 1 }] }
  await expect(readJsonFile(file(data))).rejects.toThrow('Research data')
})
