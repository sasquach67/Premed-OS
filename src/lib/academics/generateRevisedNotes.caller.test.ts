import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { SourceChunk } from '@/lib/types'

const mocks = vi.hoisted(() => ({
  prepare: vi.fn(),
  generate: vi.fn(),
}))

vi.mock('@/lib/academics/syncGenerationSources', () => ({
  prepareGenerationSources: mocks.prepare,
}))

vi.mock('@/lib/intelligence/studyTools', () => ({
  studyTools: { generate: mocks.generate },
}))

import { generateRevisedNotes } from './generateRevisedNotes'

const source: SourceChunk = {
  id: 'chunk-1', fileId: 'file-1', courseId: 'course-1', content: 'Private lecture wording.',
  coveredByKeyPoint: false, createdAt: 1, updatedAt: 1, order: 0,
}

const artifact = {
  title: 'Electrical signaling',
  sections: [{
    id: 'section-1', title: 'Signal', passages: [{
      id: 'passage-1', content: 'The selected lecture describes the signal.', provenance: 'source',
      sourceRefs: [{ fileId: 'file-1', chunkId: 'chunk-1', start: 0, end: 9 }],
    }],
  }],
  unresolvedDifferences: [],
}

describe('generateRevisedNotes caller', () => {
  beforeEach(() => {
    mocks.prepare.mockReset()
    mocks.generate.mockReset()
    mocks.prepare.mockResolvedValue({ ok: true, scopeId: 'class-material', chunkIds: ['chunk-1'] })
  })

  it('sends only scope metadata to generate and returns a persistence-ready artifact', async () => {
    mocks.generate.mockResolvedValue({ ok: true, data: {
      artifact,
      citations: [{ fileId: 'file-1', chunkId: 'chunk-1', start: 0, end: 9 }],
    } })

    const outcome = await generateRevisedNotes({ courseId: 'course-1', chunks: [source], baselineFileId: 'file-1', baselineChunks: [source], label: 'Lecture 5' })

    expect(outcome.ok).toBe(true)
    expect(outcome.artifact).toMatchObject({
      courseId: 'course-1', specId: 'revised-notes-v1', selectedFileIds: ['file-1'],
      usedFileIds: ['file-1'], unusedFileIds: [], selectedSourceChunkIds: ['chunk-1'], baselineFileId: 'file-1', baselineSourceChunkIds: ['chunk-1'],
    })
    const request = mocks.generate.mock.calls[0][0]
    expect(request).toMatchObject({ action: 'generate', courseId: 'course-1', topicId: 'class-material', chunkIds: ['chunk-1'], specId: 'revised-notes-v1' })
    expect(JSON.stringify(request)).not.toContain(source.content)
    expect(request.systemPrompt).toContain('RN-SOURCE-ONLY')
    expect(request.systemPrompt).toContain('RN-BASELINE')
  })

  it.each([
    ['sign-in-required', 'sign-in-required'],
    ['no-sources', 'no-sources'],
    ['citation-not-carried', 'citation-not-carried'],
    ['invalid-response', 'invalid-response'],
    ['unconfigured', 'provider-unavailable'],
    ['rate-limited', 'provider-unavailable'],
    ['request-too-large', 'provider-unavailable'],
    ['unavailable', 'provider-unavailable'],
  ])('maps %s to the student-facing %s outcome', async (code, expected) => {
    mocks.generate.mockResolvedValue({ ok: false, code, message: 'Stopped safely.' })
    const outcome = await generateRevisedNotes({ courseId: 'course-1', chunks: [source], baselineFileId: 'file-1', baselineChunks: [source], label: 'Lecture 5' })
    expect(outcome).toMatchObject({ ok: false, failure: expected, message: 'Stopped safely.' })
  })

  it('does not contact the provider when no material was selected', async () => {
    const outcome = await generateRevisedNotes({ courseId: 'course-1', chunks: [], baselineFileId: 'file-1', baselineChunks: [source], label: 'Lecture 5' })
    expect(outcome).toMatchObject({ ok: false, failure: 'no-sources' })
    expect(mocks.prepare).not.toHaveBeenCalled()
    expect(mocks.generate).not.toHaveBeenCalled()
  })

  it('does not contact the provider when a selected source lacks an explicit notes baseline', async () => {
    const outcome = await generateRevisedNotes({ courseId: 'course-1', chunks: [source], label: 'Lecture 5' })
    expect(outcome).toMatchObject({ ok: false, failure: 'no-sources' })
    expect(outcome.message).toContain('baseline')
    expect(mocks.prepare).not.toHaveBeenCalled()
    expect(mocks.generate).not.toHaveBeenCalled()
  })

  it('refuses a baseline that is not in the selected source closure', async () => {
    const other = { ...source, id: 'chunk-2', fileId: 'file-2' }
    const outcome = await generateRevisedNotes({ courseId: 'course-1', chunks: [source], baselineFileId: 'file-2', baselineChunks: [other], label: 'Lecture 5' })
    expect(outcome).toMatchObject({ ok: false, failure: 'no-sources' })
    expect(mocks.prepare).not.toHaveBeenCalled()
  })
})
