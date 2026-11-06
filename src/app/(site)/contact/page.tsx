import type { Metadata } from 'next'
import { Mail, MapPin, MessageCircle, Phone } from 'lucide-react'
import { ContactForm } from '@/components/contact/ContactForm'
import { ButtonLink, PageHero, Reveal, Section } from '@/components/ui/primitives'
import { getSiteContent } from '@/lib/content'
import { DIRECTIONS_URL, mapsEmbedUrl, telHref } from '@/lib/business'
import { WEEKDAYS, WEEKDAY_LABEL } from '@/lib/constants'
import { formatTime } from '@/lib/utils'

export const metadata: Metadata = { title: 'Contact' }

export default async function ContactPage() {
  const { contact, hours } = await getSiteContent()
  const published = WEEKDAYS.filter((d) => hours.days[d].closed || (hours.days[d].open && hours.days[d].close))
  const rows = [
    { Icon: Phone, label: 'Phone', value: contact.phone, href: telHref(contact.phone) },
    { Icon: MessageCircle, label: 'WhatsApp', value: 'Chat with us', href: contact.whatsapp },
    { Icon: Mail, label: 'Email', value: contact.email, href: `mailto:${contact.email}` },
  ]
  return (
    <>
      <PageHero title="Contact" intro="Ask a question, plan an event or find your way to the garden." scene="garden" />
      <Section>
        <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr]">
          <Reveal>
            <h2 className="h-display text-3xl sm:text-4xl">Get in touch</h2>
            <ul className="mt-8 space-y-4">
              {rows.map(({ Icon, label, value, href }) => (
                <li key={label}>
                  <a href={href} {...(href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})} className="card card-hover flex items-center gap-4 p-5">
                    <Icon className="h-6 w-6 shrink-0 text-accent-ink" aria-hidden />
                    <span><span className="block font-medium">{label}</span><span className="break-all text-muted">{value}</span></span>
                  </a>
                </li>
              ))}
              <li className="card flex items-start gap-4 p-5">
                <MapPin className="mt-0.5 h-6 w-6 shrink-0 text-accent-ink" aria-hidden />
                <address className="not-italic"><span className="block font-medium">Address</span><span className="text-muted">{contact.addressLine1}<br />{contact.addressLine2}</span></address>
              </li>
            </ul>
            <div className="mt-6">
              <h3 className="font-medium">Opening hours</h3>
              {published.length ? (
                <dl className="mt-2 grid max-w-xs grid-cols-2 gap-y-1 text-sm">
                  {published.map((d) => (
                    <div key={d} className="contents">
                      <dt className="text-muted">{WEEKDAY_LABEL[d]}</dt>
                      <dd>{hours.days[d].closed ? 'Closed' : `${formatTime(hours.days[d].open)} to ${formatTime(hours.days[d].close)}`}</dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className="mt-1 text-sm text-muted">Opening hours will be published here once confirmed.</p>
              )}
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <h2 className="h-display mb-6 text-3xl sm:text-4xl">Send a message</h2>
            <ContactForm />
          </Reveal>
        </div>
      </Section>
      <Section alt>
        <Reveal>
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <h2 className="h-display text-3xl sm:text-4xl">Find us</h2>
            <div className="flex flex-wrap gap-3">
              <ButtonLink href={DIRECTIONS_URL}>Get directions</ButtonLink>
              <ButtonLink href={contact.mapsUrl} variant="ghost">Open in Google Maps</ButtonLink>
            </div>
          </div>
          <div className="frame aspect-[16/10] w-full sm:aspect-[16/7]">
            <iframe title="Map showing Helens Haven in Lusaka West" src={mapsEmbedUrl(contact.mapsUrl)} className="absolute inset-0 h-full w-full border-0" loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen />
          </div>
        </Reveal>
      </Section>
    </>
  )
}
