// @vitest-environment jsdom
import { afterEach, expect, it } from 'vitest'
import { gzipSync, strFromU8, strToU8 } from 'fflate'
import { accountStorageKey } from '@/lib/demoMode'
import { activateAccountWorkspace, activateGuestWorkspace, activeAccountWorkspaceId, snapshotData } from './store'
import { guardedStorage, storageFailure } from './storageHealth'
import { decodeWorkspaceStorage, encodeWorkspaceStorage, WORKSPACE_CHUNKS_PREFIX, WORKSPACE_STORAGE_PREFIX } from './workspaceStorageCodec'

const raw = JSON.stringify({ originalRaw: 'Keep whitespace\n\t\u0000 and \u2014 \ud83e\udde0 \ud800'.repeat(20_000), notes: 'Exact notes', history: [{ answer: '\\n is not a newline' }] })

it('stores distant repeated notebook content once without changing a single character', () => {
  let seed = 123456789
  const content = Array.from({ length: 300_000 }, () => { seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5; return String.fromCharCode(65 + (seed >>> 0) % 26) }).join('')
  const packageText = JSON.stringify({ sources: [{ text: content }], title: 'Retain me' })
  const value = JSON.stringify({ current: JSON.parse(packageText), original: JSON.parse(packageText), originalRaw: ' \n' + packageText + '\n', history: [{ current: JSON.parse(packageText), notes: 'Exact notes' }] })
  const encoded = encodeWorkspaceStorage(value, { deduplicate: true })
  expect(encoded.startsWith(WORKSPACE_CHUNKS_PREFIX)).toBe(true)
  const production = encodeWorkspaceStorage(value)
  expect(production.startsWith(WORKSPACE_STORAGE_PREFIX)).toBe(true)
  expect(decodeWorkspaceStorage(production)).toBe(value)
  const prior = WORKSPACE_STORAGE_PREFIX + btoa(strFromU8(gzipSync(strToU8(value), { level: 1, mtime: 0 }), true))
  expect(decodeWorkspaceStorage(encoded)).toBe(value)
  expect(encoded.length).toBeLessThan(prior.length / 2)
})

afterEach(() => {
  guardedStorage(localStorage).setItem('codec-test-cleanup', '{}')
  localStorage.clear()
  sessionStorage.clear()
})

function corruptChecksum(encoded: string) {
  const prefix = encoded.startsWith(WORKSPACE_CHUNKS_PREFIX) ? WORKSPACE_CHUNKS_PREFIX : WORKSPACE_STORAGE_PREFIX
  const binary = atob(encoded.slice(prefix.length))
  const index = binary.length - 8
  return prefix + btoa(binary.slice(0, index) + String.fromCharCode(binary.charCodeAt(index) ^ 1) + binary.slice(index + 1))
}

it('round-trips every JSON character without changing original strings or history', () => {
  const encoded = encodeWorkspaceStorage(raw)
  expect(encoded.startsWith('premed-os:workspace:')).toBe(true)
  expect(encoded.length).toBeLessThan(raw.length / 2)
  expect(decodeWorkspaceStorage(encoded)).toBe(raw)
  expect(JSON.parse(decodeWorkspaceStorage(encoded))).toEqual(JSON.parse(raw))
  expect(encodeWorkspaceStorage(encoded)).toBe(encoded)
})

it('keeps legacy plain JSON readable and small writes byte-identical', () => {
  const small = ' {"state":{"notes":"original spacing"},"version":39}\n'
  expect(decodeWorkspaceStorage(raw)).toBe(raw)
  expect(encodeWorkspaceStorage(small)).toBe(small)
  expect(decodeWorkspaceStorage(small)).toBe(small)
  const legacy = WORKSPACE_STORAGE_PREFIX + btoa(strFromU8(gzipSync(strToU8(raw), { level: 1, mtime: 0 }), true))
  expect(decodeWorkspaceStorage(legacy)).toBe(raw)
})

