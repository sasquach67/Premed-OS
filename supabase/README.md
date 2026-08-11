# Supabase setup — cloud sync + login

Premed OS can log you in with a one-time email link and sync your whole dashboard
across devices. localStorage stays the primary store; Supabase is the synced copy.

## One-time setup (≈3 minutes)

1. **Env vars** — already in `.env.local` for local dev (`VITE_SUPABASE_URL`,
   `VITE_SUPABASE_ANON_KEY`). For the deployed site (GitHub Pages), the anon key is
   public-safe, so either commit them into the build or add them as build-time env in
   the Actions workflow. Until they're present in the deployed build, the Settings card
   shows "Not configured" and the app runs offline as before.

2. **Create the table + security** — open the Supabase dashboard → **SQL Editor** →
   paste all of [`schema.sql`](./schema.sql) → **Run**. This makes a private-per-user
   `dashboards` table with Row Level Security.

3. **Auth URLs** — Supabase dashboard → **Authentication → URL Configuration**:
   - **Site URL:** `https://sasquach67.github.io/Premed-OS/`
   - **Redirect URLs:** add both
     `https://sasquach67.github.io/Premed-OS/` and (for local dev) `http://localhost:5180/`
   The magic-link email sends users back to these; unlisted URLs are rejected.

4. **Email** — the built-in email provider works out of the box for magic links
   (rate-limited). For production volume, set up a custom SMTP under
   Authentication → Providers → Email. No Google/OAuth setup needed for magic links.

## Using it
Settings → **Cloud sync & login** → enter email → **Send magic link** → open the link
in the same browser. After sign-in it reconciles (a fresh browser pulls your cloud data;
otherwise the newer copy wins) and then auto-pushes on every edit. **Pull from cloud** /
**Push now** are manual overrides.

## How it works (for maintainers)
- `src/lib/supabase.ts` — guarded client (null if env missing → app stays offline-capable).
- `src/store/useCloudSync.ts` — session tracking, login reconcile, debounced auto-push.
  Mounted once in `AppShell`. Sync metadata lives in a separate `premed_hq_cloud_meta`
  localStorage key, **outside** the synced data tree, so writing it never loops.
