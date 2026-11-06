import Link from 'next/link'
import { AdminCard, EmptyState, StatCard } from '@/components/admin/ui'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { requireAdmin } from '@/lib/actions/guard'
import { describeActivity, timeAgo } from '@/lib/activity'
import { EVENT_LABELS, type EventTypeId } from '@/lib/constants'
import { formatDate, formatTime, todayKey } from '@/lib/utils'
import type { ActivityRow, BookingRow } from '@/lib/types'

export const metadata = { title: 'Dashboard' }

type Mini = Pick<BookingRow, 'id' | 'reference' | 'full_name' | 'event_type' | 'event_date' | 'start_time' | 'end_time' | 'status' | 'created_at'>

export default async function DashboardPage() {
  const { supabase } = await requireAdmin()
  const today = todayKey()
  const count = (status?: string) => {
    const q = supabase.from('bookings').select('id', { count: 'exact', head: true })
    return status ? q.eq('status', status) : q
  }
  const cols = 'id, reference, full_name, event_type, event_date, start_time, end_time, status, created_at'
  const [total, pending, confirmed, upcomingCount, upcoming, recent, activity, messages] = await Promise.all([
    count(),
    count('pending'),
    count('confirmed'),
    supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('status', 'confirmed').gte('event_date', today),
    supabase.from('bookings').select(cols).eq('status', 'confirmed').gte('event_date', today).order('event_date').order('start_time').limit(5),
    supabase.from('bookings').select(cols).order('created_at', { ascending: false }).limit(6),
    supabase.from('activity_logs').select('*').order('created_at', { ascending: false }).limit(8),
    supabase.from('contact_messages').select('id', { count: 'exact', head: true }).eq('status', 'new'),
  ])
  const upcomingRows = (upcoming.data ?? []) as Mini[]
  const recentRows = (recent.data ?? []) as Mini[]
  const activityRows = (activity.data ?? []) as ActivityRow[]

  const row = (b: Mini) => (
    <li key={b.id}>
      <Link href={`/admin/bookings/${b.id}`} className="flex flex-wrap items-center justify-between gap-2 rounded-lg px-2 py-2.5 hover:bg-bg-alt">
        <span>
          <span className="block font-medium">{b.full_name}</span>
          <span className="block text-xs text-muted">{EVENT_LABELS[b.event_type as EventTypeId] ?? b.event_type} · {formatDate(b.event_date, 'medium')} · {formatTime(b.start_time)}</span>
        </span>
        <StatusBadge status={b.status} />
      </Link>
    </li>
  )

  return (
    <div className="space-y-8">
      <div>
        <h1 className="h-display text-3xl sm:text-4xl">Dashboard</h1>
        <p className="mt-1 text-muted">A quick look at what needs your attention.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total bookings" value={total.count ?? 0} hint="All time" />
        <StatCard label="Pending requests" value={pending.count ?? 0} tone="warn" hint={(pending.count ?? 0) > 0 ? 'Waiting for your decision' : 'All caught up'} />
        <StatCard label="Confirmed bookings" value={confirmed.count ?? 0} tone="ok" />
        <StatCard label="Upcoming events" value={upcomingCount.count ?? 0} tone="info" hint="Confirmed, from today" />
      </div>
      {(messages.count ?? 0) > 0 && (
        <p className="rounded-xl border border-line bg-surface px-4 py-3 text-sm">
          You have <strong>{messages.count}</strong> new contact {messages.count === 1 ? 'message' : 'messages'}. <Link href="/admin/messages" className="underline">Read them</Link>
        </p>
      )}

      <div className="grid gap-6 xl:grid-cols-2">
        <AdminCard title="Upcoming events" action={<Link href="/admin/calendar" className="text-sm underline">Open calendar</Link>}>
          {upcomingRows.length ? <ul className="-mx-2">{upcomingRows.map(row)}</ul> : <EmptyState>No confirmed events coming up.</EmptyState>}
        </AdminCard>
        <AdminCard title="Recent booking activity" action={<Link href="/admin/bookings" className="text-sm underline">All bookings</Link>}>
          {recentRows.length ? <ul className="-mx-2">{recentRows.map(row)}</ul> : <EmptyState>No bookings yet. New requests will appear here.</EmptyState>}
        </AdminCard>
      </div>

      <AdminCard title="Recent administrative actions">
        {activityRows.length ? (
          <ul className="divide-y divide-line/60">
            {activityRows.map((a) => (
              <li key={a.id} className="flex flex-wrap justify-between gap-2 py-3 text-sm">
                <span>{describeActivity(a)}</span>
                <span className="text-xs text-muted">{a.admin_email ?? 'system'} · {timeAgo(a.created_at)}</span>
              </li>
            ))}
          </ul>
        ) : <EmptyState>Actions you take (approvals, edits, blocks) are recorded here.</EmptyState>}
      </AdminCard>
    </div>
  )
}
