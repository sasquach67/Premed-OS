import type { LectureRecord } from '@/lib/types'
import { conciseStudyGuideTitle } from './generateStudyGuide'

/** Also upgrades the display of saved guides that predate AI title storage. */
export function completedLectureTitle(position: number, lecture: Pick<LectureRecord, 'title' | 'aiTitle' | 'studyGuide'>) {
  return lectureDisplayTitle(position, lecture.title, lecture.aiTitle || (lecture.studyGuide && conciseStudyGuideTitle(lecture.studyGuide)))
}

export function lectureDisplayTitle(position: number, title: string, aiTitle?: string) {
  const number = title.match(/\b(?:lesson|lecture)\s*#?(\d+)\b/i)?.[1] ?? position
  const base = `Lesson ${number}`
  const savedTitle = (aiTitle?.trim() || title.trim())
    .replace(/^(?:(?:lesson|lecture)\s+#?\d+\s*(?:[·:—–-]\s*)?)+/i, '')
    .trim()
  return savedTitle ? `${base} — ${savedTitle}` : base
}
