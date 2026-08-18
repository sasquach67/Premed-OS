# DEPLOY 01 — Syllabus import + empty states

**Status: SAFE TO SHIP once §1's blockers clear.** Two are configuration, one is housekeeping. None is a code defect.

---

## 1. ⚠️ BLOCKERS — resolve before pushing

### 1a · 🔴 Two deploy paths build different apps

| Path | Base | Builds | Last commit |
|---|---|---|---|
| `.github/workflows/deploy.yml` → GitHub Pages | repo root | **`src/` — the real app** | Aug 15 |
| `netlify.toml` | `base = "premed-hq"` | **a stale copy** | **July 9** |

**`CLAUDE.md` line 12:** *"IGNORE these stale/superseded locations… the entire nested `premed-hq/` folder (an old app copy)… Implement against `src/` at the repo root."*

**If Netlify is still connected to this repo, a push to main deploys the July build.** Nothing from this session — no syllabus import, no `U-7` fix — would be in it.

**Resolve one of these ways:**

- **Netlify is dead** → delete `netlify.toml`. It is a live misconfiguration pointing at abandoned code.
- **Netlify is the real target** → change `base` to `"."` and confirm `publish` resolves to the root `dist`.
- **Unsure** → check the Netlify dashboard for a connected site before pushing. **Do not push while unsure.**

### 1b · 88 uncommitted files

The syllabus work **is** committed (`1ee2c87`, `4a46bc9`), as is the `U-7` fix (`25052da`). But the tree holds 88 uncommitted items spanning **six unrelated concerns** — spec edits, `mockup-lab/`, a deleted `academics-requirements.html` with four live references, the research corpora, and data files.

**Commit or stash before pushing.** A deploy that sweeps those in is not reviewable, and the deleted mockup would leave `BUILD-MANIFEST.md:89` pointing at a file that no longer exists.

### 1c · Confirm the build's secrets are set

`deploy.yml` injects `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from repo Secrets at build time. **If they are unset, the build succeeds and cloud sync silently fails on the live site.** Confirm both exist in repo Settings → Secrets.

---

## 2. Pre-flight — run these, in order

```bash
npm run test        # full suite must pass
npm run build       # production build must succeed
npm run lint        # if configured
```

**Then verify locally against a real syllabus** — your own, as a PDF:

- [ ] Import from cold start → class is created, review screen shows quoted source lines
- [ ] **Grade weights that don't sum to 100% show the gap and are NOT normalised**
- [ ] `Add manually` under one group **leaves the other groups intact**
- [ ] Apply states real counts and names the class
- [ ] Import a second syllabus into an existing class via **Class Center card overflow** → **no duplicate class is created**
- [ ] Re-import a changed syllabus → added/changed/removed rows, **changed defaults to Keep**
- [ ] A scanned PDF is **named as a scan**, not reported as "nothing parsed"
- [ ] School List status dropdown **has no `rejected` option**

---

## 3. What ships

**Syllabus ingestion (`§4.1-M`) — the keystone.** Fourteen features were waiting behind it, and it makes the landing page's *"upload a syllabus, get your semester"* true for the first time.

- Client-side PDF, DOCX, and pasted-text parsing. **No file content leaves the device** — this is what keeps the copyright model intact.
- **Key-free deterministic parser** (`U-2`) — works with no API key.
- Review-before-apply with quoted source text and line references, inline editing, groups auto-expanding on low confidence.
- Weight-gap warning that **states the gap without normalising**.
- Scan detection with paste and manual-entry fallbacks.
- Grade categories persisted in a parked `GradeCategory` store, **with no §6.8 projection math**.
- Three entry points; scoped imports reuse `courseId` with no duplicate class.
- Re-import diff — identity-matched, changed and removed default to **Keep**.
- Lossless, idempotent `v11` migration with tests.

**Also shipping:** approved empty states and class types (`cb963a3`), and the `U-7` fix removing `rejected` from School List with an archive migration.

---

## 4. Knowingly incomplete — ship anyway

| Gap | Why it's acceptable |
|---|---|
| **Fourth entry point** (Add-a-class handoff) | Three work. Importing into an existing class is fully available; this only collapses create-then-import into one step |
| **No OCR** | Deliberate deferral. Scans are detected and named, with paste and manual paths offered |
| **Policies not structured** | Captured verbatim in `policyNote`. Parsing them is `§6.8`, which is not started — **and shipping a projection you can't stand behind is what §6.8 opens by warning against** |
| **School List tab is thin** | 63 lines, doesn't read the roster. **Spec is complete; build is not.** Consider hiding or labelling it |
| **Other stub tabs** — Atlas 24 lines, Timeline 51 | Same. A tab that exists and does nothing reads as broken; "coming soon" reads as honest |

---

## 5. After the push

- **Confirm the live URL serves the new build** — check that syllabus import exists on the deployed site, not just locally. **This is how a wrong-base deploy gets caught.**
- **Verify cloud sync works live**, which proves the Supabase secrets were injected.
- **Rollback is `git revert` + push** — the Actions workflow redeploys on any push to main.

## 6. The one thing worth doing before real users

**Beta the keystone, not the product.** The parser is 81 lines of regex and its accuracy against real syllabi is unknown and **unknowable internally.** Five to ten people, one instruction: *"import every syllabus you have and tell me what it got wrong."*

That is the single highest-value information available right now, and no amount of internal testing substitutes for it.
