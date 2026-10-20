import { describe, expect, it } from 'vitest'
import { buildReadingItems, readingAuthors, readingExamKey, readingsDiscussedOn, shortReadingTitle } from './readingGroups'
import type { AssignedReading } from '@/lib/types'

// ANTH 147 Fall 2026, as the syllabus parser reads it (labels verbatim).
const ANTH: [string, string, string][] = [
  ['2026-08-19', 'Introduction', 'Berry, N. “The Story of Rosario,” in Unsafe Motherhood: Mayan Maternal Mortality and Subjectivity in Post-War Guatemala'],
  ['2026-08-19', 'Introduction', 'Medina, “Communicating with the Dead: Spiritual and Cultural Healing in Chicano/a Communities,” in Religion and Healing'],
  ['2026-08-25', 'Week 1', 'Hahn, R.A. & Kleinman, A, 1983. "Belief as Pathogen, Belief as Medicine: "Voodoo Death" and the "Placebo Phenomenon"'],
  ['2026-08-25', 'Week 1', 'Listen to Podcast, “What You Don’t Know” from This American Life, Act One, by Lulu Wang (27 min)'],
  ['2026-09-01', 'Week 2', 'Lindquist, Galina. 2005. Conjuring Hope: Magic and Healing in Contemporary Russia, ch. 1 (pp.1-19) & selections'],
  ['2026-09-08', 'Week 3', 'King, Martha 2017. “Crafting an Amish Biomedical Landscape” Medicine Anthropology Theory 4(1): 105–122.'],
  ['2026-09-15', 'Week 4', 'Manderson, Lenore. 1998. “Applying Medical Anthropology in the Control of Infectious Disease” Tropical Medicine'],
  ['2026-09-22', 'Week 5', 'Steinberg, Sizwe’s Test, “Preface”—“Thandeka” (pp. 1-75).'],
  ['2026-09-29', 'Week 6', 'Steinberg, “Garden and Home”—AIDS Needle,” (pp.79-162.)'],
  ['2026-10-06', 'Week 7', 'Steinberg, “Testing Day” – “Nombulelo” (pp. 184-232).'],
  ['2026-10-13', 'Week 8', 'Steinberg, “Sizwe and Nwabisa” - “Goodbye, Dr. Hermann” (pp. 235-276); and “Sizwe Magadla”- “Epilogue” (pp. 283-326)'],
  ['2026-10-20', 'Week 9', 'Moore, R., McElfsh, P.A., and Riklon, S. 2022. “‘It’s Like Not a Very Marshallese Way of Life’: Marshallese cultural resilience during COVID-19”'],
  ['2026-11-03', 'Week 11', 'Starobinets, Look at Him, pp. 3-73'],
  ['2026-11-10', 'Week 12', 'Starobinets, Look at Him, pp. 74-147'],
  ['2026-11-17', 'Week 13', 'Berry, N. 2010. “Coming to the ER: Analysis of an Interaction” In Berry, Unsafe Motherhood, pp.60-84.'],
  ['2026-11-24', 'Week 14', 'Villarosa, L. 2018. “Why America’s Black Mothers and Babies Are in a Life-or-Death Crisis” The New York Times'],
]
const readings: AssignedReading[] = ANTH.map(([due, week, title], i) => ({ id: `r${i}`, courseId: 'anth', week, title, status: 'not-started', dueForDiscussion: due, createdAt: 1, updatedAt: 1, order: i }))

describe('readingAuthors', () => {
  it('reads surnames, not initials or given names', () => {
    expect(readingAuthors(ANTH[2][2])).toEqual(['Hahn', 'Kleinman'])
    expect(readingAuthors(ANTH[11][2])).toEqual(['Moore', 'McElfsh', 'Riklon'])
    expect(readingAuthors(ANTH[4][2])).toEqual(['Lindquist'])
    expect(readingAuthors(ANTH[0][2])).toEqual(['Berry'])
  })
})

describe('shortReadingTitle', () => {
  it('turns a citation into author and title', () => {
    expect(shortReadingTitle(ANTH[2][2])).toBe('Hahn & Kleinman, “Belief as Pathogen, Belief as Medicine”')
    expect(shortReadingTitle(ANTH[3][2])).toBe('Podcast, “What You Don’t Know”')
    expect(shortReadingTitle(ANTH[4][2])).toBe('Lindquist, Conjuring Hope')
  })
})

describe('buildReadingItems (ANTH 147)', () => {
  const items = buildReadingItems(readings)
  it('keeps articles single and joins a book’s parts', () => {
    expect(items.map((i) => [i.title, i.parts.length])).toEqual([
      ['Berry, “The Story of Rosario”', 1],
      ['Medina, “Communicating with the Dead: Spiritual and Cultural Healing in Chicano/a Communities”', 1],
      ['Hahn & Kleinman, “Belief as Pathogen, Belief as Medicine”', 1],
      ['Podcast, “What You Don’t Know”', 1],
      ['Lindquist, Conjuring Hope', 1],
      ['King, “Crafting an Amish Biomedical Landscape”', 1],
      ['Manderson, “Applying Medical Anthropology in the Control of Infectious Disease”', 1],
      ['Steinberg, Sizwe’s Test', 4],
      ['Moore et al., “‘It’s Like Not a Very Marshallese Way of Life’: Marshallese cultural resilience during COVID-19”', 1],
      ['Starobinets, Look at Him', 2],
      ['Berry, “Coming to the ER: Analysis of an Interaction”', 1],
      ['Villarosa, “Why America’s Black Mothers and Babies Are in a Life-or-Death Crisis”', 1],
    ])
  })
  it('labels a book’s parts by page range', () => {
    const sizwe = items.find((i) => i.title === 'Steinberg, Sizwe’s Test')!
    expect(sizwe.partLabels).toEqual(['pp. 1-75', 'pp. 79-162', 'pp. 184-232', 'pp. 235-276'])
    expect([sizwe.firstDue, sizwe.due]).toEqual(['2026-09-22', '2026-10-13'])
  })
  it('files each reading under the first exam after its last part', () => {
    const exams = [{ key: 'Exam 1', date: '2026-09-15' }, { key: 'Exam 2', date: '2026-10-22' }, { key: 'Final', date: '2026-12-11' }]
    const at = (title: string) => readingExamKey(items.find((i) => i.title === title)!, exams)
    expect(at('Manderson, “Applying Medical Anthropology in the Control of Infectious Disease”')).toBe('Exam 2')
    expect(at('Steinberg, Sizwe’s Test')).toBe('Exam 2')
    expect(at('King, “Crafting an Amish Biomedical Landscape”')).toBe('Exam 1')
    expect(at('Starobinets, Look at Him')).toBe('Final')
  })
  it('names the reading a class day discusses', () => {
    expect(readingsDiscussedOn(items, ['2026-09-29'])).toEqual(['Steinberg, Sizwe’s Test, pp. 79-162'])
  })
})
