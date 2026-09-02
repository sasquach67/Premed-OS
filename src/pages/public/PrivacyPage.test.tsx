import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { PrivacyPage } from './PrivacyPage'

vi.mock('@/components/public/PublicNav', () => ({ PublicNav: () => null }))
vi.mock('@/components/public/PublicShell', () => ({
  PublicShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

describe('PrivacyPage Google data disclosures', () => {
  it('publishes concrete sensitive-data protections and the Workspace Limited Use statement', () => {
    const html = renderToStaticMarkup(<PrivacyPage />)

    expect(html).toContain('How sensitive data is protected')
    expect(html).toContain('database row-level security')
    expect(html).toContain('AES-GCM')
    expect(html).toContain('Google Workspace API Limited Use')
    expect(html).toContain('Google API Services User Data Policy')
    expect(html).toContain('not used to develop, improve, or train')
    expect(html).toContain('Calendar event data is not sent to OpenAI or Anthropic')
    expect(html).toContain('1 September 2026')
  })
})
