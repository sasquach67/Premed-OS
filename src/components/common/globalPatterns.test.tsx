import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'

import { RECORD_OPEN_MODES } from './CenterPeek'
import { InlineAddRow } from './InlineAddRow'
import { InteractiveCard } from './InteractiveCard'
import { CORE_INSPECTOR_SECTIONS, PROGRESSIVE_INSPECTOR_SECTIONS } from './ObjectInspector'
import { recordActionIds, type RecordAction } from './RecordActionMenu'
import { validateBannerMetricCount, type BannerStatStripMetric } from './StatStrip'
import { GLOSSARY } from '@/lib/glossary'

describe('global interaction contracts', () => {
  it('keeps peek, split, and expanded in one record-open model', () => {
    expect(RECORD_OPEN_MODES).toEqual(['peek', 'split', 'expanded'])
  })

  it('never lets an entity drop a core inspector section', () => {
    expect(CORE_INSPECTOR_SECTIONS.map((section) => section.key)).toEqual([
      'overview', 'relations', 'files', 'activity', 'actions',
    ])
    expect(PROGRESSIVE_INSPECTOR_SECTIONS.map((section) => section.key)).toEqual(['notes', 'dataQuality'])
  })

  it('limits a banner strip to three through five explicitly variable metrics', () => {
    const metric = (id: string): BannerStatStripMetric => ({ id, label: id, value: 1, cadence: 'variable' })
    expect(validateBannerMetricCount([metric('a'), metric('b')])).toBe(false)
    expect(validateBannerMetricCount([metric('a'), metric('b'), metric('c')])).toBe(true)
    expect(validateBannerMetricCount([metric('a'), metric('b'), metric('c'), metric('d'), metric('e'), metric('f')])).toBe(false)
  })

  it('uses one action model for visible overflow and the context shortcut', () => {
    const actions: RecordAction[] = [
      { id: 'open', label: 'Open', onSelect: vi.fn() },
      { id: 'archive', label: 'Archive', onSelect: vi.fn() },
    ]
    expect(recordActionIds(actions)).toEqual(['open', 'archive'])

    const html = renderToStaticMarkup(
      <InteractiveCard
        label="Open record"
        title="Record"
        secondary="Updated today"
        hoverAffordance="Open record →"
        onOpen={() => undefined}
        actions={actions}
      />,
    )
    expect(html).toContain('aria-label="Open record actions"')
  })

  it('keeps inline creation keyboard-submit friendly and empty cards honest', () => {
    const addRow = renderToStaticMarkup(
      <InlineAddRow label="Add log" fields={['Date', 'Hours']} onAdd={() => undefined} />,
    )
    expect(addRow).toContain('<form')
    expect(addRow).toContain('aria-label="Date"')
    expect(addRow).toContain('disabled=""')

    const emptyCard = renderToStaticMarkup(
      <InteractiveCard
        label="Open empty record"
        title="Record"
        hoverAffordance="Open record →"
        state="empty"
        onOpen={() => undefined}
      />,
    )
    expect(emptyCard).toContain('Nothing here yet. Add the first record to begin.')
  })

  it('stores InfoTip copy in the glossary rather than JSX', () => {
    expect(GLOSSARY['capacity.dailyHours'].field).toMatch(/Enter the hours/)
    expect(GLOSSARY['capacity.slack'].field).toMatch(/unclaimed/)
    expect(GLOSSARY['capacity.busyPeriod'].field).toMatch(/finals/)
  })
})
