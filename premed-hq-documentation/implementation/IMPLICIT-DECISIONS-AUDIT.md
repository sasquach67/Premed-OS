# Implicit decisions audit — Premed OS

**Read-only audit, Aug 2026.** No code was modified. Every item below is a product decision the
codebase has already made on Andy's behalf. Working code is not treated as evidence the decision
is right.

**37 findings — P0: 7 · P1: 14 · P2: 12 · P3: 4**

---

## First, the thing that prompted this

Your question assumed premedOS has a **Create Study Guide** button and a **flashcard export**, and
asked whether pressing it sends a rich generation recipe or a bare `"create a study guide"`.

**Neither. Those features do not exist.** The entire AI surface in this codebase is one feature:
**gap-check**, in `AcademicRecallSession`. You write a free-recall answer from memory, and a model
compares it against your own uploaded course material and returns covered / missed / wrong plus a
suggested FSRS grade.

There is exactly one other thing that calls itself generation — `aiPracticeService` — and it makes
no network call at all. It emits hardcoded placeholder strings (see **A8**). It is wired to a live
**Generate practice exam** button.

So the answer to "can I control how it's built" is: **there is nothing to control yet, and the one
prompt that does exist is three sentences long with no pedagogical instruction in it whatsoever**
(**A2**). The good news is your instinct is exactly right and the architecture already supports it —
`supabase/functions/study-tools/index.ts` is your backend, the system prompt is a string literal in
it, and adding a format-preset system is a contained change. **A2** is where to spend the effort.

---

# P0 — release blockers

## A8 · The practice-exam generator ships fabricated questions as real records

**1. Location** — `src/services/aiPracticeService.ts`, surfaced by `PracticeExamGenerator` in
`ClassCenter.tsx:1811`.

**2. Current behavior** — A **Generate practice exam** button is live in the class hub. It produces
questions from string templates: `"Which option best explains ${topicLabel} in a test-style
scenario?"` with choices `"A correct application of X"`, `"A tempting but incomplete statement about
X"`. `correctAnswer: choices?.[0]` — **the answer is always option A**, unshuffled. The explanation
field literally begins `"Placeholder rationale:"`. These are saved as real `PracticeExam` and
`PracticeQuestion` records with `status: 'draft'`, indistinguishable in storage from real content.
The dialog subtitle says "Local placeholder generator for now" — one line of small text under a
button labelled *Generate practice exam*.

**3. Assumption** — That a disclaimer in a dialog subtitle is sufficient consent for writing
fabricated study content into a student's permanent record, and that "draft" status is understood
by users as "fake."

**4. Why it matters** — This is a pre-med study tool. A student can generate a set, come back in
three weeks, and study answers that are content-free by construction — and the always-A pattern
actively trains a wrong test-taking heuristic. It also poisons the FSRS review data derived from it.

**5. Alternatives** — (a) Remove the button until a real generator exists. (b) Keep it behind a dev
flag. (c) Keep it but never persist — render ephemeral, no save. (d) Persist but stamp
`owner: 'placeholder'` and refuse to show it in study/review surfaces.

**6. Consequences** — (a) Loses nothing real; the feature does not work. (b) Same, plus you keep the
seam for testing. (c) Users can preview the shape without corrupting data. (d) Most work, and still
leaves fabricated content in the store where a future migration or export will surface it.

**7. Recommended** — **(a) Remove the button.** `assertGenerationAllowed` and the request/response
types are the valuable part and should stay as the backend seam. Shipping a *Generate* button that
generates nothing is worse for beta trust than not having the feature.

**8. Severity — P0.**

---

## A5 + A6 · The grounding guarantee has two holes, and one is provider-dependent

**1. Location** — `supabase/functions/study-tools/index.ts` — `citationSchema` (`kind: 'general'`),
`validateResult()`, and `callOpenAI()`.

**2. Current behavior** — Two things:

- Every gap-check item carries a citation that is *either* `{kind:'material', fileId, chunkId,
  start, end}` — validated hard against the real chunk offsets — *or* `{kind:'general'}`, which
  requires nothing and is accepted unconditionally (`if (citation.kind === 'general') continue`).
- The Anthropic path collects `trustedCitations` from the API's own citation blocks and requires
  every claimed offset to match one. **`callOpenAI` returns `trustedCitations: undefined`**, and
  `validateResult` skips the whole cross-check when it is undefined. Flipping `AI_PROVIDER=openai`
  silently downgrades from "the provider attested this span" to "the model typed plausible numbers."

**3. Assumption** — That an uncited "general knowledge" claim is an acceptable output of a feature
whose entire premise is *checked against your own materials*, and that the two providers offer
equivalent guarantees.

**4. Why it matters** — This is the one place premedOS tells a student *you got this wrong*. A
`general` item is an unverifiable model assertion rendered in the same list as a verified one. A
pre-med who trusts a hallucinated "missed" item studies a fact their professor never taught. The
provider asymmetry means the same UI makes a materially weaker promise depending on an env var
nobody in the UI can see.

**5. Alternatives** — (a) Drop `general` from the schema; material citations only. (b) Keep it but
render it in a visibly distinct, de-emphasised group with explicit "not from your materials"
labelling. (c) Keep `general` for `covered` only (harmless) and forbid it in `missed`/`wrong` (the
consequential ones). (d) For the provider gap: make OpenAI's structured output carry citations, or
refuse to run the feature on a provider that cannot attest spans.

**6. Consequences** — (a) Strictest, may lose genuinely useful context; a real gap that spans two
chunks becomes uncitable. (b) Preserves usefulness, shifts the judgment to the student — but only
works if the visual distinction is loud. (c) Good balance: the grading-relevant half stays
verifiable. (d) Removing the provider fork is simplest; two providers with two guarantee levels is
a fork you will forget you have.

**7. Recommended** — **(c) + (d)**: forbid `general` in `missed` and `wrong`, label it in `covered`,
and either bring OpenAI to citation parity or delete the OpenAI path. Then say the promise out loud
in the UI.

**8. Severity — P0.**

---

## B1 · The merge screen silently discards several collections

**1. Location** — `src/pages/public/MergePage.tsx`, `AREAS` and `applyReview()`.

**2. Current behavior** — `applyReview` starts from `{ ...cloud }` and overwrites only the fields
listed in `AREAS` for areas the user ticked. `AREAS` covers 18 of `AppData`'s keys. `DATA_KEYS` in
`store.ts` lists 27. The difference — **`notes`, `notePages`, `captures`, `resources`, `tips`,
`advisingQs`, `trash`, `meta`, `settings`** — is never shown, never offered as a choice, and always
silently takes the cloud's value. `notes`, `notePages` and `captures` are free-text the user wrote.

**3. Assumption** — That the six areas shown are the only ones worth reconciling, and that anything
not conflict-worthy is not loss-worthy.

