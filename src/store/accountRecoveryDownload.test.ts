import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { strFromU8, unzipSync } from 'fflate'
const state = vi.hoisted(() => ({ id: 'synthetic', owner: { key: 'hq:app-data:account:synthetic', epoch: 1 }, copies: [] as Array<{workspaceKey:string;id:string;stored:string;sha256:string}>, afterList: undefined as (() => void) | undefined }))
vi.mock('./store', () => ({ captureWorkspaceIdentity: () => ({ ...state.owner }) }))
vi.mock('./accountSyncSafety', () => ({ captureSyncSession: () => ({id:state.id}), assertSyncSession: (token:{id:string}) => { if(token.id!==state.id) throw new Error('session changed') }, syncDigest: async (text:string) => `digest:${text}` }))
vi.mock('./workspaceRecoveryRepository', () => ({ workspaceRecoveryRepository: () => ({ list: async (key:string) => { const result=state.copies.filter(c=>c.workspaceKey===key); state.afterList?.(); return result } }) }))
import { accountRecoveryDownload } from './accountRecoveryDownload'
const create = vi.fn((_blob: Blob)=>'blob:synthetic'), click=vi.fn()
beforeEach(()=> {
 state.id='synthetic'; state.owner={key:'hq:app-data:account:synthetic',epoch:1}; state.afterList=undefined
 const stored=JSON.stringify({state:{notes:{example:'recover this'}}})
 state.copies=[{workspaceKey:state.owner.key+':sync-conflict:cloud',id:'one',stored,sha256:`digest:${JSON.stringify(stored)}`}]
 vi.stubGlobal('URL', {createObjectURL:create,revokeObjectURL:vi.fn()}); create.mockClear();click.mockClear()
 vi.spyOn(HTMLAnchorElement.prototype,'click').mockImplementation(click)
})
it('verifies and downloads only this active account’s recovery copies', async()=> {
 state.copies.push({workspaceKey:'hq:app-data:account:other:sync-conflict:cloud',id:'other',stored:'private',sha256:'invalid'})
 await accountRecoveryDownload('synthetic');expect(create).toHaveBeenCalledTimes(1);expect(click).toHaveBeenCalledTimes(1)
 const buffer = await new Promise<ArrayBuffer>((resolve, reject) => {
   const reader=new FileReader();reader.onload=()=>resolve(reader.result as ArrayBuffer);reader.onerror=()=>reject(reader.error);reader.readAsArrayBuffer(create.mock.calls[0][0])
 })
 const files=unzipSync(new Uint8Array(buffer))
 const portable=Object.entries(files).find(([name])=>name.endsWith('/account.json'))!
 expect(JSON.parse(strFromU8(portable[1]))).toEqual({notes:{example:'recover this'}})
 expect(Object.keys(files).some(name=>name.endsWith('/exact-cache.txt'))).toBe(true)
 expect(strFromU8(files['README.txt'])).toContain('not original image')
})
it('does not download a corrupt recovery snapshot',async()=> { state.copies[0].sha256='corrupt'; await expect(accountRecoveryDownload('synthetic')).rejects.toThrow('could not be verified');expect(click).not.toHaveBeenCalled() })
it('does not download when the account changes during the read',async()=> { state.afterList=()=>{state.id='other'};await expect(accountRecoveryDownload('synthetic')).rejects.toThrow('session changed');expect(click).not.toHaveBeenCalled() })

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals() })
