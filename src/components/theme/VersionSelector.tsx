'use client'

import { useId } from 'react'
import { motion } from 'framer-motion'
import { Leaf, Orbit } from 'lucide-react'
import { useTheme } from './ThemeProvider'
import type { Theme } from '@/lib/theme'
import { cn } from '@/lib/utils'

const OPTIONS: { id: Theme; label: string; Icon: typeof Leaf }[] = [
  { id: 'garden', label: 'Original Garden', Icon: Leaf },
  { id: 'space', label: 'Space Garden', Icon: Orbit },
]

/** Persistent version switch. `compact` hides the labels (icons only) for the mobile header. */
export function VersionSelector({ compact = false, className }: { compact?: boolean; className?: string }) {
  const { theme, setTheme } = useTheme()
  const uid = useId()
  return (
    <div role="group" aria-label="Website version" className={cn('relative inline-flex rounded-full border border-line/70 bg-surface/25 p-1 backdrop-blur', className)}>
      {OPTIONS.map(({ id, label, Icon }) => {
        const active = theme === id
        return (
          <button
            key={id}
            type="button"
            aria-pressed={active}
            title={label}
            onClick={(e) => {
              const r = e.currentTarget.getBoundingClientRect()
              setTheme(id, { x: r.left + r.width / 2, y: r.top + r.height / 2 })
            }}
            className={cn('relative flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition-opacity', active ? 'text-on-accent' : 'opacity-80 hover:opacity-100')}
          >
            {active && <motion.span layoutId={`version-pill-${uid}`} className="absolute inset-0 rounded-full bg-accent" transition={{ type: 'spring', stiffness: 380, damping: 32 }} />}
            <Icon className="relative h-4 w-4" aria-hidden />
            <span className={cn('relative whitespace-nowrap', compact && 'sr-only')}>{label}</span>
          </button>
        )
      })}
    </div>
  )
}
