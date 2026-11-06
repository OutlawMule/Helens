'use client'

import { useState } from 'react'
import { GalleryManager, type AdminGalleryItem } from './GalleryManager'
import { ContactInfoForm, ItemsForm, SectionForm, TestimonialsEditor, type FieldDef } from './forms'
import { cn } from '@/lib/utils'
import type { SiteContent } from '@/lib/content-defaults'
import type { TestimonialRow } from '@/lib/types'

type Tab = 'gallery' | 'home' | 'about' | 'events' | 'amenities' | 'testimonials' | 'contact'
const TABS: { id: Tab; label: string }[] = [
  { id: 'gallery', label: 'Gallery' },
  { id: 'home', label: 'Homepage' },
  { id: 'about', label: 'About' },
  { id: 'events', label: 'Event descriptions' },
  { id: 'amenities', label: 'Amenity descriptions' },
  { id: 'testimonials', label: 'Testimonials' },
  { id: 'contact', label: 'Contact information' },
]

const HOME_FIELDS: FieldDef[] = [
  { name: 'heroTagline', label: 'Hero tagline', type: 'textarea', hint: 'The sentence under “Helens Haven” at the top of the homepage.' },
  { name: 'announcement', label: 'Featured announcement (optional)', type: 'text', hint: 'Shown as a small badge in the hero. Leave empty for none.' },
  { name: 'introTitle', label: 'Introduction heading', type: 'text' },
  { name: 'introBody', label: 'Introduction text', type: 'textarea' },
  { name: 'nurseryTitle', label: 'Nursery feature heading', type: 'text' },
  { name: 'nurseryBody', label: 'Nursery feature text', type: 'textarea' },
]
const ABOUT_FIELDS: FieldDef[] = [
  { name: 'story', label: 'The story', type: 'textarea', hint: 'Draft copy. Replace it with the venue’s real story in your own words.' },
  { name: 'purpose', label: 'Purpose and atmosphere', type: 'textarea' },
  { name: 'botanical', label: 'Botanical identity', type: 'textarea' },
  { name: 'hospitality', label: 'Events and hospitality', type: 'textarea' },
]

interface Props { content: SiteContent; gallery: AdminGalleryItem[]; testimonials: TestimonialRow[]; canUpload: boolean }

export function ContentManager({ content, gallery, testimonials, canUpload }: Props) {
  const [tab, setTab] = useState<Tab>('gallery')
  return (
    <div>
      <div role="tablist" aria-label="Content sections" className="mb-6 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button key={t.id} id={`tab-${t.id}`} type="button" role="tab" aria-selected={tab === t.id} aria-controls={`panel-${t.id}`} onClick={() => setTab(t.id)} className={cn('btn btn-sm', tab === t.id ? 'btn-primary' : 'btn-ghost')}>{t.label}</button>
        ))}
      </div>
      <div id={`panel-${tab}`} role="tabpanel" aria-labelledby={`tab-${tab}`} className="max-w-4xl">
        {tab === 'gallery' && <GalleryManager items={gallery} canUpload={canUpload} />}
        {tab === 'home' && <div className="card p-6"><SectionForm k="home" fields={HOME_FIELDS} initial={{ ...content.home }} /></div>}
        {tab === 'about' && <div className="card p-6"><SectionForm k="about" fields={ABOUT_FIELDS} initial={{ ...content.about }} /></div>}
        {tab === 'events' && <div className="card p-6"><ItemsForm k="events" initial={content.events.items} /></div>}
        {tab === 'amenities' && <div className="card p-6"><ItemsForm k="amenities" initial={content.amenities.items} /></div>}
        {tab === 'testimonials' && <TestimonialsEditor items={testimonials} />}
        {tab === 'contact' && <div className="card p-6"><ContactInfoForm initial={{ ...content.contact }} /></div>}
      </div>
    </div>
  )
}
