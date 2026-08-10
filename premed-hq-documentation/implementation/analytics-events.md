# Analytics Events

**Status:** Stub — content TBD. (This file previously held an outdated draft of the intelligence framework, which is fully superseded by `architecture/02-global-intelligence-framework.md`. Replaced with an honest analytics-events outline.)

## Purpose

Define the canonical analytics event taxonomy: event names, when they fire, and their properties. Referenced by every spec that instruments behavior (e.g., `specifications/00-product-shell.md` §12).

## Conventions

- Naming: `domain.object_action` (e.g., `shell.palette_opened`, `quickadd.record_created`).
- Payloads carry ids and types only — never record content or PII.
- Every instrumented behavior lists its events in its own spec; this file is the registry of truth.

## Planned sections

- Shell events (palette, quick add, attention bell, sidebar, nav) — seeded by `00-product-shell` §12
- Per-tab events (creation, edit, archive, domain actions)
- Intelligence events (recommendation shown/accepted/dismissed, per `architecture/02`)
- Integration/sync events
- Property dictionary and allowed value sets
- Privacy rules (what must never be logged)
