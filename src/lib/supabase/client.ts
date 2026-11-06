import { createBrowserClient } from '@supabase/ssr'

/** Browser client (anon key). Only used for direct-to-Storage uploads with a server-issued signed token. */
export function createBrowserSupabase() {
  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
}
