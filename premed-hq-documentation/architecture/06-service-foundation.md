# Service Foundation

## Authentication

Specify email/password authentication, Google sign-in, verification, password reset, secure sessions, protected routes, logout controls, account deletion, and data export.

## User ownership

Every record must be scoped to the authenticated user. No cross-user reads or writes.

## Onboarding

Onboarding should configure the workspace using only information that changes defaults, timelines, or recommended setup.

## Cloud data

Define:

- Production database
- Local-to-cloud migration
- Offline behavior
- Sync conflict handling
- Backup and recovery
- Export format
- Data deletion workflow

## Integrations

Priority:

1. Google Calendar
2. Google Drive
3. Gmail
4. File uploads
5. Calendar import
6. CSV import

Each integration needs connect/disconnect, permissions, sync status, error state, retry, and last-sync visibility.

## Reference-data refresh (required service)

The service foundation must provide a **scheduled change-detection job** for Category-A reference data (`data/*.json`): on a per-dataset cadence, re-fetch each dataset's `sourceToMonitor`, diff key fields against the committed data, and raise an Attention item with the record-level diff when they diverge. Updates are **never auto-applied** — a human approves; the approved update is re-fetched, verified, and committed with a fresh `retrievedAt`/`source`. Full spec: `implementation/data-refresh.md`. Interim (pre-backend), the same loop runs as a Cowork scheduled task.

## Billing

Design entitlements separately from UI visibility. Core data ownership and basic tracking should remain usable. Advanced automation, analytics, storage, integrations, and export tooling may be gated.

## Security and privacy

- Least-privilege scopes
- Encrypted tokens
- Secure session handling
- Audit logging for critical actions
- No PHI encouragement
- Clear data export and deletion
