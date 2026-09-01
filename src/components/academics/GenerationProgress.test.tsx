import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { GenerationProgress } from './GenerationProgress'

;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

describe('GenerationProgress', () => {
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

  it('shows completed sources, an active generation step, and a pending save step', async () => {
    await act(async () => root.render(<GenerationProgress phase="generating" outputLabel="Study guide" />))

    expect(container.querySelector('[data-generation-step="Prepare sources"]')?.getAttribute('data-generation-status')).toBe('complete')
    expect(container.querySelector('[data-generation-step="Create output"]')?.getAttribute('data-generation-status')).toBe('active')
    expect(container.querySelector('[data-generation-step="Save result"]')?.getAttribute('data-generation-status')).toBe('pending')
    expect(container.textContent).toContain('1 of 3 complete')
  })

  it('turns every step into a check on completion and exposes errors without hiding the trace', async () => {
    await act(async () => root.render(<GenerationProgress phase="error" outputLabel="Unit question bank" errorMessage="The provider stopped before returning a valid bank." />))

    expect([...container.querySelectorAll('[data-generation-status="complete"]')]).toHaveLength(1)
    expect(container.querySelector('[data-generation-status="error"]')).toBeTruthy()
    expect(container.textContent).toContain('The provider stopped before returning a valid bank.')
  })
})
