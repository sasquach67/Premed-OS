import { describe, expect, it } from 'vitest'
import { extractSyllabusFiles } from './syllabusParser'

function textFile(name: string, text: string) {
  const file = new File([text], name, { type: 'text/plain' })
  Object.defineProperty(file, 'text', { value: async () => text })
  return file
}

describe('multi-file syllabus reading', () => {
  it('reads every selected file in order and identifies the active file in progress', async () => {
    const messages: string[] = []
    const progressValues: number[] = []
    const proposal = await extractSyllabusFiles([
      textFile('overview.txt', 'CHEM 262\nStudent learning outcomes\nExplain aromatic substitution.'),
      textFile('schedule.txt', 'CHEM 262\nWeek 1: Aromatic substitution\nExam: October 14, 2026'),
    ], { onProgress: (progress) => {
      messages.push(progress.message)
      progressValues.push((progress as typeof progress & { overallProgress: number }).overallProgress)
    } })

    expect(proposal.sourceName).toBe('overview.txt + schedule.txt')
    expect(messages).toEqual(expect.arrayContaining([
      'File 1 of 2 · Preparing…',
      'File 2 of 2 · Preparing…',
    ]))
    expect(progressValues.every((value) => Number.isFinite(value) && value >= 0 && value <= 1)).toBe(true)
    expect(progressValues.at(-1)).toBe(1)
  })

  it('names the exact selected file that failed instead of reporting a generic batch error', async () => {
    const unsupported = new File([new Uint8Array([1, 2, 3])], 'image.heic', { type: 'application/octet-stream' })

    await expect(extractSyllabusFiles([
      textFile('overview.txt', 'CHEM 262 syllabus'),
      unsupported,
    ])).rejects.toThrow('Could not read image.heic (2 of 2)')
  })
})
