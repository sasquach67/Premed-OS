import { retainLocalBlob } from '@/lib/localBlobStore'

/** Keeps the local original immediately. Account sync separately uploads academic
 * originals to private Storage; the dashboard retains only this stable reference. */
export async function retainLocalMaterial(file: File, fileId: string) {
  const blobRef = `idb://academics/material/${fileId}`
  return retainLocalBlob(blobRef, file)
}
