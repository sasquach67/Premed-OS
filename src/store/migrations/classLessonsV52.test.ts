import { expect, it } from 'vitest'
import { createInitialDataForMode } from '@/store/store'
import type { ClassWorkspace, LectureRecord } from '@/lib/types'
import { migrateClassLessonsV52 } from './classLessonsV52'

// PSYC 101 as saved before lessons were grouped: one entry per class date.
const days = [
  ['2026-08-18', 'Class Introduction'], ['2026-08-20', 'The Evolution of Psychology'], ['2026-08-25', 'Research Enterprise in Psychology'],
  ['2026-08-27', 'The Biological Bases of Behavior'], ['2026-09-01', 'The Biological Bases of Behavior'], ['2026-09-03', 'Sensation and Perception'],
  ['2026-09-08', 'Variations in Consciousness'], ['2026-09-10', 'Learning'], ['2026-09-15', 'Learning'],
  ['2026-09-22', 'Human Memory'], ['2026-09-24', 'Human Memory'], ['2026-10-06', 'Well-being day'], ['2026-10-08', 'Motivation & Emotion'],
] as const
const notebook = (id: string, extra: Partial<LectureRecord>): LectureRecord => ({ id, courseId: 'psyc', title: id, inputPath: 'pasted', topicIds: [], processingState: 'ready', createdAt: 1, updatedAt: 1, order: 0, ...extra } as LectureRecord)

function psyc() {
  const data = createInitialDataForMode(false)
  const center = data.academics.classCenter
  center.workspaces.push({
    id: 'w', courseId: 'psyc', createdAt: 1, updatedAt: 1, order: 0,
    syllabusSchedule: days.map(([startDate, label], order) => ({ id: `s${order}`, week: 'Unscheduled', label, startDate, order })),
    classDayOverrides: { '2026-09-15': { lessons: [8, 9] } },
  } as unknown as ClassWorkspace)
  center.lectures.push(
    // Old row 1 was Class Introduction; 8 and 9 the two Learning classes; 12 the well-being day.
    notebook('intro', { lesson: 1 }), notebook('learning', { lesson: 8 }), notebook('learning-2', { lesson: 9 }), notebook('break', { lesson: 12 }),
    notebook('by-title', { title: 'Lesson 7 — Memory' }),
    notebook('titled', { lesson: 1, title: 'Lesson 1 — Foundations of Psychology' }), notebook('row-title', { lesson: 9, title: 'Lesson 9 — Learning' }),
    notebook('other-class', { courseId: 'biol', lesson: 8 }),
  )
  return data
}

it('rewrites a per-date schedule as chapter lessons and keeps each notebook on its lesson', () => {
  const out = migrateClassLessonsV52(psyc())
  const workspace = out.academics.classCenter.workspaces.find((w) => w.courseId === 'psyc')!
  expect(workspace.syllabusSchedule!.map((e) => [e.lesson, e.label, e.dates])).toEqual([
    [0, 'Class Introduction', ['2026-08-18']], [1, 'The Evolution of Psychology', ['2026-08-20']], [2, 'Research Enterprise in Psychology', ['2026-08-25']],
    [3, 'The Biological Bases of Behavior', ['2026-08-27', '2026-09-01']], [4, 'Sensation and Perception', ['2026-09-03']],
    [5, 'Variations in Consciousness', ['2026-09-08']], [6, 'Learning', ['2026-09-10', '2026-09-15']],
    [7, 'Human Memory', ['2026-09-22', '2026-09-24']], [8, 'Motivation & Emotion', ['2026-10-08']],
  ])
  expect(workspace.classDayOverrides).toEqual({ '2026-09-15': { lessons: [6] } })
  const lessonOf = (id: string) => out.academics.classCenter.lectures.find((l) => l.id === id)
  expect(lessonOf('intro')?.lesson).toBe(0)
  expect(lessonOf('learning')?.lesson).toBe(6)
  expect(lessonOf('learning-2')?.lesson).toBe(6)
  expect(lessonOf('break')).not.toHaveProperty('lesson')
  expect(lessonOf('by-title')).not.toHaveProperty('lesson')
  expect(lessonOf('titled')?.lesson).toBe(1)
  expect(lessonOf('row-title')?.lesson).toBe(6)
  expect(lessonOf('other-class')?.lesson).toBe(8)
})

it('runs once: a rewritten schedule and a class without one are left as they are', () => {
  const once = migrateClassLessonsV52(psyc())
  expect(migrateClassLessonsV52(once)).toBe(once)
  const empty = createInitialDataForMode(false)
  expect(migrateClassLessonsV52(empty)).toBe(empty)
})
