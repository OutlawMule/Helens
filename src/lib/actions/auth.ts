'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createServerSupabase } from '@/lib/supabase/server'
import { hasPublicSupabase } from '@/lib/supabase/env'

export interface LoginState { error?: string }

const loginSchema = z.object({ email: z.string().trim().email(), password: z.string().min(1) })

export async function signIn(_prev: LoginState, formData: FormData): Promise<LoginState> {
  if (!hasPublicSupabase()) return { error: 'Supabase is not configured yet. Add the environment variables first.' }
  const parsed = loginSchema.safeParse({ email: formData.get('email'), password: formData.get('password') })
  if (!parsed.success) return { error: 'Enter your email and password.' }

  const supabase = await createServerSupabase()
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data)
  if (error || !data.user) return { error: 'Those details did not match an account.' }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.user.id).maybeSingle()
  if (!profile || profile.role !== 'admin') {
    await supabase.auth.signOut()
    return { error: 'This account does not have administrator access.' }
  }
  const next = String(formData.get('next') ?? '')
  redirect(next.startsWith('/admin') && !next.startsWith('//') ? next : '/admin')
}

export async function signOut() {
  const supabase = await createServerSupabase()
  await supabase.auth.signOut()
  redirect('/admin/login')
}
