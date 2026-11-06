import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { ConfirmationView } from '@/components/booking/ConfirmationView'
import { Section } from '@/components/ui/primitives'
import { getSiteContent } from '@/lib/content'

export const metadata: Metadata = { title: 'Booking request received', robots: { index: false } }

export default async function ConfirmationPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams
  const ref = typeof sp.ref === 'string' ? sp.ref.toUpperCase() : ''
  if (!/^HH-[A-Z0-9]{6}$/.test(ref)) redirect('/bookings')
  const status = sp.status === 'confirmed' ? 'confirmed' : 'pending'
  const email = sp.email === 'sent' || sp.email === 'failed' ? sp.email : 'not_configured'
  const { contact } = await getSiteContent()
  return (
    <Section className="!pt-40">
      <ConfirmationView reference={ref} status={status} email={email} whatsapp={contact.whatsapp} />
    </Section>
  )
}
