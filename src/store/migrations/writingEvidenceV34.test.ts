import { describe, expect, it } from 'vitest'
import { createSeedData } from '@/data/seed'
import { migrateWritingEvidenceV34 } from './writingEvidenceV34'

describe('writing evidence v34', () => {
  it('adds unknown without changing existing serialized data', () => {
    const data = createSeedData()
    data.academics.classCenter.workspaces.forEach((workspace) => delete (workspace as { readingListState?: string }).readingListState)
    const before = structuredClone(data)
    Object.freeze(data)
    Object.freeze(data.academics)
    Object.freeze(data.academics.classCenter)

    const out = migrateWritingEvidenceV34(data)

    expect(out.academics.classCenter.workspaces.every((workspace) => workspace.readingListState === 'unknown')).toBe(true)
    expect({ ...out.academics.classCenter, workspaces: undefined }).toEqual({ ...before.academics.classCenter, workspaces: undefined })
    expect(out.academics.classCenter.workspaces.map(({ readingListState: _state, ...workspace }) => workspace)).toEqual(before.academics.classCenter.workspaces)
    expect(data).toEqual(before)
  })

  it('is a no-op when every workspace already has a reading-list state', () => {
    const data = createSeedData()
    data.academics.classCenter.workspaces.forEach((workspace) => { workspace.readingListState = 'complete' })
    expect(migrateWritingEvidenceV34(data)).toBe(data)
  })
})
