/* ============================================================
   DocLayout — ONE shell, four routes (About · Privacy · Terms · Pricing).

   Same pill nav, same title band, same 720px measure, same footer. A legal
   page that looks like a different site reads as boilerplate somebody
   pasted in, which is exactly what these must not be (doc-decisions §1).

   The contents rail is sticky above 1100px and collapses to inline chips
   below it. **No glass below the title band** — the band is this group's
   hero region and everything under it is solid-with-depth.

   `summary` is a REQUIRED prop on every section. §6.4 asks for plain
   language; making the strip structural is how that gets enforced instead
   of hoped for. If a summary and its section ever disagree, rewrite the
   section — never delete the summary.
   ============================================================ */
import { useEffect, useState, type ReactNode } from 'react'
import { Clock } from 'lucide-react'
import { PublicShell } from '@/components/public/PublicShell'
import { PublicNav } from '@/components/public/PublicNav'

export interface DocSection {
  id: string
  heading: string
  /** The plain-English one-sentence summary. Not optional, by design. */
  summary: string
  body: ReactNode
}

export interface ChangelogEntry {
  date: string
  what: string
}

interface DocLayoutProps {
  /** Browser tab title. */
  documentTitle: string
  title: string
  subtitle: string
  /** Real date, or omitted. A placeholder date is worse than none. */
  lastUpdated?: string
  sections: DocSection[]
}

/** The dated changelog Privacy and Terms are required to carry (§6.4).
 *  Rendered inside the page's own `Changes` section, so it sits under that
 *  section's plain-English summary like every other block. */
export function Changelog({ entries }: { entries: ChangelogEntry[] }) {
  return (
    <div className="pl-changelog">
      {entries.map((entry) => (
        <div key={`${entry.date}-${entry.what}`} className="pl-clrow">
          <span className="pl-cldate">{entry.date}</span>
          <span>{entry.what}</span>
        </div>
      ))}
    </div>
  )
}

export function DocLayout({
  documentTitle,
  title,
  subtitle,
  lastUpdated,
  sections,
}: DocLayoutProps) {
  const [active, setActive] = useState(sections[0]?.id ?? '')

  // Highlight the rail entry for whatever section is currently on screen.
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0]
        if (visible?.target.id) setActive(visible.target.id)
      },
      { rootMargin: '-10% 0px -70% 0px' },
    )
    for (const section of sections) {
      const el = document.getElementById(section.id)
      if (el) observer.observe(el)
    }
    return () => observer.disconnect()
  }, [sections])

  return (
    <PublicShell title={documentTitle}>
      <div className="pl-band">
        <PublicNav />
        <div className="pl-bandin">
          <h1 className="pl-doctitle">{title}</h1>
          <p className="pl-docsub">{subtitle}</p>
          {lastUpdated ? (
            <span className="pl-updated">
              <Clock size={12} aria-hidden="true" />
              Last updated {lastUpdated}
            </span>
          ) : null}
        </div>
      </div>

      <div className="pl-docwrap">
        <nav className="pl-toc" aria-label="On this page">
          <div className="pl-toclab">On this page</div>
          {sections.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              aria-current={active === section.id ? 'true' : undefined}
              onClick={(event) => {
                event.preventDefault()
                document.getElementById(section.id)?.scrollIntoView({ behavior: 'smooth' })
                setActive(section.id)
              }}
            >
              {section.heading}
            </a>
          ))}
        </nav>

        <div className="pl-doc">
          {sections.map((section) => (
            <section key={section.id} aria-labelledby={section.id}>
              <h2 id={section.id}>{section.heading}</h2>
              <div className="pl-plain">
                <span className="k">In short</span>
                <p>{section.summary}</p>
              </div>
              {section.body}
            </section>
          ))}
        </div>
      </div>
    </PublicShell>
  )
}
