import type { ActivityRow } from './types'

const s = (v: unknown) => (typeof v === 'string' ? v : v == null ? '' : String(v))

/** Plain-English one-liner for an activity log row. */
export function describeActivity(a: ActivityRow): string {
  const d = a.details ?? {}
  switch (a.action) {
    case 'booking.status': return `Booking ${s(d.reference)} changed from ${s(d.from)} to ${s(d.to)}`
    case 'booking.reschedule': return `Booking ${s(d.reference)} rescheduled`
    case 'booking.note': return `Internal note added: “${s(d.note)}”`
    case 'block.create': return `${s(d.kind) === 'maintenance' ? 'Maintenance period' : 'Dates blocked'} added`
    case 'block.delete': return 'Block removed'
    case 'content.update': return `Website content “${s(a.entity_id)}” updated`
    case 'facility.availability': return `Facility ${d.active ? 'opened' : 'closed'} for new requests`
    case 'gallery.create': return `Gallery photo added: ${s(d.title)}`
    case 'gallery.update': return 'Gallery photo updated'
    case 'gallery.delete': return 'Gallery photo deleted'
    case 'testimonial.create': return 'Testimonial added'
    case 'testimonial.update': return 'Testimonial updated'
    case 'testimonial.delete': return 'Testimonial deleted'
    case 'message.delete': return 'Contact message deleted'
    default: return a.action
  }
}

export const timeAgo = (iso: string) => new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Lusaka' }).format(new Date(iso))
