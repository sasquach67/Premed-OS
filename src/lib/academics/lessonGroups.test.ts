import { describe, expect, it } from 'vitest'
import { buildLessons, findLessonNotebook, groupLessonsByExam, isLessonChapter, scopeLessonNumbers, type LessonRow } from './lessonGroups'
import { lessonSchedule } from './classDays'
import { lessonFields } from './examScope'
import { parseSyllabusText } from './syllabusParser'
import type { SyllabusScheduleEntry } from '@/lib/types'

const row = (lesson: number, date: string): LessonRow => ({ lesson, dates: [date] })

describe('buildLessons', () => {
  it('reads lesson numbers, topics and every date from the schedule', () => {
    expect(buildLessons([
      { id: 'b', week: '', label: 'Lesson 10', order: 1, lesson: 10, startDate: '2026-10-20' },
      { id: 'a', week: '', label: 'Chapter 9 Motivation and Emotion', order: 0, lesson: 9, startDate: '2026-10-13', dates: ['2026-10-13', '2026-10-15'] },
    ])).toEqual([
      { lesson: 9, title: 'Motivation and Emotion', dates: ['2026-10-13', '2026-10-15'] },
      { lesson: 10, title: undefined, dates: ['2026-10-20'] },
    ])
  })
  it('skips undated unit headings and keeps each lesson’s unit (BIOL 103)', () => {
    const rows = buildLessons([
      { id: 'u1', week: '', label: 'Unit 1: Central Dogma, Molecular Techniques & Genetic Diseases', order: 0 },
      { id: 'l8', week: '', label: 'Lesson 8', order: 1, lesson: 8, startDate: '2026-09-15', unit: 'Unit 1: Central Dogma, Molecular Techniques & Genetic Diseases' },
      { id: 'u2', week: '', label: 'Unit 2: How cells control division and differentiation', order: 2 },
      { id: 'l9', week: '', label: 'Lesson 9', order: 3, lesson: 9, startDate: '2026-09-22', unit: 'Unit 2: How cells control division and differentiation' },
    ])
    expect(rows.map((r) => [r.lesson, r.unit])).toEqual([
      [8, 'Unit 1: Central Dogma, Molecular Techniques & Genetic Diseases'],
      [9, 'Unit 2: How cells control division and differentiation'],
    ])
  })
  it('numbers a week schedule in order', () => {
    expect(buildLessons([
      { id: 'a', week: '1', label: 'Week 1: Introduction', order: 0, startDate: '2026-08-17' },
      { id: 'b', week: '2', label: 'Week 2: Healing systems', order: 1, startDate: '2026-08-24' },
    ]).map((r) => [r.lesson, r.title])).toEqual([[1, 'Week 1: Introduction'], [2, 'Week 2: Healing systems']])
  })
})

describe('findLessonNotebook', () => {
  const nb = (id: string, extra: { lesson?: number; occurredOn?: string; title?: string }) => ({ id, title: 'Notebook', ...extra })
  it('finds the lesson’s notebook first, then one dated on any of its classes, then by title', () => {
    // Lesson 9 meets Oct 8 and, after Fall Break, Oct 13: one notebook for both.
    expect(findLessonNotebook([nb('a', { occurredOn: '2026-10-08' })], 9, ['2026-10-08', '2026-10-13'])?.id).toBe('a')
    expect(findLessonNotebook([nb('a', { occurredOn: '2026-10-08' }), nb('b', { lesson: 9 })], 9, ['2026-10-08'])?.id).toBe('b')
    expect(findLessonNotebook([nb('c', { title: 'Lesson 9 — Motivation' })], 9, [])?.id).toBe('c')
    // A notebook saved for another lesson is never borrowed by date.
    expect(findLessonNotebook([nb('d', { lesson: 10, occurredOn: '2026-10-13' })], 9, ['2026-10-13'])).toBeUndefined()
  })
})

describe('scopeLessonNumbers', () => {
  it('reads single lessons, ranges and pairs', () => {
    expect(scopeLessonNumbers({ lessons: ['Lesson 9', 'Lessons 12-14', 'Lesson 10 & 11'] }).sort((a, b) => a - b)).toEqual([9, 10, 11, 12, 13, 14])
  })
})

