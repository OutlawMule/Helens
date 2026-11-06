import 'server-only'
import { unstable_cache } from 'next/cache'
import { createPublicSupabase } from './supabase/public'
import { DEFAULT_CONTENT, DEFAULT_FACILITIES, DEFAULT_TESTIMONIALS, mergeContent, type SiteContent } from './content-defaults'
import type { GalleryRow, TestimonialRow } from './types'

/** Public, cacheable reads. Admin mutations call revalidateTag() so edits appear immediately. */
export const getSiteContent = unstable_cache(
  async (): Promise<SiteContent> => {
    const db = createPublicSupabase()
    if (!db) return structuredClone(DEFAULT_CONTENT)
    const { data } = await db.from('website_content').select('key, value').eq('is_public', true)
    return mergeContent((data ?? []) as { key: string; value: unknown }[])
  },
  ['site-content'],
  { revalidate: 60, tags: ['content'] },
)

export interface PublicGalleryItem { id: string; url: string; title: string; alt: string; category: string }

export const getGallery = unstable_cache(
  async (): Promise<PublicGalleryItem[]> => {
    const db = createPublicSupabase()
    if (!db) return []
    const { data } = await db.from('gallery_images').select('*').eq('is_published', true).order('sort_order').order('created_at', { ascending: false })
    const base = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/gallery/`
    return ((data ?? []) as GalleryRow[]).map((g) => ({ id: g.id, url: base + g.storage_path, title: g.title, alt: g.alt_text, category: g.category }))
  },
  ['gallery'],
  { revalidate: 60, tags: ['gallery'] },
)

export const getTestimonials = unstable_cache(
  async (): Promise<TestimonialRow[]> => {
    const db = createPublicSupabase()
    if (!db) return DEFAULT_TESTIMONIALS
    const { data } = await db.from('testimonials').select('*').eq('is_published', true).order('sort_order').order('created_at')
    return (data ?? []) as TestimonialRow[]
  },
  ['testimonials'],
  { revalidate: 60, tags: ['testimonials'] },
)

export const getFacilities = unstable_cache(
  async (): Promise<{ id: string; slug: string; name: string }[]> => {
    const db = createPublicSupabase()
    if (!db) return DEFAULT_FACILITIES
    const { data } = await db.from('venue_facilities').select('id, slug, name').eq('is_active', true).order('sort_order')
    return (data as { id: string; slug: string; name: string }[] | null) ?? DEFAULT_FACILITIES
  },
  ['facilities'],
  { revalidate: 60, tags: ['facilities'] },
)
