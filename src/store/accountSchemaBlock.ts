// Kept independent of the store/sync modules so persistence can fence edits at boot.
const blocks = new Map<string, { message: string; mutation: boolean }>()
export function getAccountSchemaBlock(id: string | null | undefined) { return id ? blocks.get(id)?.message : undefined }
export function getAccountSchemaMutationBlock(id: string | null | undefined) { return id && blocks.get(id)?.mutation ? blocks.get(id)?.message : undefined }
export function blockAccountSchema(id: string, message: string, mutation = false) {
  blocks.set(id, { message, mutation: mutation || blocks.get(id)?.mutation === true })
}
