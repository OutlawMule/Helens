import { AdminShell } from '@/components/admin/AdminShell'
import { requireAdmin } from '@/lib/actions/guard'

// Server-side authorisation for every page in the panel, on top of the middleware redirect.
export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin()
  return <AdminShell email={admin.profile.email ?? ''}>{children}</AdminShell>
}
