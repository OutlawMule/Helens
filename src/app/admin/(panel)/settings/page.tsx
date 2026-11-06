import { BookingSettingsForm, ContactInfoForm, FacilityToggles, HoursForm } from '@/components/admin/forms'
import { AdminCard } from '@/components/admin/ui'
import { requireAdmin } from '@/lib/actions/guard'
import { getSiteContent } from '@/lib/content'

export const metadata = { title: 'Settings' }

export default async function AdminSettingsPage() {
  const { supabase } = await requireAdmin()
  const [content, facilities] = await Promise.all([getSiteContent(), supabase.from('venue_facilities').select('id, name, is_active').order('sort_order')])
  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="h-display text-3xl sm:text-4xl">Settings</h1>
        <p className="mt-1 text-muted">Business details, booking rules, operating hours and venue availability.</p>
      </div>
      <AdminCard title="Business contact information"><ContactInfoForm initial={{ ...content.contact }} /></AdminCard>
      <AdminCard title="Booking availability and approval"><BookingSettingsForm initial={content.booking} /></AdminCard>
      <AdminCard title="Operating hours"><HoursForm initial={content.hours} /></AdminCard>
      <AdminCard title="Venue availability">
        <p className="mb-3 text-sm text-muted">Closing a facility hides it from new booking requests. Existing bookings are not affected. To make dates or times unavailable, use the Calendar.</p>
        <FacilityToggles facilities={(facilities.data ?? []) as { id: string; name: string; is_active: boolean }[]} />
      </AdminCard>
    </div>
  )
}
