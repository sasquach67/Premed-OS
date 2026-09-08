// @vitest-environment jsdom
import { afterEach, expect, it } from 'vitest'
import { gzipSync, strFromU8, strToU8 } from 'fflate'
import { accountStorageKey } from '@/lib/demoMode'
import { activateAccountWorkspace, activateGuestWorkspace, activeAccountWorkspaceId, snapshotData } from './store'
import { guardedStorage, storageFailure } from './storageHealth'
import { decodeWorkspaceStorage, encodeWorkspaceStorage, WORKSPACE_STORAGE_PREFIX } from './workspaceStorageCodec'

const raw = JSON.stringify({ originalRaw: 'Keep whitespace\n\t\u0000 and \u2014 \ud83e\udde0 \ud800'.repeat(20_000), notes: 'Exact notes', history: [{ answer: '\\n is not a newline' }] })

afterEach(() => {
  guardedStorage(localStorage).setItem('codec-test-cleanup', '{}')
  localStorage.clear()
  sessionStorage.clear()
})

function corruptChecksum(encoded: string) {
  const binary = atob(encoded.slice(WORKSPACE_STORAGE_PREFIX.length))
  const index = binary.length - 8
  return WORKSPACE_STORAGE_PREFIX + btoa(binary.slice(0, index) + String.fromCharCode(binary.charCodeAt(index) ^ 1) + binary.slice(index + 1))
}

it('round-trips every JSON character without changing original strings or history', () => {
  const encoded = encodeWorkspaceStorage(raw)
  expect(encoded.startsWith(WORKSPACE_STORAGE_PREFIX)).toBe(true)
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
})

it('rejects truncated, corrupt and unsupported encodings instead of treating them as empty data', () => {
  const encoded = encodeWorkspaceStorage(raw)
  expect(() => decodeWorkspaceStorage(encoded.slice(0, -12))).toThrow('could not be decoded')
  expect(() => decodeWorkspaceStorage(corruptChecksum(encoded))).toThrow('could not be decoded')
  expect(() => decodeWorkspaceStorage(encoded.replace('gzip:v1:', 'gzip:v2:'))).toThrow('Unsupported')
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
