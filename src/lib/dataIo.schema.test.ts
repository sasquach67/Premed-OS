import { CURRENT_CLOUD_SCHEMA } from '@/lib/workspaceSchema'
import { expect, it, vi } from 'vitest'
import { createPersonalInitialData } from '@/data/personalInitialData'
vi.mock('@/store/store', () => ({ snapshotData: vi.fn() }))
import { readJsonFile } from './dataIo'

const file = (data: unknown) => ({ text: async () => JSON.stringify(data) }) as File
it('normalizes legacy JSON and preserves supported opaque metadata', async () => {
  const data = Object.assign(createPersonalInitialData(), { futureResearch: [{ id: 'synthetic', value: 1 }] })
  expect(await readJsonFile(file(data))).toEqual({ ...data, _schema: CURRENT_CLOUD_SCHEMA })
  expect(await readJsonFile(file({ ...data, _schema: CURRENT_CLOUD_SCHEMA }))).toEqual({ ...data, _schema: CURRENT_CLOUD_SCHEMA })
})
it('rejects future and invalid JSON schema markers before restore', async () => {
  for (const _schema of [CURRENT_CLOUD_SCHEMA + 1, null, '1', 0.5]) {
    await expect(readJsonFile(file({ ...createPersonalInitialData(), _schema }))).rejects.toThrow()
  }
})

it('schema 2 imports an unmarked Research backup with its text intact', async () => {
  const data = { ...createPersonalInitialData(), persons: [{ id: 'p', name: 'Synthetic', bio: '  Unedited bio  ' }] }
  expect(await readJsonFile(file(data))).toEqual({ ...data, _schema: CURRENT_CLOUD_SCHEMA })
})
