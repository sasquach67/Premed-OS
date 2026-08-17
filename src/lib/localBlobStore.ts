import { del, get, set } from 'idb-keyval'

/**
 * Device-local binary storage. Persisted app state retains only a `blobRef`;
 * bytes never enter Zustand, localStorage, JSON export, or remote sync.
 */
export async function retainLocalBlob(blobRef: string, blob: Blob): Promise<string> {
  await set(blobRef, blob)
  return blobRef
}

export async function readLocalBlob(blobRef: string): Promise<Blob | undefined> {
  const value = await get<Blob>(blobRef)
  return value instanceof Blob ? value : undefined
}

export async function hasLocalBlob(blobRef: string): Promise<boolean> {
  return (await readLocalBlob(blobRef)) !== undefined
}

/** Safe to repeat; a missing device-local blob is already gone. */
export async function removeLocalBlob(blobRef: string): Promise<void> {
  await del(blobRef)
}
