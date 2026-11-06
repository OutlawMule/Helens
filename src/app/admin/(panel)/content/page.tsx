import { ContentManager } from '@/components/admin/ContentManager'
import type { AdminGalleryItem } from '@/components/admin/GalleryManager'
import { requireAdmin } from '@/lib/actions/guard'
import { getSiteContent } from '@/lib/content'
import { hasServiceSupabase } from '@/lib/supabase/env'
import type { GalleryRow, TestimonialRow } from '@/lib/types'

export const metadata = { title: 'Website content' }

export default async function AdminContentPage() {
  const { supabase } = await requireAdmin()
  const [content, g, t] = await Promise.all([
    getSiteContent(),
    supabase.from('gallery_images').select('*').order('created_at', { ascending: false }),
    supabase.from('testimonials').select('*').order('sort_order').order('created_at'),
  ])
  const base = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/gallery/`
  const gallery: AdminGalleryItem[] = ((g.data ?? []) as GalleryRow[]).map((r) => ({
    id: r.id, url: base + r.storage_path, title: r.title, alt_text: r.alt_text, category: r.category, is_published: r.is_published,
  }))
  return (
    <div className="space-y-6">
      <div>
        <h1 className="h-display text-3xl sm:text-4xl">Website content</h1>
        <p className="mt-1 text-muted">Edit what visitors see. Changes appear on the public site within a minute.</p>
      </div>
      <ContentManager content={content} gallery={gallery} testimonials={(t.data ?? []) as TestimonialRow[]} canUpload={hasServiceSupabase()} />
    </div>
  )
}
