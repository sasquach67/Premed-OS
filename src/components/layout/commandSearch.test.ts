import { describe, expect, it } from 'vitest'
import { rankCommandHits, type CommandHit } from './commandSearchCore'

describe('command ranking', () => {
  it('ranks actions above navigation for verb queries', () => {
    const hits: CommandHit[] = [
      { id: 'page', label: 'Task list', sub: 'Application', group: 'Navigate', kind: 'page' },
      { id: 'action', label: 'New task', sub: 'Create a task', group: 'Actions', kind: 'action' },
    ]
    expect(rankCommandHits(hits, 'new task', [])[0]?.id).toBe('action')
  })

  it('ranks 5,000 records within the shell budget', () => {
    const hits: CommandHit[] = Array.from({ length: 5000 }, (_, index) => ({
      id: `record-${index}`,
      label: `Record ${index}`,
      sub: index % 2 ? 'Course' : 'Experience',
      group: 'Records',
      kind: 'record',
    }))
    const started = performance.now()
    const results = rankCommandHits(hits, 'record 4999', [])
    const elapsed = performance.now() - started
    expect(results[0]?.id).toBe('record-4999')
    expect(elapsed).toBeLessThan(100)
  })
})

it('never penalises the least recent remembered match or promotes a nonmatch', () => {
  const hits: CommandHit[] = [
    { id: 'unused', label: 'Biology', sub: '', group: 'Records', kind: 'record' },
    { id: 'recent', label: 'Biology', sub: '', group: 'Records', kind: 'record' },
    { id: 'miss', label: 'Chemistry', sub: '', group: 'Records', kind: 'record' },
  ]
  const recents = ['miss', ...Array.from({length: 10}, (_, i) => String(i)), 'recent']
  expect(rankCommandHits(hits, 'Biology', recents).map(hit => hit.id)).toEqual(['recent', 'unused'])
})
