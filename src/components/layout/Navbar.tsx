'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Flower2, Menu, MessageCircle, Phone, X } from 'lucide-react'
import { VersionSelector } from '@/components/theme/VersionSelector'
import { useTheme } from '@/components/theme/ThemeProvider'
import { ButtonLink } from '@/components/ui/primitives'
import { EASE } from '@/lib/theme'
import { telHref } from '@/lib/business'
import { cn } from '@/lib/utils'

const LINKS = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/venue', label: 'Venue & Events' },
  { href: '/amenities', label: 'Amenities' },
  { href: '/gallery', label: 'Gallery' },
  { href: '/contact', label: 'Contact' },
]

// Routes that open with a dark hero/header, where the transparent white navbar is legible. Everywhere else it is solid.
const HERO_ROUTES = ['/', '/about', '/venue', '/amenities', '/gallery', '/bookings', '/bookings/manage', '/contact']

export function Navbar({ contact }: { contact: { phone: string; whatsapp: string } }) {
  const pathname = usePathname()
  const { theme } = useTheme()
  const space = theme === 'space'
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  useEffect(() => setOpen(false), [pathname])
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  const solid = scrolled || open || !HERO_ROUTES.includes(pathname)
  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href))

  return (
    <>
      <header className={cn('fixed inset-x-0 top-0 z-50', space && 'px-3 pt-3 sm:px-6')}>
        <div
          className={cn(
            'mx-auto flex items-center justify-between gap-4 transition-all duration-500',
            space
              ? 'max-w-6xl rounded-2xl border border-white/10 bg-[color:var(--nav-solid)] px-4 py-2.5 text-ink backdrop-blur-xl'
              : cn('px-5 sm:px-8 lg:px-12', solid ? 'border-b border-line/60 bg-[color:var(--nav-solid)] py-3 text-ink backdrop-blur-md' : 'py-5 text-white'),
          )}
          style={space ? { boxShadow: '0 0 40px -14px rgb(94 255 168 / .35)' } : undefined}
        >
          <Link href="/" className="flex items-center gap-3" aria-label="Helens Haven, home">
            <span className={cn('grid h-10 w-10 place-items-center rounded-full', space ? 'bg-brand/15 text-brand ring-1 ring-brand/40' : 'bg-accent text-on-accent')}>
              <Flower2 className="h-5 w-5" aria-hidden />
            </span>
            <span className="h-display text-2xl">Helens Haven</span>
          </Link>

          <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                aria-current={isActive(l.href) ? 'page' : undefined}
                className={cn('relative rounded-full px-3 py-2 text-sm font-medium transition-opacity', isActive(l.href) ? 'opacity-100' : 'opacity-75 hover:opacity-100')}
              >
                {l.label}
                {isActive(l.href) && <motion.span layoutId="nav-active" className={cn('absolute inset-x-3 -bottom-0.5 h-0.5 rounded-full', space ? 'bg-brand' : 'bg-accent')} />}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            <VersionSelector />
            <ButtonLink href="/bookings" small>Book your date</ButtonLink>
          </div>

          <div className="flex items-center gap-2 lg:hidden">
            <VersionSelector compact />
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? 'Close menu' : 'Open menu'}
              className="grid h-11 w-11 place-items-center rounded-full border border-line/70 bg-surface/25 backdrop-blur"
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            className="fixed inset-0 z-40 overflow-y-auto bg-bg px-6 pb-10 pt-28 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <nav aria-label="Mobile" className="flex flex-col">
              {[...LINKS, { href: '/bookings', label: 'Bookings' }].map((l, i) => (
                <motion.div key={l.href} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 * i, duration: 0.5, ease: EASE }}>
                  <Link href={l.href} aria-current={isActive(l.href) ? 'page' : undefined} className={cn('h-display block border-b border-line/50 py-4 text-3xl', isActive(l.href) ? 'text-accent-ink' : 'text-ink')}>
                    {l.label}
                  </Link>
                </motion.div>
              ))}
            </nav>
            <div className="mt-8">
              <p className="mb-2 text-sm text-muted">Choose your version of the website</p>
              <VersionSelector className="w-full justify-between [&>button]:flex-1 [&>button]:justify-center" />
            </div>
            <div className="mt-8 grid grid-cols-2 gap-3">
              <ButtonLink href={telHref(contact.phone)} variant="ghost"><Phone className="h-4 w-4" aria-hidden />Call us</ButtonLink>
              <ButtonLink href={contact.whatsapp} variant="ghost"><MessageCircle className="h-4 w-4" aria-hidden />WhatsApp</ButtonLink>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
