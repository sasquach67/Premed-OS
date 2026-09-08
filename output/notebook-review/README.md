# External notebook workflow review

This development-only review surface mounts the actual ClassHub, JournalEntryPage,
notebook workflow, importer, renderer, and persisted store. Its BIOL 103 class and
materials are invented review data. It does not prove signed-in production behavior.

Open the built review served from the app evidence folder:
http://127.0.0.1:5189/student-review/output/notebook-review/index.html#/academics/classes/notebook-demo

For source development, run Vite and open:
http://127.0.0.1:5188/output/notebook-review/index.html#/academics/classes/notebook-demo

Use a separate port/origin for concurrent reviewers. The app's existing persistence
writes a whole-store snapshot. Notebook actions reject stale notebook/class snapshots;
this does not retrofit locking into unrelated existing app actions.

## Student journey

Class Hub -> Class notebook -> Add to notebook -> choose Review, Assessment, or
Assignment -> view the prepared full prompt (details optional) -> copy or download
that exact text -> open the preferred AI conversation and attach original class
materials -> receive a downloadable notebook JSON or complete JSON block -> return
via direct Import JSON -> validate and inspect the formatted preview -> confirm any
class/title/term mismatch -> explicitly save editable entries.

Saved entries offer goal-specific reading, separate practice/answer reveal, coverage,
source access and excerpts, text editing, personal notes, and recall progress. Current
JSON exports one edited entry plus the complete supplied source inventory. Original
export retains the exact incoming JSON text. Backup additionally retains notes,
progress and the immutable original package; it is an archive, not an import format.
Revisions and same-revision conflicts save separately after explicit acceptance.
Original and current edited reimports open the existing entry without duplication.

## Canonical prompts

There are exactly three prewritten prompt assets. Prompt selection and customization
make no AI request. Applicable Markdown rules and the full schema are embedded by the
canonical instruction tooling; app preview, clipboard and download share one composed
string using one-pass JSON-encoded substitution.

After integrating the instruction commits, regenerate to a staging directory:

```sh
python3 premed-hq-documentation/specifications/generation/portable-notebooks/build_prompts.py --canonical-root . --output /tmp/notebook-canonical-assets
node scripts/notebook/sync-assets.mjs /tmp/notebook-canonical-assets
```

The sync command verifies canonical receipt hashes before copying any asset. The
bundled canonical-manifest.json records provenance. Never edit generated prompt prose
independently of canonical Markdown.

## Checks

```sh
npm run test -- src/lib/academics/notebook/notebook.test.ts src/components/academics/ExternalNotebook.test.tsx src/lib/academics/studyPackageImport.test.ts src/components/academics/NotebookEntryComposer.test.tsx src/components/academics/ClassHub.test.tsx src/components/academics/ClassHub.guide.test.tsx
npm run build
./node_modules/.bin/vite build --config output/notebook-review/vite.config.ts
```

Review build output goes to the agreed notebook-workflows-v2/app/student-review
folder. Main application builds do not include this standalone review HTML entry.

Actual browser checks covered file import, mismatch confirmation, rendered preview,
editable save, title/notes and practice progress across reload, separate reading modes,
and narrow mobile layout. Coordinator separately checked assessment edited-export
content preservation, identical current export dedupe, and revision preservation.
A parallel-origin QA collision exposed stale whole-store writes; notebook write guards
and deterministic regression tests now cover stale notebook/class snapshots, storage
quota failure rollback, and harmless hydration defaults.

## Boundaries

Validation proves package structure/reference consistency, not factual accuracy or
whether the AI actually read every source. Imported HTML-like content renders as text.
No unknown content field is silently dropped. Source fidelity covers the text and
metadata supplied in the JSON; listing an external attachment does not import its bytes.
The 8 MB parser ceiling does not guarantee browser storage has that much free capacity;
storage failure leaves the import unsaved with recovery guidance. Existing v1 study
packages and built-in generation remain separate, unchanged paths.

Five real class review trials, one assessment, one assignment, and Andy's ratings are
still pending. Invented fixtures and builds are not learning-quality acceptance,
production readiness, or deployment approval.

## Audited instruction beta

The integrated branch includes all four instruction commits through original5469c8f,
plus exact regenerated assets for visible build notebook-instructions-beta-1. The
source manifest records the integrated canonical commit, and the shared app evidence
folder contains audited-prompt-parity.json and audited-beta-tests.txt. After this
asset refresh,43 focused tests and the full app/review builds passed.
