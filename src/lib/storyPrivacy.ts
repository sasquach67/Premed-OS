import type { AppData, StoryEntry } from '@/lib/types'

function isLocalOnly(story: StoryEntry) {
  return story.localOnly === true
}

/** Remove private Story Bank entries from any payload that leaves the device. */
export function dataForRemote(data: AppData): AppData {
  const stories = data.stories.filter((story) => !isLocalOnly(story))
  return stories.length === data.stories.length ? data : { ...data, stories }
}

/** Apply a remote snapshot without deleting or replacing this device's private entries. */
export function mergeRemotePreservingLocal(remote: AppData, local: AppData): AppData {
  const privateStories = local.stories.filter(isLocalOnly)
  if (!privateStories.length) return remote
  const privateIds = new Set(privateStories.map((story) => story.id))
  return {
    ...remote,
    stories: [...remote.stories.filter((story) => !privateIds.has(story.id)), ...privateStories],
  }
}
