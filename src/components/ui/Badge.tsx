import type { ReactNode } from 'react'
import { AlertTriangle, CheckCircle2, CircleDot, Clock, Loader, Lock, Search, XCircle, type LucideIcon } from 'lucide-react'
import { cn } from '../../lib/utils'
import { priorityLabels, statusLabels } from '../../data/mock'
import type { ComplaintStatus, Priority } from '../../data/types'

export type Tone = 'neutral' | 'primary' | 'info' | 'success' | 'warning' | 'error' | 'purple' | 'gold'

const tones: Record<Tone, string> = {
  neutral: 'bg-muted text-ink-2 ring-line-strong/60',
  primary: 'bg-primary-50 text-primary-800 ring-primary-200',
  info: 'bg-info-50 text-info-700 ring-info-100',
  success: 'bg-success-50 text-success-700 ring-success-100',
  warning: 'bg-warning-50 text-warning-700 ring-warning-100',
  error: 'bg-error-50 text-error-700 ring-error-100',
  purple: 'bg-violet-50 text-violet-700 ring-violet-100',
  gold: 'bg-secondary-50 text-secondary-700 ring-secondary-200',
}

interface BadgeProps {
  tone?: Tone
  icon?: LucideIcon
  dot?: boolean
  className?: string
  children: ReactNode
}

export function Badge({ tone = 'neutral', icon: Icon, dot, className, children }: BadgeProps) {
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ring-1 ring-inset', tones[tone], className)}>
      {dot && <span className="size-1.5 rounded-full bg-current" />}
      {Icon && <Icon className="size-3.5" />}
      {children}
    </span>
  )
}

// كل حالة لها لون + أيقونة + نص (لا نعتمد على اللون وحده)
export const statusMeta: Record<ComplaintStatus, { tone: Tone; icon: LucideIcon }> = {
  new: { tone: 'info', icon: CircleDot },
  in_review: { tone: 'purple', icon: Search },
  in_progress: { tone: 'warning', icon: Loader },
  resolved: { tone: 'success', icon: CheckCircle2 },
  closed: { tone: 'neutral', icon: Lock },
  rejected: { tone: 'error', icon: XCircle },
}

export function StatusBadge({ status, className }: { status: ComplaintStatus; className?: string }) {
  const m = statusMeta[status]
  return (
    <Badge tone={m.tone} icon={m.icon} className={className}>
      {statusLabels[status]}
    </Badge>
  )
}

const priorityTone: Record<Priority, Tone> = { low: 'neutral', medium: 'info', high: 'warning', urgent: 'error' }

export function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <Badge tone={priorityTone[priority]} dot>
      {priorityLabels[priority]}
    </Badge>
  )
}

export function OverdueBadge() {
  return (
    <Badge tone="error" icon={AlertTriangle}>
      متأخر
    </Badge>
  )
}

export function PendingBadge() {
  return (
    <Badge tone="gold" icon={Clock}>
      بانتظار التقييم
    </Badge>
  )
}
