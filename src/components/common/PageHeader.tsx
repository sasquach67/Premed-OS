import type { ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { PillarSceneHeader } from '@/components/experiences/PillarSceneHeader'
import { PILLAR_SCENES, type SceneKey } from '@/components/experiences/pillarScenes'
import { cn } from '@/lib/utils'

/** Page title block = the shared nested background-art hero. The scene
 *  (accent + backdrop) is derived from the current route automatically, so
 *  every tab gets the same layered composition. Pass `scene` to override,
 *  `image` to supply/override art, `subtitle` for an optional line, and
 *  `actions` for top-right controls. No explainer copy by default. */
export function PageHeader({
  title, titleAdornment, actions, image, scene, subtitle, children, footer, contentGlass, className,
}: {
  title: string
  /** Inline mark before the title (e.g. the class colour dot on a class hub). */
  titleAdornment?: ReactNode
  actions?: ReactNode
  image?: string
  scene?: SceneKey
  subtitle?: string
  children?: ReactNode
  footer?: ReactNode
  contentGlass?: boolean
  className?: string
}) {
  const location = useLocation()
  const routeKey = location.pathname.replace(/^\/+/, '').split('/')[0] || 'home'
  const resolved: SceneKey = scene ?? (routeKey in PILLAR_SCENES ? (routeKey as SceneKey) : 'default')

  return (
    <div className={cn('mb-6', className)}>
      <PillarSceneHeader
        scene={resolved}
        title={title}
        titleAdornment={titleAdornment}
        subtitle={subtitle}
        actions={actions}
        image={image}
        compact={!subtitle}
        footer={footer}
        contentGlass={contentGlass}
      >
        {children}
      </PillarSceneHeader>
    </div>
  )
}
