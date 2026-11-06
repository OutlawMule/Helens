import type { Metadata } from 'next'
import Link from 'next/link'
import { BookingWizard } from '@/components/booking/BookingWizard'
import { PageHero, Section } from '@/components/ui/primitives'
import { getFacilities, getSiteContent } from '@/lib/content'
import { hasServiceSupabase } from '@/lib/supabase/env'
import { addDays, todayKey } from '@/lib/utils'

export const metadata: Metadata = { title: 'Request a booking' }

export default async function BookingsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams
  const one = (k: string) => (typeof sp[k] === 'string' ? (sp[k] as string) : undefined)
  const [content, facilities] = await Promise.all([getSiteContent(), getFacilities()])
  const today = todayKey()

  return (
    <>
      <PageHero title="Request a booking" intro="Choose your event, check the calendar and send your request. It stays pending until our team approves it." scene="celebration" />
      <Section className="!pt-12">
        <div className="grid gap-10 lg:grid-cols-[1fr_20rem]">
          <BookingWizard
            facilities={facilities.map((f) => ({ slug: f.slug, name: f.name }))}
            configured={hasServiceSupabase()}
            enabled={content.booking.enabled}
            requireApproval={content.booking.requireApproval}
            limits={{ minDate: addDays(today, content.booking.minNoticeDays), maxDate: addDays(today, content.booking.maxAdvanceDays) }}
            hours={content.hours}
            initial={{ type: one('type'), facility: one('facility'), date: one('date') }}
          />
          <aside className="space-y-6 lg:sticky lg:top-28 lg:self-start">
            <div className="card p-6">
              <h2 className="h-display text-2xl">How it works</h2>
              <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm leading-relaxed text-muted">
                <li>Tell us about the event and the spaces you need.</li>
                <li>Pick a date and times. The calendar shows what is free.</li>
                <li>Send your request and keep your booking reference.</li>
                <li>Our team reviews it. Until it is approved, the date is not reserved.</li>
              </ol>
            </div>
            <div className="card p-6 text-sm">
              <h2 className="h-display text-xl">Already sent a request?</h2>
              <p className="mt-2 text-muted">Check its status with your reference and the email or phone number you used.</p>
              <Link href="/bookings/manage" className="btn btn-ghost btn-sm mt-4">Check booking status</Link>
            </div>
            <p className="text-sm text-muted">Your progress is kept if you switch between the Original Garden and Space Garden versions.</p>
          </aside>
        </div>
      </Section>
    </>
  )
}
