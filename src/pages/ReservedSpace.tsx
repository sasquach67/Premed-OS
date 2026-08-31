import { Sparkles } from 'lucide-react'
import { ROUTE_MAP } from '@/app/routes'
import { Card, CardContent } from '@/components/ui/card'

const RESERVED_COPY: Record<string, string> = {
  atlas: 'Atlas will connect your coursework, experiences, stories, and school research. The knowledge graph itself is intentionally deferred.',
  mcat: 'MCAT planning is reserved for a later beta. Your coursework stays ready for it.',
  clinical: 'Clinical tracking is reserved for a later beta. Your account is ready when it opens.',
  volunteering: 'Volunteer tracking is reserved for a later beta. Your account is ready when it opens.',
  shadowing: 'Shadowing logs are reserved for a later beta. Your account is ready when it opens.',
  research: 'Research tracking is reserved for a later beta. Your account is ready when it opens.',
  ecs: 'Extracurricular tracking is reserved for a later beta. Your account is ready when it opens.',
  schools: 'School-list planning is reserved for a later beta. Your account is ready when it opens.',
  essays: 'The story bank and essay workspace are reserved for a later beta. Your account is ready when they open.',
  letters: 'Letter tracking is reserved for a later beta. Your account is ready when it opens.',
  timeline: 'Journey planning is reserved for a later beta. Your account is ready when it opens.',
}

export function ReservedSpace({ routeId }: { routeId: keyof typeof RESERVED_COPY }) {
  const route = ROUTE_MAP[routeId]
  const Icon = route.icon

  return (
    <div className="mx-auto grid min-h-[62vh] max-w-3xl place-items-center">
      <Card className="w-full overflow-hidden border-primary/20 bg-gradient-to-br from-card to-primary/5">
        <CardContent className="px-6 py-14 text-center sm:px-12">
          <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary">
            <Icon className="size-7" />
          </div>
          <p className="mt-5 text-xs font-extrabold uppercase tracking-[0.18em] text-primary">Reserved space</p>
          <h1 className="mt-2 font-display text-3xl font-extrabold">{route.label} is coming soon</h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted-foreground">{RESERVED_COPY[routeId]}</p>
          <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-bold text-muted-foreground">
            <Sparkles className="size-3.5 text-primary" /> Your existing data stays ready for it
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
