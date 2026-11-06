import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabase } from '@/lib/supabase/admin'
import { hasServiceSupabase } from '@/lib/supabase/env'
import { lookupSchema } from '@/lib/validation'
import { clientIp, rateLimit } from '@/lib/rate-limit'
import { phoneTail } from '@/lib/utils'

const json = (body: Record<string, unknown>, status = 200) => NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } })
const NOT_FOUND = "We couldn't find a booking matching those details. Check the reference and the email or phone number used."

/** A booking is only returned when the reference AND the email/phone on the booking both match. */
export async function POST(req: NextRequest) {
  if (!hasServiceSupabase()) return json({ error: 'Booking lookup is not available yet because the database has not been connected.' }, 503)
  if (!rateLimit(`lookup:${clientIp(req)}`, 10, 10 * 60_000)) return json({ error: 'Too many attempts. Please wait a few minutes and try again.' }, 429)

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return json({ error: 'That request could not be read.' }, 400)
  }
  const parsed = lookupSchema.safeParse(body)
  if (!parsed.success) return json({ error: parsed.error.issues[0]?.message ?? 'Check the details and try again.' }, 422)

  const { data } = await createAdminSupabase()
    .from('bookings')
    .select('reference, status, full_name, email, phone, event_type, event_date, start_time, end_time, guests, created_at, booking_facilities(facility:venue_facilities(name))')
    .eq('reference', parsed.data.reference)
    .maybeSingle()
  const b = data as unknown as {
    reference: string; status: string; full_name: string; email: string; phone: string; event_type: string; event_date: string
    start_time: string; end_time: string; guests: number; created_at: string; booking_facilities: { facility: { name: string } | null }[]
  } | null
  if (!b) return json({ error: NOT_FOUND }, 404)

  const contact = parsed.data.contact
  const matches = contact.includes('@') ? b.email.toLowerCase() === contact.toLowerCase() : phoneTail(contact).length >= 7 && phoneTail(b.phone) === phoneTail(contact)
  if (!matches) return json({ error: NOT_FOUND }, 404)

  // Deliberately limited: no email, phone, notes or internal data is returned.
  return json({
    booking: {
      reference: b.reference, status: b.status, firstName: b.full_name.split(' ')[0], eventType: b.event_type, eventDate: b.event_date,
      startTime: b.start_time, endTime: b.end_time, guests: b.guests, createdAt: b.created_at,
      facilities: b.booking_facilities.map((f) => f.facility?.name).filter(Boolean),
    },
  })
}
