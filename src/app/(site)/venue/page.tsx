import type { Metadata } from 'next'
import { SceneFrame } from '@/components/theme/Scene'
import { ButtonLink, PageHero, Reveal, Section } from '@/components/ui/primitives'
import { getSiteContent } from '@/lib/content'
import { AMENITY_SPECS, EVENT_SCENE } from '@/lib/constants'
import { cn } from '@/lib/utils'

export const metadata: Metadata = { title: 'Venue & Events' }

export default async function VenuePage() {
  const { events, amenities } = await getSiteContent()
  const arena = amenities.items.find((a) => a.slug === 'open-arena')
  return (
    <>
      <PageHero title="Venue & Events" intro="A generous open arena, a garden setting and room to shape the day your way." scene="arena" />

      <Section>
        <div className="grid items-center gap-14 lg:grid-cols-2">
          <Reveal>
            <h2 className="h-display text-4xl sm:text-6xl">{arena?.title ?? 'Open Arena'}</h2>
            <p className="lead mt-6">{arena?.summary}</p>
            <ul className="mt-6 flex flex-wrap gap-2">
              {AMENITY_SPECS['open-arena'].map((s) => <li key={s} className="badge text-accent-ink">{s}</li>)}
            </ul>
            <ButtonLink href="/bookings?facility=open-arena" className="mt-9">Request the arena</ButtonLink>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="relative">
              <SceneFrame kind="arena" />
              <div className="card absolute -bottom-6 right-4 px-5 py-3 text-sm sm:right-8">
                <span className="h-display text-2xl text-brand">40m × 40m</span>
                <span className="ml-3 text-muted">open grass</span>
              </div>
            </div>
          </Reveal>
        </div>
      </Section>

      {events.items.map((e, i) => (
        <Section key={e.slug} id={e.slug} alt={i % 2 === 0}>
          <div className="grid items-center gap-14 lg:grid-cols-2">
            <Reveal className={cn(i % 2 === 1 && 'lg:order-2')}>
              <h2 className="h-display text-4xl sm:text-5xl">{e.title}</h2>
              <p className="lead mt-6">{e.summary}</p>
              <ButtonLink href={`/bookings?type=${e.slug}`} variant="ghost" className="mt-8">Plan this event</ButtonLink>
            </Reveal>
            <Reveal delay={0.1}><SceneFrame kind={EVENT_SCENE[e.slug] ?? 'garden'} /></Reveal>
          </div>
        </Section>
      ))}

      <Section>
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="h-display text-3xl sm:text-4xl">Not sure which fits?</h2>
          <p className="lead mx-auto mt-4">Tell us what you are planning in the booking request. Our team will review it and get back to you.</p>
          <ButtonLink href="/bookings" className="mt-8">Start a booking request</ButtonLink>
        </Reveal>
      </Section>
    </>
  )
}
