# Deploying the AI study-tools function

The recall session's gap-check runs in a Supabase Edge Function so the model API
key stays server-side. This app deploys as **static GitHub Pages** — any
`VITE_*` variable is compiled into the public bundle, so a model key can never
live in `.env`. Only the Supabase *anon* key belongs there; it is public-safe by
design and RLS protects the data.

## Three surfaces — they are not interchangeable

Most of the confusion here is putting the right thing in the wrong place.

| Surface | What runs there | Used for |
|---|---|---|
| **SQL editor** (dashboard) | Postgres SQL only | Running `schema.sql` and `migrations/*.sql` |
| **Edge Functions → Secrets** (dashboard form) | Nothing — a name/value form | API keys |
| **Terminal** (Mac Terminal / iTerm) | Shell commands | `brew`, `supabase link`, `supabase functions deploy` |

Anything starting with `supabase ` is a **terminal** command. Anything shaped
like `select … from …` is the **SQL editor**. An API key is neither — it is a
form field. Never paste a key into the SQL editor: the query fails *and* the
editor saves the snippet, so the key persists in your saved queries.

## Order of operations

### 1. Restore the project (dashboard)

Free-tier projects pause after ~7 days idle. Dashboard → the project →
**Restore project**. The project URL and anon key survive a restore, so
`.env.local` and the `VITE_SUPABASE_*` GitHub Actions secrets keep working.

### 2. Check the D6 migration has run (SQL editor)

```sql
select to_regclass('public.academic_source_chunks'), to_regclass('public.ai_usage_buckets');
```

Two nulls means it hasn't. Paste the contents of
`migrations/20260727_d6_ai_coverage.sql` into the SQL editor and run it. It
enables the `vector` extension, creates the chunk store with RLS, the
`ai_usage_buckets` rate limiter, and `match_academic_chunks()`.

### 3. Add the secrets (dashboard form)

Edge Functions → Secrets. Names must match exactly — the function reads them by
name, and a typo surfaces as a generic "provider unavailable", not as a
configuration error.

| Name | Required? | What it does |
|---|---|---|
| `OPENAI_API_KEY` | **Yes** | Primary generation for study resources, Term Reports, and gap checks |
| `ANTHROPIC_API_KEY` | Optional | Independent secondary audit of generated study resources and Term Reports |
| `OPENAI_EMBEDDING_API_KEY` | Optional | Semantic retrieval. Without it, retrieval falls back to the 24 oldest chunks for the topic |
| `OPENAI_MODEL` | Optional | Overrides the OpenAI generation model default (`gpt-5.4-mini`) |
| `ANTHROPIC_MODEL` | Optional | Overrides the code default (`claude-opus-5`) |
| `AI_PROVIDER` | **Leave unset** | Legacy gap-check override. The default is OpenAI; generated resources always use OpenAI primary routing |

Paste values raw — no surrounding quotes, no trailing whitespace.

### 4. Deploy the function (terminal)

Only this step needs the CLI.

**You do not need Homebrew.** Verified Aug 19, 2026: this machine has no `brew`
at all, which is what "command not found" actually means here — it is brew that
is missing, not the Supabase CLI. `npx` runs the CLI without installing
anything, without sudo, and without touching `package.json`:

```bash
npx --yes supabase@latest --version
```

Use `npx --yes supabase@latest <command>` in place of `supabase <command>`
everywhere below. The Homebrew route still works if you would rather have it
on PATH permanently:

```bash
brew install supabase/tap/supabase
```

```bash
cd ~/Documents/premed-os
```

First authenticate — **this step is yours**, it opens a browser and signs in to
your Supabase account:

```bash
npx --yes supabase@latest login
```

Then link. This project's ref is derived from `VITE_SUPABASE_URL` in
`.env.local`, so it is filled in here rather than left as a placeholder:

```bash
npx --yes supabase@latest link --project-ref poichxqptuupzrkyewrq
```

`link` pairs this folder with one cloud project so later commands know where to
send things. `YOUR_PROJECT_REF` is the string in your dashboard URL
(`https://supabase.com/dashboard/project/<ref>`), also under Project Settings →
General → Reference ID. It may prompt for a database password; you can skip
that for functions and secrets work.

