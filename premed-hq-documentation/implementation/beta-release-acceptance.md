# Beta release acceptance

This checklist separates repository proof from external account and hosting proof. A passing build is not evidence that a live integration or response header works.

## Automated repository gate

Run sequentially from the repository root:

```sh
npm test
npm run lint
npm run build
npm audit --omit=dev --audit-level=high
```

After deployment, run:

```sh
npm run verify:production-security -- https://premedos.app/
```

The production-security command must fail when the live host omits CSP, HSTS, Referrer-Policy, Permissions-Policy, or `X-Content-Type-Options`. A policy checked into the repository is not a live pass until the response carries it.

## Two-account production isolation

Use two real beta accounts. Do not use demo data.

1. Sign in as Account A, create a uniquely named class and assignment, connect Calendar, then reload.
2. Confirm A's class, assignment, and Calendar state return.
3. Sign out through the confirmation dialog and confirm the signed-out destination contains no live workspace data.
4. Sign in as Account B. Confirm A's class and assignment are absent and Calendar is disconnected for B.
5. Create a different uniquely named class as B, reload, and confirm B's workspace returns.
6. Sign out, sign back into A, and confirm A's original workspace returns intact while B's data remains absent.
7. Enter Guest mode and confirm it receives a separate clean workspace.

Record the date, tester accounts, deployed commit, and result. Automated storage tests do not replace this production run.

## Integration acceptance

- Calendar: demonstrate the expanded consent screen, the exact least-privilege scope, the next four owned upcoming events, routine refresh without an account chooser while the grant is valid, and account-token separation.
- Generation: create one source-grounded study resource on the deployed site and verify the selected-source trace is saved with it.
- Syllabus: import one text PDF and one scanned document; review and confirm flagged fields; verify learning standards, dated readings, exams, assignments, meetings, and source evidence before applying.

## External release gates

- Google OAuth verification is approved for the exact Calendar scope used in production.
- Supabase leaked-password protection is enabled. The hosted project is currently on the Free plan; this control requires a qualifying paid plan in Supabase Auth settings.
- The `Premed OS` trademark/domain publication check is recorded as complete.
- The live host returns every security header checked by `verify:production-security`.

Until every external gate passes, release remains a controlled/private beta.
