# Letters: feature catalog

**Companion to `tabs/10-letters.md`.** **30 features. 28 ruled, 2 cut on primary source, 0 open.**

**Column key:** see `HANDOFF-2026-08.md` §3.
**Where a row and the spec disagree, `10-letters.md` wins and this file is stale.**

> **⚠️ Read this before scanning the rows.** Letters was reframed in Aug 2026 and the rows only make sense inside the reframe.
>
> **It is not a tracker. It is the three years before the ask.** Andy: *"The backbone of a recommender is that you guys have formed a relationship over time… It needs help with the backend stuff — leading up to asking your recommender for a letter."*
>
> **`LT-29` is the row that enforces it:** the letter machinery does not render until the cycle is near. For two or three years this tab is a people tab, and that is the design rather than a limitation.

---

## Wave 0 · The people model — everything else sits on this

| # | Feature | Surface | Origin | AI | St | Note |
|---|---|---|---|---|---|---|
| **LT-17** ⭐ | **A professor record starts at *"I am in their class"*** | People (list) | `own` | ○ | `spec` | **The whole reframe in one row.** A `Person` exists the moment the course does. **Cheaper than it looks — `01` §3.3's `ProfessorModel` already carries `personId` + `courseId`** |
| **LT-18** | **Two-time instructors surface automatically** | People (list) | `own` | ○ | `spec` | One person, two `courseId`s. Deterministic, free, **and the best signal in the pool** |
| **LT-27** ⭐ | **A mentor is a person with zero letter requests** | People (list) | `own` | ○ | `spec` | **`one record, two doors`, 4th instance.** Letters is the AGGREGATE door for people; pillars show scoped views. **A filter, never a copy** |
| **LT-28** | **The letter is an optional child of the person** | data model | `own` | — | `spec` | **Now STRUCTURAL, not editorial.** The model cannot express *"person who exists only to write me something"* |
| **LT-13** | **`asked → agreed → submitted` on a `LetterRequest`** | Requests (panel) | `own` | ○ | `spec` | **Not on the person.** Supports reapplying; **a mentor carries no status field at all — absent, not blank** |
| **LT-24** | **What you talked about** | Person (panel) | `own` | ○ | `spec` | **A running notes field**, not per-visit records |
| **LT-26** | **Contact staleness** | Person (panel) | `core*` | ○ | `spec` | Generalised from `06` §7. **Information about a relationship, never a nag about a person** |

## Wave 1 · The loop that makes it happen

| # | Feature | Surface | Origin | AI | St | Note |
|---|---|---|---|---|---|---|
| **LT-30** ⭐ | **Letters ↔ Academics, both directions** | cross-tab | `own` | ○ | `spec` | Topic goes out to the class's *Questions to ask*; **checking it off bumps `lastContactAt` and appends to notes.** **Rides feature #15's existing trigger — no new surface, no new notification** |
| **LT-29** ⭐ | **Phase gate — letter machinery is ABSENT early** | tab | `own` | ○ | `spec` | **Not greyed out.** A greyed pipeline still frames every professor as a future signature |
| **LT-20** | **THE DOSSIER — their work, as links** | Person (panel) | `own` | ○ | `spec` | **Links out, never fetches.** `U-12`: Scholar and PubMed do this better. **HQ's layer is that it sits next to your relationship record** |
| **LT-21** | **Something to open with** | Person (panel) | `own` | ● | `spec` | **The tab's ONLY LLM dependency.** Runs on material the student pastes in. **A subject to raise, never a line to recite.** Degrades to the two records side by side |
| **LT-19** | **Science / humanities coverage from the course list** | People (panel) | `own` | ○ | `spec` | **Sourced to HPA**: one science professor, one humanities-or-social-science, one of your choosing. **States the shape. Never says the file is insufficient** |

## Wave 2 · The ask

