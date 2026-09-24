import type { AppData } from './types'

/** Cloud contract, independent of store migrations and ZIP/envelope versions.
 *  The `dashboards.cloud_schema` column is the server authority; `_schema`
 *  inside the document is the portable copy that local snapshots, JSON/ZIP
 *  and Drive backups carry. A writer declares only its own version. */
export const CURRENT_CLOUD_SCHEMA = 1
export const MAX_CLOUD_SCHEMA = 2147483647
/** `dashboards.write_rev` is capped here and in SQL so JSON never rounds it. */
export const MAX_WRITE_REV = Number.MAX_SAFE_INTEGER
/** The first cloud contract that understands Research (T4) data. */
export const RESEARCH_CLOUD_SCHEMA = 2
export const KNOWN_WORKSPACE_KEYS: (keyof AppData)[] = [
  'profile', 'goals', 'courses', 'requirements', 'experiences', 'experienceHourEntries', 'tasks', 'timelineMilestones',
  'persons', 'organizations', 'academics', 'letters', 'stories', 'secondaries', 'interviewQs', 'mcat', 'schools',
  'resources', 'tips', 'focusTargets', 'quarterlyGoals', 'advisingQs', 'captures', 'notePages', 'orgs', 'notes', 'settings', 'meta', 'trash',
]
const known = new Set<string>([...KNOWN_WORKSPACE_KEYS, '_schema'])
export class WorkspaceSchemaError extends Error {
  constructor(message: string) { super(message); this.name = 'WorkspaceSchemaError' }
}
const NEWER_APP = 'This workspace needs a newer version of Premed OS. Your original data was kept. Export it for recovery, then reopen the current app before editing.'
export const isCloudSchema = (value: unknown): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= MAX_CLOUD_SCHEMA
export const isWriteRev = (value: unknown): value is number =>
  typeof value === 'number' && Number.isSafeInteger(value) && value >= 1 && value <= MAX_WRITE_REV

/** The portable marker, or null for a legacy (unmarked) document. Never guesses. */
export function logicalSchema(input: unknown): number | null {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new WorkspaceSchemaError('Workspace data must be a JSON object.')
  if (!Object.hasOwn(input, '_schema')) return null
  const marker = (input as Record<string, unknown>)._schema
  if (!isCloudSchema(marker)) throw new WorkspaceSchemaError('This workspace has an invalid schema version. Its original data was kept for recovery.')
  return marker
}

const RESEARCH_COLLECTIONS = ['researchUpcomingItems', 'researchReminders', 'researchTimelineNotes', 'researchMemberships']
// Nested fields Research (T4) added inside collections this app already edits.
const RESEARCH_FIELDS: Record<string, string[]> = {
  experiences: ['research', 'estimatedHoursDeletedAt'],
  experienceHourEntries: ['thoughts', 'parentDeletedAt'],
  persons: ['bio'],
}
const hasResearchField = (collection: unknown, row: unknown) =>
  typeof collection === 'string' && !!row && typeof row === 'object'
  && (RESEARCH_FIELDS[collection] ?? []).some(field => Object.hasOwn(row, field))

/** Bounded to the evidenced T4 signatures: the four Research collections and
 *  T4's nested fields, in live collections, Trash and the recovery stack.
 *  It is not a general version-inference system; anything it cannot see is
 *  left to the marker and column gates. */
export function hasResearchSignatures(input: Record<string, unknown>): boolean {
  if (RESEARCH_COLLECTIONS.some(key => Object.hasOwn(input, key))) return true
  for (const collection of Object.keys(RESEARCH_FIELDS)) {
    const rows = input[collection]
    if (Array.isArray(rows) && rows.some(row => hasResearchField(collection, row))) return true
  }
  const trash = input.trash
  if (Array.isArray(trash) && trash.some(entry => entry && typeof entry === 'object'
    && (RESEARCH_COLLECTIONS.includes(entry.collection) || hasResearchField(entry.collection, entry.record)))) return true
  const recovery = (input.meta as { recoveryStack?: unknown } | undefined)?.recoveryStack
  return Array.isArray(recovery) && recovery.some(entry => entry && typeof entry === 'object'
    && (RESEARCH_COLLECTIONS.includes(entry.collection)
      || [entry.before, entry.after].some(rows => Array.isArray(rows) && rows.some(row => hasResearchField(entry.collection, row)))))
}

/** The portable gate. It runs before hydration, migration, snapshot rebuilds,
 *  import and restore, so an older app never rebuilds data it cannot represent. */
