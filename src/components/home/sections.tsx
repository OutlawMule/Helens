import Image from 'next/image'
import Link from 'next/link'
import { Mail, MapPin, MessageCircle, Phone, Quote } from 'lucide-react'
import { Scene, SceneFrame, PlaceholderTag } from '@/components/theme/Scene'
import { ButtonLink, Heading, Notice, Reveal, Section } from '@/components/ui/primitives'
import { AMENITY_SCENE, AMENITY_SPECS, EVENT_SCENE, type SceneKind } from '@/lib/constants'
import { DIRECTIONS_URL, telHref } from '@/lib/business'
import type { ContactContent, ItemContent } from '@/lib/content-defaults'
import type { PublicGalleryItem } from '@/lib/content'
import type { TestimonialRow } from '@/lib/types'
import { cn } from '@/lib/utils'

export function Intro({ title, body }: { title: string; body: string }) {
  const facts = [['40m × 40m', 'Open grass arena'], ['6m × 4m', 'Swimming pool'], ['5', 'Destinations in one garden']]
  return (
    <Section>
      <div className="grid items-center gap-16 lg:grid-cols-2">
        <Reveal>
          <h2 className="h-display text-4xl sm:text-5xl lg:text-6xl">{title}</h2>
          <p className="lead mt-6">{body}</p>
          <dl className="mt-10 grid grid-cols-3 gap-6 border-t border-line pt-8">
            {facts.map(([k, v]) => (
              <div key={k}>
                <dt className="h-display text-2xl text-brand sm:text-3xl">{k}</dt>
                <dd className="mt-1 text-sm text-muted">{v}</dd>
              </div>
            ))}
          </dl>
        </Reveal>
        <Reveal delay={0.1} className="relative pb-8 lg:pl-6">
          <SceneFrame kind="garden" className="aspect-[4/5]" />
          <div className="absolute -bottom-0 left-0 hidden w-2/5 sm:block">
            <SceneFrame kind="pool" tag={false} className="aspect-square !rounded-3xl border-4 border-bg" />
          </div>
        </Reveal>
      </div>
    </Section>
  )
}

export function AmenitiesPreview({ items }: { items: ItemContent[] }) {
  return (
    <Section alt>
      <Reveal>
        <Heading title="Five places to be, all in one garden" intro="Move between open lawn, still water, firelight, good food and flowers. Each space has its own mood." />
      </Reveal>
      <div className="mt-14 grid gap-6 lg:grid-cols-3">
        {items.map((a, i) => (
          <Reveal key={a.slug} delay={i * 0.06} className={cn('h-full', i === 0 && 'lg:col-span-2')}>
            <Link href={`/amenities#${a.slug}`} className="card card-hover block h-full overflow-hidden">
              <div className={cn('relative w-full', i === 0 ? 'aspect-[16/8]' : 'aspect-[4/3]')}>
                <Scene kind={AMENITY_SCENE[a.slug] ?? 'garden'} />
                <PlaceholderTag />
              </div>
              <div className="p-6 sm:p-7">
                <h3 className="h-display text-2xl sm:text-3xl">{a.title}</h3>
                <p className="mt-3 line-clamp-3 text-muted">{a.summary}</p>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {(AMENITY_SPECS[a.slug] ?? []).map((s) => <li key={s} className="badge text-accent-ink">{s}</li>)}
                </ul>
              </div>
            </Link>
          </Reveal>
        ))}
      </div>
    </Section>
  )
}

export function EventPackages({ items }: { items: ItemContent[] }) {
  const featured = items.filter((i) => ['wedding', 'private-celebration', 'corporate', 'outdoor-concert'].includes(i.slug))
  return (
    <Section>
      <Reveal>
        <Heading title="Featured event packages" intro="Every event is shaped around you. Choose the kind of day you have in mind, tell us the details and our team will come back to you." />
      </Reveal>
      <div className="mt-14 grid gap-6 md:grid-cols-2">
        {featured.map((e, i) => (
          <Reveal key={e.slug} delay={i * 0.07}>
            <article className="frame group flex min-h-[26rem] flex-col justify-end text-white">
              <Scene kind={EVENT_SCENE[e.slug] ?? 'garden'} className="transition-transform duration-[1400ms] group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/10" aria-hidden />
              <PlaceholderTag className="!bottom-auto !left-auto right-3 top-3" />
              <div className="relative p-7 sm:p-9">
                <h3 className="h-display text-3xl sm:text-4xl">{e.title}</h3>
                <p className="mt-3 max-w-md text-white/85">{e.summary}</p>
                <ButtonLink href={`/bookings?type=${e.slug}`} variant="light" small className="mt-6">Plan this event</ButtonLink>
              </div>
            </article>
          </Reveal>
        ))}
      </div>
      <p className="mt-8 text-sm text-muted">Nothing is reserved until our team approves your request.</p>
    </Section>
  )
}

export function NurserySection({ title, body }: { title: string; body: string }) {
  return (
    <section className="relative overflow-hidden py-24 text-white sm:py-32" style={{ background: 'rgb(var(--footer-bg))' }}>
      <div className="container-x grid items-center gap-14 lg:grid-cols-2">
        <Reveal>
          <p className="eyebrow mb-4 !text-accent">Garden and nursery</p>
          <h2 className="h-display text-4xl sm:text-6xl">{title}</h2>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/80">{body}</p>
          <div className="mt-9 flex flex-wrap gap-4">
            <ButtonLink href="/amenities#flower-nursery" variant="gold">Meet the nursery</ButtonLink>
            <ButtonLink href="/bookings?facility=flower-nursery" variant="light">Ask about a gardening experience</ButtonLink>
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <SceneFrame kind="nursery" className="aspect-[5/4]" />
        </Reveal>
      </div>
    </section>
  )
}

