import 'server-only'

/**
 * Email workflow. Nothing is sent unless EMAIL_PROVIDER=resend plus RESEND_API_KEY and EMAIL_FROM are set.
 * Every function returns what actually happened so the UI never claims an email was sent when it was not.
 */
export type EmailResult = 'sent' | 'not_configured' | 'failed'
export const emailConfigured = () => process.env.EMAIL_PROVIDER === 'resend' && Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM)

export interface BookingEmailData {
  reference: string
  status: string
  fullName: string
  email: string
  eventLabel: string
  dateLabel: string
  timeLabel: string
  guests: number
  facilities: string[]
}

const ESCAPES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ESCAPES[c])

async function send(to: string, subject: string, text: string): Promise<EmailResult> {
  if (!emailConfigured()) return 'not_configured'
  const html = `<div style="font-family:Georgia,serif;max-width:560px;margin:auto;color:#16221c;line-height:1.6">${text
    .split('\n')
    .map((l) => (l.trim() ? `<p style="margin:0 0 10px">${esc(l)}</p>` : ''))
    .join('')}</div>`
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: process.env.EMAIL_FROM, to: [to], subject, text, html }),
    })
    return res.ok ? 'sent' : 'failed'
  } catch {
    return 'failed'
  }
}

const summary = (b: BookingEmailData) =>
  `Reference: ${b.reference}\nEvent: ${b.eventLabel}\nDate: ${b.dateLabel}\nTime: ${b.timeLabel}\nGuests: ${b.guests}\nFacilities: ${b.facilities.join(', ')}`
const manageUrl = (ref: string) => `${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/bookings/manage?ref=${ref}`

export async function sendBookingRequestEmails(b: BookingEmailData): Promise<EmailResult> {
  const confirmed = b.status === 'confirmed'
  const result = await send(
    b.email,
    confirmed ? `Your Helens Haven booking is confirmed (${b.reference})` : `We received your Helens Haven request (${b.reference})`,
    `Hello ${b.fullName},\n\n${confirmed ? 'Your booking is confirmed.' : 'Thank you for your booking request. It is pending until our team approves it, so the date is not reserved yet.'}\n\n${summary(b)}\n\nCheck your booking status any time: ${manageUrl(b.reference)}\n\nHelens Haven, Lusaka West`,
  )
  const admin = process.env.ADMIN_NOTIFY_EMAIL
  if (admin) await send(admin, `New booking request ${b.reference}`, `${b.fullName} (${b.email}) sent a booking request.\n\n${summary(b)}`)
  return result
}

export async function sendBookingStatusEmail(b: BookingEmailData): Promise<EmailResult> {
  const lines: Record<string, string> = {
    confirmed: 'Good news: your booking is confirmed.',
    rejected: 'Unfortunately we are unable to accommodate this request.',
    cancelled: 'Your booking has been cancelled.',
    completed: 'Thank you for celebrating with us.',
  }
  const line = lines[b.status]
  if (!line) return 'not_configured'
  return send(b.email, `Your Helens Haven booking: ${b.status} (${b.reference})`, `Hello ${b.fullName},\n\n${line}\n\n${summary(b)}\n\nHelens Haven, Lusaka West`)
}

export async function sendContactNotification(name: string, email: string, phone: string, message: string): Promise<EmailResult> {
  const admin = process.env.ADMIN_NOTIFY_EMAIL
  if (!admin) return 'not_configured'
  return send(admin, `New website message from ${name}`, `From: ${name} <${email}> ${phone}\n\n${message}`)
}
