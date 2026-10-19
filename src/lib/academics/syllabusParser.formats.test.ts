import { describe, expect, it } from 'vitest'
import { parseSyllabusText, type SyllabusItem } from './syllabusParser'

// Andy, Oct 19 2026: "every variation of info should be considered, even ones
// not in the syllabus — any possible way something can be formatted should
// still be recognizable." These are the common ways US syllabi write the same
// facts, collected from convention rather than from any one file. Every case
// is the same course: Exam 1 on Thursday Sep 17 2026 covering lessons 1–7,
// and a quiz due Monday Sep 14 2026.

const HEAD = 'BIO 101 — Cells\nFall 2026\n'
const exams = (items: SyllabusItem[]) => items.filter((item) => item.kind === 'exams')
const deadlines = (items: SyllabusItem[]) => items.filter((item) => item.kind === 'deadlines')
const units = (items: SyllabusItem[]) => items.filter((item) => item.kind === 'units')
const parse = (body: string) => parseSyllabusText(HEAD + body).items

describe('every common way to write an exam date is read', () => {
  const forms: Array<[string, string]> = [
    ['numeric', 'Exam 1: 9/17'],
    ['numeric with year', 'Exam 1 — 9/17/2026'],
    ['numeric two-digit year', 'Exam 1 on 09/17/26'],
    ['ISO', 'Exam 1: 2026-09-17'],
    ['month name', 'Exam 1 — September 17'],
    ['month name with year', 'Exam 1: September 17, 2026'],
    ['abbreviated month', 'Exam 1: Sept. 17'],
    ['abbreviated month no dot', 'Exam 1: Sep 17'],
    ['ordinal', 'Exam 1 will be held on September 17th'],
    ['weekday + month', 'Exam 1: Thursday, September 17'],
    ['weekday abbr + numeric', 'Exam 1 — Thu 9/17'],
    ['day before month', 'Exam 1: 17 September 2026'],
    ['day-month abbr', 'Exam 1: 17-Sep'],
    ['Midterm word', 'Midterm 1 — Sept 17'],
    ['Roman numeral', 'Midterm I: September 17'],
    ['Test word', 'Test 1 9/17'],
    ['Prelim', 'Prelim 1 — 9/17'],
    ['Examination', 'First Examination: September 17'],
    ['Unit exam', 'Unit 1 Exam — 9/17'],
    ['hash number', 'Exam #1 – 9/17'],
    ['all caps', 'EXAM 1 THURSDAY 9/17'],
    ['date first', '9/17 — Exam 1'],
    ['date first month name', 'Sept. 17: Exam 1'],
    ['bullet', '• Exam 1 (in class) — Thursday, Sept. 17'],
    ['table cells on one line', 'Thu | 9/17 | Exam 1 | in class'],
  ]
  it.each(forms)('%s: "%s"', (_name, line) => {
    const found = exams(parse(line))
    expect(found.map((item) => item.value), JSON.stringify(found.map((item) => [item.label, item.value]))).toContain('2026-09-17')
  })
})

describe('every common way to write a deadline is read', () => {
  const forms: Array<[string, string]> = [
    ['due + numeric', 'Quiz 3 due 9/14'],
    ['due + month', 'Quiz 3 due September 14'],
    ['due by', 'Quiz 3 due by Mon., Sept. 14 at 11:59 PM'],
    ['colon', 'Quiz 3: due 9/14/2026'],
    ['deadline word', 'Deadline for Quiz 3: September 14th'],
    ['submit', 'Submit Quiz 3 by 9/14'],
    ['date first', '9/14 — Quiz 3 due'],
    ['ISO', 'Quiz 3 due 2026-09-14'],
    ['day-month', 'Quiz 3 due 14 Sep'],
  ]
  it.each(forms)('%s: "%s"', (_name, line) => {
    const found = deadlines(parse(line))
    expect(found.map((item) => item.value), JSON.stringify(found.map((item) => [item.label, item.value]))).toContain('2026-09-14')
  })
})

