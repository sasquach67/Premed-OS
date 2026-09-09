import { expect, it } from 'vitest'
import { notebookExportFilename, notebookFilename, notebookPackageFilename } from './downloadFilename'
import { revisionFixture, withNewTopic } from './revision.test-fixtures'

it('preserves safe title text and uses matching JSON and ZIP names', () => {
  const title = "Lesson 2 - Gene to Protein (student's notes) \u00e9"
  expect(notebookFilename(title)).toBe(`${title}.json`)
  expect(notebookFilename(title, 'zip')).toBe(`${title}.zip`)
})

it.each([
  ['Lesson: "A/B" \\ notes?*<>|\n\u0000\u007f', 'Lesson- -A-B- - notes--------.json'],
  ['  ..Lesson 2.  ', 'Lesson 2.json'],
  ['...', 'Notebook.json'],
  ['   ', 'Notebook.json'],
  ['CON', '_CON.json'],
  ['lpt1.topic', '_lpt1.topic.json'],
])('makes the title %j safe without a provider, ID or build suffix', (title, expected) => {
  expect(notebookFilename(title)).toBe(expected)
})

it('bounds long UTF-8 filenames without splitting a Unicode character', () => {
  const name = notebookFilename('\u{1f9e0}'.repeat(200))
  expect(name).toBe(`${'\u{1f9e0}'.repeat(60)}.json`)
  expect(new TextEncoder().encode(name).length).toBeLessThanOrEqual(255)
})

it('uses the selected current or original entry title without mutating any package', () => {
  const original = withNewTopic(revisionFixture()), current = structuredClone(original)
  current.entries[1].title = 'My revised topic'
  const notebook = { original, current, entryId: 'new-topic' }, before = JSON.stringify(notebook)
  expect(notebookExportFilename(notebook, 'current')).toBe('My revised topic.json')
  expect(notebookExportFilename(notebook, 'original')).toBe('New separate topic.json')
  expect(notebookExportFilename(notebook, 'backup')).toBe('My revised topic.json')
  expect(notebookExportFilename(notebook, 'current', 'zip')).toBe('My revised topic.zip')
  expect(notebookExportFilename(notebook, 'backup', 'zip')).toBe('My revised topic.zip')
  expect(JSON.stringify(notebook)).toBe(before)
  expect(() => notebookPackageFilename(current, 'missing')).toThrow('selected notebook entry is missing')
})
