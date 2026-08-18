# ~~I1 · Google Calendar~~ — SUPERSEDED. Do not implement.

> **⚠️ This brief was written against a bad audit and describes work that does not need doing. It is kept only so nobody re-derives it.**

## What actually exists

**The integration is built.**

| | |
|---|---|
| `src/lib/googleCalendar.ts` | Google Identity Services token client · `connectCalendar` · `connectCalendarSilent` · `disconnectCalendar` · `fetchPrimaryDayEvents` |
| `src/hooks/useCalendarSync.ts` | Wires it to the UI, reads `VITE_GOOGLE_CLIENT_ID` |
| `src/components/common/HeroDailySchedule.tsx` | Consumes it with cache, staleness, mock preview, and empty states |
| Scope | **`calendar.readonly`** — correct per `00-product-shell.md` §540 |

## ⚠️ The mistaken requirement — do NOT build this

The superseded brief called for *"a durable connection that survives sessions and refreshes safely through a backend."*

**That is wrong.** The current design uses **Google Identity Services short-lived access tokens with silent renewal** (`connectCalendarSilent`). For a **static site with no application server**, this is the correct pattern:

- **There is no refresh token**, so there is nothing to leak from the browser.
- Silent renewal handles session continuity without server-side storage.
- **A backend token service would add an attack surface and a dependency to solve a problem this design does not have.**

**Do not build an Edge Function token exchange. Do not store refresh tokens. Do not treat session-scoped connection as a defect.**

## What IS outstanding — configuration only, no code

1. **`VITE_GOOGLE_CLIENT_ID` and `VITE_GOOGLE_API_KEY`** are not set in `.env.local`. Without a client ID, `connectCalendar('')` silently does nothing.
2. **Google Cloud Console** — the README documents enabling the **Drive** API only. **Enable the Google Calendar API**, and list `calendar.readonly` on the consent screen.
3. **Authorized JavaScript origins** — add the local dev origin and `https://sasquach67.github.io`. GIS rejects unlisted origins.
4. **⚠️ `.github/workflows/deploy.yml` injects only the two Supabase secrets.** The Google vars must be added to its `env:` block, **or the deployed build will not have them even if the repo secrets exist.**

## Why this file was wrong

An early audit grepped `src/` for `googleapis|gapi|calendar` and returned nothing, and that was trusted instead of checked further. **`googleCalendar.ts` was there the whole time.**

**The lesson is the one this repo keeps re-learning: a negative grep is not evidence of absence.** Confirm against the actual files before writing a brief that assumes something does not exist.
