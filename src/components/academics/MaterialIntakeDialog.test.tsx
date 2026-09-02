import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MaterialIntakeDialog } from './MaterialIntakeDialog'
import { ToastProvider } from '@/components/common/ToastProvider'
import { Button } from '@/components/ui/button'

;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

describe('MaterialIntakeDialog clipboard intake', () => {
  let container: HTMLDivElement
  let root: Root

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
  })

  afterEach(async () => {
    await act(async () => root.unmount())
    container.remove()
  })

  async function openDialog() {
    await act(async () => {
      root.render(<ToastProvider><MaterialIntakeDialog courseId="course-1" trigger={<Button>Add material</Button>} /></ToastProvider>)
    })
    await act(async () => (container.querySelector('button') as HTMLButtonElement).click())
  }

  function screenshotTile() {
    return [...document.body.querySelectorAll<HTMLButtonElement>('button')]
      .find((item) => item.textContent?.includes('Paste a screenshot'))!
  }

  it('focuses the screenshot paste target without opening the file picker', async () => {
    await openDialog()

    const input = document.body.querySelector<HTMLInputElement>('input[type="file"]')!
    const click = vi.spyOn(input, 'click').mockImplementation(() => {})

    await act(async () => screenshotTile().click())

    expect(click).not.toHaveBeenCalled()
    expect(document.activeElement).toBe(screenshotTile())
  })

  it.each(['Enter', ' '])('keeps keyboard activation on the paste target with %j', async (key) => {
    await openDialog()

    const input = document.body.querySelector<HTMLInputElement>('input[type="file"]')!
    const click = vi.spyOn(input, 'click').mockImplementation(() => {})
    screenshotTile().focus()

    await act(async () => screenshotTile().dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true })))

    expect(click).not.toHaveBeenCalled()
    expect(document.activeElement).toBe(screenshotTile())
  })

  it('captures a clipboard image after the paste target is focused', async () => {
    await openDialog()
    const screenshot = new File(['image bytes'], 'textbook-page.png', { type: 'image/png' })
    const pasteEvent = new Event('paste', { bubbles: true, cancelable: true })
    Object.defineProperty(pasteEvent, 'clipboardData', { value: { files: [screenshot] } })

    await act(async () => {
      screenshotTile().click()
      screenshotTile().dispatchEvent(pasteEvent)
    })

    expect(document.body.textContent).toContain('textbook-page.png')
  })
})