describe('groupLessonsByExam', () => {
  const lessons = [row(1, '2026-08-20'), row(8, '2026-09-15'), row(9, '2026-09-22'), row(15, '2026-10-13'), row(16, '2026-10-20'), row(17, '2026-10-27')]
  it('puts each lesson under the exam whose scope names it (BIOL 103)', () => {
    const groups = groupLessonsByExam(lessons, [
      { id: 'e2', title: 'Exam 2', date: '2026-10-22', scope: { lessons: ['Lessons 9-15'] } },
      { id: 'e1', title: 'Exam 1', date: '2026-09-17', scope: { lessons: ['Lessons 1-7'] } },
      { id: 'f', title: 'Final', date: '2026-12-07', scope: { cumulative: true } },
    ])
    expect(groups.map((g) => [g.name, g.lessons.map((l) => l.lesson)])).toEqual([
      ['Exam 1', [1, 8]],
      ['Exam 2', [9, 15, 16]],
      ['Final', [17]],
    ])
  })
  it('groups by date when the syllabus gives no scope (PSYC 101)', () => {
    const groups = groupLessonsByExam(lessons, [{ id: 'e1', title: 'Exam 1', date: '2026-09-17' }, { id: 'e2', title: 'Exam 2', date: '2026-11-03' }])
    expect(groups.map((g) => g.lessons.map((l) => l.lesson))).toEqual([[1, 8], [9, 15, 16, 17]])
  })
  it('keeps everything in one group with no exams', () => {
    expect(groupLessonsByExam(lessons, []).map((g) => g.name)).toEqual(['All lessons'])
  })
})

// PSYC 101 as it was saved before lessons were grouped: one entry per class
// date, no lesson numbers (Andy's page, Oct 27 2026).
const psycSaved: SyllabusScheduleEntry[] = ([
  ['2026-08-18', 'Class Introduction'], ['2026-08-20', 'The Evolution of Psychology'], ['2026-08-25', 'Research Enterprise in Psychology'],
  ['2026-08-27', 'The Biological Bases of Behavior'], ['2026-09-01', 'The Biological Bases of Behavior'], ['2026-09-03', 'Sensation and Perception'],
  ['2026-09-08', 'Variations in Consciousness'], ['2026-09-10', 'Learning'], ['2026-09-15', 'Learning'],
  ['2026-09-22', 'Human Memory'], ['2026-09-24', 'Human Memory'], ['2026-09-29', 'Cognition and Intelligence'], ['2026-10-01', 'Cognition and Intelligence'],
  ['2026-10-06', 'Well-being day'], ['2026-10-08', 'Motivation & Emotion'], ['2026-10-13', 'Motivation & Emotion'], ['2026-10-15', 'Fall Break'],
  ['2026-10-20', 'Human Development Across the Lifespan'], ['2026-10-22', 'Human Development Across the Lifespan'],
  ['2026-10-27', 'Personality'], ['2026-10-29', 'Personality'], ['2026-11-05', 'Social Behavior'],
] as const).map(([startDate, label], order) => ({ id: `s${order}`, week: 'Unscheduled', label, startDate, order }))

describe('a schedule saved one entry per class date', () => {
  it('reads it as lessons: back-to-back classes on a topic are one lesson, the introduction is lesson 0', () => {
    const rows = buildLessons(lessonSchedule(psycSaved))
    expect(rows.map((r) => [r.lesson, r.title])).toEqual([
      [0, 'Class Introduction'], [1, 'The Evolution of Psychology'], [2, 'Research Enterprise in Psychology'], [3, 'The Biological Bases of Behavior'],
      [4, 'Sensation and Perception'], [5, 'Variations in Consciousness'], [6, 'Learning'], [7, 'Human Memory'], [8, 'Cognition and Intelligence'],
      [9, 'Motivation & Emotion'], [10, 'Human Development Across the Lifespan'], [11, 'Personality'], [12, 'Social Behavior'],
    ])
    expect(rows.find((r) => r.lesson === 6)?.dates).toEqual(['2026-09-10', '2026-09-15'])
  })
  it('puts Lessons 1–6 under Exam 1 and starts Exam 2 at Lesson 7', () => {
    const groups = groupLessonsByExam(buildLessons(lessonSchedule(psycSaved)), [{ id: 'x1', title: 'Exam 1', date: '2026-09-17' }, { id: 'x2', title: 'Exam 2', date: '2026-11-03' }, { id: 'f', title: 'Final Exam', date: '2026-12-10' }])
    expect(groups.map((g) => g.lessons.map((r) => r.lesson))).toEqual([[0, 1, 2, 3, 4, 5, 6], [7, 8, 9, 10, 11], [12]])
  })
  it('leaves a week schedule and an already numbered schedule alone', () => {
    const weeks: SyllabusScheduleEntry[] = ['2026-08-17', '2026-08-24', '2026-08-31'].map((startDate, order) => ({ id: `w${order}`, week: `Week ${order + 1}`, label: 'Climate', startDate, order }))
    expect(lessonSchedule(weeks)).toBe(weeks)
    const numbered = psycSaved.map((e, i) => ({ ...e, lesson: i + 1 }))
    expect(lessonSchedule(numbered)).toBe(numbered)
  })
})

