import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/common/useToast'
import { activeWorkspaceOwner, isDemoMode } from '@/lib/demoMode'
import { syncAcademicOriginals } from '@/lib/academics/sharedMaterialFiles'

export function SyncOriginalFilesButton({ files }: { files: readonly { blobRef?: string }[] }) {
  const [busy, setBusy] = useState(false)
  const toast = useToast()
  if (isDemoMode() || activeWorkspaceOwner().kind !== 'account' || !files.some(file => file.blobRef)) return null
  async function sync() {
    setBusy(true)
    try {
      const result = await syncAcademicOriginals(files)
      toast({ title: result.missing ? 'Some originals need your browser copy' : 'Original files available across browsers', description: `${result.uploaded} uploaded; ${result.available} already available.${result.missing ? ` ${result.missing} missing. Run Sync originals in the browser where you uploaded them, or add the original files again.` : ' Sign in to this account in another browser to open them.'}` })
    } catch (error) {
      toast({ title: 'Could not sync original files', description: error instanceof Error ? error.message : 'Try again when your connection is restored.' })
    } finally { setBusy(false) }
  }
  return <Button variant="outline" size="sm" disabled={busy} onClick={() => void sync()}>{busy ? 'Syncing originals…' : 'Sync originals'}</Button>
}
