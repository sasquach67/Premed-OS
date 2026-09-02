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

const LAST_UPDATED = '1 September 2026'

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
                <td>
                  Only if you connect Google Calendar. Premed OS reads the title, time, location,
                  status, and meeting link needed to show your upcoming schedule and review possible
                  coursework dates.
                </td>
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
                Upcoming events from your primary calendar when you connect Google Calendar, or a backup file when
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
    id: 'data-protection',
    heading: 'How sensitive data is protected',
    summary:
      'Premed OS limits access by account, encrypts network traffic, minimizes OAuth access, and keeps integration credentials out of your synced workspace.',
    body: (
      <ul>
        <li>
          <b>Secure transport.</b> Premed OS and its service providers use HTTPS to encrypt data in
          transit between your browser and their servers.
        </li>
        <li>
          <b>Account isolation.</b> Supabase Authentication identifies the signed-in user, and
          database row-level security restricts synced workspaces and course-source records to their
          owning account. Anonymous users cannot read those tables.
        </li>
        <li>
          <b>Calendar credentials stay short-lived.</b> The Google Calendar bearer token is kept only
          in the current browser tab's session storage, expires automatically, is not included in
          cloud workspace sync, and is cleared when you sign out, switch workspaces, or disconnect.
        </li>
        <li>
          <b>Drive credentials are encrypted.</b> If you connect a Google Drive folder, the reusable
          refresh token is encrypted with AES-GCM before it is stored server-side. It is not exposed
          to the browser after the connection is completed.
        </li>
        <li>
          <b>Least-privilege access.</b> Calendar access is read-only and limited to events owned by
          you. Drive access, when offered, is requested separately and limited to the folder-reading
          feature you choose to connect.
        </li>
        <li>
          <b>Limited human access.</b> Premed OS does not routinely have people read private user
          content. Access is limited to what is necessary to operate or secure the service, comply
          with law, investigate abuse, or provide support you explicitly request.
        </li>
      </ul>
    ),
  },
  {
    id: 'google-limited-use',
    heading: 'Google Workspace API Limited Use',
    summary:
      'Google Workspace data is used only for the connected feature you request, never for advertising or generalized AI training.',
    body: (
      <>
        <p>
          <b>
            Premed OS's use and transfer of information received from Google Workspace APIs adheres
            to the{' '}
            <a
              href="https://developers.google.com/terms/api-services-user-data-policy"
              target="_blank"
              rel="noopener noreferrer"
            >
              Google API Services User Data Policy
            </a>
            , including the Limited Use requirements.
          </b>
        </p>
        <ul>
          <li>
            Raw or derived Google Workspace API data is <b>not used to develop, improve, or train
            generalized or non-personalized AI or machine-learning models</b>.
          </li>
          <li>
            Google Calendar data is used only for the visible schedule and review-before-apply
            features in Premed OS. Calendar event data is not sent to OpenAI or Anthropic.
          </li>
          <li>
            A file selected from Google Drive is sent to an AI provider only if you deliberately
            select that imported material for a user-visible study action. That use is limited to
            producing the output you requested and is not authorized for generalized model training.
          </li>
          <li>
            Google user data is not sold, used for advertising, used to determine creditworthiness,
            or transferred to data brokers or information resellers.
          </li>
        </ul>
      </>
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
          Premed OS does not use your content, including raw or derived Google Workspace data, to
          train its own models or generalized third-party models.
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
            date: '1 Sep 26',
            what: 'Added the sensitive-data protection mechanisms and Google Workspace API Limited Use and AI-training disclosures required for OAuth verification.',
          },
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
