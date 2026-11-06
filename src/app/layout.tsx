import type { Metadata, Viewport } from 'next'
import { Fraunces, Jost, Syne } from 'next/font/google'
import './globals.css'

// Original Garden: Fraunces (warm, slightly wonky serif) · Space Garden: Syne (wide, sculptural) · both: Jost for text.
const fraunces = Fraunces({ subsets: ['latin'], style: ['normal', 'italic'], variable: '--font-fraunces', display: 'swap' })
const jost = Jost({ subsets: ['latin'], variable: '--font-jost', display: 'swap' })
const syne = Syne({ subsets: ['latin'], weight: ['500', '600', '700'], variable: '--font-syne', display: 'swap' })

function siteUrl(): URL {
  try {
    return new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000')
  } catch {
    return new URL('http://localhost:3000')
  }
}

export const metadata: Metadata = {
  metadataBase: siteUrl(),
  title: { default: 'Helens Haven | Event centre and garden in Lusaka West', template: '%s | Helens Haven' },
  description:
    'Helens Haven is an event centre, garden and flower nursery in Lusaka West, Zambia, with a 40m × 40m open arena, swimming pool, fire pit lounge, pub and restaurant.',
  openGraph: { title: 'Helens Haven', description: 'Weddings, celebrations, corporate events and concerts in a garden setting in Lusaka West.', type: 'website' },
}
export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#163e2e' }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${jost.variable} ${syne.variable}`}>
      <body className="font-body antialiased">{children}</body>
    </html>
  )
}
