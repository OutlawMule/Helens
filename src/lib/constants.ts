export const EVENT_TYPE_IDS = ['wedding', 'private-celebration', 'corporate', 'outdoor-concert', 'garden-event', 'other'] as const
export type EventTypeId = (typeof EVENT_TYPE_IDS)[number]
export const EVENT_LABELS: Record<EventTypeId, string> = {
  wedding: 'Wedding',
  'private-celebration': 'Private celebration',
  corporate: 'Corporate event',
  'outdoor-concert': 'Outdoor concert',
  'garden-event': 'Garden event',
  other: 'Something else',
}

export const BOOKING_STATUSES = ['pending', 'confirmed', 'rejected', 'cancelled', 'completed'] as const
export type BookingStatus = (typeof BOOKING_STATUSES)[number]
export const STATUS_LABEL: Record<BookingStatus, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
  completed: 'Completed',
}

/** Verified facility facts. Descriptions are editable in the admin panel; these facts are not. */
export const AMENITY_SPECS: Record<string, string[]> = {
  'open-arena': ['40m × 40m', 'Open grass', 'Suits marquees'],
  'swimming-pool': ['6m × 4m', 'Shallow end 1.0m', 'Deep end 1.8m'],
  'fire-pit-lounge': ['Central fireplace', 'Separate lounge', 'Braai evenings'],
  'pub-restaurant': ['Garden dining', 'Refreshments'],
  'flower-nursery': ['Flowers', 'Landscaping plants', 'Gardening experiences'],
}

export type SceneKind =
  | 'hero' | 'garden' | 'arena' | 'pool' | 'fire' | 'dining' | 'nursery' | 'wedding' | 'concert' | 'celebration' | 'corporate'

export const AMENITY_SCENE: Record<string, SceneKind> = {
  'open-arena': 'arena',
  'swimming-pool': 'pool',
  'fire-pit-lounge': 'fire',
  'pub-restaurant': 'dining',
  'flower-nursery': 'nursery',
}
export const EVENT_SCENE: Record<string, SceneKind> = {
  wedding: 'wedding',
  'private-celebration': 'celebration',
  corporate: 'corporate',
  'outdoor-concert': 'concert',
  'garden-event': 'garden',
  other: 'garden',
}

export const GALLERY_CATEGORY_IDS = ['events', 'weddings', 'arena', 'pool-lounge', 'dining', 'nursery-garden'] as const
export const GALLERY_CATEGORIES = [
  { id: 'events', label: 'Events' },
  { id: 'weddings', label: 'Weddings' },
  { id: 'arena', label: 'Arena' },
  { id: 'pool-lounge', label: 'Pool & lounge' },
  { id: 'dining', label: 'Dining' },
  { id: 'nursery-garden', label: 'Nursery & garden' },
] as const
export type GalleryCategoryId = (typeof GALLERY_CATEGORIES)[number]['id']
export const CATEGORY_SCENE: Record<GalleryCategoryId, SceneKind> = {
  events: 'celebration',
  weddings: 'wedding',
  arena: 'arena',
  'pool-lounge': 'pool',
  dining: 'dining',
  'nursery-garden': 'nursery',
}

export const WEEKDAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const
export type Weekday = (typeof WEEKDAYS)[number]
export const WEEKDAY_LABEL: Record<Weekday, string> = {
  mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday', fri: 'Friday', sat: 'Saturday', sun: 'Sunday',
}
