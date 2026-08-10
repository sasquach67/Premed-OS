import { Check, Crown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export function Upgrade() {
  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-7">
        <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-primary">Premed OS Plus</p>
        <h1 className="mt-2 font-display text-3xl font-extrabold">A calmer way to stay ahead</h1>
        <p className="mt-2 text-muted-foreground">Preview the planned upgrade. Billing is not connected in this foundation release.</p>
      </div>
      <Card className="border-primary/25">
        <CardContent className="p-6 sm:p-8">
          <Crown className="size-8 text-primary" />
          <h2 className="mt-4 text-xl font-extrabold">Plus preview</h2>
          <div className="mt-5 space-y-3 text-sm">
            {['Deeper application insights', 'Expanded backup and collaboration options', 'Future Atlas intelligence features'].map((item) => (
              <p key={item} className="flex items-center gap-2"><Check className="size-4 text-primary" /> {item}</p>
            ))}
          </div>
          <Button className="mt-7" disabled>Billing opens in a future release</Button>
        </CardContent>
      </Card>
    </div>
  )
}