it('retains literal lone surrogates and exact JSON spelling across chunk boundaries', () => {
  const spelling = ' \n { "number": 1e+02, "text": "\\u0041", "notes": "' + '\ud800\\n\\\\\\"🧠'.repeat(40_000) + '" }\n'
  JSON.parse(spelling)
  const encoded = encodeWorkspaceStorage(spelling, { deduplicate: true })
  expect(encoded.startsWith(WORKSPACE_CHUNKS_PREFIX)).toBe(true)
  expect(encodeWorkspaceStorage(spelling)).toBe(spelling)
  expect(decodeWorkspaceStorage(encoded)).toBe(spelling)
  expect(encodeWorkspaceStorage(encoded)).toBe(encoded)
})

it.each([
  [10, ['abc'], [0]], // missing characters
  [3, ['abc'], [1]], // unknown reference
  [3, ['abc'], [-1]],
  [3, ['abc'], [0.5]],
  [1, ['abc'], [0]], // expansion beyond declared length
  [3, [null], [0]],
  [2 ** 30, ['abc'], [0]], // declared expansion beyond the safety bound
].map(envelope => ({ envelope })))('rejects invalid chunk data without returning a partial workspace (%j)', ({ envelope }) => {
  const encoded = WORKSPACE_CHUNKS_PREFIX + btoa(strFromU8(gzipSync(strToU8(JSON.stringify(envelope))), true))
  expect(() => decodeWorkspaceStorage(encoded)).toThrow('could not be decoded')
})

it('rejects truncated, corrupt and unsupported encodings instead of treating them as empty data', () => {
  const encoded = encodeWorkspaceStorage(raw)
  expect(() => decodeWorkspaceStorage(encoded.slice(0, -12))).toThrow('could not be decoded')
  expect(() => decodeWorkspaceStorage(corruptChecksum(encoded))).toThrow('could not be decoded')
  expect(() => decodeWorkspaceStorage(encoded.replace(':v1:', ':v999:'))).toThrow('Unsupported')
  expect(() => decodeWorkspaceStorage(WORKSPACE_STORAGE_PREFIX + 'not-base64!')).toThrow('could not be decoded')
  const notJson = WORKSPACE_STORAGE_PREFIX + btoa(strFromU8(gzipSync(strToU8('not JSON')), true))
  expect(() => decodeWorkspaceStorage(notJson)).toThrow('could not be decoded')
})

it('retains corrupt stored bytes and blocks later autosave until that value is explicitly removed or replaced', () => {
  const storage = guardedStorage(localStorage), corrupt = corruptChecksum(encodeWorkspaceStorage(raw))
  localStorage.setItem('corrupt-workspace', corrupt)
  expect(() => storage.getItem('corrupt-workspace')).toThrow('could not be decoded')
  storage.setItem('corrupt-workspace', '{}')
  expect(localStorage.getItem('corrupt-workspace')).toBe(corrupt)
  expect(storageFailure()).toContain('kept unchanged')
  storage.removeItem('corrupt-workspace')
  storage.setItem('corrupt-workspace', '{}')
  expect(localStorage.getItem('corrupt-workspace')).toBe('{}')
})

it('does not switch accounts or overwrite a cache that cannot be decoded', () => {
  activateGuestWorkspace()
  const before = structuredClone(snapshotData()), key = accountStorageKey('corrupt-owner')
  const corrupt = corruptChecksum(encodeWorkspaceStorage(raw))
  localStorage.setItem(key, corrupt)
  expect(() => activateAccountWorkspace('corrupt-owner')).toThrow('could not be decoded')
  expect(activeAccountWorkspaceId()).toBeNull()
  expect(snapshotData()).toEqual(before)
  expect(localStorage.getItem(key)).toBe(corrupt)
})

it.each(['premed-os:workspace:future:v1:unknown', '{ broken JSON'])('does not overwrite newly unreadable bytes before a prior read (%s)', value => {
  const storage = guardedStorage(localStorage), key = 'changed-encoding-workspace'
  storage.setItem(key, '{}')
  // Simulate a changed value from another tab after this adapter last read it.
  localStorage.setItem(key, value)
  storage.setItem(key, '{"new":"write"}')
  expect(localStorage.getItem(key)).toBe(value)
  expect(storageFailure()).not.toBe('')
})
