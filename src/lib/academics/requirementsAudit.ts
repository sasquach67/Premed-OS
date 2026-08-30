import type { CatalogWarningAcknowledgement, RequirementItem } from '@/lib/types'

export {
  UNC_PLANNING_LIBRARY,
  UNC_PLANNING_LIBRARY_BY_ID,
  planningRequirementOutcome,
  planningRequirementSet,
} from './uncPlanningLibrary'
export type {
  RequirementEvaluation,
  RequirementNode,
  RequirementNodeKind,
  UncPlanningRequirementSet,
} from './uncPlanningLibrary'

/** Stable only for a specific local source version; a changed source resurfaces. */
export function requirementsSourceVersion(item: RequirementItem) {
  return `${item.lastVerified ?? 'undated'}|${item.sourceUrl ?? 'no-source'}`
}

export function isCatalogWarningAcknowledged(
  acknowledgements: CatalogWarningAcknowledgement[],
  item: RequirementItem,
) {
  const version = requirementsSourceVersion(item)
  return acknowledgements.some((record) => record.requirementId === item.id && record.sourceVersion === version)
}

/** Additive and pure: acknowledgement is a personal local record, never a
 * mutation of the requirement or of source verification metadata. */
export function addCatalogWarningAcknowledgements(
  acknowledgements: CatalogWarningAcknowledgement[],
  items: RequirementItem[],
  acknowledgedAt: number,
) {
  const next = [...acknowledgements]
  for (const item of items) {
    if (item.verificationStatus !== 'needs-verification' || isCatalogWarningAcknowledged(next, item)) continue
    next.push({ requirementId: item.id, sourceVersion: requirementsSourceVersion(item), acknowledgedAt })
  }
  return next
}
