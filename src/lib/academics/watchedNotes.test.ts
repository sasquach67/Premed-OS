import { describe, expect, it } from 'vitest'
import type { ClassCenterData, Course } from '@/lib/types'
import { createEmptyClassCenterData } from '@/data/personalInitialData'
import {
  acceptWatchedNotesProposal, addWatchedNotesSource, confirmWatchedNotesMapping,
  intakeWatchedNotesManifest, mapWatchedNotesEntry, skipWatchedNotesProposal,
} from './watchedNotes'
import { googleDriveContentIdentity } from './googleDriveMaterialSource'

const course = (id: string, code: string, title: string): Course => ({
  id, term: 'Fall 2026', code, title, credits: 3, grade: '', bcpm: false,
  status: 'in-progress', inResidence: true, satisfies: [], order: 0,
})

const courses = [course('biol', 'BIOL 252', 'Neurobiology'), course('chem', 'CHEM 262', 'Organic Chemistry II')]

function center(): ClassCenterData {
  return createEmptyClassCenterData()
}

describe('watched-note placement mapper', () => {
  it('recognizes exact course, week, and category levels without inventing fields', () => {
    const data = center()
    const source = addWatchedNotesSource(data, { id: 'source', provider: 'local-folder', rootLabel: 'GoodNotes', courseId: 'biol', selectedAt: 1 })!
    const placement = mapWatchedNotesEntry({
      source, courses,
      entry: { displayPath: 'BIOL 252/Week 3/Practice problems/axon.pdf' },
    })
    expect(placement).toMatchObject({ courseId: 'biol', week: 'Week 3', category: 'practice-problems', confidence: 'inferred' })
  })

  it('recognizes Wk and W shorthand and keeps an unknown directory in confirmation', () => {
    const data = center()
    const source = addWatchedNotesSource(data, { id: 'source', provider: 'local-folder', rootLabel: 'GoodNotes', courseId: 'biol', selectedAt: 1 })!
    expect(mapWatchedNotesEntry({ source, courses, entry: { displayPath: 'Wk 4/Notes/a.pdf' } })).toMatchObject({ week: 'Week 4', category: 'notes', confidence: 'inferred' })
    expect(mapWatchedNotesEntry({ source, courses, entry: { displayPath: 'W5/Homework/a.pdf' } })).toMatchObject({ week: 'Week 5', category: 'homework', confidence: 'inferred' })
    expect(mapWatchedNotesEntry({ source, courses, entry: { displayPath: 'Unsorted seminar/notes/a.pdf' } })).toMatchObject({ confidence: 'needs-confirmation' })
  })

  it('reuses only a confirmed exact level and re-prompts a new level', () => {
    const data = center()
    const source = addWatchedNotesSource(data, { id: 'source', provider: 'local-folder', rootLabel: 'GoodNotes', selectedAt: 1 })!
    confirmWatchedNotesMapping({ center: data, sourceId: source.id, mapping: { logicalLevel: 'Neuro week', courseId: 'biol', week: 'Week 7', category: 'notes' }, now: 2 })

    expect(mapWatchedNotesEntry({ source, courses, entry: { displayPath: 'Neuro week/a.pdf' } })).toMatchObject({ courseId: 'biol', week: 'Week 7', category: 'notes', confidence: 'confirmed' })
    expect(mapWatchedNotesEntry({ source, courses, entry: { displayPath: 'Neuro week 2/a.pdf' } })).toMatchObject({ confidence: 'needs-confirmation' })
  })
})

