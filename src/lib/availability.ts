import { addDays, dateKey, daysInMonth, lusakaTime, toLusakaISO } from './utils'

export type DayState = 'pending' | 'partial' | 'unavailable'
export interface BusyBooking { status: 'pending' | 'confirmed'; starts_at: string; ends_at: string; facility_ids: string[] }
export interface BusyBlock { facility_id: string | null; starts_at: string; ends_at: string }
export interface BusyWindow { facility: string; start: string; end: string; kind: 'confirmed' | 'pending' | 'block' }

export function monthRange(month: string) {
  const [y, m] = month.split('-').map(Number)
  const first = `${month}-01`
  const last = dateKey(y, m - 1, daysInMonth(y, m - 1))
  return { first, last, startISO: toLusakaISO(first, '00:00'), endISO: toLusakaISO(addDays(last, 1), '00:00') }
}

const DAY_MS = 86_400_000
const dayBounds = (key: string) => {
  const start = new Date(toLusakaISO(key, '00:00')).getTime()
  return { start, end: start + DAY_MS }
}
const overlaps = (s: string, e: string, from: number, to: number) => new Date(s).getTime() < to && new Date(e).getTime() > from

/**
 * Day-level status for the public calendar, judged against the facilities the visitor selected.
 *  unavailable → every selected facility is already confirmed/blocked at some point that day
 *  partial     → some selected facilities are, so exact times decide
 *  pending     → only unconfirmed requests exist (these do NOT reserve the slot)
 * The exact, minute-level rule is enforced by the database; this is a coarse guide.
 */
export function computeDayStates(month: string, relevant: string[], bookings: BusyBooking[], blocks: BusyBlock[]): Record<string, DayState> {
  const [y, m] = month.split('-').map(Number)
  const out: Record<string, DayState> = {}
  for (let d = 1; d <= daysInMonth(y, m - 1); d++) {
    const key = dateKey(y, m - 1, d)
    const { start, end } = dayBounds(key)
    const taken = new Set<string>()
    let pending = false
    for (const f of relevant) {
      const blocked = blocks.some((b) => (b.facility_id === null || b.facility_id === f) && overlaps(b.starts_at, b.ends_at, start, end))
      const confirmed = bookings.some((b) => b.status === 'confirmed' && b.facility_ids.includes(f) && overlaps(b.starts_at, b.ends_at, start, end))
      if (blocked || confirmed) taken.add(f)
      else if (bookings.some((b) => b.status === 'pending' && b.facility_ids.includes(f) && overlaps(b.starts_at, b.ends_at, start, end))) pending = true
    }
    if (relevant.length && taken.size === relevant.length) out[key] = 'unavailable'
    else if (taken.size > 0) out[key] = 'partial'
    else if (pending) out[key] = 'pending'
  }
  return out
}

/** Time windows already taken on one date (clipped to that day), for the visitor's selected facilities. */
export function busyWindows(date: string, relevant: { id: string; name: string }[], bookings: BusyBooking[], blocks: BusyBlock[]): BusyWindow[] {
  const { start, end } = dayBounds(date)
  const fmt = (ms: number) => (ms >= end ? '24:00' : lusakaTime(new Date(ms)))
  const out: BusyWindow[] = []
  const push = (name: string, s: string, e: string, kind: BusyWindow['kind']) => {
    const a = Math.max(new Date(s).getTime(), start)
    const b = Math.min(new Date(e).getTime(), end)
    out.push({ facility: name, start: fmt(a), end: fmt(b), kind })
  }
  for (const f of relevant) {
    for (const b of blocks) if ((b.facility_id === null || b.facility_id === f.id) && overlaps(b.starts_at, b.ends_at, start, end)) push(f.name, b.starts_at, b.ends_at, 'block')
    for (const b of bookings) if (b.facility_ids.includes(f.id) && overlaps(b.starts_at, b.ends_at, start, end)) push(f.name, b.starts_at, b.ends_at, b.status === 'confirmed' ? 'confirmed' : 'pending')
  }
  return out.sort((a, b) => a.start.localeCompare(b.start))
}
