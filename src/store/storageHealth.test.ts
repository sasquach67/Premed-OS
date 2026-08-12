import { beforeEach, describe, expect, it } from 'vitest'
import { guardedStorage, storageFailure } from '@/store/storageHealth'
import { createSeedData } from '@/data/seed'
import { systemFeed } from '@/components/layout/attention'

describe('guarded persistence storage', () => {
  beforeEach(() => sessionStorage.clear())

  it('records a failed write without throwing', () => {
    const storage = {
      getItem: () => null,
      removeItem: () => undefined,
      setItem: () => { throw new DOMException('Quota exceeded', 'QuotaExceededError') },
      clear: () => undefined,
      key: () => null,
      length: 0,
    } satisfies Storage

    expect(() => guardedStorage(storage).setItem('data', '{}')).not.toThrow()
    expect(storageFailure()).toContain('Quota exceeded')
    expect(systemFeed(createSeedData()).find((item) => item.id === 'system:storage-write-failed')).toMatchObject({
      priority: 'blocking',
      route: '/settings',
    })
  })

  it('clears the warning after a later save succeeds', () => {
    const values = new Map<string, string>()
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      removeItem: (key: string) => { values.delete(key) },
      setItem: (key: string, value: string) => { values.set(key, value) },
      clear: () => values.clear(),
      key: () => null,
      get length() { return values.size },
    } satisfies Storage

    guardedStorage(storage).setItem('data', '{}')
    expect(storageFailure()).toBe('')
  })
})
