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

  it('bounds variable metric tracks so a long deadline cannot starve the identity column', () => {
    expect(classHubCss).toMatch(/\.class-hub-banner-actions \.glass-surface \{[\s\S]*?grid-auto-columns:\s*minmax\(76px, 110px\);/)
  })

  it('gives long course titles a second line and compacts the resource action before the rail stacks', () => {
    expect(classHubCss).toMatch(/\.class-hub-course-title \{[\s\S]*?white-space:\s*normal;/)
    expect(classHubCss).toMatch(/@container \(max-width:\s*1280px\)[\s\S]*?\.class-hub-primary-action-optional \{ display:\s*none; \}/)
  })
})
