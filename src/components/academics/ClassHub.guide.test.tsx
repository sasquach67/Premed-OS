import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ClassHub } from './ClassHub'
import { ToastProvider } from '@/components/common/ToastProvider'
import { createSeedData } from '@/data/seed'
import { createInitialDataForMode, CURRENT_STORE_VERSION, snapshotData, STORAGE_KEY, useStore } from '@/store/store'

;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} })
vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })))

function changeField(field: HTMLInputElement | HTMLTextAreaElement, value: string) {
  const prototype = field instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype
  Object.getOwnPropertyDescriptor(prototype, 'value')?.set?.call(field, value)
  field.dispatchEvent(new Event('input', { bubbles: true }))
}

describe('ClassHub Guide contract', () => {
  let container: HTMLDivElement
  let root: Root
  let courseId: string

  beforeEach(async () => {
    localStorage.clear()
    const seed = structuredClone(createSeedData())
    const course = seed.courses.find((item) => item.code === 'BIOL 103')!
    courseId = course.id
    seed.academics.classCenter.assignments.push(
      { id: 'guide-exam-a', courseId, title: 'Midterm 1', type: 'exam', status: 'not-started', linkedTopicIds: [], linkedFileIds: [], notes: 'Source: page 4 — “Midterm 1 covers Weeks 1–4”', createdAt: 1, updatedAt: 1, order: 100 },
      { id: 'guide-exam-b', courseId, title: 'Midterm 2', type: 'exam', status: 'not-started', linkedTopicIds: [], linkedFileIds: [], notes: 'Source: page 7 — “Midterm 2 covers Weeks 5–8”', createdAt: 1, updatedAt: 1, order: 101 },
    )
    useStore.getState().replaceAll(seed)
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
    await render()
  })

  afterEach(async () => {
    await act(async () => root.unmount())
    container.remove()
  })

  async function render() {
    const state = useStore.getState()
    const course = state.courses.find((item) => item.id === courseId)!
    const workspace = state.academics.classCenter.workspaces.find((item) => item.courseId === courseId)!
    await act(async () => {
      root.render(<MemoryRouter initialEntries={['/academics?classTab=guide']}><ToastProvider><ClassHub course={course} workspace={workspace} data={state.academics.classCenter} persons={state.persons} /></ToastProvider></MemoryRouter>)
      await Promise.resolve()
    })
  }

  it('creates source-backed syllabus suggestions and keeps accept/dismiss controls live', async () => {
    await render()
    const proposals = useStore.getState().academics.classCenter.guideProposals.filter((item) => item.courseId === courseId && item.source.sourceKind === 'syllabus')
    expect(proposals).toHaveLength(2)
    expect(container.textContent).toContain('Suggested additions')
    expect(container.textContent).toContain('Midterm 1 covers Weeks 1–4')

    const add = [...container.querySelectorAll('button')].find((button) => button.textContent?.includes('Add to Guide')) as HTMLButtonElement
    await act(async () => add.click())
    const accepted = useStore.getState().academics.classCenter.guideProposals.find((item) => item.id === proposals[0].id)
    expect(accepted).toEqual(expect.objectContaining({ status: 'accepted', acceptedNoteId: expect.any(String) }))
    expect(useStore.getState().academics.classCenter.notes.find((note) => note.guideProposalId === proposals[0].id)).toEqual(expect.objectContaining({
      guideSourceRefs: [expect.objectContaining({ sourcePassage: 'Midterm 1 covers Weeks 1–4' })],
    }))

    await render()
    const dismiss = [...container.querySelectorAll('button')].find((button) => button.textContent?.trim() === 'Dismiss') as HTMLButtonElement
    await act(async () => dismiss.click())
    expect(useStore.getState().academics.classCenter.guideProposals.find((item) => item.id === proposals[1].id)?.status).toBe('dismissed')

    const partialize = useStore.persist.getOptions().partialize!
    const persisted = partialize(useStore.getState())
    useStore.getState().replaceAll(createInitialDataForMode(false))
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ state: persisted, version: CURRENT_STORE_VERSION }))
    await useStore.persist.rehydrate()
    const reloaded = snapshotData().academics.classCenter
    expect(reloaded.guideProposals.find((item) => item.id === proposals[0].id)).toEqual(expect.objectContaining({ status: 'accepted', acceptedNoteId: expect.any(String) }))
    expect(reloaded.guideProposals.find((item) => item.id === proposals[1].id)?.status).toBe('dismissed')
    expect(reloaded.notes.some((note) => note.guideProposalId === proposals[0].id)).toBe(true)
  })

  it('edits saved Guide wording with cancel/save semantics and survives persisted hydration', async () => {
    await render()
    const proposal = useStore.getState().academics.classCenter.guideProposals.find((item) => item.courseId === courseId)!
    const add = [...container.querySelectorAll('button')].find((button) => button.textContent?.includes('Add to Guide')) as HTMLButtonElement
    await act(async () => add.click())
    await render()

    const note = useStore.getState().academics.classCenter.notes.find((item) => item.guideProposalId === proposal.id)!
    const originalTitle = note.title
    const edit = () => [...container.querySelectorAll<HTMLButtonElement>('button')].find((button) => button.getAttribute('aria-label') === `Edit ${useStore.getState().academics.classCenter.notes.find((item) => item.id === note.id)?.title}`)!

    await act(async () => edit().click())
    const firstTitle = container.querySelector<HTMLInputElement>(`input[aria-label="Guide item title for ${originalTitle}"]`)!
    await act(async () => changeField(firstTitle, 'Unsaved wording'))
    const firstEditor = firstTitle.closest('.space-y-3')!
    await act(async () => ([...firstEditor.querySelectorAll<HTMLButtonElement>('button')].find((button) => button.textContent?.trim() === 'Cancel')!).click())
    expect(useStore.getState().academics.classCenter.notes.find((item) => item.id === note.id)?.title).toBe(originalTitle)

    await act(async () => edit().click())
    const title = container.querySelector<HTMLInputElement>(`input[aria-label="Guide item title for ${originalTitle}"]`)!
    const details = container.querySelector<HTMLTextAreaElement>(`textarea[aria-label="Guide item details for ${originalTitle}"]`)!
    await act(async () => { changeField(title, 'Edited exam intel'); changeField(details, 'Use the reviewed syllabus boundary when planning this exam.') })
    await act(async () => ([...container.querySelectorAll<HTMLButtonElement>('button')].find((button) => button.textContent?.trim() === 'Save changes')!).click())

    const saved = useStore.getState().academics.classCenter.notes.find((item) => item.id === note.id)
    expect(saved).toEqual(expect.objectContaining({ title: 'Edited exam intel', content: 'Use the reviewed syllabus boundary when planning this exam.' }))
    expect(saved?.guideSourceRefs).toEqual(note.guideSourceRefs)

    const partialize = useStore.persist.getOptions().partialize!
    const persisted = partialize(useStore.getState())
    useStore.getState().replaceAll(createInitialDataForMode(false))
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ state: persisted, version: CURRENT_STORE_VERSION }))
    await useStore.persist.rehydrate()
    expect(snapshotData().academics.classCenter.notes.find((item) => item.id === note.id)).toEqual(expect.objectContaining({
      title: 'Edited exam intel', content: 'Use the reviewed syllabus boundary when planning this exam.',
      guideProposalId: proposal.id, guideSourceRefs: note.guideSourceRefs,
    }))
  })

  it('confirms deletion, clears dependent links, and returns a reviewed source to suggestions', async () => {
    await render()
    const proposal = useStore.getState().academics.classCenter.guideProposals.find((item) => item.courseId === courseId)!
    const add = [...container.querySelectorAll('button')].find((button) => button.textContent?.includes('Add to Guide')) as HTMLButtonElement
    await act(async () => add.click())
    const accepted = useStore.getState().academics.classCenter.notes.find((item) => item.guideProposalId === proposal.id)!
    const topicId = useStore.getState().academics.classCenter.topics.find((item) => item.courseId === courseId)!.id
    useStore.getState().update((draft) => {
      const topic = draft.academics.classCenter.topics.find((item) => item.id === topicId)!
      topic.sourceNoteIds.push(accepted.id)
      topic.linkedNoteIds = [accepted.id]
    })
    await render()

    const remove = [...container.querySelectorAll<HTMLButtonElement>('button')].find((button) => button.getAttribute('aria-label') === `Delete ${accepted.title}`)!
    await act(async () => remove.click())
    expect(document.body.textContent).toContain('The reviewed syllabus or lecture source returns to Suggested additions')
    await act(async () => ([...document.body.querySelectorAll<HTMLButtonElement>('button')].find((button) => button.textContent?.trim() === 'Delete Guide item')!).click())

    const center = useStore.getState().academics.classCenter
    expect(center.notes.some((item) => item.id === accepted.id)).toBe(false)
    expect(center.topics.find((item) => item.id === topicId)?.sourceNoteIds).not.toContain(accepted.id)
    expect(center.topics.find((item) => item.id === topicId)?.linkedNoteIds).not.toContain(accepted.id)
    expect(center.guideProposals.find((item) => item.id === proposal.id)).toEqual(expect.objectContaining({ status: 'pending', acceptedNoteId: undefined }))
  })

  it('collapses an unsaved Course lens when the student cancels', async () => {
    expect(container.querySelector('textarea[aria-label="Course lens"]')).toBeTruthy()
    const lensEditor = container.querySelector('textarea[aria-label="Course lens"]')!.closest('.class-hub-panel')!
    const cancel = [...lensEditor.querySelectorAll<HTMLButtonElement>('button')].find((button) => button.textContent?.trim() === 'Cancel')!
    await act(async () => cancel.click())

    expect(container.querySelector('textarea[aria-label="Course lens"]')).toBeNull()
    expect([...container.querySelectorAll<HTMLButtonElement>('button')].some((button) => button.textContent?.trim() === 'Add course lens')).toBe(true)
    expect(useStore.getState().academics.classCenter.workspaces.find((item) => item.courseId === courseId)?.courseLens).toBeUndefined()
  })
})
