// Exercise the real Python builder and Node sync tool in disposable directories.
import { execFileSync } from 'node:child_process'
import { it } from 'vitest'

it('preserves the pinned authoring schema and validates both schema contracts before syncing', () => {
  execFileSync('python3', ['scripts/notebook/test_prompt_schema.py'], { stdio: 'pipe' })
}, 30_000)
