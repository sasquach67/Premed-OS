import type { AppData, StoryEntry } from '@/lib/types'

function isLocalOnly(story: StoryEntry) {
  return story.localOnly === true
}

/** Remove private Story Bank entries from any payload that leaves the device. */
export function dataForRemote(data: AppData): AppData {
  const stories = data.stories.filter((story) => !isLocalOnly(story))
  const trash = (data.trash ?? []).filter(item => !(item.collection === 'stories' && item.record.localOnly === true))
  const recoveryStack = (data.meta?.recoveryStack ?? []).filter(item => !(item.collection === 'stories' && [...item.before, ...item.after].some(record => record.localOnly === true)))
  return stories.length === data.stories.length && trash.length === (data.trash?.length ?? 0) && recoveryStack.length === (data.meta?.recoveryStack?.length ?? 0)
    ? data : { ...data, stories, trash, meta: { ...data.meta, recoveryStack } }
}

/** Apply a remote snapshot without deleting or replacing this device's private entries. */
export function mergeRemotePreservingLocal(remote: AppData, local: AppData): AppData {
  const privateStories = local.stories.filter(isLocalOnly)
  const privateTrash = (local.trash ?? []).filter(item => item.collection === 'stories' && item.record.localOnly === true)
  const privateRecovery = (local.meta?.recoveryStack ?? []).filter(item => item.collection === 'stories' && [...item.before, ...item.after].some(record => record.localOnly === true))
  if (!privateStories.length && !privateTrash.length && !privateRecovery.length) return remote
  const privateIds = new Set(privateStories.map((story) => story.id))
  const trashIds = new Set(privateTrash.map(item => item.id)), recoveryIds = new Set(privateRecovery.map(item => item.id))
  return {
    ...remote,
    stories: [...remote.stories.filter((story) => !privateIds.has(story.id)), ...privateStories],
    trash: [...(remote.trash ?? []).filter(item => !trashIds.has(item.id)), ...privateTrash],
    meta: { ...remote.meta, recoveryStack: [...(remote.meta?.recoveryStack ?? []).filter(item => !recoveryIds.has(item.id)), ...privateRecovery] },
  }
}
