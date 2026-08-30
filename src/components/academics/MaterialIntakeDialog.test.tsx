import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MaterialIntakeDialog } from './MaterialIntakeDialog'
import { ToastProvider } from '@/components/common/ToastProvider'
import { Button } from '@/components/ui/button'

;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

describe('MaterialIntakeDialog keyboard intake', () => {
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

  it.each(['Enter', ' '])('opens the file picker from the screenshot tile with %j', async (key) => {
    await act(async () => {
      root.render(<ToastProvider><MaterialIntakeDialog courseId="course-1" trigger={<Button>Add material</Button>} /></ToastProvider>)
    })
    await act(async () => (container.querySelector('button') as HTMLButtonElement).click())

    const screenshotTile = [...document.body.querySelectorAll<HTMLElement>('[role="button"]')]
      .find((item) => item.textContent?.includes('Paste a screenshot'))!
    const input = document.body.querySelector<HTMLInputElement>('input[type="file"]')!
    const click = vi.spyOn(input, 'click').mockImplementation(() => {})

    await act(async () => screenshotTile.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true })))

    expect(click).toHaveBeenCalledOnce()
  })
})
