import type { AppData } from '@/lib/types'

/**
 * v27 creates the five additive homes used by Academics' evidence, assessment,
 * canvas, and transcript records.  It also preserves old mistake rows while
 * replacing the imprecise legacy `blanked` label with the locked taxonomy.
 */
export function migrateAcademicsEvidenceV27(data: AppData): AppData {
  const center = data.academics?.classCenter
  if (!center) return data

  const mistakes = center.mistakes.map((mistake) => (
    mistake.cause === ('blanked' as string)
      ? { ...mistake, cause: 'knew-it-but-blanked' as const }
      : mistake
  ))
  const hasLegacyBlanked = mistakes.some((mistake, index) => mistake !== center.mistakes[index])
  const needsHomes = !Array.isArray(center.professorEvidence)
    || !Array.isArray(center.conceptCanvases)
    || !Array.isArray(center.assessmentMaterials)
    || !Array.isArray(center.assessmentAttempts)
    || !Array.isArray(center.transcriptRecords)
  if (!hasLegacyBlanked && !needsHomes) return data

  return {
    ...data,
    academics: {
      ...data.academics,
      classCenter: {
        ...center,
        mistakes,
        professorEvidence: Array.isArray(center.professorEvidence) ? center.professorEvidence : [],
        conceptCanvases: Array.isArray(center.conceptCanvases) ? center.conceptCanvases : [],
        assessmentMaterials: Array.isArray(center.assessmentMaterials) ? center.assessmentMaterials : [],
        assessmentAttempts: Array.isArray(center.assessmentAttempts) ? center.assessmentAttempts : [],
        transcriptRecords: Array.isArray(center.transcriptRecords) ? center.transcriptRecords : [],
      },
    },
  }
}
