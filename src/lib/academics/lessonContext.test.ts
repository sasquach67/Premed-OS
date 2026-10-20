import { describe, expect, it } from 'vitest'
import { lessonTarget, saveLocationSection } from './lessonContext'
import type { ClassFolderSetup } from '@/lib/types'

const ready: ClassFolderSetup = { site: 'canvas', place: 'documents', mover: 'me', name: 'PSYC 101 Lecture Material', state: 'ready', updatedAt: 1 }
const schedule = [{ id: 'a', week: '', label: 'Chapter 10 Human Development Across the Lifespan', order: 0, lesson: 10, startDate: '2026-10-20' }]

describe('lessonTarget', () => {
  it('names the lesson from the syllabus', () => {
    expect(lessonTarget(schedule, 10)).toEqual({ lesson: 10, title: 'Human Development Across the Lifespan', label: 'Lesson 10 — Human Development Across the Lifespan' })
    expect(lessonTarget(schedule, 11).label).toBe('Lesson 11')
  })
})

describe('saveLocationSection', () => {
  it('adds nothing without a class folder or a lesson, so existing prompts are unchanged', () => {
    expect(saveLocationSection(undefined, undefined, 'notebook')).toBe('')
  })
  it('points a lesson’s notebook at its premedOS folder, with Downloads as the fallback', () => {
    const text = saveLocationSection(ready, lessonTarget(schedule, 10), 'notebook')
    expect(text).toContain('## Where to save')
    expect(text).toContain('Documents › PSYC 101 Lecture Material › premedOS › Lesson 10 - Human Development Across the Lifespan')
    expect(text).toContain('save to Downloads instead')
    expect(text).toContain('Never overwrite')
  })
  it('sends everything to Downloads when the folder was skipped', () => {
    expect(saveLocationSection({ ...ready, state: 'skipped' }, lessonTarget(schedule, 10), 'notebook')).toContain('Save the finished notebook folder in my Downloads folder.')
  })
  it('tells the student how to add a deck to Anki', () => {
    expect(saveLocationSection(ready, lessonTarget(schedule, 10), 'deck')).toContain('double-click the .apkg')
  })
  it('files a reading notebook under its reading folder', () => {
    expect(saveLocationSection(ready, { readingKey: 'steinberg, sizwes test', title: 'Steinberg, Sizwe’s Test', label: 'Steinberg, Sizwe’s Test' }, 'notebook'))
      .toContain('premedOS › Reading - Steinberg, Sizwe’s Test')
  })
})
