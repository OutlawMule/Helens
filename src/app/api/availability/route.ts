import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabase } from '@/lib/supabase/admin'
import { hasServiceSupabase } from '@/lib/supabase/env'
import { getSiteContent } from '@/lib/content'
import { busyWindows, computeDayStates, monthRange, type BusyBlock, type BusyBooking } from '@/lib/availability'
import { addDays, todayKey } from '@/lib/utils'

export const dynamic = 'force-dynamic'

/**
 * Public availability. Returns day-level states and anonymous busy windows only:
 * never names, contact details, references or notes.
 */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  const month = sp.get('month') ?? todayKey().slice(0, 7)
  const date = sp.get('date')
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month) || (date && !/^\d{4}-\d{2}-\d{2}$/.test(date))) {
    return NextResponse.json({ error: 'Invalid query' }, { status: 400 })
  }
  const slugs = (sp.get('facilities') ?? '').split(',').map((s) => s.trim()).filter((s) => /^[a-z0-9-]+$/.test(s)).slice(0, 12)

  const { booking } = await getSiteContent()
  const today = todayKey()
  const limits = { minDate: addDays(today, booking.minNoticeDays), maxDate: addDays(today, booking.maxAdvanceDays), enabled: booking.enabled }
  if (!hasServiceSupabase()) return NextResponse.json({ configured: false, days: {}, busy: [], ...limits })

  const db = createAdminSupabase()
  const { data: facs } = await db.from('venue_facilities').select('id, slug, name').eq('is_active', true)
  const all = (facs ?? []) as { id: string; slug: string; name: string }[]
  const chosen = slugs.length ? all.filter((f) => slugs.includes(f.slug)) : all

  const { startISO, endISO } = monthRange(month)
  const [{ data: bk }, { data: bl }] = await Promise.all([
    db.from('bookings').select('status, starts_at, ends_at, booking_facilities(facility_id)').in('status', ['pending', 'confirmed']).lt('starts_at', endISO).gt('ends_at', startISO),
    db.from('blocked_dates').select('facility_id, starts_at, ends_at').lt('starts_at', endISO).gt('ends_at', startISO),
  ])
  const bookings: BusyBooking[] = (
    (bk ?? []) as unknown as { status: 'pending' | 'confirmed'; starts_at: string; ends_at: string; booking_facilities: { facility_id: string }[] }[]
  ).map((b) => ({ status: b.status, starts_at: b.starts_at, ends_at: b.ends_at, facility_ids: b.booking_facilities.map((f) => f.facility_id) }))
  const blocks = (bl ?? []) as BusyBlock[]

  const days = computeDayStates(month, chosen.map((f) => f.id), bookings, blocks)
  const busy = date && date.startsWith(month) ? busyWindows(date, chosen, bookings, blocks) : []
  return NextResponse.json({ configured: true, days, busy, ...limits }, { headers: { 'Cache-Control': 'no-store' } })
}
