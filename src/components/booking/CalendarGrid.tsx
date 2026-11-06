'use client'

import type { ReactNode } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Spinner } from '@/components/ui/primitives'
import { cn, dateKey, daysInMonth, formatDate, monthLabel, todayKey, weekdayMon0 } from '@/lib/utils'

export type CalState = 'available' | 'pending' | 'partial' | 'unavailable'
const STATE_LABEL: Record<CalState, string> = { available: 'available', pending: 'has a pending request', partial: 'partly booked', unavailable: 'unavailable' }
const WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

interface Props {
  year: number
  month: number // 0-11
  onMonthChange: (year: number, month: number) => void
  stateOf?: (key: string) => CalState
  isDisabled?: (key: string, state: CalState) => boolean
  selected?: string | null
  onSelect?: (key: string) => void
  loading?: boolean
  /** Larger cells with room for extra content (admin calendar) */
  tall?: boolean
  renderExtra?: (key: string) => ReactNode
  legend?: boolean
}

export function CalendarGrid({ year, month, onMonthChange, stateOf, isDisabled, selected, onSelect, loading, tall, renderExtra, legend = true }: Props) {
  const today = todayKey()
  const lead = weekdayMon0(year, month, 1)
  const total = daysInMonth(year, month)
  const go = (delta: number) => {
    const d = new Date(Date.UTC(year, month + delta, 1))
    onMonthChange(d.getUTCFullYear(), d.getUTCMonth())
  }

  return (
    <div className="w-full">
      <div className="mb-4 flex items-center justify-between">
        <button type="button" onClick={() => go(-1)} aria-label="Previous month" className="grid h-10 w-10 place-items-center rounded-full border border-line hover:border-accent"><ChevronLeft className="h-5 w-5" /></button>
        <p className="flex items-center gap-3 font-medium" aria-live="polite">
          <span className="h-display text-xl">{monthLabel(year, month)}</span>
          {loading && <Spinner className="h-4 w-4" />}
        </p>
        <button type="button" onClick={() => go(1)} aria-label="Next month" className="grid h-10 w-10 place-items-center rounded-full border border-line hover:border-accent"><ChevronRight className="h-5 w-5" /></button>
      </div>

      <div className="mb-1 grid grid-cols-7 gap-1.5 text-center text-xs text-muted sm:gap-2" aria-hidden>
        {WEEK.map((d) => <span key={d}>{d}</span>)}
      </div>
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {Array.from({ length: lead }, (_, i) => <span key={`b${i}`} />)}
        {Array.from({ length: total }, (_, i) => {
          const day = i + 1
          const key = dateKey(year, month, day)
          const state = stateOf?.(key) ?? 'available'
          const disabled = isDisabled?.(key, state) ?? false
          const isSelected = selected === key
          return (
            <button
              key={key}
              type="button"
              disabled={disabled}
              aria-pressed={onSelect ? isSelected : undefined}
              aria-label={`${formatDate(key)}, ${STATE_LABEL[state]}`}
              onClick={() => onSelect?.(key)}
              className={cn(
                'relative rounded-xl border text-sm transition-colors',
                tall ? 'flex min-h-[5.5rem] flex-col items-start gap-1 p-2 text-left' : 'grid aspect-square place-items-center',
                isSelected
                  ? 'border-brand bg-brand font-semibold text-on-brand'
                  : cn(
                      state === 'available' && 'border-line/70 hover:border-accent hover:bg-accent/10',
                      state === 'pending' && 'border-warn/70 bg-warn/10',
                      state === 'partial' && 'border-accent/70 bg-gradient-to-br from-accent/30 to-transparent',
                      state === 'unavailable' && 'border-danger/30 bg-danger/10 text-muted line-through',
                    ),
                key === today && !isSelected && 'ring-1 ring-accent',
                disabled && 'cursor-not-allowed opacity-40',
              )}
            >
              <span>{day}</span>
              {state === 'pending' && !isSelected && !tall && <span className="absolute bottom-1 h-1 w-1 rounded-full bg-warn" aria-hidden />}
              {renderExtra?.(key)}
            </button>
          )
        })}
      </div>

      {legend && (
        <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted" aria-label="Calendar key">
          <li className="flex items-center gap-2"><span className="h-3 w-3 rounded border border-line" />Available</li>
          <li className="flex items-center gap-2"><span className="h-3 w-3 rounded border border-warn/70 bg-warn/20" />Pending request (not reserved)</li>
          <li className="flex items-center gap-2"><span className="h-3 w-3 rounded border border-accent/70 bg-accent/30" />Partly booked</li>
          <li className="flex items-center gap-2"><span className="h-3 w-3 rounded border border-danger/40 bg-danger/20" />Unavailable</li>
        </ul>
      )}
    </div>
  )
}
