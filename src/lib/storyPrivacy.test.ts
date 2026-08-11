import { describe, expect, it } from 'vitest'
import { createSeedData } from '@/data/seed'
import { dataForRemote, mergeRemotePreservingLocal } from '@/lib/storyPrivacy'

describe('Story Bank local-only privacy', () => {
  it('removes local-only entries from remote payloads without mutating local data', () => {
    const data = createSeedData()
    data.stories = [
      { id: 'sync', prompt: '', title: '', commentary: 'May sync', tags: [], order: 0 },
      { id: 'private', prompt: '', title: '', commentary: 'Never sync', tags: [], localOnly: true, order: 1 },
    ]

    const remote = dataForRemote(data)

    expect(remote.stories.map((story) => story.id)).toEqual(['sync'])
    expect(data.stories.map((story) => story.id)).toEqual(['sync', 'private'])
  })

  it('preserves private entries when a remote snapshot replaces local data', () => {
    const local = createSeedData()
    local.stories = [
      { id: 'private', prompt: '', title: '', commentary: 'Device only', tags: [], localOnly: true, order: 0 },
    ]
    const remote = createSeedData()
    remote.stories = [
      { id: 'account', prompt: '', title: '', commentary: 'From account', tags: [], order: 0 },
      { id: 'private', prompt: '', title: '', commentary: 'Stale server copy', tags: [], order: 1 },
    ]

    const merged = mergeRemotePreservingLocal(remote, local)

    expect(merged.stories.map((story) => story.id)).toEqual(['account', 'private'])
    expect(merged.stories.find((story) => story.id === 'private')).toMatchObject({
      commentary: 'Device only',
      localOnly: true,
    })
  })
})
