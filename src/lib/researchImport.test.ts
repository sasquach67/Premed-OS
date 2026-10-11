import { describe, expect, it } from 'vitest'
import { createPersonalInitialData } from '@/data/personalInitialData'
import type { CollectionRecord, ExperienceEntry } from '@/lib/types'
import { applyResearchImport, compactCitation, leadingDate, parseHours, parseResearchText, reminderText, type ResearchImportItem } from './researchImport'

const TODAY = '2026-10-11'

/** Fictional, but laid out like a real lab onboarding document after Word → raw
 * text: no bullets, no heading styles, one paragraph per line. */
const ONBOARDING = `Welcome to the Rivera Lab!

Fall 2026

Lab Manager

Dana Okafor

dokafor@email.state.edu

Mailing Address

12 Science Drive

Marisol’s Office Phone

(555) 010-2000

Onboarding Checklist

Building badge access

admin@med.state.edu

EHS Safety Forms

https://ehs.example.edu/forms/

Access to shared groups

Slack

riveralab.slack.com

Lab Archives

Rivera Lab

Set up 1:1 meeting time with Marisol

Guidelines and Expectations

Updated January 2026

This document is constantly evolving with input welcomed from all lab members.

Communication

Use Slack to communicate with the group and with Marisol.

Please cc Marisol on any emails sent to other PIs.

Meetings

You are required to attend lab meeting and strongly encouraged to attend the Cell Biology seminar.

Each lab member is required to have a standing 1:1 meeting with Marisol.

Dana is the Lab Animal Coordinator, manager of the mouse colony.

Acknowledgement and Assurance

Name: ____________

Monday

Wednesday

12:30-1:30 Cell Biology Seminar

Cell Biology Seminar

Monday, 12:30-1:30

Main auditorium

Lab Meeting

Wednesday, 2:30-4pm

Room 3311

Please contact Lee Park to be added to the seminar listserv.

lpark@email.state.edu

Reading List

Organoids

Reviews:

Smith A, Jones B, Lee C, Kim D. Organoids in practice. Nat Rev Example. 2021 Jan;22(1):39-53. doi: 10.1000/example. Epub 2020 Sep 21. PMID: 123456.
`

const NOTES = `Fall 2026 lab notebook — DPPH project

10/6/2026 — DPPH run 3 on extract B (1–4:30pm)
Absorbance drifted on replicate 2; check the cuvette
Abstract due Nov 3 — draft the methods first

Oct 8: lab meeting with Marisol, 2.5h

October 9
Read two papers on aged garlic antioxidants

10/20/2026 — Poster session in the atrium
`

describe('Research import: onboarding document', () => {
  const proposal = parseResearchText(ONBOARDING, 'onboarding.docx', { today: TODAY })
  const of = (kind: ResearchImportItem['kind']) => proposal.items.filter((item) => item.kind === kind)

  it('recognises an onboarding document and never turns its own dates into lab days', () => {
    expect(proposal.documentKind).toBe('onboarding')
    expect(of('logs')).toEqual([])
    expect(proposal.notFound).toContain('logs')
  })

  it('reads lab identity with honest confidence', () => {
    expect(of('lab').map((item) => [item.labField, item.label, item.confidence])).toEqual([
      ['org', 'Rivera Lab', 'high'],
      ['since', 'Fall 2026', 'low'],
      ['institution', 'STATE', 'low'],
      ['pi', 'Marisol Rivera', 'low'],
    ])
  })

  it('finds people with role, email and phone, and folds a first-name phone line into the PI', () => {
    const people = of('people').map((item) => item.person)
    expect(people).toEqual([
      { name: 'Dana Okafor', role: 'Lab Manager · Lab Animal Coordinator', email: 'dokafor@email.state.edu' },
      expect.objectContaining({ name: 'Marisol Rivera', role: 'PI', phone: 'office (555) 010-2000' }),
      { name: 'Lee Park', role: 'Contact for seminar listserv', email: 'lpark@email.state.edu' },
    ])
    expect(of('people').find((item) => item.isPi)?.person?.name).toBe('Marisol Rivera')
  })

  it('attaches contacts and links to the checklist item above them', () => {
    expect(of('checklist').map((item) => [item.label, item.detail])).toEqual([
      ['Building badge access', 'admin@med.state.edu'],
      ['EHS Safety Forms', 'https://ehs.example.edu/forms/'],
      ['Access to shared groups', undefined],
      ['Slack', 'riveralab.slack.com'],
      ['Lab Archives', 'Rivera Lab'],
      ['Set up 1:1 meeting time with Marisol', undefined],
    ])
  })

  it('reads standing meetings once each, with room and required/encouraged status', () => {
    expect(of('meetings').map((item) => item.label)).toEqual([
      'Cell Biology Seminar — Monday 12:30–1:30 · Main auditorium · encouraged',
      'Lab Meeting — Wednesday 2:30–4pm · Room 3311 · required',
      '1:1 with Marisol — standing meeting, time not set in this document · required',
    ])
  })

  it('offers guidelines and reading unchecked, grouped, without document metadata', () => {
    const guidelines = of('guidelines')
    expect(guidelines.every((item) => !item.selected)).toBe(true)
    expect(guidelines.map((item) => item.label)).not.toContain('This document is constantly evolving with input welcomed from all lab members.')
    expect(guidelines[0]).toMatchObject({ label: 'Use Slack to communicate with the group and with Marisol.', detail: 'Communication' })
    expect(of('reading')).toEqual([expect.objectContaining({ selected: false, detail: 'Organoids · Reviews', label: 'Smith A et al. Organoids in practice. Nat Rev Example. 2021 Jan;22(1):39-53. doi: 10.1000/example.' })])
  })

  it('keeps the exact source line as evidence', () => {
    expect(of('checklist')[0].evidence).toEqual({ quote: 'Building badge access', location: 'line 21' })
  })
})

