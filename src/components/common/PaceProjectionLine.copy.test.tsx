import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { expect, it } from 'vitest'
import { createInitialDataForMode, useStore } from '@/store/store'
import { PaceProjectionLine } from './PaceProjectionLine'

it('keeps existing projection controls outside optional copy disclosure', async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
  useStore.getState().replaceAll(createInitialDataForMode(false))
  const container = document.createElement('div')
  document.body.append(container)
  const root = createRoot(container)
  try {
    await act(async () => root.render(<PaceProjectionLine id="copy-review" insufficientLabel={
      <details><summary>Planning tip</summary><p>Start the largest later assignment during the lightest week.</p></details>
    } />))
    expect(container.querySelector('details')?.open).toBe(false)
    const hide = container.querySelector<HTMLButtonElement>('[aria-label="Hide projection"]')!
    expect(hide.closest('details')).toBeNull()
    await act(async () => hide.click())
    const show = container.querySelector<HTMLButtonElement>('button')!
    expect(show.textContent).toBe('Show projection')
    expect(show.closest('details')).toBeNull()
    await act(async () => show.click())
    expect(container.querySelector('details')?.open).toBe(false)
    expect(container.querySelector('[aria-label="Hide projection"]')).toBeTruthy()
  } finally {
    await act(async () => root.unmount())
    container.remove()
  }
})
