export const MiB = 1024 * 1024
export const NOTEBOOK_VISUAL_LIMITS = Object.freeze({
  packageAssets: 64, imageBytes: 8 * MiB, imagePixels: 16_000_000, imageAxis: 8192,
  packageImageBytes: 128 * MiB, jsonBytes: 8 * MiB,
  backupAssets: 128, backupImageBytes: 256 * MiB,
  zipMembers: 140, inflatedBytes: 264 * MiB, zipInputBytes: 265 * MiB,
})
export function visualLimit(actual: number, maximum: number, label: string): void {
  if (!Number.isSafeInteger(actual) || actual < 0 || actual > maximum) throw new Error(`${label}: ${actual.toLocaleString()} exceeds the limit of ${maximum.toLocaleString()}. Choose smaller source images, split the notebook, or explicitly select a narrower scope. Nothing was truncated or pruned.`)
}
