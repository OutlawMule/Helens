import { CalendarManager, type CalBlock, type CalBooking } from '@/components/admin/CalendarManager'
import { requireAdmin } from '@/lib/actions/guard'
import { monthRange } from '@/lib/availability'
import { todayKey } from '@/lib/utils'

export const metadata = { title: 'Calendar' }

export default async function AdminCalendarPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams
  const month = typeof sp.m === 'string' && /^\d{4}-(0[1-9]|1[0-2])$/.test(sp.m) ? sp.m : todayKey().slice(0, 7)
  const { startISO, endISO } = monthRange(month)
  const { supabase } = await requireAdmin()

  const [bookings, blocks, facilities] = await Promise.all([
    supabase
      .from('bookings')
      .select('id, reference, status, full_name, event_type, event_date, start_time, end_time, starts_at, ends_at, booking_facilities(facility:venue_facilities(name))')
      .in('status', ['pending', 'confirmed', 'completed'])
      .lt('starts_at', endISO)
      .gt('ends_at', startISO),
    supabase.from('blocked_dates').select('id, facility_id, kind, starts_at, ends_at, all_day, reason, facility:venue_facilities(name)').lt('starts_at', endISO).gt('ends_at', startISO),
    supabase.from('venue_facilities').select('id, name').order('sort_order'),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="h-display text-3xl sm:text-4xl">Calendar</h1>
        <p className="mt-1 text-muted">Confirmed bookings, pending requests and blocked or maintenance periods. Select a day to see details or block time.</p>
      </div>
      <CalendarManager
        month={month}
        bookings={(bookings.data ?? []) as unknown as CalBooking[]}
        blocks={(blocks.data ?? []) as unknown as CalBlock[]}
        facilities={(facilities.data ?? []) as { id: string; name: string }[]}
      />
    </div>
  )
}
