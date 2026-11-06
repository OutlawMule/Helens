import Link from 'next/link'
import { Flower2, Mail, MapPin, MessageCircle, Phone } from 'lucide-react'
import { VersionSelector } from '@/components/theme/VersionSelector'
import { DIRECTIONS_URL, telHref } from '@/lib/business'
import type { ContactContent } from '@/lib/content-defaults'

const EXPLORE = [
  { href: '/about', label: 'About' },
  { href: '/venue', label: 'Venue & Events' },
  { href: '/amenities', label: 'Amenities' },
  { href: '/gallery', label: 'Gallery' },
  { href: '/bookings', label: 'Request a booking' },
  { href: '/bookings/manage', label: 'Manage a booking' },
  { href: '/contact', label: 'Contact' },
]

export function Footer({ contact }: { contact: ContactContent }) {
  const link = 'transition-colors hover:text-accent'
  return (
    <footer className="relative overflow-hidden border-t border-white/10" style={{ background: 'rgb(var(--footer-bg))', color: 'rgb(var(--footer-ink))' }}>
      <div className="container-x grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-accent text-on-accent"><Flower2 className="h-5 w-5" aria-hidden /></span>
            <span className="h-display text-2xl text-white">Helens Haven</span>
          </div>
          <p className="mt-5 max-w-xs text-sm leading-relaxed opacity-80">An event centre, garden and flower nursery in Lusaka West, Zambia.</p>
          <div className="mt-6">
            <p className="mb-2 text-sm opacity-70">Website version</p>
            <VersionSelector />
          </div>
        </div>

        <nav aria-label="Footer">
          <h2 className="h-display mb-4 text-xl text-white">Explore</h2>
          <ul className="space-y-2.5 text-sm">
            {EXPLORE.map((l) => (
              <li key={l.href}><Link href={l.href} className={link}>{l.label}</Link></li>
            ))}
          </ul>
        </nav>

        <div>
          <h2 className="h-display mb-4 text-xl text-white">Visit</h2>
          <address className="flex gap-3 text-sm not-italic leading-relaxed">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden />
            <span>{contact.addressLine1}<br />{contact.addressLine2}</span>
          </address>
          <a href={DIRECTIONS_URL} target="_blank" rel="noopener noreferrer" className={`mt-4 inline-block text-sm underline underline-offset-4 ${link}`}>Get directions</a>
        </div>

        <div>
          <h2 className="h-display mb-4 text-xl text-white">Contact</h2>
          <ul className="space-y-3 text-sm">
            <li><a href={telHref(contact.phone)} className={`flex items-center gap-3 ${link}`}><Phone className="h-4 w-4 text-accent" aria-hidden />{contact.phone}</a></li>
            <li><a href={contact.whatsapp} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-3 ${link}`}><MessageCircle className="h-4 w-4 text-accent" aria-hidden />WhatsApp</a></li>
            <li><a href={`mailto:${contact.email}`} className={`flex items-center gap-3 break-all ${link}`}><Mail className="h-4 w-4 shrink-0 text-accent" aria-hidden />{contact.email}</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-x flex flex-col gap-2 py-6 text-xs opacity-70 sm:flex-row sm:justify-between">
          <p>© {new Date().getFullYear()} Helens Haven. All rights reserved.</p>
          <p>Illustrations on this site are placeholder artwork until real photographs are uploaded.</p>
        </div>
      </div>
    </footer>
  )
}
