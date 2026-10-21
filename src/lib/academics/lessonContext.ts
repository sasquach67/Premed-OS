import type { ClassFolderSetup, SyllabusScheduleEntry } from '@/lib/types'
import { aiSaveLocation, readingFolderName } from './classFolder'
import { buildLessons } from './lessonGroups'

/**
 * What a new notebook is for, when it starts from a lesson or a reading on
 * Class days or the Lessons tab (glue after PR #41, Oct 2026).
 */
export interface NotebookTarget {
  lesson?: number
  readingKey?: string
  /** "Lesson 10 — Human Development Across the Lifespan", or the reading's title. */
  label: string
  /** The lesson or reading title alone, for the folder name. */
  title?: string
}

export function lessonTarget(schedule: SyllabusScheduleEntry[] | undefined, lesson: number): NotebookTarget {
  const row = buildLessons(schedule).find((r) => r.lesson === lesson)
  return { lesson, title: row?.title, label: `Lesson ${lesson}${row?.title ? ` — ${row.title}` : ''}` }
}

/**
 * The "Where to save" section added after a notebook or flashcard prompt.
 * Empty when there is nothing to say: no class folder and no lesson, so
 * existing prompts stay exactly as they were.
 */
export function saveLocationSection(setup: ClassFolderSetup | undefined, target: NotebookTarget | undefined, what: 'notebook' | 'deck'): string {
  if (!setup && !target) return ''
  const thing = what === 'deck' ? 'the finished .apkg deck' : 'the finished notebook folder'
  let place: string
  if (setup?.state === 'ready' && target?.readingKey) place = [setup.place === 'cloud' ? 'Cloud drive' : 'Documents', setup.name, 'premedOS', readingFolderName(target.title ?? target.label)].join(' › ')
  else place = aiSaveLocation(setup, { number: target?.lesson, title: target?.title }).path
  const lines = place === 'Downloads'
    ? [`Save ${thing} in my Downloads folder.`]
    : [`Save ${thing} in my class folder: ${place}`, 'Make that folder if it doesn’t exist. If you can’t open my class folder, save to Downloads instead and tell me where it went.']
  lines.push('Never overwrite a file that is already there; add " (2)" to the new name and tell me.')
  if (what === 'deck') lines.push('When it’s saved, tell me to double-click the .apkg (or use File › Import in Anki) to add it to Anki.')
  return `\n\n## Where to save\n${lines.join('\n')}\n`
}
