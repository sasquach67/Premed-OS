import { describe, expect, it } from 'vitest'
import { splitStudyTables } from './studyTable'

describe('study comparison tables', () => {
  it('handles escaped pipes and optional outer pipes', () => {
    expect(splitStudyTables('A | B\n--- | ---\nx \\| y | z')).toEqual([{ type: 'table', headers: ['A', 'B'], rows: [['x | y', 'z']] }])
  })
  it('preserves malformed tables and ordinary prose without dropping cells', () => {
    for (const content of ['a | b', '| A | B |\n| --- | --- |\n| x | y | z |', '| A | B |\n| --- |\n| x | y |']) {
      expect(splitStudyTables(content)).toEqual([{ type: 'text', content }])
    }
  })
  it('leaves HTML as literal cell text', () => {
    expect(splitStudyTables('| A |\n| --- |\n| <script>alert(1)</script> |')).toEqual([{ type: 'table', headers: ['A'], rows: [['<script>alert(1)</script>']] }])
  })
})
