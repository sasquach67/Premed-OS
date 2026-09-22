# Dashboard text encoding

`dashboards.data` normally stores the workspace as a JSONB object. PostgreSQL JSONB rejects U+0000 and unpaired UTF-16 surrogates, which can occur in imported PDF excerpts. Do not remove those characters from source evidence to make sync succeed.

For affected workspaces, `src/lib/dashboardTransport.ts` stores an envelope:

```json
{"format":"premed-os-dashboard-json-text-v1","json":"<JSON.stringify(workspace)>"}
```

The extra JSON string layer preserves otherwise unsupported characters as literal escapes. The shared Supabase client's fetch boundary encodes all dashboard writes and decodes dashboard reads before validation, account comparison, sign-in setup, or restoration. Other endpoints, credentials, ownership checks, conditional-write filters, and file uploads are unchanged. Local storage and exports keep the original workspace shape and text.

Raw SQL/administrative readers must recognize this envelope. Do not cast its inner JSON text to JSONB, which would recreate the original Unicode error. Decode it with a JSON parser outside PostgreSQL. Ordinary dashboard rows remain compatible with existing readers; older app releases cannot read encoded rows and must be refreshed before continuing.

Verification includes an actual Supabase SDK write/read test, unchanged legacy rows, unrelated endpoint passthrough, and unchanged error/empty responses. Account recovery still requires its existing verified backups, explicit choice, and compare-and-set confirmation.
