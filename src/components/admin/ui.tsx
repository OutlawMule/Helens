'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition, type ReactNode } from 'react'
import { Notice } from '@/components/ui/primitives'
import { cn } from '@/lib/utils'
import type { ActionResult } from '@/lib/types'

/** Runs a server action, tracks pending/result state and refreshes the page data on success. */
export function useAction() {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [msg, setMsg] = useState<ActionResult | null>(null)
  const run = (fn: () => Promise<ActionResult>, opts?: { refresh?: boolean; onDone?: (r: ActionResult) => void }) => {
    setMsg(null)
    start(async () => {
      let r: ActionResult
      try {
        r = await fn()
      } catch {
        r = { ok: false, message: 'Something went wrong talking to the server. Please try again.' }
      }
      setMsg(r)
      if (r.ok && opts?.refresh !== false) router.refresh()
      opts?.onDone?.(r)
    })
  }
  return { pending, msg, run, clear: () => setMsg(null) }
}

export function ActionMessage({ msg }: { msg: ActionResult | null }) {
  if (!msg) return null
  return <Notice tone={msg.ok ? 'ok' : 'danger'} className="mt-4">{msg.message}</Notice>
}

export function AdminCard({ title, action, children, className }: { title?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn('card p-5 sm:p-6', className)}>
      {(title || action) && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          {title && <h2 className="h-display text-xl">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  )
}

export function StatCard({ label, value, hint, tone }: { label: string; value: number | string; hint?: string; tone?: 'warn' | 'ok' | 'info' }) {
  const color = tone === 'warn' ? 'text-warn' : tone === 'ok' ? 'text-ok' : tone === 'info' ? 'text-azure' : 'text-brand'
  return (
    <div className="card p-5">
      <p className="text-sm text-muted">{label}</p>
      <p className={cn('h-display mt-2 text-4xl', color)}>{value}</p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  )
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <p className="rounded-xl border border-dashed border-line px-4 py-8 text-center text-sm text-muted">{children}</p>
}
