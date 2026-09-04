import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { AcademicFile, SourceChunk } from '@/lib/types'
import { createInitialDataForMode, useStore } from '@/store/store'
import { MaterialGenerationIntake } from './MaterialGenerationIntake'

;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const mocks = vi.hoisted(() => ({
  generateStudyGuide: vi.fn(),
  toast: vi.fn(),
}))

vi.mock('@/lib/academics/generateStudyGuide', () => ({ generateStudyGuide: mocks.generateStudyGuide }))
vi.mock('@/components/common/useToast', () => ({ useToast: () => mocks.toast }))

function material(chunkCount: number): { file: AcademicFile; chunks: SourceChunk[] } {
  const file: AcademicFile = {
    id: 'source-file',
    courseId: 'course-1',
    sourceType: 'paste',
    title: 'Lecture source',
    type: 'transcript',
    linkedTopicIds: [],
    owner: 'mine',
    processingStatus: 'ready',
    createdAt: 1,
    updatedAt: 1,
    order: 0,
  }
  const chunks = Array.from({ length: chunkCount }, (_, index): SourceChunk => ({
    id: `chunk-${index + 1}`,
    fileId: file.id,
    courseId: 'course-1',
    content: `Source passage ${index + 1}.`,
    coveredByKeyPoint: false,
    createdAt: 1,
    updatedAt: 1,
    order: index,
  }))
  return { file, chunks }
}

describe('MaterialGenerationIntake generation reliability', () => {
  let container: HTMLDivElement
  let root: Root

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
    mocks.generateStudyGuide.mockReset()
    mocks.toast.mockReset()
  })

  afterEach(async () => {
    await act(async () => root.unmount())
    container.remove()
    useStore.getState().replaceAll(createInitialDataForMode(false))
  })

  async function renderIntake(chunkCount: number) {
    const { file, chunks } = material(chunkCount)
    const data = createInitialDataForMode(false)
    data.academics.classCenter.files = [file]
    data.academics.classCenter.sourceChunks = chunks
    useStore.getState().replaceAll(data)

    await act(async () => {
      root.render(
        <MaterialGenerationIntake
          artifact="study-guide"
          courseId="course-1"
          courseLabel="ANTH 147"
          files={[file]}
          lectureId="lecture-1"
          onClose={vi.fn()}
        />,
      )
    })
    const source = [...container.querySelectorAll<HTMLButtonElement>('button')]
      .find((button) => button.textContent?.includes('Lecture source'))!
    await act(async () => source.click())
  }

  function generateButton() {
    return [...container.querySelectorAll<HTMLButtonElement>('button')]
      .find((button) => button.textContent?.includes('Generate study guide'))!
  }

  it('blocks a request above the backend 24-passage limit before generation', async () => {
    await renderIntake(25)

    expect(container.textContent).toContain('Add files or folder')
    expect(container.textContent).toContain('Add individual files or a whole folder')
    expect(container.textContent).toContain('Select all ready')

    expect(container.textContent).toContain(
      'Choose fewer source files or add a shorter excerpt. This selection contains 25 passages, and AI study tools can use up to 24 at a time.',
    )
    expect(generateButton().disabled).toBe(true)
    expect(mocks.generateStudyGuide).not.toHaveBeenCalled()
  })

  it('ignores a same-tick double submission while generation is pending', async () => {
    let finish!: (value: { ok: false; message: string }) => void
    mocks.generateStudyGuide.mockImplementation(() => new Promise((resolve) => { finish = resolve }))
    await renderIntake(1)

    await act(async () => {
      generateButton().click()
      generateButton().click()
    })

    expect(mocks.generateStudyGuide).toHaveBeenCalledTimes(1)
    await act(async () => finish({ ok: false, message: 'Generation unavailable.' }))
  })

  it('reports an unexpected failure and releases the generation lock', async () => {
    mocks.generateStudyGuide.mockRejectedValue(new Error('network failed'))
    await renderIntake(1)

    await act(async () => {
      generateButton().click()
      await Promise.resolve()
    })

    expect(mocks.toast).toHaveBeenCalledWith({
      title: 'Nothing was saved',
      description: 'Generation stopped unexpectedly. Nothing was saved, and your selected sources are still here.',
      tone: 'error',
    })
    expect(generateButton().disabled).toBe(false)

    await act(async () => {
      generateButton().click()
      await Promise.resolve()
    })
    expect(mocks.generateStudyGuide).toHaveBeenCalledTimes(2)
  })
})
