import { expect, it, vi } from 'vitest'
import { generateStudyGuide } from './generateStudyGuide'
import { generateWithSourceRecovery } from './syncGenerationSources'
import type { SourceChunk } from '../types'

vi.mock('./syncGenerationSources', () => ({
  prepareGenerationSources: vi.fn(async () => ({ ok: true, scopeId: 'scope', chunkIds: ['chunk-1'] })),
  generateWithSourceRecovery: vi.fn(),
}))
const validBlock = { id: 'b1', type: 'prose', provenance: 'source', sourceRef: { fileId: 'f1', chunkId: 'chunk-1', start: 0, end: 15 }, text: { content: 'Memory involves encoding.' } }
const input = { courseId: 'course-1', chunks: [{ id: 'chunk-1', fileId: 'f1', content: 'Memory involves encoding.' } as SourceChunk], label: 'Psychology' }
function providerBlocks(blocks: unknown[]) {
  vi.mocked(generateWithSourceRecovery).mockResolvedValue({ ok: true, data: {
    artifact: { sections: [{ id: 'overview', title: 'Overview', blocks }] }, citations: [], auditStatus: 'skipped',
  } })
}

it.each([
  null,
  { ...validBlock, text: { content: 12 } },
  { ...validBlock, items: {} },
  { ...validBlock, items: [null] },
  { ...validBlock, text: { content: 'Text', emphasis: [null] } },
  { ...validBlock, text: undefined, items: [] },
  { ...validBlock, type: 'invented-widget' },
])('returns an actionable invalid-response for malformed provider block %j', async (block) => {
  providerBlocks([validBlock, block])
  await expect(generateStudyGuide(input)).resolves.toMatchObject({ ok: false, failure: 'invalid-response' })
})

it('retains a valid thin guide and its explicit source gap', async () => {
  providerBlocks([validBlock, { id: 'gap', type: 'gap', provenance: 'clarification', text: { content: 'The source does not supply the referenced diagram.' } }])
  await expect(generateStudyGuide(input)).resolves.toMatchObject({ ok: true, content: expect.stringContaining('referenced diagram') })
})
