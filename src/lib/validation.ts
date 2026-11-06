import { z } from 'zod'
import { BOOKING_STATUSES, EVENT_TYPE_IDS, GALLERY_CATEGORY_IDS, WEEKDAYS, WEEKDAY_LABEL, type Weekday } from './constants'

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Choose a valid time')
const dateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Choose a date')

/* ───────── Public booking request (shared by the form and the API route) ───────── */
const bookingBase = z.object({
  eventType: z.enum(EVENT_TYPE_IDS, { errorMap: () => ({ message: 'Choose an event type' }) }),
  guests: z
    .number({ required_error: 'Enter the number of guests', invalid_type_error: 'Enter the number of guests' })
    .int('Use a whole number')
    .min(1, 'At least 1 guest')
    .max(10000, 'Please enter a realistic guest count'), // input sanity limit only, not a venue capacity
  facilities: z.array(z.string().regex(/^[a-z0-9-]+$/)).min(1, 'Choose at least one facility').max(12),
  eventDate: dateStr,
  startTime: time,
  endTime: time,
  fullName: z.string().trim().min(2, 'Enter your full name').max(100),
  email: z.string().trim().toLowerCase().email('Enter a valid email address').max(200),
  phone: z
    .string()
    .trim()
    .min(7, 'Enter a phone number')
    .max(25)
    .regex(/^\+?[\d\s()-]{7,25}$/, 'Use digits, spaces and + only'),
  notes: z.string().trim().max(2000, 'Keep this under 2000 characters'),
})
const endsDiffer = (v: { startTime: string; endTime: string }, ctx: z.RefinementCtx) => {
  if (v.startTime === v.endTime) ctx.addIssue({ code: 'custom', path: ['endTime'], message: 'End time must differ from the start time' })
}
export const bookingSchema = bookingBase.superRefine(endsDiffer)
export type BookingInput = z.infer<typeof bookingSchema>
export const bookingPayloadSchema = bookingBase.extend({ website: z.string().optional() }).superRefine(endsDiffer)

export const contactSchema = z.object({
  name: z.string().trim().min(2, 'Enter your name').max(100),
  email: z.string().trim().toLowerCase().email('Enter a valid email address').max(200),
  phone: z.string().trim().max(25),
  message: z.string().trim().min(10, 'Tell us a little more (at least 10 characters)').max(3000),
})
export type ContactInput = z.infer<typeof contactSchema>
export const contactPayloadSchema = contactSchema.extend({ website: z.string().optional() })

export const lookupSchema = z.object({
  reference: z.string().trim().toUpperCase().regex(/^HH-[A-Z0-9]{6}$/, 'Enter a reference like HH-7K3PQ9'),
  contact: z.string().trim().min(5, 'Enter the email or phone number used for the booking').max(200),
})
export type LookupInput = z.infer<typeof lookupSchema>

/* ───────── Admin actions ───────── */
export const statusUpdateSchema = z.object({ id: z.string().uuid(), status: z.enum(BOOKING_STATUSES) })
export const rescheduleSchema = z.object({ id: z.string().uuid(), eventDate: dateStr, startTime: time, endTime: time }).superRefine(endsDiffer)
export const noteSchema = z.object({ id: z.string().uuid(), note: z.string().trim().min(1, 'Write a note first').max(1000) })

export const blockSchema = z
  .object({
    facilityId: z.string().uuid().nullable(),
    kind: z.enum(['blocked', 'maintenance']),
    allDay: z.boolean(),
    startDate: dateStr,
    endDate: dateStr,
    startTime: time,
    endTime: time,
    reason: z.string().trim().max(300),
  })
  .superRefine((v, ctx) => {
    if (v.endDate < v.startDate) ctx.addIssue({ code: 'custom', path: ['endDate'], message: 'End date is before the start date' })
    if (!v.allDay && v.startDate === v.endDate && v.endTime <= v.startTime)
      ctx.addIssue({ code: 'custom', path: ['endTime'], message: 'End time must be after the start time' })
  })

const short = z.string().trim().max(200)
const long = z.string().trim().max(2000)
export const contentSchemas = {
  contact: z.object({
    phone: short.min(5, 'Phone is required'),
    whatsapp: z.string().trim().regex(/^https:\/\/wa\.me\/\d{6,15}$/, 'Use a link like https://wa.me/260971664049'),
    email: z.string().trim().email('Enter a valid email'),
    addressLine1: short.min(1, 'Address is required'),
    addressLine2: short,
    mapsUrl: z.string().trim().url('Enter a full Google Maps link').max(600),
  }),
  home: z.object({ heroTagline: long, introTitle: short, introBody: long, nurseryTitle: short, nurseryBody: long, announcement: short }),
  about: z.object({ story: long, purpose: long, botanical: long, hospitality: long }),
  events: z.object({ items: z.array(z.object({ slug: z.string().max(60), title: short.min(1), summary: long.min(1) })).max(12) }),
  amenities: z.object({ items: z.array(z.object({ slug: z.string().max(60), title: short.min(1), summary: long.min(1) })).max(12) }),
  booking: z.object({
    enabled: z.boolean(),
    requireApproval: z.boolean(),
    minNoticeDays: z.number().int().min(0).max(365),
    maxAdvanceDays: z.number().int().min(1).max(1460),
  }),
  hours: z
    .object({
      enforce: z.boolean(),
      days: z.record(z.enum(WEEKDAYS), z.object({ closed: z.boolean(), open: z.string().max(5), close: z.string().max(5) })),
    })
    .superRefine((v, ctx) => {
      if (!v.enforce) return
      for (const [day, h] of Object.entries(v.days) as [string, { closed: boolean; open: string; close: string } | undefined][]) {
        if (h && !h.closed && (!h.open || !h.close || h.open >= h.close)) {
          ctx.addIssue({ code: 'custom', path: ['days', day], message: `Set valid opening and closing times for ${WEEKDAY_LABEL[day as Weekday]}, or mark it closed.` })
        }
      }
    }),
} as const
export type ContentKey = keyof typeof contentSchemas

export const testimonialSchema = z.object({
  id: z.string().uuid().optional(),
  authorName: z.string().trim().min(2).max(100),
  authorContext: z.string().trim().max(120),
  quote: z.string().trim().min(10).max(800),
  isSample: z.boolean(),
  isPublished: z.boolean(),
})
export const galleryMetaSchema = z.object({
  title: z.string().trim().min(1, 'Add a title').max(120),
  altText: z.string().trim().min(1, 'Describe the image for screen readers').max(240),
  category: z.enum(GALLERY_CATEGORY_IDS),
  isPublished: z.boolean(),
})
