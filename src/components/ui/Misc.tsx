import { useEffect, type ReactNode } from 'react'
import { AlertTriangle, CheckCircle2, ImageIcon, Info, Star, X, XCircle, type LucideIcon } from 'lucide-react'
import { cn } from '../../lib/utils'

/* ---------- Tabs ---------- */
export function Tabs<T extends string>({ tabs, value, onChange, className }: { tabs: { id: T; label: string; count?: number }[]; value: T; onChange: (v: T) => void; className?: string }) {
  return (
    <div className={cn('-mx-1 flex gap-1 overflow-x-auto px-1 pb-px', className)} role="tablist">
      {tabs.map((t) => (
        <button
          key={t.id}
          role="tab"
          aria-selected={value === t.id}
          onClick={() => onChange(t.id)}
          className={cn(
            'inline-flex h-9 shrink-0 items-center gap-1.5 rounded-md px-3 text-sm font-medium transition-colors',
            value === t.id ? 'bg-primary-700 text-white' : 'text-ink-2 hover:bg-muted',
          )}
        >
          {t.label}
          {t.count !== undefined && (
            <span className={cn('rounded-full px-1.5 text-xs', value === t.id ? 'bg-white/20' : 'bg-muted text-ink-3')}>{t.count}</span>
          )}
        </button>
      ))}
    </div>
  )
}

/* ---------- Modal ---------- */
export function Modal({ open, onClose, title, children, footer, size = 'md' }: { open: boolean; onClose: () => void; title: ReactNode; children: ReactNode; footer?: ReactNode; size?: 'sm' | 'md' | 'lg' }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]" onClick={onClose} />
      <div
        className={cn(
          'relative flex max-h-[92vh] w-full flex-col rounded-t-xl bg-surface shadow-modal sm:rounded-xl',
          size === 'sm' ? 'sm:max-w-md' : size === 'md' ? 'sm:max-w-lg' : 'sm:max-w-2xl',
        )}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="text-base font-semibold">{title}</h2>
          <button onClick={onClose} className="grid size-8 place-items-center rounded-md text-ink-3 hover:bg-muted" aria-label="إغلاق">
            <X className="size-5" />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-line px-5 py-3">{footer}</div>}
      </div>
    </div>
  )
}

