import catalogSnapshot from '@/data/uncCourseCatalog.generated.json'

export type UncCourseLevel = 'undergraduate' | 'advanced-undergraduate-graduate' | 'graduate' | 'other'

export interface UncCatalogCourse {
  code: string
  subjectCode: string
  subjectName: string
  number: string
  title: string
  description: string
  creditText: string
  minCredits?: number
  maxCredits?: number
  variableCredits: boolean
  level: UncCourseLevel
  attributes: string[]
  requisites?: string
  repeatRules?: string
  gradingStatus?: string
  sourceUrl: string
}

export interface UncCatalogSubject {
  subjectCode: string
  subjectName: string
  sourceUrl: string
}

export interface UncCatalogSearchOptions {
  query?: string
  subjectCode?: string
  number?: string
  attribute?: string
  minCredits?: number
  maxCredits?: number
  level?: UncCourseLevel | 'all'
  codes?: ReadonlySet<string>
  limit?: number
}

export const UNC_COURSE_CATALOG_META = catalogSnapshot.meta
export const UNC_COURSE_CATALOG_SUBJECTS = catalogSnapshot.subjects as UncCatalogSubject[]
export const UNC_COURSE_CATALOG = catalogSnapshot.courses as UncCatalogCourse[]
export const UNC_COURSE_CATALOG_BY_CODE = new Map(UNC_COURSE_CATALOG.map((course) => [course.code, course]))

/** Student-facing names for the catalog attributes used by UNC's current
 * IDEAs in Action and general-education catalog filters. The snapshot stores
 * compact official codes; the picker should not make students decipher them. */
export const UNC_CATALOG_REQUIREMENTS = [
  { value: 'FY-SEMINAR', label: 'IDEAs · First-Year Seminar' },
  { value: 'FY-LAUNCH', label: 'IDEAs · First-Year Launch' },
  { value: 'FY-WRITING', label: 'IDEAs · Writing at the Research University' },
  { value: 'FY-DATA', label: 'IDEAs · Data Literacy' },
  { value: 'FY-THRIVE', label: 'IDEAs · College Thriving' },
  { value: 'GLBL-LANG', label: 'IDEAs · Global Language' },
  { value: 'FC-AESTH', label: 'IDEAs · Aesthetic and Interpretive Analysis' },
  { value: 'FC-CREATE', label: 'IDEAs · Creative Expression' },
  { value: 'FC-PAST', label: 'IDEAs · Engagement with the Human Past' },
  { value: 'FC-VALUES', label: 'IDEAs · Ethical and Civic Values' },
  { value: 'FC-GLOBAL', label: 'IDEAs · Global Understanding and Engagement' },
  { value: 'FC-NATSCI', label: 'IDEAs · Natural Scientific Investigation' },
  { value: 'FC-POWER', label: 'IDEAs · Power and Society' },
  { value: 'FC-QUANT', label: 'IDEAs · Quantitative Reasoning' },
  { value: 'FC-KNOWING', label: 'IDEAs · Ways of Knowing' },
  { value: 'FC-LAB', label: 'IDEAs · Empirical Investigation Lab' },
  { value: 'RESEARCH', label: 'IDEAs · Research and Discovery' },
  { value: 'COMMBEYOND', label: 'IDEAs · Communication Beyond Carolina' },
  { value: 'INTERDISCI', label: 'IDEAs · Interdisciplinary' },
  { value: 'LIFE-FIT', label: 'IDEAs · Lifetime Fitness' },
  { value: 'FAD', label: 'IDEAs · Foundations of American Democracy' },
  { value: 'HI-GENERAL', label: 'High-impact experience · General' },
  { value: 'HI-ABROAD', label: 'High-impact experience · Study Abroad' },
  { value: 'HI-COIL', label: 'High-impact experience · COIL' },
  { value: 'HI-INTERN', label: 'High-impact experience · Internship' },
  { value: 'HI-LEARNTA', label: 'High-impact experience · Learning Assistant' },
  { value: 'HI-PERFORM', label: 'High-impact experience · Performance' },
  { value: 'HI-SERVICE', label: 'High-impact experience · Service' },
] as const

function normalize(value: string) {
  return value.trim().replace(/\s+/g, ' ').toLocaleLowerCase()
}

export function uncCatalogCourse(code: string) {
  return UNC_COURSE_CATALOG_BY_CODE.get(code.trim().replace(/\s+/g, ' ').toUpperCase())
}

export function uncCatalogAttributes() {
  return [...new Set(UNC_COURSE_CATALOG.flatMap((course) => course.attributes))].sort()
}

export function catalogCourseHasRequirement(attributes: readonly string[], requirement: string) {
  const target = requirement.trim().toLocaleUpperCase()
  if (!target) return true
  return attributes.some((attribute) => attribute
    .toLocaleUpperCase()
    .split(/\s+OR\s+/)
    .some((code) => code.replace(/\s+\(.*$/, '').trim() === target))
}

export function searchUncCourseCatalog(options: UncCatalogSearchOptions = {}) {
  const query = normalize(options.query ?? '')
  const number = normalize(options.number ?? '')
  const attribute = normalize(options.attribute ?? '')
  const limit = Math.max(1, Math.min(options.limit ?? 100, 500))

  return UNC_COURSE_CATALOG.filter((course) => {
    if (options.subjectCode && course.subjectCode !== options.subjectCode) return false
    if (options.level && options.level !== 'all' && course.level !== options.level) return false
    if (options.codes && !options.codes.has(course.code)) return false
    if (number && !normalize(course.number).includes(number)) return false
    if (attribute && !catalogCourseHasRequirement(course.attributes, attribute)) return false
    if (options.minCredits != null && (course.maxCredits == null || course.maxCredits < options.minCredits)) return false
    if (options.maxCredits != null && (course.minCredits == null || course.minCredits > options.maxCredits)) return false
    if (!query) return true
    return normalize(`${course.code} ${course.title} ${course.description} ${course.subjectName} ${course.attributes.join(' ')}`).includes(query)
  }).slice(0, limit)
}

export function fixedCatalogCredits(course: UncCatalogCourse) {
  return course.minCredits != null && course.minCredits === course.maxCredits ? course.minCredits : undefined
}

export function catalogCreditChoiceIsValid(course: UncCatalogCourse, credits: number) {
  if (!Number.isFinite(credits) || credits <= 0 || course.minCredits == null || course.maxCredits == null) return false
  return credits >= course.minCredits && credits <= course.maxCredits
}
