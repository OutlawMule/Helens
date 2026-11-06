import type { Metadata } from 'next'
import { SceneFrame } from '@/components/theme/Scene'
import { BookingCta } from '@/components/home/sections'
import { PageHero, Reveal, Section } from '@/components/ui/primitives'
import { getSiteContent } from '@/lib/content'
import type { SceneKind } from '@/lib/constants'
import { cn } from '@/lib/utils'

export const metadata: Metadata = { title: 'About' }

export default async function AboutPage() {
  const { about, contact } = await getSiteContent()
  const blocks: { title: string; text: string; scene: SceneKind }[] = [
    { title: 'Purpose and atmosphere', text: about.purpose, scene: 'fire' },
    { title: 'A botanical identity', text: about.botanical, scene: 'nursery' },
    { title: 'Events and hospitality', text: about.hospitality, scene: 'dining' },
  ]
  return (
    <>
      <PageHero title="About Helens Haven" intro="An event centre and garden destination in Lusaka West, shaped by open lawns, flowers and slow evenings." scene="garden" />
      <Section>
        <div className="grid items-center gap-14 lg:grid-cols-[1.1fr_0.9fr]">
          <Reveal>
            <h2 className="h-display text-4xl sm:text-5xl">The story</h2>
            <p className="mt-6 text-xl leading-relaxed text-muted">{about.story}</p>
          </Reveal>
          <Reveal delay={0.1}><SceneFrame kind="garden" className="aspect-[4/5]" /></Reveal>
        </div>
      </Section>
      {blocks.map((b, i) => (
        <Section key={b.title} alt={i % 2 === 0}>
          <div className="grid items-center gap-14 lg:grid-cols-2">
            <Reveal className={cn(i % 2 === 1 && 'lg:order-2')}>
              <h2 className="h-display text-3xl sm:text-5xl">{b.title}</h2>
              <p className="lead mt-6">{b.text}</p>
            </Reveal>
            <Reveal delay={0.1}><SceneFrame kind={b.scene} /></Reveal>
          </div>
        </Section>
      ))}
      <BookingCta whatsapp={contact.whatsapp} />
    </>
  )
}
