/* ============================================================
   PricingPage — a coming-soon page, and honest about why (RULED Aug 2026).

   **The nav item is real and routes here — a dead button is a defect.**
   The page says there is nothing to buy and *why* there's no number yet,
   then carries the four §5.4 commitments.

   BANNED HERE, and this is the part that matters: plan cards, tiers,
   comparison tables, **any number that isn't real**, blurred or
   placeholder prices, a paid-tier waitlist, or any control that could
   read as a purchase. A fake tier table on a beta is the fastest way to
   lose the honesty the rest of this page group is built on.

   **Do not let this page grow.** It stays this short until a measured
   price exists.
   ============================================================ */
import { Check } from 'lucide-react'
import { PublicShell } from '@/components/public/PublicShell'
import { PublicNav } from '@/components/public/PublicNav'
import { PublicHeadline } from '@/components/public/PublicHeadline'

const CONTACT_EMAIL = 'elephon08@gmail.com'

/** The four §5.4 commitments. Every one is a promise HQ can keep today. */
const COMMITMENTS = [
  {
    lead: 'Your records are never paywalled.',
    rest: "If there's ever a paid tier and you don't want it, you keep everything you've logged and you can still export it.",
  },
  {
    lead: 'Export and deletion stay free and self-serve',
    rest: ', always, and never require emailing anyone.',
  },
  {
    lead: 'Any paid tier will state its cap.',
    rest: ' "Unlimited AI" at a student price is a promise nobody can keep, so I won\'t make it.',
  },
  {
    lead: 'No ads, no affiliate links, no sponsored placement',
    rest: ', on either side of a paywall. Free options get named first.',
  },
] as const

export function PricingPage() {
  return (
    <PublicShell title="Pricing — Premed OS">
      <div className="pl-band">
        <PublicNav />
        <div className="pl-bandin">
          <PublicHeadline
            as="h1"
            size="section"
            setup="Pricing"
            payoff="It's free for now, don't worry."
          />
        </div>
      </div>

      <div className="pl-soonwrap">
        <span className="pl-soonbadge">
          <Check size={12} aria-hidden="true" />
          Everything, free, during the beta
        </span>

        <p className="pl-soonp">
          There's no paid plan, no card on file, and nothing here to buy.{' '}
          <b>Every tracker, every plan, every calculation, and the AI features are all just on.</b>
        </p>
        <p className="pl-soonp">
          Most of HQ costs nothing to run. The parts that cost money are the AI ones, and I'd rather
          measure a full semester of real usage than guess a number now and get it wrong in either
          direction.{' '}
          <b>
            When there is a real price, it'll be on this page, and you'll know long before anything
            changes.
          </b>
        </p>

        <div className="pl-soonlist">
          {COMMITMENTS.map((item) => (
            <div key={item.lead} className="pl-soonrow">
              <Check className="pl-tick" aria-hidden="true" />
              <span>
                <b>{item.lead}</b>
                {item.rest}
              </span>
            </div>
          ))}
        </div>

        <p className="pl-soonp" style={{ fontSize: 13.5, color: 'var(--pl-dim)', marginTop: 26 }}>
          Curious, or want to argue about what it should cost?{' '}
          <a className="pl-inline" href={`mailto:${CONTACT_EMAIL}`} style={{ color: 'var(--pl-pri)', fontWeight: 700 }}>
            Tell me.
          </a>
        </p>
      </div>
    </PublicShell>
  )
}
