/* ============================================================
   PrivacyPage — 05 §6.4.

   Not a template. Every claim here is checkable against the spec, because
   **a claim Premed OS cannot keep is worse than no page** (doc-decisions §Do not).
   If a statement below stops being true in the code, the statement is what
   changes — not quietly, and not by deleting the section.

   The three things that make this different from a generic policy:
     • a TABLE of what leaves the device, with the local-only alternative
       for each row;
     • the specific action that sends audio for transcription;
     • every processor named, with what it receives.
   ============================================================ */
import { DocLayout, Changelog, type DocSection } from '@/pages/public/DocLayout'

const LAST_UPDATED = '30 August 2026'

const SECTIONS: DocSection[] = [
  {
    id: 'local-first',
    heading: 'Local first, really',
    summary:
      'Premed OS works with no account. Until you make one, everything you type lives in your browser and nowhere else.',
    body: (
      <p>
        Your records are written to local storage on your device as you enter them. Signing in adds
        a server copy and sync across devices. <b>An account is required for sync and server-side AI
        study tools.</b> Core tracking can still be used locally without one.
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
                  <b>Coursework text</b> for AI study tools
                </td>
                <td>When you use a feature that reads it</td>
                <td>Yes — keep working from your own notes without using an AI tool</td>
              </tr>
              <tr>
                <td>
                  <b>Lecture audio</b>
                </td>
                <td>Only when you explicitly ask Premed OS to transcribe an audio file</td>
                <td>
                  Yes — type or paste a transcript instead. Goodnotes can also transcribe on your
                  device before you paste the text here.
                </td>
              </tr>
              <tr>
                <td>
                  <b>Google Calendar events</b>
                </td>
                <td>Only if you connect your Google Calendar</td>
                <td>Yes — don't connect it; add your schedule manually</td>
              </tr>
              <tr>
                <td>
                  <b>Google Drive backup</b>
                </td>
                <td>Only if you connect Google Drive and choose a backup</td>
                <td>Yes — keep the local copy or export it yourself</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="pl-callout pl-callout-good">
          <p>
            <b>Canvas is not connected directly.</b> If your school publishes Canvas due dates to a
            Google Calendar feed, Premed OS can show those dates after you choose to connect your
            Google Calendar. Premed OS never receives a Canvas login or token.
          </p>
        </div>
      </>
    ),
  },
  {
    id: 'processors',
    heading: 'Who receives it',
    summary: 'The services involved in sync, optional Google connections, and the AI tools are named below.',
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
              <td>Your account, synced records, and the private server workspace used by AI study tools</td>
            </tr>
            <tr>
              <td>
                <b>Google</b>
              </td>
              <td>
                Your primary-calendar events when you connect Google Calendar, or a backup file when
                you choose Google Drive backup
              </td>
            </tr>
            <tr>
              <td>
                <b>OpenAI and Anthropic</b>
              </td>
              <td>
                The selected text or audio needed for the AI study action you ask for. The provider
                depends on the action.
              </td>
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
        <li>Premed OS does not use your content to train its own models.</li>
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
      "Don't put identifiable patient details in reflections. Premed OS will quietly say so if it spots something, and will never block you from saving.",
    body: (
      <p>
        Clinical, shadowing, and volunteering reflections are free text. Write about what you
        learned, not who you saw — no names, dates of birth, room numbers, or record numbers.{' '}
        <b>Premed OS is not a compliance product and does not claim to be.</b>
      </p>
    ),
  },
  {
    id: 'keeping-exporting-deleting',
    heading: 'Keeping, exporting, deleting',
    summary:
      'Export any time. Delete your account yourself without emailing anyone; local browser data stays under your control.',
    body: (
      <ul>
        <li>
          <b>Export</b> is a button in Settings and produces a complete, readable file.
        </li>
        <li>
          <b>Deletion</b> is self-serve. Deleting your account immediately removes the account and
          synced server records, then signs that account out everywhere.
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
          {
            date: '30 Aug 26',
            what: 'Clarified the account requirement for sync and AI tools, plus Google, Canvas, Drive, and transcription handling.',
          },
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
