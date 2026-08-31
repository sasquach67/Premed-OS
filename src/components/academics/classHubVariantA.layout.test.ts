import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const classHubCss = readFileSync('src/components/academics/classHubVariantA.css', 'utf8')

describe('Class Hub banner responsive contract', () => {
  it('stacks the rigid action rail before it can crush the course identity', () => {
    expect(classHubCss).toMatch(/\.class-hub \{[\s\S]*?container-type:\s*inline-size;/)
    expect(classHubCss).toMatch(/@container \(max-width:\s*1120px\)[\s\S]*?\.class-hub-banner-main \{ flex-direction: column; \}/)
    expect(classHubCss).toMatch(/@media \(max-width: 1280px\)[\s\S]*?\.class-hub-banner-main \{ flex-direction: column; \}/)
    expect(classHubCss).toMatch(/\.class-hub-course-code \{ white-space: nowrap; \}/)
  })
})
