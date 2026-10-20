import { describe, expect, it } from 'vitest'
import { aiSaveLocation, defaultFolderName, filingPrompt, lessonFolderName } from './classFolder'
import type { ClassFolderSetup } from '@/lib/types'

const ready: ClassFolderSetup = { site: 'canvas', place: 'documents', mover: 'ai', name: 'PSYC 101 Lecture Material', state: 'ready', updatedAt: 1 }

describe('class folder names', () => {
  it('follows Andy’s layout with a plain hyphen on disk', () => {
    expect(defaultFolderName('PSYC 101')).toBe('PSYC 101 Lecture Material')
    expect(lessonFolderName(9, 'Motivation & Emotion')).toBe('Lesson 9 - Motivation & Emotion')
    expect(lessonFolderName(3, 'Cells: structure/function')).toBe('Lesson 3 - Cells structure function')
    expect(lessonFolderName(4)).toBe('Lesson 4')
  })
})

describe('aiSaveLocation', () => {
  it('points at the lesson’s premedOS folder when the folder is set up', () => {
    expect(aiSaveLocation(ready, { number: 9, title: 'Motivation and Emotion' })).toEqual({ path: 'Documents › PSYC 101 Lecture Material › premedOS › Lesson 9 - Motivation and Emotion', folder: true })
    expect(aiSaveLocation({ ...ready, place: 'cloud' }, { number: 1 }).path).toBe('Cloud drive › PSYC 101 Lecture Material › premedOS › Lesson 1')
  })
  it('falls back to Downloads when skipped, missing, or the lesson is unknown', () => {
    expect(aiSaveLocation({ ...ready, state: 'skipped' }, { number: 9 }).path).toBe('Downloads')
    expect(aiSaveLocation(undefined, { number: 9 }).path).toBe('Downloads')
    expect(aiSaveLocation(ready, {}).path).toBe('Downloads')
  })
})

describe('filingPrompt', () => {
  const prompt = filingPrompt({ code: 'PSYC 101', folderName: 'PSYC 101 Lecture Material', place: 'documents' })
  it('plans, waits for a yes, copies without moving or overwriting, and reports', () => {
    expect(prompt).toContain('Then stop. Make nothing and copy nothing until I say yes.')
    expect(prompt).toContain('Never move, rename or delete anything in Downloads.')
    expect(prompt).toContain('Never overwrite.')
    expect(prompt).toContain('5. Tell me what you did')
    expect(prompt).toContain('Documents › PSYC 101 Lecture Material › Exam 1')
    expect(prompt).toContain('downloaded from Canvas')
  })
  it('names the cloud drive and drops Canvas when asked', () => {
    const cloud = filingPrompt({ code: 'BIOL 103', folderName: 'BIOL 103 Lecture Material', place: 'cloud', site: 'other' })
    expect(cloud).toContain('Cloud drive › BIOL 103 Lecture Material › premedOS')
    expect(cloud).not.toContain('Canvas')
  })
})
