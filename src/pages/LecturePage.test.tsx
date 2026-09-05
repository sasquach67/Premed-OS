import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createSeedData } from '@/data/seed'
import { createInitialDataForMode, useStore } from '@/store/store'
import { LecturePage } from './LecturePage'

const lifecycle = vi.hoisted(() => ({
  beforeDelete: undefined as undefined | (() => void),
  beforeFinish: undefined as undefined | ((lectureId: string) => void),
}))

vi.mock('@/components/academics/LectureCapturePanel', async () => {
  const React = await vi.importActual<typeof import('react')>('react')
  type Props = {
    courseId: string
    data: ReturnType<typeof useStore.getState>['academics']['classCenter']
    initialLectureId?: string
    displayMode?: string
    onNavigateLecture?: (lectureId: string) => void
    onDeletedLecture?: () => void
  }

  function LectureCapturePanel(props: Props) {
    const [instance] = React.useState(() => crypto.randomUUID())
    const other = props.data.lectures.find((lecture) => lecture.courseId === props.courseId && lecture.id !== props.initialLectureId)
    const finishId = props.initialLectureId ?? 'created-lecture'
    return <section aria-label="Mock lecture workspace" data-instance={instance}>
      <output data-testid="active-lecture">{props.initialLectureId ?? 'new'}</output>
      <output data-testid="display-mode">{props.displayMode}</output>
      <input aria-label="Import draft" defaultValue="" />
      {other && <button type="button" onClick={() => props.onNavigateLecture?.(other.id)}>Select {other.id}</button>}
      <button type="button" onClick={() => { lifecycle.beforeFinish?.(finishId); props.onNavigateLecture?.(finishId) }}>Finish build</button>
      <button type="button" onClick={() => { lifecycle.beforeDelete?.(); props.onDeletedLecture?.() }}>Delete current lecture</button>
    </section>
  }

  return { LectureCapturePanel }
})

;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} })

function LocationProbe() {
  const location = useLocation()
  return <output data-testid="location">{location.pathname}{location.search}</output>
}

function HistoryControls() {
  const navigate = useNavigate()
  const location = useLocation()
  return <>
    <button type="button" onClick={() => navigate(-1)}>Browser back</button>
    <button type="button" onClick={() => navigate(1)}>Browser forward</button>
    <button type="button" onClick={() => navigate(`${location.pathname}?workspace=sources`)}>Change lecture view</button>
  </>
}

