import { retainLocalBlob } from '@/lib/localBlobStore'

/**
 * Keeps a student-added course material on this device only.
 *
 * Deliberately the same mechanism as `retainLocalSyllabus` — one retention
 * path, one namespace shape, no cloud storage claim. The persisted record
 * holds only the `blobRef`; the bytes never enter Zustand, localStorage,
 * export, or sync.
 */
export async function retainLocalMaterial(file: File, fileId: string) {
  const blobRef = `idb://academics/material/${fileId}`
  return retainLocalBlob(blobRef, file)
}
