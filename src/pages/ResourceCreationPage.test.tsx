import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { beforeEach, afterEach, expect, it, vi } from 'vitest'
import { createSeedData } from '@/data/seed'
import { createInitialDataForMode, useStore } from '@/store/store'
import { ClassHub } from '@/components/academics/ClassHub'
import { ToastProvider } from '@/components/common/ToastProvider'
import { ResourceCreationPage } from './ResourceCreationPage'

let root: Root, container: HTMLDivElement
const seed = createSeedData()
const workspace = seed.academics.classCenter.workspaces.find(item => item.type === 'stem')!
const course = seed.courses.find(item => item.id === workspace.courseId)!
const base = `/academics/classes/${course.id}`
function Location() { return <output data-location>{useLocation().pathname}</output> }
beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} })
  vi.stubGlobal('matchMedia', vi.fn(() => ({matches:false,addEventListener:vi.fn(),removeEventListener:vi.fn()})))
  HTMLElement.prototype.scrollIntoView = vi.fn()
  HTMLElement.prototype.hasPointerCapture = vi.fn(() => false)
  HTMLElement.prototype.setPointerCapture = vi.fn()
  useStore.getState().replaceAll(structuredClone(seed))
  container = document.createElement('div'); document.body.append(container); root = createRoot(container)
})
afterEach(async () => { await act(async () => root.unmount()); container.remove(); useStore.getState().replaceAll(createInitialDataForMode(false)); vi.unstubAllGlobals() })
async function render(url: string) {
  await act(async () => root.render(<MemoryRouter initialEntries={[url]}><ToastProvider><Routes>
    <Route path="/academics/classes/:courseId" element={<ClassHub course={course} workspace={workspace} data={seed.academics.classCenter} persons={seed.persons} />} />
    <Route path="/academics/classes/:courseId/resources/:resource" element={<ResourceCreationPage />} />
  </Routes><Location /></ToastProvider></MemoryRouter>))
}
it.each([['Flashcards','flashcards','Create flashcards'],['Revised notes','revised-notes','Revise your notes']])('opens %s directly as a dedicated page and returns to class', async (label, resource, title) => {
  await render(base)
  const trigger = container.querySelector<HTMLButtonElement>('[aria-label="Create study resources"]')!
  await act(async () => trigger.dispatchEvent(new MouseEvent('pointerdown',{bubbles:true,button:0})))
  const item = [...document.body.querySelectorAll<HTMLElement>('[role=menuitem]')].find(item => item.textContent?.trim() === label)!
  await act(async () => item.click())
  expect(container.querySelector('[data-location]')?.textContent).toBe(`${base}/resources/${resource}`)
  expect(container.querySelector('h1')?.textContent).toBe(title)
  expect(container.querySelector('.class-hub-material-controls')).toBeNull()
  expect(container.textContent).not.toContain('Choose your goal')
  const back = [...container.querySelectorAll('button')].find(item => item.textContent?.trim() === 'Back to class')!
  await act(async () => back.click())
  expect(container.querySelector('[data-location]')?.textContent).toBe(base)
})
it.each(['flashcards','revised-notes'])('redirects older Materials links for %s', async resource => {
  await render(`${base}?classTab=materials&createMaterial=${resource}`)
  expect(container.querySelector('[data-location]')?.textContent).toBe(`${base}/resources/${resource}`)
})
it('supports a fresh direct link and does not substitute another class for an invalid course', async () => {
  await render('/academics/classes/missing/resources/flashcards')
  expect(container.querySelector('h1')?.textContent).toBe('Class not found')
  expect(container.querySelector('[aria-label="Flashcard prompt"]')).toBeNull()
})
