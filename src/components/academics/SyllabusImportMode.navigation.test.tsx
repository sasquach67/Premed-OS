import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ToastProvider } from '@/components/common/ToastProvider'
import { parseSyllabusText } from '@/lib/academics/syllabusParser'
import { SyllabusImportMode } from './SyllabusImportMode'

;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} })
vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })))

describe('SyllabusImportMode review navigation', () => {
  let container: HTMLDivElement
  let root: Root
  let scrollIntoView: ReturnType<typeof vi.fn>

  beforeEach(async () => {
    scrollIntoView = vi.fn()
    HTMLElement.prototype.scrollIntoView = scrollIntoView as unknown as typeof HTMLElement.prototype.scrollIntoView
    window.location.hash = '#/academics?tab=class-center'
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
    const proposal = parseSyllabusText(`PSYC 101: Introduction to Psychology
Learning objectives: Define psychology and explain how research works.
Exam 1: September 17, 2026
Grading: Exams 50%, quizzes 50%.`, 'PSYC101 Syllabus.pdf')

    await act(async () => {
      root.render(
        <MemoryRouter initialEntries={['/academics?tab=class-center']}>
          <ToastProvider>
            <SyllabusImportMode
              semester="Fall 2026"
              initialProposal={proposal}
              onExit={() => undefined}
              onImport={async () => undefined}
            />
          </ToastProvider>
        </MemoryRouter>,
      )
    })
  })

  afterEach(async () => {
    await act(async () => root.unmount())
    container.remove()
  })

  it('scrolls to a review section without replacing the hash-routed app URL', async () => {
    const sectionControl = [...container.querySelectorAll<HTMLElement>('[aria-label="Extraction sections"] *')]
      .find((element) => element.textContent?.includes('Learning standards')) as HTMLButtonElement

    expect(sectionControl.tagName).toBe('BUTTON')
    await act(async () => sectionControl.click())

    expect(window.location.hash).toBe('#/academics?tab=class-center')
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' })
  })
})
