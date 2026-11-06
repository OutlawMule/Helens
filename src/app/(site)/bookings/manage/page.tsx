import type { Metadata } from 'next'
import { LookupForm } from '@/components/booking/LookupForm'
import { PageHero, Section } from '@/components/ui/primitives'
import { getSiteContent } from '@/lib/content'

export const metadata: Metadata = { title: 'Check your booking', robots: { index: false } }

export default async function ManageBookingPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams
  const ref = typeof sp.ref === 'string' && /^HH-[A-Za-z0-9]{6}$/.test(sp.ref) ? sp.ref.toUpperCase() : ''
  const { contact } = await getSiteContent()
  return (
    <>
      <PageHero title="Check your booking" intro="Enter your booking reference and the email or phone number you used to see its current status." scene="garden" />
      <Section className="!pt-12">
        <LookupForm initialRef={ref} whatsapp={contact.whatsapp} />
      </Section>
    </>
  )
}
