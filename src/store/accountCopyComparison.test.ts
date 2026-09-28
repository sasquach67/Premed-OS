import { expect, it } from 'vitest'
import { createPersonalInitialData } from '@/data/personalInitialData'
import { additiveAccountWinner, classifyAccountCopyChanges, comparableAccountContent } from './accountCopyComparison'
const task = (id: string) => ({ id, title: id, type: 'Task', progress: 'Not started' as const, kanban: 'todo' as const, archived: false, order: 0 })
it('requires the smaller side to match the baseline, not merely contain fewer records', () => {
  const small = createPersonalInitialData(), full = structuredClone(small)
  full.tasks.push(task('new'))
  const changes = classifyAccountCopyChanges(small, full)
  expect(additiveAccountWinner(changes, true, false)).toBe('cloud')
  expect(additiveAccountWinner(changes, false, false)).toBeNull()
  expect(additiveAccountWinner(changes, false, true)).toBeNull()
  expect(additiveAccountWinner(classifyAccountCopyChanges(full, small), false, true)).toBe('device')
})
it('rejects shared edits, record reordering, tombstones and unknown collection changes', () => {
  const a = createPersonalInitialData(); a.tasks = [task('one'), task('two')]
  for (const change of [
    (b: typeof a) => { b.tasks[0].title = 'edited'; b.tasks.push(task('new')) },
    (b: typeof a) => { b.tasks.reverse(); b.tasks.push(task('new')) },
    (b: typeof a) => { b.tasks.push({ ...task('deleted'), deletedAt: 2 } as typeof b.tasks[number]) },
    (b: typeof a) => { Object.assign(b, { futureRecords: [{ id: 'future' }] }) },
  ]) {
    const b = structuredClone(a); change(b)
    expect(additiveAccountWinner(classifyAccountCopyChanges(a, b), true, false)).toBeNull()
  }
})
it('does not truncate safety checks to the first 60 display differences', () => {
  const a = createPersonalInitialData(), b = structuredClone(a)
  for (let i = 0; i < 70; i++) b.tasks.push(task(String(i)))
  b.profile.name = 'a shared field changed'
  expect(additiveAccountWinner(classifyAccountCopyChanges(a, b), true, false)).toBeNull()
})
it('ignores object-key order while keeping array order meaningful', () => {
  const a = createPersonalInitialData(); a.tasks = [task('one')]
  const b = structuredClone(a); b.tasks = [{ ...Object.fromEntries(Object.entries(task('one')).reverse()) } as unknown as typeof b.tasks[number], task('two')]
  expect(additiveAccountWinner(classifyAccountCopyChanges(a, b), true, false)).toBe('cloud')
})

it('ignores only enumerated housekeeping and empty Research defaults, never authored or unknown values', () => {
  const a=createPersonalInitialData(), b=structuredClone(a)
  b.meta.lastOpenedAt=123;b.meta.recentRoutes=['/research'];b.settings.calendar.lastSyncedAt=456
  delete (b as Partial<typeof b>).researchReminders
  expect(comparableAccountContent(a)).toBe(comparableAccountContent(b))
  b.notes.example='Authored note'
  expect(comparableAccountContent(a)).not.toBe(comparableAccountContent(b))
  delete b.notes.example
  Object.assign(b,{futureSection:{value:'keep'}})
  expect(comparableAccountContent(a)).not.toBe(comparableAccountContent(b))
})

it('identifies opaque top-level omissions in either direction independently of known record deletions', () => {
  const a = createPersonalInitialData(), b = { ...structuredClone(a), futureSection: { keep: true } }
  expect(classifyAccountCopyChanges(a, b).opaqueOmission).toBe(true)
  expect(classifyAccountCopyChanges(b, a).opaqueOmission).toBe(true)
  a.tasks.push(task('known'))
  expect(classifyAccountCopyChanges(a, createPersonalInitialData()).opaqueOmission).toBe(false)
})
