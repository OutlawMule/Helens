'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Briefcase, Check, Flower2, Heart, Music, PartyPopper, Sparkles } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { useBookingDraft, type BookingDraft } from './BookingDraftProvider'
import { CalendarGrid, type CalState } from './CalendarGrid'
import { AreaField, Notice, SelectField, Spinner, TextField } from '@/components/ui/primitives'
import { bookingSchema, type BookingInput } from '@/lib/validation'
import { EVENT_LABELS, EVENT_TYPE_IDS, WEEKDAYS, type EventTypeId } from '@/lib/constants'
import type { HoursSettings } from '@/lib/content-defaults'
import { cn, formatDate, formatTime, pad, timeOptions, toMinutes, weekdayMon0 } from '@/lib/utils'

interface Props {
  facilities: { slug: string; name: string }[]
  configured: boolean
  enabled: boolean
  requireApproval: boolean
  limits: { minDate: string; maxDate: string }
  hours: HoursSettings
  initial: { type?: string; facility?: string; date?: string }
}
type Busy = { facility: string; start: string; end: string; kind: 'confirmed' | 'pending' | 'block' }

const ICONS: Record<EventTypeId, typeof Heart> = { wedding: Heart, 'private-celebration': PartyPopper, corporate: Briefcase, 'outdoor-concert': Music, 'garden-event': Flower2, other: Sparkles }
const STEPS = ['Your event', 'Date and time', 'Your details', 'Review']
const STEP_FIELDS: (keyof BookingInput)[][] = [['eventType', 'guests', 'facilities'], ['eventDate', 'startTime', 'endTime'], ['fullName', 'email', 'phone', 'notes'], []]
const FIELD_STEP: Record<string, number> = { eventType: 0, guests: 0, facilities: 0, eventDate: 1, startTime: 1, endTime: 1, fullName: 2, email: 2, phone: 2, notes: 2 }
const ALL_TIMES = timeOptions(30)

export function BookingWizard(props: Props) {
  const draft = useBookingDraft()
  // Mount the form only after the saved draft has been read, so its defaults include earlier progress.
  if (!draft.ready) return <div className="card grid min-h-[24rem] place-items-center"><Spinner className="h-8 w-8" /></div>
  return <WizardInner {...props} />
}

