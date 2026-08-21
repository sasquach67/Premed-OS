import { supabase } from '@/lib/supabase'
import { assembleFullLectureTranscript, validateLectureFinding } from '@/lib/academics/lectureEvidence'
import type { LectureEvidenceFinding, SourceChunk } from '@/lib/types'

export type LectureAnalysisFailure = 'unconfigured' | 'sign-in-required' | 'unavailable' | 'invalid-response'

export type LectureAnalysisOutcome =
  | { ok: true; findings: Array<Omit<LectureEvidenceFinding, 'id' | 'courseId' | 'lectureId' | 'createdAt' | 'updatedAt' | 'order'>> }
  | { ok: false; failure: LectureAnalysisFailure; message: string }

/** Analysis is student-started; it sends transcript text after disclosure, never raw audio. */
export async function analyzeLectureTranscript({ courseId, chunks }: { courseId: string; chunks: SourceChunk[] }): Promise<LectureAnalysisOutcome> {
  if (!supabase) return { ok: false, failure: 'unconfigured', message: 'Lecture analysis is not configured. Your transcript remains available locally.' }
  if (!chunks.some((chunk) => chunk.sourcePosition?.label)) {
    return { ok: false, failure: 'invalid-response', message: 'This transcript has no timestamps, so Premed OS cannot create time-linked lecture remarks.' }
  }
  const accepted = typeof window !== 'undefined' && window.confirm(
    'Analyze this complete transcript for class-specific professor remarks? The transcript text—not audio—will be sent to Premed OS’s configured AI service. Findings stay pending until you confirm them.',
  )
  if (!accepted) return { ok: false, failure: 'unavailable', message: 'Nothing was sent or changed.' }
  const { data: sessionData } = await supabase.auth.getSession()
  if (!sessionData.session) return { ok: false, failure: 'sign-in-required', message: 'Sign in to analyze a transcript. Your local lecture remains available.' }
  const { data, error } = await supabase.functions.invoke('lecture-analysis', {
    body: { courseId, segments: assembleFullLectureTranscript(chunks) },
  })
  if (error) return { ok: false, failure: 'unavailable', message: 'Lecture analysis is unavailable. Your local lecture and transcript were not changed.' }
  if (!data || !Array.isArray(data.findings)) return { ok: false, failure: 'invalid-response', message: 'The analysis response was not usable. Nothing was saved.' }
  const findings = data.findings.filter((value: unknown): value is Omit<LectureEvidenceFinding, 'id' | 'courseId' | 'lectureId' | 'createdAt' | 'updatedAt' | 'order'> => (
    Boolean(value && typeof value === 'object')
    && typeof (value as LectureEvidenceFinding).sourceChunkId === 'string'
    && typeof (value as LectureEvidenceFinding).quote === 'string'
    && typeof (value as LectureEvidenceFinding).timestamp === 'string'
    && typeof (value as LectureEvidenceFinding).label === 'string'
    && typeof (value as LectureEvidenceFinding).detail === 'string'
    && validateLectureFinding(value as LectureEvidenceFinding, chunks)
  ))
  if (findings.length !== data.findings.length) {
    return { ok: false, failure: 'invalid-response', message: 'A proposed remark did not match your exact transcript evidence. Nothing was saved.' }
  }
  return { ok: true, findings }
}
