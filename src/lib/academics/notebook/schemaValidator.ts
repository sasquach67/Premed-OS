/** Validator for the explicitly supported, bundled notebook schema vocabulary.
 * Unknown keywords fail closed so a future contract cannot silently weaken validation. */
export type Schema = { [key: string]: unknown; $ref?: string; $defs?: Record<string, Schema>; type?: string | string[]; properties?: Record<string, Schema>; required?: string[]; additionalProperties?: boolean; items?: Schema; oneOf?: Schema[]; allOf?: Schema[]; if?: Schema; then?: Schema; else?: Schema; enum?: unknown[]; const?: unknown; minLength?: number; maxLength?: number; minItems?: number; maxItems?: number; minimum?: number; maximum?: number; uniqueItems?: boolean }
export class NotebookValidationError extends Error {
  path: string
  constructor(path: string, message: string) { super(`${path}: ${message}`); this.name = 'NotebookValidationError'; this.path = path }
}
export function validateSchema(value: unknown, schema: Schema, root = schema, path = '$', depth = 0): void {
  const fail = (message: string): never => { throw new NotebookValidationError(path, message) }
  if (depth > 60) fail('The package is nested too deeply.')
  const allowed = new Set(['$schema', '$id', '$defs', '$ref', 'title', 'description', 'type', 'properties', 'required', 'additionalProperties', 'items', 'oneOf', 'allOf', 'if', 'then', 'else', 'enum', 'const', 'minLength', 'maxLength', 'minItems', 'maxItems', 'minimum', 'maximum', 'uniqueItems'])
  for (const keyword of Object.keys(schema)) if (!allowed.has(keyword)) fail(`Unsupported schema keyword ${keyword}; update the importer before using this contract.`)
  if (schema.$ref) {
    const key = schema.$ref.replace('#/$defs/', '')
    if (!schema.$ref.startsWith('#/$defs/') || !root.$defs?.[key]) fail('Unresolved schema reference.')
    validateSchema(value, root.$defs![key], root, path, depth + 1)
  }
  if (schema.type) {
    const types = Array.isArray(schema.type) ? schema.type : [schema.type]
    const valid = types.some(type => type === 'null' ? value === null : type === 'array' ? Array.isArray(value) : type === 'object' ? value !== null && typeof value === 'object' && !Array.isArray(value) : type === 'integer' ? Number.isSafeInteger(value) : typeof value === type)
    if (!valid) fail(`Expected ${types.join(' or ')}.`)
  }
  if ('const' in schema && value !== schema.const) fail(`Expected ${JSON.stringify(schema.const)}.`)
  if (schema.enum && !schema.enum.includes(value)) fail(`Use ${schema.enum.map(item => JSON.stringify(item)).join(', ')}.`)
  if (typeof value === 'string') {
    const length = [...value].length
    if (schema.minLength !== undefined && (length < schema.minLength || (schema.minLength > 0 && !value.trim()))) fail('Provide non-empty text.')
    if (schema.maxLength !== undefined && length > schema.maxLength) fail(`Use at most ${schema.maxLength} characters; no text was truncated.`)
  }
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) fail('Use a finite number.')
    if (schema.minimum !== undefined && value < schema.minimum) fail(`Use a value of at least ${schema.minimum}.`)
    if (schema.maximum !== undefined && value > schema.maximum) fail(`Use a value of at most ${schema.maximum}.`)
  }
  if (Array.isArray(value)) {
    if (schema.minItems !== undefined && value.length < schema.minItems) fail(`Provide at least ${schema.minItems} item(s).`)
    if (schema.maxItems !== undefined && value.length > schema.maxItems) fail(`Use at most ${schema.maxItems} items; nothing was truncated.`)
    if (schema.uniqueItems && new Set(value.map(item => JSON.stringify(item))).size !== value.length) fail('Items must be unique.')
    if (schema.items) value.forEach((item, i) => validateSchema(item, schema.items!, root, `${path}[${i}]`, depth + 1))
  } else if (value !== null && typeof value === 'object') {
    const object = value as Record<string, unknown>
    for (const key of schema.required ?? []) if (!Object.hasOwn(object, key)) throw new NotebookValidationError(`${path}.${key}`, 'Required field is missing.')
    for (const [key, item] of Object.entries(object)) {
      if (['__proto__', 'prototype', 'constructor'].includes(key)) throw new NotebookValidationError(`${path}.${key}`, 'Reserved property name.')
      if (schema.properties && Object.hasOwn(schema.properties, key)) validateSchema(item, schema.properties[key], root, `${path}.${key}`, depth + 1)
      else if (schema.additionalProperties === false) throw new NotebookValidationError(`${path}.${key}`, 'Unrecognized field. Move its content into a supported field; the app will not discard it.')
    }
  }
  if (schema.oneOf) {
    const errors: Error[] = []; let matches = 0
    for (const branch of schema.oneOf) { try { validateSchema(value, branch, root, path, depth + 1); matches++ } catch (error) { errors.push(error as Error) } }
    if (matches !== 1) {
      // A tagged block gets its own field-path error rather than an irrelevant first variant.
      const type = value !== null && typeof value === 'object' ? (value as { type?: string }).type : undefined
      const branch = schema.oneOf.find(item => item.properties?.type?.const === type && type !== undefined)
      if (branch) validateSchema(value, branch, root, path, depth + 1)
      throw errors[0] ?? new NotebookValidationError(path, 'Expected exactly one supported content shape.')
    }
  }
  for (const branch of schema.allOf ?? []) validateSchema(value, branch, root, path, depth + 1)
  if (schema.if) {
    let matches = true
    try { validateSchema(value, schema.if, root, path, depth + 1) } catch { matches = false }
    const branch = matches ? schema.then : schema.else
    if (branch) validateSchema(value, branch, root, path, depth + 1)
  }
}
