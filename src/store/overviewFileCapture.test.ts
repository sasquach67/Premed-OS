import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const files = vi.hoisted(() => ({ retainThenPersistStoryAttachment: vi.fn(), removeStoryAttachment: vi.fn() }))

vi.mock('@/lib/overviewFileCapture', () => files)

import { createSeedData } from '@/data/seed'
import { useStore } from '@/store/store'

function reset() {
  const data = createSeedData()
  data.stories = []
  useStore.getState().replaceAll(data)
}

beforeEach(() => {
  vi.clearAllMocks()
  reset()
})

afterEach(reset)

describe('createOverviewFileCapture', () => {
  it('does not create a Story Bank record when local retention fails', async () => {
    files.retainThenPersistStoryAttachment.mockRejectedValue(new Error('quota'))

    await expect(useStore.getState().createOverviewFileCapture(new File(['x'], 'note.pdf'))).resolves.toBeNull()
    expect(useStore.getState().stories).toEqual([])
  })

  it('creates exactly one local-only Story Bank file record after retention succeeds', async () => {
    files.retainThenPersistStoryAttachment.mockImplementation(async (_id: string, _file: File, persist: (attachment: unknown) => unknown) => persist({ blobRef: 'idb://overview/capture/story', fileName: 'note.pdf', mimeType: 'application/pdf', fileSize: 1, storage: 'device-local' }))

    const id = await useStore.getState().createOverviewFileCapture(new File(['x'], 'note.pdf', { type: 'application/pdf' }), { commentary: 'Read after lab', localOnly: true })
    const story = useStore.getState().stories.find((item) => item.id === id)

    expect(story).toMatchObject({ commentary: 'Read after lab', origin: 'overview', localOnly: true, attachment: { fileName: 'note.pdf', storage: 'device-local' } })
    expect(JSON.stringify(story)).not.toContain('data:')
  })

  it('keeps the blob through Trash and requests cleanup only on permanent deletion', async () => {
    files.retainThenPersistStoryAttachment.mockImplementation(async (_id: string, _file: File, persist: (attachment: unknown) => unknown) => persist({ blobRef: 'idb://overview/capture/story', fileName: 'note.pdf', mimeType: 'application/pdf', fileSize: 1, storage: 'device-local' }))
    files.removeStoryAttachment.mockResolvedValue(undefined)
    const id = await useStore.getState().createOverviewFileCapture(new File(['x'], 'note.pdf'))

    useStore.getState().softDeleteItems('stories', [id!])
    expect(files.removeStoryAttachment).not.toHaveBeenCalled()
    const trashId = useStore.getState().trash.find((item) => item.collection === 'stories' && item.record.id === id)?.id
    useStore.getState().permanentlyDeleteTrashItems([trashId!])
    await Promise.resolve()

    expect(files.removeStoryAttachment).toHaveBeenCalledWith(expect.objectContaining({ attachment: expect.objectContaining({ blobRef: 'idb://overview/capture/story' }) }))
  })
})