| # | Feature | Surface | Origin | AI | St | Note |
|---|---|---|---|---|---|---|
| **LT-1** ⭐ | **Assemble the packet** | Request (page) | `own` | ◑ | `spec` | **4th instance of assemble-and-hand-over** (`RO-3` · `E-16` · `LT-1` · Profile/CV `P-39`). CV lines · PS (**`ready` only**) · what you did with this person · deadline · route |
| **LT-2** | **Writer-reminder FACT LIST** | Request (panel) | `own` | ○ | `spec` | **Facts, never prose.** Was specced `●`; **it requires no LLM** — a query over records HQ already holds |
| **LT-3** | **HQ never sends it** | guard | `own` | — | `spec` | **Download + clipboard. No mailto.** Same as `RS-BIG-3` |
| **LT-9** | **Ask lead time** | Request (panel) | `own` | ○ | `spec` | **Sourced to HPA**: formal request in the spring, earlier for early deadlines, **ask before you graduate even with a gap year**. Never a countdown |
| **LT-11** | **Send an update before they write** | Request (panel) | `own` | ○ | `spec` | Fires **once**, on `asked → agreed`. Reuses the packet |
| **LT-15** | **Waiver recorded** | Request (panel) | `own` | ○ | `spec` | **On the request, not the person.** HQ records THAT you waived. **The letter itself never enters HQ** |
| **LT-12** | **Thank-you** | Request (panel) | `own` | ○ | `spec` | **One line on `submitted`. Never a task, never tracked.** A tracked thank-you is the checklist-ification `LT-22`/`LT-28` prevent |

## Wave 3 · Ceded and cut — with the reason, so none of it returns

| # | Feature | St | Why |
|---|---|---|---|
| **LT-6** | `cut` | **CEDE — MSAR holds per-school requirements** (`U-12` audit §4). They change annually; republishing them means shipping stale data |
| **LT-7** | `cut` | **MERGED into `LT-19`.** Two coverage reads on one page is how `U-9` gets violated by accident |
| **LT-10** | `cut` | **MERGED into `LT-26`.** The same staleness feature written twice in one file |
| **LT-8** | `cut` | **`U-9`.** And HPA agrees: *"quality is weighed more heavily than quantity."* **⚠️ The student's OWN self-entered "how strong" field stays — HQ must never compute one** |
| **LT-14** | `cut` | **`U-7`, no non-events.** *No reply is not a rejection.* Same ruling as `S-36` and `RS-BIG-2`. **If they said no, you delete the request** |
| **LT-16** | `cut` | **HQ does not manage a professor's obligations**, and a student cannot chase a letter writer without cost |
| **LT-22** | `cut` | **Hard cut, and the dossier's whole guard.** No personal details, no social media, no third-party opinions. **Test: would you be comfortable if the professor saw this screen?** |
| **LT-23** | `cut` | **No event log.** A record type with no natural trigger is one nobody fills — `RM-1`'s own lesson. Replaced by `lastContactAt` + notes |
| **LT-25** | `cut` | Hung on the visit event `LT-23` no longer creates, **and it turns a chat into homework** |
| **LT-4** | `cut` | **CONFIRMED: there is no pre-medical committee at UNC** (`hpa.unc.edu`, primary source, mod. 2024-06-17). **Returns only if a second institution is supported** |
| **LT-5** | `cut` | Cut with `LT-4`. **No committee means no earlier deadline — which also closes the `LT-29` phase-gate hole** |

---

## Cross-cutting: what Letters depends on

| Dependency | Rows blocked | State |
|---|---|---|
| **`ClassWorkspace.instructor` → `Person`** | `LT-17`, `LT-18`, `LT-19`, `LT-30` | **⚠️ BLOCKING INCONSISTENCY.** `ClassWorkspace` holds `instructor` as a plain field; `ProfessorModel` holds `personId`. **Two representations of one human.** Fix belongs in the **Academics** chunk |
| **Academics "Questions to ask" + feature #15** | `LT-30` | Already specced (`01` §373, #15). **Both halves exist; nothing connected them** |
| **Story Bank `draft \| ready`** | `LT-1` | Specced (`09` §8). **First load-bearing use outside that tab** |
| **Profile/CV CV lines** | `LT-1` | Board written, tab not yet specced |
| **Atlas coffee-chat capture** | `LT-26` | `02` §5. Second trigger for `lastContactAt` |

## Still open

1. **⚠️ `LT-21`'s input needs Andy's confirm.** Ruled to run on pasted material because `LT-20` links out — **this resolved a conflict between two of his own answers rather than implementing either literally.**
2. **The tab's name.** It holds all your people and it is called Letters. **Same problem the handoff records for Story Bank — decide both renames together.**

## No mockup exists

**Letters has no mockup**, so it is a design job before it is a code job — same as Extracurriculars, Shadowing, Research, Volunteering, School List, Timeline, Profile/CV, Help, Settings and Atlas.

**The surface worth drawing first is the person record**, because it is where `LT-20`, `LT-21`, `LT-24`, `LT-26` and the phase gate all meet, and because it is the screen a first-year sees for three years before anything else in this tab exists.
