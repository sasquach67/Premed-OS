import { describe, expect, it } from 'vitest'
import { mergeSyllabusProposals, parseSyllabusText, weightGap } from './syllabusParser'

describe('syllabus parser', () => {
  const text = `CHEM 262 — Organic Chemistry II
Student learning outcomes
1. Explain aromatic substitution.
2. Distinguish stereochemical relationships.
Week 1: Aromatic substitution
Midterm Exam — October 14, 2026
Problem sets — 15%
Exams — 60%
Final — 25%
Problem set 1 due September 9, 2026
Attendance is required. Office hours Tuesday 2 PM.`

  it('extracts deterministic, attributable syllabus facts without a key', () => {
    const proposal = parseSyllabusText(text)
    expect(proposal.items.some((item) => item.kind === 'identity' && item.label === 'CHEM 262')).toBe(true)
    expect(proposal.items.some((item) => item.kind === 'exams' && item.value === '2026-10-14')).toBe(true)
    expect(proposal.items.filter((item) => item.kind === 'weights')).toHaveLength(3)
    expect(proposal.items.filter((item) => item.kind === 'standards').map((item) => item.label)).toEqual(['Explain aromatic substitution.', 'Distinguish stereochemical relationships.'])
    expect(proposal.items.find((item) => item.kind === 'units')?.evidence.location).toBe('line 5')
    expect(weightGap(proposal.items)).toBe(0)
  })

  it('calls a near-empty text layer a scan instead of claiming nothing parsed', () => {
    expect(parseSyllabusText('  ').scanDetected).toBe(true)
  })

  it('keeps schedule entries as context when the syllabus does not state learning standards', () => {
    const parsed = parseSyllabusText(`PSYC 101 — Introduction to Psychology
Week 1: Research enterprise in psychology
Week 2: Sensation and perception
Exam 1 — September 17, 2026`)

    expect(parsed.items.filter((item) => item.kind === 'units')).toHaveLength(2)
    expect(parsed.items.filter((item) => item.kind === 'standards')).toHaveLength(0)
  })

  it('reads a named course heading and numeric-date course schedule', () => {
    const parsed = parseSyllabusText(`Psychology 101.001 Introduction to Psychology
Fall 2026
Tues 8/25 Research Enterprise in Psychology Chapter 2 (Forum 1 due 8/25)
Thurs 9/3 Sensation and Perception Chapter 4 (Response Paper 1 due)
Tues 9/17 Exam 1
Final Exam Thursday, Dec 10 8a-11a`)

    expect(parsed.items).toEqual(expect.arrayContaining([
      expect.objectContaining({ kind: 'identity', label: 'PSYC 101', value: 'Introduction to Psychology' }),
      expect.objectContaining({ kind: 'units', label: 'Research Enterprise in Psychology' }),
      expect.objectContaining({ kind: 'deadlines', label: 'Forum 1', value: '2026-08-25' }),
      expect.objectContaining({ kind: 'deadlines', label: 'Response Paper 1', value: '2026-09-03' }),
      expect.objectContaining({ kind: 'exams', label: 'Exam 1', value: '2026-09-17' }),
      expect.objectContaining({ kind: 'exams', value: '2026-12-10' }),
    ]))
  })

  it('keeps real header logistics separate from later exam-location prose', () => {
    const parsed = parseSyllabusText(`PSYC 101 — Introduction to Psychology
TR 8am-9:15pm
Hanes Art Center Rm 121
Instructor: Ndidi Adeyanju, PhD
Final Exam Thursday, Dec 10 8a-11a at the same location as class meetings.`)
    const logistics = parsed.items.filter((item) => item.kind === 'logistics').map((item) => item.label)
    expect(logistics).toEqual(expect.arrayContaining(['TR 8am-9:15pm', 'Hanes Art Center Rm 121', 'Instructor: Ndidi Adeyanju, PhD']))
    expect(logistics).not.toContain(expect.stringContaining('same location as class meetings'))
  })

  it('merges related syllabus files without duplicating facts and retains per-file evidence', () => {
    const overview = parseSyllabusText(`CHEM 262 — Organic Chemistry II
Student learning outcomes
1. Explain aromatic substitution.
Problem sets — 15%`, 'Course overview.txt')
    const schedule = parseSyllabusText(`CHEM 262 — Organic Chemistry II
Midterm Exam — October 14, 2026
Week 1: Aromatic substitution`, 'Course schedule.txt')

    const merged = mergeSyllabusProposals([overview, schedule])

    expect(merged.sourceName).toBe('Course overview.txt + Course schedule.txt')
    expect(merged.items.filter((item) => item.kind === 'identity')).toHaveLength(1)
    expect(merged.items).toEqual(expect.arrayContaining([
      expect.objectContaining({ kind: 'standards', evidence: expect.objectContaining({ sourceName: 'Course overview.txt' }) }),
      expect.objectContaining({ kind: 'exams', evidence: expect.objectContaining({ sourceName: 'Course schedule.txt' }) }),
    ]))
    expect(merged.searched.exams).toContain('2 files')
  })

  it('recognizes written registrar schedules as class logistics', () => {
    const parsed = parseSyllabusText(`PSYC 101 — Introduction to Psychology
Instructor: Ndidi Adeyanju, PhD
T/Th 8:00 AM-9:15 AM`)
    expect(parsed.items).toEqual(expect.arrayContaining([
      expect.objectContaining({ kind: 'logistics', label: 'T/Th 8:00 AM-9:15 AM' }),
    ]))
    expect(parsed.structureFound).toContain('logistics')
  })

  it('stores the objective itself rather than its instructional lead-in', () => {
    const parsed = parseSyllabusText(`BIOL 103 — How Cells Function
Course learning objectives
Students will explain how membrane gradients drive transport.`)
    expect(parsed.items.filter((item) => item.kind === 'standards').map((item) => item.label)).toEqual([
      'explain how membrane gradients drive transport.',
    ])
  })

  it('reconstructs the ANTH 147 objectives, grade structure, readings, and exams from a flattened DOCX schedule', () => {
    const parsed = parseSyllabusText(`Anthropology 147 Comparative Healing Systems
Fall 2026
COURSE GOALS: Upon completion of ANTH 147, the student should be able to:
Demonstrate knowledge of the global diversity of cultural understandings about health, illness, the body, and systems of healing.
Explain some of the ways biomedicine is shaped by Western cultural ideas and the specific contexts in which it is practiced.
Explain why practitioners of health development and clinical medicine often encounter clashes between their cultural knowledge and the cultural knowledge of those they seek to help and describe anthropological approaches to addressing such challenges.
These are the learning outcomes that are expected of students after completing a FC-GLOBAL course.
Classify and analyze diverse historical, social, and political exchanges that shape nations, regions, and cultural traditions of the world.
Translate among contrasting civic cultures, social values, and moral commitments that characterize differences among peoples and societies, including those beyond the North Atlantic region.
Assess ways that political and economic institutions shape contemporary global relations.
Explain human and environmental challenges that transcend national borders.
Questions for Students
What forces connect and distinguish the experiences of peoples, societies, and human organization around the world?
Learning Outcomes for a Focus Capacities -KNOWING course.
Recognize and use one or more approach(es) to developing and validating knowledge of the unfamiliar world.
Evaluate ways that temporal, spatial, scientific, and philosophical categories structure knowledge.
Interrogate assumptions that underlie our own perceptions of the world.
Employ strategies to mitigate or adjust for preconceptions and biases.
Apply critical insights to understand patterns of experience and belief.
Questions for Students
What norms and expectations do I take for granted?
GRADING PROCEDURES:
Submit 6 Draft Reading Responses (RR) x 5 pts each: 30 pts (3%)
Oral Participation in Recitations: 100 pts (10%)
Submit 2 Revised RRs + Learning Assessment x 45 pts each: 90 pts (9%)
Midterm 1 240 pts (24%)
Midterm 2 260 pts (26%)
Final Exam 280 pts (28%)
SCHEDULE FOR CLASS, READINGS, RECITATION SECTIONS,
READING RESPONSE ESSAYS (RRs) AND EXAMS
Week/Theme
READING
Recitation to Discuss Previous Week's Readings?
Introduction: 8/19- 8/21
Symbols, Political Economy, and the Burdens of Inequality in Illness and Healing
Berry, N. “The Story of Rosario,” in Unsafe Motherhood: Mayan Maternal Mortality and Subjectivity in Post-War Guatemala, pp. xi-xix.
Medina, “Communicating with the Dead: Spiritual and Cultural Healing in Chicano/a Communities,” in Religion and Healing in America, pp.205–216.
No
Wk 4: 9/15-9/17
Exam Week
Theme II: Cultural Anthropology's Contributions to Knowledge of Infectious Diseases
Tuesday Exam #1
Manderson, Lenore. 1998. “Applying Medical Anthropology in the Control of Infectious Disease” Tropical Medicine and International Health vol. 3 no 12 pp. 1020-1027.
Wk 11: 11/3 – 11/5
Exam Week
Theme IV: The Anthropology of Biotechnology
Tues. EXAM #2
Starobinets, Anna. Look at Him. New York: Slavika Publishers, 2020.
Wk 15: 12/1 – LDOC
Review Week
Review for Final Exam
FINAL EXAM Fri. 12/11 @ 4:00
in our classroom`)

    expect(parsed.items.filter((item) => item.kind === 'standards').map((item) => item.label)).toEqual(expect.arrayContaining([
      'Demonstrate knowledge of the global diversity of cultural understandings about health, illness, the body, and systems of healing.',
      'Explain some of the ways biomedicine is shaped by Western cultural ideas and the specific contexts in which it is practiced.',
      'Explain why practitioners of health development and clinical medicine often encounter clashes between their cultural knowledge and the cultural knowledge of those they seek to help and describe anthropological approaches to addressing such challenges.',
      'Classify and analyze diverse historical, social, and political exchanges that shape nations, regions, and cultural traditions of the world.',
      'Recognize and use one or more approach(es) to developing and validating knowledge of the unfamiliar world.',
      'Apply critical insights to understand patterns of experience and belief.',
    ]))
    expect(parsed.items.filter((item) => item.kind === 'standards')).toHaveLength(12)
    expect(parsed.items.filter((item) => item.kind === 'weights').map((item) => item.value)).toEqual(['3%', '10%', '9%', '24%', '26%', '28%'])
    expect(weightGap(parsed.items)).toBe(0)
    expect(parsed.items).toEqual(expect.arrayContaining([
      expect.objectContaining({ kind: 'units', label: expect.stringContaining('Symbols, Political Economy'), value: '2026-08-19' }),
      expect.objectContaining({ kind: 'readings', label: expect.stringContaining('Story of Rosario'), value: '2026-08-19' }),
      expect.objectContaining({ kind: 'readings', label: expect.stringContaining('Communicating with the Dead'), value: '2026-08-19' }),
      expect.objectContaining({ kind: 'exams', label: 'Exam 1', value: '2026-09-15' }),
      expect.objectContaining({ kind: 'readings', label: expect.stringContaining('Applying Medical Anthropology'), value: '2026-09-15' }),
      expect.objectContaining({ kind: 'exams', label: 'Exam 2', value: '2026-11-03' }),
      expect.objectContaining({ kind: 'exams', label: 'Final Exam', value: '2026-12-11' }),
    ]))
    expect(parsed.items.filter((item) => item.kind === 'standards').some((item) => /Story of Rosario|Exam Week|Biotechnology/i.test(item.label))).toBe(false)
  })

  it('does not turn a publication date inside a scheduled reading into coursework', () => {
    const parsed = parseSyllabusText(`ANTH 147 — Comparative Healing Systems
Fall 2026
SCHEDULE FOR CLASS, READINGS, RECITATION SECTIONS, AND EXAMS
Wk 14: 11/24
Cultural Approaches
Villarosa, L. 2018. “Why America’s Black Mothers and Babies Are in a Life-or-Death Crisis” The New York Times Magazine, April 11. https://www.nytimes.com/2018/04/11/magazine/example`)
    expect(parsed.items.filter((item) => item.kind === 'deadlines')).toHaveLength(0)
    expect(parsed.items).toEqual(expect.arrayContaining([
      expect.objectContaining({ kind: 'readings', label: expect.stringContaining('Villarosa'), value: '2026-11-24' }),
    ]))
  })

  it('uses the stated term year instead of an earlier publication year', () => {
    const parsed = parseSyllabusText(`ANTH 147 — Comparative Healing Systems
Copyright 2018
Fall 2026
SCHEDULE FOR CLASS, READINGS, RECITATION SECTIONS, AND EXAMS
Wk 4: 9/15-9/17
Exam Week
Tuesday Exam #1`)

    expect(parsed.items).toEqual(expect.arrayContaining([
      expect.objectContaining({ kind: 'exams', label: 'Exam 1', value: '2026-09-15' }),
    ]))
  })
})

