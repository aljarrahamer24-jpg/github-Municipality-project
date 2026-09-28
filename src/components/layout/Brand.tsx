import { Link } from 'react-router-dom'
import { cn } from '../../lib/utils'

export function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={cn('size-10', className)} aria-hidden>
      <rect width="40" height="40" rx="11" fill="#0b5d51" />
      <path d="M10 30V18l10-7.5L30 18v12h-6.5v-7h-7v7z" fill="#fff" />
      <circle cx="20" cy="16.5" r="2" fill="#c8963e" />
    </svg>
  )
}

export function Brand({ to = '/', light, compact }: { to?: string; light?: boolean; compact?: boolean }) {
  return (
    <Link to={to} className="flex items-center gap-2.5">
      <Logo className="shrink-0" />
      {!compact && (
        <span className="leading-tight">
          <span className={cn('block text-[15px] font-bold', light ? 'text-white' : 'text-ink')}>بلدية المدينة</span>
          <span className={cn('block text-[11px]', light ? 'text-white/60' : 'text-ink-3')}>منصة الشكاوى والخدمات</span>
        </span>
      )}
    </Link>
  )
}
