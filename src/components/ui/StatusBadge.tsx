import { STATUS_LABEL, type BookingStatus } from '@/lib/constants'
import { cn } from '@/lib/utils'

const TONE: Record<BookingStatus, string> = {
  pending: 'text-warn',
  confirmed: 'text-ok',
  rejected: 'text-danger',
  cancelled: 'text-danger',
  completed: 'text-azure',
}

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const s = status as BookingStatus
  return <span className={cn('badge', TONE[s] ?? 'text-muted', className)}>{STATUS_LABEL[s] ?? status}</span>
}
