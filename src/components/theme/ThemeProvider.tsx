'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { AnimatePresence, MotionConfig, motion, useReducedMotion } from 'framer-motion'
import { EASE, THEME_KEY, isTheme, type Theme } from '@/lib/theme'


interface ThemeContextValue {
  theme: Theme
  setTheme: (next: Theme, origin?: { x: number; y: number }) => void
}
const ThemeContext = createContext<ThemeContextValue>({ theme: 'garden', setTheme: () => {} })
export const useTheme = () => useContext(ThemeContext)

function persist(t: Theme) {
  try {
    localStorage.setItem(THEME_KEY, t)
  } catch {
    // storage can be blocked (private mode); the cookie below still works
  }
  document.cookie = `${THEME_KEY}=${t}; Path=/; Max-Age=31536000; SameSite=Lax`
}

/**
 * Holds the visitor's chosen version. The server reads the cookie so the first paint already has the right
 * theme; switching is a pure client-side state change, so the page, scroll position and any booking progress stay put.
 */
export function ThemeProvider({ initialTheme, children }: { initialTheme: Theme; children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(initialTheme)
  const [wipe, setWipe] = useState<{ to: Theme; x: number; y: number; r: number } | null>(null)
  const reduce = useReducedMotion()
  const timers = useRef<number[]>([])
  const busy = useRef(false)

  useEffect(() => {
    // The cookie may be missing while localStorage remembers a choice (cleared cookies, older visit).
    try {
      const saved = localStorage.getItem(THEME_KEY)
      if (isTheme(saved) && saved !== initialTheme) {
        setThemeState(saved)
        persist(saved)
      }
    } catch {
      // ignore
    }
    const pending = timers.current
    return () => pending.forEach((id) => window.clearTimeout(id))
  }, [initialTheme])

  useEffect(() => {
    const el = document.documentElement
    el.style.backgroundColor = theme === 'space' ? 'rgb(8 5 22)' : 'rgb(250 247 240)'
    return () => {
      el.style.backgroundColor = ''
    }
  }, [theme])

  const setTheme = useCallback(
    (next: Theme, origin?: { x: number; y: number }) => {
      if (busy.current || next === theme) return
      const commit = () => {
        setThemeState(next)
        persist(next)
      }
      if (reduce) return commit()
      busy.current = true
      const x = origin?.x ?? window.innerWidth / 2
      const y = origin?.y ?? 64
      const r = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y))
      setWipe({ to: next, x, y, r })
      timers.current.push(
        window.setTimeout(commit, 650),
        window.setTimeout(() => {
          setWipe(null)
          busy.current = false
        }, 950),
      )
    },
    [theme, reduce],
  )

  const value = useMemo(() => ({ theme, setTheme }), [theme, setTheme])

  return (
    <ThemeContext.Provider value={value}>
      <MotionConfig reducedMotion="user">
        <div data-theme={theme} className="relative isolate min-h-screen bg-bg text-ink">
          {children}
        </div>
        <AnimatePresence>
          {wipe && (
            <motion.div
              key={wipe.to}
              aria-hidden
              className="pointer-events-none fixed inset-0 z-[100]"
              style={{
                background:
                  wipe.to === 'space'
                    ? 'radial-gradient(circle at 50% 40%, #3b1d7a 0%, #120a30 55%, #080516 100%)'
                    : 'radial-gradient(circle at 50% 40%, #f6ecd0 0%, #cfe3c4 50%, #163e2e 130%)',
              }}
              initial={{ clipPath: `circle(0px at ${wipe.x}px ${wipe.y}px)` }}
              animate={{ clipPath: `circle(${wipe.r}px at ${wipe.x}px ${wipe.y}px)` }}
              exit={{ opacity: 0, transition: { duration: 0.5 } }}
              transition={{ duration: 0.7, ease: EASE }}
            />
          )}
        </AnimatePresence>
      </MotionConfig>
    </ThemeContext.Provider>
  )
}
