import { describe, expect, it } from 'vitest'
import type { AcademicFile, SourceChunk } from '@/lib/types'
import {
  materialGenerationChoices,
  selectedMaterialChunks,
  selectedNotesBaseline,
} from './materialGenerationIntake'

const file = (id: string, patch: Partial<AcademicFile> = {}): AcademicFile => ({
  id,
  courseId: 'course-1',
  sourceType: 'paste',
  title: id,
  type: 'other',
  owner: 'course',
  linkedTopicIds: [],
  createdAt: 1,
  updatedAt: 1,
  order: 0,
  ...patch,
})

const chunk = (id: string, fileId: string, content = 'Readable source text.'): SourceChunk => ({
  id,
  fileId,
  courseId: 'course-1',
  content,
  coveredByKeyPoint: false,
  createdAt: 1,
  updatedAt: 1,
  order: 0,
})

describe('material-generation intake selection', () => {
  it('passes only chunks from explicitly selected ready source records', () => {
    const choices = materialGenerationChoices({
      courseId: 'course-1',
      files: [file('slides'), file('notes', { owner: 'mine' })],
      chunks: [chunk('slides-1', 'slides'), chunk('notes-1', 'notes')],
    })

    expect(selectedMaterialChunks(choices, ['notes']).map((item) => item.id)).toEqual(['notes-1'])
  })

  it('keeps no-text files identifiable but out of the eligible source set', () => {
    const choices = materialGenerationChoices({
      courseId: 'course-1',
      files: [file('empty'), file('ready')],
      chunks: [chunk('empty-1', 'empty', '   '), chunk('ready-1', 'ready')],
    })

    expect(choices.find((choice) => choice.file.id === 'empty')?.chunks).toEqual([])
    expect(selectedMaterialChunks(choices, ['empty', 'ready']).map((item) => item.id)).toEqual(['ready-1'])
  })

  it('requires a selected student-owned baseline for Revised Notes', () => {
    const choices = materialGenerationChoices({
      courseId: 'course-1',
      files: [file('course-notes'), file('my-notes', { owner: 'mine' })],
      chunks: [chunk('course-1', 'course-notes'), chunk('mine-1', 'my-notes')],
    })

    expect(selectedNotesBaseline(choices, 'course-notes', ['course-notes'])).toBeUndefined()
    expect(selectedNotesBaseline(choices, 'my-notes', [])).toBeUndefined()
    expect(selectedNotesBaseline(choices, 'my-notes', ['my-notes'])?.file.id).toBe('my-notes')
  })
})
