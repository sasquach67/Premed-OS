# Help

**Status:** Stub — seeded outline (structure + anchors in place; full spec TBD).
**Sidebar group:** Support · **Spec type:** domain tab
**Depends on:** `specifications/00-product-shell.md`, `specifications/01-shared-interface-patterns.md`, `architecture/04-admissions-framework.md`, `general.md`

## Ownership (from shell §2.2)

- **Owns (canonical create/edit/archive):** Static guidance content, community links
- **References only:** —

## Primary metrics (from architecture/04 — domain-appropriate only)

- None (static support content)

> **Do-not-generalize anchor:** No domain metrics. Do not turn Help into a tracker or dashboard.

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

No domain metrics. Do not turn Help into a tracker or dashboard.

## Acceptance criteria

Measurable implementation criteria (TBD).

## Open decisions

Unresolved design/product questions (TBD).

---

## ⚠️ WHAT HELP MUST CARRY — Aug 2026

**A pattern emerged across the `U-12` audit: HQ repeatedly points AT a better tool rather than rebuilding it.** **Those pointers need a home, and several are already specced individually.**

| Pointer | Where it was ruled |
|---|---|
| **Anki + MileDown (free)** | `M-ANKI`, audit §1 |
| **LabArchives** — free to UNC undergrads | `N-12`, `U-12` |
| **Zotero / Sciwheel** | `B-6`, `B-7` |
| **Interfolio · AAMC Letter Writer Portal** | audit §3 |
| **AAMC MSAR** (`$28`/yr) | audit §4 |
| **UNC OUR opportunities database** | `D-4` |
| **Wispr Flow** | the dictation ruling |

**⚠️ Every one is `U-8`: states that the tool exists, never instructs the student to use it.** **Each is dismissible and fires once** (`U-1`).

**⚠️ Help is NOT Atlas.** **Atlas answers premed questions from an external corpus with a citation obligation. Help explains HQ.** **Do not fold one into the other** (`general.md` `U-11`).
