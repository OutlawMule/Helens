import { cookies } from 'next/headers'
import { ThemeProvider } from '@/components/theme/ThemeProvider'
import { Atmosphere } from '@/components/theme/Atmosphere'
import { BookingDraftProvider } from '@/components/booking/BookingDraftProvider'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { FloatingWhatsApp } from '@/components/layout/FloatingWhatsApp'
import { getSiteContent } from '@/lib/content'
import { THEME_KEY, type Theme } from '@/lib/theme'

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  // The version cookie lets the server render the visitor's chosen version on first paint (no flash).
  // First-time visitors have no cookie and always get the Original Garden.
  const jar = await cookies()
  const initialTheme: Theme = jar.get(THEME_KEY)?.value === 'space' ? 'space' : 'garden'
  const { contact } = await getSiteContent()

  return (
    <ThemeProvider initialTheme={initialTheme}>
      <BookingDraftProvider>
        <Atmosphere />
        <a href="#main" className="skip-link">Skip to content</a>
        <Navbar contact={contact} />
        <main id="main">{children}</main>
        <Footer contact={contact} />
        <FloatingWhatsApp href={contact.whatsapp} />
      </BookingDraftProvider>
    </ThemeProvider>
  )
}