**4. Why it matters** — The merge screen exists specifically because "last write wins" was judged
unacceptable (`05` §0.2, cited in `useCloudSync.ts`). For a third of the data tree it is still last
write wins, on a screen whose whole job is to promise otherwise. A user who wrote notes signed out
and then signs into an older account loses them with no warning and no undo — `replaceAll` runs
after the server write, so there is no local copy to recover from.

**5. Alternatives** — (a) Add the missing collections as reviewable areas. (b) Union-merge the
unlisted collections by id instead of taking cloud wholesale. (c) Keep the six areas but show a
"also on this device, not reviewed: 14 notes, 3 captures" line with an all-or-nothing toggle.
(d) Block the merge if unlisted collections are non-empty on both sides.

**6. Consequences** — (a) Honest, but a 12-row review screen is a screen nobody reads. (b) Best
outcome for the user; needs per-record ids and a duplicate story for records edited on both sides.
(c) Cheapest honest fix — surfaces the loss without a wall of choices. (d) Safe, but strands users
in a state with no obvious exit.

**7. Recommended** — **(b) for id-bearing collections** (`notePages`, `captures`, `resources`,
`tips`, `advisingQs` are all arrays with ids — union by id, newest `updatedAt` wins per record),
**plus (c)** for `notes` and `settings`, which are objects and cannot be unioned safely.

**8. Severity — P0.** Silent user-authored data loss on an explicitly consent-gated screen.

---

## C1 · Deleting a class hard-deletes seven collections with no trash and no undo

**1. Location** — `src/components/academics/ClassCenter.tsx:494`.

**2. Current behavior** — `window.confirm("Delete BIOL 103?")` → on OK, filters the course out of
`draft.courses` and then deletes every matching row from `workspaces`, `topics`, `notes`,
`assignments`, `files`, `contacts`, and `weakAreas`. It calls `updateAll` (the generic escape
hatch), **not** `softDeleteItems` — so nothing enters `s.trash`, nothing enters
`meta.recoveryStack`, and there is no undo toast. The confirm text names only the course.

**3. Assumption** — That "delete this class" means "delete the class and everything anyone ever
wrote inside it," and that the user knows this from a dialog that mentions only the course code.

**4. Why it matters** — The app has an elaborate two-tier safety net — soft delete to `trash`, plus
a 30-deep `recoveryStack` with undo — and the single most destructive action in the product routes
around both. A semester of class notes, every uploaded file record, every topic's FSRS memory state,
and the professor's contact details vanish on one OK. `TrashRecovery.tsx` will show nothing,
correctly, which is the worst possible confirmation.

