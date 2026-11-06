'use client'

import { useActionState } from 'react'
import { signIn, type LoginState } from '@/lib/actions/auth'
import { Notice } from '@/components/ui/primitives'

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(signIn, {})
  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="next" value={next} />
      <div>
        <label htmlFor="email" className="label">Email</label>
        <input id="email" name="email" type="email" autoComplete="username" required className="input" />
      </div>
      <div>
        <label htmlFor="password" className="label">Password</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required className="input" />
      </div>
      {state.error && <Notice tone="danger">{state.error}</Notice>}
      <button type="submit" disabled={pending} className="btn btn-primary w-full">{pending ? 'Signing in…' : 'Sign in'}</button>
    </form>
  )
}
