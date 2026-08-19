import { describe, expect, it } from 'vitest'
import { createSeedData } from '@/data/seed'
import { migrateTopicLinksV21 } from '@/store/migrations/topicLinksV21'
import type { AppData } from '@/lib/types'

describe('v21 — the topic graph store', () => {
  it('adds the array when missing and touches nothing else', () => {
    const before = createSeedData()
    const stripped = structuredClone(before) as AppData
    delete (stripped.academics.classCenter as { topicLinks?: unknown }).topicLinks
    const after = migrateTopicLinksV21(stripped)
    expect(after.academics.classCenter.topicLinks).toEqual([])
    expect(after.academics.classCenter.topics).toEqual(before.academics.classCenter.topics)
  })

  it('is idempotent and invents no link', () => {
    const once = migrateTopicLinksV21(createSeedData())
    expect(migrateTopicLinksV21(once)).toEqual(once)
    expect(once.academics.classCenter.topicLinks).toEqual([])
  })
})
