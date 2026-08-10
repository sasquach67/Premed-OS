# Profile / CV

**Status:** Stub — seeded outline (structure + anchors in place; full spec TBD).
**Sidebar group:** Profile · **Spec type:** domain tab
**Depends on:** `specifications/00-product-shell.md`, `specifications/01-shared-interface-patterns.md`, `architecture/04-admissions-framework.md`, `general.md`

## Ownership (from shell §2.2)

- **Owns (canonical create/edit/archive):** Profile fields, auto-generated CV, resume doc
- **References only:** All experiences (read-only aggregation)

## Primary metrics (from architecture/04 — domain-appropriate only)

- Profile completeness
- CV section coverage
- Application-ready state

> **Do-not-generalize anchor:** Profile/CV is a read-only aggregation of experiences; never a second editing surface for records owned elsewhere.

---

## Purpose

Define the exact user outcome this tab supports.

## Primary users and stages

Which user stages rely on this tab and how needs change over time.

## Core entities

Records that belong here and the universal entities they reference.

## Core views

Purpose-built views, not a copied dashboard.

## Main workflows

Creation, editing, review, planning, export, archive.

## Smart features

Tab-specific rules, alerts, derived properties, recommendations, automations (per `architecture/02`).

## Visualizations

Charts/structures and the user question each one answers.

## Cross-tab relationships

Which tabs consume or contribute data.

## Inspector design

Object-inspector sections and quick actions (pattern: `specifications/01-shared-interface-patterns.md`).

## Empty, loading, and error states

First-use guidance and recovery.

## Mobile behavior

How the tab stays fully usable on small screens.

## Admissions-aware reasoning

What matters here from a pre-med and application perspective.

## Do Not Generalize From Other Tabs

Profile/CV is a read-only aggregation of experiences; never a second editing surface for records owned elsewhere.

## Acceptance criteria

Measurable implementation criteria (TBD).

## Open decisions

Unresolved design/product questions (TBD).

---

## ⚠️ CONSTRAINTS ALREADY RULED — Aug 2026. Read before speccing.

**Nothing below was decided in this tab. All of it arrived from elsewhere and binds.**

### 1. ⭐ The `draft | ready` boundary (Andy, Aug 2026)

> *"I think the profile CV should own the **completed stories or the fully fleshed-out stories that I'm ready to 'publish.'**"*

| | |
|---|---|
| **Story Bank** | **Where writing happens.** Unfinished text, drafts, material |
| **Profile/CV** | **What is FINISHED.** Only `status: ready` |

**⚠️ ONE RECORD WITH A STATE, NOT TWO RECORDS.** **`one record, two doors` — third application** (`03-clinical-views-board.md` V5). **Verify by grep for a second store.**

**Consequence: *"publish"* becomes a real action** rather than a vague handoff. **The student decides when something is done.**

### 2. AMCAS activities — the ownership split

**Profile/CV owns the 15 activities as CV LINES. Story Bank owns the TEXT** (`09` §8, `SB-26`).

**Reason: the 1,325-char most-meaningful is the hardest writing in the application, and writing it in a tab holding none of your material is the blank-page problem this app exists to solve.**

**⚠️ HQ NEVER picks the three most-meaningful** (`SB-27`, `U-9`). **It may show what material exists per activity. It never ranks them.**

### 3. Hours (`U-6`)

**Hours live in exactly one pillar. Profile/CV AGGREGATES and never double-counts.** **Research-for-credit is a course in Academics AND a project in Research — one hours figure** (`06` §9).

### 4. Constrained by V5

**`03-clinical-views-board.md` §66 already says this tab is constrained the same way Story Bank is.** **That was written before either existed. It still binds.**

### 5. `U-12` — no incumbent, BUILD

**Generic CV builders overlap only in output FORMAT, not in the four-year accumulation that feeds it** (`implementation/U-12-incumbent-audit.md` §6).

### ⚠️ Open

1. **Does Profile/CV render a printable CV, or only assemble the lines?** **A CV builder edges toward the word-processor cede.**
2. **Is there a public-facing profile?** **`05-public-and-account.md` may already answer this.**
