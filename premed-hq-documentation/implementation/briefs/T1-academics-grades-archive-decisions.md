# T1 · Academics — Grades & Archive decisions

**Stage:** B · DRAWN, NOT DECIDED

**Scope:** Choose the composition for the three Planning/Grades views —
`ledger`, `gpa`, `what-if`. Decision pass only: **no `src/`, store, migration,
or manifest change is authorized here.** The tab's earlier stages pass; §7
names what comes after and it is not in scope.

**Blocked on Andy for:** the variant ruling (§3), and three manifest rows that
do not exist (§1d).

---

## 1. Fidelity audit

### a) SPEC → PAPER — ruled features with no mockup surface

**None that are both ruled and un-deferred.** Every §6 feature I could tie to a
surface has one. The four that look like gaps are not:

| # | Feature | Why it is not a drawing gap |
|---|---|---|
| 11 | UNC course difficulty intel | Spec §1248 marks it **"Atlas-grounded (phased)"** — deferred by the spec itself |
| 62 | Course grade distributions | Spec §1362: **"RESEARCH TASK before building"**, and *"if the data isn't cleanly available, cut the feature"* |
| 61 | Canvas sync, Path B | Spec §692: **"Do not build Path B until Path A is shipped and someone has asked for more"** |
| — | Bulk Canvas import | **Is drawn.** `Import from Canvas` sits in `academics-class-hub.html`'s Materials header, as §7-B requires |

Path A — the Canvas ICS feed read through Google Calendar — is drawn
(`academics-materials-extensions.html`, the *Calendar review* route) and built
(`CalendarReview.tsx`). See §1f for whether it is configured.

### b) MOCKUP → APP — Planning/Grades

| Mockup | In `src/`? | Looks like the drawing? |
|---|---|---|
| `academics-grades-archive.html` | **Partly.** `Academics.tsx:310` renders `TermRollover` + `ClassCenter archiveOnly` + `GradeDecisionsSection` | **No.** The archive tab is a stack of existing components. The drawing's dual UNC/AMCAS hero, the year-by-year trend, and the weight-aware inverse solve are not on screen |
| What-if | `Academics.tsx:396` — a real projection function | Behaviour without the drawing's screen |
| `academics-grade-decisions.html` | `GradeDecisionsSection`, `c5a95d9` | Yes — four states, built and matching |
| `academics-term-retrospective.html` | No | Not built |
| `academics-forecast-accuracy.html` | No | Not built |

**Behaviour shipped ahead of appearance here, which is the recurring gap.**
That would normally be stage E. It is not, because there is nothing to be
faithful *to* yet — see §1e.

### c) ALREADY BUILT — do not rebuild

Cited so this pass cannot quietly redo them:

| Surface | Commit |
|---|---|
| Grade decisions, four states | `c5a95d9` |
| Term rollover | `9e7fd73` |
| Planner term board + inspector (A + C ruled) | `088144b` |
| Topic ↔ assignment linking | `606ed65`, `e44b4ca` |
| Learning signals | `b21d89f` |
| Forgetting curve | `775611e` |
| Syllabus import — parse, apply, re-import diff | `e638095`, `ac23637`, `28011d4`, `227cfb0` |
| Assignment due dates → ISO, migration v24 | `28011d4`, `c3310c3` |

**The what-if projection at `Academics.tsx:396` is real and must survive this
pass.** A decisions brief changes no code, so nothing above is at risk — this
table exists so the *next* stage cannot claim greenfield.

### d) GATE — `BUILD-MANIFEST.md`

| Mockup | Manifest | Clear to build? |
|---|---|---|
| `academics-grades-archive.html` | PROPOSED (Aug 2026) | **`YES`** |
| `academics-requirements.html` | PROPOSED (Aug 2026) | **`YES`** — screen only, *not* completion maths |
| `academics-forecast-accuracy.html` | **no row at all** | **NO — ungated** |
| `academics-term-retrospective.html` | **no row at all** | **NO — ungated** |
| `academics-tar-heel-tracker.html` | **no row at all** | **NO — ungated** |
| `academics-mode-switch.html` | none (concept) | `NO` |
| `class-center-study-hub.html` | none (concept) | `NO` |

⚠️ **Three mockups exist in the lab and have no manifest row in either
direction.** They are not cleared and not refused; the manifest simply does not
know about them. `academics-tar-heel-tracker.html` also overlaps
`academics-requirements.html`, which *does* have a row — two files for one
surface. **Adding a manifest row is Andy's, not the agent's.**

This brief still gets written. **Nothing may be built from those three rows.**

