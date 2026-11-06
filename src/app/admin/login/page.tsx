import { Flower2 } from 'lucide-react'
import { redirect } from 'next/navigation'
import { LoginForm } from '@/components/admin/LoginForm'
import { Notice } from '@/components/ui/primitives'
import { getAdmin } from '@/lib/actions/guard'
import { hasPublicSupabase } from '@/lib/supabase/env'

export const metadata = { title: 'Sign in' }

export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams
  if (await getAdmin()) redirect('/admin')
  const next = typeof sp.next === 'string' && sp.next.startsWith('/admin') && !sp.next.startsWith('//') ? sp.next : '/admin'
  return (
    <div className="grid min-h-screen place-items-center px-5 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-brand text-on-brand"><Flower2 className="h-7 w-7" aria-hidden /></span>
          <h1 className="h-display mt-4 text-3xl">Helens Haven admin</h1>
          <p className="mt-1 text-sm text-muted">Authorised staff only</p>
        </div>
        <div className="card p-6 sm:p-8">
          {hasPublicSupabase() ? <LoginForm next={next} /> : (
            <Notice tone="warn">Supabase is not configured yet. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (see the README), then restart.</Notice>
          )}
        </div>
      </div>
    </div>
  )
}
