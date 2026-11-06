import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabase } from '@/lib/supabase/admin'
import { hasServiceSupabase } from '@/lib/supabase/env'
import { contactPayloadSchema } from '@/lib/validation'
import { clientIp, rateLimit } from '@/lib/rate-limit'
import { sendContactNotification } from '@/lib/email'

const json = (body: Record<string, unknown>, status = 200) => NextResponse.json(body, { status })

export async function POST(req: NextRequest) {
  if (!hasServiceSupabase()) return json({ error: 'The contact form is not available yet because the database has not been connected. Please use WhatsApp, phone or email.' }, 503)
  if (!rateLimit(`contact:${clientIp(req)}`, 5, 10 * 60_000)) return json({ error: 'Too many messages. Please wait a few minutes and try again.' }, 429)

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return json({ error: 'That request could not be read.' }, 400)
  }
  const parsed = contactPayloadSchema.safeParse(body)
  if (!parsed.success) return json({ error: 'Please check the highlighted details.', fields: parsed.error.flatten().fieldErrors }, 422)
  const v = parsed.data
  if (v.website) return json({ ok: true }) // honeypot

  const { error } = await createAdminSupabase().from('contact_messages').insert({ name: v.name, email: v.email, phone: v.phone || null, message: v.message })
  if (error) {
    console.error('contact insert failed', error)
    return json({ error: 'We could not send your message. Please try WhatsApp or email instead.' }, 500)
  }
  const email = await sendContactNotification(v.name, v.email, v.phone, v.message)
  return json({ ok: true, email })
}
