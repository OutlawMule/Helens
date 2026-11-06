'use client'

import { useRef, useState } from 'react'
import { ActionMessage, EmptyState, useAction } from './ui'
import { AreaField, Notice, SelectField, TextField } from '@/components/ui/primitives'
import { createBrowserSupabase } from '@/lib/supabase/client'
import { createGalleryUpload, deleteGalleryImage, registerGalleryImage, updateGalleryImage } from '@/lib/actions/content'
import { GALLERY_CATEGORIES } from '@/lib/constants'
import type { ActionResult } from '@/lib/types'
import { useRouter } from 'next/navigation'

export interface AdminGalleryItem { id: string; url: string; title: string; alt_text: string; category: string; is_published: boolean }
const MAX_BYTES = 10 * 1024 * 1024
const checkbox = 'h-4 w-4 accent-[rgb(var(--c-brand))]'

function UploadForm({ canUpload }: { canUpload: boolean }) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [title, setTitle] = useState('')
  const [alt, setAlt] = useState('')
  const [category, setCategory] = useState<string>(GALLERY_CATEGORIES[0].id)
  const [published, setPublished] = useState(true)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<ActionResult | null>(null)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const file = fileRef.current?.files?.[0]
    if (!file) return setMsg({ ok: false, message: 'Choose a photo first.' })
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/avif'].includes(file.type)) return setMsg({ ok: false, message: 'Use a JPEG, PNG, WebP or AVIF image.' })
    if (file.size > MAX_BYTES) return setMsg({ ok: false, message: 'That file is over 10 MB. Please resize it first.' })
    setBusy(true)
    setMsg(null)
    try {
      const prep = await createGalleryUpload(file.type)
      if (!prep.ok || !prep.path || !prep.token) return setMsg({ ok: false, message: prep.message })
      // Direct browser → Storage upload using a one-time signed token (bypasses the serverless body-size limit).
      const { error } = await createBrowserSupabase().storage.from('gallery').uploadToSignedUrl(prep.path, prep.token, file, { contentType: file.type })
      if (error) return setMsg({ ok: false, message: `Upload failed: ${error.message}` })
      const reg = await registerGalleryImage({ path: prep.path, title, altText: alt, category, isPublished: published })
      setMsg(reg)
      if (reg.ok) {
        setTitle('')
        setAlt('')
        if (fileRef.current) fileRef.current.value = ''
        router.refresh()
      }
    } catch {
      setMsg({ ok: false, message: 'The upload could not be completed. Please try again.' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-4 p-5">
      <h3 className="h-display text-xl">Upload a photo</h3>
      {!canUpload && <Notice tone="warn">Uploads need SUPABASE_SERVICE_ROLE_KEY on the server. See the README.</Notice>}
      <div>
        <label htmlFor="g-file" className="label">Photo (JPEG, PNG, WebP or AVIF, up to 10 MB)</label>
        <input id="g-file" ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="input" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField id="g-title" label="Title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} required />
        <SelectField id="g-cat" label="Category" value={category} onChange={(e) => setCategory(e.target.value)}>{GALLERY_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}</SelectField>
      </div>
      <AreaField id="g-alt" label="Description for screen readers" rows={2} value={alt} onChange={(e) => setAlt(e.target.value)} maxLength={240} required />
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" className={checkbox} checked={published} onChange={(e) => setPublished(e.target.checked)} />Show on the website</label>
      <p className="text-xs text-muted">Only upload real photographs you have the right to publish.</p>
      <button type="submit" disabled={busy || !canUpload} className="btn btn-primary">{busy ? 'Uploading…' : 'Upload photo'}</button>
      {msg && <Notice tone={msg.ok ? 'ok' : 'danger'}>{msg.message}</Notice>}
    </form>
  )
}

function ImageCard({ item }: { item: AdminGalleryItem }) {
  const [v, setV] = useState({ title: item.title, altText: item.alt_text, category: item.category, isPublished: item.is_published })
  const act = useAction()
  return (
    <li className="card overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={item.url} alt={item.alt_text} loading="lazy" className="aspect-[4/3] w-full object-cover" />
      <div className="space-y-3 p-4">
        <TextField id={`gt-${item.id}`} label="Title" value={v.title} onChange={(e) => setV({ ...v, title: e.target.value })} />
        <AreaField id={`ga-${item.id}`} label="Description" rows={2} value={v.altText} onChange={(e) => setV({ ...v, altText: e.target.value })} />
        <SelectField id={`gc-${item.id}`} label="Category" value={v.category} onChange={(e) => setV({ ...v, category: e.target.value })}>{GALLERY_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}</SelectField>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" className={checkbox} checked={v.isPublished} onChange={(e) => setV({ ...v, isPublished: e.target.checked })} />Published</label>
        <div className="flex gap-2">
          <button type="button" disabled={act.pending} onClick={() => act.run(() => updateGalleryImage(item.id, v))} className="btn btn-primary btn-sm">Save</button>
          <button type="button" disabled={act.pending} onClick={() => window.confirm('Delete this photo permanently?') && act.run(() => deleteGalleryImage(item.id))} className="btn btn-ghost btn-sm">Delete</button>
        </div>
        <ActionMessage msg={act.msg} />
      </div>
    </li>
  )
}

export function GalleryManager({ items, canUpload }: { items: AdminGalleryItem[]; canUpload: boolean }) {
  return (
    <div className="space-y-8">
      <UploadForm canUpload={canUpload} />
      {items.length === 0 ? <EmptyState>No photos uploaded yet. The public gallery shows clearly labelled placeholder artwork until you add some.</EmptyState> : (
        <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{items.map((i) => <ImageCard key={i.id} item={i} />)}</ul>
      )}
    </div>
  )
}
