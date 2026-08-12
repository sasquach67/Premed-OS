import { describe, expect, it } from 'vitest'
import { classCardColor } from './ClassCenter'

describe('Class Center card compatibility', () => {
  it('falls back to the current blue accent for a persisted retired color', () => {
    expect(classCardColor('teal')).toBe('blue')
    expect(classCardColor(undefined)).toBe('blue')
    expect(classCardColor('purple')).toBe('purple')
  })
})
