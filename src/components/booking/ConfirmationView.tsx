'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { CircleCheck, Copy, Check } from 'lucide-react'
import { ButtonLink, Notice } from '@/components/ui/primitives'
import { EASE } from '@/lib/theme'
import { EVENT_LABELS, type EventTypeId } from '@/lib/constants'
import { formatDate, formatTime } from '@/lib/utils'

interface Summary { reference: string; eventType: EventTypeId; eventDate: string; startTime: string; endTime: string; guests: number; facilities: string[] }

export function ConfirmationView({ reference, status, email, whatsapp }: { reference: string; status: string; email: string; whatsapp: string }) {
  const [summary, setSummary] = useState<Summary | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('hh-last-booking')
      const parsed = raw ? (JSON.parse(raw) as Summary) : null
      if (parsed?.reference === reference) setSummary(parsed)
    } catch {
      // no summary available: the reference alone is enough
    }
  }, [reference])

  const confirmed = status === 'confirmed'
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(reference)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard blocked: the reference is visible on screen
    }
  }
  const wa = `${whatsapp}?text=${encodeURIComponent(`Hello Helens Haven, my booking reference is ${reference}.`)}`

  return (
    <motion.div className="card mx-auto max-w-2xl p-8 text-center sm:p-12" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: EASE }}>
      <motion.div initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2, type: 'spring', stiffness: 220, damping: 14 }}>
        <CircleCheck className="mx-auto h-16 w-16 text-ok" aria-hidden />
      </motion.div>
      <h1 className="h-display mt-5 text-4xl sm:text-5xl">{confirmed ? 'Booking confirmed' : 'Request received'}</h1>
      <p className="lead mx-auto mt-4">
        {confirmed ? 'Your booking is confirmed for the time you chose.' : 'Your booking request is pending until our team approves it. The date is not reserved yet.'}
      </p>

      <div className="mx-auto mt-8 max-w-sm rounded-2xl border border-dashed border-accent/70 bg-accent/10 p-5">
        <p className="text-sm text-muted">Your booking reference</p>
        <p className="h-display mt-1 break-all text-4xl tracking-wide" data-testid="booking-reference">{reference}</p>
        <button type="button" onClick={copy} className="btn btn-ghost btn-sm mt-4">{copied ? <Check className="h-4 w-4" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}{copied ? 'Copied' : 'Copy reference'}</button>
      </div>

      {summary && (
        <dl className="mx-auto mt-8 grid max-w-sm gap-2 text-left text-sm">
          {[['Event', EVENT_LABELS[summary.eventType]], ['Date', formatDate(summary.eventDate)], ['Time', `${formatTime(summary.startTime)} to ${formatTime(summary.endTime)}`], ['Guests', String(summary.guests)], ['Spaces', summary.facilities.join(', ')]].map(([k, v]) => (
            <div key={k} className="flex justify-between gap-6 border-b border-line/50 pb-2"><dt className="text-muted">{k}</dt><dd className="text-right">{v}</dd></div>
          ))}
        </dl>
      )}

      <div className="mx-auto mt-8 max-w-md text-left">
        {email === 'sent' && <Notice tone="ok">A confirmation email is on its way to the address you gave.</Notice>}
        {email === 'failed' && <Notice tone="warn">We could not send a confirmation email, but your request is saved. Please keep your reference.</Notice>}
        {email === 'not_configured' && <Notice tone="info">No confirmation email has been sent, because email delivery is not switched on yet. Please keep this reference safe and use it to check your status.</Notice>}
      </div>

      <div className="mt-9 flex flex-wrap justify-center gap-3">
        <ButtonLink href={wa} variant="gold">Message us on WhatsApp</ButtonLink>
        <ButtonLink href={`/bookings/manage?ref=${encodeURIComponent(reference)}`} variant="ghost">Check my booking status</ButtonLink>
        <ButtonLink href="/" variant="ghost">Back to the homepage</ButtonLink>
      </div>
    </motion.div>
  )
}