### e) DECISIONS FILES — appearance, or only behaviour?

**This is the finding the stage turns on.**

`academics-grades-archive.md` is a strong record of *behaviour*: archive-as-filter,
dual GPA side by side, AMCAS truncation, every repeat attempt counted, trend by
academic year, weight-aware inverse solve. Its exclusions are equally clear —
no separate Archive page, **no single academic score**, no celebration on a GPA
number, no normalised titles.

**It records no appearance at all.** No surface recipe, no token, no radius, no
spacing, no hierarchy ruling. Its closing section says:

> `## A/B/C in the lab` — Per view, declared in `VIEW_VARIANTS`:
> `ledger` — terms as cards · dense transcript · two-column terms
> `gpa` — dual hero · trend first · instrument panel
> `what-if` — landing then inputs · inputs first · solve-first

**The nine alternatives are drawn and can be compared right now.** They are
not in the mockup file — `grep -c VIEW_VARIANTS
academics-grades-archive.html` returns `0` — they live in **`variant-lab.html`
line 866**, in `const VIEW_VARIANTS = {`, whose `"grades-archive"` entry begins
at **line 1098** and runs 3,335 characters: `v:[[name, description]…]` per view
plus `b:` / `c:` CSS overrides injected into the mockup's iframe. Opening the
lab and stepping A → B → C renders all three, captioned exactly as the `.md`
describes them:

| View | A | B | C |
|---|---|---|---|
| `ledger` | Terms as cards | Dense transcript | Two-column terms |
| `gpa` | Dual hero | Trend first | Instrument panel |
| `what-if` | Landing then inputs | Inputs first | Solve-first |

**Verified in the running lab, not read off a file.**

⚠️ **CORRECTED Aug 20.** An earlier reading of this brief claimed the `.md`
named a mechanism that does not exist. **It does exist.** `const VIEW_VARIANTS`
is declared at `variant-lab.html:866` and carries entries for eight pages —
`assignments`, `class-hub`, `review-session`, `exam-prep`, `syllabus-import`,
`requirements`, `grades-archive`, `class-types`. **The `.md`'s cross-reference
is accurate and must be left alone.** The original grep looked only at the
`.md` and `.html` mockup files, where the registry does not live — a negative
grep in the wrong file is not evidence of absence.

**So this is stage B for one reason only: no variant has been ruled.** The
comparison is ready; the choice has not been made, and nothing records
appearance once it is. That is also why it is not stage E — behaviour shipped
ahead of appearance, but there is no ruled appearance for an implementation to
be unfaithful to yet.

Same pattern, unruled, in: `academics-requirements.md`, `academics-class-types.md`,
`academics-empty-states-prototype.md`, `academics-tar-heel-tracker.md`,
`academics-forecast-accuracy.md`, `academics-term-retrospective.md`.

Ruled and fine, for contrast: `academics-planner-prototype.md` (A + C),
`academics-topic-linking.md` (A + C), `academics-study-method.md` (C2),
`academics-learning-signals.md` (A).

### f) INTEGRATIONS AND SERVICES THIS TAB'S SURFACES NEED

**This tab owns these. None is split into a separate integration brief.**

| Dependency | Surface | State | Evidence |
|---|---|---|---|
| **pdfjs worker** | Syllabus import | **CODE BUILT AND CONFIGURED** | `GlobalWorkerOptions.workerSrc` set via a `?url` import (`ac23637`). Verified in a browser against the production build: 20-page PDF parses in 183–265 ms, a real Worker is constructed from the bundled `pdf.worker.mjs`, max main-thread block 12–19 ms against a 12 ms idle baseline |
| **IndexedDB blob store** | Materials, syllabus files | **CODE BUILT AND CONFIGURED** | `keyval-store` inspected after a reload: `%PDF-1.4`, correct sizes and MIME. The store holds only `blobRef` |
| **Supabase `study-tools` + `ANTHROPIC_API_KEY`** | Generation | **CODE BUILT AND CONFIGURED** | `generate` action at `supabase/functions/study-tools/index.ts:120`; called from `ClassHub.tsx` |
| **Google Calendar** | Calendar review, Canvas Path A | ⚠️ **CODE BUILT, NOT VERIFIED CONFIGURED** | `googleCalendar.ts` (163 lines) and `CalendarReview.tsx` exist; `VITE_GOOGLE_CLIENT_ID` is set in `.env.local`. **Nobody has completed a real OAuth round-trip and browsed live events** — `T1-academics-status.md` says *"connected path tested, not browsed"* |
| **Canvas Path B** | #61 grades, announcements | **CODE MISSING — and correctly so** | Spec §692 forbids building it until Path A ships and someone asks |
| **UNC grade distributions / Atlas** | #11, #62 | **CODE MISSING — blocked upstream** | Both are research/licence tasks in the spec, not engineering gaps |

