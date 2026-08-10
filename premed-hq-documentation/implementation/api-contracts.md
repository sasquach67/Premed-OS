# API Contracts

**Status:** Stub — to be written when the service foundation (`architecture/06-service-foundation.md`) is implemented.

## Purpose

Define the request/response contracts between the client and cloud services: auth, sync, file storage, integrations, and Atlas AI endpoints.

## Planned sections

- Auth endpoints (signup, login, verification, reset, session, deletion, export)
- Sync protocol (push/pull, conflict resolution, versioning)
- File upload/storage contracts
- Integration endpoints (Google Calendar, Drive, Gmail)
- Atlas AI endpoints (extraction, synthesis, transcription, duplicate scan) and provider-agnostic envelopes
- Error model, rate limits, idempotency
