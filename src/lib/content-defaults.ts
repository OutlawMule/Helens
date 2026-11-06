import { BUSINESS } from './business'
import type { Weekday } from './constants'
import { WEEKDAYS } from './constants'
import type { TestimonialRow } from './types'

export interface ContactContent { phone: string; whatsapp: string; email: string; addressLine1: string; addressLine2: string; mapsUrl: string }
export interface HomeContent { heroTagline: string; introTitle: string; introBody: string; nurseryTitle: string; nurseryBody: string; announcement: string }
export interface AboutContent { story: string; purpose: string; botanical: string; hospitality: string }
export interface ItemContent { slug: string; title: string; summary: string }
export interface BookingSettings { enabled: boolean; requireApproval: boolean; minNoticeDays: number; maxAdvanceDays: number }
export interface DayHours { closed: boolean; open: string; close: string }
export interface HoursSettings { enforce: boolean; days: Record<Weekday, DayHours> }
export interface SiteContent {
  contact: ContactContent
  home: HomeContent
  about: AboutContent
  events: { items: ItemContent[] }
  amenities: { items: ItemContent[] }
  booking: BookingSettings
  hours: HoursSettings
}

const emptyDays = Object.fromEntries(WEEKDAYS.map((d) => [d, { closed: false, open: '', close: '' }])) as Record<Weekday, DayHours>

/**
 * Draft copy. It describes only facts supplied by the owner (facilities, sizes, location) and deliberately
 * invents no history, prices, capacities or policies. Replace it from Admin → Content.
 */
export const DEFAULT_CONTENT: SiteContent = {
  contact: {
    phone: BUSINESS.phone,
    whatsapp: BUSINESS.whatsapp,
    email: BUSINESS.email,
    addressLine1: BUSINESS.addressLines[0],
    addressLine2: BUSINESS.addressLines[1],
    mapsUrl: BUSINESS.mapsUrl,
  },
  home: {
    heroTagline: 'An event centre, garden and flower nursery in Lusaka West, made for celebrations, slow evenings and time among the plants.',
    introTitle: 'A garden to gather in, celebrate in and unwind in',
    introBody:
      'Helens Haven brings an open grass arena, a swimming pool, a fire pit lounge, a pub and restaurant and a flower nursery together in one landscaped setting. Whether you are planning a wedding, a private celebration, a corporate day or simply an afternoon outdoors, the space is built to feel generous, green and unhurried.',
    nurseryTitle: 'The flower nursery',
    nurseryBody:
      'Helens Haven is not only a place to host. The flower nursery holds flowers, landscaping plants and gardening experiences, so you can take a little of the garden home or learn how to grow your own.',
    announcement: '',
  },
  about: {
    story:
      'Helens Haven is an event centre and garden destination in Lusaka West, Zambia. It is a place to gather outdoors: to celebrate, to relax and to spend time in nature.',
    purpose:
      'The purpose is simple: give every gathering a beautiful setting. The open arena, lounge, pool and restaurant make it easy to host a celebration or enjoy a relaxed day outside.',
    botanical:
      'Plants are part of the identity here. From the landscaped garden areas to the flower nursery, greenery and colour shape how the venue looks and feels.',
    hospitality:
      'From the first enquiry to the last guest leaving, the aim is warm, attentive hospitality. The pub and restaurant keep guests refreshed while the team looks after the details.',
  },
  events: {
    items: [
      { slug: 'wedding', title: 'Weddings', summary: 'Exchange vows and celebrate on open lawns framed by flowers. The 40m × 40m arena welcomes marquees, and the gardens make a natural backdrop for portraits.' },
      { slug: 'private-celebration', title: 'Private celebrations', summary: 'Birthdays, anniversaries and family gatherings in a relaxed outdoor setting, with the pool, fire pit lounge and restaurant close at hand.' },
      { slug: 'corporate', title: 'Corporate events', summary: 'Team days, launches and company celebrations away from the office, in the open air with room to set up marquees and breakout areas.' },
      { slug: 'outdoor-concert', title: 'Outdoor concerts', summary: 'An open arena for live music under the sky, with space for staging, sound and an audience on the grass.' },
      { slug: 'garden-event', title: 'Garden events', summary: 'Markets, tastings, workshops and garden parties: events that make the most of the flowers, the nursery and the outdoors.' },
    ],
  },
  amenities: {
    items: [
      { slug: 'open-arena', title: 'Open Arena', summary: 'A 40m × 40m open grass arena, suitable for outdoor events and marquees. It is the heart of the venue: a generous green canvas for weddings, concerts and celebrations.' },
      { slug: 'swimming-pool', title: 'Swimming Pool', summary: 'A 6m × 4m pool with a shallow end of 1.0m and a deep end of 1.8m. A place to cool off, linger and enjoy the garden around you.' },
      { slug: 'fire-pit-lounge', title: 'Fire Pit & Lounge', summary: 'A separate outdoor sitting area built around a central fireplace. It sets the scene for braai evenings and quiet conversation after dark.' },
      { slug: 'pub-restaurant', title: 'Pub & Restaurant', summary: 'Garden dining and refreshments, whether you are celebrating, meeting friends or spending a slow afternoon outdoors.' },
      { slug: 'flower-nursery', title: 'Flower Nursery', summary: 'Flowers, landscaping plants and gardening experiences: the botanical heart of Helens Haven.' },
    ],
  },
  booking: { enabled: true, requireApproval: true, minNoticeDays: 0, maxAdvanceDays: 730 },
  hours: { enforce: false, days: emptyDays },
}