**5. Alternatives** — (a) Route through `softDeleteItems` for all eight collections, one recovery
entry. (b) Keep the hard delete but enumerate the blast radius in the dialog ("also deletes 47
topics, 12 notes, 9 assignments…") and require typing the course code. (c) Archive-only — no delete
path for classes at all; `onArchive` already exists two lines below. (d) Cascade to trash but
restore-as-a-unit.

**6. Consequences** — (a) Consistent with the rest of the app, and trash grows — see **B5**. (b)
Honest but still irreversible; typing-to-confirm is friction that buys nothing if the user meant it.
(c) Safest, and archiving is what most users actually want; leaves no way to clear a genuine mistyped
entry. (d) Best UX, most work — needs a grouped trash entry concept that does not exist.

**7. Recommended** — **(a) now, (d) later.** At minimum stop bypassing the safety net that the rest
of the app is built on. `DependencyConfirmDialog` already exists and should be doing this work.

**8. Severity — P0.**

---

## D1 · Every new user starts with Andy's course plan

**1. Location** — `src/data/seed.ts` (header: *"Andy's personalized starting data"*), via
`createInitialData()` in `store.ts:50`.

**2. Current behavior** — On first load, a user with no data gets `createSeedData()`: a specific UNC
Neuroscience B.S. plan, 13 named AP/transfer credit rows, a locked Fall 2026 schedule (PSYC 101,
NURS 50, BIOL 103, ENGL 105, IDST 101, IDST 111L), the UNC Tar Heel Tracker requirement set with
`catalog.unc.edu` source links, UNC HPA prerequisites, and UNC residency/GPA graduation rules. There
is no blank-start path. `resetToSeed()` — the "Reset all data" button in Settings and the error
boundary's recovery — restores *this same UNC plan*, not an empty state.

**3. Assumption** — That "the app opens already personal, not blank" (seed.ts header) is the right
onboarding for a public beta, and that a demo dataset and a default dataset are the same artifact.

**4. Why it matters** — Three separate problems. (i) A non-UNC user sees a competitor school's
degree requirements presented as *their* requirements, with authoritative-looking catalog citations.
(ii) `hasLocalWork()` gates the merge screen on whether the device has data — seeded rows may make
every fresh device look like it has "local work," firing the merge flow spuriously. (iii) It
directly contradicts the non-affiliation position in `05` §6, which the footer disclaimer, the
mascot ban, and the accent-colour naming rules all exist to protect. The product says "not
affiliated with UNC" in the footer of a page whose requirements tracker is the UNC catalog.

**5. Alternatives** — (a) Ship blank with an empty-state that invites the first class. (b) Ship
blank + an optional "load a sample plan" button that stamps everything as sample data. (c) Keep
seeding but make it school-agnostic (generic pre-med prereqs, no institution). (d) Ask for school
during onboarding and seed from a small catalog of templates.

**6. Consequences** — (a) Cleanest and most honest; the app's empty states already exist and are a
stated design requirement. Costs the "wow, it's already full" first impression. (b) Keeps the demo
value and makes it opt-in and labelled — `demoSeed.ts` and `stampDemoNamespace()` already do exactly
this and could be reused. (c) Useful to everyone, accurate for nobody, and prereq lists genuinely
vary by school. (d) Best long-term, real content work per school, wrong size for beta.

**7. Recommended** — **(b).** The demo-namespace machinery is already built; point the public
default at empty and the sample plan at `demoSeed`. Also split `resetToSeed` into *reset to empty*
and *reload sample* — right now the error boundary's recovery hands a stranger a UNC plan.

**8. Severity — P0** for public beta. P3 while it is your personal tool.

---

## E1 · Gap-check uploads your course material to the server with no disclosure and no delete path

**1. Location** — `src/pages/AcademicRecallSession.tsx:178`, `mirrorLocalSources()` in the edge
function, `academic_source_chunks` in `20260727_d6_ai_coverage.sql`.

**2. Current behavior** — Pressing the gap-check button sends up to 24 chunks of the raw text of
your class materials to Supabase, where `mirrorLocalSources` **upserts them into a permanent table**
along with OpenAI embeddings. The comment says "mirrored only when the user explicitly runs the
gap-check" — but running the gap-check is not consent to persistent server-side storage, and nothing
in the UI says it happens. There is **no deletion path**: deleting the file locally, deleting the
course (**C1**), or clearing localStorage leaves the chunks on the server indefinitely. There is no
account-deletion flow anywhere in the app. RLS is correct and `on delete cascade` from `auth.users`
works — but only if a user is deleted, which nothing in the product can do.

**3. Assumption** — That "localStorage is canonical" (the stated architecture) makes the server copy
a cache rather than a record, and therefore not something the user needs told about or control over.

**4. Why it matters** — This is the one place the local-first promise is not true, and it is the
place where the most sensitive content lives: lecture notes, possibly copyrighted slide text,
possibly a professor's unpublished material. `PrivacyPage.tsx` exists and is linked from the footer;
if it does not describe this table it is inaccurate. A beta user who reads "your data stays in your
browser" and then finds their lecture notes in a Postgres table has a legitimate complaint.

**5. Alternatives** — (a) Disclose at the point of action — a one-time explainer before the first
gap-check, with a persisted acknowledgement. (b) Ephemeral only: retrieve, call the model, delete
the chunks in the same request; no embeddings cache. (c) Keep the mirror but add a real lifecycle —
delete chunks when the source file/course is deleted, a TTL, and a "delete my study material from
the server" control in Settings. (d) Keep as-is and document it in the privacy page.

**6. Consequences** — (a) Cheapest honest fix; does not solve retention. (b) Strongest privacy
posture, loses the embedding cache so every check re-embeds (cost + latency). (c) Correct and
complete; most work, and the cascade needs wiring into the delete paths that **C1** shows are
already inconsistent. (d) Legally minimal, and users do not read privacy pages.

**7. Recommended** — **(a) + (c).** Disclose at first use, and make deletion actually delete. Add a
Settings control before beta; without one you have no answer to "delete my data," which is a
request you will get.

**8. Severity — P0** for beta.

---

## B5 · Trash never empties, inside a store with a hard size ceiling

**1. Location** — `store.ts` — `softDeleteItems` / `removeItem` push to `s.trash`;
`permanentlyDeleteTrashItems` is the only removal and is manual. `meta.recoveryStack` is capped at
30 (`store.ts:492`); **`trash` has no cap and no TTL**. `trash` is in `DATA_KEYS`, so it persists to
localStorage and syncs to Supabase.

**2. Current behavior** — Every soft-deleted record is stored **in full** forever, in the same
localStorage blob as live data, and is uploaded on every cloud push. A user who imports and cleans
up a large course list carries every discarded row indefinitely.

**3. Assumption** — That users will manually empty trash, and that the dataset is small enough that
unbounded retention never reaches the 5–10 MB localStorage ceiling.

**4. Why it matters** — The failure mode is silent and catastrophic. `zustand/persist` writes on
every mutation; when the quota is hit the write throws, and the codebase's established pattern is to
swallow quota errors (`useCloudSync.ts:29`, `publicLayer.ts:78`). The app keeps running against
in-memory state that is no longer being saved. The user finds out on reload. The cloud copy also
stops advancing because `contentSignature()` still changes, pushes still fire, but the local
canonical copy is stale.

**5. Alternatives** — (a) Cap trash at N entries, FIFO, like `recoveryStack`. (b) TTL — auto-purge
after 30 days, which is what users expect from the word "trash." (c) Exclude `trash` from the cloud
push and keep it device-local. (d) Store a tombstone (id + collection + label) rather than the full
record.

**6. Consequences** — (a) Simple and consistent with the existing cap; an unlucky bulk delete can
evict something the user wanted. (b) Matches the mental model; needs a visible "deletes in 30 days"
label or it is its own silent loss. (c) Shrinks the sync payload but makes cross-device restore
impossible. (d) Smallest footprint, and restore becomes impossible — defeats the point.

**7. Recommended** — **(b) with a visible countdown, plus (a) as a hard backstop.** Separately, and
independently of this: **stop swallowing quota errors.** A failed persist must surface. That is
arguably its own P0.

**8. Severity — P0.**

---

# P1 — important before beta

## A2 · The gap-check prompt is three sentences with no pedagogical specification

**1. Location** — `callAnthropic()` `system` array, `supabase/functions/study-tools/index.ts:183`.

**2. Current behavior** — The entire instruction set is:

```
Compare recall only against the supplied topic sources. Never invent a source or offset.
Reply with a single JSON object and nothing else — no prose, no markdown fences.
It must match this JSON Schema: {…}
```

Two sentences of behavior and one of formatting. Nothing about what counts as "covered" versus
"partially covered," how granular an item should be, whether to reward mechanism over recall of
isolated facts, what makes something worth flagging as `wrong` versus a harmless imprecision, how to
phrase feedback to a student, or how `suggestedGrade` should be derived. The OpenAI path's prompt is
even thinner — a single interpolated line.

**3. Assumption** — That a model's default notion of "compare these two texts" matches premedOS's
pedagogy, and that output *shape* is the only thing worth constraining.

**4. Why it matters** — This is the whole substance of your original question. Everything a student
experiences as the product's teaching voice is currently the model's untuned default. Two
consequences: quality is unpredictable and unversioned (a provider model update silently changes how
your app teaches), and **you have no control surface** — there is nowhere for a "concise vs thorough"
or "mechanism-first" preference to live, because there is no structured prompt for it to modify.
The `suggestedGrade` problem in **A7** is downstream of this: the model is picking an FSRS grade with
zero guidance on what `hard` versus `good` means.

**5. Alternatives** — (a) Write one strong opinionated house prompt, no user control. (b) House
prompt + named presets (e.g. *strict* / *balanced* / *encouraging*; *concise* / *thorough*) selected
per session or in Settings. (c) Presets plus a free-text "style notes" field appended to the system
prompt. (d) Leave as-is and tune later.

**6. Consequences** — (a) Biggest single quality win for the least work, and it makes the product
*have a pedagogy* rather than inherit one. (b) The right shape for what you described wanting; each
preset is a maintained artifact and needs evaluating, not just writing. (c) Maximum flexibility,
and free text into a system prompt is an injection surface and an unbounded support burden — a user
can write "always say I got everything right." (d) Ships a teaching product whose teaching is
accidental.

**7. Recommended** — **(a) now, (b) next.** Write the house prompt as a versioned constant with an
explicit rubric for each of `covered`/`missed`/`wrong`/`suggestedGrade`, stamp the version onto
stored results so you can tell which prompt produced which feedback, then add 2–3 presets. Your
instinct in the original question — that the button should trigger a *recipe*, not a command — is
correct and this is where it goes. **Do not build presets before the house prompt exists**; you
cannot evaluate a variant without a baseline.

**8. Severity — P1.** Not a blocker because the feature is honest about what it does; it is the
highest-leverage item in this document.

---

## A7 · The model proposes a grade that rewrites the user's long-term review schedule

**1. Location** — `suggestedGrade` in the result schema; `AcademicRecallSession.tsx:523` renders it
as a badge; `lib/academics/fsrs.ts` consumes grades.

**2. Current behavior** — Gap-check returns one of `again|hard|good|easy`, shown as a
"Suggested grade" badge. The student then grades themselves. The FSRS state that drives every future
review date for that topic is updated from the grade that gets committed.

**3. Assumption** — That an anchoring suggestion is helpful, and that the distinction between
"suggested" and "applied" survives contact with a tired student at 1am.

**4. Why it matters** — FSRS is a compounding system: one wrong `easy` pushes a topic weeks out and
the student does not see it again before the exam. The model has **no rubric** for this mapping
(**A2**) — nothing tells it what separates `hard` from `good`. And a labelled suggestion is a strong
anchor; most users will take it. The app is effectively letting an unrubriced model judgment set
study schedules while presenting it as the student's own call.

**5. Alternatives** — (a) Remove `suggestedGrade`; show the gaps and let the student grade. (b) Keep
it but give the model an explicit rubric tied to your review policy. (c) Show it only *after* the
student has picked, as a second opinion, with disagreement surfaced. (d) Auto-apply it (current
direction of travel if the badge becomes a button).

**6. Consequences** — (a) Loses a genuinely useful signal — the model has just read the gaps and
does have relevant information. (b) Makes the suggestion defensible and testable, does not fix
anchoring. (c) Best epistemics: preserves self-assessment (which is itself the learning mechanism in
free recall) and still delivers the signal; costs one extra interaction. (d) Fastest, and hands
schedule control to the least accountable component.

**7. Recommended** — **(c) + (b).** Grade first, then reveal. Free recall works *because* the
student judges themselves; showing the answer key before they commit removes the mechanism the
feature exists to exploit.

**8. Severity — P1.**

---

## A12 · Retrieval silently degrades to "the first 24 chunks" with no embedding key

**1. Location** — `retrieveChunks()`, `supabase/functions/study-tools/index.ts:121`.

**2. Current behavior** — If `OPENAI_EMBEDDING_API_KEY` is set, retrieval is semantic (pgvector,
top 12 by cosine). If it is absent — or the embeddings call fails, or returns non-array — it falls
through to `.order('created_at').limit(24)`: the 24 oldest chunks in the topic, in upload order,
regardless of what the student wrote. Same button, same UI, no signal. The comment calls this a
"fail-safe path," which it is for correctness and is not for quality.

**3. Assumption** — That degraded retrieval is preferable to no feature, and that the user does not
need to know which one ran.

**4. Why it matters** — On a topic with more than 24 chunks the fallback may not include the
material the student's answer is actually about, producing confident "you missed this" items drawn
from an arbitrary slice, and — worse — *silence* about real gaps in unretrieved chunks. Absence of
a "missed" item reads as confirmation. The two modes produce feedback of very different reliability
under one label.

**5. Alternatives** — (a) Require embeddings; fail loudly without them. (b) Keep the fallback but
label the result ("checked against 24 of your 61 sources, in upload order"). (c) Improve the
fallback with deterministic keyword overlap instead of `created_at`. (d) Cap the fallback to topics
small enough for full coverage and refuse above that.

**6. Consequences** — (a) Simplest guarantee; makes the feature dependent on a second vendor.
(b) Honest and cheap; still ships weak results, just labelled. (c) Materially better with no new
dependency — BM25-ish scoring over chunk text is not hard. (d) Predictable and correct, and silently
disables the feature for exactly the heavy users who need it.

**7. Recommended** — **(c) + (b).** Never let two retrieval qualities wear the same label. **A11**
(the `.slice(0, 24)` truncation on the client, `AcademicRecallSession.tsx:186`) is the same problem
one layer up and should be fixed together.

**8. Severity — P1.**

---

## A4 · AI rate limits are hardcoded server-side and invisible in the UI

**1. Location** — `claim_ai_request(p_hour_limit => 20, p_day_limit => 100)`, called at
`index.ts:57`. Surfaced as a generic "AI usage limit reached. Try again later."

**2. Current behavior** — 20 gap-checks per hour, 100 per day, per user, enforced atomically in
Postgres (the implementation is good). The numbers are call-site literals. Nothing in the UI shows
remaining quota, when it resets, or that a limit exists at all until you hit it.

**3. Assumption** — That 20/hour is beyond normal use, that all users get the same allowance
forever, and that discovering the limit by being blocked is acceptable.

**4. Why it matters** — A student cramming the night before a final is exactly the person who runs
20 checks in an hour, and exactly the person for whom "try again later" is useless. The message does
not say *when*. There is also no tier concept, so if premedOS ever charges, the limit has to move
from a call-site literal into a per-user policy — a change that touches the RPC signature.

**5. Alternatives** — (a) Show remaining quota in the UI and the exact reset time. (b) Move limits
into a per-user `ai_limits` row so they can be raised individually and tiered later. (c) Raise the
hourly limit and rely on the daily cap. (d) Soft-limit: warn at 80%, keep serving.

**6. Consequences** — (a) Costs nothing, removes the entire surprise. (b) Right shape for a product
with plans; premature if premedOS stays free. (c) Trades cost exposure for fewer false blocks; you
have no telemetry (**E5**) to know what real usage looks like. (d) Friendliest, and uncapped spend is
a bad property for a solo-run beta.

**7. Recommended** — **(a) now** — at minimum return the reset timestamp and render it — **and (b)
before any paid tier.** Also: decide the limit against a real cost model rather than a round number.

**8. Severity — P1.**

---

## A3 · Model, provider, effort and token budget are undeclared env-var defaults

**1. Location** — `index.ts:71–77`, `index.ts:254`.

**2. Current behavior** — `AI_PROVIDER` defaults to `anthropic`; `ANTHROPIC_MODEL` defaults to
`claude-opus-5`; `OPENAI_MODEL` defaults to `gpt-4.1-mini`; `output_config.effort` is a hardcoded
`medium`; `max_tokens` is 8000 covering both thinking and output. Nothing is recorded on the result,
so a stored gap-check does not know what produced it.

**3. Assumption** — That the deployment environment is always configured deliberately, and that a
missing env var should fall back to the most expensive model rather than fail.

**4. Why it matters** — Opus-tier as an *unset-variable default* is a cost surprise waiting to
happen — a fresh deploy that forgets the var runs the expensive path silently. The OpenAI default is
a much weaker model, so the fork is not just about citations (**A6**) but about capability. And with
no version stamp you cannot answer "did this change because I changed the prompt, or because the
model moved."

**5. Alternatives** — (a) Fail closed — no explicit config, no feature. (b) Default to the cheaper
model and opt into the expensive one. (c) Keep defaults, stamp provider+model+prompt version onto
every stored result. (d) Pick one provider and delete the fork.

**6. Consequences** — (a) Safest for cost, worst for a first deploy. (b) Predictable spend, quality
depends on whether the cheap model can hold the citation contract. (c) No behavior change, makes
everything else diagnosable — the enabling change for evaluating **A2**. (d) Halves the surface you
have to reason about; **A6** already argues the fork is a liability.

**7. Recommended** — **(c) + (d).** Stamp provenance on results, then pick a provider. Two providers
with different guarantees, different capability, and no stamped output is three unknowns stacked.

**8. Severity — P1.**

---

## B2 · Cloud reconcile is whole-blob newest-wins after the first sign-in

**1. Location** — `reconcile()` in `useCloudSync.ts:87`.

**2. Current behavior** — The merge screen runs once per user (`hasSeenMerge`). After that, every
sign-in reconciles by comparing `remoteAt` to the locally-stored `lastSyncAt` and replacing the
entire dashboard with whichever is newer. There is no field-level merge and no conflict detection.

**3. Assumption** — That after one explicit merge, one device is authoritative at a time, and that
timestamp ordering is a safe proxy for intent.

**4. Why it matters** — Two devices used the same day is the normal case for a student (laptop in
class, phone at a shift). Work on device B while device A is open, then let A push on its 4-second
debounce, and B's work is gone with no notification and no trash entry. The comment in the same file
explicitly identifies newest-wins as "exactly the 'last write wins' the merge rules forbid" — and
then ships it for every sign-in after the first.

**5. Alternatives** — (a) Per-collection `updatedAt` and merge by record. (b) Detect divergence
(both changed since `lastSyncAt`) and re-show the merge screen. (c) Keep newest-wins but snapshot
the losing copy into trash/recovery first. (d) Realtime subscription so devices converge instead of
racing.

**6. Consequences** — (a) Correct, and a significant refactor — records need reliable `updatedAt`,
which many currently lack. (b) Reuses a screen you already built; the trigger condition is cheap to
compute and the screen already handles the shape. (c) Cheapest safety net; recovers data without
solving the race, and trash growth (**B5**) makes it worse. (d) Best experience, largest change,
needs a conflict story anyway.

**7. Recommended** — **(b) now, (a) eventually.** Divergence detection is a handful of lines against
infrastructure that already exists, and it converts silent loss into a decision.

**8. Severity — P1.**

---

## B6 · localStorage write failures are swallowed

**1. Location** — `useCloudSync.ts:29` (`catch { /* ignore quota */ }`), `publicLayer.ts:78`, and
`zustand/persist`'s default failure handling — no `onRehydrateStorage` error path is registered.

**2. Current behavior** — When localStorage is full, in private-browsing mode, or blocked by
cookie/storage policy, writes fail and the app continues against in-memory state. Nothing warns.

**3. Assumption** — That storage failure is rare, transient, and not worth interrupting for.

**4. Why it matters** — localStorage is described throughout this codebase as *the canonical store*.
A canonical store that silently stops accepting writes is the most dangerous failure the product can
have — everything looks normal for an entire session and is gone on reload. Safari's ITP evicts
localStorage after 7 days of no interaction; private mode has a much lower quota. This is not exotic.

**5. Alternatives** — (a) Detect on boot with a write probe and show a persistent banner. (b) Catch
the persist failure and surface a blocking modal offering JSON export. (c) Fall back to IndexedDB.
(d) Force sign-in when local persistence is unavailable so the cloud is canonical.

**6. Consequences** — (a) Catches the blocked/private case early, misses quota exhaustion mid-session
(which is the **B5** case). (b) Catches the real case at the real moment; needs a plumbed error path
through the persist middleware. (c) Much larger ceiling and a real migration with a versioned,
lossless path — which `CLAUDE.md` requires. (d) Contradicts the signed-out-must-work rule.

**7. Recommended** — **(a) + (b).** Whatever else changes, a failed write to the canonical store must
never be silent.

**8. Severity — P1.**

---

## C4 · Deletions do not propagate across devices

**1. Location** — `permanentlyDeleteTrashItems` (`store.ts:572`) combined with `reconcile()`.

**2. Current behavior** — Permanent deletion removes the entry from the local `trash` array. There
is no tombstone. Because sync replaces the whole blob by timestamp, a device that has not synced
since before the deletion will, if it happens to be newer on some other edit, push the record back.

**3. Assumption** — That whole-blob replacement makes tombstones unnecessary.

**4. Why it matters** — Only true if newest-wins always resolves correctly, which **B2** shows it
does not. Records the user deliberately destroyed reappearing is a specific and serious trust
failure — worse than ordinary sync loss, because the user made an explicit decision and the app
undid it. For a student who deleted something for a reason (a withdrawn class, a contact they no
longer want listed), this is not a nuisance.

**5. Alternatives** — (a) Keep a `deletedIds` tombstone list, honoured on merge. (b) Solve via
per-record merge (**B2 (a)**), which needs tombstones anyway. (c) Delete server-side immediately so
the cloud copy cannot resurrect. (d) Accept it and say so.

**6. Consequences** — (a) Small, targeted, and grows unboundedly unless capped — the same trap as
**B5**. (b) Right architecture, larger job. (c) Only helps the device that is online at deletion
time. (d) Not viable for records a user deleted for privacy reasons.

**7. Recommended** — **(a) with a TTL**, folded into the **B2** work.

**8. Severity — P1.**

---

## E2 · No account or data deletion path

**1. Location** — Absent. `Settings.tsx` has export, import, and reset-to-seed. `PrivacyPage.tsx`
exists as copy. No delete-account flow, no server-data purge.

**2. Current behavior** — A user can clear their browser. They cannot delete their `dashboards` row,
their `academic_source_chunks` (**E1**), or their `ai_usage_buckets`. Sign-out ends the session and
leaves everything server-side.

**3. Assumption** — That a local-first product does not need a deletion story because the "real"
data is local.

**4. Why it matters** — Untrue the moment a user signs in, and doubly untrue given **E1**. This is
a table-stakes expectation for anything with an account, a near-certain beta support request, and a
compliance requirement in several jurisdictions for a product aimed at students. It is also
straightforward: `on delete cascade` from `auth.users` already exists on both tables, so the schema
is ready and only the flow is missing.

**5. Alternatives** — (a) Settings → "Delete my account and all server data," typed confirm, export
offered first. (b) Email-request process. (c) Delete server data but keep the auth user. (d) Defer.

**6. Consequences** — (a) Correct and mostly wired already; needs an edge function with the service
role since clients cannot delete auth users. (b) Works at beta scale, does not scale and is easy to
drop. (c) Half-measure that leaves an account the user believes is gone. (d) Ships a product with no
answer to a question you will be asked.

**7. Recommended** — **(a).** Pair it with the **E1** disclosure — the same screen should say what is
stored and offer to destroy it.

**8. Severity — P1.**

---

## F3 · There is no notification system of any kind

**1. Location** — Absent by omission. `Settings` has no notification block. The attention model
(`components/layout/attention.ts`) is in-app only, driving a bell, a status chip and the review
queue. `attentionSnoozedUntil` is the only related preference.

**2. Current behavior** — Deadlines, overdue tasks, letter follow-ups and stale-experience nudges
are computed correctly and are visible **only while the app is open**. No email, no push, no
calendar write-back (`googleCalendar.ts` is `calendar.readonly`), no digest.

**3. Assumption** — That premedOS is a place you go, not a thing that reaches you — and, since it
was never specified, that the absence is a decision.

**4. Why it matters** — The product's core value claim is not losing track of a multi-year process.
A deadline system that only fires when you are already looking inverts that: it helps precisely the
users who did not need help. "Overdue by 3 days" is computed faithfully and shown to someone who
found out by opening the app. This is arguably the largest unexamined product decision in the
codebase, and it is invisible because nothing implements it.

**5. Alternatives** — (a) Stay in-app; position premedOS as a workspace. (b) Email digest (daily or
weekly) from a scheduled Supabase function. (c) Web push. (d) Write deadlines into Google Calendar —
upgrade the existing read-only scope and let the user's existing reminders do the work.

**6. Consequences** — (a) Legitimate and needs saying out loud, because the roadmap and the copy
should stop implying otherwise. (b) Highest value per unit work; needs consent, unsubscribe, and
sending infrastructure. (c) Timely, poor support on iOS web, needs a permission prompt users decline.
(d) Elegant — meets students where reminders already live — and needs a write scope, which is a
meaningfully larger consent ask.

**7. Recommended** — **Decide explicitly, then (b).** A weekly digest is small, and the attention
model already produces exactly the right payload. But the decision to make is the positioning one:
if premedOS never reaches out, say so in the product copy.

**8. Severity — P1** as an unmade decision, not as a bug.

---

## F2 · Command search silently omits most user content

**1. Location** — `CommandSearch.tsx` index construction (lines 53–68).

**2. Current behavior** — The index covers orgs, class workspaces, non-milestone tasks, experiences,
schools, stories, resources, plus routes and actions. It **excludes** `notes`, `notePages`,
`captures`, `academics.classCenter.notes`, `files`, `assignments`, `letters`, `requirements`,
`secondaries`, `interviewQs`, `persons`, and `organizations`. Only `label`/`sub` are matched — never
body text. `CommandEmpty` renders the same "no results" whether the record is absent from the index
or genuinely does not exist.

**3. Assumption** — That search is a *navigator* (jump to a page or record) rather than a *finder*
(locate a thing you wrote), and that the excluded collections are reached by browsing.

**4. Why it matters** — ⌘K is where users go when they cannot find something, and a confident empty
state on content that exists teaches them the app has lost it. `persons` and `organizations` are
especially damaging: the recommendation engine tells you to "add a verifier for X," and searching X
returns nothing. Notes are the classic search target and are entirely unsearchable.

**5. Alternatives** — (a) Index every id-bearing collection by title. (b) Add body-text search for
notes and captures. (c) Keep the index and add a "search all notes" escape hatch. (d) Distinguish
"not indexed" from "not found" in the empty state.

**6. Consequences** — (a) Straightforward; the index is rebuilt in a `useMemo` over the whole store
on every store change, so this makes an existing performance smell worse. (b) What users expect;
needs incremental indexing rather than full-rebuild-per-keystroke. (c) Cheap, and two search boxes
is a confession. (d) Honest, and does not solve the problem.

**7. Recommended** — **(a) now**, with the index moved off the hot path, **(b) next.** At minimum add
`persons` and `organizations`, which the intelligence layer actively directs users toward.

**8. Severity — P1.**

---

## D3 · Every intelligence threshold is an unvalidated judgment call

**1. Location** — `INTELLIGENCE_THRESHOLDS`, `src/lib/intelligence/types.ts:52`.

**2. Current behavior** — `staleExperienceDays: 30`, `staleOrgDays: 45`, `letterFollowUpDays: 21`,
`staleStoryDays: 21`, `archiveCompletedAfterDays: 90`, `ruleMuteAfterDismissals: 2`,
`maxSmartActions: 3`. Global, not user-adjustable, not derivable from the user's own history.

**3. Assumption** — That these intervals reflect real pre-med pacing, and that one set fits a
first-year and a gap-year applicant alike.

**4. Why it matters** — Credit where due: the file is explicit that these are "PRODUCT-TUNABLE…
judgment calls, NOT derived facts," collected in one block for retuning. That is exactly right, and
it is the best-documented set of assumptions in the codebase. The residual issue is that no
threshold has been checked against how pre-meds actually work, and they set the app's *nagging
frequency*, which is the fastest way to get a tool abandoned. 30 days of silence at a research
position is normal over a summer and alarming during term. `ruleMuteAfterDismissals: 2` means two
dismissals permanently mute a rule — plausibly too eager for someone clearing a list quickly.

**5. Alternatives** — (a) Leave and revisit with beta data. (b) Vary by context (term vs break,
experience category). (c) User-adjustable "how much should I nudge you" setting. (d) Derive from the
user's own update cadence.

**6. Consequences** — (a) Honest, and you need **E5** (some feedback signal) to learn anything.
(b) More accurate, more rules to reason about and explain. (c) Puts control with the user; most
people never open settings, so defaults still decide. (d) Best fit, needs history the app does not
retain, and risks normalising a bad pattern — a student who neglects everything gets nudged never.

**7. Recommended** — **(a) + a documented rationale per number.** The block says these are judgment
calls but not *whose* judgment or on what basis. Per your own workflow rule — research the
established method first — check them against r/premed and SDN norms and cite the source next to
each. That is a doc change, not a code change.

**8. Severity — P1** — cheap to address, disproportionate effect on retention.

---

## G1 · Date handling assumes the user never changes timezone

**1. Location** — `attention.ts:47` and `:71` (`new Date(\`${task.deadline}T00:00:00\`)`),
`dayStart()`, `daysSinceUpdate` in `derived.ts`, `pickDaily` in `lib/date.ts`, the daily-quote cache
key, and `toISOString().slice(0,10)` in several places.

**2. Current behavior** — Deadlines are stored as bare ISO dates and parsed as **local midnight**,
while several "today" computations use `toISOString()`, which is **UTC**. `daysLeft` is
`Math.round(diff / 86_400_000)` — no DST handling.

**3. Assumption** — One timezone, no DST boundaries, no travel.

**4. Why it matters** — Mixing local-midnight parsing with UTC day keys means "today" is not one
concept. West of UTC, a task due today can read as due tomorrow after 7pm; the daily quote and any
`pickDaily` rotation flip at local-evening rather than midnight. Across the two DST transitions the
`86_400_000` divisor is wrong by an hour, and `Math.round` will misreport a boundary deadline by a
day. A student flying home for break sees deadlines shift. For a product whose value is deadlines,
being off by one is the failure that matters.

**5. Alternatives** — (a) Pick one convention — local everywhere — and remove every `toISOString`
day key. (b) Store an explicit timezone on the profile and compute against it. (c) Use a date
library. (d) Leave; the error is one day at the edges.

**6. Consequences** — (a) Correct for the overwhelmingly common case, no dependency, and touches
every date call site. (b) Handles travel properly, adds a setting nobody wants to configure.
(c) Robust and correct, and `CLAUDE.md` requires flagging new dependencies. (d) The one failure mode
a deadline tracker cannot afford.

**7. Recommended** — **(a).** Standardise on local, add a `todayIso()` helper, and delete every ad-hoc
`toISOString().slice(0,10)`. Consistency matters more here than correctness-under-travel.

**8. Severity — P1.**

---

## E3 · Third-party quote API is on by default

**1. Location** — `useDailyQuote.ts:26`; `quotesApi: true` in `seed.ts:713`.

**2. Current behavior** — With the default setting on, the app fetches `zenquotes.io/api/today` on
load, exposing the user's IP and app-open timing to a third party with no stated privacy policy.
`FALLBACK_QUOTES` already exists locally and is used when the call fails. The Settings toggle exists
but is opt-out.

**3. Assumption** — That a decorative quote justifies a default-on third-party request, and that
this need not appear in the privacy page.

**4. Why it matters** — The product's positioning is local-first and no-telemetry ("there is no
telemetry in this app by design," `AppErrorBoundary.tsx:45`). A default-on external beacon on every
load undercuts that for a feature with a working local fallback. Small, but the kind of thing that
reads badly when someone opens devtools — and someone will.

**5. Alternatives** — (a) Default off. (b) Remove the API path; local bank only. (c) Keep default-on
and disclose. (d) Proxy through your own edge function.

**6. Consequences** — (a) One-line change, keeps the feature for those who opt in. (b) Simplest,
loses variety the local bank may not match. (c) Honest, still a beacon. (d) Hides the user's IP,
and now you are the one collecting the timing data.

**7. Recommended** — **(a).** No decorative feature should be the reason a privacy claim needs an
asterisk.

**8. Severity — P1** for positioning consistency; P3 on risk.

---

# P2 — should refine

## A1 · Generation exists as policy but not as product

`generationPolicy.ts` defines ten Academics artifacts (`study-guide`, `flashcards`, `summary`,
`explanation`, `quiz`, `worksheet`, `recall-prompts`…) with three guardrails and a full test suite.
**Exactly one has an implementation, and it is the placeholder in A8.** The MCAT restriction
(`qbank-questions` and `cars-passages` forbidden as externally-sourced) is well-reasoned and
correctly scoped. **Assumption:** an allow-list is a roadmap. **Why it matters:** it is easy to read
this file — as I initially did — as a description of shipped capability; it will mislead a future
session and it inflates your own sense of what exists. **Alternatives:** mark implemented vs planned
in the file; move unimplemented entries to a roadmap doc; implement `study-guide` and `flashcards`
first. **Recommended:** annotate now, implement `study-guide` first once **A2** has a house prompt —
it is the artifact you asked about and the one with the clearest rubric. **P2.**

## A9 · No regeneration semantics anywhere

Gap-check results live in component state only (`setGapResult`) — not persisted, not versioned, no
re-run affordance, no history. Navigating away loses the feedback permanently. **Assumption:**
feedback is transient and single-shot. **Why it matters:** the student cannot compare this attempt
to last week's, which is the single most motivating view in spaced repetition; and if a result looks
wrong there is no "try again." When generation features arrive (**A1**) this becomes acute —
regenerate-in-place, keep-both, and version history are all unanswered. **Alternatives:** persist
results per topic with timestamps; keep last-N; re-run button with side-by-side. **Recommended:**
persist the last result per topic and add a re-run — decide the general regeneration model *before*
building more generators, not after. **P2.**

## A10 · No sources means hard failure

`if (!chunks.length) return failure(422, 'no-sources', …)`. **Assumption:** a gap-check without the
student's own material is worthless. **Why it matters:** defensible and probably right — it is what
makes the feature honest — but it means a student who has not uploaded material gets an error rather
than an explanation. The message is returned as a code the client maps to generic copy.
**Alternatives:** keep and improve the message into a call to action ("upload your slides for this
topic to enable gap-check"); offer a clearly-labelled general-knowledge mode; disable the button
when the topic has no sources. **Recommended:** **disable the button with an inline reason** — never
offer an action that cannot succeed. **P2.**

## A13 · Edge function allows all origins

`'Access-Control-Allow-Origin': '*'`. Auth is enforced via JWT so this is not an authentication hole,
but it lets any site invoke your function with a user's token if it can obtain one, and it burns
that user's rate-limit budget (**A4**). **Assumption:** JWT auth makes origin control unnecessary.
**Alternatives:** allowlist the Pages origin and localhost; keep `*`; echo `Origin` against an
allowlist. **Recommended:** allowlist — you know your origins, and there is no upside to `*` for a
first-party function. **P2.**

## B3 · The entire dashboard is one JSONB row

`dashboards.data jsonb` holds everything; every push rewrites the whole document. **Assumption:**
per-user data stays small enough that whole-document writes are fine. **Why it matters:** it forces
whole-blob newest-wins (**B2**), makes per-record merge impossible without a schema change, grows
with trash (**B5**), and means the 4-second debounce re-uploads the full dataset on every burst of
edits. It works now and constrains every sync improvement later. **Alternatives:** stay; normalise
hot collections into real tables; keep JSONB but split per collection so pushes are partial.
**Recommended:** **split per collection** — a middle path that unblocks per-collection merge without
a full relational migration. **P2**, escalating with usage.

## B4 · Four-second debounce with no flush on unload

`DEBOUNCE_MS = 4000` in `useCloudSync`, 5000 in `useBackup`, and no `beforeunload` flush.
**Assumption:** a four-second window of unsynced work is acceptable. **Why it matters:** localStorage
is written synchronously so nothing is *lost*, but a user who edits and immediately closes the tab
has a cloud copy up to four seconds stale — and if their next session is on another device, **B2**
turns that gap into overwritten work. **Alternatives:** flush on `visibilitychange`/`pagehide`;
shorter debounce; explicit save indicator. **Recommended:** **flush on `pagehide`** — small, and it
closes the most common divergence window. **P2.**

## B7 · Export is all-or-nothing and includes everything

`exportJson()` serialises `snapshotData()` whole — including `trash` (every deleted record in full),
`meta.recoveryStack` (30 before/after pairs), contact names and emails, and all reflections.
**Assumption:** the only export use case is personal backup. **Why it matters:** the plausible real
use cases are *share hours with a pre-health advisor* and *hand experience descriptions to an
application*, and neither wants your deleted records or your private reflections. There is no CSV,
no PDF, no scoped export, and no redaction. AMCAS-shaped export is the obvious missing one for a
product organised around AMCAS. **Alternatives:** keep as backup and add scoped exports; add a
"clean" option excluding trash/recovery; add CSV per pillar; add an AMCAS-shaped activities export.
**Recommended:** keep the full JSON as *Backup*, add **hours-by-category CSV** and an
**activities export**, and exclude trash/recovery from anything labelled Export. **P2.**

## B8 · Import validates shape but not version

`validateAppData` checks structure well — arrays are arrays, rows have string ids, nested shapes are
right. It does **not** check `meta` version, and migrations run via `migrateAll` on rehydrate but
the import path's relationship to them is not asserted. **Assumption:** any structurally valid
backup is safe to load. **Why it matters:** `CLAUDE.md` requires versioned, lossless migrations for
schema changes, and there are already nine (`academicsV4`–`shellV9`). A year-old backup passes
validation while missing fields newer code dereferences. **Alternatives:** stamp a schema version on
export and run migrations explicitly on import; refuse unversioned backups; version-tag the filename.
**Recommended:** **stamp and migrate on import**, with a visible "this backup was upgraded from v6"
note. **P2.**

## C2 · "Reset all data" restores a seeded plan, not an empty one

`Settings.tsx:246` warns "Reset all data to the seeded plan? This cannot be undone." — accurate, and
`resetToSeed()` reinstalls Andy's UNC plan (**D1**). The error boundary's red *Reset to defaults…*
does the same after clearing localStorage. **Assumption:** "defaults" means the seed. **Why it
matters:** a user resetting after a problem expects a clean slate and gets someone else's degree
plan; from the crash screen, that is the worst possible moment for it. **Alternatives:** reset to
empty; offer both; rename to "Restore the sample plan." **Recommended:** **two actions —
*Start over (empty)* and *Reload sample data*** — resolves alongside **D1**. **P2.**

## D2 · FSRS runs on library defaults

`const scheduler = fsrs()` — no `FSRSParameters`, so default weights and **desired retention 0.9**.
Not user-configurable and not surfaced. **Assumption:** 0.9 suits pre-med coursework, and defaults
are neutral rather than a choice. **Why it matters:** desired retention is the main quality/volume
dial in FSRS. 0.9 is a reasonable general default but is tuned for long-horizon retention, while a
student cramming for a midterm in 3 weeks wants higher retention and more reviews. It silently sets
daily workload — which then interacts with `weeklyCapacity` (`capacity.ts`), a system built
specifically to respect the student's real available hours. Nothing connects them.
**Alternatives:** leave; expose a retention setting; derive from exam proximity; optimise from
review history once enough exists. **Recommended:** **derive from exam proximity** — the app already
knows exam dates, and this is the connection `capacity.ts` implies but never makes. Document 0.9 as
a choice meanwhile. **P2.**

## D4 · Recommendation ranking is hand-assigned magic numbers

`rank = impact × urgency × confidence`, with `impact`/`urgency` written inline per rule (`rank(3,2)`,
`rank(2,1)`) and `CONFIDENCE_WEIGHT = {high:1, moderate:0.7, low:0.4}`. Unlike
`INTELLIGENCE_THRESHOLDS`, these are **not** collected in one tunable block, and there is no scale
definition — nothing says what impact 3 means. Only the top `maxSmartActions: 3` are shown, so these
numbers decide what a student sees and what they never see. **Assumption:** relative ordering is
self-evident from the literals. **Alternatives:** move to a named constant table with a documented
scale; sort by severity then recency; let users pin. **Recommended:** **hoist into one table beside
`INTELLIGENCE_THRESHOLDS` with a stated scale** — you already established that pattern; this file
missed it. **P2.**

## D5 · A day of capacity is reserved from the pool automatically

`slackHours()` reserves the **mean of active days** — roughly one typical day per week — before any
generator may claim hours. Well-reasoned and well-documented (`02` §3.3-B1), taken from the pool
rather than from one tab so neither Academics nor MCAT is disadvantaged. **Assumption:** every
student wants ~14% of stated capacity held back, always. **Why it matters:** a student who has
already accounted for rest when entering their hours is silently double-discounted; one who set an
aspirational number is correctly protected. Since the pool is *what they have* rather than *what
they should use* (the file is explicit), reserving from it applies a wellbeing policy to a factual
input. **Alternatives:** keep; make the reserve visible and adjustable; ask during capacity capture
whether the number is already rest-inclusive. **Recommended:** **make it visible** — show "1 day
(4h) held back" in the capacity UI. The policy is defensible; invisible is the problem. **P2.**

## E5 · No error reporting at all

`componentDidCatch` writes to `console.error` with the comment "there is no telemetry in this app by
design." **Assumption:** no telemetry means no error reporting. **Why it matters:** the privacy
stance is genuinely good and worth keeping, but during a public beta it means you learn about crashes
only when a user emails you — and the error boundary offers *Export my data*, *Reload*, and *Reset*,
none of which tell you anything. You will ship a beta with no visibility into whether it works.
**Alternatives:** stay dark; opt-in crash reporting with the message shown before sending; a
"copy error details" button the user pastes into an email; local error log viewable in Settings.
**Recommended:** **(c) copy-to-clipboard** — zero telemetry, zero consent burden, and turns every
crash into a report a user can actually send. **P2.**

---

# P3 — minor

## F1 · Fuzzy search scoring is unexplained magic numbers

`fuzzyCommandScore` returns 0 for prefix, `8 + indexOf` for substring, `100 + lengthDiff` for
subsequence, `-1` for miss; `rankCommandHits` adds `-100` for verb-query action boost and
`recentBoost - 8`. `Math.min` across `[label, sub, group, verbs]` means a group-name match scores as
strongly as a title match — searching "Records" surfaces every record. No typo tolerance, so one
transposed character drops to zero results. **Recommended:** weight fields (label ≫ sub ≫ group) and
document the constants. **P3.**

## F4 · Snooze is per-item with no quiet period

`attentionSnoozedUntil: Record<string, number>` — per attention item. No global quiet hours, no
"mute until after finals," despite `BusyPeriod` already modelling exactly those stretches for
capacity. **Recommended:** honour `BusyPeriod` in the attention feed — the data is already there.
**P3.**

## G2 · Soft-delete filtering is inconsistent

Some rules filter `!entry.deletedAt` (`addVerifierRule`, `reflectionToStoryRule`); `dedup.ts` uses
`activeRows()` checking both `archived` and `deletedAt`; the CommandSearch index checks **neither**,
so trashed records remain searchable and navigable to a route that no longer renders them.
**Recommended:** one shared `activeRows()` helper used everywhere. **P3.**

## E4 · Google Calendar takes read access to everything

`calendar.readonly` grants every event on every calendar, including work and personal, to render a
daily schedule. `drive.appdata` by contrast is correctly minimal — it cannot see the user's other
files, and the choice is well documented. **Recommended:** narrow to selected calendars if the API
allows, and state the scope's breadth at the connect step. **P3.**

---

# What I'd do first

1. **A8** — remove the placeholder *Generate practice exam* button. One deletion, removes the worst
   correctness risk in the product.
2. **D1 + C2** — stop shipping Andy's UNC plan as every user's default. Blocks public beta on both
   accuracy and the non-affiliation position.
3. **B1** — stop silently dropping notes on the merge screen. Silent loss on a consent screen.
4. **B5 + B6** — cap trash and stop swallowing storage failures. Same failure, two halves.
5. **A2** — write the house prompt. Not a blocker; the highest-leverage item here, and the answer to
   what you originally asked.
6. **E1 + E2** — disclose the server-side material mirror and build a deletion path.
7. **F3** — decide, out loud, whether premedOS ever reaches out to the user.

Items 1–4 are removals and guards, mostly small. Item 5 is the one that changes what the product
*is*.
