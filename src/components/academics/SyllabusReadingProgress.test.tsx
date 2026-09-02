import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { SyllabusReadingProgress, SyllabusSelectedFiles } from './SyllabusReadingProgress'

describe('SyllabusReadingProgress', () => {
  let container: HTMLDivElement
  let root: ReturnType<typeof createRoot>

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
  })

  afterEach(async () => {
    await act(async () => root.unmount())
    container.remove()
  })

  it('shows the active file, OCR stage, and measurable batch progress', async () => {
    await act(async () => root.render(<SyllabusReadingProgress progress={{
      phase: 'ocr', page: 5, pageCount: 66, progress: 0.5,
      fileIndex: 2, fileCount: 2, fileName: 'Lecture 2 Central Dogma BIOL103.pdf',
      overallProgress: 0.9, message: 'File 2 of 2 · Reading scanned page 5 of 66',
    }} />))

    expect(container.textContent).toContain('File 2 of 2')
    expect(container.textContent).toContain('Lecture 2 Central Dogma BIOL103.pdf')
    expect(container.textContent).toContain('Reading scanned page 5 of 66')
    expect(container.querySelector('[role="progressbar"]')?.getAttribute('aria-valuenow')).toBe('90')
  })

  it('shows every selected filename and lets the student remove one before reading', async () => {
    const removed: number[] = []
    const files = [
      new File(['a'], 'Lesson 2 GRQ.pdf', { type: 'application/pdf' }),
      new File(['b'], 'Course schedule.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }),
    ]
    await act(async () => root.render(<SyllabusSelectedFiles files={files} onRemove={(index) => removed.push(index)} />))

    expect(container.textContent).toContain('Lesson 2 GRQ.pdf')
    expect(container.textContent).toContain('Course schedule.docx')
    await act(async () => (container.querySelector('button[aria-label="Remove Lesson 2 GRQ.pdf"]') as HTMLButtonElement).click())
    expect(removed).toEqual([0])
  })
})