describe('LecturePage route lifecycle', () => {
  let container: HTMLDivElement
  let scroller: HTMLElement
  let root: Root
  let courseId: string
  let otherCourseId: string

  beforeEach(() => {
    const seed = structuredClone(createSeedData())
    courseId = seed.courses[0].id
    otherCourseId = seed.courses[1].id
    seed.academics.classCenter.lectures.push(
      { id: 'lecture-one', courseId, title: 'Lecture one', inputPath: 'pasted', processingState: 'ready', workspaceState: 'complete', createdAt: 1, updatedAt: 1, order: 0 },
      { id: 'lecture-two', courseId, title: 'Lecture two', inputPath: 'pasted', processingState: 'ready', workspaceState: 'complete', createdAt: 2, updatedAt: 2, order: 1 },
      { id: 'foreign-lecture', courseId: otherCourseId, title: 'Foreign lecture', inputPath: 'pasted', processingState: 'ready', workspaceState: 'complete', createdAt: 3, updatedAt: 3, order: 0 },
    )
    useStore.getState().replaceAll(seed)
    lifecycle.beforeDelete = undefined
    lifecycle.beforeFinish = undefined
    scroller = document.createElement('main')
    scroller.dataset.appScrollContainer = ''
    container = document.createElement('div')
    scroller.appendChild(container)
    document.body.appendChild(scroller)
    root = createRoot(container)
  })

  afterEach(async () => {
    await act(async () => root.unmount())
    scroller.remove()
    useStore.getState().replaceAll(createInitialDataForMode(false))
  })

  async function render(entries: string[], initialIndex = entries.length - 1) {
    await act(async () => {
      root.render(<MemoryRouter initialEntries={entries} initialIndex={initialIndex}>
        <Routes>
          <Route path="/academics/classes/:courseId/lectures/:lectureId" element={<LecturePage />} />
          <Route path="/academics/classes/:courseId" element={<h1>Class journal route</h1>} />
          <Route path="/academics" element={<h1>Class Center route</h1>} />
        </Routes>
        <LocationProbe />
        <HistoryControls />
      </MemoryRouter>)
    })
  }

  function location() {
    return container.querySelector('[data-testid="location"]')?.textContent
  }

  function button(name: string) {
    return [...container.querySelectorAll<HTMLButtonElement>('button')].find((item) => item.textContent === name)!
  }

  it('loads a direct lecture URL and keeps import input mounted across view-only URL changes', async () => {
    await render([`/academics/classes/${courseId}/lectures/lecture-one`])
    expect(container.querySelector('[data-testid="active-lecture"]')?.textContent).toBe('lecture-one')
    expect(container.querySelector('[data-testid="display-mode"]')?.textContent).toBe('page')
    const draft = container.querySelector<HTMLInputElement>('input[aria-label="Import draft"]')!
    const instance = container.querySelector('[aria-label="Mock lecture workspace"]')?.getAttribute('data-instance')
    draft.value = 'still importing'

    await act(async () => button('Change lecture view').click())

    expect(location()).toBe(`/academics/classes/${courseId}/lectures/lecture-one?workspace=sources`)
    expect(container.querySelector<HTMLInputElement>('input[aria-label="Import draft"]')?.value).toBe('still importing')
    expect(container.querySelector('[aria-label="Mock lecture workspace"]')?.getAttribute('data-instance')).toBe(instance)
  })

  it('stores lecture switching in history so browser back and forward restore the selected lecture', async () => {
    await render([`/academics/classes/${courseId}/lectures/lecture-one`])

    await act(async () => button('Select lecture-two').click())
    expect(location()).toBe(`/academics/classes/${courseId}/lectures/lecture-two`)
    expect(container.querySelector('[data-testid="active-lecture"]')?.textContent).toBe('lecture-two')

    await act(async () => button('Browser back').click())
    expect(location()).toBe(`/academics/classes/${courseId}/lectures/lecture-one`)
    await act(async () => button('Browser forward').click())
    expect(location()).toBe(`/academics/classes/${courseId}/lectures/lecture-two`)
  })

  it('sizes the reader from viewport geometry rather than mismatched offset parents', async () => {
    Object.defineProperty(scroller, 'clientHeight', { configurable: true, value: 743 })
    Object.defineProperty(scroller, 'offsetTop', { configurable: true, value: 56 })
    const rect = vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({ top: 56, bottom: 799, height: 743, left: 0, right: 1000, width: 1000, x: 0, y: 56, toJSON: () => ({}) })
    await render([`/academics/classes/${courseId}/lectures/lecture-one`])
    expect(container.querySelector<HTMLElement>('.lecture-page')?.style.height).toBe('743px')
    rect.mockRestore()
  })

  it('does not duplicate the shell journal breadcrumb in the reading page', async () => {
    await render([`/academics/classes/${courseId}/lectures/lecture-one`])
    expect(container.querySelector('.lecture-page-back')).toBeNull()
    expect(container.querySelector('[aria-label="Lecture page"]')).toBeTruthy()
  })

  it.each([
    ['missing lecture', 'missing'],
    ['lecture owned by another class', 'foreign-lecture'],
  ])('shows a recoverable not-found state for a %s', async (_label, lectureId) => {
    await render([`/academics/classes/${courseId}/lectures/${lectureId}`])
    expect(container.querySelector('[aria-label="Lecture unavailable"]')).toBeTruthy()
    expect(container.textContent).toContain('Lecture not found')
    expect(container.textContent).not.toContain('Mock lecture workspace')
    expect(container.querySelector<HTMLAnchorElement>('a')?.getAttribute('href')).toContain(`/academics/classes/${courseId}?classTab=overview`)
  })

  it('replaces the transient new route after creation and keeps browser back pointed at the class', async () => {
    lifecycle.beforeFinish = (lectureId) => useStore.getState().update((draft) => {
      draft.academics.classCenter.lectures.push({ id: lectureId, courseId, title: 'Created lecture', inputPath: 'pasted', processingState: 'ready', workspaceState: 'complete', createdAt: 4, updatedAt: 4, order: 2 })
    })
    await render([
      `/academics/classes/${courseId}?classTab=overview`,
      `/academics/classes/${courseId}/lectures/new`,
    ])

    await act(async () => button('Finish build').click())
    expect(location()).toBe(`/academics/classes/${courseId}/lectures/created-lecture`)
    expect(container.querySelector('[data-testid="active-lecture"]')?.textContent).toBe('created-lecture')
    await act(async () => button('Browser back').click())
    expect(location()).toBe(`/academics/classes/${courseId}?classTab=overview`)
  })

  it('finishes a rebuild without adding a duplicate history entry', async () => {
    await render([
      `/academics/classes/${courseId}?classTab=overview`,
      `/academics/classes/${courseId}/lectures/lecture-one`,
    ])
    await act(async () => button('Finish build').click())
    expect(location()).toBe(`/academics/classes/${courseId}/lectures/lecture-one`)
    await act(async () => button('Browser back').click())
    expect(location()).toBe(`/academics/classes/${courseId}?classTab=overview`)
  })

  it('returns to the class with replace semantics when the current lecture is deleted', async () => {
    lifecycle.beforeDelete = () => useStore.getState().update((draft) => {
      draft.academics.classCenter.lectures = draft.academics.classCenter.lectures.filter((lecture) => lecture.id !== 'lecture-one')
    })
    await render([`/academics/classes/${courseId}/lectures/lecture-one`])

    await act(async () => button('Delete current lecture').click())

    expect(location()).toBe(`/academics/classes/${courseId}?classTab=overview`)
    expect(container.textContent).toContain('Class journal route')
  })

  it('recovers a missing class route back to Class Center', async () => {
    await render(['/academics/classes/missing-course/lectures/lecture-one'])
    expect(container.textContent).toContain('Lecture not found')
    expect(container.querySelector<HTMLAnchorElement>('a')?.textContent).toBe('Back to Class Center')
    expect(container.querySelector<HTMLAnchorElement>('a')?.getAttribute('href')).toBe('/academics?tab=class-center')
  })
})