describe('Research import: lab notes', () => {
  const proposal = parseResearchText(NOTES, 'notes.txt', { today: TODAY })
  const of = (kind: ResearchImportItem['kind']) => proposal.items.filter((item) => item.kind === kind)

  it('turns every dated entry into a lab day unless a date says otherwise', () => {
    expect(proposal.documentKind).toBe('lab-notes')
    expect(of('logs').map((item) => [item.date, item.hours, item.label, item.detail])).toEqual([
      ['2026-10-06', 3.5, 'DPPH run 3 on extract B', 'Absorbance drifted on replicate 2; check the cuvette\nAbstract due Nov 3 — draft the methods first'],
      ['2026-10-08', 2.5, 'lab meeting with Marisol', undefined],
      ['2026-10-09', undefined, 'Read two papers on aged garlic antioxidants', undefined],
    ])
  })

  it('sends a future entry and a dated deadline inside an entry to Upcoming', () => {
    expect(of('upcoming').map((item) => [item.date, item.label])).toEqual([
      ['2026-11-03', 'Abstract due Nov 3 — draft the methods first'],
      ['2026-10-20', 'Poster session in the atrium'],
    ])
  })

  it('reads a date + hours + task spreadsheet row', () => {
    const rows = parseResearchText('Date,Hours,Task\n9/29/2026,4,Prepared extract C\n9/30/2026,2,Ran controls', 'hours.csv', { today: TODAY })
    expect(rows.items.filter((item) => item.kind === 'logs').map((item) => [item.date, item.hours, item.label])).toEqual([
      ['2026-09-29', 4, 'Prepared extract C'],
      ['2026-09-30', 2, 'Ran controls'],
    ])
  })

  it('does not mistake a weekday-dated note for a standing meeting', () => {
    const notes = parseResearchText('Extraction work\nMon 10/5 — weighed samples\nTue 10/6 — ran assay', 'notes.txt', { today: TODAY })
    expect(notes.items.filter((item) => item.kind === 'meetings')).toEqual([])
    expect(notes.items.filter((item) => item.kind === 'logs').map((item) => item.date)).toEqual(['2026-10-05', '2026-10-06'])
  })

  it('calls an empty source unreadable rather than empty', () => {
    expect(parseResearchText('   ').scanDetected).toBe(true)
  })
})

describe('Research import helpers', () => {
  it.each([
    ['3h', 3], ['2.5 hrs', 2.5], ['Hours: 4', 4], ['1–4:30pm', 3.5], ['9-12pm', 3], ['10-2pm', 4], ['1:00 PM – 4:30 PM', 3.5], ['13:00-16:30', 3.5],
  ])('reads hours from %s', (text, hours) => expect(parseHours(text)?.hours).toBe(hours))

  it('rejects implausible clock ranges', () => expect(parseHours('1-40pm')).toBeUndefined())

  it('places a yearless date more than a week ahead in the previous year', () => {
    expect(leadingDate('Dec 2 — ran gel', 2026, TODAY)?.iso).toBe('2025-12-02')
    expect(leadingDate('Oct 14 — ran gel', 2026, TODAY)?.iso).toBe('2026-10-14')
    expect(leadingDate('2026-02-30 — impossible', 2026, TODAY)).toBeUndefined()
  })

  it('compacts long author lists only', () => {
    expect(compactCitation('Smith A, Jones B. Short list. J Ex. 2020.')).toBe('Smith A, Jones B. Short list. J Ex. 2020.')
  })
})

