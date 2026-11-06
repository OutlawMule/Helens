'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Trash2 } from 'lucide-react'
import { CalendarGrid, type CalState } from '@/components/booking/CalendarGrid'
import { ActionMessage, AdminCard, EmptyState, useAction } from './ui'
import { SelectField, TextField } from '@/components/ui/primitives'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { createBlock, deleteBlock } from '@/lib/actions/bookings'
import { EVENT_LABELS, type EventTypeId } from '@/lib/constants'
import { formatDate, formatTime, lusakaDateKey, lusakaTime, pad, timeOptions, toLusakaISO } from '@/lib/utils'

export interface CalBooking {
  id: string; reference: string; status: string; full_name: string; event_type: string
  event_date: string; start_time: string; end_time: string; starts_at: string; ends_at: string
  booking_facilities: { facility: { name: string } | null }[]
}
export interface CalBlock {
  id: string; facility_id: string | null; kind: 'blocked' | 'maintenance'; starts_at: string; ends_at: string
  all_day: boolean; reason: string | null; facility: { name: string } | null
}
interface Props { month: string; bookings: CalBooking[]; blocks: CalBlock[]; facilities: { id: string; name: string }[] }

const TIMES = timeOptions(30)
const overlapsDay = (item: { starts_at: string; ends_at: string }, key: string) => {
  const s = new Date(toLusakaISO(key, '00:00')).getTime()
  return new Date(item.starts_at).getTime() < s + 86_400_000 && new Date(item.ends_at).getTime() > s
}

