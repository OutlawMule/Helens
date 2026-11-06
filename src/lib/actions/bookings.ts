'use server'

import { fail, friendlyDbError, getAdmin, logActivity, ok, SESSION_EXPIRED } from './guard'
import { blockSchema, noteSchema, rescheduleSchema, statusUpdateSchema } from '@/lib/validation'
import { sendBookingStatusEmail } from '@/lib/email'
import { EVENT_LABELS, STATUS_LABEL, type EventTypeId } from '@/lib/constants'
import { addDays, formatDate, formatTime, toLusakaISO } from '@/lib/utils'
import type { ActionResult } from '@/lib/types'

interface BookingForEmail {
  id: string; reference: string; status: string; full_name: string; email: string; event_type: string
  event_date: string; start_time: string; end_time: string; guests: number
  booking_facilities: { facility: { name: string } | null }[]
}

export async function setBookingStatus(input: { id: string; status: string }): Promise<ActionResult> {
  const admin = await getAdmin()
  if (!admin) return SESSION_EXPIRED
  const parsed = statusUpdateSchema.safeParse(input)
  if (!parsed.success) return fail('That status is not valid.')
  const { id, status } = parsed.data

  const { data } = await admin.supabase
    .from('bookings')
    .select('id, reference, status, full_name, email, event_type, event_date, start_time, end_time, guests, booking_facilities(facility:venue_facilities(name))')
    .eq('id', id)
    .maybeSingle()
  const before = data as unknown as BookingForEmail | null
  if (!before) return fail('Booking not found.')
  if (before.status === status) return ok(`Already ${STATUS_LABEL[status].toLowerCase()}.`)

  // Confirming goes through the database guards: an exclusion constraint on (facility, time range)
  // plus a block check. A conflict comes back as an error and nothing is changed.
  const { data: updated, error } = await admin.supabase.from('bookings').update({ status }).eq('id', id).select('id')
  if (error) return fail(friendlyDbError(error))
  if (!updated?.length) return fail('The booking could not be updated (permission denied).')

  await logActivity(admin, 'booking.status', 'booking', id, { reference: before.reference, from: before.status, to: status })

  let emailNote = ''
  if (status === 'confirmed' || status === 'rejected' || status === 'cancelled') {
    const result = await sendBookingStatusEmail({
      reference: before.reference, status, fullName: before.full_name, email: before.email,
      eventLabel: EVENT_LABELS[before.event_type as EventTypeId] ?? before.event_type,
      dateLabel: formatDate(before.event_date), timeLabel: `${formatTime(before.start_time)} to ${formatTime(before.end_time)}`,
      guests: before.guests, facilities: before.booking_facilities.map((f) => f.facility?.name ?? '').filter(Boolean),
    })
    emailNote = result === 'sent' ? ' The customer was emailed.' : result === 'failed' ? ' The email failed to send, so contact the customer directly.' : ' Email is not configured, so let the customer know directly (WhatsApp button below).'
  }
  return ok(`Booking marked ${STATUS_LABEL[status].toLowerCase()}.${emailNote}`)
}

export async function rescheduleBooking(input: { id: string; eventDate: string; startTime: string; endTime: string }): Promise<ActionResult> {
  const admin = await getAdmin()
  if (!admin) return SESSION_EXPIRED
  const parsed = rescheduleSchema.safeParse(input)
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? 'Check the date and times.')
  const { id, eventDate, startTime, endTime } = parsed.data

  const { data: before } = await admin.supabase.from('bookings').select('reference, event_date, start_time, end_time').eq('id', id).maybeSingle()
  if (!before) return fail('Booking not found.')

  // If the booking is confirmed, the database re-checks the new window against other confirmed bookings and blocks.
  const { data: updated, error } = await admin.supabase
    .from('bookings')
    .update({ event_date: eventDate, start_time: startTime, end_time: endTime })
    .eq('id', id)
    .select('id')
  if (error) return fail(friendlyDbError(error))
  if (!updated?.length) return fail('The booking could not be updated (permission denied).')

  await logActivity(admin, 'booking.reschedule', 'booking', id, {
    reference: before.reference,
    from: { date: before.event_date, start: before.start_time, end: before.end_time },
    to: { date: eventDate, start: startTime, end: endTime },
  })
  return ok(`Rescheduled to ${formatDate(eventDate, 'medium')}, ${formatTime(startTime)} to ${formatTime(endTime)}.`)
}

export async function addBookingNote(input: { id: string; note: string }): Promise<ActionResult> {
  const admin = await getAdmin()
  if (!admin) return SESSION_EXPIRED
  const parsed = noteSchema.safeParse(input)
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? 'Write a note first.')
  await logActivity(admin, 'booking.note', 'booking', parsed.data.id, { note: parsed.data.note })
  return ok('Internal note saved. Customers never see notes.')
}

export async function createBlock(input: unknown): Promise<ActionResult> {
  const admin = await getAdmin()
  if (!admin) return SESSION_EXPIRED
  const parsed = blockSchema.safeParse(input)
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? 'Check the block details.')
  const v = parsed.data
  const starts = v.allDay ? toLusakaISO(v.startDate, '00:00') : toLusakaISO(v.startDate, v.startTime)
  const ends = v.allDay ? toLusakaISO(addDays(v.endDate, 1), '00:00') : toLusakaISO(v.endDate, v.endTime)

  const { data, error } = await admin.supabase
    .from('blocked_dates')
    .insert({ facility_id: v.facilityId, kind: v.kind, starts_at: starts, ends_at: ends, all_day: v.allDay, reason: v.reason || null, created_by: admin.user.id })
    .select('id')
  if (error) return fail(friendlyDbError(error))
  await logActivity(admin, 'block.create', 'blocked_date', data?.[0]?.id ?? null, { kind: v.kind, from: starts, to: ends, facilityId: v.facilityId, reason: v.reason })
  return ok(v.kind === 'maintenance' ? 'Maintenance period added.' : 'Dates blocked.')
}

export async function deleteBlock(id: string): Promise<ActionResult> {
  const admin = await getAdmin()
  if (!admin) return SESSION_EXPIRED
  if (!/^[0-9a-f-]{36}$/i.test(id)) return fail('Invalid block.')
  const { error } = await admin.supabase.from('blocked_dates').delete().eq('id', id)
  if (error) return fail(friendlyDbError(error))
  await logActivity(admin, 'block.delete', 'blocked_date', id)
  return ok('Block removed.')
}
