# Premed OS Product Framework

This folder is the living product-specification system for Premed OS. It is the source of truth that coding agents (Claude Code / Codex) read before implementing.

## Folder map

- `architecture/` — the "why": global principles, intelligence, admissions logic, service foundation. Highest precedence.
- `specifications/` — the "how": implementation-ready specs for the shell and each interface area. Conform to architecture.
- `tabs/` — domain-specific tab behavior (Academics, Clinical, Research, …).
- `implementation/` — cross-cutting contracts: data model, API, integrations, analytics events.
- `general.md` — the consolidated global product spec (shell, entities, data intelligence, workflow features).

## Architecture files (precedence order)

Per `01` and `02`, precedence is: Vision → Design System → Intelligence Framework → the rest.

1. `00-product-vision.md` — why the product exists *(done)*
2. `01-global-design-system.md` — how it's structured and presented *(done, canonical)*
3. `02-global-intelligence-framework.md` — how it thinks *(done, canonical)*
4. `03-global-user-experience.md` — global interactions *(brief, real)*
5. `04-admissions-framework.md` — domain-metric rules *(done)*
   - `04a-admissions-knowledge-model.md` — the data model *(stub)*
   - `04b-pathway-research.md` — grounded pathway evidence *(stub)*
   - `04c-admissions-intelligence.md` — admissions domain intelligence *(stub)*
5. `05-development-governance.md` — how agents should implement *(brief, real)*
6. `06-service-foundation.md` — auth, cloud, integrations, billing *(brief, real)*
7. `07-product-experience-architecture.md` — end-to-end journeys *(stub)*
8. `08-platform-business-operations.md` — plans, entitlements, ops *(stub)*
9. `09-quality-governance-and-launch.md` — quality bar and launch gate *(stub)*

## Specifications

- `00-product-shell.md` — sidebar, top bar, palette, quick add, attention, responsive/a11y *(done)*. **The finalized sidebar reorganization + page-ownership map lives here (§2.1–2.2).**
- `01-shared-interface-patterns.md` — inspector, tables, split view, forms *(stub)*
- `02-atlas-interface-and-knowledge-map.md` — the four Atlas surfaces *(partial — key decisions locked)*
- `03-overview.md` — the Home / Overview page *(done)*

## Tabs (one file per sidebar page, in sidebar order)

Each is a seeded stub: correct title, ownership (from shell §2.2), domain metrics (from `04`), a do-not-generalize anchor, and the standard section skeleton — ready to fill.

`01-academics` · `02-mcat` · `03-clinical` · `04-volunteering` · `05-shadowing` · `06-research` · `07-extracurriculars` · `08-school-list` · `09-essays-story-bank` · `10-letters` · `11-timeline-tasks` · `12-profile-cv` · `13-help` · `14-settings`

(Overview and Atlas are pages too, but their specs live in `specifications/` because they're cross-cutting/large.)

## Implementation

- `data-model.md`, `api-contracts.md`, `integration-map.md`, `analytics-events.md` — all *(stub)*, to be written alongside the service foundation.

## Why service foundation comes late

Authentication, cloud persistence, integrations, billing, and deployment should implement a clearly defined product — not determine what the product becomes. The design system, intelligence model, user experience, admissions logic, and development rules are established first.

## Working method

- Global behavior belongs in `architecture/` and `general.md`.
- Implementation-ready behavior belongs in `specifications/`.
- Tab-specific behavior belongs in `tabs/<tab-name>.md`; every tab file must state what should not be generalized from other tabs.
- Shared behavior is documented globally, then adapted per tab.
- When implementation changes behavior, update the matching Markdown in the same commit (`05`).

## Status legend

*done* = written at reference density · *brief, real* = short but genuine content · *stub* = honest outline, content TBD. A stub is safe to read; it will not mislead. Do not treat a stub as finished requirements.
