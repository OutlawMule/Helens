'use client'

import Image from 'next/image'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Maximize2, Minimize2, X } from 'lucide-react'
import { PlaceholderTag, Scene } from '@/components/theme/Scene'
import { Notice } from '@/components/ui/primitives'
import { CATEGORY_SCENE, GALLERY_CATEGORIES, type GalleryCategoryId, type SceneKind } from '@/lib/constants'
import type { PublicGalleryItem } from '@/lib/content'
import { cn } from '@/lib/utils'

interface Item { id: string; title: string; alt: string; category: string; url?: string; scene?: SceneKind }

// Shown only while no real photographs have been uploaded. Always labelled as placeholders.
const PLACEHOLDERS: Item[] = (
  [
    ['events', 'celebration', 'Celebration setup'], ['events', 'concert', 'Concert stage'],
    ['weddings', 'wedding', 'Wedding arch'], ['weddings', 'garden', 'Garden ceremony'],
    ['arena', 'arena', 'Open arena'], ['arena', 'corporate', 'Marquee event'],
    ['pool-lounge', 'pool', 'Swimming pool'], ['pool-lounge', 'fire', 'Fire pit lounge'],
    ['dining', 'dining', 'Garden dining'], ['dining', 'celebration', 'Evening lights'],
    ['nursery-garden', 'nursery', 'Flower nursery'], ['nursery-garden', 'garden', 'Garden paths'],
  ] as [GalleryCategoryId, SceneKind, string][]
).map(([category, scene, title], i) => ({ id: `ph-${i}`, category, scene, title: `Placeholder: ${title}`, alt: `Placeholder illustration: ${title}` }))

export function GalleryView({ items }: { items: PublicGalleryItem[] }) {
  const real = items.length > 0
  const all: Item[] = useMemo(() => (real ? items.map((i) => ({ id: i.id, title: i.title, alt: i.alt, category: i.category, url: i.url })) : PLACEHOLDERS), [items, real])
  const [cat, setCat] = useState<string>('all')
  const [open, setOpen] = useState<number | null>(null)
  const [fullscreen, setFullscreen] = useState(false)
  const triggerRef = useRef<HTMLElement | null>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)

  const visible = useMemo(() => (cat === 'all' ? all : all.filter((i) => i.category === cat)), [all, cat])
  const categories = GALLERY_CATEGORIES.filter((c) => all.some((i) => i.category === c.id))

  const close = useCallback(() => {
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => {})
    setOpen(null)
    triggerRef.current?.focus()
  }, [])
  const step = useCallback((d: number) => setOpen((o) => (o === null ? o : (o + d + visible.length) % visible.length)), [visible.length])

  useEffect(() => {
    if (open === null) return
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
      else if (e.key === 'ArrowLeft') step(-1)
      else if (e.key === 'ArrowRight') step(1)
    }
    const onFs = () => setFullscreen(Boolean(document.fullscreenElement))
    window.addEventListener('keydown', onKey)
    document.addEventListener('fullscreenchange', onFs)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
      document.removeEventListener('fullscreenchange', onFs)
    }
  }, [open, close, step])

  const toggleFullscreen = () => {
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => {})
    else void overlayRef.current?.requestFullscreen?.().catch(() => {})
  }
  const current = open !== null ? visible[open] : null

  return (
    <div>
      {!real && (
        <Notice tone="info" className="mb-8 max-w-3xl">
          These are illustrated placeholders, not photographs of Helens Haven. Real photos appear here as soon as they are uploaded in the admin panel.
        </Notice>
      )}

      <div role="group" aria-label="Filter by category" className="mb-10 flex flex-wrap gap-2">
        {[{ id: 'all', label: 'All' }, ...categories].map((c) => (
          <button key={c.id} type="button" aria-pressed={cat === c.id} onClick={() => setCat(c.id)} className={cn('btn btn-sm', cat === c.id ? 'btn-primary' : 'btn-ghost')}>
            {c.label}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="py-16 text-center text-muted">No photos in this category yet.</p>
      ) : (
        <ul className="columns-1 gap-5 sm:columns-2 lg:columns-3">
          {visible.map((item, i) => (
            <li key={item.id} className="mb-5 break-inside-avoid">
              <button
                type="button"
                onClick={(e) => {
                  triggerRef.current = e.currentTarget
                  setOpen(i)
                }}
                className={cn('frame group block w-full !rounded-2xl text-left', i % 3 === 0 ? 'aspect-[4/5]' : 'aspect-[4/3]')}
                aria-label={`Open ${item.title}`}
              >
                {item.url ? (
                  <Image src={item.url} alt={item.alt} fill sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" className="object-cover transition-transform duration-700 group-hover:scale-105" />
                ) : (
                  <>
                    <Scene kind={item.scene ?? CATEGORY_SCENE[item.category as GalleryCategoryId] ?? 'garden'} className="transition-transform duration-700 group-hover:scale-105" />
                    <PlaceholderTag />
                  </>
                )}
                <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4 pt-10 text-sm text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">{item.title}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <AnimatePresence>
        {current && open !== null && (
          <motion.div
            ref={overlayRef}
            role="dialog"
            aria-modal="true"
            aria-label={`Gallery viewer: ${current.title}`}
            className="fixed inset-0 z-[90] flex flex-col bg-black/92 text-white backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <div className="flex items-center justify-between gap-4 px-5 py-4">
              <p className="truncate text-sm text-white/80" aria-live="polite">{current.title} · {open + 1} of {visible.length}</p>
              <div className="flex gap-2">
                <button type="button" onClick={toggleFullscreen} aria-label={fullscreen ? 'Exit full screen' : 'View full screen'} className="grid h-11 w-11 place-items-center rounded-full bg-white/10 hover:bg-white/20">
                  {fullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
                </button>
                <button ref={closeRef} type="button" onClick={close} aria-label="Close viewer" className="grid h-11 w-11 place-items-center rounded-full bg-white/10 hover:bg-white/20">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="relative flex flex-1 items-center justify-center px-4 pb-6 sm:px-16">
              <button type="button" onClick={() => step(-1)} aria-label="Previous photo" className="absolute left-2 z-10 grid h-12 w-12 place-items-center rounded-full bg-white/10 hover:bg-white/20 sm:left-5">
                <ChevronLeft className="h-6 w-6" />
              </button>
              <AnimatePresence mode="wait">
                <motion.div
                  key={current.id}
                  className="relative h-[70vh] w-full max-w-5xl overflow-hidden rounded-2xl"
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.3 }}
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.2}
                  onDragEnd={(_, info) => {
                    if (info.offset.x < -80) step(1)
                    else if (info.offset.x > 80) step(-1)
                  }}
                >
                  {current.url ? (
                    <Image src={current.url} alt={current.alt} fill sizes="100vw" className="object-contain" priority />
                  ) : (
                    <>
                      <Scene kind={current.scene ?? 'garden'} />
                      <PlaceholderTag />
                    </>
                  )}
                </motion.div>
              </AnimatePresence>
              <button type="button" onClick={() => step(1)} aria-label="Next photo" className="absolute right-2 z-10 grid h-12 w-12 place-items-center rounded-full bg-white/10 hover:bg-white/20 sm:right-5">
                <ChevronRight className="h-6 w-6" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
