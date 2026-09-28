import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest'
import { createPersonalInitialData } from '@/data/personalInitialData'
import { snapshotData, useStore } from '@/store/store'
import type { AppData } from '@/lib/types'
import { Research } from './Research'
import { InlineAddRow } from '@/components/common/InlineAddRow'
import { localDay } from '@/lib/research'

;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
const mocks = vi.hoisted(() => ({ commit: vi.fn(), cloud: { user: null as null | { id: string }, status: 'synced', lastSyncAt: 1, conflict: null } }))
vi.mock('@/store/workspaceTransaction', () => ({ commitWorkspaceMutation: (fn: (data: AppData) => void) => mocks.commit(fn) }))
vi.mock('@/store/AccountCloudContext', () => ({ useAccountCloud: () => mocks.cloud }))
vi.mock('@/components/ui/select-field', () => ({ SelectField: ({ value, onValueChange, options, ...props }: { value: string; onValueChange: (v: string) => void; options: {value:string;label:string}[] }) => <select {...props} value={value} onChange={event => onValueChange(event.target.value)}>{options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select> }))
let root: Root, host: HTMLDivElement
const env = { createdAt: 1, updatedAt: 1, archived: false, order: 0 }
function fixture() {
  const data = createPersonalInitialData()
  data.experiences = [{ ...env, id: 'lab', category: 'research', org: 'Synthetic Lab', role: 'Assistant', description: 'Original long detail', status: 'active', tags: [], research: { since: 'Fall 2025', current: true } }]
  return data
}
async function mount(data = fixture()) { useStore.getState().replaceAll(data); await act(async () => root.render(<MemoryRouter><Research /></MemoryRouter>)) }
function input(label: string) { return document.querySelector<HTMLInputElement>(`[aria-label="${label}"]`)! }
async function fill(element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement, value: string) { await act(async () => { const prototype = element instanceof HTMLSelectElement ? HTMLSelectElement.prototype : element instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype; Object.getOwnPropertyDescriptor(prototype, 'value')!.set!.call(element, value); element.dispatchEvent(new Event(element instanceof HTMLSelectElement ? 'change' : 'input', { bubbles: true })) }) }
function button(text: string) { return [...document.querySelectorAll<HTMLButtonElement>('button')].find(button => button.textContent?.trim() === text)! }
async function click(text: string) { await act(async () => button(text).click()) }
async function submit(form = host.querySelector('form')!) { await act(async () => form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))) }
beforeEach(() => {
  vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false, addEventListener() {}, removeEventListener() {} })))
  mocks.cloud = { user: null, status: 'synced', lastSyncAt: 1, conflict: null }
  mocks.commit.mockReset().mockImplementation(async (fn: (data: AppData) => void) => { const data = structuredClone(snapshotData()); fn(data); useStore.getState().adoptPreparedWorkspace(data) })
  host = document.createElement('div'); document.body.append(host); root = createRoot(host)
})
afterEach(async () => { await act(async () => root.unmount()); host.remove(); vi.unstubAllGlobals() })

