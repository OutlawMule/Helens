import { MessagesList } from '@/components/admin/MessagesList'
import { requireAdmin } from '@/lib/actions/guard'
import type { MessageRow } from '@/lib/types'

export const metadata = { title: 'Messages' }

export default async function AdminMessagesPage() {
  const { supabase } = await requireAdmin()
  const { data } = await supabase.from('contact_messages').select('*').order('created_at', { ascending: false }).limit(100)
  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="h-display text-3xl sm:text-4xl">Messages</h1>
        <p className="mt-1 text-muted">Messages sent through the website’s contact form.</p>
      </div>
      <MessagesList messages={(data ?? []) as MessageRow[]} />
    </div>
  )
}