describe('isLessonChapter', () => {
  const lessons = buildLessons(lessonSchedule(psycSaved))
  it('is a chapter reading due on its lesson’s class day', () => {
    expect(isLessonChapter('Chapter 6 · Learning', '2026-09-15', lessons)).toBe(true)
    expect(isLessonChapter('Chapter 9 · Motivation & Emotion', undefined, lessons)).toBe(true)
  })
  it('is not any other reading', () => {
    expect(isLessonChapter('Chapter 6 · Memory and the brain', '2026-10-27', lessons)).toBe(false)
    expect(isLessonChapter('Chapter 40', '2026-09-15', lessons)).toBe(false)
    expect(isLessonChapter('Steinberg, Sizwe’s Test, “Preface” (pp. 1-75)', '2026-09-15', lessons)).toBe(false)
  })
})

// End to end, from the syllabus text to the exam groups the Lessons tab
// shows, so a parser or grouping change cannot put PSYC 101's Lessons 7–9
// back under Exam 1 (Andy, Oct 27 2026).
describe('PSYC 101 syllabus to exam groups', () => {
  it('puts Lessons 1–6 under Exam 1, 7–11 under Exam 2 and 12–15 under the final', () => {
    const parsed = parseSyllabusText(`PSYC 101 — Introduction to Psychology
Fall 2026
Examinations: There will be two non-cumulative exams and a final in this course.
Course Schedule (Subject to Change)
Date Topic Reading
Tues 8/18 Class Introduction
Thurs 8/20 The Evolution of Psychology Chapter 1
Tues 8/25 Research Enterprise in Psychology Chapter 2              (Forum 1 due 8/25)
Thurs 8/27   The Biological Bases of Behavior Chapter 3
Tues 9/1 The Biological Bases of Behavior  Chapter 3                    (Forum 2 due 9/1)
Thurs 9/3 Sensation and Perception Chapter 4               (Response Paper 1 due)
Tues 9/8 Variations in Consciousness Chapter 5               (Forum 3 due 9/8)
Thurs 9/10 Learning Chapter 6
Tues 9/15 Learning Chapter 6               (Forum 4 due 9/15)
Thurs 9/17 Exam 1
Tues 9/22 Human Memory   Chapter 7
Thurs 9/24 Human Memory Chapter 7               (Forum 5 due 9/24)
Tues 9/29 Cognition and Intelligence  Chapter 8
Thurs 10/1 Cognition and Intelligence Chapter 8                 (Forum 6 due 10/1)
Tues 10/6  Well-being day
Thurs 10/8 Motivation & Emotion Chapter 9                (Response Paper 2 due)
Tues 10/13 Motivation & Emotion Chapter 9                (Forum 7 due 10/13)
Thurs 10/15 Fall Break
Tues 10/20 Human Development Across the Lifespan Chapter 10              (Forum 8 due 10/20)
Thurs 10/22 Human Development Across the Lifespan Chapter 10
Tues 10/27 Personality Chapter 11               (Forum 9 due 10/27)
Thurs 10/29 Personality Chapter 11
Tues 11/3 Exam 2
Thurs 11/5 Social Behavior Chapter 12
Tues 11/10 Social Behavior Chapter 12                 (Forum 10 due 11/10)
Thurs 11/12 Stress, Coping & Health Chapter 13
Tues 11/17 Stress, Coping & Health Chapter 13
Thurs 11/19 Psychological Disorders Chapter 14
Tues 11/24 Psychological Disorders Chapter 14
Thurs 11/26 Thanksgiving Break
Tues 12/1 Treatment of Psychological Disorders Chapter 15 (Last day for grade changes/review)
   Final Exam Thursday, Dec 10 8a-11a Same location as class meetings`, 'PSYC101 Syllabus FA26.pdf', 'pdf')
    const schedule: SyllabusScheduleEntry[] = parsed.items.filter((i) => i.kind === 'units')
      .map((i, order) => ({ id: `u${order}`, week: i.context ?? 'Unscheduled', label: i.label, startDate: i.value, order, ...lessonFields(i) }))
    const exams = parsed.items.filter((i) => i.kind === 'exams').map((i) => ({ id: i.label, title: i.label, date: i.value, scope: i.scope ? { cumulative: i.scope.cumulative } : undefined }))
    const groups = groupLessonsByExam(buildLessons(schedule), exams)
    expect(groups.map((g) => [g.name, g.lessons.map((r) => r.lesson)])).toEqual([
      ['Exam 1', [0, 1, 2, 3, 4, 5, 6]], ['Exam 2', [7, 8, 9, 10, 11]], ['Final Exam', [12, 13, 14, 15]],
    ])
    expect(buildLessons(schedule).find((r) => r.lesson === 9)?.title).toBe('Motivation & Emotion')
    expect(parsed.items.some((i) => i.kind === 'readings')).toBe(false)
  })
})
