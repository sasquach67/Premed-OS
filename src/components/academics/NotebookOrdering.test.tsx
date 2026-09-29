import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ClassHub } from './ClassHub'
import { LecturePage } from '@/pages/LecturePage'
import { ToastProvider } from '@/components/common/ToastProvider'
import { createSeedData } from '@/data/seed'
import { revisionFixture } from '@/lib/academics/notebook/revision.test-fixtures'
import type { LectureRecord } from '@/lib/types'
import { CURRENT_STORE_VERSION, STORAGE_KEY, useStore } from '@/store/store'

;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} })
vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })))
HTMLElement.prototype.scrollIntoView = vi.fn()
HTMLElement.prototype.hasPointerCapture = vi.fn(() => false)
HTMLElement.prototype.setPointerCapture = vi.fn()

let courseId: string
function ReactiveHub() {
  const data = useStore(state => state.academics.classCenter)
  const course = useStore(state => state.courses.find(item => item.id === courseId)!)
  const persons = useStore(state => state.persons)
  return <ClassHub course={course} workspace={data.workspaces.find(item => item.courseId === courseId)!} data={data} persons={persons} />
}

describe('Notebook list ordering and metadata controls', () => {
  let container: HTMLDivElement
  let root: Root
  const rowIds = () => [...container.querySelectorAll('[data-notebook-row]')].map(row => row.getAttribute('data-notebook-row'))
  const button = (label: string) => document.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`)!
  const menuItem = (label: string) => [...document.querySelectorAll<HTMLElement>('[role="menuitem"]')].find(item => item.textContent === label)!
  const click = async (element: HTMLElement) => { expect(element).toBeTruthy(); await act(async () => element.click()) }
  async function menu(title: string) {
    await act(async () => button(`Actions for ${title}`).dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', bubbles: true })))
  }
  async function edit(title: string, date: string, newTitle?: string) {
    await menu(title)
    await click(menuItem('Edit lecture'))
    // Radix restores menu focus on a zero-delay task. Finish that transition
    // before opening the nested date popover, as a user's next event would.
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 0)) })
    if (newTitle) await act(async () => {
      const input = document.querySelector<HTMLInputElement>('input[aria-label="Lecture title"]')!
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, newTitle)
      input.dispatchEvent(new Event('input', { bubbles: true }))
    })
    await click(button('Lecture date'))
    await click(document.querySelector<HTMLButtonElement>(`button[data-date="${date}"]`)!)
    await click([...document.querySelectorAll<HTMLButtonElement>('button')].find(item => item.textContent === 'Save changes')!)
  }
  beforeEach(async () => {
    const seed = structuredClone(createSeedData())
    const workspace = seed.academics.classCenter.workspaces.find(item => item.type === 'stem')!
    courseId = workspace.courseId
    const course = seed.courses.find(item => item.id === courseId)!
    course.code = 'TEST 101'; course.title = 'Synthetic notebook testing'
    const row = (id: string, occurredOn?: string): LectureRecord => ({ id, courseId, title: id, occurredOn, inputPath: 'pasted', processingState: 'ready', createdAt: new Date('2026-09-05T12:00:00').getTime(), updatedAt: 100, order: 0, notebookGeneratedRequest: `Synthetic content for ${id}` })
    const pkg = revisionFixture()
    const imported = row('Imported', '2026-09-20')
    imported.importedNotebook = { original: pkg, current: pkg, originalRaw: JSON.stringify(pkg), entryId: pkg.entries[0].id, fingerprint: 'synthetic', importedAt: new Date('2026-09-09T12:00:00').getTime(), progress: { 'question-mapping': { response: 'Synthetic answer', complete: true } }, notes: 'Preserve synthetic notes', history: [{ id: 'history-1', savedAt: 5, reason: 'edit', current: pkg, notes: 'Earlier notes', progress: {} }] }
    seed.academics.classCenter.lectures = [row('Later', '2026-09-15'), row('Earlier', '2026-09-10'), imported, row('Undated')]
    useStore.getState().replaceAll(seed)
    container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container)
    await act(async () => root.render(<MemoryRouter><ToastProvider><ReactiveHub /></ToastProvider></MemoryRouter>))
  })
  afterEach(async () => { await act(async () => root.unmount()); container.remove(); vi.restoreAllMocks() })

  it('moves via menus, disables boundary actions, announces, persists, and resets to oldest class date', async () => {
    expect(rowIds()).toEqual(['Earlier', 'Later', 'Imported', 'Undated'])
    expect([...container.querySelectorAll('button')].some(item => item.textContent === 'Sort by class date')).toBe(false)
    const before = structuredClone(useStore.getState().academics.classCenter.lectures)
    await menu('Earlier')
    expect(menuItem('Move up').getAttribute('aria-disabled')).toBe('true')
    await click(menuItem('Move down'))
    expect(rowIds()).toEqual(['Later', 'Earlier', 'Imported', 'Undated'])
    expect(container.querySelector('.lecture-journal [role="status"]')?.textContent).toBe('Earlier moved to position 2 of 4.')
    expect(container.textContent).toContain('Your order')
    expect([...container.querySelectorAll('button')].some(item => item.textContent === 'Sort by class date')).toBe(true)
    await menu('Undated')
    expect(menuItem('Move down').getAttribute('aria-disabled')).toBe('true')
    await click(menuItem('Move up'))
    expect(rowIds()).toEqual(['Later', 'Earlier', 'Undated', 'Imported'])
    const persisted = useStore.persist.getOptions().partialize!(useStore.getState())
    await act(async () => {
      useStore.getState().replaceAll(createSeedData())
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ state: persisted, version: CURRENT_STORE_VERSION }))
      await useStore.persist.rehydrate()
    })
    expect(rowIds()).toEqual(['Later', 'Earlier', 'Undated', 'Imported'])
    await click([...container.querySelectorAll<HTMLButtonElement>('button')].find(item => item.textContent === 'Sort by class date')!)
    expect(rowIds()).toEqual(['Earlier', 'Later', 'Imported', 'Undated'])
    expect(container.querySelector('.lecture-journal [role="status"]')?.textContent).toContain('oldest first')
    expect([...container.querySelectorAll('button')].some(item => item.textContent === 'Sort by class date')).toBe(false)
    for (const original of before) {
      const current = useStore.getState().academics.classCenter.lectures.find(item => item.id === original.id)!
      expect(current.notebookGeneratedRequest).toBe(original.notebookGeneratedRequest)
      expect(current.importedNotebook).toEqual(original.importedNotebook)
      expect(current.updatedAt).toBe(original.updatedAt)
    }
  })

  it('edits imported titles and class dates in default and manual order without changing notebook content', async () => {
    const original = structuredClone(useStore.getState().academics.classCenter.lectures.find(item => item.id === 'Imported')!.importedNotebook)
    await edit('Imported', '2026-09-08', 'Renamed imported')
    expect(rowIds()).toEqual(['Imported', 'Earlier', 'Later', 'Undated'])
    expect(button('Actions for Renamed imported')).toBeTruthy()
    await menu('Renamed imported'); await click(menuItem('Move down'))
    await edit('Renamed imported', '2026-09-25')
    expect(rowIds()).toEqual(['Earlier', 'Imported', 'Later', 'Undated'])
    const saved = useStore.getState().academics.classCenter.lectures.find(item => item.id === 'Imported')!
    expect(saved.occurredOn).toBe('2026-09-25')
    expect(saved.importedNotebook).toEqual(original)
  })

  it('shows an explicitly renamed native title even when a legacy AI title exists', async () => {
    await act(async () => useStore.getState().update(draft => { const row = draft.academics.classCenter.lectures.find(item => item.id === 'Earlier')!; row.aiTitle = 'Legacy generated name'; row.studyGuide = { specId: 'synthetic', specHash: 'synthetic', courseId, topicId: 'synthetic', sections: [{ id: 'old-heading', title: 'Old generated heading', blocks: [] }] } }))
    await edit('Earlier', '2026-09-10', 'Student renamed title')
    const row = container.querySelector('[data-notebook-row="Earlier"]')!
    expect(row.textContent).toContain('Student renamed title')
    expect(row.textContent).not.toContain('Legacy generated name')
    expect(row.textContent).not.toContain('Old generated heading')
    expect(useStore.getState().academics.classCenter.lectures.find(item => item.id === 'Earlier')!.aiTitle).toBe('Legacy generated name')
  })


  it('keeps a numbered lecture identity when moved first and opened in the reader', async () => {
    await act(async () => useStore.getState().update(draft => {
      const lecture = draft.academics.classCenter.lectures.find(item => item.id === 'Later')!
      lecture.title = 'Lecture 2'
      lecture.workspaceState = 'complete'
      lecture.studyGuide = { specId: 'synthetic', specHash: 'synthetic', courseId, topicId: 'synthetic', sections: [] }
    }))
    await menu('Lecture 2'); await click(menuItem('Move up'))
    expect(rowIds()[0]).toBe('Later')
    await act(async () => root.unmount())
    root = createRoot(container)
    await act(async () => root.render(<MemoryRouter initialEntries={[`/academics/classes/${courseId}/lectures/Later`]}><ToastProvider><Routes><Route path="/academics/classes/:courseId/lectures/:lectureId" element={<LecturePage />} /></Routes></ToastProvider></MemoryRouter>))
    const heading = container.querySelector('h1')!
    expect(heading.textContent).toBe('Lesson 2')
    expect(heading.previousElementSibling?.textContent).toMatch(/^Lecture\s+·/)
    expect(heading.previousElementSibling?.textContent).not.toContain('Lecture 1')
    await click([...container.querySelectorAll<HTMLButtonElement>('button')].find(item => item.textContent === 'Switch lecture')!)
    const catalogRow = document.querySelector('button.lecture-workspace-catalog-record[aria-current="page"]')!
    expect(catalogRow.textContent).toContain('Lesson 2')
    expect(catalogRow.textContent).not.toContain('Lecture 1')
  })

  it('labels missing class dates as Added for imported and native entries', async () => {
    await act(async () => useStore.getState().update(draft => { draft.academics.classCenter.lectures.find(item => item.id === 'Imported')!.occurredOn = undefined }))
    for (const id of ['Imported', 'Undated']) {
      const row = container.querySelector(`[data-notebook-row="${id}"]`)!
      expect(row.querySelector('time')?.textContent).toMatch(/^Added Sep /)
      expect(row.querySelector('time')?.getAttribute('title')).toMatch(/^Added /)
    }
    expect(rowIds().slice(0, 2)).toEqual(['Earlier', 'Later'])
  })

  it('reorders through the real dnd-kit keyboard sensor without opening the entry', async () => {
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
      const row = this.closest('[data-notebook-row]')
      const index = row ? rowIds().indexOf(row.getAttribute('data-notebook-row')) : 0
      return { x: 0, y: index * 80, left: 0, top: index * 80, right: 400, bottom: index * 80 + 70, width: 400, height: 70, toJSON() {} }
    })
    const handle = button('Reorder Earlier')
    const key = async (target: EventTarget, code: string) => { await act(async () => { target.dispatchEvent(new KeyboardEvent('keydown', { code, key: code === 'Space' ? ' ' : code, bubbles: true })); await new Promise(resolve => setTimeout(resolve, 30)) }) }
    handle.focus()
    await key(handle, 'Space')
    expect(handle.getAttribute('aria-pressed')).toBe('true')
    await key(document, 'ArrowDown')
    await key(document, 'Space')
    expect(rowIds()).toEqual(['Later', 'Earlier', 'Imported', 'Undated'])
    expect(container.querySelector('.lecture-journal [role="status"]')?.textContent).toContain('Earlier moved to position 2')
    expect(container.querySelector('.lecture-journal-item[data-state="open"]')).toBeNull()
  })
})
