import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Mail, Phone } from 'lucide-react'
import { BookingPanel } from '@/components/admin/BookingPanel'
import { AdminCard, EmptyState } from '@/components/admin/ui'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { requireAdmin } from '@/lib/actions/guard'
import { describeActivity, timeAgo } from '@/lib/activity'
import { EVENT_LABELS, type EventTypeId } from '@/lib/constants'
import { formatDate, formatTime } from '@/lib/utils'
import type { ActivityRow, BookingRow } from '@/lib/types'

export const metadata = { title: 'Booking' }

export default async function BookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound()
  const { supabase } = await requireAdmin()
  const { data } = await supabase.from('bookings').select('*, booking_facilities(facility:venue_facilities(name, slug))').eq('id', id).maybeSingle()
  if (!data) notFound()
  const b = data as unknown as BookingRow
  const { data: logs } = await supabase.from('activity_logs').select('*').eq('entity_type', 'booking').eq('entity_id', id).order('created_at', { ascending: false })
  const activity = (logs ?? []) as ActivityRow[]
  const facilities = (b.booking_facilities ?? []).map((f) => f.facility?.name).filter(Boolean) as string[]

  const rows: [string, string][] = [
    ['Event', EVENT_LABELS[b.event_type as EventTypeId] ?? b.event_type],
    ['Date', formatDate(b.event_date)],
    ['Time', `${formatTime(b.start_time)} to ${formatTime(b.end_time)}${b.ends_at.slice(0, 10) !== b.starts_at.slice(0, 10) && b.end_time <= b.start_time ? ' (next day)' : ''}`],
    ['Guests', String(b.guests)],
    ['Spaces', facilities.join(', ') || 'None'],
    ['Submitted', new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Africa/Lusaka' }).format(new Date(b.created_at))],
  ]

  return (
    <div className="space-y-6">
      <Link href="/admin/bookings" className="text-sm underline underline-offset-4">All bookings</Link>
      <div className="flex flex-wrap items-center gap-4">
        <h1 className="h-display text-3xl sm:text-4xl">{b.reference}</h1>
        <StatusBadge status={b.status} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1.1fr]">
        <div className="space-y-6">
          <AdminCard title="Customer">
            <p className="text-lg font-medium">{b.full_name}</p>
            <p className="mt-3 flex items-center gap-2 text-sm"><Mail className="h-4 w-4 text-muted" aria-hidden /><a className="underline" href={`mailto:${b.email}`}>{b.email}</a></p>
            <p className="mt-2 flex items-center gap-2 text-sm"><Phone className="h-4 w-4 text-muted" aria-hidden /><a className="underline" href={`tel:${b.phone.replace(/[^\d+]/g, '')}`}>{b.phone}</a></p>
          </AdminCard>
          <AdminCard title="Event details">
            <dl className="divide-y divide-line/60 text-sm">
              {rows.map(([k, v]) => <div key={k} className="grid gap-1 py-2.5 sm:grid-cols-[8rem_1fr]"><dt className="text-muted">{k}</dt><dd>{v}</dd></div>)}
            </dl>
            <div className="mt-4 rounded-xl bg-bg-alt p-4 text-sm">
              <p className="mb-1 font-medium">Customer’s notes</p>
              <p className="whitespace-pre-wrap text-muted">{b.notes || 'No additional information provided.'}</p>
            </div>
          </AdminCard>
          <AdminCard title="History and internal notes">
            {activity.length ? (
              <ul className="divide-y divide-line/60">
                {activity.map((a) => (
                  <li key={a.id} className="py-3 text-sm">
                    <p>{describeActivity(a)}</p>
                    <p className="mt-0.5 text-xs text-muted">{a.admin_email ?? 'system'} · {timeAgo(a.created_at)}</p>
                  </li>
                ))}
              </ul>
            ) : <EmptyState>No admin activity on this booking yet.</EmptyState>}
          </AdminCard>
        </div>

        <BookingPanel
          id={b.id}
          reference={b.reference}
          status={b.status}
          fullName={b.full_name}
          phone={b.phone}
          eventDate={b.event_date}
          startTime={b.start_time.slice(0, 5)}
          endTime={b.end_time.slice(0, 5)}
        />
      </div>
    </div>
  )
}
