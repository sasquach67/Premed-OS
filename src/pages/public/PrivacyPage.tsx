/* ============================================================
   PrivacyPage — 05 §6.4.

   Not a template. Every claim here is checkable against the spec, because
   **a claim HQ cannot keep is worse than no page** (doc-decisions §Do not).
   If a statement below stops being true in the code, the statement is what
   changes — not quietly, and not by deleting the section.

   The three things that make this different from a generic policy:
     • a TABLE of what leaves the device, with the local-only alternative
       for each row;
     • on-device transcription called out separately — it is at once the
       largest cost decision in the product and the strongest privacy claim
       HQ can make;
     • all three processors NAMED, with what each one receives.
   ============================================================ */
import { DocLayout, Changelog, type DocSection } from '@/pages/public/DocLayout'

const LAST_UPDATED = '8 August 2026'

const SECTIONS: DocSection[] = [
  {
    id: 'local-first',
    heading: 'Local first, really',
    summary:
      'HQ works with no account. Until you make one, everything you type lives in your browser and nowhere else.',
    body: (
      <p>
        Your records are written to local storage on your device as you enter them. Signing in adds
        sync across devices and a server copy. <b>It does not change what the app can do</b> — there
        is no feature behind the account, and the signed-out experience is the whole product.
      </p>
    ),
  },
  {
    id: 'what-leaves',
    heading: 'What leaves your device',
    summary:
      'Only the specific things listed below, only for the feature that needs them, and several have a local-only alternative.',
    body: (
      <>
        <div className="pl-tblwrap">
          <table className="pl-tbl">
            <thead>
              <tr>
                <th>What</th>
                <th>When</th>
                <th>Local-only option</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <b>Your records</b> — courses, hours, notes
                </td>
                <td>Only if you create an account, to sync</td>
                <td>Yes — stay signed out</td>
              </tr>
              <tr>
                <td>
                  <b>Coursework text</b> for AI features
                </td>
                <td>When you use a feature that reads it</td>
                <td>Yes — those features have deterministic fallbacks</td>
              </tr>
              <tr>
                <td>
                  <b>Lecture audio</b>
                </td>
                <td>Only if you record a lecture</td>
                <td>
                  <b>Yes — transcription runs on your device by default</b>
                </td>
              </tr>
              <tr>
                <td>
                  <b>Canvas assignment data</b>
                </td>
                <td>Only if you connect Canvas</td>
                <td>Yes — don't connect it</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="pl-callout pl-callout-good">
          <p>
            <b>On-device transcription is the default, not an option you have to find.</b> Lecture
            audio never has to leave your machine.
          </p>
        </div>
      </>
    ),
  },
  {
    id: 'processors',
    heading: 'Who receives it',
    summary: 'Three processors, named, each with what it gets. No one else.',
    body: (
      <div className="pl-tblwrap">
        <table className="pl-tbl">
          <thead>
            <tr>
              <th>Processor</th>
              <th>Receives</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <b>Supabase</b>
              </td>
              <td>Your account and your synced records, if you have an account</td>
            </tr>
            <tr>
              <td>
                <b>The AI provider</b>
              </td>
              <td>
                Only the text a feature needs, at the moment you use it. Never your whole workspace
              </td>
            </tr>
            <tr>
              <td>
                <b>The transcription provider</b>
              </td>
              <td>Nothing, unless you turn off on-device transcription</td>
            </tr>
          </tbody>
        </table>
      </div>
    ),
  },
  {
    id: 'what-we-dont-do',
    heading: "What we don't do",
    summary:
      'No third-party analytics, no advertising technology, no sale of data, and no training on your work.',
    body: (
      <ul>
        <li>
          <b>No analytics SDKs.</b> Usage instrumentation exists so features can be judged, and it is{' '}
          <b>local and yours</b> — you can see it and clear it.
        </li>
        <li>
          <b>No ad tech, no trackers, no fingerprinting.</b>
        </li>
        <li>
          <b>Your data is never sold or shared for marketing.</b>
        </li>
        <li>
          <b>Your content is not used to train external models.</b>
        </li>
      </ul>
    ),
  },
  {
    id: 'shared-parses',
    heading: 'Shared syllabus parses',
    summary:
      'When you share a parsed syllabus, it is structurally impossible for your grades or progress to travel with it.',
    body: (
      <p>
        A shared parse contains dates, units, weights, and policies from the professor's document. It
        lives in a separate store with no join path to your records and an allow-list of fields.{' '}
        <b>The safety here is architectural, not a promise about our care.</b> The source document
        itself is never shared.
      </p>
    ),
  },
  {
    id: 'patient-information',
    heading: 'Patient information',
    summary:
      "Don't put identifiable patient details in reflections. HQ will quietly say so if it spots something, and will never block you from saving.",
    body: (
      <p>
        Clinical, shadowing, and volunteering reflections are free text. Write about what you
        learned, not who you saw — no names, dates of birth, room numbers, or record numbers.{' '}
        <b>HQ is not a compliance product and does not claim to be.</b>
      </p>
    ),
  },
  {
    id: 'keeping-exporting-deleting',
    heading: 'Keeping, exporting, deleting',
    summary:
      'Export any time, in one click. Delete your account and the server copy goes, on a stated timetable, without emailing anyone.',
    body: (
      <ul>
        <li>
          <b>Export</b> is a button in Settings and produces a complete, readable file.
        </li>
        <li>
          <b>Deletion</b> is self-serve. Server data is removed within 30 days, backups roll off
          within 90.
        </li>
        <li>
          <b>Local data is yours to keep or clear</b> — deleting the account doesn't reach into your
          browser.
        </li>
        <li>
          <b>Disconnecting an integration never deletes records</b> that came in through it.
        </li>
      </ul>
    ),
  },
  {
    id: 'privacy-changes',
    heading: 'Changes',
    summary: 'Material changes are dated and listed here, not silently swapped in.',
    body: (
      <Changelog
        entries={[
          { date: '8 Aug 26', what: 'First published for the public beta.' },
          {
            date: '—',
            what: 'Later entries appear here, newest first, each saying what changed and why.',
          },
        ]}
      />
    ),
  },
]

export function PrivacyPage() {
  return (
    <DocLayout
      documentTitle="Privacy — Premed OS"
      title="Privacy"
      subtitle="What's stored, what leaves your device, who receives it, and how to get all of it back or destroy it."
      lastUpdated={LAST_UPDATED}
      sections={SECTIONS}
    />
  )
}
