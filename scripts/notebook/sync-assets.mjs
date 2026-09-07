import { createHash } from 'node:crypto'
import { readFile, mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
// The canonical Markdown tooling generates assets. This command only verifies
// its receipt and copies exact bytes; it never authors or rewrites prompt prose.
const source = resolve(process.argv[2] ?? 'output/notebook-workflows-v2/instructions')
const destination = resolve('src/lib/academics/notebook')
const read = name => readFile(resolve(source, name))
const manifest = JSON.parse(await read('canonical-manifest.json'))
const hash = bytes => createHash('sha256').update(bytes).digest('hex')
const pending = []
for (const goal of ['review', 'assessment', 'assignment']) {
  const name = `copy-prompt-${goal}.md`
  const bytes = await read(name)
  if (hash(bytes) !== manifest.outputs[name]?.sha256) throw new Error(`${name} differs from the canonical generation receipt. Regenerate from Markdown before copying.`)
  pending.push([`prompts/${name}`, bytes])
}
const schema = await read('notebook-package.schema.json')
if (hash(schema) !== manifest.schema.sha256) throw new Error('Notebook schema differs from its canonical receipt.')
const parsedSchema = JSON.parse(schema)
if (parsedSchema.properties.version.const !== 2) throw new Error('Update the app parser before adopting another schema version.')
pending.push(['notebook-package.schema.json', schema])
for (const name of ['canonical-manifest.json', 'prompt-composition.json']) pending.push([`prompts/${name}`, await read(name)])
await mkdir(resolve(destination, 'prompts'), { recursive: true })
for (const [name, bytes] of pending) await writeFile(resolve(destination, name), bytes)
console.log(`Copied ${pending.length} verified canonical assets from ${manifest.canonicalHeadAtBuild}.`)
