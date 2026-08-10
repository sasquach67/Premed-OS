# School List

**Status:** Stub — seeded outline (structure + anchors in place; full spec TBD).
**Sidebar group:** Application · **Spec type:** domain tab
**Depends on:** `specifications/00-product-shell.md`, `specifications/01-shared-interface-patterns.md`, `architecture/04-admissions-framework.md`, `general.md`

## Ownership (from shell §2.2)

- **Owns (canonical create/edit/archive):** Schools, list tiers, per-school requirements
- **References only:** Essays (secondaries), applicant stats (from Profile/Academics)

## Primary metrics (from architecture/04 — domain-appropriate only)

- School count and tier balance (reach/target/likely)
- Per-school requirements and prerequisites
- Mission/profile fit (transparent components, never a black-box score)

> **Do-not-generalize anchor:** Tier balance is School-List-only. Do not invent an admissions-odds score (`04` guardrail).

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

Tier balance is School-List-only. Do not invent an admissions-odds score (`04` guardrail).

## Acceptance criteria

Measurable implementation criteria (TBD).

## Open decisions

Unresolved design/product questions (TBD).

---

## ⚠️ `U-12` ruling — MSAR. CEDE the data, keep the list. (Aug 2026)

**Full pass: `implementation/U-12-incumbent-audit.md` §4.**

**AAMC MSAR is `$28`/year (`$36` for two).** **It is the only source carrying data directly from the MCAT exam, the AMCAS application, and admissions offices**, and it already offers sort, browse, and side-by-side comparison of up to ten schools.

### ⚠️ HQ MUST NOT BUILD

**A medical school database. Median GPA or MCAT figures. Acceptance rates. In-state percentages. A school comparison table.**

**Two reasons and either alone is sufficient:**

1. **MSAR's data is licensed. Republishing it is not HQ's to do.**
2. **Any hand-maintained copy is stale within a year, and stale admissions data is worse than absent** — a student who applies off a wrong median has been actively harmed.

### What HQ keeps

**The student's own list.** Which schools, **why each one is on it in their own words**, reach/target/likely **as the student's judgement and never a computed tier** (`U-9` — nothing is scored), application status, secondaries, interviews, and the dates.

**MSAR tells you about schools. HQ tracks YOUR application to them. There is no overlap.**

**The pointer out** (`N-12` pattern): **one dismissible mention that MSAR exists and what it costs.** **`U-8` — states it, never instructs.**
