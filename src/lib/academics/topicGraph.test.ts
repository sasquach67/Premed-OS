import { describe, expect, it } from 'vitest'
import { createTopicFsrsState } from '@/lib/academics/fsrs'
import {
  RELATION_LABEL, TOPIC_LINK_RELATIONS, areLinked, connectCandidates,
  isolatedTopics, linkTopics, linksForTopic, otherEnd, unlinkTopics,
} from '@/lib/academics/topicGraph'
import type { Course, Topic, TopicLink } from '@/lib/types'

const now = Date.UTC(2026, 8, 19)
const topic = (id: string, courseId = 'chem262'): Topic => ({
  id, courseId, title: id, status: 'ready', fsrs: createTopicFsrsState(now),
  confidence: 3, sourceNoteIds: [], order: 0,
})
const course = (id: string, code: string, patch: Partial<Course> = {}): Course => ({
  id, term: 'Fall 2026', code, title: code, credits: 3, grade: '', bcpm: true,
  status: 'in-progress', inResidence: true, satisfies: [], order: 0, ...patch,
})

describe('the five relations', () => {
  it('are exactly the ones the spec rules', () => {
    expect(TOPIC_LINK_RELATIONS).toEqual([
      'builds-on', 'contrasts-with', 'same-mechanism', 'prerequisite', 'shared-mcat-category',
    ])
    for (const relation of TOPIC_LINK_RELATIONS) expect(RELATION_LABEL[relation]).toBeTruthy()
  })
})

describe('authoring a link', () => {
  it('records it and reads it from both ends', () => {
    const links = linkTopics([], { fromTopicId: 'a', toTopicId: 'b', relation: 'builds-on', now })
    expect(links).toHaveLength(1)
    expect(linksForTopic(links, 'a')).toHaveLength(1)
    expect(linksForTopic(links, 'b')).toHaveLength(1)
    expect(otherEnd(links[0], 'b')).toBe('a')
  })

  it('refuses a self-link', () => {
    expect(linkTopics([], { fromTopicId: 'a', toTopicId: 'a', relation: 'builds-on', now })).toEqual([])
  })

  it('refuses a duplicate in EITHER direction', () => {
    // The same relation twice would double-count in every consumer.
    const once = linkTopics([], { fromTopicId: 'a', toTopicId: 'b', relation: 'builds-on', now })
    const again = linkTopics(once, { fromTopicId: 'b', toTopicId: 'a', relation: 'same-mechanism', now })
    expect(again).toHaveLength(1)
    expect(areLinked(again, 'b', 'a')).toBe(true)
  })

  it('unlinks one statement without disturbing the others', () => {
    let links: TopicLink[] = linkTopics([], { fromTopicId: 'a', toTopicId: 'b', relation: 'builds-on', now })
    links = linkTopics(links, { fromTopicId: 'a', toTopicId: 'c', relation: 'prerequisite', now })
    const after = unlinkTopics(links, links[0].id)
    expect(after).toHaveLength(1)
    expect(areLinked(after, 'a', 'c')).toBe(true)
  })
})

describe('connect candidates — suggestions, never writes', () => {
  const courses = [
    course('chem262', 'CHEM 262'),
    course('chem261', 'CHEM 261', { prereqOf: 'CHEM 262' }),
    course('psyc101', 'PSYC 101'),
    course('biol103', 'BIOL 103'),
  ]
  const topics = [
    topic('own', 'chem262'),
    topic('sibling', 'chem262'),
    topic('prior', 'chem261'),
    topic('psych', 'psyc101'),
  ]

  it('orders same course, then prerequisite course, then shared MCAT area', () => {
    const found = connectCandidates(topics[0], topics, courses, [])
    expect(found.map((entry) => entry.topic.id)).toEqual(['sibling', 'prior'])
    expect(found[0].reason).toBe('Same course')
    expect(found[1].reason).toBe('Prerequisite course')
  })

  it('suggests a shared MCAT content area across unrelated courses', () => {
    // CHEM 262 and BIOL 103 sit in different MCAT sections; CHEM 261 shares one.
    const chemTopics = [topic('own', 'chem262'), topic('other-chem', 'chem261')]
    const found = connectCandidates(chemTopics[0], chemTopics, [course('chem262', 'CHEM 262'), course('chem261', 'CHEM 261')], [])
    expect(found[0].reason).toBe('Shared MCAT content area')
  })

  it('never suggests the topic itself or an already-linked one', () => {
    const links = linkTopics([], { fromTopicId: 'own', toTopicId: 'sibling', relation: 'builds-on', now })
    const found = connectCandidates(topics[0], topics, courses, links)
    expect(found.map((entry) => entry.topic.id)).not.toContain('own')
    expect(found.map((entry) => entry.topic.id)).not.toContain('sibling')
  })

  it('returns nothing rather than guessing when there is nothing to suggest', () => {
    expect(connectCandidates(topics[0], [topics[0]], courses, [])).toEqual([])
  })
})

describe('#39 isolated topics', () => {
  it('names the topics with no link at all', () => {
    const topics = [topic('a'), topic('b'), topic('c')]
    const links = linkTopics([], { fromTopicId: 'a', toTopicId: 'b', relation: 'builds-on', now })
    expect(isolatedTopics(topics, links).map((item) => item.id)).toEqual(['c'])
  })

  it('counts a topic linked from either end as connected', () => {
    const topics = [topic('a'), topic('b')]
    const links = linkTopics([], { fromTopicId: 'b', toTopicId: 'a', relation: 'builds-on', now })
    expect(isolatedTopics(topics, links)).toEqual([])
  })
})
