'use client'

import { Mail, Phone, Trash2 } from 'lucide-react'
import { ActionMessage, EmptyState, useAction } from './ui'
import { deleteMessage, setMessageStatus } from '@/lib/actions/content'
import { timeAgo } from '@/lib/activity'
import { whatsappTo } from '@/lib/utils'
import type { MessageRow } from '@/lib/types'

export function MessagesList({ messages }: { messages: MessageRow[] }) {
  const act = useAction()
  if (!messages.length) return <EmptyState>No messages yet. Messages from the website’s contact form appear here.</EmptyState>
  return (
    <div>
      <ul className="space-y-4">
        {messages.map((m) => (
          <li key={m.id} className="card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-medium">{m.name} {m.status === 'new' && <span className="badge ml-2 text-warn">New</span>}</p>
                <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
                  <a className="inline-flex items-center gap-1.5 underline" href={`mailto:${m.email}`}><Mail className="h-3.5 w-3.5" aria-hidden />{m.email}</a>
                  {m.phone && <a className="inline-flex items-center gap-1.5 underline" href={whatsappTo(m.phone)} target="_blank" rel="noopener noreferrer"><Phone className="h-3.5 w-3.5" aria-hidden />{m.phone}</a>}
                </p>
              </div>
              <span className="text-xs text-muted">{timeAgo(m.created_at)}</span>
            </div>
            <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed">{m.message}</p>
            <div className="mt-4 flex gap-2">
              <button type="button" disabled={act.pending} onClick={() => act.run(() => setMessageStatus(m.id, m.status === 'new' ? 'handled' : 'new'))} className="btn btn-ghost btn-sm">{m.status === 'new' ? 'Mark as handled' : 'Mark as new'}</button>
              <button type="button" aria-label="Delete message" disabled={act.pending} onClick={() => window.confirm('Delete this message?') && act.run(() => deleteMessage(m.id))} className="btn btn-ghost btn-sm"><Trash2 className="h-4 w-4" aria-hidden />Delete</button>
            </div>
          </li>
        ))}
      </ul>
      <ActionMessage msg={act.msg} />
    </div>
  )
}
