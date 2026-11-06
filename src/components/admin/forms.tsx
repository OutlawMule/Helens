'use client'

import { useState } from 'react'
import { ActionMessage, AdminCard, EmptyState, useAction } from './ui'
import { AreaField, Notice, TextField } from '@/components/ui/primitives'
import { deleteTestimonial, saveContent, saveTestimonial, setFacilityActive } from '@/lib/actions/content'
import { WEEKDAYS, WEEKDAY_LABEL } from '@/lib/constants'
import type { BookingSettings, HoursSettings, ItemContent } from '@/lib/content-defaults'
import type { TestimonialRow } from '@/lib/types'

export interface FieldDef { name: string; label: string; type: 'text' | 'textarea'; hint?: string }
const checkbox = 'h-4 w-4 accent-[rgb(var(--c-brand))]'

/** Generic editor for flat text sections (home, about, contact). */
export function SectionForm({ k, fields, initial }: { k: 'home' | 'about' | 'contact'; fields: FieldDef[]; initial: Record<string, string> }) {
  const [vals, setVals] = useState(initial)
  const act = useAction()
  return (
    <form onSubmit={(e) => { e.preventDefault(); act.run(() => saveContent(k, vals)) }} className="space-y-5">
      {fields.map((f) =>
        f.type === 'textarea' ? (
          <AreaField key={f.name} id={`${k}-${f.name}`} label={f.label} hint={f.hint} rows={4} value={vals[f.name] ?? ''} onChange={(e) => setVals({ ...vals, [f.name]: e.target.value })} />
        ) : (
          <TextField key={f.name} id={`${k}-${f.name}`} label={f.label} hint={f.hint} value={vals[f.name] ?? ''} onChange={(e) => setVals({ ...vals, [f.name]: e.target.value })} />
        ),
      )}
      <button type="submit" disabled={act.pending} className="btn btn-primary">{act.pending ? 'Saving…' : 'Save changes'}</button>
      <ActionMessage msg={act.msg} />
    </form>
  )
}

const CONTACT_FIELDS: FieldDef[] = [
  { name: 'phone', label: 'Phone number', type: 'text' },
  { name: 'whatsapp', label: 'WhatsApp link', type: 'text', hint: 'Format: https://wa.me/260971664049' },
  { name: 'email', label: 'Email address', type: 'text' },
  { name: 'addressLine1', label: 'Address line 1', type: 'text' },
  { name: 'addressLine2', label: 'Address line 2', type: 'text' },
  { name: 'mapsUrl', label: 'Google Maps link', type: 'text', hint: 'Used for the map on the Contact page.' },
]
/** Business contact details. Shared by Website content and Settings. */
export function ContactInfoForm({ initial }: { initial: Record<string, string> }) {
  return <SectionForm k="contact" fields={CONTACT_FIELDS} initial={initial} />
}

/** Title + description editor for the fixed set of event types or amenities. */
export function ItemsForm({ k, initial }: { k: 'events' | 'amenities'; initial: ItemContent[] }) {
  const [items, setItems] = useState(initial)
  const act = useAction()
  const set = (i: number, patch: Partial<ItemContent>) => setItems(items.map((it, j) => (j === i ? { ...it, ...patch } : it)))
  return (
    <form onSubmit={(e) => { e.preventDefault(); act.run(() => saveContent(k, { items })) }} className="space-y-6">
      {items.map((it, i) => (
        <fieldset key={it.slug} className="rounded-2xl border border-line p-5">
          <legend className="px-2 text-sm text-muted">{it.slug}</legend>
          <div className="space-y-4">
            <TextField id={`${k}-${it.slug}-t`} label="Title" value={it.title} onChange={(e) => set(i, { title: e.target.value })} />
            <AreaField id={`${k}-${it.slug}-s`} label="Description" rows={3} value={it.summary} onChange={(e) => set(i, { summary: e.target.value })} />
          </div>
        </fieldset>
      ))}
      {k === 'amenities' && <p className="text-sm text-muted">Sizes and depths (40m × 40m arena, 6m × 4m pool, 1.0m / 1.8m depths) are fixed, verified facts and are not editable here.</p>}
      <button type="submit" disabled={act.pending} className="btn btn-primary">{act.pending ? 'Saving…' : 'Save changes'}</button>
      <ActionMessage msg={act.msg} />
    </form>
  )
}

