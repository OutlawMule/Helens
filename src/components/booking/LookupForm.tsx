'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Notice, TextField } from '@/components/ui/primitives'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { EVENT_LABELS, type EventTypeId } from '@/lib/constants'
import { lookupSchema, type LookupInput } from '@/lib/validation'
import { formatDate, formatTime } from '@/lib/utils'

interface Found {
  reference: string; status: string; firstName: string; eventType: EventTypeId; eventDate: string
  startTime: string; endTime: string; guests: number; createdAt: string; facilities: string[]
}
const STATUS_TEXT: Record<string, string> = {
  pending: 'Your request is waiting for our team to review it. The date is not reserved until it is confirmed.',
  confirmed: 'Your booking is confirmed. We look forward to welcoming you.',
  rejected: 'Unfortunately we could not accommodate this request. Please contact us to talk through other dates.',
  cancelled: 'This booking has been cancelled. Contact us if you would like to rebook.',
  completed: 'This event has taken place. Thank you for celebrating with us.',
}

export function LookupForm({ initialRef, whatsapp }: { initialRef: string; whatsapp: string }) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LookupInput>({
    resolver: zodResolver(lookupSchema),
    defaultValues: { reference: initialRef, contact: '' },
  })
  const [error, setError] = useState('')
  const [booking, setBooking] = useState<Found | null>(null)

  const onSubmit = handleSubmit(async (values) => {
    setError('')
    setBooking(null)
    try {
      const res = await fetch('/api/bookings/lookup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values) })
      const json = (await res.json()) as { booking?: Found; error?: string }
      if (!res.ok || !json.booking) return setError(json.error ?? 'Something went wrong. Please try again.')
      setBooking(json.booking)
    } catch {
      setError('We could not reach the server. Please check your connection and try again.')
    }
  })

  return (
    <div className="mx-auto max-w-xl">
      <form onSubmit={onSubmit} noValidate className="card space-y-5 p-6 sm:p-8" aria-label="Find your booking">
        <TextField id="l-ref" label="Booking reference" placeholder="HH-7K3PQ9" autoCapitalize="characters" error={errors.reference?.message} {...register('reference')} />
        <TextField id="l-contact" label="Email or phone number used for the booking" hint="We only show a booking when both details match." error={errors.contact?.message} {...register('contact')} />
        {error && <Notice tone="danger">{error}</Notice>}
        <button type="submit" disabled={isSubmitting} className="btn btn-primary w-full sm:w-auto">{isSubmitting ? 'Checking…' : 'Find my booking'}</button>
      </form>

      {booking && (
        <section className="card mt-8 p-6 sm:p-8" aria-live="polite" aria-label="Booking details">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm text-muted">Reference</p>
              <p className="h-display text-3xl">{booking.reference}</p>
            </div>
            <StatusBadge status={booking.status} />
          </div>
          <p className="mt-4 text-muted">Hello {booking.firstName}. {STATUS_TEXT[booking.status] ?? ''}</p>
          <dl className="mt-6 divide-y divide-line/60 text-sm">
            {[['Event', EVENT_LABELS[booking.eventType] ?? booking.eventType], ['Date', formatDate(booking.eventDate)], ['Time', `${formatTime(booking.startTime)} to ${formatTime(booking.endTime)}`], ['Guests', String(booking.guests)], ['Spaces', booking.facilities.join(', ')]].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-6 py-3"><dt className="text-muted">{k}</dt><dd className="text-right">{v}</dd></div>
            ))}
          </dl>
          <a className="btn btn-ghost btn-sm mt-6" href={`${whatsapp}?text=${encodeURIComponent(`Hello Helens Haven, about booking ${booking.reference}: `)}`} target="_blank" rel="noopener noreferrer">Ask about this booking on WhatsApp</a>
        </section>
      )}
    </div>
  )
}
