# 05 — Public site, authentication, account, and legal

**Status:** New (July 2026). Covers everything **outside the logged-in app** — the layer `00-product-shell.md` §1 explicitly disclaims and `architecture/06-service-foundation.md` only stubs.

**Scope:** landing page · sign up / sign in · verification · reset · OAuth · local→account merge · first run · account & session management · legal and trust surfaces · billing · support · operational states.

**Not in scope:** anything inside the shell (that's `00`), pillar content (that's `tabs/*`).

---

## 0. Three constraints that shape everything below

### 0.1 Auth is optional, not a gate ⭐

`CLAUDE.md` locks: **"localStorage is primary; signed-out mode must stay fully functional."**

So **the landing page cannot be a wall.** A student must be able to start using HQ immediately and create an account later to sync. This inverts the normal hierarchy:

- **Primary action: `Start tracking`** — enters the app, no account, data in `localStorage`.
- **Secondary: `Sign in`** — for people who already have an account.
- **Sign-up is a *later* moment**, offered when it earns its keep (a second device, a real amount of data at risk).

**Never block a feature behind an account** except the ones that genuinely require a server: cross-device sync, AI features (proxy holds the keys), Canvas (§4.1-O), shared syllabus parses.

### 0.2 Local → account merge is the hard part (REQUIRED)

If a student logs three weeks of hours signed-out and then creates an account, that data **must survive**. This is the single most likely place to lose user data, and it is not optional.

- **On first sign-in with existing local data:** detect it, say what's there in plain terms (*"You have 4 classes, 61 logged hours, and 38 topics on this device"*), and offer **`Upload this to my account`** as the default.
- **Merge, never silently overwrite in either direction.** If the account already has data, present a **review step** — same discipline as syllabus re-ingestion (`01` §4.1-M): a diff, not a replacement.
- **Never destroy local data before the upload is confirmed complete.** Keep it until the server acknowledges.
- **Conflicts surface for the user to resolve** — never auto-resolved, never "last write wins."
- **Signing out does not delete local data**, and must say so.
- **Reuse the existing versioned-migration discipline** (`CLAUDE.md`: any localStorage schema change needs a versioned, lossless migration). Merge is a migration with two sources.

### 0.3 Every public claim must be true

The landing page and privacy policy are where §6.12 ("say where the data goes") stops being a principle and becomes a commitment. **If the spec says local-only fallback exists, the privacy policy says it, and the code must do it.** Writing these pages is a forcing function — anything hand-waved will surface here.

---

## 1. Landing page (group A)

**One page. Not a marketing site.** A solo project with a five-page funnel reads as fake.

### 1.1 Structure, top to bottom

1. **Hero** — what it is, in one sentence a pre-med recognises. Primary `Start tracking`, secondary `Sign in`. **The independence disclaimer is visible here** (§6.1), not buried.
2. **The honest pitch** — 3–4 things HQ does that nothing else does. Name them concretely: *coursework decay measured against your MCAT date · one hour budget across classes and prep · your own mistakes turned into drills*. **No feature grid, no logos-of-companies-we-integrate-with wall.**
3. **One screenshot or short loop** of the real product. Not an illustration of a product.
4. **What it costs** — even if the answer is "free while in beta." Ambiguity here reads as a trap.
5. **Privacy in one paragraph**, in plain language, linking to the policy. Given HQ handles grades and coursework, this is a selling point, not fine print.
6. **Footer** — Privacy · Terms · Contact · the independence disclaimer again · "beta" status.

### 1.2 Rules

- **No fabricated social proof.** No invented testimonials, no "used by 500 students," no fake star ratings. If there are no users yet, say it's early.
- **No countdown timers, no artificial scarcity, no exit-intent popups.**
- **Public beta is stated plainly**, including what that means (things may change, export your data, expect rough edges).
- **Works with JS disabled well enough to read** — it's a static page.
- **AA contrast, keyboard reachable, both themes.**

---

## 2. Authentication (group A)

### 2.1 Methods

| Method | Notes |
|---|---|
| **Magic link (email)** | **Primary.** Already the locked choice (`CLAUDE.md`: Supabase magic-link auth). No password to forget, no password to breach. |
| **Google OAuth** | Secondary. Least-privilege scopes only — sign-in identity, nothing else. **Calendar/Drive scopes are requested separately, at the moment of use, never bundled into sign-in.** |
| **Email + password** | **RESOLVED July 2026: build it.** Both methods ship. Magic link is the **default option on the screen**; password is secondary, for people who prefer it. Rules: minimum length, breach-list check, **no forced rotation, no composition rules.** Adds four screens — password sign-up, reset request, reset form, change-password in Settings. |

