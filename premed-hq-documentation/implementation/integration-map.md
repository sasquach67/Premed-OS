# Integration Map

**Status:** Governing principle locked (July 2026); per-integration detail still to be written alongside the service foundation.

## Purpose

Document each external integration end-to-end: scopes, data flow, sync cadence, failure handling, and user controls — **and, before any of that, decide whether HQ should build the thing at all.**

---

## 0. Build vs. hand off (GOVERNING PRINCIPLE — added July 2026)

> **Andy, July 2026:** *"It's better to utilize outside resources instead of trying to copy current resources, because it is hard, and obviously the replication is not going to be one-to-one."*

HQ is a solo-built student app. **Anything it rebuilds, it rebuilds worse.** Wispr Flow has years of work behind handling stutters, proper nouns, pop-culture references, and dictated punctuation; a from-scratch transcriber will not approach it. The same holds for Canvas, Anki, Google Calendar, and every mature tool already in a student's stack.

**So the default is to hand off. Building is the exception, and it must justify itself.**

### The four ways to not build something — in order of preference

| Tier | What it means | Cost | Example |
|---|---|---|---|
| **1. Don't integrate at all** | The tool already works inside HQ because it operates at the OS level | **zero** | Wispr Flow types into any focused text field — including HQ's. Nothing to build. |
| **2. Accept its output** | The user records/exports elsewhere; HQ takes the file | very low | Zoom recording, GoodNotes audio, Voice Memos → upload |
| **3. Deep link out** | Send the user to the tool with context prefilled; they come back | low | "Continue this in Claude", prompt pre-populated |
| **4. Call its API** | Real integration — tokens, sync, failure handling | **high** | Canvas grades, Google Calendar |

**Always ask tier 1 first.** Most "integrations" evaporate under that question.

### When HQ *should* build it

Build only when **all three** hold:

1. **It's the core loop.** Active recall, the topic model, the grade ledger, the coverage ledger. These *are* the product; handing them off means having no product.
2. **It needs HQ's data to work.** Nothing external knows your topic list, your FSRS state, or your requirement audit.
3. **A handoff would lose the record.** If the output must persist, be queried, and feed other features, it has to land in HQ.

Anything failing all three is a handoff candidate.

### Rules for handoffs

- **Hand off capability, never judgment.** Transcription, dictation, PDF rendering, recording — commodity, hand off freely. Deciding what's weak, what's due, what a claim is worth — **never leaves HQ.**
- **A handoff must return something.** Sending a student to Claude and getting nothing back means the conversation is lost and the record is incomplete. Prefer paths where the output comes home.
- **Never make a paid third-party account a dependency.** Recommend freely; require never. Every handoff has a working path for someone without the tool.
- **A handoff is a suggestion, not a wall.** Never block an action behind "install X first." Offer inline, once, dismissible.
- **Don't become a link farm.** A screen that is mostly buttons to other products has no reason to exist. Handoffs sit at the edges of HQ's own work, never in place of it.
- **Handoffs are not endorsements.** No affiliate links, no paid placement, ever.

---

## 1. Tier 1 — already works, build nothing

### Dictation (Wispr Flow, macOS Dictation, VoiceInk, Handy)

**Wispr Flow is closed source** (verified July 2026) — and that turns out to be irrelevant, because **it needs no integration whatsoever.** It's a system-wide dictation layer that inserts text into whatever field has focus. A student who has it can already dictate into every textarea in HQ today, with all of its punctuation and proper-noun handling intact.

**HQ's entire job is to not break it:**

- Use **standard `input` / `textarea` elements** anywhere a student might write at length — reflections, notes, essay fragments, captured advice.
- **Do not intercept or swallow keystrokes** in text fields; do not build exotic `contenteditable` inputs where a plain field would do.
- Do not fight IME/dictation insertion, autocorrect, or paste.

> ### RULED (Andy, Aug 2026) — this section is now the app-wide law on dictation
>
> *"I wouldn't do a dictation box at all honestly… in any instance. So as a sweep I want to remove that. Instead it just prompts students to the Wispr Flow download."*
> *"I don't trust coded dictation services, I'll only use the real source, and other services."*
>
> **HQ ships no speech-to-text of any kind.** No Web Speech API, no `MediaRecorder` for dictation, no bundled open-source engine, no transcription service behind a mic button in a text field. **There is no mic affordance on any writing surface anywhere in the app.**
>
> **Wispr Flow is a popup and a redirect. Nothing else.** Andy: *"on Wispr Flow, only serves a popup and as a redirective."* **No API, no SDK, no detection of whether it is installed, no affiliate link, no deep integration of any kind.**
>
> **`07-extracurriculars-feature-catalog.md` `R-6` defers to this section.** Do not write a second dictation rule in a pillar spec.

