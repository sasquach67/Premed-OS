import { readLocalBlob } from '@/lib/localBlobStore'
import type { AcademicFile } from '@/lib/types'
import type { StudySourceImageInput } from '@/lib/intelligence/studyTools'

export const MAX_QUESTION_BANK_VISUAL_SOURCES = 24
const TARGET_IMAGE_BYTES = 260_000
const MAX_VISUAL_SOURCE_BYTES = 4_500_000
const SUPPORTED_IMAGE = /^image\/(?:png|jpe?g|webp)$/i

export interface QuestionBankVisualPreparation {
  sources: StudySourceImageInput[]
  skippedFileIds: string[]
}

export function isQuestionBankVisualFile(file: AcademicFile) {
  return Boolean(file.blobRef && file.mimeType && SUPPORTED_IMAGE.test(file.mimeType))
}

function priority(file: AcademicFile) {
  const label = `${file.fileName ?? ''} ${file.title}`.toLowerCase()
  if (file.type === 'reading' || /textbook|chapter|reading/.test(label)) return 0
  if (file.type === 'lecture-slides' || /lecture|slide|deck/.test(label)) return 1
  if (/worksheet|question|practice|problem|quiz|exam/.test(label)) return 2
  return 3
}

/** Textbook pages are considered first, but every returned image still has to
 * be selected by the student and tied to a readable source file. */
export function questionBankVisualCandidates(files: readonly AcademicFile[]) {
  return files
    .filter(isQuestionBankVisualFile)
    .map((file, index) => ({ file, index }))
    .sort((left, right) => priority(left.file) - priority(right.file) || left.index - right.index)
    .slice(0, MAX_QUESTION_BANK_VISUAL_SOURCES)
    .map(({ file }) => file)
}

async function blobBase64(blob: Blob) {
  const bytes = new Uint8Array(await blob.arrayBuffer())
  let binary = ''
  for (let offset = 0; offset < bytes.length; offset += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000))
  }
  return btoa(binary)
}

async function canvasBlob(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality))
}

async function compressedImage(blob: Blob): Promise<Blob | null> {
  if (blob.size <= TARGET_IMAGE_BYTES && SUPPORTED_IMAGE.test(blob.type)) return blob
  if (typeof document === 'undefined' || typeof createImageBitmap !== 'function') return null
  const bitmap = await createImageBitmap(blob)
  try {
    let candidate: Blob | null = null
    for (const [maxEdge, quality] of [[1600, 0.76], [1280, 0.66], [1024, 0.56]] as const) {
      const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.max(1, Math.round(bitmap.width * scale))
      canvas.height = Math.max(1, Math.round(bitmap.height * scale))
      const context = canvas.getContext('2d')
      if (!context) return null
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
      candidate = await canvasBlob(canvas, quality)
      if (candidate && candidate.size <= TARGET_IMAGE_BYTES) return candidate
    }
    return candidate
  } finally {
    bitmap.close()
  }
}

/** Build temporary, bounded image inputs for Claude. These derivatives are
 * sent only with the generation request; they are never added to app state or
 * the server source mirror. */
export async function prepareQuestionBankVisualSources(files: readonly AcademicFile[]): Promise<QuestionBankVisualPreparation> {
  const sources: StudySourceImageInput[] = []
  const skippedFileIds: string[] = []
  let totalBytes = 0

  for (const file of questionBankVisualCandidates(files)) {
    const local = file.blobRef ? await readLocalBlob(file.blobRef) : undefined
    if (!local) {
      skippedFileIds.push(file.id)
      continue
    }
    try {
      const prepared = await compressedImage(local)
      if (!prepared || totalBytes + prepared.size > MAX_VISUAL_SOURCE_BYTES) {
        skippedFileIds.push(file.id)
        continue
      }
      sources.push({
        fileId: file.id,
        title: file.fileName ?? file.title,
        mimeType: prepared.type || file.mimeType || 'image/jpeg',
        size: prepared.size,
        dataBase64: await blobBase64(prepared),
      })
      totalBytes += prepared.size
    } catch {
      skippedFileIds.push(file.id)
    }
  }
  return { sources, skippedFileIds }
}
