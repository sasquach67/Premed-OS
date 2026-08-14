import { set } from 'idb-keyval'

/** Keeps the original student-provided syllabus on this device only. */
export async function retainLocalSyllabus(file: File, fileId: string) {
  const blobRef = `idb://academics/syllabus/${fileId}`
  await set(blobRef, file)
  return blobRef
}