> ### The boundary — RULED (Andy, Aug 2026): dictation is swept, transcription is NOT
>
> **These are different features and only the first is removed.**
>
> | | | Swept? |
> |---|---|---|
> | **Dictation** | Your voice becomes text **in a focused field**. A mic button next to a textarea | **YES — removed everywhere.** Hand off to Wispr Flow or the OS |
> | **Transcription / audio capture** | You **record audio** and HQ analyses it. Nothing is typed into a field | **NO — stays** |
>
> **`01-academics.md` §Stage 4 already drew this line** — *"Wispr Flow is the wrong tool here. It is dictation… not a transcription service for recorded audio."* **The sweep respects it.**
>
> **Unaffected and still built as specced:** the **active recall session** mic (`01-academics.md` §4.1, `briefs/D5-active-recall-runner.md` — narrate while drawing; **an APPROVED mockup already cleared in the build manifest**) · **lecture capture** (`01-academics.md` Stages 1–4) · **Atlas conversation capture** (`02-atlas-interface-and-knowledge-map.md` §§2–4 — advisor meetings, shadowing debriefs).
>
> **The test, for anyone adding a mic later:** *does this put words into a text field the student is looking at?* **Yes → forbidden. No → it is capture, and it is allowed.**

> ### What the sweep actually covers — EVERY text-entry point in HQ
>
> Andy, Aug 2026: *"a sweep on anything that makes you input info via a textbox (like the box in the review recall sessions in assignments)."*
>
> **The unit is the textbox, not the pillar.** Every place a student types anything — **the recall-session answer box, reflections, lab notes, initiative outcomes, year-in-review, what-I'd-do-differently, 700-character AMCAS descriptions, essay drafts, task titles, quick-add rows, org and site names, letter notes, school-list notes, Atlas notes-only mode, settings fields** — obeys one rule:
>
> | | |
> |---|---|
> | **It is a plain `<input>` / `<textarea>`** | No `contenteditable`, no rich-text editor, no keystroke interception, no custom caret |
> | **It has no dictation affordance** | **No mic button, no "speak your answer", no voice icon.** Not on the recall box, not anywhere |
> | **Dictation arrives from outside** | Wispr Flow or the OS types into the focused field. **HQ does not know or care that it happened** |
>
> **This is the whole reason plain elements are non-negotiable.** A custom editor is not merely a preference violation — **it silently breaks the only dictation path HQ has**, and the student cannot tell why.

**The pointer — and it does not contradict the "no download prompt" line below.**

| | |
|---|---|
| **Still forbidden** | **Interrupting an action to advertise.** No modal on `Save`, no banner over a form the student is mid-way through |
| **Now required** | **When a student looks for dictation and finds nothing, HQ explains why and points somewhere.** A dismissible note on first open of a long-form writing surface, plus the Settings line |

**The distinction is who started it.** An unprompted ad is hostile; **an answer to "where's the mic button?" is the honest thing to do**, and without it the absence reads as a missing feature rather than a decision.

**What the copy must carry — verified Aug 2026:**

- **Name more than one option.** Wispr Flow, **and the OS's built-in dictation**, which is free on every platform. **A single-vendor recommendation is an ad.**
- **The `.edu` discount is real and worth stating:** Pro is ~$6/month for students, half the $15 standard. **There is a free tier** — 2,000 words/week on desktop, 1,000 on iPhone. Mac, Windows, iPhone, Android.
- **State the privacy behaviour.** **Wispr Flow captures screenshots to power its AI features**, which some users find intrusive. **Recommending a tool without naming that would be dishonest**, and a premed app holding reflections and financial status has no business being casual about it.
- **No paid account is ever a dependency.** `01-academics.md` §acceptance already requires this and it is unchanged. **Every writing surface works fully by typing.**

**This is a pointer, not an integration.** No API, no SDK, no affiliate link, no dependency. **If Wispr Flow changes or disappears, one string changes.**

