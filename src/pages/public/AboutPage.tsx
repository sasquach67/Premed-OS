/* ============================================================
   AboutPage — first person, and it STAYS first person.

   With no users, no logos and no testimonials, the only trust signal a
   beta honestly has is who made it and why. **Rewriting this into
   third-person company voice reads as a fake team** and is a defect
   (P1 §4.6 · doc-decisions §About).

   THE COPY IS ANDY'S, VERBATIM, except for three mechanical edits that
   are recorded in the decisions file so they are visible rather than
   silently absorbed. Do not smooth "my noob self", do not remove the
   exclamation marks, do not make it sound like a company.

   Deliberately NOT the reference layout (Andy: "i kinda don't want to be
   accused of copying the other dude"):
     • the site's own two-weight headline, run bigger here (26/56) because
       About is the one page in the group with a voice
     • ONE 640px column — no split, no portrait column
     • the photo is a 226px RIGHT-FLOATED figure the prose wraps around,
       entering at the second paragraph, shown WHOLE and UNCROPPED at its
       native 3:4, and UNCAPTIONED
     • body 17px/1.85 — normalising the leading back to 1.45 kills the page

   Rejected and not to be reintroduced: a left portrait column or any
   two-column split · a drop cap · a caption of any kind · a Who/When/Team
   fact rail · a 16:9 photo band across the top (it crops).
   ============================================================ */
import { useState } from 'react'
import { PublicShell } from '@/components/public/PublicShell'
import { PublicNav } from '@/components/public/PublicNav'
import { PublicHeadline } from '@/components/public/PublicHeadline'

const CONTACT_EMAIL = 'elephon08@gmail.com'
const LINKEDIN = 'https://www.linkedin.com/in/andy-quach-273bbb349/'
const PORTRAIT = `${import.meta.env.BASE_URL}img/andy-portrait.jpg`
const PORTRAIT_SMALL = `${import.meta.env.BASE_URL}img/andy-portrait-452.jpg`

export function AboutPage() {
  return (
    <PublicShell title="About — Premed HQ">
      <div className="pl-band">
        <PublicNav />
        <div className="pl-bandin" style={{ padding: '0 0 0' }}>
          <PublicHeadline as="h1" size="about" setup="A note from" payoff="the creator." />
        </div>
      </div>

      <div className="pl-aboutgrid">
        <div className="pl-prose pl-clearfix">
          <p>
            What's up! I'm Andy, a Neuroscience major on the pre-med track here at UNC-Chapel Hill. I
            thought of this app in the beginning of summer and I've been working on it throughout,
            and this is my first big project! As a pre-med interested in AI, this was a really fun
            experience in terms of designing, building, and iterating my first ever app, or website,
            or whatever you want to call it.
          </p>

          {/* Whole and uncropped at its native 3:4. Uncaptioned — both of
              those are load-bearing, not styling choices. */}
          <figure className="pl-figure">
            <img
              src={PORTRAIT}
              srcSet={`${PORTRAIT_SMALL} 339w, ${PORTRAIT} 675w`}
              sizes="226px"
              width={675}
              height={900}
              loading="lazy"
              decoding="async"
              alt="Andy, who builds Premed HQ"
            />
          </figure>

          <p>
            Initially, I was tracking things like my graduation requirements and experience hours
            using Google Sheets, and so were a lot of my peers. I figured: "why not have a tracker
            where everything is in one place?" I used other apps like Calendar and Notion to track my
            classes, but using all of these apps felt a bit convoluted.
          </p>
          <p>
            So I built HQ to put everything in one place, and to hopefully make <b>OUR</b> pre-med
            journey a tiny bit easier. My noob self has been the only developer of this app, so I'm
            open to any form of feedback or advice from others!
          </p>
        </div>

        {/* Two links only. TikTok and Instagram were in the reference and
            are cut. Real <a> elements, so they are focusable and
            keyboard-activatable — never styled spans. */}
        <div className="pl-social">
          <a
            className="pl-sq"
            href={LINKEDIN}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Andy on LinkedIn"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M4.98 3.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z" />
              <path d="M3 9h4v12H3zM10 9h3.8v1.7h.05c.53-.95 1.83-1.95 3.76-1.95 4.02 0 4.76 2.5 4.76 5.75V21h-4v-5.6c0-1.34-.03-3.06-1.9-3.06-1.9 0-2.19 1.45-2.19 2.96V21h-4z" />
            </svg>
          </a>
          <a className="pl-sq" href={`mailto:${CONTACT_EMAIL}`} aria-label="Email Andy">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="2.5" y="5" width="19" height="14" rx="2.5" />
              <path d="m3.5 7 8.5 6 8.5-6" />
            </svg>
          </a>
        </div>

        {/* §6.1 — independence is stated in the BODY here, not only in the
            footer. */}
        <p style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--pl-dim)', marginTop: 26 }}>
          <b style={{ color: 'var(--pl-mut)' }}>Premed HQ is an independent project.</b> Not
          affiliated with, endorsed by, or sponsored by UNC-Chapel Hill, the AAMC, or any other
          institution. It uses course numbers and requirement names because those are facts about a
          curriculum, and its colours and name are its own. MCAT and AMCAS are programs of the AAMC,
          which does not sponsor or endorse this product.
        </p>
      </div>

      <div style={{ padding: '8px 22px 36px' }}>
        <FeedbackPanel />
      </div>
    </PublicShell>
  )
}

/* ── The §7 form. One email OR one form — this is the form. ───────────────
   **Export and deletion must never route through it**, so it says nothing
   about either; both are self-serve in Settings.

   With no server endpoint, the honest implementation is a `mailto:` compose
   — a real path that works today rather than a button that silently drops
   what someone typed. The label says so. */
function FeedbackPanel() {
  const [message, setMessage] = useState('')
  const [replyTo, setReplyTo] = useState('')

  const send = () => {
    const body = replyTo.trim() ? `${message}\n\n— reply to: ${replyTo.trim()}` : message
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(
      'Premed HQ feedback',
    )}&body=${encodeURIComponent(body)}`
  }

  return (
    <div className="pl-fbpanel">
      <div className="pl-fbk">Direct feedback</div>
      <h2 className="pl-fbh">Tell me what to fix</h2>
      <p className="pl-fbp">
        Bugs, a requirement that's wrong for your major, a feature you wish existed. All of it helps,
        and it goes straight to me.
      </p>

      <label className="pl-flbl" htmlFor="feedback-text">
        Your feedback
      </label>
      <textarea
        id="feedback-text"
        className="pl-fta"
        placeholder="What worked, what broke, what you wish it did..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />

      <div className="pl-fbfoot">
        <input
          className="pl-finp"
          type="email"
          aria-label="Email, only if you want a reply"
          placeholder="Email, only if you want a reply (optional)"
          value={replyTo}
          onChange={(e) => setReplyTo(e.target.value)}
        />
        <button
          type="button"
          className="pl-btn pl-btn-sm pl-btn-solid"
          disabled={message.trim().length === 0}
          onClick={send}
        >
          Send it
        </button>
      </div>

      <p className="pl-fbnote">
        Opens your email app, so you can see exactly what gets sent. Optional, and only used to
        reply. <b>Don't include grades, scores, or anything about a patient.</b>
      </p>
    </div>
  )
}
