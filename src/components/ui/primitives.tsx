'use client'

import Link from 'next/link'
import { motion, useReducedMotion } from 'framer-motion'
import type { ComponentProps, ReactNode } from 'react'
import { EASE } from '@/lib/theme'
import { Scene } from '@/components/theme/Scene'
import { cn } from '@/lib/utils'
import type { SceneKind } from '@/lib/constants'

/** Gentle fade-in as a block scrolls into view. Used on a few key blocks, not on everything. */
export function Reveal({ children, delay = 0, y = 14, className }: { children: ReactNode; delay?: number; y?: number; className?: string }) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.8, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  )
}

export function Section({ id, alt, className, children }: { id?: string; alt?: boolean; className?: string; children: ReactNode }) {
  return (
    <section id={id} className={cn('relative scroll-mt-24 py-20 sm:py-28', alt && 'bg-bg-alt/70', className)}>
      <div className="container-x">{children}</div>
    </section>
  )
}

export function Heading({ title, intro, eyebrow, center, className }: { title: string; intro?: string; eyebrow?: string; center?: boolean; className?: string }) {
  return (
    <div className={cn('max-w-3xl', center && 'mx-auto text-center', className)}>
      {eyebrow && <p className={cn('eyebrow mb-4', center && 'justify-center')}>{eyebrow}</p>}
      <h2 className="h-display text-4xl sm:text-5xl">{title}</h2>
      {intro && <p className={cn('lead mt-5', center && 'mx-auto')}>{intro}</p>}
    </div>
  )
}

// Literal class names so Tailwind's scanner keeps these component classes (it cannot see `btn-${variant}`).
const VARIANT_CLASS = { primary: 'btn-primary', gold: 'btn-gold', ghost: 'btn-ghost', light: 'btn-light' } as const

type LinkButtonProps = Omit<ComponentProps<typeof Link>, 'className'> & { variant?: 'primary' | 'gold' | 'ghost' | 'light'; small?: boolean; className?: string }
/** Internal links use next/link; http(s), tel:, mailto: and wa.me links render a plain anchor. */
export function ButtonLink({ variant = 'primary', small, className, href, children, ...rest }: LinkButtonProps) {
  const cls = cn('btn', VARIANT_CLASS[variant], small && 'btn-sm', className)
  const url = typeof href === 'string' ? href : (href.pathname ?? '/')
  if (/^(https?:|tel:|mailto:)/.test(url)) {
    const external = url.startsWith('http')
    return (
      <a href={url} className={cls} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
        {children}
      </a>
    )
  }
  return (
    <Link href={href} className={cls} {...rest}>
      {children}
    </Link>
  )
}

/** Dark, atmospheric header used at the top of every inner page. */
export function PageHero({ title, intro, scene }: { title: string; intro: string; scene: SceneKind }) {
  const reduce = useReducedMotion()
  return (
    <header className="relative isolate overflow-hidden pb-20 pt-40 text-white sm:pb-28 sm:pt-52">
      <div className="absolute inset-0 -z-10">
        <Scene kind={scene} />
        <div className="absolute inset-0" style={{ background: 'var(--header-overlay)' }} />
      </div>
      <div className="container-x max-w-4xl">
        <motion.h1
          className="h-display text-5xl sm:text-7xl"
          initial={reduce ? false : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: EASE }}
        >
          {title}
        </motion.h1>
        <motion.p
          className="mt-6 max-w-2xl text-lg leading-relaxed text-white/85"
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.9, delay: 0.25 }}
        >
          {intro}
        </motion.p>
      </div>
    </header>
  )
}

/** Labelled input wrappers keep every form accessible: label, error message and aria wiring in one place. */
interface FieldProps {
  id: string
  label: string
  error?: string
  hint?: string
  className?: string
}
const describedBy = (id: string, error?: string, hint?: string) => [error && `${id}-error`, hint && `${id}-hint`].filter(Boolean).join(' ') || undefined

export function TextField({ id, label, error, hint, className, ...input }: FieldProps & Omit<ComponentProps<'input'>, 'id'>) {
  return (
    <div className={className}>
      <label htmlFor={id} className="label">{label}</label>
      <input id={id} className="input" aria-invalid={error ? true : undefined} aria-describedby={describedBy(id, error, hint)} {...input} />
      {hint && !error && <p id={`${id}-hint`} className="mt-1.5 text-sm text-muted">{hint}</p>}
      {error && <p id={`${id}-error`} role="alert" className="field-error">{error}</p>}
    </div>
  )
}
export function AreaField({ id, label, error, hint, className, ...input }: FieldProps & Omit<ComponentProps<'textarea'>, 'id'>) {
  return (
    <div className={className}>
      <label htmlFor={id} className="label">{label}</label>
      <textarea id={id} rows={4} className="input resize-y" aria-invalid={error ? true : undefined} aria-describedby={describedBy(id, error, hint)} {...input} />
      {hint && !error && <p id={`${id}-hint`} className="mt-1.5 text-sm text-muted">{hint}</p>}
      {error && <p id={`${id}-error`} role="alert" className="field-error">{error}</p>}
    </div>
  )
}
export function SelectField({ id, label, error, hint, className, children, ...input }: FieldProps & Omit<ComponentProps<'select'>, 'id'>) {
  return (
    <div className={className}>
      <label htmlFor={id} className="label">{label}</label>
      <select id={id} className="input" aria-invalid={error ? true : undefined} aria-describedby={describedBy(id, error, hint)} {...input}>
        {children}
      </select>
      {hint && !error && <p id={`${id}-hint`} className="mt-1.5 text-sm text-muted">{hint}</p>}
      {error && <p id={`${id}-error`} role="alert" className="field-error">{error}</p>}
    </div>
  )
}

export function Notice({ tone = 'info', children, className }: { tone?: 'info' | 'warn' | 'danger' | 'ok'; children: ReactNode; className?: string }) {
  const tones = { info: 'border-l-azure', warn: 'border-l-warn', danger: 'border-l-danger', ok: 'border-l-ok' }
  return (
    <div role={tone === 'danger' ? 'alert' : 'status'} className={cn('rounded-xl border border-l-4 border-line bg-surface/70 px-4 py-3 text-sm leading-relaxed text-ink', tones[tone], className)}>
      {children}
    </div>
  )
}

export function Spinner({ className }: { className?: string }) {
  return <span role="status" aria-label="Loading" className={cn('inline-block h-5 w-5 animate-spin rounded-full border-2 border-accent/30 border-t-accent', className)} />
}
