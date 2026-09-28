import { expect, it } from 'vitest'
import { canonicalJson, sameJson } from './logicalJson'

it('treats reordered object keys at any depth as the same JSON', () => {
  expect(sameJson({ a: 1, b: { x: [1, { p: 1, q: 2 }], y: 'z' } }, { b: { y: 'z', x: [1, { q: 2, p: 1 }] }, a: 1 })).toBe(true)
  expect(canonicalJson({ b: 1, a: 2 })).toBe('{"a":2,"b":1}')
})
it('still detects every real difference', () => {
  expect(sameJson({ a: { b: 1 } }, { a: { b: 2 } })).toBe(false)          // changed value
  expect(sameJson({ a: [1, 2] }, { a: [2, 1] })).toBe(false)              // array order is data
  expect(sameJson({ a: 1 }, { a: 1, b: null })).toBe(false)               // null is a value
  expect(sameJson({ a: '1' }, { a: 1 })).toBe(false)                      // type
  expect(sameJson({ a: { b: 1 } }, { a: { b: 1, c: 0 } })).toBe(false)    // added key
})
it('follows JSON: an undefined property is the same as a missing one', () => {
  expect(sameJson({ a: 1, b: undefined }, { a: 1 })).toBe(true)
})