**Why both:** Supabase provides both natively, so this is configuration rather than building auth. The cost is four screens, and it removes "I never got the email" as a hard lockout.

### 2.2 Screens

Sign in · Sign up · Check your email (magic link sent) · Link expired/invalid · Email verification result · Reset password (only if passwords exist) · Signed out confirmation · OAuth error.

**Each one:** single-purpose, no marketing, a way back to the landing page, and a plain-language error state. **Never a bare "something went wrong."**

### 2.3 Rules

- **Enumeration-safe:** the same response whether or not an email exists.
- **Rate-limit** magic-link requests and say so plainly when limited.
- **Links are single-use and short-lived**; expiry is stated on the "check your email" screen.
- **Sessions:** secure, httpOnly, refresh handled server-side. Session length stated in Settings.
- **`Sign out everywhere`** exists.
- **Deep-link preservation:** signing in from a shared link lands on that link, not the home page.
- **Never email anything sensitive** — no grades, no scores, no coursework in transactional email.

---

## 3. First run (group B)

**Resolved account-personalization flow (September 2026).** This is an ownership safeguard inside the signed-in app shell, not the product tutorial.

- **Ask only:** display name (required), major, zero or more minors, and class year. Email is shown read-only from the authenticated identity. Do not ask for School during account setup.
- **Identity confirmation is not skippable.** A signed-in account must choose its own display name before its workspace can be activated; this prevents a new account from inheriting the previous browser user's identity.
- **Account isolation comes first.** A new account begins with a clean account-scoped workspace. Existing device work is never silently assigned to it; the student reviews the merge separately before anything is copied.
- **Everything stays editable later in Profile.** Do not ask for GPA, logged hours, a school list, MCAT timing, or weekly capacity here.
- After setup, enter the working app. Syllabus import remains the first useful Academics action, but it is not a forced continuation of identity setup.
- **The guided walkthrough** (`00` §11a) is offered later, not forced, and is replayable. Lecture-capture help appears after the first transcript rather than on login.
- **Demo data** (`implementation/demo-data.md`) is offered as *"see it populated"* — clearly labelled, separate namespace, reversible.
- **Cold-start discipline applies** (`01` §6.10-A): dormant features say what they need; nothing renders a hollow zero.

---

## 4. Account & session management (group C)

Lives in the account popup → Settings (`00` §2.1).

| Surface | Must include |
|---|---|
| **Account** | Email (change with re-verification) · sign-in method · session list + `sign out everywhere` |
| **Connected accounts** | Google Calendar/Drive · Canvas token · Granola (optional). Each with connect/disconnect, scope explanation in plain language, last-sync, and **revoke that actually deletes the token** |
| **Data** | **Export everything** (`01` §6.9 — complete, visible, machine-readable) · import · local-vs-synced status |
| **Delete account** | See below |

### 4.1 Deletion — the flow that has to actually work

- **Two-step confirm**, typed confirmation, and a plain statement of **what gets deleted and what doesn't**.
- **Offer export first**, in the same flow. Never let someone delete without being shown the door to their own data.
- **Grace period** (e.g. 14 days) before hard deletion, with a way to cancel — and **state the window**.
- **Local data is separate.** Deleting the account does not clear `localStorage` unless the user asks; say which is which.
- **Revoke all third-party tokens** on deletion.
- **Deletion is not a support ticket.** It's a button.

---

## 5. Billing and AI cost (group E)

### 5.1 RESOLVED July 2026 — free during beta, priced from real data

**Do not build billing yet.** Stripe is weeks of work — checkout, webhooks, subscription state, failed payments, dunning, proration — and at beta scale it would protect against a bill Andy can simply pay.

**The sequence:**

1. **Beta is free.** Say so on the landing page, and say that pricing will come later.
2. **Track per-user AI spend server-side from day one.** Cheap to add, impossible to backfill.
3. **Watch a full term**, then price from measured cost rather than an estimate.
4. **Then build Stripe**, with a number that can be defended and a cap known to be generous.

**The one thing that must be right now** (`architecture/06`): **entitlements are designed separately from UI visibility.** Code asks *"is this user entitled to X?"* even while the answer is always `true`. That makes adding billing later **wiring, not surgery**.

