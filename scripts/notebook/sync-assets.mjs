import { createHash } from 'node:crypto'
import { readFile, mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
// The canonical Markdown tooling generates assets. This command only verifies
// its receipt and copies exact bytes; it never authors or rewrites prompt prose.
const source = resolve(process.argv[2] ?? 'output/notebook-workflows-v2/instructions')
const destination = resolve('src/lib/academics/notebook')
const canonicalSchemas = resolve('premed-hq-documentation/specifications/generation/portable-notebooks')
const read = name => readFile(resolve(source, name))
const manifest = JSON.parse(await read('canonical-manifest.json'))
const hash = bytes => createHash('sha256').update(bytes).digest('hex')
const pending = []
const compositionBytes = await read('prompt-composition.json')
const composition = JSON.parse(compositionBytes)
const promptSchemaName = 'notebook-prompt-v4.schema.json'
const promptSchema = await read(promptSchemaName)
const pinnedPromptSchema = await readFile(resolve(canonicalSchemas, promptSchemaName))
if (manifest.promptSchema?.outputFile !== promptSchemaName || hash(promptSchema) !== hash(pinnedPromptSchema) || hash(promptSchema) !== manifest.promptSchema?.sha256) throw new Error('Prompt schema differs from the committed pin or its canonical receipt.')
const embeddedSchema = JSON.stringify(JSON.parse(pinnedPromptSchema.toString('utf8')))
if (hash(embeddedSchema) !== manifest.promptSchema.embeddedSha256) throw new Error('Embedded prompt schema serialization differs from its canonical receipt.')
for (const goal of ['review', 'assessment', 'assignment']) {
  const name = `copy-prompt-${goal}.md`
  const bytes = await read(name)
  if (hash(bytes) !== manifest.outputs[name]?.sha256) throw new Error(`${name} differs from the canonical generation receipt. Regenerate from Markdown before copying.`)
  const schemaSection = bytes.toString('utf8').split('\n## Exact JSON Schema\n')
  const embedded = schemaSection.length === 2 ? /```json\n([\s\S]*?)\n```/.exec(schemaSection[1])?.[1] : undefined
  if (embedded !== embeddedSchema) throw new Error(`${name} embeds a schema different from the committed prompt pin.`)
  pending.push([`prompts/${name}`, bytes])
}
const schemaFiles = ['notebook-package.schema.json', 'notebook-package-v3.schema.json', 'notebook-package-v4.schema.json']
if (!schemaFiles.includes(composition.outputSchema)) throw new Error('Update the app parser before adopting another schema version.')
for (const name of schemaFiles) {
  const bytes = await read(name)
  // Existing parser schemas are the compatibility boundary. Asset syncing must
  // never quietly replace them with a different authoring contract.
  if (hash(bytes) !== hash(await readFile(resolve(destination, name)))) throw new Error(`${name} differs from the installed parser schema. Integrate its parser changes first.`)
  if (hash(bytes) !== hash(await readFile(resolve(canonicalSchemas, name))) || hash(bytes) !== manifest.readerSchemas?.[name]?.sha256) throw new Error(`${name} differs from the canonical reader schema or its receipt.`)
  if (name === composition.outputSchema && hash(bytes) !== manifest.schema.sha256) throw new Error('Notebook output schema differs from its canonical receipt.')
  pending.push([name, bytes])
}
for (const name of ['prompt-modes.json', 'revision-context.json', 'conversation-expectations.json']) {
  const bytes = await read(name)
  const receipt = Object.entries(manifest.supportingData).find(([path]) => path.endsWith(`/${name}`))?.[1]
  if (hash(bytes) !== receipt) throw new Error(`${name} differs from its canonical receipt.`)
  pending.push([`prompts/${name}`, bytes])
}
if (composition.promptBuild !== manifest.promptBuild || composition.instructionsVersion !== manifest.instructionsVersion) throw new Error('Prompt composition and generation receipt disagree.')
pending.push(['prompts/canonical-manifest.json', await read('canonical-manifest.json')], ['prompts/prompt-composition.json', compositionBytes])
await mkdir(resolve(destination, 'prompts'), { recursive: true })
for (const [name, bytes] of pending) await writeFile(resolve(destination, name), bytes)
console.log(`Copied ${pending.length} verified canonical assets from ${manifest.canonicalHeadAtBuild}.`)
