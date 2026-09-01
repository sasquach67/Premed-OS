export type GenerationPhase = 'idle' | 'preparing' | 'generating' | 'saving' | 'complete' | 'error'

/** Advance the visible preparation phase without delaying the real request. */
export function startGenerationProgress(setPhase: (phase: GenerationPhase) => void) {
  setPhase('preparing')
  setPhase('generating')
}

/** Keep the saving check visible long enough to be perceived, including for fast local mocks. */
export function waitForGenerationProgress(milliseconds = 360) {
  return new Promise<void>((resolve) => window.setTimeout(resolve, milliseconds))
}
