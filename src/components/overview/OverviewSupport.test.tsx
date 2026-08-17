import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ToastContext } from '@/components/common/toast-context'
import { ActivityAndCapture } from '@/components/overview/OverviewSupport'
import { createSeedData } from '@/data/seed'
import { useStore } from '@/store/store'

;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

vi.stubGlobal('ResizeObserver', ResizeObserverMock)

function fileList(file: File): FileList {
  return { 0: file, length: 1, item: (index: number) => index === 0 ? file : null } as unknown as FileList
}

function button(container: HTMLElement, label: string): HTMLButtonElement {
  const found = [...container.querySelectorAll('button')].find((element) => element.textContent?.trim() === label)
  if (!found) throw new Error(`Could not find button: ${label}`)
  return found as HTMLButtonElement
}

describe('Overview File Capture', () => {
  let container: HTMLDivElement
  let root: Root
  let originalCapture: ReturnType<typeof useStore.getState>['createOverviewFileCapture']

  beforeEach(async () => {
    originalCapture = useStore.getState().createOverviewFileCapture
    useStore.getState().replaceAll(createSeedData())
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
    await act(async () => {
      root.render(
        <MemoryRouter>
          <ToastContext.Provider value={{ toast: () => 'test-toast' }}>
            <ActivityAndCapture />
          </ToastContext.Provider>
        </MemoryRouter>
      )
    })
  })

  afterEach(async () => {
    useStore.setState({ createOverviewFileCapture: originalCapture })
    await act(async () => root.unmount())
    container.remove()
  })

  async function selectFile(file: File) {
    await act(async () => button(container, 'File').click())
    const input = container.querySelector('#overview-capture-file') as HTMLInputElement
    Object.defineProperty(input, 'files', { configurable: true, value: fileList(file) })
    await act(async () => input.dispatchEvent(new Event('change', { bubbles: true })))
  }

  it('shows the selected file and captures it through the existing store service', async () => {
    const capture = vi.fn().mockResolvedValue('story-file-1')
    useStore.setState({ createOverviewFileCapture: capture })
    const file = new File(['notes'], 'reflection.pdf', { type: 'application/pdf' })

    await selectFile(file)
    expect(container.textContent).toContain('reflection.pdf · 5 B')
    expect(button(container, 'Capture').disabled).toBe(false)

    await act(async () => (container.querySelector('#overview-capture-local') as HTMLButtonElement).click())
    const note = container.querySelector('input[aria-label="Optional note about this file"]') as HTMLInputElement
    await act(async () => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set?.call(note, 'Read after lab')
      note.dispatchEvent(new Event('input', { bubbles: true }))
    })
    await act(async () => button(container, 'Capture').click())

    expect(capture).toHaveBeenCalledTimes(1)
    expect(capture).toHaveBeenCalledWith(file, { commentary: 'Read after lab', localOnly: true })
    expect(container.textContent).toContain('Saved file to Story Bank.')
    expect(container.querySelector('#overview-capture-file')).toBeTruthy()
    expect(container.textContent).not.toContain('reflection.pdf · 5 B')
  })

  it('keeps the selected file and offers a retry when persistence fails', async () => {
    const capture = vi.fn().mockResolvedValue(null)
    useStore.setState({ createOverviewFileCapture: capture })
    const file = new File(['notes'], 'reflection.pdf', { type: 'application/pdf' })

    await selectFile(file)
    await act(async () => button(container, 'Capture').click())

    expect(capture).toHaveBeenCalledWith(file, { commentary: '', localOnly: false })
    expect(container.textContent).toContain('We couldn’t save this file on this device. Try again.')
    expect(container.textContent).toContain('reflection.pdf · 5 B')
    expect(container.textContent).not.toContain('Saved file to Story Bank.')
  })
})
