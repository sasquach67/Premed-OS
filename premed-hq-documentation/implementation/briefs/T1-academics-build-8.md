# T1 · Academics — Lecture capture

**Stage:** C · DECIDED, NOT BUILT — **BLOCKED ON A SERVICE. Nothing built.**

**Scope:** The §4.1-Q lecture capture surface. This brief records why its
stage-C build cannot honestly proceed, and what would unblock it.

---

## 1. Fidelity audit

### a–c. Paper, app, already built

- Drawn: `academics-lecture-capture.html` — three views, `start`, `review`,
  `unavailable`. Decisions file records behaviour and appearance; nothing open.
- Nothing in `src/` references capture, transcript, or audio material.
- `localBlobStore.ts` (idb-keyval) already holds bytes outside Zustand and
  localStorage, and would be the right home for recorded audio. `AcademicFile`
  already supports an uploaded file with `blobRef` and `mimeType`. **The
  storage half of this surface exists.**

### d. Gate

Passes — `BUILD-MANIFEST.md` carries the mockup as **`YES`**.

### e. Decisions file

Passes.

### f. ⭐ Integrations and services — **why this stops here**

| Capability | Classification |
|---|---|
| Record audio in-browser (`MediaRecorder`) | **No service.** Buildable |
| Store audio locally (`localBlobStore`) | **Built.** Reusable as-is |
| **Speech-to-text transcription** | **CODE MISSING and PROVIDER UNCHOSEN** |
| Transcript excerpt review, quotes, timestamps | Depends entirely on the above |
| Proposed source links / coverage from a lecture | Depends entirely on the above |

**Two of the three drawn views — `review` and most of `start`'s purpose —
exist only if a transcript exists.** There is no transcription code anywhere
in the repo, no provider chosen, and no key configured. `study-tools` has
`sync-sources`, `delete-sources`, and `gap-check` only.

**What is left if you build around the block:** a record button that produces
an audio file the app can do nothing with, and a policy reminder. That is the
mistake `studyMethod.ts` explicitly refused with engineless cycle steps, and
the one `T1-academics-build-7.md` refused for study-guide generation. **A
capture surface whose entire value is the transcript should not ship as a
recorder that cannot transcribe.**

Uploading lecture audio as an ordinary material already works through the
Materials tab today, so the student is not blocked from keeping the file.

---

## 2. What would unblock it — decisions for Andy

**This is not a checklist item yet, because a prerequisite decision comes
first.** Transcription is the first capability in this tab that cannot be done
locally *and* has no obvious incumbent:

1. **Where does audio go?** On-device transcription (Whisper WASM — no upload,
   slow, large download) versus a hosted provider (fast, but lecture audio
   leaves the device, which the decisions file says must be disclosed before
   transfer). **This is a privacy decision, not an engineering one.**
2. **Whose recording is it?** Course recording policy varies by instructor and
   by state law. The drawing acknowledges a policy reminder once; that is a
   product stance worth confirming before shipping a record button.
3. Only after 1 is a key or console step even meaningful.

`implementation/reference-sources.md` should be consulted for how comparable
tools handle 1 before the decision is made — the repo's standing rule is to
check the established method first.

---

## 3. Recommendation

**Leave lecture capture unbuilt and take the Planning surfaces next.** They are
fully deterministic, need no service, and three of them are decided and waiting.
Returning here after the privacy decision costs nothing, because the storage
layer it needs is already built and unchanged.

## 4. Do not do

- Do not ship a recorder without a transcript path.
- Do not choose a transcription provider on Andy's behalf.
- Do not fabricate a lesson, unit, or coverage claim from an untranscribed file.
- Do not upload lecture audio anywhere without an explicit, disclosed choice.

## 5. Commit

`docs(briefs): record lecture capture as blocked on transcription`
