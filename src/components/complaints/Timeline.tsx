import { CheckCircle2, CircleDot, Loader, Lock, MessageSquare, Search, UserCog, XCircle, type LucideIcon } from 'lucide-react'
import type { TimelineEvent } from '../../data/types'
import { cn, formatDateTime } from '../../lib/utils'

const meta: Record<TimelineEvent['status'], { icon: LucideIcon; cls: string }> = {
  new: { icon: CircleDot, cls: 'bg-info-50 text-info-600 ring-info-100' },
  in_review: { icon: Search, cls: 'bg-violet-50 text-violet-600 ring-violet-100' },
  assigned: { icon: UserCog, cls: 'bg-primary-50 text-primary-700 ring-primary-100' },
  in_progress: { icon: Loader, cls: 'bg-warning-50 text-warning-600 ring-warning-100' },
  resolved: { icon: CheckCircle2, cls: 'bg-success-50 text-success-600 ring-success-100' },
  closed: { icon: Lock, cls: 'bg-muted text-ink-2 ring-line' },
  rejected: { icon: XCircle, cls: 'bg-error-50 text-error-600 ring-error-100' },
  comment: { icon: MessageSquare, cls: 'bg-muted text-ink-2 ring-line' },
}

export function Timeline({ events }: { events: TimelineEvent[] }) {
  const list = [...events].reverse()
  return (
    <ol className="relative space-y-5">
      {list.map((e, i) => {
        const m = meta[e.status]
        return (
          <li key={e.id} className="relative flex gap-3">
            {i < list.length - 1 && <span className="absolute start-[17px] top-9 bottom-[-20px] w-px bg-line" aria-hidden />}
            <span className={cn('relative z-10 grid size-9 shrink-0 place-items-center rounded-full ring-4', m.cls, i === 0 && 'ring-offset-2')}>
              <m.icon className="size-4.5" />
            </span>
            <div className="min-w-0 flex-1 pt-1">
              <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-0.5">
                <p className={cn('text-sm font-semibold', i === 0 ? 'text-ink' : 'text-ink-2')}>{e.title}</p>
                <time className="text-xs text-ink-3">{formatDateTime(e.at)}</time>
              </div>
              {e.note && <p className="mt-1 text-sm leading-relaxed text-ink-2">{e.note}</p>}
              <p className="mt-1 text-xs text-ink-3">بواسطة: {e.by}</p>
            </div>
          </li>
        )
      })}
    </ol>
  )
}

// مؤشر مراحل مبسط للمواطن (Stepper أفقي)
const steps = [
  { key: 'new', label: 'تم الاستلام' },
  { key: 'in_review', label: 'المراجعة' },
  { key: 'in_progress', label: 'المعالجة' },
  { key: 'resolved', label: 'تم الحل' },
  { key: 'closed', label: 'مغلق' },
]
export function StatusStepper({ status }: { status: string }) {
  const idx = status === 'rejected' ? 1 : steps.findIndex((s) => s.key === status)
  return (
    <ol className="flex items-start">
      {steps.map((s, i) => {
        const done = i <= idx
        const current = i === idx
        return (
          <li key={s.key} className="relative flex flex-1 flex-col items-center text-center">
            {i > 0 && <span className={cn('absolute end-1/2 top-3.5 h-0.5 w-full', i <= idx ? 'bg-primary-600' : 'bg-line')} aria-hidden />}
            <span
              className={cn(
                'relative z-10 grid size-7 place-items-center rounded-full border-2 text-xs font-bold',
                done ? 'border-primary-600 bg-primary-600 text-white' : 'border-line-strong bg-surface text-ink-3',
                current && 'ring-4 ring-primary-100',
              )}
            >
              {done && !current ? '✓' : i + 1}
            </span>
            <span className={cn('mt-2 text-[11px] leading-tight sm:text-xs', done ? 'font-medium text-ink' : 'text-ink-3')}>{s.label}</span>
          </li>
        )
      })}
    </ol>
  )
}
