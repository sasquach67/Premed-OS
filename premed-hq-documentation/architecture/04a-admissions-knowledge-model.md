# 04a — Admissions Knowledge Model

**Status:** Stub — content TBD. (This file previously contained a duplicate of `04-admissions-framework.md`; replaced with an honest outline.)
**Depends on:** `04-admissions-framework.md`, `architecture/01-global-design-system.md` (entity model), `general.md`

## Purpose

Define the structured knowledge model behind admissions reasoning: the canonical entities, controlled vocabularies, and relationships that let the platform reason about a pre-med profile without inventing admissions scores.

Where `04-admissions-framework.md` states the *rules* (which metrics matter per domain), this file defines the *data structures* that encode those rules.

## Planned sections

- Canonical admissions entities (Applicant profile, School, Program, Requirement, Prerequisite, Experience-type taxonomy, Competency/Core Competency, Timeline milestone)
- Controlled vocabularies (experience categories, clinical settings, recommender categories, competency list)
- Relationships (experience → competency, course → prerequisite, school → requirement)
- Derived admissions signals and their transparent components (never a black-box readiness score)
- Mapping to AMCAS/AACOMAS structures where relevant
- What is deterministic (requirements, prerequisites) vs. heuristic (profile balance)

## Do not

Do not restate the domain-metric guidance in `04`. Do not introduce a universal readiness score without transparent components (see `04` guardrails).
