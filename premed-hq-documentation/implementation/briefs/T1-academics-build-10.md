# T1 · Academics — Lecture transcript import

**Stage:** C · DECIDED, NOT BUILT · **EXECUTED Aug 19, 2026**
**Supersedes:** `T1-academics-build-8.md`, which recorded lecture capture as
blocked. **The block is removed by deleting the blocked half, not by solving
it.**

**Scope:** Import a lecture transcript as pasted text, chunked and searchable
against the class's own records. Frontend and backend.

---

## 1. Why this replaces lecture capture

`build-8` stopped because two of the three drawn views needed a transcript,
and producing one required choosing a speech-to-text provider — a privacy
decision (does lecture audio leave the device?) before an engineering one.

**Andy's device already does it.** GoodNotes 6 records and transcribes
on-device at no cost on qualifying hardware, which he has confirmed, and its
transcript sidebar offers **Copy All**. Apple's Universal Clipboard carries
that text from iPad to Mac with no file, no export, and no upload.

So the capability moves out of Premed OS entirely:

| Job | Owner |
|---|---|
| Recording the lecture | **GoodNotes** |
| Transcribing it | **GoodNotes**, on-device |
| Moving the text | **Universal Clipboard** |
| Indexing it against topics, units and materials | **Premed OS** |

**What this deletes:** `MediaRecorder`, audio storage, a provider choice, an
STT key, a recording-policy consent flow, and the privacy decision. Premed OS
never touches audio, so there is nothing to disclose about audio.

⚠️ **GoodNotes cannot export the audio itself, and that no longer matters** —
the transcript is the input, not the recording.

---

## 2. Audit

- **Gate:** `academics-lecture-capture.html` is **`YES`** in the manifest. This
  brief builds *less* than that drawing, never more, so the gate holds.
- **Already built — reuse, do not fork:** `SourceChunk` already stores text with
  `characterStart/End` and a `sourcePosition { index, label?, lectureNumber? }`
  — **`label` is exactly where a timestamp belongs**. `AcademicFile` already
  carries `owner` and links. `materialCatalog.ts` already files materials by
  unit and shows provenance.
- **Integrations:** **none.** Paste is local. No key, no network, no service.
  **No ANDY CHECKLIST items.**

---

## 3. The records

1. `AcademicFileSourceType` gains `'paste'`. Additive to a union no stored data
   uses yet, so **no migration is required** — but a pasted source must be
   visibly pasted wherever provenance is shown.
2. The transcript's text lives in `SourceChunk` rows, one per segment, with
   `sourcePosition.label` holding the timestamp **when one exists**.

---

## 4. The work

### Backend — `src/lib/academics/transcriptImport.ts` (new)

1. `parseTranscript(text)` → `{ segments, hasTimestamps }`. A segment is
   `{ label?, text, start, end }` with exact character offsets into the pasted
   text, so a later citation is a real range and never a similarity guess.
2. Recognise the common shapes — `22:14`, `[22:14]`, `(1:02:03)`, `00:22:14`,
   and a leading `12:03 - ` — at the start of a line only. **A timestamp-like
   string mid-sentence is text, not an anchor.**
3. **Degrade honestly.** With no timestamps, segments split on blank lines and
   `hasTimestamps` is `false`. The UI then says time anchors are unavailable
   for this source rather than implying the transcript is time-indexed. This is
   the same rule as `RS-11` in the reading-summary spec.
4. `buildTranscriptImport({ courseId, title, text, now })` → the `AcademicFile`
   (`sourceType: 'paste'`, `owner: 'course'`) plus its `SourceChunk[]`.
5. `transcriptImport.test.ts` — each timestamp shape, mid-sentence times not
   treated as anchors, offsets exact, empty and whitespace-only input refused,
   and `hasTimestamps` false for plain prose.

### Frontend — `src/components/academics/TranscriptImport.tsx` (new)

6. A paste field in the Materials tab: title, textarea, and a live preview
   showing segment count and **whether timestamps were detected**.
7. The disclosure is not decoration — a transcript without anchors must say so
   before it is saved, because that is what the student loses.
8. Import writes the file and chunks in one store update, then clears.
9. Mounted beside `MaterialCatalog`. It does not become a sixth class tab.

---

## 5. Do not break

- No audio, ever. No `MediaRecorder`, no upload, no provider.
- A pasted source is labelled pasted; it is never presented as an uploaded file.
- Never invent a timestamp, a lecture number, or a unit for a pasted transcript.
- Character offsets are exact ranges into the pasted text, never approximations.
- U-9: no completeness meter over "lectures transcribed".
- Empty paste imports nothing and says why.

## 6. Done when

- [x] Pasting a timestamped transcript produces one chunk per segment with its
      timestamp preserved as `sourcePosition.label`.
- [x] Pasting plain prose still imports, and visibly reports no time anchors.
- [x] The stored file is visibly `paste` in the material catalog.
- [x] Build passes; suite green; verified in the running app.

## 7. Commit

`feat(academics): import lecture transcripts as pasted text (§4.1-Q)`

## 8. Next stage

Searching across transcripts, and routing a quoted moment to its topic, is the
lecture-index half of §4.1-Q and is a later pass. `sourceType: 'paste'` is now
shared with the reading-summary generator's D-4, which no longer needs its own
mechanism.