describe('watched-note review-before-apply', () => {
  it('creates proposals only, then accepts one as a metadata-only material with an honest confirm-week state', () => {
    const data = center()
    addWatchedNotesSource(data, { id: 'source', provider: 'local-folder', rootLabel: 'GoodNotes', courseId: 'biol', selectedAt: 1 })
    const intake = intakeWatchedNotesManifest({
      center: data, sourceId: 'source', courses, now: 3,
      entries: [{ displayPath: 'Notes/lecture-one.pdf', modifiedAt: 11, sizeBytes: 25, mimeType: 'application/pdf' }],
    })
    expect(intake.created).toHaveLength(1)
    expect(data.files).toEqual([])

    const accepted = acceptWatchedNotesProposal({ center: data, proposalId: intake.created[0].id, now: 4 })!
    expect(accepted).toMatchObject({ sourceType: 'folder-intake', owner: 'mine', processingStatus: 'pending' })
    expect(accepted.folderIntake).toMatchObject({ sourceId: 'source', proposalId: intake.created[0].id, placementState: 'confirm-week' })
    expect(data.watchedNoteProposals[0]).toMatchObject({ status: 'accepted', acceptedFileId: accepted.id })
  })

  it('refuses absolute or parent-traversal paths so a local machine path cannot reach persistence', () => {
    const data = center()
    addWatchedNotesSource(data, { id: 'source', provider: 'local-folder', rootLabel: 'GoodNotes', courseId: 'biol', selectedAt: 1 })
    const result = intakeWatchedNotesManifest({
      center: data, sourceId: 'source', courses,
      entries: [{ displayPath: '/Users/student/GoodNotes/lecture.pdf' }, { displayPath: '../GoodNotes/lecture.pdf' }],
    })
    expect(result).toMatchObject({ skippedInvalid: 2, created: [] })
    expect(data.watchedNoteProposals).toEqual([])
  })

  it('preserves skips and stable imports, and never overwrites a student-edited material when the source changes', () => {
    const data = center()
    addWatchedNotesSource(data, { id: 'source', provider: 'local-folder', rootLabel: 'GoodNotes', courseId: 'biol', selectedAt: 1 })
    const first = intakeWatchedNotesManifest({
      center: data, sourceId: 'source', courses, now: 2,
      entries: [{ displayPath: 'Week 1/Notes/lecture.pdf', modifiedAt: 10, sizeBytes: 20 }],
    })
    const file = acceptWatchedNotesProposal({ center: data, proposalId: first.created[0].id, now: 3 })!
    file.title = 'My clarified lecture notes'
    file.folderIntake!.week = 'Week 1'

    const rerunAfterInsertedFolder = intakeWatchedNotesManifest({
      center: data, sourceId: 'source', courses, now: 4,
      entries: [{ displayPath: 'Fall 2026/Week 1/Notes/lecture.pdf', modifiedAt: 10, sizeBytes: 20 }],
    })
    expect(rerunAfterInsertedFolder.created).toHaveLength(0)
    expect(rerunAfterInsertedFolder.reused).toHaveLength(1)
    expect(data.files).toHaveLength(1)
    expect(data.files[0].title).toBe('My clarified lecture notes')

    const changed = intakeWatchedNotesManifest({
      center: data, sourceId: 'source', courses, now: 5,
      entries: [{ displayPath: 'Fall 2026/Week 1/Notes/lecture.pdf', modifiedAt: 20, sizeBytes: 25 }],
    })
    expect(changed.created).toHaveLength(1)
    expect(data.files[0].title).toBe('My clarified lecture notes')

    expect(skipWatchedNotesProposal(data, changed.created[0].id, 6)).toBe(true)
    expect(data.watchedNoteProposals.find((proposal) => proposal.id === changed.created[0].id)?.status).toBe('skipped')
    expect(data.files).toHaveLength(1)
  })

  it('stages a changed Google Drive revision while a folder reorganization reuses the same proposal', () => {
    const data = center()
    addWatchedNotesSource(data, { id: 'drive', provider: 'google-drive', rootLabel: 'GoodNotes backup', courseId: 'biol', selectedAt: 1 })
    const original = intakeWatchedNotesManifest({
      center: data, sourceId: 'drive', courses, now: 2,
      entries: [{ displayPath: 'Week 1/Notes/lecture.pdf', contentIdentity: googleDriveContentIdentity('drive-file', '1') }],
    })
    expect(original.created).toHaveLength(1)
    const reorganized = intakeWatchedNotesManifest({
      center: data, sourceId: 'drive', courses, now: 3,
      entries: [{ displayPath: 'Fall/Week 1/Notes/lecture.pdf', contentIdentity: googleDriveContentIdentity('drive-file', '1') }],
    })
    expect(reorganized.reused).toHaveLength(1)
    const changed = intakeWatchedNotesManifest({
      center: data, sourceId: 'drive', courses, now: 4,
      entries: [{ displayPath: 'Fall/Week 1/Notes/lecture.pdf', contentIdentity: googleDriveContentIdentity('drive-file', '2') }],
    })
    expect(changed.created).toHaveLength(1)
    expect(data.files).toEqual([])
  })

  it('keeps personal mode record-free until the student chooses a source and accepts a proposal', async () => {
    const { createInitialDataForMode } = await import('@/store/store')
    const personal = createInitialDataForMode(false).academics.classCenter
    expect(personal.watchedNoteSources).toEqual([])
    expect(personal.watchedNoteProposals).toEqual([])
    expect(personal.files).toEqual([])
  })
})