describe('document classification (§4.1-M-d)', () => {
  const problemSet = [
    'CHEM 262 Problem Set 6',
    'Due Oct 24, 2026',
    '1. Draw the mechanism for the following substitution.',
    '2. Rank the leaving groups below.',
    '3. Predict the major product.',
  ].join('\n')

  const thinSyllabus = [
    'CHEM 262 - Organic Chemistry II',
    'Instructor: Dr. Alvarez, office hours Tue 2:00 PM, room 214',
  ].join('\n')

  it('calls a problem set unrecognized — a lone due date is not structure', () => {
    const parsed = parseSyllabusText(problemSet, 'Problem Set 6.pdf')
    expect(parsed.documentKind).toBe('unrecognized')
    expect(parsed.structureFound).toEqual([])
    expect(parsed.numberedItems).toBe(3)
  })

  it('keeps a one-page syllabus with only logistics as a syllabus', () => {
    const parsed = parseSyllabusText(thinSyllabus, 'Syllabus.pdf')
    expect(parsed.documentKind).toBe('syllabus')
    expect(parsed.structureFound).toContain('logistics')
  })

  it('never calls an unreadable scan unrecognized — that is a different diagnosis', () => {
    const parsed = parseSyllabusText('', 'Scan.pdf', 'image')
    expect(parsed.scanDetected).toBe(true)
    expect(parsed.documentKind).toBe('syllabus')
  })

  it('reports the structural signals it did find', () => {
    const parsed = parseSyllabusText(['CHEM 262 - Organic Chemistry II', 'Problem sets 15%', 'Week 1 Introduction'].join('\n'))
    expect(parsed.documentKind).toBe('syllabus')
    expect(parsed.structureFound).toEqual(expect.arrayContaining(['weights', 'units']))
  })
})
