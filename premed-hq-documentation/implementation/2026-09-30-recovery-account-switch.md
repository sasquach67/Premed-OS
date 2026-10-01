# Recovery account switch

Status: local candidate; deployment held for review and a separate header decision.
Base: c64823d40afb1ed4ed090c3629ea21114d1775ee.

## Behavior

The pre-App recovery fence now shows the current session email and a “Sign out and use a different account” action. It calls the existing client with `auth.signOut({ scope: 'local' })`, then presents the existing email form. UUID equality remains the ownership gate. No workspace key, pointer, record, originals, schema, provider configuration, or sync layer is changed by switching. The action does not navigate, reload, mount App, fetch a dashboard, or restore a copy. Local sign-out revokes the current Auth session; it is not a promise of single-tab isolation or zero Auth network requests.

Reviews are invalidated when switching starts and on auth events, including same-account sign-in. Late initial-session responses and sign-out results cannot replace a subsequently observed session. Failed sign-out retains the observed session and permits retry and fresh review. File/account preparation retains the existing context checks.

There is no trustworthy owner-email map in workspace metadata. Editable/imported profile email is not ownership proof, so the screen shows only the current session email and no invented owner hint.

## Account identity investigation

Google and magic-link entry points use the same configured Supabase client. The Google entry invokes OAuth without an explicit account chooser, login hint, or identity-linking operation. The ordinary email entry permits creation of a previously nonexistent account; the recovery form already uses `shouldCreateUser: false`.

Supabase documents automatic linking for eligible same-email identities, with email verification protections. Provider choice alone does not prove the reason for separate user IDs. Exact selected emails, aliases, historical account/project state and hosted provider settings remain unverified. No real account or token was inspected.

Minimal safe next options are the recovery escape in this change and clearer signed-in email/account-selection guidance. Provider/linking changes require a separate authorized investigation of account UUIDs, exact emails, verification state and provider identities. Linking must not be described as merging existing workspaces.

References: [identity linking](https://supabase.com/docs/guides/auth/auth-identity-linking), [passwordless email](https://supabase.com/docs/guides/auth/auth-email-passwordless), [sign-out scopes](https://supabase.com/docs/guides/auth/signout).

## Validation

- Missing-action regression failed before implementation; original nine recovery component tests passed.
- After implementation: 17 recovery component tests passed, including preserved partial IndexedDB record/originals/pointer, failed sign-out/retry, late success/rejection, old initial session, same-account re-sign-in and delayed file/account preview.
- Production build and targeted component/test ESLint passed. Build retains the existing large-chunk warning.
- Disposable Chromium contexts, localhost only: light/dark at 375 and 1280 px. Wrong account → signed out → intended account enabled account restore, with unchanged local storage, zero dashboard calls, no recovery callback, no page errors or horizontal overflow. No real browser profile was opened. This verifies component behavior with a synthetic Auth client, not live provider configuration.

## Copy-review mismatch investigation

A separate synthetic audit reproduced housekeeping-only conflicts for lastOpenedAt, recentRoutes and calendar.lastSyncedAt. The merge/sync comparison uses comparableAccountContent; accountMutationSafety cached-versus-cloud comparison used stricter syncContent. This is a possible explanation for contradictory screens, not a forensic conclusion about a real workspace. No universal restore loop was established. The comparison fix is separately reviewed and committed; exact selected-cloud freshness, payloads and baseline digests must stay unchanged.
