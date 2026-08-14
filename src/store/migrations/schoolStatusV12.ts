import type { AppData } from '@/lib/types'

/** U-7: a decision is not a school status. Keep the record and its application fact. */
export function migrateSchoolStatusV12(data: AppData): AppData {
  const archivedAt = new Date().toISOString()
  const schools = data.schools.map((school) => school.status === ('rejected' as string)
    ? { ...school, status: 'applied' as const, archivedAt: school.archivedAt ?? archivedAt }
    : school)
  return schools.some((school, index) => school !== data.schools[index]) ? { ...data, schools } : data
}
