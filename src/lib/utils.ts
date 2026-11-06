export const cn = (...v: Array<string | false | null | undefined>) => v.filter(Boolean).join(' ')

/** Africa/Lusaka is UTC+2 all year (no daylight saving), so a fixed offset is exact. */
export const LUSAKA_OFFSET_MS = 2 * 60 * 60 * 1000
export const pad = (n: number) => String(n).padStart(2, '0')
export const dateKey = (y: number, m0: number, d: number) => `${y}-${pad(m0 + 1)}-${pad(d)}`
export const todayKey = () => new Date(Date.now() + LUSAKA_OFFSET_MS).toISOString().slice(0, 10)

export function addDays(key: string, n: number): string {
  const d = new Date(`${key}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}
export const daysInMonth = (y: number, m0: number) => new Date(Date.UTC(y, m0 + 1, 0)).getUTCDate()
/** Monday = 0 … Sunday = 6 */
export const weekdayMon0 = (y: number, m0: number, d: number) => (new Date(Date.UTC(y, m0, d)).getUTCDay() + 6) % 7

export function formatDate(key: string, style: 'long' | 'medium' | 'short' = 'long'): string {
  const opts: Intl.DateTimeFormatOptions =
    style === 'long'
      ? { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }
      : style === 'medium'
        ? { day: 'numeric', month: 'short', year: 'numeric' }
        : { day: 'numeric', month: 'short' }
  return new Intl.DateTimeFormat('en-GB', { ...opts, timeZone: 'UTC' }).format(new Date(`${key}T00:00:00Z`))
}
export function monthLabel(y: number, m0: number): string {
  return new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(y, m0, 1)))
}

/** "14:00" or "14:00:00" → "2:00 PM" */
export function formatTime(t: string): string {
  const [h, m] = t.split(':').map(Number)
  return `${h % 12 || 12}:${pad(m)} ${h >= 12 ? 'PM' : 'AM'}`
}
export const toMinutes = (t: string) => {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}
export function timeOptions(stepMin = 30): string[] {
  const out: string[] = []
  for (let m = 0; m < 24 * 60; m += stepMin) out.push(`${pad(Math.floor(m / 60))}:${pad(m % 60)}`)
  return out
}

/** Local Lusaka date + time → ISO timestamp with explicit offset */
export const toLusakaISO = (date: string, time: string) => `${date}T${time.slice(0, 5)}:00+02:00`
export const lusakaDateKey = (iso: string | Date) => new Date(new Date(iso).getTime() + LUSAKA_OFFSET_MS).toISOString().slice(0, 10)
export const lusakaTime = (iso: string | Date) => new Date(new Date(iso).getTime() + LUSAKA_OFFSET_MS).toISOString().slice(11, 16)

export const digitsOnly = (s: string) => s.replace(/\D/g, '')
/** Compare phone numbers by their last 9 digits so +260 97… and 097… match. */
export const phoneTail = (s: string) => digitsOnly(s).slice(-9)
export function whatsappTo(phone: string, text?: string): string {
  let d = digitsOnly(phone)
  if (d.startsWith('0')) d = `260${d.slice(1)}`
  return `https://wa.me/${d}${text ? `?text=${encodeURIComponent(text)}` : ''}`
}
