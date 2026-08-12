import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { ThreeLevelNav, tabsForMode, type ThreeLevelNavMode } from './ThreeLevelNav'

const modes: [ThreeLevelNavMode, ThreeLevelNavMode] = [
  {
    id: 'daily',
    label: 'Daily',
    tabs: [
      { id: 'classes', label: 'Classes' },
      { id: 'assignments', label: 'Assignments' },
    ],
  },
  {
    id: 'planning',
    label: 'Planning',
    tabs: [{ id: 'planner', label: 'Planner' }],
  },
]

describe('tabsForMode', () => {
  it('shows only the tabs owned by the active product mode', () => {
    expect(tabsForMode(modes, 'planning').map((tab) => tab.id)).toEqual(['planner'])
  })

  it('falls back to the first mode without merging unrelated tabs', () => {
    expect(tabsForMode(modes, 'missing').map((tab) => tab.id)).toEqual(['classes', 'assignments'])
  })
})

describe('ThreeLevelNav', () => {
  it('renders all three navigation levels from one configuration', () => {
    const html = renderToStaticMarkup(
      <ThreeLevelNav
        modes={modes}
        activeMode="daily"
        onModeChange={() => undefined}
        activeTab="classes"
        onTabChange={() => undefined}
        period={{
          label: 'Term',
          value: 'fall',
          options: [{ value: 'fall', label: 'Fall 2026' }],
          onChange: () => undefined,
        }}
        search={{
          label: 'Search classes',
          placeholder: 'Search classes…',
          value: '',
          onChange: () => undefined,
        }}
        views={{
          label: 'Class view',
          value: 'cards',
          options: [{ value: 'cards', label: 'Cards' }],
          onChange: () => undefined,
        }}
        resultCount={0}
        resultNoun={{ singular: 'class', plural: 'classes' }}
      />,
    )

    expect(html).toContain('data-navigation-level="1"')
    expect(html).toContain('data-navigation-level="2"')
    expect(html).toContain('data-navigation-level="3"')
    expect(html).toContain('Classes')
    expect(html).not.toContain('Planner')
    expect(html).toContain('No classes yet.')
    expect(html).toContain('aria-label="Class view"')
  })
})