export function assertSupportedWorkspace(input: unknown): asserts input is AppData {
  const marker = logicalSchema(input)
  if (marker !== null && marker > CURRENT_CLOUD_SCHEMA) throw new WorkspaceSchemaError(NEWER_APP)
  if (CURRENT_CLOUD_SCHEMA < RESEARCH_CLOUD_SCHEMA && hasResearchSignatures(input as Record<string, unknown>)) {
    throw new WorkspaceSchemaError('This workspace contains Research data that needs a newer version of Premed OS. Your original data was kept. Export it for recovery, then reopen the current app before editing.')
  }
}
export function opaqueWorkspaceData(input: AppData): Record<string, unknown> {
  return Object.fromEntries(Object.entries(input).filter(([key]) => !known.has(key)))
}
export function knownWorkspaceData(input: AppData): AppData {
  return Object.fromEntries(KNOWN_WORKSPACE_KEYS.filter(key => Object.hasOwn(input, key)).map(key => [key, input[key]])) as unknown as AppData
}
/** Adds or upgrades the portable marker. Never lowers one: a higher marker is rejected first. */
export function prepareWorkspaceData(input: AppData): AppData {
  assertSupportedWorkspace(input)
  return { ...input, _schema: CURRENT_CLOUD_SCHEMA } as AppData
}
/** Unknown sections cannot be removed by restoring a backup or clearing known data. */
export function mergeRestoredWorkspace(current: AppData, incoming: AppData): AppData {
  assertSupportedWorkspace(current)
  assertSupportedWorkspace(incoming)
  return prepareWorkspaceData({ ...opaqueWorkspaceData(current), ...incoming } as AppData)
}

/** Server row metadata. `null` is an unclaimed (legacy) row: both columns NULL. */
export type CloudClaim = { cloudSchema: number; writeRev: number }
export function cloudClaim(row: { cloud_schema?: unknown; write_rev?: unknown }): CloudClaim | null {
  if (!Object.hasOwn(row, 'cloud_schema') || !Object.hasOwn(row, 'write_rev')) throw new CloudColumnsMissingError()
  const { cloud_schema: cloudSchema, write_rev: writeRev } = row
  if (cloudSchema === null && writeRev === null) return null
  if (isCloudSchema(cloudSchema) && isWriteRev(writeRev)) return { cloudSchema, writeRev }
  throw new WorkspaceSchemaError('The cloud copy has invalid version metadata. Nothing was changed. Export your work, then reopen Premed OS.')
}

/** Column and marker cases (S1 item 11):
 *  - unclaimed + no marker: legacy candidate (the portable gate still runs)
 *  - unclaimed + supported marker: unclaimed versioned data
 *  - claimed: the marker must be present, valid and equal to `cloud_schema`;
 *    a missing marker never makes a claimed row legacy.
 *  A future version in either place blocks. */
export function assertSupportedRemote(data: unknown, claim: CloudClaim | null): asserts data is AppData {
  if (claim) {
    if (claim.cloudSchema > CURRENT_CLOUD_SCHEMA) throw new WorkspaceSchemaError(NEWER_APP)
    const marker = logicalSchema(data)
    if (marker !== null && marker > CURRENT_CLOUD_SCHEMA) throw new WorkspaceSchemaError(NEWER_APP)
    if (marker !== claim.cloudSchema) throw new WorkspaceSchemaError('The cloud copy’s version markers disagree. Nothing was changed. Export your work, then reopen Premed OS.')
  }
  assertSupportedWorkspace(data)
}

function matches(error: unknown, test: (value: { code?: unknown; details?: unknown; message?: unknown }) => boolean, seen = new Set<unknown>()): boolean {
  if (!error || typeof error !== 'object' || seen.has(error)) return false
  seen.add(error)
  const value = error as { code?: unknown; details?: unknown; message?: unknown; cause?: unknown }
  return test(value) || matches(value.cause, test, seen)
}
export function isSchemaGuardError(error: unknown): boolean {
  return matches(error, value => value.code === 'P0001' && value.details === 'S1_SCHEMA_GUARD')
}
/** The S1 columns are absent (migration not applied) or PostgREST's schema cache is stale. */
export class CloudColumnsMissingError extends Error {
  constructor() { super('Cloud sync is paused: the server has not been updated for this version of Premed OS yet. Your changes are saved on this device.'); this.name = 'CloudColumnsMissingError' }
}
export function isMissingCloudColumnsError(error: unknown): boolean {
  return error instanceof CloudColumnsMissingError || matches(error, value =>
    value instanceof CloudColumnsMissingError
    || ((value.code === '42703' || value.code === 'PGRST204') && typeof value.message === 'string' && /cloud_schema|write_rev/.test(value.message)))
}

// Local namespace fence; rejected raw data stays in its existing durable record.
const blockedLocalSchemas = new Map<string, string>()
export function retainLocalSchemaBlock(key: string, error: unknown) {
  if (error instanceof WorkspaceSchemaError) blockedLocalSchemas.set(key, error.message)
}
export function localSchemaBlock(key: string) { return blockedLocalSchemas.get(key) }