export const DEFAULT_FACILITIES = [
  { id: 'open-arena', slug: 'open-arena', name: 'Open Arena' },
  { id: 'swimming-pool', slug: 'swimming-pool', name: 'Swimming Pool' },
  { id: 'fire-pit-lounge', slug: 'fire-pit-lounge', name: 'Fire Pit & Lounge' },
  { id: 'pub-restaurant', slug: 'pub-restaurant', name: 'Pub & Restaurant' },
  { id: 'flower-nursery', slug: 'flower-nursery', name: 'Flower Nursery' },
]

/** Shown only when no database is connected, and always labelled as sample content. */
export const DEFAULT_TESTIMONIALS: TestimonialRow[] = [
  { id: 'sample-1', author_name: 'Sample guest', author_context: 'Sample wedding feedback', quote: 'Sample testimonial: the garden setting made the whole day feel calm and beautiful.', is_sample: true, is_published: true, sort_order: 1 },
  { id: 'sample-2', author_name: 'Sample guest', author_context: 'Sample corporate event feedback', quote: 'Sample testimonial: a relaxed, green venue that took our team out of the office for the day.', is_sample: true, is_published: true, sort_order: 2 },
  { id: 'sample-3', author_name: 'Sample guest', author_context: 'Sample family celebration feedback', quote: 'Sample testimonial: the fire pit evening was the part everyone remembered most.', is_sample: true, is_published: true, sort_order: 3 },
]

export function mergeItems(defaults: ItemContent[], overrides?: ItemContent[]): ItemContent[] {
  if (!overrides?.length) return defaults
  return defaults.map((d) => {
    const o = overrides.find((x) => x.slug === d.slug)
    return o ? { ...d, title: o.title, summary: o.summary } : d
  })
}

export function mergeContent(rows: { key: string; value: unknown }[]): SiteContent {
  const out = structuredClone(DEFAULT_CONTENT)
  for (const { key, value } of rows) {
    if (!value || typeof value !== 'object') continue
    const v = value as Record<string, unknown>
    if (key === 'contact') Object.assign(out.contact, v)
    else if (key === 'home') Object.assign(out.home, v)
    else if (key === 'about') Object.assign(out.about, v)
    else if (key === 'booking') Object.assign(out.booking, v)
    else if (key === 'events') out.events.items = mergeItems(out.events.items, v.items as ItemContent[] | undefined)
    else if (key === 'amenities') out.amenities.items = mergeItems(out.amenities.items, v.items as ItemContent[] | undefined)
    else if (key === 'hours') {
      out.hours = { enforce: Boolean(v.enforce), days: { ...out.hours.days, ...((v.days as Record<Weekday, DayHours>) ?? {}) } }
    }
  }
  return out
}
