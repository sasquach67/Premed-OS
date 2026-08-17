import { retainLocalBlob } from '@/lib/localBlobStore'

/** Keeps the original student-provided syllabus on this device only. */
export async function retainLocalSyllabus(file: File, fileId: string) {
  const blobRef = `idb://academics/syllabus/${fileId}`
  return retainLocalBlob(blobRef, file)
}
