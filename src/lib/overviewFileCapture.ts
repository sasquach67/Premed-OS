import { hasLocalBlob, removeLocalBlob, retainLocalBlob } from '@/lib/localBlobStore'
import type { StoryAttachment, StoryEntry } from '@/lib/types'

export type StoryAttachmentAvailability = 'no-attachment' | 'available-on-this-device' | 'missing-on-this-device'

export function overviewCaptureBlobRef(storyId: string): string {
  return `idb://overview/capture/${storyId}`
}

export function storyAttachmentFromFile(storyId: string, file: File): StoryAttachment {
  return {
    blobRef: overviewCaptureBlobRef(storyId),
    fileName: file.name,
    mimeType: file.type,
    fileSize: file.size,
    storage: 'device-local',
  }
}

export async function retainStoryAttachment(storyId: string, file: File): Promise<StoryAttachment> {
  const attachment = storyAttachmentFromFile(storyId, file)
  await retainLocalBlob(attachment.blobRef, file)
  return attachment
}

/**
 * Retain bytes before exposing the record. If the record write rejects, remove
 * the just-retained blob so a failed capture cannot leave an orphan behind.
 */
export async function retainThenPersistStoryAttachment<T>(
  storyId: string,
  file: File,
  persist: (attachment: StoryAttachment) => T | Promise<T>,
): Promise<T> {
  const attachment = await retainStoryAttachment(storyId, file)
  try {
    return await persist(attachment)
  } catch (error) {
    await removeStoryAttachment({ attachment })
    throw error
  }
}

export async function storyAttachmentAvailability(story: Pick<StoryEntry, 'attachment'>): Promise<StoryAttachmentAvailability> {
  if (!story.attachment) return 'no-attachment'
  return (await hasLocalBlob(story.attachment.blobRef))
    ? 'available-on-this-device'
    : 'missing-on-this-device'
}

/** Does not affect records or other namespaces; safe after permanent deletion. */
export async function removeStoryAttachment(story: Pick<StoryEntry, 'attachment'>): Promise<void> {
  if (story.attachment?.storage !== 'device-local') return
  await removeLocalBlob(story.attachment.blobRef)
}