/* ---------- Empty State ---------- */
export function EmptyState({ icon: Icon, title, description, action }: { icon: LucideIcon; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center px-6 py-12 text-center">
      <span className="grid size-14 place-items-center rounded-full bg-primary-50 text-primary-700">
        <Icon className="size-7" />
      </span>
      <h3 className="mt-4 font-semibold">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-ink-2">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

/* ---------- Alert ---------- */
const alertTones = {
  info: { cls: 'bg-info-50 border-info-100 text-info-700', icon: Info },
  success: { cls: 'bg-success-50 border-success-100 text-success-700', icon: CheckCircle2 },
  warning: { cls: 'bg-warning-50 border-warning-100 text-warning-700', icon: AlertTriangle },
  error: { cls: 'bg-error-50 border-error-100 text-error-700', icon: XCircle },
}
export function Alert({ tone = 'info', title, children, className }: { tone?: keyof typeof alertTones; title?: string; children?: ReactNode; className?: string }) {
  const t = alertTones[tone]
  return (
    <div className={cn('flex gap-3 rounded-lg border p-3.5 text-sm', t.cls, className)} role="status">
      <t.icon className="mt-0.5 size-5 shrink-0" />
      <div className="space-y-0.5">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className="leading-relaxed opacity-90">{children}</div>}
      </div>
    </div>
  )
}

/* ---------- Avatar ---------- */
export function Avatar({ name, size = 'md', className }: { name: string; size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const initials = name.replace(/^(م\.|أ\.)\s*/, '').split(' ').slice(0, 2).map((p) => p[0]).join(' ')
  return (
    <span
      className={cn(
        'inline-grid shrink-0 place-items-center rounded-full bg-primary-100 font-semibold text-primary-800',
        size === 'sm' ? 'size-8 text-xs' : size === 'md' ? 'size-10 text-sm' : 'size-14 text-lg',
        className,
      )}
      aria-hidden
    >
      {initials}
    </span>
  )
}

/* ---------- Progress ---------- */
export function Progress({ value, tone = 'primary', className }: { value: number; tone?: 'primary' | 'success' | 'warning' | 'error' | 'gold'; className?: string }) {
  const c = { primary: 'bg-primary-600', success: 'bg-success-500', warning: 'bg-warning-500', error: 'bg-error-500', gold: 'bg-secondary-500' }[tone]
  return (
    <div className={cn('h-2 w-full overflow-hidden rounded-full bg-muted', className)}>
      <div className={cn('h-full rounded-full', c)} style={{ width: `${Math.min(100, value)}%` }} />
    </div>
  )
}

/* ---------- Rating ---------- */
export function Stars({ value, size = 'md', onChange }: { value: number; size?: 'sm' | 'md' | 'lg'; onChange?: (v: number) => void }) {
  const s = { sm: 'size-4', md: 'size-5', lg: 'size-10' }[size]
  return (
    <div className="inline-flex items-center gap-0.5" aria-label={`${value} من 5`}>
      {[1, 2, 3, 4, 5].map((i) => {
        const filled = i <= Math.round(value)
        const star = <Star className={cn(s, filled ? 'fill-secondary-400 text-secondary-400' : 'fill-muted text-line-strong')} />
        return onChange ? (
          <button key={i} type="button" onClick={() => onChange(i)} className="rounded-md p-0.5 transition-transform hover:scale-110" aria-label={`${i} نجوم`}>
            {star}
          </button>
        ) : (
          <span key={i}>{star}</span>
        )
      })}
    </div>
  )
}

/* ---------- Photo placeholder (بديل الصور الحقيقية في مرحلة التصميم) ---------- */
const photoTones = ['from-primary-200 to-primary-400', 'from-secondary-200 to-secondary-400', 'from-slate-200 to-slate-400', 'from-emerald-200 to-teal-400']
export function Photo({ seed = 0, label, className }: { seed?: number; label?: string; className?: string }) {
  return (
    <div className={cn('relative grid place-items-center overflow-hidden rounded-lg bg-gradient-to-br text-white/90', photoTones[seed % photoTones.length], className)}>
      <ImageIcon className="size-7" />
      {label && <span className="absolute bottom-1.5 start-1.5 rounded bg-black/40 px-1.5 py-0.5 text-[10px]">{label}</span>}
    </div>
  )
}

/* ---------- Pagination ---------- */
export function Pagination({ page, pages, onChange, total }: { page: number; pages: number; onChange: (p: number) => void; total: number }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-3 text-sm text-ink-2">
      <span>
        إجمالي <b className="text-ink">{total}</b> نتيجة
      </span>
      <div className="flex items-center gap-1">
        <button disabled={page === 1} onClick={() => onChange(page - 1)} className="h-8 rounded-md border border-line px-3 hover:bg-muted disabled:opacity-40">
          السابق
        </button>
        {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
          <button
            key={p}
            onClick={() => onChange(p)}
            className={cn('hidden size-8 rounded-md sm:inline-block', p === page ? 'bg-primary-700 text-white' : 'hover:bg-muted')}
          >
            {p}
          </button>
        ))}
        <span className="px-2 sm:hidden">
          {page} / {pages}
        </span>
        <button disabled={page === pages} onClick={() => onChange(page + 1)} className="h-8 rounded-md border border-line px-3 hover:bg-muted disabled:opacity-40">
          التالي
        </button>
      </div>
    </div>
  )
}

/* ---------- Section title (للصفحات العامة) ---------- */
export function SectionTitle({ eyebrow, title, description, center }: { eyebrow?: string; title: string; description?: string; center?: boolean }) {
  return (
    <div className={cn('max-w-2xl', center && 'mx-auto text-center')}>
      {eyebrow && <p className="text-sm font-semibold text-secondary-600">{eyebrow}</p>}
      <h2 className="mt-1 text-2xl font-bold text-ink sm:text-3xl">{title}</h2>
      {description && <p className="mt-3 leading-relaxed text-ink-2">{description}</p>}
    </div>
  )
}
