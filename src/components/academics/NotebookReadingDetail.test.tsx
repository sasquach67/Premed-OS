import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import fixture from '@/lib/academics/notebook/visual-fixtures/valid-v4-repertoire.json'
import type { NotebookPackage } from '@/lib/academics/notebook/types'
import { NotebookPackageView } from './ExternalNotebookView'
import { notebookReadingDetailKey } from './useNotebookReadingDetail'
import { setActiveWorkspaceOwner, DEMO_MODE_FLAG } from '@/lib/demoMode'
import { useStore } from '@/store/store'

let root: Root, container: HTMLDivElement
function sample() {
  const pkg = structuredClone(fixture) as NotebookPackage
  const evidence = { provenance: 'source' as const, sourceIds: ['ref'], excerptIds: ['ref-1'] }
  pkg.entries[0].sections = [{ id: 'detail', title: 'Signal duration', purpose: 'study-guide', blocks: [
    { ...evidence, id: 'p', type: 'paragraph', text: 'The switch outlasts the signal.', more: 'The reset takes forty seconds.' },
    { ...evidence, id: 'b', type: 'bullets', items: ['A slower reset extends the response.'], more: 'Once all switches are active, the response saturates.' },
    { ...evidence, id: 'i', type: 'illustration', title: 'One switch', lines: ['Signal off → switch still on'], summary: 'Reset controls duration.', more: 'The same ten-second pulse can have different response durations.' },
  ] }]
  return pkg
}
beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
  localStorage.clear(); setActiveWorkspaceOwner({ kind: 'account', userId: 'detail-a' })
  container = document.createElement('div'); document.body.append(container); root = createRoot(container)
})
afterEach(async () => { await act(async () => root.unmount()); container.remove(); localStorage.clear(); vi.restoreAllMocks() })
async function show(pkg = sample(), change?: (path: (string | number)[], value: string | null) => void) { await act(async () => root.render(<NotebookPackageView pkg={pkg} reader mode="study" change={change} />)) }
async function click(text: string) { const button = [...container.querySelectorAll('button')].find(el => el.textContent === text)!; expect(button).toBeTruthy(); await act(async () => button.click()) }
function detailsVisible() { return [...container.querySelectorAll<HTMLElement>('.nbr-additional-detail,.nbr-illustration-more')].map(el => !el.hidden) }
it('defaults to full explanations and switches the whole guide without changing content', async () => {
  const pkg = sample(), original = JSON.stringify(pkg)
  await show(pkg)
  expect(detailsVisible()).toEqual([true, true, true]); expect(container.textContent).not.toContain('Show more')
  await click('Condensed')
  expect(detailsVisible()).toEqual([false, false, false])
  expect([...container.querySelectorAll('.en-block-paragraph button,.en-block-bullets button')].some(button => /Show more|Show less/.test(button.textContent ?? ''))).toBe(false)
  expect(container.textContent).toContain('The switch outlasts the signal.')
  await click('Show more'); expect(detailsVisible()).toEqual([false, false, true])
  await click('Full detail'); expect(detailsVisible()).toEqual([true, true, true])
  await click('Condensed'); expect(detailsVisible()).toEqual([false, false, false])
  expect(JSON.stringify(pkg)).toBe(original)
})
it('remembers across reopening and isolates accounts, guest and demo without a stale handler writing to another owner', async () => {
  await show(); await click('Condensed'); const aKey = notebookReadingDetailKey()
  await act(async () => root.unmount()); root = createRoot(container); await show()
  expect(detailsVisible()).toEqual([false, false, false])
  const staleFull = [...container.querySelectorAll('button')].find(el => el.textContent === 'Full detail')!
  setActiveWorkspaceOwner({ kind: 'account', userId: 'detail-b' })
  await act(async () => staleFull.click())
  expect(localStorage.getItem(notebookReadingDetailKey()!)).toBeNull()
  await act(async () => useStore.setState({ ...useStore.getState() }))
  expect(detailsVisible()).toEqual([true, true, true])
  setActiveWorkspaceOwner({ kind: 'guest' }); await show(); expect(detailsVisible()).toEqual([true, true, true])
  localStorage.setItem(DEMO_MODE_FLAG, 'on'); await show(); expect(detailsVisible()).toEqual([true, true, true])
  localStorage.removeItem(DEMO_MODE_FLAG); setActiveWorkspaceOwner({ kind: 'account', userId: 'detail-a' }); await show()
  expect(notebookReadingDetailKey()).toBe(aKey); expect(detailsVisible()).toEqual([false, false, false])
})
it('follows another tab preference and safely defaults malformed values to full', async () => {
  localStorage.setItem(notebookReadingDetailKey()!, 'invalid'); await show(); expect(detailsVisible()).toEqual([true, true, true])
  await act(async () => { localStorage.setItem(notebookReadingDetailKey()!, 'condensed'); window.dispatchEvent(new StorageEvent('storage', { key: notebookReadingDetailKey()! })) })
  expect(detailsVisible()).toEqual([false, false, false])
})
it('keeps edit fields available while condensed and clears additional text to null', async () => {
  await show(); await click('Condensed'); const changes = vi.fn(); await show(sample(), changes)
  expect(container.querySelector('[aria-label="Guide reading detail"]')).toBeNull()
  for (const block of ['paragraph', 'bullets']) {
    const el = [...container.querySelectorAll<HTMLTextAreaElement>(`.en-block-${block} textarea`)].find(el => el.closest('label')?.textContent?.startsWith('Additional explanation'))!
    expect(el.value).toBeTruthy()
    await act(async () => { Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')!.set!.call(el, ''); el.dispatchEvent(new Event('input', { bubbles: true })) })
    expect(changes.mock.calls.at(-1)?.[0].at(-1)).toBe('more'); expect(changes.mock.calls.at(-1)?.[1]).toBeNull()
  }
})
it('omits an empty guide-wide control for legacy packages and absent detail', async () => {
  const pkg = sample(); pkg.entries[0].sections[0].blocks.forEach(block => { if (block.type === 'illustration') block.more = null; else if (block.type === 'paragraph' || block.type === 'bullets') delete block.more })
  await show(pkg); expect(container.querySelector('[aria-label="Guide reading detail"]')).toBeNull()
})
it('keeps a storage failure usable for the current account and discloses the limit', async () => {
  setActiveWorkspaceOwner({ kind: 'account', userId: 'storage-failure-only' }); await show()
  const original = Storage.prototype.setItem
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (this: Storage, key, value) { if (key.startsWith('premed-os:notebook-reading-detail:')) throw new DOMException('quota', 'QuotaExceededError'); return original.call(this, key, value) })
  await click('Condensed'); expect(detailsVisible()).toEqual([false, false, false]); expect(container.textContent).toContain('could not be remembered')
  await act(async () => root.unmount()); root = createRoot(container); await show()
  expect(detailsVisible()).toEqual([false, false, false]); expect(container.textContent).toContain('could not be remembered')
  setActiveWorkspaceOwner({ kind: 'account', userId: 'detail-b' }); await show(); expect(detailsVisible()).toEqual([true, true, true])
})

it('does not open practice answers or worked solutions in either reading mode', async () => {
  const pkg = sample()
  const blocks = (structuredClone(fixture) as NotebookPackage).entries[0].sections.flatMap(section => section.blocks).filter(block => block.type === 'practice' || block.type === 'worked-example')
  expect(blocks.some(block => block.type === 'practice')).toBe(true)
  expect(blocks.some(block => block.type === 'worked-example')).toBe(true)
  for (const block of blocks) if (block.type === 'practice' || block.type === 'worked-example') { block.stimulusBlockIds = []; block.assetIds = [] }
  pkg.entries[0].sections[0].blocks.push(...blocks)
  await act(async () => root.render(<NotebookPackageView pkg={pkg} reader mode="all" />))
  const closed = () => {
    const reveals = [...container.querySelectorAll<HTMLDetailsElement>('.en-answer')]
    expect(reveals.length).toBeGreaterThanOrEqual(2)
    expect(reveals.every(el => !el.open)).toBe(true)
  }
  closed(); await click('Condensed'); closed(); await click('Full detail'); closed()
})

it('keeps full detail readable when browser storage cannot identify the owner', async () => {
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new DOMException('blocked', 'SecurityError') })
  await show()
  expect(detailsVisible()).toEqual([true, true, true])
  expect(container.textContent).toContain('Browser preferences are unavailable')
  expect([...container.querySelectorAll<HTMLButtonElement>('.nbr-detail-options button')].every(button => button.disabled)).toBe(true)
})
