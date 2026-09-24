import { expect, it } from 'vitest'
import { createPersonalInitialData } from '@/data/personalInitialData'
import { workspaceRestoreReview } from './workspaceRestoreReview'

it('reviews known record additions, changes and explicit clearing without exposing opaque metadata', () => {
  const current = Object.assign(createPersonalInitialData(), { futureResearch: { privateTitle: 'Never render this opaque content' } })
  current.tasks = [{ id: 'removed', title: 'Old' }, { id: 'changed', title: 'Before' }] as typeof current.tasks
  const incoming = Object.assign(structuredClone(current), { futureResearch: { privateTitle: 'Another opaque title' } })
  incoming.tasks = [{ id: 'changed', title: 'After' }, { id: 'added', title: 'New' }] as typeof current.tasks
  expect(workspaceRestoreReview(current, incoming)).toEqual(['Tasks: 1 added, 1 changed, 1 removed.'])
  incoming.tasks = []
  expect(workspaceRestoreReview(current, incoming)).toEqual(['Tasks: 0 added, 0 changed, 2 removed.'])
  expect(current.tasks).toHaveLength(2)
})

it('blocks future-schema input before presenting a restore confirmation', () => {
  const current = createPersonalInitialData()
  expect(() => workspaceRestoreReview(current, Object.assign(structuredClone(current), { _schema: 2 }))).toThrow('newer version')
})

it('counts nested records in known sections while keeping their contents out of review text', () => {
  const current = createPersonalInitialData(), incoming = structuredClone(current)
  incoming.academics.classCenter.files.push({ id: 'synthetic-file', title: 'Private file title' } as typeof incoming.academics.classCenter.files[number])
  expect(workspaceRestoreReview(current, incoming)).toEqual(['Academics: 1 added, 0 changed, 0 removed.'])
})
