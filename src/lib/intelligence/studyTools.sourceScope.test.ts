import { readFileSync } from 'node:fs'
import ts from 'typescript'
import { describe, expect, it } from 'vitest'

interface MirroredChunk {
  user_id: string
  course_id: string
  topic_id: string
  chunk_id: string
  file_id: string
  content: string
}

// Execute the actual retrieval helpers. Only the database transport is replaced;
// its filters are applied to the rows, so missing ownership filters fail too.
function retrievalWithRows(rows: MirroredChunk[]) {
  const client = {
    from() {
      let selected = [...rows]
      return {
        select() { return this },
        eq(column: keyof MirroredChunk, value: string) {
          selected = selected.filter(row => row[column] === value)
          return this
        },
        in(column: keyof MirroredChunk, values: string[]) {
          selected = selected.filter(row => values.includes(row[column]))
          return this
        },
        async limit(count: number) { return { data: selected.slice(0, count), error: null } },
      }
    },
  }
  const source = readFileSync('supabase/functions/study-tools/index.ts', 'utf8')
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText
  const requireStub = () => ({})
  const deno = { env: { get: () => undefined }, serve: () => {} }
  const retrieve = new Function('require', 'exports', 'Deno', `${compiled}\nreturn retrieveChunks;`)(requireStub, {}, deno) as (
    transport: typeof client, userId: string, courseId: string, scopeId: string, chunkIds: string[],
  ) => Promise<MirroredChunk[]>
  return (chunkIds: string[]) => retrieve(client, 'owner', 'psych', 'lecture-topic', chunkIds)
}

const shared: MirroredChunk = {
  user_id: 'owner', course_id: 'psych', topic_id: '__class_material__',
  chunk_id: 'shared', file_id: 'lecture-file', content: 'Shared psychology passage.',
}

describe('explicit source retrieval across concurrent generation scopes', () => {
  it('keeps requested passages after another scope sync re-homes their topic metadata', async () => {
    const retrieve = retrievalWithRows([shared])
    await expect(retrieve(['shared'])).resolves.toEqual([shared])
  })

  it('still excludes other users, other courses, and unselected passages', async () => {
    // Put colliding outside rows first so a missing filter cannot be hidden by
    // the query limit or the final map that de-duplicates IDs.
    const retrieve = retrievalWithRows([
      { ...shared, user_id: 'someone-else', content: 'Another user.' },
      { ...shared, course_id: 'chemistry', content: 'Another course.' },
      { ...shared, chunk_id: 'unselected', content: 'Not selected.' },
      shared,
    ])
    await expect(retrieve(['shared'])).resolves.toEqual([shared])
  })
})