describe('Research daily log', () => {
  it('keeps the draft on failure and blocks duplicate submits until durable acknowledgment', async () => {
    await mount(); await fill(input('What I did'), 'Observed setup')
    let finish!: () => void
    mocks.commit.mockImplementationOnce(() => new Promise<void>(resolve => { finish = resolve }))
    await submit(); expect(input('What I did').matches(':disabled')).toBe(true); expect(host.textContent).not.toContain('Saved on this device')
    await submit(); expect(mocks.commit).toHaveBeenCalledTimes(1)
    await act(async () => finish()); expect(input('What I did').value).toBe(''); expect(host.textContent).toContain('Saved on this device')
    await fill(input('What I did'), 'Retain this draft'); mocks.commit.mockRejectedValueOnce(new Error('Quota'))
    await submit(); expect(input('What I did').value).toBe('Retain this draft'); expect(host.textContent).toContain('Could not save on this device'); expect(host.textContent).not.toContain('Saved on this device')
  })
  it('captures zero-hour Thoughts, retrieves them by search, edits hours and deletes without duplicating', async () => {
    await mount(); await fill(input('What I did'), 'Observed setup'); await click('Thoughts'); await fill(input('Thoughts'), 'Ask why the order matters'); await submit()
    expect(snapshotData().experienceHourEntries[0]).toMatchObject({ hours: 0, kind: 'logged', note: 'Observed setup', thoughts: 'Ask why the order matters' })
    expect(host.textContent).toContain('No hours recorded')
    await fill(input('Search log'), 'order matters'); expect(host.textContent).toContain('Observed setup')
    const row = host.querySelector<HTMLButtonElement>('[aria-label^="Lab entry"]')!; await act(async () => row.click()); await click('Edit')
    const editHours = [...host.querySelectorAll<HTMLInputElement>('input')].find(el => el.parentElement?.textContent?.includes('Edit hours'))!; await fill(editHours, '2.5')
    await submit(host.querySelectorAll('form')[1]); expect(snapshotData().experienceHourEntries).toHaveLength(1); expect(snapshotData().experienceHourEntries[0].hours).toBe(2.5)
    await click('Delete'); expect(snapshotData().experienceHourEntries).toHaveLength(0); expect(snapshotData().trash[0].record.note).toBe('Observed setup')
  })
  it('keeps header statistics independent of search and reports complete weekly sums before pagination', async () => {
    const data = fixture(); data.goals.research = 150
    data.experienceHourEntries = Array.from({ length: 25 }, (_, i) => ({ ...env, id: `log${i}`, experienceId: 'lab', date: localDay(), hours: 1.5, kind: 'logged', note: `Day ${i}` }))
    await mount(data); const header = host.querySelector('[aria-label="Research totals"]')!; expect(header.textContent).toContain('37.5 / 150')
    expect(host.querySelector('.research-week')?.textContent).toContain('37.5 h'); expect(host.querySelectorAll('.research-entry')).toHaveLength(20)
    await click('Show earlier entries'); expect(host.querySelectorAll('.research-entry')).toHaveLength(25)
    await fill(input('Search log'), 'no match'); expect(header.textContent).toContain('37.5 / 150'); expect(host.textContent).toContain('No entries match')
  })
  it('keeps Earlier notes available without a lab and no example records appear', async () => {
    const data = createPersonalInitialData(); data.notePages = [{ id: 'legacy', title: 'Earlier research', body: 'Original text', pillar: 'research', order: 0, updatedAt: 1 }]
    await mount(data); expect(host.textContent).toContain('Add your lab'); expect(host.textContent).toContain('Earlier research'); expect(host.textContent).toContain('Original text'); expect(host.querySelector('[aria-label="Your lab"]')).toBeNull()
  })
  it('uses a separate pending sync message after device save, even if prior cloud state is synced', async () => {
    mocks.cloud.user = { id: 'synthetic' }; await mount(); await fill(input('What I did'), 'A new note'); await submit()
    expect(host.textContent).toContain('Saved on this device'); expect(host.textContent).toContain('Sync pending'); expect(host.textContent).not.toContain('Synced to your account')
  })
  it('keeps text period precision and makes another lab with no logs reachable', async () => {
    const data = fixture(); data.experiences.push({ ...data.experiences[0], id: 'other', org: 'Other Lab', research: {} })
    await mount(data); await click('Edit'); expect(document.body.textContent).toContain('Edit another lab'); expect(button('Other Lab')).toBeTruthy()
    await click('Save lab'); expect(snapshotData().experiences[0].research?.since).toBe('Fall 2025'); expect(snapshotData().experiences[0].description).toBe('Original long detail')
  })
  it('refreshes the manual contact draft after the lab editor changes the saved date', async () => {
    const data = fixture(); data.experiences[0].research!.lastPiContact = '2026-09-01'
    await mount(data)
    await act(async () => { const changed = structuredClone(snapshotData()); changed.experiences[0].research!.lastPiContact = '2026-09-20'; useStore.getState().adoptPreparedWorkspace(changed) })
    await click('Update'); expect(input('Last PI contact date').value).toBe('2026-09-20')
    await click('Save contact date'); expect(snapshotData().experiences[0].research?.lastPiContact).toBe('2026-09-20')
  })
  it('preserves the original InlineAddRow caller behavior', async () => {
    const add = vi.fn(); await act(async () => root.render(<InlineAddRow label="Add" fields={['Note']} onAdd={add} />))
    await fill(input('Note'), 'Legacy input'); await submit(); expect(add).toHaveBeenCalledWith(['Legacy input']); expect(input('Note').value).toBe('')
  })
})