function WizardInner({ facilities, configured, enabled, requireApproval, limits, hours, initial }: Props) {
  const router = useRouter()
  const store = useBookingDraft()
  const saved = store.get()

  const urlType = EVENT_TYPE_IDS.find((t) => t === initial.type)
  const urlFacility = facilities.find((f) => f.slug === initial.facility)?.slug
  const [step, setStep] = useState(Math.min(saved.step ?? 0, 3))
  const [submitError, setSubmitError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const form = useForm<BookingInput>({
    resolver: zodResolver(bookingSchema),
    mode: 'onTouched',
    defaultValues: {
      eventType: urlType ?? (saved.eventType as EventTypeId | undefined),
      guests: saved.guests ?? undefined,
      facilities: Array.from(new Set([...(saved.facilities ?? []), ...(urlFacility ? [urlFacility] : [])])),
      eventDate: initial.date && /^\d{4}-\d{2}-\d{2}$/.test(initial.date) ? initial.date : (saved.eventDate ?? ''),
      startTime: saved.startTime ?? '',
      endTime: saved.endTime ?? '',
      fullName: saved.fullName ?? '',
      email: saved.email ?? '',
      phone: saved.phone ?? '',
      notes: saved.notes ?? '',
    },
  })
  const { register, watch, setValue, trigger, handleSubmit, formState: { errors } } = form

  // Persist every change so progress survives version switches, navigation and reloads (this tab only).
  useEffect(() => {
    const sub = watch((vals) => store.save({ ...(vals as unknown as BookingDraft), step }))
    return () => sub.unsubscribe()
  }, [watch, store, step])
  useEffect(() => store.save({ step }), [store, step])

  const eventType = watch('eventType')
  const selectedFacilities = watch('facilities') ?? []
  const eventDate = watch('eventDate')
  const startTime = watch('startTime')
  const endTime = watch('endTime')
  const facKey = selectedFacilities.join(',')

  /* ───── availability ───── */
  const first = eventDate || limits.minDate
  const [view, setView] = useState({ y: Number(first.slice(0, 4)), m: Number(first.slice(5, 7)) - 1 })
  const [days, setDays] = useState<Record<string, 'pending' | 'partial' | 'unavailable'>>({})
  const [loadingDays, setLoadingDays] = useState(false)
  const [busy, setBusy] = useState<Busy[]>([])

  useEffect(() => {
    if (!configured) return
    const ctrl = new AbortController()
    setLoadingDays(true)
    fetch(`/api/availability?month=${view.y}-${pad(view.m + 1)}&facilities=${facKey}`, { signal: ctrl.signal })
      .then((r) => r.json())
      .then((j: { days?: typeof days }) => setDays(j.days ?? {}))
      .catch(() => {})
      .finally(() => !ctrl.signal.aborted && setLoadingDays(false))
    return () => ctrl.abort()
  }, [view, facKey, configured])

  useEffect(() => {
    if (!configured || !eventDate) return setBusy([])
    const ctrl = new AbortController()
    fetch(`/api/availability?month=${eventDate.slice(0, 7)}&date=${eventDate}&facilities=${facKey}`, { signal: ctrl.signal })
      .then((r) => r.json())
      .then((j: { busy?: Busy[] }) => setBusy(j.busy ?? []))
      .catch(() => {})
    return () => ctrl.abort()
  }, [eventDate, facKey, configured])

  const dayHours = (key: string) => (hours.enforce ? hours.days[WEEKDAYS[weekdayMon0(Number(key.slice(0, 4)), Number(key.slice(5, 7)) - 1, Number(key.slice(8, 10)))]] : null)
  const stateOf = (key: string): CalState => days[key] ?? 'available'
  const isDisabled = (key: string, state: CalState) => key < limits.minDate || key > limits.maxDate || state === 'unavailable' || Boolean(dayHours(key)?.closed)
  const hoursToday = eventDate ? dayHours(eventDate) : null
  const times = useMemo(() => (hoursToday?.open && hoursToday.close ? ALL_TIMES.filter((t) => t >= hoursToday.open && t <= hoursToday.close) : ALL_TIMES), [hoursToday])

  const overnight = Boolean(startTime && endTime && endTime <= startTime)
  const conflict = useMemo(() => {
    if (!startTime || !endTime || startTime === endTime) return null
    const s = toMinutes(startTime)
    const e = toMinutes(endTime) > s ? toMinutes(endTime) : toMinutes(endTime) + 1440
    return busy.find((b) => b.kind !== 'pending' && s < toMinutes(b.end) && toMinutes(b.start) < e) ?? null
  }, [busy, startTime, endTime])

  const toggleFacility = (slug: string) => {
    const next = selectedFacilities.includes(slug) ? selectedFacilities.filter((s) => s !== slug) : [...selectedFacilities, slug]
    setValue('facilities', next, { shouldValidate: true, shouldDirty: true })
  }

  const dateTaken = Boolean(eventDate) && stateOf(eventDate) === 'unavailable'
  const goNext = async () => {
    if (!(await trigger(STEP_FIELDS[step]))) return
    if (step === 1) {
      if (eventDate < limits.minDate || eventDate > limits.maxDate) {
        form.setError('eventDate', { message: 'Choose a date within the range we accept requests for.' })
        return
      }
      if (conflict || dateTaken) return
    }
    setStep((s) => s + 1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const submit = handleSubmit(
    async (values) => {
      setSubmitError('')
      setSubmitting(true)
      try {
        const res = await fetch('/api/bookings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values) })
        const json = (await res.json()) as { reference?: string; status?: string; email?: string; error?: string }
        if (!res.ok || !json.reference) {
          setSubmitError(json.error ?? 'Something went wrong. Please try again.')
          if (res.status === 409) setStep(1)
          return
        }
        try {
          sessionStorage.setItem('hh-last-booking', JSON.stringify({ reference: json.reference, eventType: values.eventType, eventDate: values.eventDate, startTime: values.startTime, endTime: values.endTime, guests: values.guests, facilities: values.facilities.map((s) => facilities.find((f) => f.slug === s)?.name ?? s) }))
        } catch {
          // summary is a nicety only
        }
        store.clear()
        router.push(`/bookings/confirmation?ref=${encodeURIComponent(json.reference)}&status=${json.status ?? 'pending'}&email=${json.email ?? 'not_configured'}`)
      } catch {
        setSubmitError('We could not reach the server. Please check your connection and try again.')
      } finally {
        setSubmitting(false)
      }
    },
    (errs) => {
      const firstKey = Object.keys(errs)[0]
      if (firstKey in FIELD_STEP) setStep(FIELD_STEP[firstKey])
    },
  )

  const blocked = !configured || !enabled
  return (
    <div>
      {!configured && <Notice tone="warn" className="mb-6">Development mode: Supabase is not connected yet, so you can explore the form but requests cannot be submitted. See the README for setup.</Notice>}
      {configured && !enabled && <Notice tone="warn" className="mb-6">Online booking requests are paused right now. Please contact us on WhatsApp or by phone.</Notice>}

      <ol className="mb-8 grid grid-cols-4 gap-2" aria-label="Booking progress">
        {STEPS.map((label, i) => (
          <li key={label} aria-current={i === step ? 'step' : undefined} className={cn('border-t-2 pt-2 text-xs sm:text-sm', i < step ? 'border-brand text-ink' : i === step ? 'border-accent text-ink' : 'border-line text-muted')}>
            <span className="flex items-center gap-1.5">{i < step && <Check className="h-3.5 w-3.5 text-brand" aria-hidden />}{label}</span>
          </li>
        ))}
      </ol>

      <form onSubmit={submit} noValidate className="card p-5 sm:p-9" aria-label="Booking request">
        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -18 }} transition={{ duration: 0.25 }}>
            {step === 0 && (
              <div className="space-y-9">
                <fieldset>
                  <legend className="h-display mb-4 text-2xl">What are you planning?</legend>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {EVENT_TYPE_IDS.map((id) => {
                      const Icon = ICONS[id]
                      return (
                        <label key={id} className={cn('flex cursor-pointer items-center gap-3 rounded-2xl border p-4 transition focus-within:ring-2 focus-within:ring-accent', eventType === id ? 'border-accent bg-accent/15' : 'border-line hover:border-accent/60')}>
                          <input type="radio" value={id} className="sr-only" {...register('eventType')} />
                          <Icon className="h-5 w-5 text-accent-ink" aria-hidden />
                          <span className="font-medium">{EVENT_LABELS[id]}</span>
                        </label>
                      )
                    })}
                  </div>
                  {errors.eventType && <p role="alert" className="field-error">{errors.eventType.message ?? 'Choose an event type'}</p>}
                </fieldset>

                <TextField id="guests" type="number" inputMode="numeric" min={1} label="Expected number of guests" error={errors.guests?.message} {...register('guests', { valueAsNumber: true })} className="max-w-xs" />

                <fieldset>
                  <legend className="h-display mb-1 text-2xl">Which spaces do you need?</legend>
                  <p className="mb-4 text-sm text-muted">Pick one or more. Availability is checked per space.</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {facilities.map((f) => {
                      const on = selectedFacilities.includes(f.slug)
                      return (
                        <label key={f.slug} className={cn('flex cursor-pointer items-center justify-between gap-3 rounded-2xl border p-4 transition focus-within:ring-2 focus-within:ring-accent', on ? 'border-accent bg-accent/15' : 'border-line hover:border-accent/60')}>
                          <span className="font-medium">{f.name}</span>
                          <input type="checkbox" className="sr-only" checked={on} onChange={() => toggleFacility(f.slug)} />
                          <span aria-hidden className={cn('grid h-6 w-6 place-items-center rounded-full border', on ? 'border-accent bg-accent text-on-accent' : 'border-line')}>{on && <Check className="h-4 w-4" />}</span>
                        </label>
                      )
                    })}
                  </div>
                  {errors.facilities && <p role="alert" className="field-error">{errors.facilities.message ?? 'Choose at least one facility'}</p>}
                </fieldset>
              </div>
            )}

            {step === 1 && (
              <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr]">
                <div>
                  <h2 className="h-display mb-4 text-2xl">Choose your date</h2>
                  <CalendarGrid
                    year={view.y}
                    month={view.m}
                    onMonthChange={(y, m) => setView({ y, m })}
                    stateOf={stateOf}
                    isDisabled={isDisabled}
                    selected={eventDate || null}
                    onSelect={(key) => setValue('eventDate', key, { shouldValidate: true, shouldDirty: true })}
                    loading={loadingDays}
                  />
                  {errors.eventDate && <p role="alert" className="field-error">{errors.eventDate.message}</p>}
                  {dateTaken && <Notice tone="danger" className="mt-3">That date is no longer available for the spaces you chose. Pick another date, or go back and change the spaces.</Notice>}
                  {!configured && <p className="mt-3 text-sm text-muted">Live availability appears here once Supabase is connected.</p>}
                </div>
                <div className="space-y-5">
                  <h2 className="h-display text-2xl">Choose your times</h2>
                  {eventDate ? <p className="text-sm text-muted">{formatDate(eventDate)}</p> : <p className="text-sm text-muted">Pick a date first.</p>}
                  {hoursToday?.open && hoursToday.close && <p className="text-sm text-muted">Opening hours that day: {formatTime(hoursToday.open)} to {formatTime(hoursToday.close)}.</p>}
                  <SelectField id="startTime" label="Start time" error={errors.startTime?.message} {...register('startTime')}>
                    <option value="">Select a start time</option>
                    {times.map((t) => <option key={t} value={t}>{formatTime(t)}</option>)}
                  </SelectField>
                  <SelectField id="endTime" label="End time" error={errors.endTime?.message} hint={overnight ? 'This event ends the next day.' : undefined} {...register('endTime')}>
                    <option value="">Select an end time</option>
                    {times.map((t) => <option key={t} value={t}>{formatTime(t)}</option>)}
                  </SelectField>
                  {busy.length > 0 && (
                    <Notice tone={conflict ? 'danger' : 'info'}>
                      <p className="font-medium">{conflict ? 'Your chosen time overlaps something already reserved.' : 'Already taken on this date'}</p>
                      <ul className="mt-1 space-y-0.5">
                        {busy.map((b, i) => <li key={i}>{b.facility}: {formatTime(b.start === '24:00' ? '23:59' : b.start)} to {b.end === '24:00' ? 'midnight' : formatTime(b.end)} ({b.kind === 'pending' ? 'pending request, not reserved' : b.kind === 'block' ? 'unavailable' : 'reserved'})</li>)}
                      </ul>
                    </Notice>
                  )}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-5">
                <h2 className="h-display text-2xl">Your details</h2>
                <TextField id="fullName" label="Full name" autoComplete="name" error={errors.fullName?.message} {...register('fullName')} />
                <div className="grid gap-5 sm:grid-cols-2">
                  <TextField id="email" type="email" label="Email" autoComplete="email" error={errors.email?.message} {...register('email')} />
                  <TextField id="phone" type="tel" label="Phone number" autoComplete="tel" hint="Include the country code if outside Zambia." error={errors.phone?.message} {...register('phone')} />
                </div>
                <AreaField id="notes" label="Anything else we should know? (optional)" rows={5} hint="Style of event, set-up ideas, timings, special requests." error={errors.notes?.message} {...register('notes')} />
              </div>
            )}

            {step === 3 && (
              <div>
                <h2 className="h-display mb-6 text-2xl">Review your request</h2>
                <dl className="divide-y divide-line/60 rounded-2xl border border-line">
                  {[
                    ['Event', eventType ? EVENT_LABELS[eventType] : ''],
                    ['Guests', String(watch('guests') ?? '')],
                    ['Spaces', selectedFacilities.map((s) => facilities.find((f) => f.slug === s)?.name ?? s).join(', ')],
                    ['Date', eventDate ? formatDate(eventDate) : ''],
                    ['Time', startTime && endTime ? `${formatTime(startTime)} to ${formatTime(endTime)}${overnight ? ' (next day)' : ''}` : ''],
                    ['Name', watch('fullName')],
                    ['Email', watch('email')],
                    ['Phone', watch('phone')],
                    ['Notes', watch('notes') || 'None'],
                  ].map(([k, v]) => (
                    <div key={k} className="grid gap-1 p-4 sm:grid-cols-[9rem_1fr]">
                      <dt className="text-sm text-muted">{k}</dt>
                      <dd className="break-words">{v}</dd>
                    </div>
                  ))}
                </dl>
                <Notice tone="info" className="mt-6">
                  {requireApproval ? 'Sending this creates a pending request. Your date is not reserved until our team approves it.' : 'If this time is free, your booking is confirmed straight away.'}
                </Notice>
                {submitError && <Notice tone="danger" className="mt-4">{submitError}</Notice>}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-line/60 pt-6">
          <button type="button" onClick={() => setStep((s) => Math.max(0, s - 1))} className={cn('btn btn-ghost', step === 0 && 'invisible')}>Back</button>
          {step < 3 ? (
            <button type="button" onClick={goNext} disabled={step === 1 && (Boolean(conflict) || dateTaken)} className="btn btn-primary">Continue</button>
          ) : (
            <button type="submit" disabled={submitting || blocked} className="btn btn-gold">{submitting ? 'Sending…' : 'Send booking request'}</button>
          )}
        </div>
      </form>
    </div>
  )
}
