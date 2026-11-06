import 'server-only'
import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase/server'
import { hasPublicSupabase } from '@/lib/supabase/env'
import type { ActionResult } from '@/lib/types'

export const ok = (message: string): ActionResult => ({ ok: true, message })
export const fail = (message: string): ActionResult => ({ ok: false, message })
export const SESSION_EXPIRED = fail('Your session has expired or you are not an administrator. Please sign in again.')

export interface AdminContext {
  supabase: Awaited<ReturnType<typeof createServerSupabase>>
  user: { id: string }
  profile: { id: string; email: string | null; full_name: string | null; role: string }
}

/** Returns the signed-in administrator, or null. Every admin action and page re-checks this server-side. */
export async function getAdmin(): Promise<AdminContext | null> {
  if (!hasPublicSupabase()) return null
  const supabase = await createServerSupabase()
  const { data } = await supabase.auth.getUser()
  if (!data.user) return null
  const { data: profile } = await supabase.from('profiles').select('id, email, full_name, role').eq('id', data.user.id).maybeSingle()
  if (!profile || profile.role !== 'admin') return null
  return { supabase, user: data.user, profile }
}

export async function requireAdmin(): Promise<AdminContext> {
  const admin = await getAdmin()
  if (!admin) redirect('/admin/login')
  return admin
}

export async function logActivity(
  admin: AdminContext,
  action: string,
  entityType: string,
  entityId: string | null,
  details: Record<string, unknown> = {},
) {
  await admin.supabase
    .from('activity_logs')
    .insert({ admin_id: admin.user.id, admin_email: admin.profile.email, action, entity_type: entityType, entity_id: entityId, details })
}

export function friendlyDbError(error: { code?: string; message?: string }): string {
  const m = error.message ?? ''
  if (error.code === '23P01') return 'Conflict: another confirmed booking already uses one of these facilities at that time. Cancel or reschedule it first.'
  if (m.includes('SLOT_BLOCKED')) return 'That time falls inside a blocked or maintenance period. Remove the block first, or choose another time.'
  if (m.includes('BLOCK_CONFLICTS')) return 'A confirmed booking already exists in that period. Cancel or reschedule it before blocking the time.'
  if (m.includes('SLOT_UNAVAILABLE')) return 'That time is already reserved.'
  return `Database error: ${m || 'unknown error'}`
}