export function CalendarManager({ month, bookings, blocks, facilities }: Props) {
  const router = useRouter()
  const [y, m] = month.split('-').map(Number)
  const [selected, setSelected] = useState<string | null>(null)
  const act = useAction()
  const del = useAction()

  const [facilityId, setFacilityId] = useState('')
  const [kind, setKind] = useState<'blocked' | 'maintenance'>('blocked')
  const [allDay, setAllDay] = useState(true)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [startTime, setStartTime] = useState('08:00')
  const [endTime, setEndTime] = useState('18:00')
  const [reason, setReason] = useState('')

  useEffect(() => {
    if (selected) {
      setStartDate(selected)
      setEndDate(selected)
    }
  }, [selected])

  const dayBookings = (key: string) => bookings.filter((b) => overlapsDay(b, key))
  const dayBlocks = (key: string) => blocks.filter((b) => overlapsDay(b, key))
  const stateOf = (key: string): CalState => {
    const bs = dayBookings(key)
    if (bs.some((b) => b.status === 'confirmed' || b.status === 'completed')) return 'unavailable'
    if (dayBlocks(key).length) return 'partial'
    if (bs.some((b) => b.status === 'pending')) return 'pending'
    return 'available'
  }

  const selBookings = selected ? dayBookings(selected) : []
  const selBlocks = selected ? dayBlocks(selected) : []

  return (
    <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
      <AdminCard>
        <CalendarGrid
          year={y}
          month={m - 1}
          onMonthChange={(ny, nm) => router.push(`/admin/calendar?m=${ny}-${pad(nm + 1)}`)}
          stateOf={stateOf}
          selected={selected}
          onSelect={setSelected}
          tall
          legend={false}
          renderExtra={(key) => {
            const bs = dayBookings(key)
            const conf = bs.filter((b) => b.status === 'confirmed' || b.status === 'completed').length
            const pend = bs.filter((b) => b.status === 'pending').length
            const blk = dayBlocks(key).length
            return (
              <span className="flex flex-col gap-0.5 text-[11px] leading-tight">
                {conf > 0 && <span className="text-ok">{conf} booked</span>}
                {pend > 0 && <span className="text-warn">{pend} pending</span>}
                {blk > 0 && <span className="text-accent-ink">{blk} blocked</span>}
              </span>
            )
          }}
        />
        <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted" aria-label="Calendar key">
          <li className="flex items-center gap-2"><span className="h-3 w-3 rounded border border-danger/40 bg-danger/20" />Confirmed booking</li>
          <li className="flex items-center gap-2"><span className="h-3 w-3 rounded border border-warn/70 bg-warn/20" />Pending request only</li>
          <li className="flex items-center gap-2"><span className="h-3 w-3 rounded border border-accent/70 bg-accent/30" />Blocked or maintenance</li>
          <li className="flex items-center gap-2"><span className="h-3 w-3 rounded border border-line" />Available</li>
        </ul>
      </AdminCard>

      <div className="space-y-6">
        <AdminCard title={selected ? formatDate(selected) : 'Select a day'}>
          {!selected ? (
            <EmptyState>Choose a date on the calendar to see its bookings and blocks.</EmptyState>
          ) : (
            <div className="space-y-5">
              <div>
                <h3 className="mb-2 text-sm font-medium">Bookings</h3>
                {selBookings.length ? (
                  <ul className="divide-y divide-line/60">
                    {selBookings.map((b) => (
                      <li key={b.id}>
                        <Link href={`/admin/bookings/${b.id}`} className="flex items-start justify-between gap-3 py-2.5 text-sm hover:text-brand">
                          <span>
                            <span className="block font-medium">{b.full_name}</span>
                            <span className="block text-xs text-muted">{EVENT_LABELS[b.event_type as EventTypeId] ?? b.event_type} · {formatTime(b.start_time)} to {formatTime(b.end_time)}</span>
                            <span className="block text-xs text-muted">{b.booking_facilities.map((f) => f.facility?.name).filter(Boolean).join(', ')}</span>
                          </span>
                          <StatusBadge status={b.status} />
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : <p className="text-sm text-muted">No bookings on this day.</p>}
              </div>
              <div>
                <h3 className="mb-2 text-sm font-medium">Blocked and maintenance periods</h3>
                {selBlocks.length ? (
                  <ul className="divide-y divide-line/60">
                    {selBlocks.map((b) => (
                      <li key={b.id} className="flex items-start justify-between gap-3 py-2.5 text-sm">
                        <span>
                          <span className="block font-medium">{b.kind === 'maintenance' ? 'Maintenance' : 'Blocked'}: {b.facility?.name ?? 'Whole venue'}</span>
                          <span className="block text-xs text-muted">
                            {b.all_day ? `${formatDate(lusakaDateKey(b.starts_at), 'short')} to ${formatDate(lusakaDateKey(new Date(new Date(b.ends_at).getTime() - 1)), 'short')} (all day)` : `${formatDate(lusakaDateKey(b.starts_at), 'short')} ${formatTime(lusakaTime(b.starts_at))} to ${formatDate(lusakaDateKey(b.ends_at), 'short')} ${formatTime(lusakaTime(b.ends_at))}`}
                          </span>
                          {b.reason && <span className="block text-xs text-muted">{b.reason}</span>}
                        </span>
                        <button type="button" aria-label="Remove block" disabled={del.pending} onClick={() => window.confirm('Remove this block?') && del.run(() => deleteBlock(b.id))} className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-line hover:border-danger hover:text-danger"><Trash2 className="h-4 w-4" /></button>
                      </li>
                    ))}
                  </ul>
                ) : <p className="text-sm text-muted">Nothing blocked on this day.</p>}
                <ActionMessage msg={del.msg} />
              </div>
            </div>
          )}
        </AdminCard>

        <AdminCard title="Block dates or time">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              act.run(() => createBlock({ facilityId: facilityId || null, kind, allDay, startDate, endDate, startTime, endTime, reason }), { onDone: (r) => r.ok && setReason('') })
            }}
            className="space-y-4"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <SelectField id="b-fac" label="Applies to" value={facilityId} onChange={(e) => setFacilityId(e.target.value)}>
                <option value="">Whole venue</option>
                {facilities.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
              </SelectField>
              <SelectField id="b-kind" label="Type" value={kind} onChange={(e) => setKind(e.target.value as 'blocked' | 'maintenance')}>
                <option value="blocked">Blocked (unavailable)</option>
                <option value="maintenance">Maintenance</option>
              </SelectField>
              <TextField id="b-start" type="date" label="From" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
              <TextField id="b-end" type="date" label="To (inclusive)" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
            </div>
            <label className="flex items-center gap-3 text-sm"><input type="checkbox" checked={allDay} onChange={(e) => setAllDay(e.target.checked)} className="h-4 w-4 accent-[rgb(var(--c-brand))]" />All day</label>
            {!allDay && (
              <div className="grid gap-4 sm:grid-cols-2">
                <SelectField id="b-st" label="Start time" value={startTime} onChange={(e) => setStartTime(e.target.value)}>{TIMES.map((t) => <option key={t} value={t}>{formatTime(t)}</option>)}</SelectField>
                <SelectField id="b-et" label="End time" value={endTime} onChange={(e) => setEndTime(e.target.value)}>{TIMES.map((t) => <option key={t} value={t}>{formatTime(t)}</option>)}</SelectField>
              </div>
            )}
            <TextField id="b-reason" label="Reason (optional)" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={300} />
            <button type="submit" disabled={act.pending || !startDate || !endDate} className="btn btn-primary">{act.pending ? 'Saving…' : 'Add block'}</button>
            <p className="text-xs text-muted">The database refuses a block that overlaps a confirmed booking. Cancel or reschedule that booking first.</p>
            <ActionMessage msg={act.msg} />
          </form>
        </AdminCard>
      </div>
    </div>
  )
}
