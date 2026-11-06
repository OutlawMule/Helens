import type { Metadata } from 'next'
import { SceneFrame } from '@/components/theme/Scene'
import { ButtonLink, PageHero, Reveal, Section } from '@/components/ui/primitives'
import { getSiteContent } from '@/lib/content'
import { AMENITY_SCENE, AMENITY_SPECS } from '@/lib/constants'
import { cn } from '@/lib/utils'

export const metadata: Metadata = { title: 'Amenities' }

/** Verified pool depths only: two bars, no invented floor profile. */
function DepthBars() {
  return (
    <figure className="card mt-8 inline-flex items-end gap-8 px-6 pb-4 pt-6" aria-label="Pool depths: shallow end 1.0 metres, deep end 1.8 metres">
      {[['Shallow end', '1.0m', 56], ['Deep end', '1.8m', 100]].map(([label, depth, h]) => (
        <div key={label as string} className="text-center">
          <div className="mx-auto w-14 rounded-t-md bg-gradient-to-b from-azure/80 to-azure/30" style={{ height: `${h}px` }} />
          <p className="h-display mt-2 text-xl">{depth}</p>
          <p className="text-xs text-muted">{label}</p>
        </div>
      ))}
    </figure>
  )
}

export default async function AmenitiesPage() {
  const { amenities } = await getSiteContent()
  return (
    <>
      <PageHero title="Amenities" intro="Open lawn, still water, firelight, garden dining and a flower nursery, each with its own atmosphere." scene="pool" />
      {amenities.items.map((a, i) => (
        <Section key={a.slug} id={a.slug} alt={i % 2 === 0}>
          <div className="grid items-center gap-14 lg:grid-cols-2">
            <Reveal className={cn(i % 2 === 1 && 'lg:order-2')}>
              <h2 className="h-display text-4xl sm:text-6xl">{a.title}</h2>
              <p className="lead mt-6">{a.summary}</p>
              <ul className="mt-6 flex flex-wrap gap-2">
                {(AMENITY_SPECS[a.slug] ?? []).map((s) => <li key={s} className="badge text-accent-ink">{s}</li>)}
              </ul>
              {a.slug === 'swimming-pool' && <DepthBars />}
              <div className="mt-8"><ButtonLink href={`/bookings?facility=${a.slug}`} variant="ghost">Include in a booking</ButtonLink></div>
            </Reveal>
            <Reveal delay={0.1}><SceneFrame kind={AMENITY_SCENE[a.slug] ?? 'garden'} className="aspect-[5/4]" /></Reveal>
          </div>
        </Section>
      ))}
    </>
  )
}
