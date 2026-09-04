import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AcademicFile } from '@/lib/types'

const blobs = vi.hoisted(() => ({ readLocalBlob: vi.fn() }))
vi.mock('@/lib/localBlobStore', () => ({ readLocalBlob: blobs.readLocalBlob }))

import {
  prepareQuestionBankVisualSources,
  questionBankVisualCandidates,
} from './questionBankVisualSources'

function image(id: string, title: string, type: AcademicFile['type'] = 'other'): AcademicFile {
  return {
    id, courseId: 'course-1', sourceType: 'upload', title, fileName: title,
    mimeType: 'image/png', blobRef: `idb://${id}`, type, linkedTopicIds: [],
    owner: 'mine', processingStatus: 'ready', createdAt: 1, updatedAt: 1, order: 0,
  }
}

describe('question bank visual sources', () => {
  beforeEach(() => blobs.readLocalBlob.mockReset())

  it('prioritizes selected textbook pages ahead of other selected images', () => {
    const candidates = questionBankVisualCandidates([
      image('misc', 'misc diagram.png'),
      image('questions', 'Lesson 2 practice questions.png'),
      image('textbook', 'Lesson 2 Textbook/Page 14.png', 'reading'),
      image('slides', 'Lecture 2 slide.png', 'lecture-slides'),
    ])
    expect(candidates.map((file) => file.id)).toEqual(['textbook', 'slides', 'questions', 'misc'])
  })

  it('builds temporary exact-file image inputs without persisting them', async () => {
    blobs.readLocalBlob.mockResolvedValue(new Blob(['page'], { type: 'image/png' }))
    const result = await prepareQuestionBankVisualSources([image('textbook', 'Lesson 2 Textbook/Page 14.png', 'reading')])

    expect(result.skippedFileIds).toEqual([])
    expect(result.sources).toEqual([expect.objectContaining({
      fileId: 'textbook',
      title: 'Lesson 2 Textbook/Page 14.png',
      mimeType: 'image/png',
      size: 4,
      dataBase64: 'cGFnZQ==',
    })])
  })
})
