/* ============================================================
   TermsPage — 05 §6.5.

   Two clauses carry this page:
     • **"Numbers are estimates."** GPA, BCPM, projections, readiness and
       score bands are all computed from user input and from rules that
       change between cycles. This is the clause that keeps HQ from being
       treated as authoritative, and it also appears wherever a derived
       number is displayed — not only here.
     • **The user owns their content**, HQ takes only the licence needed to
       operate, and that licence ends on deletion.

   ⚠ PUBLISHING BLOCKERS, NOT BUILD BLOCKERS (05 §10). Three items are
   still open and this page cannot go live until Andy closes them:
   the **age floor** (Terms must state one), the **governing law**
   (Terms needs a jurisdiction), and the **`Premed HQ` trademark and
   domain check**. The page is built; do not point a public domain at it.
   ============================================================ */
import { DocLayout, Changelog, type DocSection } from '@/pages/public/DocLayout'

const LAST_UPDATED = '8 August 2026'

const SECTIONS: DocSection[] = [
  {
    id: 'beta-status',
    heading: 'Beta status',
    summary:
      'This is a public beta run by one student. There is no uptime guarantee. Keep an exported copy of anything that matters.',
    body: (
      <p>
        Features may change or be removed.{' '}
        <b>
          Your data is local-first specifically so an outage cannot separate you from your own
          records
        </b>
        , and export exists so you're never dependent on this service continuing.
      </p>
    ),
  },
  {
    id: 'estimates',
    heading: 'Numbers are estimates',
    summary:
      'Every number HQ produces is an estimate to verify. Do not submit an application on the strength of one.',
    body: (
      <p>
        GPA, BCPM classification, grade projections, hour totals, readiness reads, and score bands
        are computed from what you enter and from published rules that change between cycles.{' '}
        <b>Verify against your official transcript, AMCAS, and your pre-health advisor.</b> HQ is not
        academic, medical, legal, or financial advice.
      </p>
    ),
  },
  {
    id: 'your-content',
    heading: 'Your content',
    summary:
      'You own everything you write. HQ gets only the permission needed to store it and show it back to you.',
    body: (
      <ul>
        <li>
          <b>You keep ownership</b> of your notes, reflections, essays, and records.
        </li>
        <li>
          HQ receives a{' '}
          <b>limited licence to store, process, and display your content to you</b>, for the purpose
          of operating the service, and for nothing else.
        </li>
        <li>
          <b>The licence ends when you delete.</b> It does not survive your account.
        </li>
      </ul>
    ),
  },
  {
    id: 'acceptable-use',
    heading: 'Acceptable use',
    summary:
      "Don't use HQ to distribute material you don't have the right to distribute, and don't attack the service.",
    body: (
      <ul>
        <li>
          <b>Past exams and course materials:</b> every shared entry carries a permission status, and
          material of unknown origin is never shared. <b>HQ is not a distribution network.</b>
        </li>
        <li>
          <b>Syllabi:</b> sharing a parse shares structure and facts. Do not use HQ to redistribute
          the document itself.
        </li>
        <li>
          <b>Lecture recordings:</b> your instructor's policy is yours to observe. Where an
          instructor posts their own recording, use that.
        </li>
        <li>
          <b>Conversations:</b> get consent before recording another person.
        </li>
        <li>No scraping, no automated bulk access, no attempts to bypass rate limits or per-user budgets.</li>
      </ul>
    ),
  },
  {
    id: 'other-services',
    heading: 'Other services',
    summary:
      'Canvas, Google, Anki, and any prep provider have their own terms, and those are between you and them.',
    body: (
      <p>
        HQ links to and integrates with third-party services at your direction.{' '}
        <b>Canvas access is read-only, permanently</b> — HQ never submits work, posts, or writes on
        your behalf. <b>No integration with paid answer-sharing services will ever be built.</b>
      </p>
    ),
  },
  {
    id: 'community-content',
    heading: 'Community content',
    summary:
      "Advice gathered from forums is opinion, attributed and dated. It is not official guidance and sometimes it's wrong.",
    body: (
      <p>
        Where community consensus conflicts with the AAMC or a university, HQ shows both and says
        which is which. Posts are summarised and linked, never republished.
      </p>
    ),
  },
  {
    id: 'liability',
    heading: 'Limits of liability',
    summary:
      'HQ is provided as is. It is not liable for admissions outcomes or decisions made from its numbers.',
    body: (
      <p>
        To the extent the law allows, Premed HQ is provided without warranties and is not liable for
        indirect or consequential loss, including any application outcome.{' '}
        <b>Nothing here limits rights that cannot be limited.</b>
      </p>
    ),
  },
  {
    id: 'terms-changes',
    heading: 'Changes',
    summary: 'Material changes get a dated entry and notice in the app before they take effect.',
    body: <Changelog entries={[{ date: '8 Aug 26', what: 'First published for the public beta.' }]} />,
  },
]

export function TermsPage() {
  return (
    <DocLayout
      documentTitle="Terms of use — Premed HQ"
      title="Terms of use"
      subtitle="What you can expect from HQ, what HQ expects from you, and the limits on both."
      lastUpdated={LAST_UPDATED}
      sections={SECTIONS}
    />
  )
}
