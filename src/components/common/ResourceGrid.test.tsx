import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { ResourceGrid } from './ResourceGrid'

const mocks = vi.hoisted(() => ({ addItem: vi.fn(), removeItem: vi.fn() }))
vi.mock('@/store/store', () => ({ useStore: (select: (state: unknown) => unknown) => select({
  resources: [{ id: 'resource', pillar: 'academics', category: 'Exams', label: 'Exam guide', url: 'https://example.com', order: 0 }],
  ...mocks,
}) }))

let root: Root
let container: HTMLDivElement
beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  mocks.addItem.mockReset()
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
})
afterEach(async () => {
  await act(async () => root.unmount())
  container.remove()
  vi.unstubAllGlobals()
})
function button(label: string) {
  return [...document.querySelectorAll<HTMLButtonElement>('button')].find(item => item.textContent?.trim() === label)!
}
async function type(placeholder: string, value: string) {
  const input = document.querySelector<HTMLInputElement>(`input[placeholder="${placeholder}"]`)!
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, value)
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })
}

it('offers themed category presets and still saves a custom category', async () => {
  await act(async () => root.render(<ResourceGrid pillar="academics" />))
  await act(async () => button('Add link').click())
  await act(async () => {
    const trigger = button('Choose category')
    trigger.focus()
    trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
  })
  const preset = [...document.querySelectorAll<HTMLElement>('[role="menuitem"]')].find(item => item.textContent === 'Exams')!
  expect(preset).toBeTruthy()
  await act(async () => preset.click())
  expect(document.querySelector<HTMLInputElement>('#resource-category')?.value).toBe('Exams')
  expect(document.querySelector('datalist')).toBeNull()
  await type('e.g. Anki / Exams / Content', 'Custom reading')
  await type('e.g. UWorld QBank', 'Reading list')
  await type('https://…', 'https://example.com/reading')
  await act(async () => button('Add resource').click())
  expect(mocks.addItem).toHaveBeenCalledWith('resources', expect.objectContaining({ category: 'Custom reading', label: 'Reading list', url: 'https://example.com/reading' }))
})
