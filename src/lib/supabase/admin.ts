import 'server-only'
import { createClient } from '@supabase/supabase-js'

/**
 * Service-role client. Bypasses Row Level Security, so it is only used inside server-side code that has
 * already validated its input (public booking submission, availability, lookup, signed upload URLs).
 * The key never reaches the browser.
 */
export function createAdminSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase service role is not configured')
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}