describe('applying a reviewed Research import', () => {
  const lab = (id: string, extra: Partial<CollectionRecord<ExperienceEntry>> = {}): CollectionRecord<ExperienceEntry> => ({ id, category: 'research', org: 'Rivera Lab', role: '', description: '', status: 'active', tags: [], order: 0, ...extra })
  const chosen = () => parseResearchText(ONBOARDING, 'onboarding.docx', { today: TODAY }).items.filter((item) => item.selected)

  it('creates the lab, people, PI link and pinned reminders in one pass', () => {
    const data = createPersonalInitialData()
    const summary = applyResearchImport(data, { kind: 'new', name: 'Rivera Lab' }, chosen(), 1000)
    const created = data.experiences.find((entry) => entry.id === summary.labId)!
    expect(created).toMatchObject({ category: 'research', org: 'Rivera Lab', research: { current: true, since: 'Fall 2026', institution: 'STATE' } })
    expect(data.persons.find((person) => person.id === created.supervisorId)?.name).toBe('Marisol Rivera')
    expect(data.researchMemberships.filter((link) => link.experienceId === created.id)).toHaveLength(3)
    expect(data.researchReminders.filter((row) => row.experienceId === created.id).map((row) => row.text)).toEqual([
      'Cell Biology Seminar — Monday 12:30–1:30 · Main auditorium · encouraged',
      'Lab Meeting — Wednesday 2:30–4pm · Room 3311 · required',
      '1:1 with Marisol — standing meeting, time not set in this document · required',
      'To do: Building badge access — admin@med.state.edu',
      'To do: EHS Safety Forms — https://ehs.example.edu/forms/',
      'To do: Access to shared groups',
      'To do: Slack — riveralab.slack.com',
      'To do: Lab Archives — Rivera Lab',
      'To do: Set up 1:1 meeting time with Marisol',
    ])
    expect(summary).toMatchObject({ lab: 'created', added: { people: 3, meetings: 3, checklist: 6 } })
  })

  it('is safe to run twice and never overwrites filled lab facts', () => {
    const data = createPersonalInitialData()
    data.experiences = [lab('lab', { research: { institution: 'My University' } })]
    applyResearchImport(data, { kind: 'existing', labId: 'lab' }, chosen(), 1000)
    const counts = () => [data.persons.length, data.researchMemberships.length, data.researchReminders.length]
    const first = counts()
    const second = applyResearchImport(data, { kind: 'existing', labId: 'lab' }, chosen(), 2000)
    expect(counts()).toEqual(first)
    expect(second.added).toEqual({})
    expect(data.experiences[0].research?.institution).toBe('My University')
  })

  it('links an existing person by email instead of creating a duplicate', () => {
    const data = createPersonalInitialData()
    data.experiences = [lab('lab')]
    data.persons = [{ id: 'p1', name: 'Dana O.', email: 'DOKAFOR@email.state.edu', createdAt: 1, updatedAt: 1, archived: false, order: 0 }]
    applyResearchImport(data, { kind: 'existing', labId: 'lab' }, chosen().filter((item) => item.person?.name === 'Dana Okafor'), 1000)
    expect(data.persons).toHaveLength(1)
    expect(data.researchMemberships[0]).toMatchObject({ personId: 'p1', roleInLab: 'Lab Manager · Lab Animal Coordinator' })
  })

  it('writes lab days and upcoming items, skipping an entry already logged', () => {
    const data = createPersonalInitialData()
    data.experiences = [lab('lab')]
    const items = parseResearchText(NOTES, 'notes.txt', { today: TODAY }).items
    applyResearchImport(data, { kind: 'existing', labId: 'lab' }, items, 1000)
    expect(data.experienceHourEntries.map((row) => [row.date, row.hours, row.note])).toEqual([
      ['2026-10-06', 3.5, 'DPPH run 3 on extract B'],
      ['2026-10-08', 2.5, 'lab meeting with Marisol'],
      ['2026-10-09', 0, 'Read two papers on aged garlic antioxidants'],
    ])
    expect(data.researchUpcomingItems.map((row) => row.date)).toEqual(['2026-11-03', '2026-10-20'])
    expect(applyResearchImport(data, { kind: 'existing', labId: 'lab' }, items, 2000).skipped).toBe(5)
  })

  it('refuses a lab that disappeared before saving', () => {
    expect(() => applyResearchImport(createPersonalInitialData(), { kind: 'existing', labId: 'gone' }, [], 1)).toThrow(/no longer available/)
  })

  it('prefixes reminder text by kind', () => {
    expect(reminderText({ id: 'x', kind: 'reading', label: 'A paper.', confidence: 'high', selected: true, evidence: { quote: '', location: '' } })).toBe('Read: A paper.')
  })
})
