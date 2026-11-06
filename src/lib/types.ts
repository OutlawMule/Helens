import type { BookingStatus } from './constants'

export interface Facility {
  id: string
  slug: string
  name: string
  description: string | null
  sort_order: number
  is_active: boolean
}

export interface BookingRow {
  id: string
  reference: string
  status: BookingStatus
  full_name: string
  email: string
  phone: string
  event_type: string
  event_date: string
  start_time: string
  end_time: string
  starts_at: string
  ends_at: string
  guests: number
  notes: string | null
  created_at: string
  updated_at: string
  booking_facilities?: { facility: { name: string; slug: string } | null }[]
}

export interface BlockRow {
  id: string
  facility_id: string | null
  kind: 'blocked' | 'maintenance'
  starts_at: string
  ends_at: string
  all_day: boolean
  reason: string | null
  facility?: { name: string } | null
}

export interface GalleryRow {
  id: string
  storage_path: string
  title: string
  alt_text: string
  category: string
  sort_order: number
  is_published: boolean
  created_at: string
}

export interface TestimonialRow {
  id: string
  author_name: string
  author_context: string | null
  quote: string
  is_sample: boolean
  is_published: boolean
  sort_order: number
}

export interface ActivityRow {
  id: number
  admin_email: string | null
  action: string
  entity_type: string
  entity_id: string | null
  details: Record<string, unknown>
  created_at: string
}

export interface MessageRow {
  id: string
  name: string
  email: string
  phone: string | null
  message: string
  status: 'new' | 'handled'
  created_at: string
}

export type ActionResult = { ok: boolean; message: string }