describe('every common schedule-table row shape is read as a dated session', () => {
  const tables: Array<[string, string]> = [
    ['lesson number + numeric date', '1 8/20 Intro to cells\n2 8/25 Membranes\n3 8/27 Transport'],
    ['Lesson word', 'Lesson 1 8/20 Intro to cells\nLesson 2 8/25 Membranes\nLesson 3 8/27 Transport'],
    ['Lecture word + colon', 'Lecture 1: Aug 20 — Intro to cells\nLecture 2: Aug 25 — Membranes\nLecture 3: Aug 27 — Transport'],
    ['Class N', 'Class 1 (Aug. 20) Intro to cells\nClass 2 (Aug. 25) Membranes\nClass 3 (Aug. 27) Transport'],
    ['Day N', 'Day 1 — Thu 8/20 — Intro to cells\nDay 2 — Tue 8/25 — Membranes\nDay 3 — Thu 8/27 — Transport'],
    ['weekday + numeric', 'Thu 8/20 Intro to cells\nTue 8/25 Membranes\nThu 8/27 Transport'],
    ['weekday + month name', 'Thursday, August 20 Intro to cells\nTuesday, August 25 Membranes\nThursday, August 27 Transport'],
    ['month name first', 'Aug 20 Intro to cells\nAug 25 Membranes\nAug 27 Transport'],
    ['numeric with year', '08/20/2026 Intro to cells\n08/25/2026 Membranes\n08/27/2026 Transport'],
    ['ISO', '2026-08-20 Intro to cells\n2026-08-25 Membranes\n2026-08-27 Transport'],
    ['pipes', '| 1 | 8/20 | Intro to cells |\n| 2 | 8/25 | Membranes |\n| 3 | 8/27 | Transport |'],
    ['tabs', '1\t8/20\tIntro to cells\n2\t8/25\tMembranes\n3\t8/27\tTransport'],
    ['week + range', 'Week 1 (Aug 17–21): Intro to cells\nWeek 2 (Aug 24–28): Membranes\nWeek 3 (Aug 31–Sep 4): Transport'],
    ['Week N: date', 'Week 1: 8/17 Intro to cells\nWeek 2: 8/24 Membranes\nWeek 3: 8/31 Transport'],
    ['one token per line', '1\nThu\nAug\n20\nIntro to cells\n2\nTue\nAug\n25\nMembranes\n3\nThu\nAug\n27\nTransport'],
  ]
  it.each(tables)('%s', (_name, body) => {
    const dated = units(parse(body)).filter((item) => item.value)
    const values = dated.map((item) => item.value)
    expect(values.length, JSON.stringify(units(parse(body)).map((item) => [item.label, item.value]))).toBeGreaterThanOrEqual(3)
    expect(values.every((value) => /^2026-0[89]-\d{2}$/.test(value ?? ''))).toBe(true)
  })
})

describe('no-class days are never sessions, however they are written', () => {
  const rows = ['No class — Labor Day', 'NO CLASS (Fall Break)', 'Fall break: no class', 'University holiday', 'Class cancelled', 'Wellbeing Day — no class', 'Thanksgiving Recess', 'Spring Break', 'Reading Day', 'Holiday – campus closed']
  it.each(rows)('"%s"', (row) => {
    const body = `Tue 9/1 Membranes\nThu 9/3 ${row}\nTue 9/8 Transport\nThu 9/10 Signaling`
    expect(units(parse(body)).some((item) => item.value === '2026-09-03')).toBe(false)
  })
})

describe('a deadline is named by its work, however the line is written', () => {
  const forms: Array<[string, string, string]> = [
    ['after class', 'After class: Lesson 15 quiz (due 9/14 at 11:59 PM)', 'Lesson 15 quiz'],
    ['before class', 'Before class: read Chapter 3 and complete GRQ-3 — due 9/14', 'Read Chapter 3 and complete GRQ-3'],
    ['submit verb', 'Submit Lab Report 2 on Canvas by 9/14 at 5pm', 'Lab Report 2'],
    ['platform', 'Problem Set 3 on Gradescope (due Sept. 14, 11:59 PM)', 'Problem Set 3'],
    ['objective in front', 'Explain osmosis in plant cells. After class: Lesson 4 worksheet due 9/14', 'Lesson 4 worksheet'],
    ['deadline for', 'Deadline for Essay 1: September 14th', 'Essay 1'],
    ['is due', 'The Annotated Bibliography is due 9/14.', 'The Annotated Bibliography'],
  ]
  it.each(forms)('%s: "%s"', (_name, line, expected) => {
    const found = deadlines(parse(line)).find((item) => item.value === '2026-09-14')
    expect(found?.label).toBe(expected)
  })
})

describe('every common way to state what an exam covers is read', () => {
  const forms: Array<[string, string, number[] | 'cumulative' | 'non-cumulative']> = [
    ['lessons range', 'Exam 1 (lessons 1-7) — 9/17', [1, 2, 3, 4, 5, 6, 7]],
    ['lessons en dash', 'Exam 1 (Lessons 1–7) 9/17', [1, 2, 3, 4, 5, 6, 7]],
    ['lectures through', 'Exam 1, 9/17: covers lectures 1 through 7', [1, 2, 3, 4, 5, 6, 7]],
    ['chapters', 'Exam 1 — 9/17 — Chapters 1–7', [1, 2, 3, 4, 5, 6, 7]],
    ['Ch. abbreviation', 'Exam 1 9/17 (Ch. 1-7)', [1, 2, 3, 4, 5, 6, 7]],
    ['list', 'Exam 1 9/17 covers lessons 1, 2, 3, and 4', [1, 2, 3, 4]],
    ['material from', 'Exam 1 (9/17) will cover material from lectures 1–7', [1, 2, 3, 4, 5, 6, 7]],
    ['cumulative', 'Final Exam — 9/17 (cumulative)', 'cumulative'],
    ['comprehensive', 'Final Exam 9/17 is comprehensive', 'cumulative'],
    ['non-cumulative', 'Exam 1 — 9/17 (non-cumulative)', 'non-cumulative'],
    ['not cumulative', 'Exam 1 9/17. This exam is not cumulative.', 'non-cumulative'],
  ]
  it.each(forms)('%s: "%s"', (_name, line, expected) => {
    const exam = exams(parse(line)).find((item) => item.value === '2026-09-17') as (SyllabusItem & { scope?: { lessons?: number[]; cumulative?: boolean } }) | undefined
    expect(exam, 'exam found').toBeTruthy()
    if (Array.isArray(expected)) expect(exam?.scope?.lessons).toEqual(expected)
    else expect(exam?.scope?.cumulative).toBe(expected === 'cumulative')
  })
})
