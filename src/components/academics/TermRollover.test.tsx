import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { expect, it, vi } from 'vitest'
import { createInitialDataForMode, useStore } from '@/store/store'
import { TermRollover } from './TermRollover'

;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

it('archives a completed course without changing saved topic or study records', async () => {
  const data = createInitialDataForMode(false)
  data.courses.push({ id: 'completed', term: 'Fall 2025', code: 'BIOL 103', title: 'Cells', credits: 3, grade: 'A' as const, bcpm: true, status: 'completed', inResidence: true, satisfies: [], order: 0 })
  data.academics.classCenter.topics.push({ id: 'legacy-topic', courseId: 'completed', title: 'Saved learning record', status: 'ready', confidence: 3, sourceNoteIds: [], fsrs: { due: 42, stability: 3, difficulty: 2, elapsedDays: 1, scheduledDays: 3, learningSteps: 0, reps: 4, lapses: 1, state: 2 }, order: 0 })
  useStore.getState().replaceAll(data)
  const savedTopics = structuredClone(useStore.getState().academics.classCenter.topics)
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)
  try {
    await act(async () => root.render(<MemoryRouter><TermRollover /></MemoryRouter>))
    expect(container.textContent).not.toContain('topic')
    const archive = [...container.querySelectorAll('button')].find((button) => button.textContent === 'Archive completed course')!
    await act(async () => archive.click())
    expect(useStore.getState().courses.find((course) => course.id === 'completed')?.rolloverAt).toEqual(expect.any(Number))
    expect(useStore.getState().academics.classCenter.topics).toEqual(savedTopics)
    expect(useStore.getState().academics.classCenter.termReports).toHaveLength(1)
    expect(container.textContent).toContain('View your Term Report')
  } finally {
    await act(async () => root.unmount())
    container.remove()
    useStore.getState().replaceAll(createInitialDataForMode(false))
  }
})

function completedCourse(id: string) {
  return { id, term: 'Fall 2025', code: id, title: id, credits: 3, grade: 'A' as const, bcpm: true, status: 'completed' as const, inResidence: true, satisfies: [], order: 0 }
}

function findButton(container: HTMLElement, text: string) {
  return [...container.querySelectorAll('button')].find((button) => button.textContent === text)!
}

it('can continue through multiple completed courses and keeps the last report reachable', async () => {
  const data = createInitialDataForMode(false)
  data.courses.push(completedCourse('BIOL 103'), completedCourse('CHEM 101'))
  useStore.getState().replaceAll(data)
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)
  try {
    await act(async () => root.render(<MemoryRouter><TermRollover /></MemoryRouter>))
    await act(async () => findButton(container, 'Archive completed course').click())
    expect(container.textContent).toContain('BIOL 103')
    expect(useStore.getState().academics.classCenter.termReports).toHaveLength(0)
    await act(async () => findButton(container, 'Continue to next course').click())
    expect(container.textContent).toContain('CHEM 101')
    await act(async () => findButton(container, 'Archive completed course').click())
    expect(useStore.getState().courses.every((course) => course.rolloverAt != null)).toBe(true)
    expect(useStore.getState().academics.classCenter.termReports).toHaveLength(1)
    expect(findButton(container, 'View your Term Report')).toBeTruthy()
    await act(async () => findButton(container, 'Done').click())
    expect(container.textContent).toBe('')
  } finally {
    await act(async () => root.unmount())
    container.remove()
    useStore.getState().replaceAll(createInitialDataForMode(false))
  }
})

it('shows a failed save and does not claim archive success before an update resolves', async () => {
  const data = createInitialDataForMode(false)
  data.courses.push(completedCourse('BIOL 103'))
  useStore.getState().replaceAll(data)
  let rejectSave!: (reason: Error) => void
  const save = vi.spyOn(useStore.getState(), 'update').mockImplementation(() => new Promise<void>((_resolve, reject) => { rejectSave = reject }))
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)
  try {
    await act(async () => root.render(<MemoryRouter><TermRollover /></MemoryRouter>))
    await act(async () => findButton(container, 'Archive completed course').click())
    expect(container.textContent).not.toContain('The course is archived')
    expect(findButton(container, 'Archiving…').disabled).toBe(true)
    await act(async () => rejectSave(new Error('Workspace edits are blocked.')))
    expect(container.querySelector('[role="alert"]')?.textContent).toContain('Workspace edits are blocked.')
    expect(container.textContent).not.toContain('The course is archived')
    expect(findButton(container, 'Archive completed course').disabled).toBe(false)
    expect(useStore.getState().courses[0].rolloverAt).toBeUndefined()
    expect(useStore.getState().academics.classCenter.termReports).toHaveLength(0)
  } finally {
    save.mockRestore()
    await act(async () => root.unmount())
    container.remove()
    useStore.getState().replaceAll(createInitialDataForMode(false))
  }
})
