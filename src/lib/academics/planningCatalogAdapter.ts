import {
  UNC_PLANNING_LIBRARY,
  type UncPlanningRequirementSet,
} from '@/lib/academics/uncPlanningLibrary'
import {
  UNC_COURSE_CATALOG,
  UNC_COURSE_CATALOG_META,
  catalogCourseHasRequirement,
  fixedCatalogCredits,
  type UncCatalogCourse,
  type UncCourseLevel,
} from '@/lib/academics/uncCourseCatalog'

/** Published catalog facts are configured locally. Live section/enrollment
 * facts remain a separate ConnectCarolina boundary. */
export const UNC_CATALOG_INTEGRATION = {
  configured: true,
  mode: 'official-catalog-snapshot',
  catalogYear: UNC_COURSE_CATALOG_META.catalogYear,
  retrievedAt: UNC_COURSE_CATALOG_META.retrievedAt,
  owner: 'UNC Catalog',
  liveSectionsConfigured: false,
  reason: 'Published catalog facts are available locally. Current sections, instructors, seats, waitlists, holds, enrollment, transcript, and degree-audit access are not configured.',
} as const

export interface LocalCatalogCandidate extends UncCatalogCourse {
  programIds: readonly string[]
  requirementNodeIds: readonly string[]
  catalogYears: readonly string[]
  sourceUrls: readonly string[]
  retrievedAt: readonly string[]
}

export function normalizeCourseCode(value: string) {
  return value.trim().replace(/\s+/g, ' ').toUpperCase()
}

function requirementReferences(library: readonly UncPlanningRequirementSet[]) {
  const references = new Map<string, {
    programIds: Set<string>
    requirementNodeIds: Set<string>
    catalogYears: Set<string>
    sourceUrls: Set<string>
    retrievedAt: Set<string>
  }>()
  for (const requirementSet of library) {
    for (const node of requirementSet.nodes) {
      for (const rawCode of node.courseCodes ?? []) {
        const code = normalizeCourseCode(rawCode)
        if (!code) continue
        const reference = references.get(code) ?? {
          programIds: new Set<string>(), requirementNodeIds: new Set<string>(),
          catalogYears: new Set<string>(), sourceUrls: new Set<string>(), retrievedAt: new Set<string>(),
        }
        reference.programIds.add(requirementSet.id)
        reference.requirementNodeIds.add(`${requirementSet.id}:${node.id}`)
        reference.catalogYears.add(requirementSet.catalogYear)
        reference.sourceUrls.add(requirementSet.sourceUrl)
        reference.retrievedAt.add(requirementSet.retrievedAt)
        references.set(code, reference)
      }
    }
  }
  return references
}

/** Joins the official course snapshot to optional requirement relevance.
 * Published facts and requirement evidence remain separate source layers. */
export function localCatalogCandidates(
  library: readonly UncPlanningRequirementSet[] = UNC_PLANNING_LIBRARY,
): LocalCatalogCandidate[] {
  const references = requirementReferences(library)
  return UNC_COURSE_CATALOG.map((course) => {
    const reference = references.get(course.code)
    return {
      ...course,
      programIds: reference ? [...reference.programIds].sort() : [],
      requirementNodeIds: reference ? [...reference.requirementNodeIds].sort() : [],
      catalogYears: [UNC_COURSE_CATALOG_META.catalogYear],
      sourceUrls: [...new Set([course.sourceUrl, ...(reference ? [...reference.sourceUrls] : [])])],
      retrievedAt: [UNC_COURSE_CATALOG_META.retrievedAt],
    }
  })
}

export function searchLocalCatalog(
  query: string,
  options: {
    programId?: string
    subjectCode?: string
    number?: string
    attribute?: string
    minCredits?: number
    maxCredits?: number
    level?: UncCourseLevel | 'all'
    limit?: number
  } = {},
): LocalCatalogCandidate[] {
  const normalized = query.trim().toLocaleLowerCase()
  const number = options.number?.trim().toLocaleLowerCase()
  const attribute = options.attribute?.trim().toLocaleLowerCase()
  if (!normalized && !options.subjectCode && !number && !attribute && options.minCredits == null && options.maxCredits == null && (!options.level || options.level === 'all') && !options.programId) return []
  const limit = Math.max(1, Math.min(options.limit ?? 25, 500))
  return localCatalogCandidates()
    .filter((candidate) => !options.programId || candidate.programIds.includes(options.programId))
    .filter((candidate) => !options.subjectCode || candidate.subjectCode === options.subjectCode)
    .filter((candidate) => !number || candidate.number.toLocaleLowerCase().includes(number))
    .filter((candidate) => !attribute || catalogCourseHasRequirement(candidate.attributes, attribute))
    .filter((candidate) => options.minCredits == null || (candidate.maxCredits != null && candidate.maxCredits >= options.minCredits))
    .filter((candidate) => options.maxCredits == null || (candidate.minCredits != null && candidate.minCredits <= options.maxCredits))
    .filter((candidate) => !options.level || options.level === 'all' || candidate.level === options.level)
    .filter((candidate) => !normalized || `${candidate.code} ${candidate.title} ${candidate.description} ${candidate.subjectName} ${candidate.attributes.join(' ')}`.toLocaleLowerCase().includes(normalized))
    .slice(0, limit)
}

export function catalogPlanDefaults(candidate: LocalCatalogCandidate) {
  const credits = fixedCatalogCredits(candidate)
  return {
    code: candidate.code,
    title: candidate.title,
    credits,
    creditChoiceRequired: credits == null,
    catalogNote: `UNC ${UNC_COURSE_CATALOG_META.catalogYear} catalog · retrieved ${UNC_COURSE_CATALOG_META.retrievedAt} · ${candidate.sourceUrl}`,
  }
}
