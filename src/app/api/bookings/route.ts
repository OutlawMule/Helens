import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabase } from '@/lib/supabase/admin'
import { hasServiceSupabase } from '@/lib/supabase/env'
import { getSiteContent } from '@/lib/content'
import { bookingPayloadSchema } from '@/lib/validation'
import { clientIp, rateLimit } from '@/lib/rate-limit'
import { sendBookingRequestEmails } from '@/lib/email'
import { WEEKDAYS, EVENT_LABELS, type EventTypeId } from '@/lib/constants'
import { addDays, formatDate, formatTime, todayKey } from '@/lib/utils'

const json = (body: Record<string, unknown>, status = 200) => NextResponse.json(body, { status })

export async function POST(req: NextRequest) {
  if (!hasServiceSupabase()) return json({ error: 'Booking requests are not available yet because the database has not been connected.' }, 503)
  if (!rateLimit(`book:${clientIp(req)}`, 6, 10 * 60_000)) return json({ error: 'Too many requests. Please wait a few minutes and try again.' }, 429)

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return json({ error: 'That request could not be read.' }, 400)
  }
  // Server-side validation is the source of truth: the form's validation is only a convenience.
  const parsed = bookingPayloadSchema.safeParse(body)
  if (!parsed.success) return json({ error: 'Please check the highlighted details.', fields: parsed.error.flatten().fieldErrors }, 422)
  const v = parsed.data
  if (v.website) return json({ reference: 'HH-000000', status: 'pending', email: 'not_configured' }) // honeypot: bots get a decoy

  const { booking, hours } = await getSiteContent()
  if (!booking.enabled) return json({ error: 'We are not accepting online booking requests right now. Please contact us on WhatsApp or by phone.' }, 503)

  const today = todayKey()
  if (v.eventDate < addDays(today, booking.minNoticeDays)) {
    return json({ error: booking.minNoticeDays > 0 ? `Please choose a date at least ${booking.minNoticeDays} day(s) from today.` : 'Please choose a date that has not passed.', fields: { eventDate: ['Choose a later date'] } }, 422)
  }
  if (v.eventDate > addDays(today, booking.maxAdvanceDays)) return json({ error: 'That date is further ahead than we can take bookings for. Please choose an earlier date.', fields: { eventDate: ['Choose an earlier date'] } }, 422)

  if (hours.enforce) {
    const day = hours.days[WEEKDAYS[(new Date(`${v.eventDate}T00:00:00Z`).getUTCDay() + 6) % 7]]
    if (day.closed) return json({ error: 'The venue is closed on that day. Please choose another date.', fields: { eventDate: ['Closed on this day'] } }, 422)
    if (day.open && day.close && (v.startTime < day.open || v.endTime > day.close || v.endTime <= v.startTime)) {
      return json({ error: `On that day, events must fall between ${formatTime(day.open)} and ${formatTime(day.close)}.`, fields: { startTime: ['Outside opening hours'] } }, 422)
    }
  }

  const db = createAdminSupabase()
  const { data, error } = await db.rpc('create_booking_request', {
    p_full_name: v.fullName, p_email: v.email, p_phone: v.phone, p_event_type: v.eventType, p_event_date: v.eventDate,
    p_start_time: v.startTime, p_end_time: v.endTime, p_guests: v.guests, p_notes: v.notes || null, p_facility_slugs: v.facilities,
    p_status: booking.requireApproval ? 'pending' : 'confirmed',
  })
  if (error) {
    const m = error.message ?? ''
    if (m.includes('SLOT_UNAVAILABLE') || m.includes('SLOT_BLOCKED')) return json({ error: 'Sorry, part of that time has just been reserved. Please choose another date or time.' }, 409)
    if (m.includes('FACILITY_UNAVAILABLE')) return json({ error: 'One of the selected facilities is not available for booking right now.' }, 422)
    console.error('create_booking_request failed', error)
    return json({ error: 'We could not save your request. Please try again or contact us on WhatsApp.' }, 500)
  }
  const row = (data as { out_reference: string; out_status: string }[] | null)?.[0]
  if (!row) return json({ error: 'We could not save your request. Please try again.' }, 500)

  const { data: facs } = await db.from('venue_facilities').select('name').in('slug', v.facilities)
  const email = await sendBookingRequestEmails({
    reference: row.out_reference, status: row.out_status, fullName: v.fullName, email: v.email,
    eventLabel: EVENT_LABELS[v.eventType as EventTypeId], dateLabel: formatDate(v.eventDate),
    timeLabel: `${formatTime(v.startTime)} to ${formatTime(v.endTime)}`, guests: v.guests,
    facilities: ((facs ?? []) as { name: string }[]).map((f) => f.name),
  })
  return json({ reference: row.out_reference, status: row.out_status, email })
}
