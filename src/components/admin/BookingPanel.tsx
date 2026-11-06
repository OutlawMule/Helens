'use client'

import { useState } from 'react'
import { MessageCircle } from 'lucide-react'
import { ActionMessage, AdminCard, useAction } from './ui'
import { AreaField, SelectField, TextField } from '@/components/ui/primitives'
import { addBookingNote, rescheduleBooking, setBookingStatus } from '@/lib/actions/bookings'
import { BOOKING_STATUSES, STATUS_LABEL, type BookingStatus } from '@/lib/constants'
import { formatDate, formatTime, timeOptions, whatsappTo } from '@/lib/utils'

interface Props {
  id: string
  reference: string
  status: string
  fullName: string
  phone: string
  eventDate: string
  startTime: string
  endTime: string
}
const TIMES = timeOptions(30)

export function BookingPanel({ id, reference, status, fullName, phone, eventDate, startTime, endTime }: Props) {
  const statusAct = useAction()
  const reschedAct = useAction()
  const noteAct = useAction()
  const [target, setTarget] = useState<BookingStatus>(status as BookingStatus)
  const [date, setDate] = useState(eventDate)
  const [start, setStart] = useState(startTime)
  const [end, setEnd] = useState(endTime)
  const [note, setNote] = useState('')

  const quick: { label: string; to: BookingStatus; cls: string; confirm?: string }[] =
    status === 'pending'
      ? [{ label: 'Approve request', to: 'confirmed', cls: 'btn-primary' }, { label: 'Reject', to: 'rejected', cls: 'btn-ghost', confirm: 'Reject this request?' }]
      : status === 'confirmed'
        ? [{ label: 'Mark completed', to: 'completed', cls: 'btn-primary' }, { label: 'Cancel booking', to: 'cancelled', cls: 'btn-ghost', confirm: 'Cancel this confirmed booking? This frees the dates.' }]
        : status === 'rejected' || status === 'cancelled'
          ? [{ label: 'Reopen as pending', to: 'pending', cls: 'btn-ghost' }]
          : []
  const change = (to: BookingStatus, confirm?: string) => {
    if (confirm && !window.confirm(confirm)) return
    statusAct.run(() => setBookingStatus({ id, status: to }))
  }

  const first = fullName.split(' ')[0]
  const when = `${formatDate(eventDate)}, ${formatTime(startTime)} to ${formatTime(endTime)}`
  const messages: Record<string, string> = {
    pending: `Hello ${first}, thank you for your booking request ${reference} at Helens Haven. We are reviewing it and will be in touch shortly.`,
    confirmed: `Hello ${first}, your Helens Haven booking ${reference} is confirmed for ${when}. We look forward to hosting you.`,
    rejected: `Hello ${first}, thank you for your request ${reference}. Unfortunately we are unable to accommodate it. We would be glad to talk through other dates.`,
    cancelled: `Hello ${first}, your Helens Haven booking ${reference} has been cancelled. Please get in touch if you would like to rebook.`,
    completed: `Hello ${first}, thank you for celebrating with us at Helens Haven (${reference}).`,
  }

  return (
    <div className="space-y-6">
      <AdminCard title="Decision">
        {quick.length > 0 && (
          <div className="flex flex-wrap gap-3">
            {quick.map((q) => <button key={q.to} type="button" disabled={statusAct.pending} onClick={() => change(q.to, q.confirm)} className={`btn ${q.cls}`}>{q.label}</button>)}
          </div>
        )}
        {status === 'pending' && <p className="mt-3 text-xs text-muted">Approving checks the database for clashes with other confirmed bookings and blocked periods. If there is one, nothing changes and you will see why.</p>}
        <div className="mt-5 flex flex-wrap items-end gap-3 border-t border-line/60 pt-5">
          <SelectField id="set-status" label="Set status manually" value={target} onChange={(e) => setTarget(e.target.value as BookingStatus)} className="min-w-[12rem] flex-1">
            {BOOKING_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
          </SelectField>
          <button type="button" disabled={statusAct.pending || target === status} onClick={() => change(target, target === 'cancelled' || target === 'rejected' ? `Set this booking to ${STATUS_LABEL[target].toLowerCase()}?` : undefined)} className="btn btn-ghost">Update status</button>
        </div>
        <ActionMessage msg={statusAct.msg} />
      </AdminCard>

      <AdminCard title="Reschedule">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            reschedAct.run(() => rescheduleBooking({ id, eventDate: date, startTime: start, endTime: end }))
          }}
          className="grid gap-4 sm:grid-cols-3"
        >
          <TextField id="r-date" type="date" label="New date" value={date} onChange={(e) => setDate(e.target.value)} required />
          <SelectField id="r-start" label="Start" value={start} onChange={(e) => setStart(e.target.value)}>{TIMES.map((t) => <option key={t} value={t}>{formatTime(t)}</option>)}</SelectField>
          <SelectField id="r-end" label="End" value={end} onChange={(e) => setEnd(e.target.value)}>{TIMES.map((t) => <option key={t} value={t}>{formatTime(t)}</option>)}</SelectField>
          <div className="sm:col-span-3">
            <button type="submit" disabled={reschedAct.pending} className="btn btn-primary">{reschedAct.pending ? 'Saving…' : 'Reschedule booking'}</button>
            <p className="mt-2 text-xs text-muted">An end time earlier than the start time means the event ends the next day. Confirmed bookings are re-checked for clashes.</p>
          </div>
        </form>
        <ActionMessage msg={reschedAct.msg} />
      </AdminCard>

      <AdminCard title="Internal note">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            noteAct.run(() => addBookingNote({ id, note }), { onDone: (r) => r.ok && setNote('') })
          }}
        >
          <AreaField id="note" label="Visible to administrators only" rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
          <button type="submit" disabled={noteAct.pending || !note.trim()} className="btn btn-ghost mt-3">Add note</button>
        </form>
        <ActionMessage msg={noteAct.msg} />
      </AdminCard>

      <AdminCard title="Contact the customer">
        <p className="mb-4 text-sm text-muted">Opens WhatsApp with a message that matches the current status. Edit it before sending.</p>
        <a className="btn btn-ghost" href={whatsappTo(phone, messages[status] ?? messages.pending)} target="_blank" rel="noopener noreferrer"><MessageCircle className="h-4 w-4" aria-hidden />Message on WhatsApp</a>
      </AdminCard>
    </div>
  )
}
