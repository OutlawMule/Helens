import 'server-only'
import { createClient } from '@supabase/supabase-js'

/** Cookie-less anon client for cacheable public reads (published content only; RLS enforces this). */
export function createPublicSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}
