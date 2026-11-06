'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, type ReactNode } from 'react'
import { CalendarDays, ClipboardList, Flower2, Images, Inbox, LayoutDashboard, LogOut, Menu, Settings, X } from 'lucide-react'
import { signOut } from '@/lib/actions/auth'
import { cn } from '@/lib/utils'

const NAV = [
  { href: '/admin', label: 'Dashboard', Icon: LayoutDashboard },
  { href: '/admin/bookings', label: 'Bookings', Icon: ClipboardList },
  { href: '/admin/calendar', label: 'Calendar', Icon: CalendarDays },
  { href: '/admin/content', label: 'Website content', Icon: Images },
  { href: '/admin/messages', label: 'Messages', Icon: Inbox },
  { href: '/admin/settings', label: 'Settings', Icon: Settings },
]

export function AdminShell({ email, children }: { email: string; children: ReactNode }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const active = (href: string) => (href === '/admin' ? pathname === '/admin' : pathname.startsWith(href))

  const sidebar = (
    <div className="flex h-full flex-col bg-[rgb(16_46_34)] px-4 py-6 text-[rgb(232_226_208)]">
      <Link href="/admin" className="mb-8 flex items-center gap-3 px-2">
        <span className="grid h-9 w-9 place-items-center rounded-full bg-accent text-on-accent"><Flower2 className="h-5 w-5" aria-hidden /></span>
        <span className="h-display text-xl text-white">Helens Haven<span className="block text-xs font-normal text-white/60">Admin</span></span>
      </Link>
      <nav aria-label="Admin" className="flex-1 space-y-1">
        {NAV.map(({ href, label, Icon }) => (
          <Link key={href} href={href} onClick={() => setOpen(false)} aria-current={active(href) ? 'page' : undefined}
            className={cn('flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors', active(href) ? 'bg-white/15 text-white' : 'hover:bg-white/10')}>
            <Icon className="h-4 w-4" aria-hidden />{label}
          </Link>
        ))}
      </nav>
      <div className="border-t border-white/10 pt-4 text-sm">
        <p className="mb-3 truncate px-2 text-white/70" title={email}>{email}</p>
        <Link href="/" target="_blank" className="mb-1 block rounded-lg px-3 py-2 hover:bg-white/10">View website</Link>
        <form action={signOut}>
          <button type="submit" className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-white/10"><LogOut className="h-4 w-4" aria-hidden />Sign out</button>
        </form>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[16rem_1fr]">
      <aside className="sticky top-0 hidden h-screen lg:block">{sidebar}</aside>
      <div className="flex items-center justify-between bg-[rgb(16_46_34)] px-4 py-3 text-white lg:hidden">
        <span className="h-display text-lg">Helens Haven Admin</span>
        <button type="button" aria-label="Open admin menu" aria-expanded={open} onClick={() => setOpen(true)} className="grid h-10 w-10 place-items-center rounded-lg bg-white/10"><Menu className="h-5 w-5" /></button>
      </div>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Admin menu">
          <button type="button" aria-label="Close admin menu" className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72">
            {sidebar}
            <button type="button" aria-label="Close" onClick={() => setOpen(false)} className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-lg bg-white/10 text-white"><X className="h-5 w-5" /></button>
          </div>
        </div>
      )}
      <main id="admin-main" className="min-w-0 px-4 py-8 sm:px-8 lg:px-10">{children}</main>
    </div>
  )
}
