import type { LucideIcon } from 'lucide-react'
import { TrendingDown, TrendingUp } from 'lucide-react'
import { cn } from '../../lib/utils'

type Accent = 'primary' | 'info' | 'warning' | 'success' | 'error' | 'gold' | 'neutral'

const accents: Record<Accent, string> = {
  primary: 'bg-primary-50 text-primary-700',
  info: 'bg-info-50 text-info-600',
  warning: 'bg-warning-50 text-warning-600',
  success: 'bg-success-50 text-success-600',
  error: 'bg-error-50 text-error-600',
  gold: 'bg-secondary-50 text-secondary-600',
  neutral: 'bg-muted text-ink-2',
}

interface Props {
  label: string
  value: string | number
  icon: LucideIcon
  accent?: Accent
  trend?: { value: string; up: boolean; good?: boolean }
  hint?: string
  className?: string
}

export function StatCard({ label, value, icon: Icon, accent = 'primary', trend, hint, className }: Props) {
  const good = trend?.good ?? trend?.up
  return (
    <div className={cn('rounded-card border border-line bg-surface p-4 shadow-card sm:p-5', className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm text-ink-2">{label}</p>
          <p className="mt-1.5 text-2xl font-bold tracking-tight text-ink sm:text-[28px]">{value}</p>
        </div>
        <span className={cn('grid size-10 shrink-0 place-items-center rounded-lg sm:size-11', accents[accent])}>
          <Icon className="size-5" />
        </span>
      </div>
      {(trend || hint) && (
        <div className="mt-3 flex items-center gap-2 text-xs">
          {trend && (
            <span className={cn('inline-flex items-center gap-0.5 font-medium', good ? 'text-success-600' : 'text-error-600')}>
              {trend.up ? <TrendingUp className="size-3.5" /> : <TrendingDown className="size-3.5" />}
              {trend.value}
            </span>
          )}
          {hint && <span className="text-ink-3">{hint}</span>}
        </div>
      )}
    </div>
  )
}
