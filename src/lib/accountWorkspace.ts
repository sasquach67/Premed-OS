import { createPersonalInitialData } from '@/data/personalInitialData'
import type { AppData } from '@/lib/types'

export interface AccountIdentity {
  email?: string | null
  metadata?: Record<string, unknown> | null
}

export interface FirstLoginSetup {
  name: string
  school: string
  major: string
  classYear: string
  track?: string
}

export type CloudReconcileDecision = 'requires-setup' | 'pull-remote' | 'push-local'

export const ACCOUNT_WORKSPACE_READY_EVENT = 'premed-hq:account-workspace-ready'
export const FIRST_LOGIN_STUDY_ROUTE = '/academics?mode=daily&tab=class-center&studyGuide=open'

/** First login ends in the practical lecture-capture guide, after any merge review. */
export function destinationAfterFirstLogin(isFirstLogin: boolean, fallback: string) {
  return isFirstLogin ? FIRST_LOGIN_STUDY_ROUTE : fallback
}

/** Unlock cloud sync only after setup or a reviewed merge is fully saved. */
export function notifyAccountWorkspaceReady(userId: string) {
  window.dispatchEvent(new CustomEvent(ACCOUNT_WORKSPACE_READY_EVENT, { detail: { userId } }))
}

/** A missing account snapshot is never permission to upload the open browser. */
export function decideCloudReconcile(input: {
  hasRemote: boolean
  knownAt: number
  remoteAt: number
}): CloudReconcileDecision {
  if (!input.hasRemote) return 'requires-setup'
  return input.knownAt === 0 || input.remoteAt > input.knownAt ? 'pull-remote' : 'push-local'
}

function stringMetadata(metadata: Record<string, unknown> | null | undefined, key: string) {
  const value = metadata?.[key]
  return typeof value === 'string' ? value.trim() : ''
}

function nameFromEmail(email: string) {
  const local = email.split('@')[0] ?? ''
  return local
    .replace(/[._+-]+/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

/** OAuth metadata is a display hint only; it is never an authorization input. */
export function profileDefaultsFromIdentity(identity: AccountIdentity) {
  const email = identity.email?.trim() ?? ''
  const metadata = identity.metadata
  const name = (
    stringMetadata(metadata, 'full_name')
    || stringMetadata(metadata, 'name')
    || stringMetadata(metadata, 'display_name')
    || stringMetadata(metadata, 'preferred_username')
    || nameFromEmail(email)
  )
  return { name, email }
}

/**
 * The only factory allowed to create the first cloud snapshot for an account.
 * There is deliberately no local-workspace argument: first login starts from
 * a record-free root, then device data can be reviewed separately.
 */
export function buildFirstAccountWorkspace(input: {
  identity: AccountIdentity
  setup: FirstLoginSetup
}): AppData {
  const data = createPersonalInitialData()
  const identity = profileDefaultsFromIdentity(input.identity)
  data.profile = {
    ...data.profile,
    name: input.setup.name.trim(),
    email: identity.email,
    school: input.setup.school.trim(),
    major: input.setup.major.trim(),
    classYear: input.setup.classYear.trim(),
    track: input.setup.track?.trim() || 'Pre-Med',
  }
  return data
}

export function decideAccountRoute(input: {
  pathname: string
  hasRemote: boolean
  hasLocalWork: boolean
  hasSeenMerge: boolean
}): '/auth/setup' | '/auth/merge' | '/' | null {
  if (!input.hasRemote) return input.pathname === '/auth/setup' ? null : '/auth/setup'
  if (input.hasLocalWork && !input.hasSeenMerge) {
    return input.pathname === '/auth/merge' ? null : '/auth/merge'
  }
  if (input.pathname === '/auth/setup' || input.pathname === '/auth/merge') return '/'
  return null
}
