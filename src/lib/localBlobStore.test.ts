import { beforeEach, describe, expect, it, vi } from 'vitest'

const idb = vi.hoisted(() => ({ set: vi.fn(), get: vi.fn(), del: vi.fn() }))

vi.mock('idb-keyval', () => idb)

import { hasLocalBlob, readLocalBlob, removeLocalBlob, retainLocalBlob } from './localBlobStore'
import { retainLocalSyllabus } from './academics/localSyllabusFiles'

beforeEach(() => vi.clearAllMocks())

describe('local blob store', () => {
  it('retains, reads, checks, and removes a local file without encoding it into app data', async () => {
    const file = new File(['body'], 'notes.pdf', { type: 'application/pdf' })
    idb.set.mockResolvedValue(undefined)
    idb.get.mockResolvedValue(file)
    idb.del.mockResolvedValue(undefined)

    await expect(retainLocalBlob('idb://overview/capture/story-1', file)).resolves.toBe('idb://overview/capture/story-1')
    await expect(readLocalBlob('idb://overview/capture/story-1')).resolves.toBe(file)
    await expect(hasLocalBlob('idb://overview/capture/story-1')).resolves.toBe(true)
    await removeLocalBlob('idb://overview/capture/story-1')

    expect(idb.set).toHaveBeenCalledWith('idb://overview/capture/story-1', file)
    expect(idb.del).toHaveBeenCalledWith('idb://overview/capture/story-1')
  })

  it('preserves the established Academics syllabus key', async () => {
    const file = new File(['syllabus'], 'syllabus.pdf', { type: 'application/pdf' })
    idb.set.mockResolvedValue(undefined)

    await expect(retainLocalSyllabus(file, 'course-file')).resolves.toBe('idb://academics/syllabus/course-file')
    expect(idb.set).toHaveBeenCalledWith('idb://academics/syllabus/course-file', file)
  })
})
