# 04c — Admissions Intelligence

**Status:** Stub — content TBD. (This file previously contained a duplicate of `04-admissions-framework.md`; replaced with an honest outline.)
**Depends on:** `04-admissions-framework.md`, `04a-admissions-knowledge-model.md`, `04b-pathway-research.md`, `architecture/02-global-intelligence-framework.md`

## Purpose

Define how the intelligence framework (`02`) applies specifically to admissions: what admissions-domain reasoning, recommendations, and warnings the platform produces, and the guardrails on them. This is the Domain Intelligence layer (per `02`) for admissions.

## Planned sections

- Admissions reasoning modes (profile analysis, gap detection, balance assessment, timeline forecasting)
- Recommendation types (missing prerequisite, thin category, overdue letter, school-list balance) with explanations
- Warnings and their severity mapping (blocking / important / suggested)
- What is deterministic (prerequisite checks, deadline math) vs. probabilistic (profile strength, readiness)
- Confidence and uncertainty communication for admissions conclusions
- Hard guardrails: no admissions guarantees, no opaque scores, no equating quantity with quality
- Where admissions intelligence surfaces in the product (Overview widgets, School List, Attention bell, Atlas Intelligence)

## Do not

Do not predict admissions outcomes with certainty. Do not produce a readiness score without transparent, inspectable components. Every recommendation must explain why it appeared.
