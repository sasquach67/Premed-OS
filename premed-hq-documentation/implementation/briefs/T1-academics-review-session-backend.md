# T1 · Academics — Active Recall response completion

**Stage:** D · BACKEND MISSING

**Scope:** Complete the existing Active Recall session's response pipeline:
make its microphone and image paths real inputs to the cited gap-check, make
the start affordances truthful controls, and prove the deterministic review
write survives reload. This is not a visual-translation pass. Preserve the
approved screen's current structure; its remaining visual ladder mismatch is
the next stage.

## 1. Fidelity audit

### A. Spec → paper

Every ruled Review Session behaviour has a manifest-cleared paper owner.

| Ruled behaviour | Decided surface |
| --- | --- |
| One Active Recall mode; no depth-mode switcher | `tabs/01-academics.md` §4.1-J and `academics-review-session.{html,md}` |
| One combined response composer: mic default, keyboard, image attach, and draw | same |
| Scope before responding; confidence before reveal; cited gap report; FSRS grade intervals | same |
| Scenic start and summary; solid reading/report states; session timer and preferences | same |
| Optional concept canvas and student-confirmed TopicLink suggestions | same |

There is no Stage-A paper gap. `BUILD-MANIFEST.md` explicitly clears
`01-academics/academics-review-session.html` with **Build? = YES**. Do not
edit the manifest.

### B. Mockup → app

`src/pages/AcademicRecallSession.tsx` owns the real route, entered through
`src/App.tsx` at `/academics/review/:courseId`. It already has the four
session phases (`start`, `active`, `report`, `summary`), deterministic queue
selection, stated scope chips, confidence-before-report, manual dispositions,
FSRS writes, visible grade intervals, a source drawer, a concept canvas, and
an optional server-side cited gap check.

| Approved drawing | Current implementation | Finding |
| --- | --- | --- |
| Start wide action plus mic/settings squares | Wide Start works; mic and settings squares render as `Button`s with no handler | **Not a truthful control** |
| One composer combines keyboard, speech, image, and draw | Text feeds the gap check; recording creates only a temporary browser Blob URL; image attach creates only temporary object URLs | **Voice/image do not reach the comparison** |
| Gap report evaluates only the stated topic material with clickable provenance | Text-only gap check sends scoped chunk IDs; material citations open the source drawer | Built for text; preserve it |
| Manual confidence/dispositions → grade → deterministic FSRS persistence | `gradeTopic()` writes `reviewEvents`, FSRS state, and key-point surfacing through the store | Built, but no reload/UI proof yet |
| Scenic start / summary, solid recall / report ladder | All states exist, but the app uses its `slate-950` ladder rather than the approved warm reading ladder | Stage-E fidelity work, not this pass |

#### Measured primary surface — Review Session start, dark theme

Measured in the running app on 2026-08-23 at
`#/academics/review/demo-course-biol252`, which rendered `5 topics up`.

| Surface | Approved drawing | Running app | Finding |
| --- | --- | --- | --- |
| Start scene / focus canvas | warm scenic treatment, with solid reading pages at `#211e1a` beneath it | `main` computed background `oklch(0.129 0.042 264.695)` (`slate-950`) | A real visual-ladder difference remains; do not silently restyle it in this backend pass |

The actual start scene is present and functional enough to measure. It is not
evidence that the later solid reading ladder matches the drawing.

### C. Already built — preserve, do not rebuild

- The session route, queue ordering, topic scope, keyboard shortcuts, manual
  confidence/disposition flow, FSRS scheduling, review-event writes, summary,
  and source drawer introduced by `9f9d98a` and extended by `30db2b9` and
  `a64f973`.
- The locally deterministic no-key recall loop in
  `src/lib/academics/activeRecall.ts`; keep it useful when AI is unavailable.
- The two-pass, source-scoped generation contract and citation closure in
  `src/lib/generation/` and `supabase/functions/study-tools/index.ts`.
- Existing concept canvas semantics, current app annotations, and all Class
  Center visual refinements through `dbab247`.

### D. Backend gate

**Fail — this is the first blocked stage.** The actual response submitted to
`studyTools.gapCheck()` is only `response` text. A recorded audio Blob and
attached image previews cannot affect the report. The start's mic/settings
controls also claim capabilities without a handler. This is a behavioural
failure, not a reason to rebuild the page.

### E. Decision records