```bash
npx --yes supabase@latest functions deploy study-tools
```

**Check it worked** — this is the fastest way to tell deployment apart from a
key problem, and they are different failures:

```bash
curl -s -o /dev/null -w "%{http_code}\n" -X POST "$(grep '^VITE_SUPABASE_URL=' .env.local | cut -d= -f2-)/functions/v1/study-tools" -H "Content-Type: application/json" -d '{}'
```

`404` = the function is not deployed, and no secret can help until it is.
`401` = deployed and correctly rejecting unauthenticated calls. The current
production deployment should return `401` for an unauthenticated request.

⚠️ **Do not paste the API key into a command someone else runs for you.** Use
the dashboard's Edge Functions → Secrets form, or run
`npx --yes supabase@latest secrets set ANTHROPIC_API_KEY=...` yourself in your
own terminal. The key should never appear in a shared transcript.

### 5. Sign in

The function rejects unauthenticated calls (`sign-in-required`). Settings →
Cloud sync & login → magic link. The gap-check button in the recall session is
gated on `isSupabaseConfigured`, so it stays disabled until the client has
`VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`.

## Two things worth knowing about the function

**OpenAI generates; the server verifies.** Generated artifacts must emit exact
source references or source chunk IDs. The function closes those references
against its server-owned chunks and rejects unsupported or invented references
before anything can be saved.

**Anthropic audits without rewriting.** When `ANTHROPIC_API_KEY` is configured,
Anthropic checks the verified OpenAI artifact against the same source material
and may reject it, but never edits or replaces it. If the auditor is missing or
temporarily unavailable, deterministic server validation still gates the result
and the response reports `auditStatus: skipped` or `unavailable`.

## Rate limits

`claim_ai_request_v2` caps public-beta usage at **20/hour and 100/day per
user**, plus the shared weekly reservation ceiling. It returns the exact limit
and reset time to the app. The server-controlled founder identity bypasses
those public limits without consuming the shared bucket; browser metadata or an
email string cannot grant that access.

## Optional Google Drive materials folder

`google-drive-materials` is separate from the existing browser-only Google
Drive **backup** integration. It requests `drive.readonly` only after a
student explicitly selects one folder; the server uses it only to stage
metadata proposals and to retrieve a single file after that proposal is
accepted. It never mirrors a folder to Supabase Storage.

Before deploying it, apply
`migrations/20260824044417_academic_material_source_connections.sql`, then set
these **Edge Function Secrets** (never `VITE_*`):

| Secret | Purpose |
|---|---|
| `GOOGLE_DRIVE_CLIENT_ID` | OAuth web client ID for the server-side folder reader |
| `GOOGLE_DRIVE_CLIENT_SECRET` | matching OAuth client secret |
| `MATERIAL_SOURCE_TOKEN_ENCRYPTION_KEY` | random 32-byte key, base64 encoded; encrypts refresh tokens before database storage |
| `PREMEDOS_APP_ORIGIN` | exact deployed app origin, e.g. `https://premedos.app` |
| `MATERIAL_SOURCE_ALLOWED_ORIGINS` | comma-separated exact browser origins, including the production and deliberate local dev origin |

Enable the Google Drive API and add
`https://<project-ref>.supabase.co/functions/v1/google-drive-materials?action=callback`
as the OAuth client’s **exact** redirect URI. Add `drive.readonly` to the
consent-screen scope disclosure and update the public privacy explanation
before asking a user to connect a folder.

Google's callback does not carry a Premed OS bearer token. Keep browser-route
authentication inside the handler and retain this function-specific setting in
`supabase/config.toml`:

```toml
[functions.google-drive-materials]
verify_jwt = false
```

Deploy with:

```bash
npx --yes supabase@latest functions deploy google-drive-materials --no-verify-jwt
```

Then use a non-admin account and a disposable folder to verify: connect → list
metadata → review/accept locally → record accepted revision → download that one
file → disconnect. A static GitHub Pages browser cannot watch a folder in the
background; v1 offers an explicit check only.
