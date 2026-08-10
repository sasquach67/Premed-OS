# 08 — Platform & Business Operations

**Status:** Stub — content TBD. (This file previously contained a duplicate of `06-service-foundation.md`; replaced with an honest outline.)
**Depends on:** `06-service-foundation.md`, `general.md` (billing and entitlements)

## Purpose

Define the business and operational layer: pricing, plans, entitlements, limits, and the operational concerns of running Premed OS as a service. `06` covers the technical service foundation; this file covers the commercial and operational model built on top of it.

## Planned sections

- Plan tiers and what each includes (per `general.md`: core tracking stays usable free; advanced analytics, integrations, automated sync, smart review, export, customization may be gated)
- Entitlement model (separate from UI visibility, per `06`)
- Storage and file limits
- Free-plan floor (core data entry must remain usable)
- Support, feedback, and issue channels
- Operational metrics and cost considerations (ties to `02` intelligence-operations)
- Trust, data ownership, and export/deletion commitments as product promises

## Paywall / "Choose your plan" page (design reference — Andy, July 2026)

Modeled on the Mistake-to-Mastery pricing page. Reached from the profile popup's "Upgrade plan" (shell §7.2).

- **Header:** "Choose your plan" + one honest subhead ("Start free. Upgrade when you're ready…").
- **Tier cards, side by side** (equal height per `01` §5c — no protrusion): each has name, one-line positioning ("Low-commitment start" / "Best value"), price + period, a short bulleted feature list, and one CTA button. Accent-tint the recommended/best-value card (2px accent border, per `04`), not a different background.
- **Free tier** as a distinct full-width card below ("Permanent sandbox · $0") with a capped-but-real allowance and a "Continue with Free" CTA — the free floor is genuinely usable (per `general.md`).
- **FAQ** below the cards (plan expiry, what counts against limits, etc.).
- Example shape (M2M): 1-month / 4-month / year tiers + a permanent free sandbox with a small mistake cap. Premed OS's actual prices/limits TBD; gate advanced automation/analytics/AI, never core tracking, ownership, export, or deletion.
- All craft rules apply (`04`): restrained color, one CTA per card, sentence case, no AI-demo gradients-on-everything (a subtle per-tier tint is fine).

## Do not

Do not make core data entry unusable on a free plan. Do not gate data ownership, export, or deletion.