> Open-source options exist if a bundled one is ever wanted (VoiceInk, GPL-3.0; OpenWhispr and Handy, MIT). **Explicitly not wanted** — Andy, Aug 2026: *"I don't trust coded dictation services."* **Bundling one would make HQ the owner of transcription quality, which is exactly the thing tier 1 exists to avoid.**

---

## 2. Tier 2 — accept the output

### Audio capture (GoodNotes, Voice Memos, Zoom, Granola, anything)

**HQ does not need to be a recorder.** A browser can't capture system audio from a video call anyway (`specifications/02-atlas` §5), and every student already carries three tools that record.

- **Accept uploads** in the formats those tools produce: `m4a`, `mp3`, `wav`, `mp4`.
- **Live mic capture is supported** where it's genuinely convenient — in-person conversations, the active-recall runner — because it reuses `MediaRecorder` and costs nothing. **It is never the only path.**
- **The recording was never the valuable part.** Transcription plus claim extraction is, and that half runs identically regardless of where the audio came from.
- **Granola specifically:** API access requires a $14/user/month Business plan, so it is **never a dependency**. Optional import only. GoodNotes, Voice Memos, and Zoom cover the same ground for free.

### Canvas — reconsidered (see `tabs/01-academics.md` §4.1-O)

Canvas has **two paths with very different costs**, and the cheap one should ship first:

| | **Calendar feed** | **REST API** |
|---|---|---|
| Gets you | assignments + due dates | grades, submissions, group weights, announcements, modules |
| Auth | none — a secret ICS URL | student access token |
| HQ work | **near zero** — HQ already reads a calendar (`01` §6.9) | Edge Function proxy, token storage, sync/diff engine |
| Tier | **2** | **4** |

**Path A (build first):** the student subscribes their Canvas calendar feed to Google Calendar — which many already do — and **HQ reads Google Calendar, which it was going to read anyway.** Deadlines arrive with zero Canvas-specific engineering. Tier 2 doing the work of tier 4.

**Path B (the real integration):** the full API, for **grades** and **announcements** — the two things a calendar feed can't carry. Grades make the ledger self-populating; announcements, **triaged rather than relayed** (`01` §4.1-O), are the one place HQ is meaningfully better than Canvas, because Canvas notifies about everything with equal weight.

**Path B is a mirror, not a replacement.** Content flows in; doing things stays in Canvas. No discussions, no inbox, no quiz surfaces, no write path of any kind.

**Do not build Path B until Path A exists and someone has asked for more.** Path A is roughly a day; Path B is a proxy, a token-security design, and a sync engine.

---

## 3. Tier 3 — deep link out

### "Continue in Claude / ChatGPT"

Some things finish better in a real chat interface than in a fixed HQ panel — an open-ended question, an essay the student wants to argue about, a follow-up chain.

- Offer **"Continue this in Claude"** with the prompt **pre-populated via query parameter** where the destination supports it. **Verify current URL-parameter support before building**; if it changes, degrade to copy-to-clipboard.
- **Always include copy-to-clipboard** as the guaranteed path.
- **HQ keeps its own record of what was sent** — question, context, timestamp — so the trail survives even though the answer happened elsewhere.
- **Offer a paste-back field.** One paste files the answer against the topic or essay, marked as externally sourced.
- **Never route HQ's own reasoning through this.** Gap reports, weakness calls, and readiness forecasts are HQ's job and stay in-app. This is for open-ended conversation only.

### Others

Course catalog, Canvas web, Google Drive files, Anki desktop, journal articles, AMCAS — **deep link, don't embed.**

---

## 4. Tier 4 — real API integrations

Only these, and each must justify itself against §0.

- **Google Calendar** — read for context; HQ writes only its own deadlines (`01` §6.9)
- **Google Drive** — file links in Essays/Research/Profile; metadata only
- **Gmail** — letter follow-ups; future
- **Canvas REST** — Path B above, grades only, read-only, via the Edge Function proxy
- **LLM providers** — provider-agnostic, behind the proxy, keys never client-side (`01` §6.3)
- **Transcription** — swappable behind the same seam
- **Direct file uploads and CSV/spreadsheet import**
- **Supabase** — auth, sync, storage, pgvector, Edge Functions (in-stack, not an integration)

### Per-integration, still to write

Connect/disconnect UX · permission explanation in plain language · sync status and last-sync · retry and error surfaces · least-privilege scopes · token encryption and revocation · what happens when an integration is removed (**data stays; HQ never deletes user records because a connection ended**).