⚠️ **Google Calendar is a GAP, not done.** Today the student sees the Calendar
review route render from whatever `googleCalendar.ts` returns, with the derived
class-record fallback behind it. Once the OAuth client is confirmed for this
origin they see **their own Canvas assignment dates**, arriving through the
feed, with no Canvas engineering at all.

#### ANDY CHECKLIST — Google Cloud console (nobody else has access)

1. Open the Google Cloud project holding the OAuth client in `.env.local`.
2. **APIs & Services → Enabled APIs** — confirm **Google Calendar API** is enabled.
3. **Credentials → the OAuth 2.0 Client ID** → **Authorised JavaScript origins**
   must list **both**:
   - `http://localhost:5173`
   - `https://<the GitHub Pages origin>`
4. **OAuth consent screen** — while the app is in *Testing*, add your own Google
   account under **Test users**, or consent silently fails.
5. Scope must include `https://www.googleapis.com/auth/calendar.readonly` and
   nothing wider. **Premed OS reads; it never writes to a calendar.**
6. Then: connect in-app, and confirm a real event you can see in Google Calendar
   appears in the Calendar review route. **That last step is the verification —
   a rendered route is not proof.**

⚠️ **Until step 6 passes, Academics cannot reach stage F**, because condition 5
requires every integration coded *and* configured.

---

## 2. References

**Read before deciding. Not optional.**

- **Mockup:** `mockup-lab/01-academics/academics-grades-archive.html`
- **Its record:** `mockup-lab/01-academics/academics-grades-archive.md`
- **Recipes:** `mockup-lab/_shared/_visual-recipes.md` — panels `var(--card)` /
  16px, inner cards `var(--muted)` / 13px, and
  **"Glass — ONLY on the mode pill and the banner stat strip. Nothing else in
  the app gets glass."**
- **Spec:** `tabs/01-academics.md` §4.2 tab table · **§6.8 grade ledger** ·
  §4.2-D AMCAS-shaped record · §6.9 structural decisions
- **Catalog:** `tabs/01-academics-feature-catalog.md` — #2, #5, #7, #9, #19,
  #28, #35, #38, #43, #46, #47, #48, #50, #52, #66, #67 all land on Planning/Grades
- **Components:** `implementation/component-inventory.md`
- **U-rules:** `general.md` § *The nine universal rules*
- **Workflow:** `mockup-lab/VARIANT-LAB.md` → *The workflow — one tab at a time*

---

## 3. THE WORK — settle appearance for three views

**Nothing in `src/` is touched this pass.** The deliverable is a drawing plus a
ruling recorded in the `.md`.

### 3.1 Compare what is already drawn, and rule it

**Nothing needs drawing.** Serve `mockup-lab/` over http and open
`variant-lab.html` → Academics → Planning → **Grades & Archive** (page 26 of
81). The `RECORD VIEW` switcher moves between `Ledger` / `GPA` / `What-if`, and
← / → step A / B / C within the selected view. All nine render.

⚠️ **It must be served over `http://`, not opened as `file://`** — variant
injection needs the parent page and the embedded mockup to share an origin.
`mockup-lab/open-lab.command` does this on port 8765.

**Do not touch the `.md`'s `VIEW_VARIANTS` reference.** It is correct: the
registry is `const VIEW_VARIANTS` at `variant-lab.html:866`, and the
`"grades-archive"` entry starts at line 1098. Adding a line number to the
cross-reference is optional; removing or renaming it is wrong.

### 3.2 What each ruling must settle

For each of the three views, the record must state, in the `.md`:

1. **Which variant**, and the one-sentence reason.
2. **Hierarchy** — what leads the view, what is subordinate.
3. **Surface recipe per element** — which surfaces are panels (`var(--card)`,
   16px) and which are inner cards (`var(--muted)`, 13px), named against
   `_visual-recipes.md` **by value, not by token name**.
4. **Both themes.** Every surface must be stated for warm-dark and paper.
5. **Empty state** — what the view says with no graded work. `U-5`: a friendly
   one-liner, never a blank void, never a zero standing in for absent data.

### 3.3 Binding constraints on any ruling

- ⭐ **`U-9` — nothing scored, ranked, or compared.** The `gpa` view shows
  UNC and AMCAS **side by side with the delta explained**. It must not become a
  single academic score, a composite, a ranking, or a progress bar. The `.md`
  already excludes this; the ruling must not reintroduce it. **If a drawn
  variant implies one, the rule wins and the variant is wrong.**
