import { beforeEach, describe, expect, it, vi } from 'vitest'

const blobs = vi.hoisted(() => ({ retainLocalBlob: vi.fn(), hasLocalBlob: vi.fn(), removeLocalBlob: vi.fn() }))

vi.mock('@/lib/localBlobStore', () => blobs)

import {
  overviewCaptureBlobRef,
  removeStoryAttachment,
  retainStoryAttachment,
  retainThenPersistStoryAttachment,
  storyAttachmentAvailability,
  storyAttachmentFromFile,
} from './overviewFileCapture'

beforeEach(() => vi.clearAllMocks())

describe('Overview file-capture primitives', () => {
  it('creates the dedicated Overview ref and exact student file metadata', () => {
    const file = new File(['memo'], 'reflection.pdf', { type: 'application/pdf' })

    expect(overviewCaptureBlobRef('story-1')).toBe('idb://overview/capture/story-1')
    expect(storyAttachmentFromFile('story-1', file)).toEqual({
      blobRef: 'idb://overview/capture/story-1', fileName: 'reflection.pdf', mimeType: 'application/pdf', fileSize: file.size, storage: 'device-local',
    })
  })

  it('reports device-local truth and removes only the attachment ref', async () => {
    const attachment = { blobRef: 'idb://overview/capture/story-1', fileName: 'reflection.pdf', mimeType: 'application/pdf', fileSize: 4, storage: 'device-local' as const }
    blobs.hasLocalBlob.mockResolvedValue(true)
    blobs.removeLocalBlob.mockResolvedValue(undefined)

    await expect(storyAttachmentAvailability({ attachment })).resolves.toBe('available-on-this-device')
    blobs.hasLocalBlob.mockResolvedValue(false)
    await expect(storyAttachmentAvailability({ attachment })).resolves.toBe('missing-on-this-device')
    await expect(storyAttachmentAvailability({})).resolves.toBe('no-attachment')
    await removeStoryAttachment({ attachment })

    expect(blobs.removeLocalBlob).toHaveBeenCalledWith('idb://overview/capture/story-1')
  })

  it('retains the selected file before exposing its metadata', async () => {
    const file = new File(['memo'], 'reflection.pdf', { type: 'application/pdf' })
    blobs.retainLocalBlob.mockResolvedValue('idb://overview/capture/story-1')

    await expect(retainStoryAttachment('story-1', file)).resolves.toMatchObject({ blobRef: 'idb://overview/capture/story-1', fileName: 'reflection.pdf' })
    expect(blobs.retainLocalBlob).toHaveBeenCalledWith('idb://overview/capture/story-1', file)
  })

  it('removes the retained blob if the record write fails', async () => {
    const file = new File(['memo'], 'reflection.pdf', { type: 'application/pdf' })
    blobs.retainLocalBlob.mockResolvedValue('idb://overview/capture/story-1')
    blobs.removeLocalBlob.mockResolvedValue(undefined)

    await expect(retainThenPersistStoryAttachment('story-1', file, () => { throw new Error('store failed') })).rejects.toThrow('store failed')
    expect(blobs.removeLocalBlob).toHaveBeenCalledWith('idb://overview/capture/story-1')
  })
})
