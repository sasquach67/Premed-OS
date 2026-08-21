import { describe, expect, it } from 'vitest'
import { validateRevisedNotes } from '@/lib/generation/schemas/revisedNotes.v1'

const closed = new Map([['chunk-a:0:9', 'file-a'], ['chunk-b:2:12', 'file-b']])
const valid = {
  title: 'Lecture 1',
  sections: [{
    id: 'section-1', title: 'Core idea', passages: [{
      id: 'passage-1', content: 'The supplied lecture calls this a continuous process.', provenance: 'source',
      sourceRefs: [{ fileId: 'file-a', chunkId: 'chunk-a', start: 0, end: 9 }],
    }],
  }],
  unresolvedDifferences: [{
    id: 'difference-1', label: 'Unresolved source difference', detail: 'The selected sources give different dates.',
    sourceRefs: [
      { fileId: 'file-a', chunkId: 'chunk-a', start: 0, end: 9 },
      { fileId: 'file-b', chunkId: 'chunk-b', start: 2, end: 12 },
    ],
  }],
}

describe('Revised Notes V1 source contract', () => {
  it('accepts an all-source result with carried citations', () => {
    expect(validateRevisedNotes(valid, closed)).toEqual(valid)
  })

  it('rejects a passage whose citation was minted after the closed set', () => {
    const minted = structuredClone(valid)
    minted.sections[0].passages[0].sourceRefs[0] = { fileId: 'file-a', chunkId: 'chunk-a', start: 1, end: 8 }
    expect(validateRevisedNotes(minted, closed)).toBeNull()
  })

  it('rejects a reference that pairs a verified range with a different file', () => {
    const mismatchedFile = structuredClone(valid)
    mismatchedFile.sections[0].passages[0].sourceRefs[0].fileId = 'file-b'
    expect(validateRevisedNotes(mismatchedFile, closed)).toBeNull()
  })

  it('rejects an unresolved difference without both source traces', () => {
    const oneSided = structuredClone(valid)
    oneSided.unresolvedDifferences[0].sourceRefs.pop()
    expect(validateRevisedNotes(oneSided, closed)).toBeNull()
  })
})
