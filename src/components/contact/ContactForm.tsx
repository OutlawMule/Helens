'use client'

import { useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CircleCheck } from 'lucide-react'
import { AreaField, Notice, TextField } from '@/components/ui/primitives'
import { contactSchema, type ContactInput } from '@/lib/validation'

export function ContactForm() {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<ContactInput>({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: '', email: '', phone: '', message: '' },
  })
  const honeypot = useRef<HTMLInputElement>(null)
  const [error, setError] = useState('')
  const [sent, setSent] = useState<'sent' | null>(null)

  const onSubmit = handleSubmit(async (values) => {
    setError('')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...values, website: honeypot.current?.value ?? '' }),
      })
      const json = (await res.json()) as { error?: string }
      if (!res.ok) return setError(json.error ?? 'Something went wrong. Please try again.')
      reset()
      setSent('sent')
    } catch {
      setError('We could not reach the server. Please check your connection and try again.')
    }
  })

  if (sent) {
    return (
      <div className="card p-8 text-center" role="status">
        <CircleCheck className="mx-auto h-10 w-10 text-ok" aria-hidden />
        <h3 className="h-display mt-4 text-2xl">Message received</h3>
        <p className="mt-2 text-muted">Thank you. Your message has been saved for our team. For anything urgent, WhatsApp or a call is quickest.</p>
        <button type="button" className="btn btn-ghost mt-6" onClick={() => setSent(null)}>Send another message</button>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} noValidate className="card space-y-5 p-6 sm:p-8" aria-label="Contact form">
      <TextField id="c-name" label="Your name" autoComplete="name" error={errors.name?.message} {...register('name')} />
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField id="c-email" type="email" label="Email" autoComplete="email" error={errors.email?.message} {...register('email')} />
        <TextField id="c-phone" type="tel" label="Phone (optional)" autoComplete="tel" error={errors.phone?.message} {...register('phone')} />
      </div>
      <AreaField id="c-message" label="How can we help?" rows={5} error={errors.message?.message} {...register('message')} />
      <input ref={honeypot} type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 opacity-0" />
      {error && <Notice tone="danger">{error}</Notice>}
      <button type="submit" disabled={isSubmitting} className="btn btn-primary w-full sm:w-auto">{isSubmitting ? 'Sending…' : 'Send message'}</button>
    </form>
  )
}
