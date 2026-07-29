/* ============================================================
   pillarScenes.ts — typed nested-hero background config for EVERY tab.
   Each scene = an accent + a warm-dark fallback gradient (+ optional
   photographic art for the experience pillars). The PageHeader / pillar
   layout render a layered composition: art/gradient → dark overlay →
   fade into the page background, with the title (and any summary) nested
   on top. Drop art at /public/banners/<key>.jpg to upgrade any tab.
   ============================================================ */

export type SceneKey =
  | 'default'
  | 'home' | 'academics' | 'mcat' | 'letters'
  | 'clinical' | 'volunteering' | 'shadowing' | 'research' | 'ecs'
  | 'essays' | 'schools' | 'timeline' | 'profile'
  | 'settings' | 'help' | 'northstar' | 'archive'

/** Back-compat alias for the pillar-only callers. */
export type PillarSceneKey = 'clinical' | 'volunteering' | 'shadowing' | 'research' | 'ecs'

export interface PillarScene {
  /** CSS color (usually a --cat-* token) used for the accent bar + wash. */
  accent: string
  /** Optional background image (place in /public/banners). Missing/failed → gradient. */
  image?: string
  position: string
  mobilePosition: string
  /** 0–1 strength of the dark readability overlay. */
  overlay: number
  /** Subtle accent wash color over the art. */
  tint: string
  /** Painted gradient shown when no image is available. */
  fallbackGradient: string
}

/** Build a warm-dark, accent-tinted fallback gradient from an rgba tint. */
function warm(rgba: string, accent: string, opts: { image?: string; position?: string; mobilePosition?: string; overlay?: number } = {}): PillarScene {
  return {
    accent,
    image: opts.image,
    position: opts.position ?? 'center 50%',
    mobilePosition: opts.mobilePosition ?? 'center 44%',
    overlay: opts.overlay ?? 0.5,
    tint: accent,
    fallbackGradient: `radial-gradient(120% 140% at 12% -12%, ${rgba}, transparent 55%), linear-gradient(180deg, #322c27 0%, #2a2622 58%, var(--background) 100%)`,
  }
}

export const PILLAR_SCENES: Record<SceneKey, PillarScene> = {
  default: warm('rgba(75,156,211,0.16)', 'var(--primary)'),
  home: warm('rgba(75,156,211,0.20)', 'var(--primary)'),

  // Foundation
  // Literal banner recipe (_visual-recipes.md): two radial blooms over the
  // linear base. A flat fill is explicitly wrong.
  academics: {
    ...warm('rgba(75,156,211,0.22)', 'var(--cat-gpa)', { overlay: 0 }),
    fallbackGradient:
      'radial-gradient(340px 200px at 88% 6%, rgba(75,156,211,.34), transparent 70%), '
      + 'radial-gradient(260px 180px at 10% 130%, rgba(111,192,168,.18), transparent 70%), '
      + 'linear-gradient(115deg, #233448 0%, #2c3a4a 45%, #3a3730 100%)',
  },
  mcat: warm('rgba(140,123,212,0.24)', 'var(--cat-mcat)'),
  letters: warm('rgba(213,155,106,0.22)', 'var(--cat-letters)'),

  // Experiences (photographic art intended)
  clinical: warm('rgba(111,174,110,0.24)', 'var(--cat-clinical)', { image: '/banners/clinical.jpg', position: 'center 48%', mobilePosition: 'center 40%' }),
  volunteering: warm('rgba(95,180,156,0.26)', 'var(--cat-volunteer)', { image: '/banners/volunteering.jpg', position: 'center 55%', mobilePosition: 'center 44%' }),
  shadowing: warm('rgba(224,164,88,0.24)', 'var(--cat-shadow)', { image: '/banners/shadowing.jpg', position: 'center 50%', mobilePosition: 'center 42%' }),
  research: warm('rgba(201,138,201,0.24)', 'var(--cat-research)', { image: '/banners/research.jpg', position: 'center 52%', mobilePosition: 'center 44%' }),
  ecs: warm('rgba(224,139,155,0.28)', 'var(--cat-activities)', { image: '/banners/activities.jpg', position: 'center 58%', mobilePosition: 'center 46%' }),

  // Your story / Application / Profile
  essays: warm('rgba(201,138,201,0.22)', 'var(--cat-research)'),
  schools: warm('rgba(75,156,211,0.22)', 'var(--primary)'),
  timeline: warm('rgba(224,164,88,0.22)', 'var(--cat-shadow)'),
  profile: warm('rgba(75,156,211,0.18)', 'var(--primary)'),

  // Utility
  settings: warm('rgba(122,112,100,0.16)', 'var(--muted-foreground)'),
  help: warm('rgba(121,169,87,0.22)', 'var(--leaf)'),
  northstar: warm('rgba(121,169,87,0.24)', 'var(--leaf)'),
  archive: warm('rgba(122,112,100,0.16)', 'var(--muted-foreground)'),
}

/** Resolve any string (route id) to a scene, falling back to `default`. */
export function sceneFor(key: string | undefined): PillarScene {
  return (key && PILLAR_SCENES[key as SceneKey]) || PILLAR_SCENES.default
}