- **AMCAS truncates, never rounds.** 3.667 → **3.66**, stated on screen.
- **Every repeat attempt stays in the ledger.** The superseded attempt is marked,
  not removed, and the row group says why.
- **Archive is a filter, not a page.** No separate Archive destination.
- **No celebration on a GPA number.** Celebrations are for real milestones only.
- **Probabilistic output renders as an interval, never a point estimate**
  (§6.12). The live projection reads *"projecting 3.4–3.6"*.
- **Insufficient data → dormant with a reason** (§6.10-A), never a zero.
- **What-if is scratch work.** It states so today and must keep saying so.

### 3.4 Where the spec and the drawing disagree

**None found in this pass.** If one appears while drawing, **the spec wins and
the mockup is wrong** — say so in the `.md` rather than quietly following the
drawing.

---

## 4. DO NOT BREAK

- **No `src/` change.** This is a decisions pass. If a change feels necessary,
  the stage is wrong — stop and re-run `TAB-BRIEF-PROMPT.md`.
- **No store, schema, or migration change.** `CURRENT_STORE_VERSION` stays at **24**.
- **Do not add a manifest row for the three ungated mockups.** Flipping a
  manifest row is Andy's decision (§1d).
- **Do not rebuild anything in §1c.**
- **Do not touch** `academics-mode-switch.html` or `class-center-study-hub.html`
  — both are concepts, both are manifest `NO`.
- **One accent.** `--primary` and `--cat-gpa` are both `#4b9cd3`. Do not
  reintroduce a second blue.
- **Not "Carolina blue", and no ram.** Premed OS is not affiliated with UNC
  (`05-public-and-account.md` §6.1).

---

## 5. DONE WHEN — each provable

Every line is a command, not a judgement:

1. **The `.md`'s registry cross-reference survives.**
   `grep -c VIEW_VARIANTS mockup-lab/01-academics/academics-grades-archive.md`
   still returns **`1`**, and `grep -n "const VIEW_VARIANTS"
   mockup-lab/variant-lab.html` returns **`866`**. The variants are already
   drawn (§1e) and the reference to them is accurate — **nothing to draw and
   nothing to rename.** The only deliverable here is the ruling itself.
2. **A ruling is recorded per view.**
   `grep -ci 'the ruling' mockup-lab/01-academics/academics-grades-archive.md`
   returns ≥ `3`. Today it returns **`0`**.
3. **Appearance is recorded, not just behaviour.** The `.md` names a hex value
   and a radius for every surface in all three views, in both themes.
4. **No score survives the ruling.**
   `grep -niE 'composite|overall score|academic score|ranking|progress bar'`
   over the `.md` returns nothing that asserts one. `U-9`.
5. **No `src/` diff.** `git diff --name-only -- src/` is **empty**.
6. **No store-version change.** `grep -n 'CURRENT_STORE_VERSION = ' src/store/store.ts`
   still reads **24**.
7. **Each ruling is reproducible.** The `.md` names the lab page and the
   view/variant coordinates a reader can re-open to see the same comparison.

---

## 6. COMMIT

One line, this pass only. Unrelated changes commit separately.

```
docs(academics): rule the Grades & Archive composition for all three views
```

Record the hash in `academics-grades-archive.md` under the ruling, the way
`academics-planner-prototype.md` records `088144b`.

---

## 7. NEXT STAGE — named, and NOT in scope here

Once the ruling is recorded, re-run `TAB-BRIEF-PROMPT.md` on Academics. It will
land on **C · DECIDED, NOT BUILT** for Planning/Grades: a full implementation
brief, frontend and backend together, building the three views against the
ruling made here.

**Explicitly out of scope for this brief:**

- Any `src/` code, including the three views.
- The `what-if` inverse solve, the AMCAS ledger maths, and the year-by-year trend.
- `academics-forecast-accuracy.html` and `academics-term-retrospective.html` —
  **ungated**; they need a manifest row from Andy before any pass may touch them.
- The `tar-heel-tracker` / `requirements` duplication.
- Google Calendar verification — that is the **ANDY CHECKLIST** in §1f, not
  agent work.
- Full mock, the one study-method step still `hasEngine: false`.
- Canvas Path B, Atlas, and UNC grade distributions — all blocked upstream by
  the spec itself.

---

**This brief is complete for stage B.** The one thing it cannot settle on its
own is the ruling: **which variant** is Andy's call, and so are the three
missing manifest rows.
