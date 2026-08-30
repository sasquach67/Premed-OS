import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { TranscriptIntake } from './TranscriptIntake'
import { createInitialDataForMode, CURRENT_STORE_VERSION, STORAGE_KEY, useStore } from '@/store/store'

vi.mock('@/lib/localBlobStore', () => ({ retainLocalBlob: vi.fn(async () => 'idb://academics/transcript/test') }))

;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} })

const TRANSCRIPT = [
  'Duke University',
  'Fall 2026',
  'BIOL 252 NEUROBIOLOGY 3.000 A-',
  'CHEM 261 ORGANIC CHEMISTRY I 3.000 B+',
].join('\n')

describe('transcript intake', () => {
  let container: HTMLDivElement
  let root: Root

  const buttons = () => [...container.querySelectorAll('button')]
  const byText = (re: RegExp) => buttons().find((b) => re.test((b.textContent || '').trim()))
  const rows = () => [...container.querySelectorAll('.grades-review-row')]

  async function pasteAndReview(text = TRANSCRIPT) {
    const area = container.querySelector('textarea')!
    const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')!.set!
    await act(async () => {
      setter.call(area, text)
      area.dispatchEvent(new Event('input', { bubbles: true }))
    })
    await act(async () => { byText(/^Review lines$/)!.click() })
  }

  beforeEach(async () => {
    useStore.getState().replaceAll(createInitialDataForMode(false))
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
    await act(async () => {
      root.render(<TranscriptIntake courses={[]} onManual={() => {}} onCancel={() => {}} />)
    })
  })

  afterEach(async () => { await act(async () => root.unmount()); container.remove() })

  it('offers a file route, a paste route and the manual line together', () => {
    expect(container.querySelector('.grades-intake-drop')).toBeTruthy()
    expect(container.querySelector('textarea')).toBeTruthy()
    expect(byText(/Enter one line manually/)).toBeTruthy()
  })

  it('states plainly that email import is not configured', () => {
    const note = container.querySelector('[data-unconfigured="true"]')
    expect(note?.textContent).toContain('Not configured')
  })

  it('reviews parsed lines before writing anything to the store', async () => {
    await pasteAndReview()
    expect(rows()).toHaveLength(2)
    expect(useStore.getState().academics.classCenter.transcriptRecords).toHaveLength(0)
  })

  it('shows the exact source line for each parsed row', async () => {
    await pasteAndReview()
    expect(container.textContent).toContain('BIOL 252 NEUROBIOLOGY 3.000 A-')
  })

  it('saves the exact transcript strings, not coerced values', async () => {
    await pasteAndReview()
    await act(async () => { byText(/^Save \d+ record/)!.click() })
    const [first] = useStore.getState().academics.classCenter.transcriptRecords
    expect(first).toMatchObject({
      institution: 'Duke University',
      courseNumberExact: 'BIOL 252',
      creditsExact: '3.000',
      gradeExact: 'A-',
      term: 'Fall',
      year: '2026',
    })
    expect(useStore.getState().courses).toHaveLength(0)
    expect(first.courseId).toBeUndefined()
  })

  it('never infers classification from a parsed line', async () => {
    await pasteAndReview()
    await act(async () => { byText(/^Save \d+ record/)!.click() })
    for (const record of useStore.getState().academics.classCenter.transcriptRecords) {
      expect(record.classificationSource).toBeUndefined()
      expect(record.classificationReason).toBeUndefined()
    }
  })

  it('leaves an unreadable field blank and marks the row as needing the student', async () => {
    await pasteAndReview('Duke University\nFall 2026\nBIOL 205 CELL BIOLOGY A')
    expect(container.textContent).toContain('Needs you')
    await act(async () => { byText(/^Save \d+ record/)!.click() })
    expect(useStore.getState().academics.classCenter.transcriptRecords[0].creditsExact).toBe('')
  })

  it('lets a correction be made before saving', async () => {
    await pasteAndReview('Duke University\nFall 2026\nBIOL 205 CELL BIOLOGY A')
    const credit = [...container.querySelectorAll('input')].find((i) => /^Credit for/.test(i.getAttribute('aria-label') || ''))!
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!
    await act(async () => {
      setter.call(credit, '4.000')
      credit.dispatchEvent(new Event('input', { bubbles: true }))
    })
    await act(async () => { byText(/^Save \d+ record/)!.click() })
    expect(useStore.getState().academics.classCenter.transcriptRecords[0].creditsExact).toBe('4.000')
  })

  it('excludes an already-recorded attempt by default rather than merging it', async () => {
    await pasteAndReview()
    await act(async () => { byText(/^Save \d+ record/)!.click() })
    expect(useStore.getState().academics.classCenter.transcriptRecords).toHaveLength(2)

    // A fresh mount: re-rendering the same root keeps the review stage, which is
    // not what a student re-importing later actually sees.
    await act(async () => root.unmount())
    root = createRoot(container)
    await act(async () => {
      root.render(<TranscriptIntake courses={[]} onManual={() => {}} onCancel={() => {}} />)
    })
    await pasteAndReview()
    expect(rows().every((row) => row.getAttribute('data-dropped') === 'true')).toBe(true)
    expect(container.textContent).toContain('Already recorded')
    expect(byText(/^Save 0 records$/)?.disabled).toBe(true)
    expect(useStore.getState().academics.classCenter.transcriptRecords).toHaveLength(2)
  })

  it('keeps the exact source line on each saved record', async () => {
    await pasteAndReview()
    await act(async () => { byText(/^Save \d+ record/)!.click() })
    const [first] = useStore.getState().academics.classCenter.transcriptRecords
    // Provenance: a saved record must be checkable against the line it came from.
    expect(first.sourceQuote).toBe('BIOL 252 NEUROBIOLOGY 3.000 A-')
  })

  it('preserves an all-caps registrar title exactly', async () => {
    await pasteAndReview()
    await act(async () => { byText(/^Save \d+ record/)!.click() })
    const titles = useStore.getState().academics.classCenter.transcriptRecords.map((r) => r.titleExact)
    expect(titles).toContain('NEUROBIOLOGY')
  })

  it('reports text carrying no course line instead of saving an empty record', async () => {
    await pasteAndReview('Dear student, your deposit has been received.')
    expect(container.textContent).toContain('No transcript line found')
    expect(rows()).toHaveLength(0)
    expect(useStore.getState().academics.classCenter.transcriptRecords).toHaveLength(0)
  })

  it('returns to intake from review without writing a record', async () => {
    await pasteAndReview()
    await act(async () => { byText(/^Back$/)!.click() })
    expect(container.querySelector('.grades-intake-drop')).toBeTruthy()
    expect(useStore.getState().academics.classCenter.transcriptRecords).toHaveLength(0)
  })

  it('retains uploaded transcript evidence for prior credit without fabricating a Planner owner', async () => {
    const input = container.querySelector<HTMLInputElement>('input[aria-label="Choose a transcript file"]')!
    const file = new File([TRANSCRIPT], 'transfer-transcript.txt', { type: 'text/plain' })
    Object.defineProperty(input, 'files', { configurable: true, value: [file] })
    await act(async () => { input.dispatchEvent(new Event('change', { bubbles: true })); await Promise.resolve() })
    expect(rows()).toHaveLength(2)
    await act(async () => { byText(/^Save \d+ record/)!.click(); await Promise.resolve() })

    const state = useStore.getState()
    expect(state.courses).toHaveLength(0)
    expect(state.academics.classCenter.files).toHaveLength(1)
    const evidence = state.academics.classCenter.files[0]
    expect(evidence).toMatchObject({ title: 'transfer-transcript.txt', type: 'transcript', blobRef: 'idb://academics/transcript/test' })
    expect(evidence.courseId).toBeUndefined()
    expect(state.academics.classCenter.transcriptRecords.every((record) => record.evidenceFileId === evidence.id)).toBe(true)

    const partialize = useStore.persist.getOptions().partialize!
    const persisted = partialize(state)
    useStore.getState().replaceAll(createInitialDataForMode(false))
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ state: persisted, version: CURRENT_STORE_VERSION }))
    await useStore.persist.rehydrate()
    const restored = useStore.getState().academics.classCenter
    expect(restored.files[0]).toMatchObject({ id: evidence.id, blobRef: 'idb://academics/transcript/test' })
    expect(restored.files[0].courseId).toBeUndefined()
    expect(restored.transcriptRecords.every((record) => record.evidenceFileId === evidence.id)).toBe(true)
  })
})
