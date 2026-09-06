import { del, get, set } from 'idb-keyval'

/**
 * Device-local binary storage. Persisted app state retains only a `blobRef`;
 * bytes never enter Zustand, localStorage, or JSON export. Academic originals
 * are also synced separately to private account storage.
 */
export async function retainLocalBlob(blobRef: string, blob: Blob): Promise<string> {
  await set(blobRef, blob)
  return blobRef
}

export async function readLocalBlob(blobRef: string): Promise<Blob | undefined> {
  let value: Blob | undefined
  try { value = await get<Blob>(blobRef) } catch { /* Cloud originals can still open when browser storage fails. */ }
  if (value instanceof Blob) return value
  if (!blobRef.startsWith('idb://academics/')) return undefined
  const { readSharedAcademicOriginal } = await import('@/lib/academics/sharedMaterialFiles')
  return readSharedAcademicOriginal(blobRef)
}

export async function hasLocalBlob(blobRef: string): Promise<boolean> {
  return (await readLocalBlob(blobRef)) !== undefined
}

/** Safe to repeat; a missing device-local blob is already gone. */
export async function removeLocalBlob(blobRef: string): Promise<void> {
  if (blobRef.startsWith('idb://academics/')) {
    const { removeSharedAcademicOriginal } = await import('@/lib/academics/sharedMaterialFiles')
    await removeSharedAcademicOriginal(blobRef)
  }
  await del(blobRef)
}
