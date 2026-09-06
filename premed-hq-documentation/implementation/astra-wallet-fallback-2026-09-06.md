# Astra wallet first, bounded OpenAI backup

Authorized behavior: use Cheaper Inference for GPT-6 Astra requests; only a structured HTTP 402 `insufficient_balance` response permits one direct OpenAI retry. Keep the exact request/model unchanged. Owner chose a shared $10 weekly backup allowance. No switching on network errors, authentication errors, rate limits, unknown 402 reasons, invalid output, or reviewer rejection.

## Setup

Keep the existing server `OPENAI_API_KEY`. Add the new Cheaper Inference key as the Supabase Edge secret `CHEAPER_INFERENCE_API_KEY` for project `poichxqptuupzrkyewrq`. Never put either secret in Vite, source control, chat, or a public client. The routing is inactive until that secret exists; absence preserves the prior direct connection. Removing that secret restores direct routing and its prior budget behavior, not the special backup cap.

The user has not yet created the wallet key, so no wallet account access or live paid compatibility trial was performed. Do not claim activation or end-to-end wallet success until the secret is installed and an authorized generation verifies it.

## Scope and limits

Both Astra Responses paths in study-tools (artifact generation and recall Gap Check) use the route. Existing source validation, original request shaping, independent Claude review, beta limits, and saved-guide recovery remain in force. Anthropic review/question generation, OpenAI embeddings, and transcription retain their existing providers and separate charges. This is not a universal account-billing switch.

The separate server-only ledger has a shared 1,000-cent weekly cap, including founder requests. It resets Monday 00:00 UTC and atomically reserves a conservative maximum before a backup request. Reservations are calculated from UTF-8 input bytes plus framing allowance and bounded output, using Astra's listed highest input/cache-write and long-context prices. Confirmed usage settles to a conservative rounded-up amount without cache discounts. Ambiguous failures or missing usage retain their reservation; definitive direct API rejection without usage releases it. Settlement is idempotent and uses the original week, including requests crossing reset. Unused conservative capacity may therefore remain unavailable until reset.

The bounded backup accepts text-only requests with no external tools and at most 10,000 output tokens. Images/files still go to the wallet first but cannot fall back under this text-cost bound. Oversized text packets may also exceed the remaining backup allowance. Other applications using the same OpenAI key are outside this ledger. Pricing assumptions must be revisited if Astra's prices change.

No student content, API keys, or user identifiers are stored in the backup ledger. Tables and RPCs are inaccessible to anonymous and signed-in clients; service-role access only. No existing user data is changed.

## Verification

Routing regression coverage includes wallet success, exact insufficient-funds fallback, refusal of other errors, cap refusal, ambiguous direct failure, pre-configuration direct behavior, image-bound rejection, and actual Edge/generator compatibility. 73 focused tests passed, production build passed, focused lint passed. Live migration checks proved cap enforcement and idempotent settlement inside a rolled-back transaction; no test charges/reservations were retained. Verified anonymous and signed-in clients have no ledger access.

References: [Cheaper Inference Responses and error contract](https://api.cheaperinference.com/api-reference), [official Astra capabilities/prices](https://developers.openai.com/api/docs/models/gpt-6-astra).