**Pass.** `mockup-lab/01-academics/academics-review-session.md` records both
behaviour and appearance: the one-mode rule, combined input affordances,
source provenance, solid/scenic surface split, layout, responsive stack, and
motion/focus intent. No Stage-B decisions brief is required.

### F. Integrations and services

| Dependency | Status | What the student sees today | Required disposition |
| --- | --- | --- | --- |
| Local store + FSRS | Code built | A fully local text/manual session works without AI | Preserve and add reload proof |
| Browser microphone / `MediaRecorder` | Code partly built | Can record a temporary clip, but it is never compared | Complete a consented transcription handoff or plainly fall back to typing |
| Image response | Code partly built | Can attach a temporary preview, but it is never compared | Complete one-image vision/OCR handoff or omit it as an evaluator input |
| Supabase `study-tools` Edge Function | Code built, provider configuration unverified | Signed-in text comparison may work; failures are honestly shown | Andy must verify deployed function and the selected provider secret after code lands |
| Server source mirror | Code built | Student consents once, then selected source chunks are mirrored for cited generation | Preserve source-only/citation-closure rules |

The integration is not "done" merely because the client has a Supabase URL.
`isSupabaseConfigured` establishes client configuration, not a deployed Edge
Function with working provider secrets.

## 2. References

- `premed-hq-documentation/tabs/01-academics.md` §4.1-J and §6.3.
- `mockup-lab/01-academics/academics-review-session.{html,md}` — approved
  Active Recall states and appearance decisions.
- `mockup-lab/_shared/_visual-recipes.md`.
- `premed-hq-documentation/specifications/01-shared-interface-patterns.md`
  and `04-visual-craft-standards.md` §0–§0c.
- `premed-hq-documentation/implementation/MOCKUP-TRANSLATION-CONTRACT.md`
  and `component-inventory.md`.
- `src/pages/AcademicRecallSession.tsx`,
  `src/lib/academics/activeRecall.ts`, `src/lib/academics/fsrs.ts`,
  `src/lib/intelligence/studyTools.ts`, and
  `supabase/functions/study-tools/index.ts`.

## 3. The work — complete response evidence, not a second session

### 3.1 Make every existing start control truthful

1. The wide Start button begins a standard Recall session exactly as today.
2. The mic square starts the same Recall session and then requests microphone
   permission in the active composer. If permission is refused or unsupported,
   show the existing calm typing/image fallback — no guilt, blocked loop, or
   fake transcription state.
3. The settings square opens a real session-preferences control. It owns the
   stated default input, interleave, weak-first, work length, break length,
   break enforcement, and sound preferences from §4.1-J. Persist only choices
   that are implemented; do not render an enabled setting whose queue/timer
   does nothing. Losslessly migrate existing stores and test repeat migration.
4. Keep Recall and Focus as two *session purposes*, not three recall modes.
   Focus logs timer-only study time and never writes a recall grade or FSRS
   update. Pausing is neutral. Do not introduce a global settings surface.

### 3.2 Define a real combined response contract

1. Give one attempt a typed payload with optional `text`, `audioTranscript`,
   and at most one final `image` evidence item. Text, a transcript, and an
   image can be used together or independently; the UI must identify which
   inputs will be compared before the student requests a gap check.
2. Recording must not stop at a `blob:` preview. After explicit student action
   to use it in the gap check, transmit the recording through an authenticated
   server-side transcription route, return the transcript for student review,
   and submit that transcript as response evidence. Do not retain raw audio
   after transcription unless the student separately elects to save it.
3. Attach map/image must not stop at `URL.createObjectURL`. Limit it to one
   final image with explicit type/size bounds, local preview/removal, and a
   clear consented handoff only when the student asks for the AI comparison.
   The server must either extract/inspect it using the configured model route
   or return an honest unavailable result; it must never pretend an image was
   assessed when it was not.
4. Extend the `study-tools` request schema, Edge Function validation, and
   versioned `gap-check-v1` artifact contract together. The model receives
   only the selected response evidence plus the signed-in student's selected,
   topic-scoped source chunks. Retain the two-pass citation closure; every
   material claim must still reference a real supplied chunk/range, and every
   general-knowledge claim remains visibly amber.
5. The response becomes reviewable before grading. The assistant may suggest
   `covered` / `missed` / `wrong`; it must not silently mark dispositions or
   select an FSRS grade. The student retains manual dispositions and
   Again/Hard/Good/Easy confirmation.

### 3.3 Privacy, size, failure, and persistence boundaries

