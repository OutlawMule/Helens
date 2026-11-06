'use server'

import { revalidateTag } from 'next/cache'
import { fail, friendlyDbError, getAdmin, logActivity, ok, SESSION_EXPIRED } from './guard'
import { createAdminSupabase } from '@/lib/supabase/admin'
import { hasServiceSupabase } from '@/lib/supabase/env'
import { contentSchemas, galleryMetaSchema, testimonialSchema, type ContentKey } from '@/lib/validation'
import type { ActionResult } from '@/lib/types'

export async function saveContent(key: string, value: unknown): Promise<ActionResult> {
  const admin = await getAdmin()
  if (!admin) return SESSION_EXPIRED
  if (!(key in contentSchemas)) return fail('Unknown content section.')
  const parsed = contentSchemas[key as ContentKey].safeParse(value)
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? 'Check the highlighted fields.')

  const { error } = await admin.supabase
    .from('website_content')
    .upsert({ key, value: parsed.data, is_public: true, updated_by: admin.user.id, updated_at: new Date().toISOString() })
  if (error) return fail(friendlyDbError(error))
  await logActivity(admin, 'content.update', 'website_content', key)
  revalidateTag('content')
  return ok('Saved. The public site updates within a minute.')
}

export async function setFacilityActive(id: string, active: boolean): Promise<ActionResult> {
  const admin = await getAdmin()
  if (!admin) return SESSION_EXPIRED
  const { error } = await admin.supabase.from('venue_facilities').update({ is_active: active }).eq('id', id)
  if (error) return fail(friendlyDbError(error))
  await logActivity(admin, 'facility.availability', 'venue_facility', id, { active })
  revalidateTag('facilities')
  return ok(active ? 'Facility is open for booking requests.' : 'Facility hidden from new booking requests.')
}

/* ───────── Testimonials ───────── */
export async function saveTestimonial(input: unknown): Promise<ActionResult> {
  const admin = await getAdmin()
  if (!admin) return SESSION_EXPIRED
  const parsed = testimonialSchema.safeParse(input)
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? 'Check the testimonial.')
  const v = parsed.data
  const row = { author_name: v.authorName, author_context: v.authorContext || null, quote: v.quote, is_sample: v.isSample, is_published: v.isPublished }
  const { error } = v.id ? await admin.supabase.from('testimonials').update(row).eq('id', v.id) : await admin.supabase.from('testimonials').insert(row)
  if (error) return fail(friendlyDbError(error))
  await logActivity(admin, v.id ? 'testimonial.update' : 'testimonial.create', 'testimonial', v.id ?? null)
  revalidateTag('testimonials')
  return ok('Testimonial saved.')
}

export async function deleteTestimonial(id: string): Promise<ActionResult> {
  const admin = await getAdmin()
  if (!admin) return SESSION_EXPIRED
  const { error } = await admin.supabase.from('testimonials').delete().eq('id', id)
  if (error) return fail(friendlyDbError(error))
  await logActivity(admin, 'testimonial.delete', 'testimonial', id)
  revalidateTag('testimonials')
  return ok('Testimonial deleted.')
}

/* ───────── Gallery ─────────
   Photos go browser → Supabase Storage directly with a one-time signed token, so large files never pass through
   the serverless function (Vercel limits request bodies to ~4.5 MB). */
const EXT: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/avif': 'avif' }

export async function createGalleryUpload(contentType: string): Promise<ActionResult & { path?: string; token?: string }> {
  const admin = await getAdmin()
  if (!admin) return SESSION_EXPIRED
  if (!hasServiceSupabase()) return fail('SUPABASE_SERVICE_ROLE_KEY is missing, so uploads are unavailable.')
  const ext = EXT[contentType]
  if (!ext) return fail('Use a JPEG, PNG, WebP or AVIF image.')
  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`
  const { data, error } = await createAdminSupabase().storage.from('gallery').createSignedUploadUrl(path)
  if (error || !data) return fail(`Could not start the upload: ${error?.message ?? 'unknown error'}`)
  return { ok: true, message: 'ready', path: data.path, token: data.token }
}

export async function registerGalleryImage(input: { path: string; title: string; altText: string; category: string; isPublished: boolean }): Promise<ActionResult> {
  const admin = await getAdmin()
  if (!admin) return SESSION_EXPIRED
  if (!/^[a-z0-9._-]+$/i.test(input.path)) return fail('Invalid file path.')
  const parsed = galleryMetaSchema.safeParse(input)
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? 'Check the image details.')
  const v = parsed.data
  const { data, error } = await admin.supabase
    .from('gallery_images')
    .insert({ storage_path: input.path, title: v.title, alt_text: v.altText, category: v.category, is_published: v.isPublished })
    .select('id')
  if (error) return fail(friendlyDbError(error))
  await logActivity(admin, 'gallery.create', 'gallery_image', data?.[0]?.id ?? null, { title: v.title })
  revalidateTag('gallery')
  return ok('Photo added to the gallery.')
}

export async function updateGalleryImage(id: string, input: { title: string; altText: string; category: string; isPublished: boolean }): Promise<ActionResult> {
  const admin = await getAdmin()
  if (!admin) return SESSION_EXPIRED
  const parsed = galleryMetaSchema.safeParse(input)
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? 'Check the image details.')
  const v = parsed.data
  const { error } = await admin.supabase
    .from('gallery_images')
    .update({ title: v.title, alt_text: v.altText, category: v.category, is_published: v.isPublished })
    .eq('id', id)
  if (error) return fail(friendlyDbError(error))
  await logActivity(admin, 'gallery.update', 'gallery_image', id)
  revalidateTag('gallery')
  return ok('Photo updated.')
}

export async function deleteGalleryImage(id: string): Promise<ActionResult> {
  const admin = await getAdmin()
  if (!admin) return SESSION_EXPIRED
  const { data: row } = await admin.supabase.from('gallery_images').select('storage_path').eq('id', id).maybeSingle()
  const { error } = await admin.supabase.from('gallery_images').delete().eq('id', id)
  if (error) return fail(friendlyDbError(error))
  if (row?.storage_path && hasServiceSupabase()) await createAdminSupabase().storage.from('gallery').remove([row.storage_path])
  await logActivity(admin, 'gallery.delete', 'gallery_image', id)
  revalidateTag('gallery')
  return ok('Photo deleted.')
}

/* ───────── Contact messages ───────── */
export async function setMessageStatus(id: string, status: 'new' | 'handled'): Promise<ActionResult> {
  const admin = await getAdmin()
  if (!admin) return SESSION_EXPIRED
  const { error } = await admin.supabase.from('contact_messages').update({ status }).eq('id', id)
  if (error) return fail(friendlyDbError(error))
  return ok(status === 'handled' ? 'Marked as handled.' : 'Marked as new.')
}

export async function deleteMessage(id: string): Promise<ActionResult> {
  const admin = await getAdmin()
  if (!admin) return SESSION_EXPIRED
  const { error } = await admin.supabase.from('contact_messages').delete().eq('id', id)
  if (error) return fail(friendlyDbError(error))
  await logActivity(admin, 'message.delete', 'contact_message', id)
  return ok('Message deleted.')
}
