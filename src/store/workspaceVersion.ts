/** Persisted metadata schema. Shared with the pre-store hydration gate. */
export const OLDEST_SUPPORTED_STORE_VERSION = 0
// v52 joins S1 and T4, both previously v51. Re-run the additive migration
// for either lineage; cloud contract 2 is intentionally independent.
export const CURRENT_STORE_VERSION = 52
