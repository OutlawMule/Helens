'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'

export interface BookingDraft {
  eventType?: string
  guests?: number | null
  facilities?: string[]
  eventDate?: string
  startTime?: string
  endTime?: string
  fullName?: string
  email?: string
  phone?: string
  notes?: string
  step?: number
}

const KEY = 'hh-booking-draft'
interface DraftStore {
  ready: boolean
  get: () => BookingDraft
  save: (patch: BookingDraft) => void
  clear: () => void
}
const DraftContext = createContext<DraftStore | null>(null)

/**
 * Keeps the in-progress booking alive across version switches, page navigation and reloads.
 * It lives above the theme-specific UI and stores a plain ref (no re-render per keystroke) mirrored to sessionStorage,
 * so the draft disappears when the tab closes and is never left behind on a shared computer.
 */
export function BookingDraftProvider({ children }: { children: ReactNode }) {
  const draft = useRef<BookingDraft>({})
  const [ready, setReady] = useState(false)

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(KEY)
      if (raw) draft.current = JSON.parse(raw) as BookingDraft
    } catch {
      // ignore unreadable drafts
    }
    setReady(true)
  }, [])

  const save = useCallback((patch: BookingDraft) => {
    draft.current = { ...draft.current, ...patch }
    try {
      sessionStorage.setItem(KEY, JSON.stringify(draft.current))
    } catch {
      // storage unavailable: progress still survives theme switches via the ref
    }
  }, [])
  const clear = useCallback(() => {
    draft.current = {}
    try {
      sessionStorage.removeItem(KEY)
    } catch {
      // ignore
    }
  }, [])
  const get = useCallback(() => draft.current, [])
  const value = useMemo(() => ({ ready, get, save, clear }), [ready, get, save, clear])
  return <DraftContext.Provider value={value}>{children}</DraftContext.Provider>
}

export function useBookingDraft(): DraftStore {
  const ctx = useContext(DraftContext)
  if (!ctx) throw new Error('useBookingDraft must be used inside BookingDraftProvider')
  return ctx
}
