// @vitest-environment node
import { webcrypto } from 'node:crypto'
import { beforeAll, expect, it, vi } from 'vitest'
import { notebookHistoryRetentionNote, retainNotebookVersion, notebookStateKey } from './revision'
import { restoreNotebookVersion } from './import'
import { parseNotebookPackage } from './package'
import { assertNotebookBackupFits, exportNotebookBackupBundle, prepareNotebookBundle } from './notebookBundle'
import { prepareNotebookAssets, getPreparedAssetBytes } from './visualAssets'
import { headerDecoder, MemoryNotebookAssets, plainVisualFixture, pngBlob, visualFixture } from './visual.test-fixtures'
import type { ImportedNotebook } from './types'
import type { LectureRecord } from '@/lib/types'
beforeAll(()=>vi.stubGlobal('crypto',webcrypto))
it('retains the original snapshot plus the latest ten versions, exact notes, and restorable kept images',async()=>{
 const original=plainVisualFixture(), raw=JSON.stringify(original), repo=new MemoryNotebookAssets()
 const n:ImportedNotebook={original:structuredClone(original),current:structuredClone(original),originalRaw:raw,entryId:original.entries[0].id,fingerprint:'retention-fixture',importedAt:1,notes:'Original personal note',progress:{'old-answer':{response:'Original response',complete:true}},history:[],assetBindings:[]}
 const originalNotes=structuredClone(n.progress)
 repo.bytes.set('unreferenced-physical-bytes',pngBlob())
 retainNotebookVersion(n,'edit',2)
 const ids=new Map<number,string>()
 for(let i=1;i<=15;i++){
  const p=visualFixture(), old=p.assets[0].id, id=`history-image-${i}`
  const next=parseNotebookPackage(JSON.stringify(p).replaceAll(`"${old}"`,`"${id}"`))
  const prepared=await prepareNotebookAssets(next as ReturnType<typeof visualFixture>,[{name:p.assets[0].fileName,blob:pngBlob()}],{decode:headerDecoder})
  n.current=next;n.acceptedRaw=JSON.stringify(next);n.notes=`Note ${i}`;n.progress={answer:{response:`Response ${i}`,complete:true}}
  n.assetBindings!.push(...prepared.bindings)
  for(const [hash,blob] of getPreparedAssetBytes(prepared))repo.bytes.set(hash,blob)
  retainNotebookVersion(n,'edit',i+2);ids.set(i,n.history!.at(-1)!.id)
 }
 expect(n.original).toEqual(original);expect(n.originalRaw).toBe(raw)
 expect(n.history).toHaveLength(11)
 expect(n.history![0].current).toEqual(original);expect(n.history![0].notes).toBe('Original personal note');expect(n.history![0].progress).toEqual(originalNotes)
 expect(n.history!.slice(1).map(v=>v.id)).toEqual([...ids].filter(([i])=>i>=6).map(([,id])=>id))
 expect(n.assetBindings!.map(b=>b.assetId)).toEqual(Array.from({length:10},(_,i)=>`history-image-${i+6}`))
 expect(notebookHistoryRetentionNote(n)).toContain('original and latest 10')
 expect(()=>assertNotebookBackupFits(n as never,'retention-course')).not.toThrow()
 const backup=await prepareNotebookBundle(await exportNotebookBackupBundle(n as never,'retention-course',repo,headerDecoder),headerDecoder)
 expect(backup.kind).toBe('backup')
 if(backup.kind==='backup')expect(backup.notebook.history).toHaveLength(11)
 // The oldest non-original snapshot is evicted by the restore's new history
 // entry, but its unique image must survive because it becomes current.
 const oldest = n.history![1], oldestAsset = oldest.current.version === 2 ? '' : oldest.current.assets[0].id
 const oldestLecture = {id:'oldest-local',courseId:'retention-course',importedNotebook:structuredClone(n),title:n.current.entries[0].title} as LectureRecord
 restoreNotebookVersion(oldestLecture,oldest.id,notebookStateKey(oldestLecture.importedNotebook!),99)
 const oldestRestored = oldestLecture.importedNotebook!
 expect(oldestRestored.current).toEqual(oldest.current)
 expect(oldestRestored.history!.some(version=>version.id===oldest.id)).toBe(false)
 expect(oldestRestored.assetBindings!.some(binding=>binding.assetId===oldestAsset)).toBe(true)
 expect(()=>assertNotebookBackupFits(oldestRestored as never,'retention-course')).not.toThrow()
 const oldestBackup = await prepareNotebookBundle(await exportNotebookBackupBundle(oldestRestored as never,'retention-course',repo,headerDecoder),headerDecoder)
 expect(oldestBackup.kind).toBe('backup')
 const lecture={id:'retention-local',courseId:'retention-course',importedNotebook:n,title:n.current.entries[0].title} as LectureRecord
 restoreNotebookVersion(lecture,n.history![0].id,notebookStateKey(n),100)
 const restored=lecture.importedNotebook!
 expect(restored.current).toEqual(original);expect(restored.notes).toBe('Original personal note');expect(restored.progress).toEqual(originalNotes)
 expect(restored.history).toHaveLength(11)
 expect(()=>assertNotebookBackupFits(restored as never,'retention-course')).not.toThrow()
 expect(repo.bytes.size).toBe(2) // Retention never purges physical bytes, including unrelated stored assets.
})
it('does not fabricate an original saved snapshot when imported history starts later',()=>{
 const original=plainVisualFixture(),later=structuredClone(original);later.entries[0].title='Later wording'
 const n={original,current:later,originalRaw:JSON.stringify(original),entryId:original.entries[0].id,notes:'Later note',progress:{},history:[],fingerprint:'later',importedAt:1} as ImportedNotebook
 for(let i=0;i<15;i++)retainNotebookVersion(n,'edit',i)
 expect(n.history).toHaveLength(10);expect(n.original).toEqual(original)
 expect(n.history!.every(v=>v.current.entries[0].title==='Later wording')).toBe(true)
})