export function BookingSettingsForm({ initial }: { initial: BookingSettings }) {
  const [v, setV] = useState(initial)
  const act = useAction()
  return (
    <form onSubmit={(e) => { e.preventDefault(); act.run(() => saveContent('booking', v)) }} className="space-y-5">
      <label className="flex items-start gap-3"><input type="checkbox" className={`${checkbox} mt-1`} checked={v.enabled} onChange={(e) => setV({ ...v, enabled: e.target.checked })} /><span><span className="block font-medium">Accept online booking requests</span><span className="text-sm text-muted">Turn off to pause the booking form (the site shows a notice).</span></span></label>
      <label className="flex items-start gap-3"><input type="checkbox" className={`${checkbox} mt-1`} checked={v.requireApproval} onChange={(e) => setV({ ...v, requireApproval: e.target.checked })} /><span><span className="block font-medium">Require administrator approval</span><span className="text-sm text-muted">On (recommended): every request stays pending until you approve it. Off: requests for free times are confirmed automatically.</span></span></label>
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField id="min-notice" type="number" min={0} max={365} label="Minimum notice (days)" hint="0 allows requests for today." value={v.minNoticeDays} onChange={(e) => setV({ ...v, minNoticeDays: Number(e.target.value) })} />
        <TextField id="max-adv" type="number" min={1} max={1460} label="How far ahead can people book (days)" value={v.maxAdvanceDays} onChange={(e) => setV({ ...v, maxAdvanceDays: Number(e.target.value) })} />
      </div>
      <button type="submit" disabled={act.pending} className="btn btn-primary">{act.pending ? 'Saving…' : 'Save booking settings'}</button>
      <ActionMessage msg={act.msg} />
    </form>
  )
}