export function Testimonials({ items }: { items: TestimonialRow[] }) {
  if (!items.length) return null
  const [lead, ...rest] = items
  return (
    <Section alt>
      <Reveal><Heading title="Kind words from guests" /></Reveal>
      {items.some((i) => i.is_sample) && (
        <Notice tone="info" className="mt-6 max-w-2xl">These are clearly marked sample testimonials. They stay until real guest feedback is added in the admin panel.</Notice>
      )}
      <div className="mt-12 grid gap-8 lg:grid-cols-[1.3fr_1fr]">
        <Reveal className="h-full">
          <figure className="card h-full p-8 sm:p-12">
            <Quote className="h-8 w-8 text-accent" aria-hidden />
            <blockquote className="h-display mt-6 text-2xl leading-snug sm:text-4xl">{lead.quote}</blockquote>
            <figcaption className="mt-8 flex flex-wrap items-center gap-3 text-sm">
              <span className="font-medium">{lead.author_name}</span>
              {lead.author_context && <span className="text-muted">{lead.author_context}</span>}
              {lead.is_sample && <span className="badge text-warn">Sample</span>}
            </figcaption>
          </figure>
        </Reveal>
        <div className="grid gap-6">
          {rest.slice(0, 2).map((t, i) => (
            <Reveal key={t.id} delay={0.1 * (i + 1)} className="h-full">
              <figure className="card h-full p-6 sm:p-8">
                <blockquote className="leading-relaxed">{t.quote}</blockquote>
                <figcaption className="mt-5 flex flex-wrap items-center gap-3 text-sm">
                  <span className="font-medium">{t.author_name}</span>
                  {t.author_context && <span className="text-muted">{t.author_context}</span>}
                  {t.is_sample && <span className="badge text-warn">Sample</span>}
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </Section>
  )
}

export function GalleryPreview({ items }: { items: PublicGalleryItem[] }) {
  const scenes: SceneKind[] = ['wedding', 'pool', 'fire', 'dining', 'nursery']
  const tiles = items.length
    ? items.slice(0, 5).map((i) => ({ key: i.id, url: i.url as string | null, alt: i.alt, scene: 'garden' as SceneKind }))
    : scenes.map((k) => ({ key: k, url: null as string | null, alt: '', scene: k }))
  return (
    <Section>
      <Reveal className="flex flex-wrap items-end justify-between gap-6">
        <Heading title="A glimpse of the garden" intro={items.length ? undefined : 'Real photographs will appear here once they are uploaded. Until then, illustrated placeholders stand in.'} />
        <ButtonLink href="/gallery" variant="ghost">View the full gallery</ButtonLink>
      </Reveal>
      <div className="mt-12 grid grid-cols-2 gap-4 md:h-[34rem] md:grid-cols-4 md:grid-rows-2">
        {tiles.map((t, i) => (
          <Reveal key={t.key} delay={i * 0.05} className={cn('frame !rounded-2xl min-h-[11rem]', i === 0 && 'col-span-2 row-span-2')}>
            {t.url ? (
              <Image src={t.url} alt={t.alt} fill sizes="(min-width: 768px) 25vw, 50vw" className="object-cover" />
            ) : (
              <>
                <Scene kind={t.scene} />
                <PlaceholderTag />
              </>
            )}
          </Reveal>
        ))}
      </div>
    </Section>
  )
}

export function BookingCta({ whatsapp }: { whatsapp: string }) {
  return (
    <section className="relative isolate overflow-hidden py-28 text-center text-white">
      <div className="absolute inset-0 -z-10">
        <Scene kind="celebration" />
        <div className="absolute inset-0" style={{ background: 'var(--header-overlay)' }} />
      </div>
      <Reveal className="container-x max-w-3xl">
        <h2 className="h-display text-4xl sm:text-6xl">Tell us about the day you have in mind</h2>
        <p className="mx-auto mt-5 max-w-xl text-lg text-white/85">Pick a date, choose the spaces you need and send your request. It stays pending until our team approves it, so nothing is reserved by accident.</p>
        <div className="mt-9 flex flex-wrap justify-center gap-4">
          <ButtonLink href="/bookings" variant="gold">Request a booking</ButtonLink>
          <ButtonLink href={whatsapp} variant="light">Chat on WhatsApp</ButtonLink>
        </div>
      </Reveal>
    </section>
  )
}

export function ContactStrip({ contact }: { contact: ContactContent }) {
  const items = [
    { Icon: Phone, label: 'Call us', value: contact.phone, href: telHref(contact.phone) },
    { Icon: MessageCircle, label: 'WhatsApp', value: 'Send a message', href: contact.whatsapp },
    { Icon: Mail, label: 'Email', value: contact.email, href: `mailto:${contact.email}` },
    { Icon: MapPin, label: 'Find us', value: `${contact.addressLine1}, ${contact.addressLine2}`, href: DIRECTIONS_URL },
  ]
  return (
    <Section>
      <Reveal><Heading title="Come and see it for yourself" /></Reveal>
      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {items.map(({ Icon, label, value, href }, i) => (
          <Reveal key={label} delay={i * 0.05} className="h-full">
            <a href={href} {...(href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})} className="card card-hover flex h-full flex-col gap-3 p-6">
              <Icon className="h-6 w-6 text-accent-ink" aria-hidden />
              <span className="font-medium">{label}</span>
              <span className="break-words text-sm text-muted">{value}</span>
            </a>
          </Reveal>
        ))}
      </div>
    </Section>
  )
}