### 5.2 Cost shape — for whoever prices this

Order-of-magnitude, per heavy student per month (**verify current provider rates**):

| Line | Rough cost |
|---|---|
| Gap reports · drill generation · study guides · Advisor · embeddings | **~$3–5 combined** |
| **Cloud transcription** (≈12 h audio/wk) | **~$18 — 2–5× everything else** |
| **On-device transcription** (the specced default, `01` §4.1-Q) | **$0** |

**So on-device Whisper is the single most important cost decision in the product**, and it also keeps audio local, which §6.4 already promises. Almost everything else is deterministic and free by design.

**When pricing does happen:** $5–10/month is the credible band — pre-meds already spend $300+ on UWorld and hundreds on third-party full-lengths. **But "unlimited AI" at that price is a promise that cannot be kept**, so a paid tier still needs a generous monthly cap with an honest message at the limit.

### 5.3 Spend protection — REQUIRED before any AI ships ⭐

Two non-malicious things can drain a prepaid balance in a day: **a retry loop in a bug**, and **one enthusiastic user recording every lecture**. Both are normal.

- **Hard spend cap on the provider account.** Configured before the first real key is used.
- **Per-user monthly token budget, enforced in the Edge Function** — not client-side, where it can be bypassed. On hit: a plain message with the reset date. **Never a silent failure, never a degraded answer presented as a normal one.**
- **Maximum two retries on any AI call, ever.** No exponential-backoff loops against a paid endpoint.
- **Log spend per user per day** so the number is visible before it's a surprise.
- **Every AI feature degrades to its deterministic path** when the budget is exhausted — the zero-key rule (`01` §6.3) already guarantees this works.

### 5.4 Standing rules (apply whenever billing exists)

- **Core data ownership and basic tracking stay usable, always.** A student who stops paying keeps their record and can export it. **Never hold someone's own coursework hostage.**
- Gateable: AI features, advanced automation, storage, integrations, shared parses.
- **Pricing page states the free tier's real boundaries.** No "free" that stops working in week two.
- **No dark patterns:** cancellation is self-serve, no more clicks than signup, no retention interstitials.

---

## 6. Legal & trust (group D) ⭐

### 6.1 Independence disclaimer — REQUIRED, and not just a footer line

> **Premed OS is an independent project. It is not affiliated with, endorsed by, or sponsored by the University of North Carolina at Chapel Hill, the AAMC, or any other institution.**

**Where it appears:** landing hero region · footer of every public page · About/Help · anywhere institution-specific data is displayed prominently (the Requirements audit).

**Naming and identity rules (LOCKED July 2026):**

- **"Tar Heel Tracker" is renamed to `Requirements`.** "Tar Heel" is a UNC trademark; a feature named with someone else's mark is the most exposed thing in a product. **Do not reintroduce it, or any UNC mark, in a feature name.**
- **No ram or Rameses imagery.** If a mascot is used it must be **visibly unrelated to any university mascot**. **CORRECTION (Aug 2026):** this bullet previously said *"Confirmed July 2026: none exists"* — **that was wrong.** `src/components/mascot/Ram.tsx` renders `/art/mascot.gif` via `MascotNote.tsx`. It is **live in the app today** and is the thing to replace. It was kept off the public layer in the P1 build (the guided-tour figure is a doctor). Root `CLAUDE.md` has been corrected to match.
- **HQ's palette is its own.** `#4b9cd3` is HQ's academics accent. **Do not describe it as "Carolina blue"** or any institutional colour — the `CLAUDE.md` parenthetical saying so has been removed, because that framing is what creates an impression of affiliation.
- **Institution data is fact, not branding.** Course numbers, credit hours, and requirement names are facts about a curriculum and may be used. **Verbatim catalog prose may not be reproduced wholesale** — same distinction as the syllabus rule (`01` §4.1-M): structure and facts yes, expression no.
- **`Premed OS` name:** run a trademark and domain check before it's load-bearing. **Flagged, not resolved.** The publication boundary and owner checklist are recorded in `../implementation/name-domain-publication-check.md`.

### 6.2 Other required disclaimers