export function HoursForm({ initial }: { initial: HoursSettings }) {
  const [v, setV] = useState(initial)
  const act = useAction()
  const set = (d: (typeof WEEKDAYS)[number], patch: Partial<HoursSettings['days'][typeof d]>) => setV({ ...v, days: { ...v.days, [d]: { ...v.days[d], ...patch } } })
  return (
    <form onSubmit={(e) => { e.preventDefault(); act.run(() => saveContent('hours', v)) }} className="space-y-5">
      <Notice tone="info">Hours you enter here are shown on the Contact page. No hours are published until you set them.</Notice>
      <label className="flex items-start gap-3"><input type="checkbox" className={`${checkbox} mt-1`} checked={v.enforce} onChange={(e) => setV({ ...v, enforce: e.target.checked })} /><span><span className="block font-medium">Enforce hours on booking requests</span><span className="text-sm text-muted">When on, requests outside these hours (or on closed days) are refused. Events must start and end on the same day.</span></span></label>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[28rem] text-sm">
          <thead className="text-left text-muted"><tr><th className="py-2 font-medium">Day</th><th className="font-medium">Closed</th><th className="font-medium">Opens</th><th className="font-medium">Closes</th></tr></thead>
          <tbody className="divide-y divide-line/60">
            {WEEKDAYS.map((d) => (
              <tr key={d}>
                <th scope="row" className="py-2 text-left font-medium">{WEEKDAY_LABEL[d]}</th>
                <td><input type="checkbox" aria-label={`${WEEKDAY_LABEL[d]} closed`} className={checkbox} checked={v.days[d].closed} onChange={(e) => set(d, { closed: e.target.checked })} /></td>
                <td className="pr-2"><input type="time" aria-label={`${WEEKDAY_LABEL[d]} opening time`} className="input !py-2" disabled={v.days[d].closed} value={v.days[d].open} onChange={(e) => set(d, { open: e.target.value })} /></td>
                <td><input type="time" aria-label={`${WEEKDAY_LABEL[d]} closing time`} className="input !py-2" disabled={v.days[d].closed} value={v.days[d].close} onChange={(e) => set(d, { close: e.target.value })} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button type="submit" disabled={act.pending} className="btn btn-primary">{act.pending ? 'Saving…' : 'Save hours'}</button>
      <ActionMessage msg={act.msg} />
    </form>
  )
}

export function FacilityToggles({ facilities }: { facilities: { id: string; name: string; is_active: boolean }[] }) {
  const act = useAction()
  return (
    <div>
      <ul className="divide-y divide-line/60">
        {facilities.map((f) => (
          <li key={f.id} className="flex items-center justify-between gap-4 py-3">
            <span className="font-medium">{f.name}</span>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" className={checkbox} checked={f.is_active} disabled={act.pending} onChange={(e) => act.run(() => setFacilityActive(f.id, e.target.checked))} />Open for booking requests</label>
          </li>
        ))}
      </ul>
      <ActionMessage msg={act.msg} />
    </div>
  )
}

function TestimonialForm({ t }: { t?: TestimonialRow }) {
  const [v, setV] = useState({ authorName: t?.author_name ?? '', authorContext: t?.author_context ?? '', quote: t?.quote ?? '', isSample: t?.is_sample ?? false, isPublished: t?.is_published ?? true })
  const act = useAction()
  return (
    <form
      onSubmit={(e) => { e.preventDefault(); act.run(() => saveTestimonial({ id: t?.id, ...v }), { onDone: (r) => r.ok && !t && setV({ authorName: '', authorContext: '', quote: '', isSample: false, isPublished: true }) }) }}
      className="space-y-4 rounded-2xl border border-line p-5"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField id={`t-name-${t?.id ?? 'new'}`} label="Guest name" value={v.authorName} onChange={(e) => setV({ ...v, authorName: e.target.value })} required />
        <TextField id={`t-ctx-${t?.id ?? 'new'}`} label="Context (e.g. Wedding guest)" value={v.authorContext} onChange={(e) => setV({ ...v, authorContext: e.target.value })} />
      </div>
      <AreaField id={`t-quote-${t?.id ?? 'new'}`} label="Testimonial" rows={3} value={v.quote} onChange={(e) => setV({ ...v, quote: e.target.value })} required />
      <div className="flex flex-wrap items-center gap-6 text-sm">
        <label className="flex items-center gap-2"><input type="checkbox" className={checkbox} checked={v.isPublished} onChange={(e) => setV({ ...v, isPublished: e.target.checked })} />Published</label>
        <label className="flex items-center gap-2"><input type="checkbox" className={checkbox} checked={v.isSample} onChange={(e) => setV({ ...v, isSample: e.target.checked })} />Sample (shown with a “Sample” label)</label>
      </div>
      <div className="flex flex-wrap gap-3">
        <button type="submit" disabled={act.pending} className="btn btn-primary btn-sm">{act.pending ? 'Saving…' : t ? 'Save' : 'Add testimonial'}</button>
        {t && <button type="button" disabled={act.pending} onClick={() => window.confirm('Delete this testimonial?') && act.run(() => deleteTestimonial(t.id))} className="btn btn-ghost btn-sm">Delete</button>}
      </div>
      <ActionMessage msg={act.msg} />
    </form>
  )
}

export function TestimonialsEditor({ items }: { items: TestimonialRow[] }) {
  return (
    <div className="space-y-6">
      <Notice tone="info">Testimonials marked “Sample” are placeholders and show a visible label on the site. Replace them with real guest feedback, and only add words guests have actually given you.</Notice>
      <AdminCard title="Add a testimonial"><TestimonialForm /></AdminCard>
      {items.length === 0 ? <EmptyState>No testimonials yet.</EmptyState> : items.map((t) => <TestimonialForm key={t.id} t={t} />)}
    </div>
  )
}
