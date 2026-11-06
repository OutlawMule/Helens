import Link from 'next/link'
import { EmptyState } from '@/components/admin/ui'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { requireAdmin } from '@/lib/actions/guard'
import { BOOKING_STATUSES, EVENT_LABELS, STATUS_LABEL, type EventTypeId } from '@/lib/constants'
import { formatDate, formatTime } from '@/lib/utils'
import type { BookingRow } from '@/lib/types'

export const metadata = { title: 'Bookings' }
const PAGE = 20

export default async function AdminBookingsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams
  const str = (k: string) => (typeof sp[k] === 'string' ? (sp[k] as string).trim() : '')
  const q = str('q'), status = str('status'), from = str('from'), to = str('to')
  const page = Math.max(1, Number(str('page')) || 1)
  const { supabase } = await requireAdmin()

  let query = supabase
    .from('bookings')
    .select('id, reference, status, full_name, email, phone, event_type, event_date, start_time, end_time, guests, created_at, booking_facilities(facility:venue_facilities(name))', { count: 'exact' })
  if ((BOOKING_STATUSES as readonly string[]).includes(status)) query = query.eq('status', status)
  if (/^\d{4}-\d{2}-\d{2}$/.test(from)) query = query.gte('event_date', from)
  if (/^\d{4}-\d{2}-\d{2}$/.test(to)) query = query.lte('event_date', to)
  const term = q.replace(/[,()%*\\]/g, ' ').trim()
  if (term) query = query.or(`reference.ilike.%${term}%,full_name.ilike.%${term}%,email.ilike.%${term}%,phone.ilike.%${term}%`)
  const byEvent = Boolean(from || to)
  const { data, count } = await (byEvent ? query.order('event_date', { ascending: true }) : query.order('created_at', { ascending: false })).range((page - 1) * PAGE, page * PAGE - 1)
  const rows = (data ?? []) as unknown as BookingRow[]
  const pages = Math.max(1, Math.ceil((count ?? 0) / PAGE))

  const href = (p: number) => {
    const u = new URLSearchParams()
    if (q) u.set('q', q)
    if (status) u.set('status', status)
    if (from) u.set('from', from)
    if (to) u.set('to', to)
    if (p > 1) u.set('page', String(p))
    return `/admin/bookings${u.size ? `?${u}` : ''}`
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="h-display text-3xl sm:text-4xl">Bookings</h1>
        <p className="mt-1 text-muted">{count ?? 0} {count === 1 ? 'booking' : 'bookings'} {term || status || from || to ? 'match your filters' : 'in total'}.</p>
      </div>

      <form method="get" className="card grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_auto] lg:items-end">
        <div><label htmlFor="q" className="label">Search</label><input id="q" name="q" defaultValue={q} placeholder="Name, email, phone or reference" className="input" /></div>
        <div>
          <label htmlFor="status" className="label">Status</label>
          <select id="status" name="status" defaultValue={status} className="input">
            <option value="">All statuses</option>
            {BOOKING_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
          </select>
        </div>
        <div><label htmlFor="from" className="label">Event from</label><input id="from" name="from" type="date" defaultValue={from} className="input" /></div>
        <div><label htmlFor="to" className="label">Event to</label><input id="to" name="to" type="date" defaultValue={to} className="input" /></div>
        <div className="flex gap-2"><button type="submit" className="btn btn-primary">Apply</button><Link href="/admin/bookings" className="btn btn-ghost">Clear</Link></div>
      </form>

      {rows.length === 0 ? (
        <EmptyState>No bookings match. {term || status || from || to ? 'Try clearing the filters.' : 'New requests from the website will appear here.'}</EmptyState>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[56rem] text-left text-sm">
            <thead className="border-b border-line text-muted">
              <tr>{['Reference', 'Guest', 'Event', 'Spaces', 'Guests', 'Status', 'Submitted'].map((h) => <th key={h} scope="col" className="px-4 py-3 font-medium">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-line/60">
              {rows.map((b) => (
                <tr key={b.id} className="hover:bg-bg-alt/60">
                  <td className="px-4 py-3"><Link href={`/admin/bookings/${b.id}`} className="font-medium underline underline-offset-4">{b.reference}</Link></td>
                  <td className="px-4 py-3"><span className="block">{b.full_name}</span><span className="block text-xs text-muted">{b.email}</span></td>
                  <td className="px-4 py-3"><span className="block">{EVENT_LABELS[b.event_type as EventTypeId] ?? b.event_type}</span><span className="block text-xs text-muted">{formatDate(b.event_date, 'medium')}, {formatTime(b.start_time)} to {formatTime(b.end_time)}</span></td>
                  <td className="px-4 py-3 text-muted">{(b.booking_facilities ?? []).map((f) => f.facility?.name).filter(Boolean).join(', ')}</td>
                  <td className="px-4 py-3">{b.guests}</td>
                  <td className="px-4 py-3"><StatusBadge status={b.status} /></td>
                  <td className="px-4 py-3 text-xs text-muted">{formatDate(b.created_at.slice(0, 10), 'short')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pages > 1 && (
        <nav aria-label="Pagination" className="flex items-center justify-between text-sm">
          <Link href={href(page - 1)} aria-disabled={page <= 1} className={`btn btn-ghost btn-sm ${page <= 1 ? 'pointer-events-none opacity-40' : ''}`}>Previous</Link>
          <span className="text-muted">Page {page} of {pages}</span>
          <Link href={href(page + 1)} aria-disabled={page >= pages} className={`btn btn-ghost btn-sm ${page >= pages ? 'pointer-events-none opacity-40' : ''}`}>Next</Link>
        </nav>
      )}
    </div>
  )
}