- **AAMC / MCAT** — *"MCAT is a program of the AAMC, which does not sponsor or endorse this product."* (Already required in `02` §3.1; restate here as a global obligation. AMCAS is also AAMC.)
- **Not authoritative** — HQ computes GPA, BCPM, grade projections, readiness, and score bands. Every one is an **estimate to verify** against the student's transcript, AMCAS, and their advisor. This is a standing line wherever a derived number appears, not just in Terms.
- **Community content is opinion** — Atlas's community lore is **Category B**, attributed, dated, and **not official guidance** (`implementation/knowledge-sources.md`). Where it conflicts with AAMC or a university, both are shown.
- **Not medical, legal, or financial advice.**
- **Age floor:** **13**, stated in Terms. **RESOLVED Aug 30, 2026.**

### 6.3 PHI — the under-specced risk, now specified

**Clinical, Shadowing, and Volunteering all have free-text reflection fields.** A student writing *"75yo M, CHF, room 412"* has put patient information into the app. `architecture/06` says "No PHI encouragement" — a principle with no mechanism. The mechanism:

- **One-time notice on the first clinical/shadowing reflection:** *"Write about what you learned, not who you saw. Don't include patient names, dates, room numbers, or anything identifying."* Once, dismissible, never repeated.
- **Placeholder text models the right shape** — *"What surprised you about how the team communicated?"* not an empty box.
- **Soft flag on obvious identifiers** (patterns that look like names + ages + room/MRN numbers) — **a quiet inline note, never a block, never a refusal to save.** The student decides.
- **Never send reflection text to a third-party model without an explicit, contextual disclosure** (§6.12 data residency).
- **HQ is not a compliance product and must not claim to be.** The goal is simply not to hand someone a shovel.

### 6.4 Privacy policy — must match the spec

Written in plain language, and it must state truthfully:

- What's stored locally vs on the server, and that **local-first is real**.
- **What leaves the device and when** — coursework embeddings (`01` §22/§6.3), lecture audio and transcripts (§4.1-Q), Canvas data (§4.1-O), transcription. Each with its **local-only alternative** where one exists.
- **Who the processors are** (Supabase, the LLM provider, the transcription provider) and what each receives.
- **No third-party analytics, no ad tech, no data sale.** Usage instrumentation is local and user-owned (`01` §6 #60) — say that, it's unusual and worth saying.
- **Shared syllabus parses carry no personal data** and cannot, structurally (`01` §4.1-M).
- Retention, export, and deletion, with the grace period stated.
- **A "last updated" date and a changelog** of material changes.

### 6.5 Terms of service

Beta status and no uptime guarantee · acceptable use · **user owns their content; HQ gets only the licence needed to operate** · third-party terms are the user's responsibility (Canvas, Anki, prep providers) · **no scraping and no answer-sharing integrations** (`02` §3.10) · liability limits · **North Carolina governing law** · how changes are communicated.

### 6.6 Content-provenance rules (restated so they're findable in one place)

| Material | Rule | Source |
|---|---|---|
| Syllabi | Share extracted **structure**, never the document or its text | `01` §4.1-M |
| Past exams | Permission status on every entry; `unknown origin` never shared; **not a distribution network** | `01` §4.1-P |
| Lecture recordings | Instructor policy is the student's to observe; prefer the instructor's own posted recording | `01` §4.1-Q |
| Conversations | Consent prompted before recording; notes-only is first-class | `02-atlas` §5 |
| Community lore | **Link and summarise; never republish posts.** Quotes ≤40 words, hard limit | `implementation/research-prompts/community-lore.md` |
| Prep materials | Named and linked, never hosted or reproduced | `02` §2a, §3.10 |
| Grade distributions | Licence confirmed before build, or cut | `01` §6 #62 |

---

## 7. Support & transactional email (group F)

- **Help** (`tabs/13-help.md`) — how-to, the guided tour re-entry, known limitations, changelog.
- **Contact** — one email or form. **Deletion and export never require contacting support.**
- **Transactional email only:** magic link, email change verification, receipts, deletion confirmation. **No marketing email without separate opt-in.** No sensitive data in any of them.

---

## 8. Operational states (group G)

- **Offline** — the app keeps working (local-first); a quiet indicator, not a modal. Sync resumes silently.
- **Sync failure** — surfaces in the bell's system feed, never a modal (`00` §11).
- **Maintenance / degraded** — a banner that says what's affected and what still works.
- **Version + changelog** reachable from Help.
- **Zero-key / no-backend mode fully functional** (`01` §6.3, `02` §3.4) — verified explicitly, not assumed.

---

## 9. Acceptance criteria

- [ ] **Landing page is one page**, states independence from UNC and AAMC **in the hero region and the footer**, shows the real product, states cost and beta status, and contains **no fabricated social proof, countdowns, or exit popups**.
- [ ] **Primary action is `Start tracking`, not `Sign up`.** The app is fully usable signed-out; **no feature is gated behind an account except sync, AI, Canvas, and shared parses.**
- [ ] **Local → account merge:** existing local data is detected and described in plain terms; upload is the default; **merge is a reviewable diff, never an overwrite in either direction**; local data is not destroyed before the server acknowledges; conflicts are user-resolved; **signing out never deletes local data** and says so.
- [ ] **Auth screens** all exist with plain-language errors, enumeration-safe responses, rate limiting, single-use short-lived links, `sign out everywhere`, and deep-link preservation. **No sensitive data in any email.**
- [ ] **Google OAuth requests sign-in scopes only**; Calendar/Drive scopes are requested **separately at point of use**.
- [ ] **First account personalization asks four things at most**: required display name plus optional major, minors, and class year. It is shown inside the authenticated app shell, never asks for School, keeps email read-only, and does not activate the account workspace until device-data ownership has been reviewed.
- [ ] **Delete account** is self-serve, two-step, offers export in the same flow, states the grace period, revokes all third-party tokens, and distinguishes account data from local data.
- [ ] **Export is complete, visible, and machine-readable**, and does not require support.
- [ ] **Both auth methods ship** — magic link (default on screen) and email+password (secondary), with breach-list check, **no forced rotation, no composition rules**.
- [ ] **No billing built during beta.** Landing page says free, and says pricing comes later. **But entitlement checks exist in code** (stubbed `true`), so billing is later wiring rather than surgery.
- [ ] **Per-user AI spend tracked server-side from day one.**
- [ ] **Spend protection before any AI ships:** hard provider-account cap · **per-user monthly budget enforced in the Edge Function, not client-side** · **max two retries on any AI call, ever** · daily per-user spend logged · every AI feature degrades to its deterministic path when the budget is exhausted.
- [ ] **On-device transcription is the default** (`01` §4.1-Q) — it is both the largest cost line and a §6.4 privacy commitment.
- [ ] **Billing never withholds a user's own record.** Cancellation is self-serve with no retention interstitial.
- [ ] **Independence disclaimer** present in hero, footer, Help, and the Requirements audit. **No UNC mark appears in any feature name; no ram imagery; the palette is never described as an institutional colour.**
- [ ] **`Requirements` is the tab name.** "Tar Heel Tracker" appears nowhere — verified by grep.
- [ ] **AAMC disclaimer** wherever MCAT-branded.
- [ ] **"Estimate — verify against your transcript/AMCAS/advisor"** accompanies every derived number (GPA, BCPM, projections, readiness, score bands).
- [ ] **PHI guardrails:** one-time notice on first clinical reflection, placeholders that model de-identified writing, **soft inline flag on obvious identifiers that never blocks saving**, explicit disclosure before reflection text reaches any third-party model.
- [ ] **Privacy policy matches the build** — states local-first truthfully, names every processor, lists what leaves the device and its local-only alternative, states **no third-party analytics and no data sale**, and carries a last-updated date.
- [ ] **Terms** cover beta status, content ownership, third-party responsibility, and the no-scraping rule.
- [ ] **Offline works; sync failure is never a modal; zero-key mode verified explicitly.**
- [ ] AA light + dark, keyboard + focus + reduced-motion on every public page; `npm run build` passes.

---

## 10. Open — needs a decision or a check

1. **`Premed OS` trademark + domain check.** Flagged, unresolved.
2. ~~Password auth~~ — **RESOLVED: build both** (§2.1).
3. ~~Free-tier boundary~~ — **RESOLVED: free during beta, priced from measured usage after a full term** (§5.1). Still open *later*: the eventual price point and cap size, decided from real data.
4. ~~Age floor in Terms~~ — **RESOLVED Aug 30, 2026: 13.**
5. ~~Governing law in Terms~~ — **RESOLVED Aug 30, 2026: North Carolina.**
6. **Whether HQ ever supports a second institution** — the Requirements dataset is UNC-only by design (`01` §12: do not add multi-institution logic). If that changes, this spec's institution rules generalise.
7. **Not a lawyer.** Everything in §6 is a list of things to have reviewed, not legal advice.