1. At the first audio/image handoff, state precisely what leaves the device:
   selected topic chunks, typed response, derived transcript, and optional
   final image. Distinguish the temporary browser preview from any server
   processing. Retain the existing source-disclosure choice; do not silently
   widen it.
2. Reject unsupported, oversized, missing, or malformed evidence before it
   reaches a provider. A transcription/vision/provider failure leaves local
   response state untouched and preserves the no-API manual path.
3. Persist the things that make future academic behaviour true: session
   purpose/preferences, completed study time, FSRS review event, confidence,
   and key-point surfacing. Do not persist unconsented raw audio, arbitrary
   image binaries, temporary object URLs, or an AI result as authoritative
   student truth.
4. Add a lossless, idempotent store migration for any new persisted session
   fields. Frozen legacy input and a second migration pass must be safe.

### 3.4 Verification

1. Unit-test queue and FSRS behaviour plus the new preference/session-purpose
   rules. Test migration on frozen old data and verify the second pass is a
   no-op.
2. Add component/integration coverage proving:
   - both start squares have actual handlers;
   - standard Start, mic-start, typing-only, audio-only, image-only, and
     combined evidence paths lead to one session, not different modes;
   - audio is transcribed/reviewed before it can enter a gap check;
   - image metadata reaches the authenticated request only after consent;
   - provider failure leaves manual classification and grading usable;
   - AI output cannot auto-write a disposition, grade, FSRS state, or citation
     outside the selected source chunks;
   - a graded session survives reload with the same review event and FSRS
     state; a Focus session survives with time only and no review event.
3. Run the dead-control audit for changed `Button`, `DropdownMenuItem`,
   `ContextMenuItem`, and `ToggleGroupItem` instances; output must be zero.
4. Run the full test suite and production build. Perform a signed-in manual
   verification after deployment: type-only gap check, microphone transcript,
   image-plus-text comparison, clickable citation, reload persistence, and
   manual fallback while the provider is unavailable.

## 4. Do not break

- One Active Recall mode; do not revive Quick Recall, Blurting, or Feynman
  mode selectors.
- The source-only trust boundary, citation closure, per-student source mirror,
  rate limits, and local canonical record ownership.
- The no-API FSRS/manual loop, session scope guarantee, confidence-before-
  reveal rule, manual grade, keyboard shortcuts, source drawer, and current
  concept-canvas confirmation behaviour.
- No Anki sync/ownership, video analysis, direct browser model keys, public
  storage bucket, or global session settings.
- No U-9 score, composite, ranking, or progress bar. A session spine and
  factual time/interval labels are navigation/record context, not a score.
- Do not restyle the scene, class cards, shared shell, or other app-specific
  annotation in this backend pass.

## 5. Done when

- [ ] Every Review Session control is actionable; the mic and settings squares
  no longer masquerade as controls.
- [ ] A typed response, reviewed transcript, optional final image, and canvas
  can each contribute to the one response contract without creating a mode.
- [ ] Audio/image are never represented as compared unless the authenticated
  service actually processed them; failure leaves the local manual loop whole.
- [ ] All generated report claims preserve source provenance and citation
  closure; nothing AI-generated silently writes a student disposition or FSRS
  result.
- [ ] Recall and Focus time/persistence rules are lossless, idempotently
  migrated, and reload-proven.
- [ ] Handler audit, targeted/integration tests, full test suite, and
  production build pass; signed-in service checks are documented.

## 6. Andy checklist — configuration after code lands

1. In the Supabase project used by Premed OS, confirm the `study-tools` Edge
   Function is deployed from this commit.
2. Confirm the selected provider's server secret exists **only** as an Edge
   Function secret (`OPENAI_API_KEY` when `AI_PROVIDER=openai`, or the
   equivalent Anthropic secret when that provider is selected). Do not put it
   in `.env` client variables or any `VITE_*` key.
3. Confirm any transcription/vision model name required by the new route is
   enabled for that provider project, then perform the signed-in manual test
   listed in §3.4. If it fails, the UI must report the provider unavailable
   while local Recall remains usable.

## 7. Commit

`feat(academics): complete active recall response inputs`

Commit unrelated working-tree changes separately.

## 8. Next stage — Review Session fidelity, not in scope

After this backend work is deployed and verified, re-run the tab audit. The
next expected stage is **E · FRONTEND MISSING**: translate the measured
scenic/solid surface ladder, reading-card depth, queue density, and responsive
layout from the approved drawing without changing this response logic. Then
perform the six-condition promotion audit before setting the page to `built`.

