# T4 old-client compatibility evidence

Observed production revision on September 24, 2026: `5c7a3e4f1c28c3b36392815c0a63fe3c963cb225`, read from `https://premedos.app/release-assets.json`. This identifies the pinned source used for the local reproduction; it is not a live account acceptance test.

## Reproduce

With dependencies installed in this checkout, run:

```sh
node scripts/research/probe-production-compatibility.mjs
```

The script archives the exact production Git revision into an isolated temporary directory, verifies its dependency lock matches this checkout, and copies in the probe. It changes no old-client implementation. The temporary path and full test log are printed and retained. No real account, browser profile, credential, database, or remote write is used. Network transport in the existing sync tests is mocked.

## Finding

The probe supplies a complete, valid synthetic research `ExperienceEntry`, a Person, and four active child collections with valid parent/person references. It explicitly asserts that the production client accepts remote validation, activates the synthetic account, and permits an unrelated notes edit without throwing. The parent lab and unrelated edit persist. All four new collections are omitted from both the outgoing `dataForRemote(snapshotData())` payload and persisted local state.

At the pinned revision, `src/store/store.ts` selects persisted and outgoing data through `DATA_KEYS` (lines 159, 932, 1110). `src/store/accountSyncSafety.ts:112` uses structural validation that ignores unknown collections. The existing envelope version guard therefore does not protect bare cloud `AppData` loaded by this client.

**Production compatibility fails.** Do not unlock production or let this new-schema test account meet the old production app. A safe compatibility fix requires its own shared-system brief. T4's separate-account local alpha remains authorized.

## Check accounting and limits

- **One compatibility probe** establishes the data-loss result above. A passing test means the unsafe behavior was successfully reproduced; it does not mean compatibility passed.
- **47 existing tests** exercise production-revision IndexedDB durability, storage rejection, account-switch fencing, cloud rejection/retry, and sync preservation. They are regression context, not 47 additional compatibility probes.
- Combined result: **3 test files, 48 tests passed**.
- This is an executable test of the exact production source revision in jsdom/fake IndexedDB, not a real cloud round-trip or a browser test of the deployed bundle. No claim is made that a production compatibility fix has been implemented.
