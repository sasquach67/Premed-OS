import { webcrypto } from 'node:crypto'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { ToastProvider } from '@/components/common/ToastProvider'
import { createInitialDataForMode, useStore } from '@/store/store'
import { importNotebook } from '@/lib/academics/notebook/import'
import { prepareNotebook } from '@/lib/academics/notebook/package'
import { revisionFixture } from '@/lib/academics/notebook/revision.test-fixtures'
import type { Course } from '@/lib/types'
import { Academics } from './Academics'
import { JournalEntryPage } from './JournalEntryPage'
import { LecturePage } from './LecturePage'

let root: Root, container: HTMLDivElement, id: string
const pkg = revisionFixture()
const course: Course = { id: 'route-course', code: pkg.course.code, title: pkg.course.title, term: pkg.course.term!, credits: 3, grade: '', bcpm: false, status: 'in-progress', inResidence: true, satisfies: [], order: 0 }
const notebook = () => useStore.getState().academics.classCenter.lectures.find(l => l.id === id)!.importedNotebook!
function HistoryControls() {
  const navigate = useNavigate(), location = useLocation()
  return <><output data-location>{location.pathname}</output><button onClick={() => navigate(-1)}>Browser back</button><button onClick={() => navigate(1)}>Browser forward</button><button onClick={() => navigate(`/academics/classes/${course.id}/lectures/${id}`)}>Lecture alias</button><button onClick={() => navigate(`/academics/classes/${course.id}`)}>Class route</button></>
}
beforeEach(async () => {
  vi.stubGlobal('crypto', webcrypto); vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} })
  vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })))
  sessionStorage.clear()
  const data = createInitialDataForMode(false); data.courses = [course]
  useStore.getState().replaceAll(data)
  const prepared = await prepareNotebook(JSON.stringify(pkg))
  useStore.getState().update(state => { [id] = importNotebook(state.academics.classCenter, course, prepared); const n = state.academics.classCenter.lectures.find(l => l.id === id)!.importedNotebook!; n.notes = 'Protected note'; n.progress = { 'question-mapping': { response: 'My saved answer', complete: true } } })
  container = document.createElement('div'); document.body.append(container); root = createRoot(container)
  await act(async () => root.render(<MemoryRouter initialEntries={[`/academics/classes/${course.id}/journal/${id}`]}><ToastProvider><Routes>
    <Route path="/academics" element={<Academics />} /><Route path="/academics/classes/:courseId" element={<Academics />} />
    <Route path="/academics/classes/:courseId/journal/:entryId" element={<JournalEntryPage />} />
    <Route path="/academics/classes/:courseId/lectures/:lectureId" element={<LecturePage />} />
  </Routes><HistoryControls /></ToastProvider></MemoryRouter>))
})
afterEach(async () => { await act(async () => root.unmount()); container.remove(); vi.unstubAllGlobals() })
function button(label: string) { const b = [...container.querySelectorAll('button')].find(b => b.textContent?.trim() === label); expect(b, label).toBeTruthy(); return b! }
async function click(label: string) { await act(async () => button(label).click()) }
function study() { expect(button('Study guide').getAttribute('aria-pressed')).toBe('true'); expect(container.querySelector('[aria-label="Update saved notebook"]')).toBeNull(); expect(container.textContent).not.toContain('Editing your copy') }

it.each(['Update this notebook', 'Edit entry', 'Practice recall', 'Sources'])('opens Study guide after %s, actual Class Center, and same notebook re-entry', async action => {
  await click(action)
  const retained = JSON.stringify(notebook())
  await click('Back to Class Notebook'); await click('Class Center')
  expect(container.querySelector('[data-location]')!.textContent).toBe('/academics')
  await click('Open')
  expect(container.querySelector('[data-location]')!.textContent).toBe(`/academics/classes/${course.id}`)
  const row = container.querySelector<HTMLButtonElement>('.imported-notebook-link')!
  expect(row.textContent).toContain(pkg.entries[0].title)
  await act(async () => row.click()); study(); expect(JSON.stringify(notebook())).toBe(retained)
  await click('Browser back'); await click('Browser forward'); study(); expect(JSON.stringify(notebook())).toBe(retained)
  await click('Lecture alias'); study(); await click('Practice recall'); await click('Class route')
  await act(async () => container.querySelector<HTMLButtonElement>('.imported-notebook-link')!.click()); study()
  expect(JSON.stringify(notebook())).toBe(retained)
})
