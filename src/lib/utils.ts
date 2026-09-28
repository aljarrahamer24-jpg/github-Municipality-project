import { clsx, type ClassValue } from 'clsx'

export const cn = (...inputs: ClassValue[]) => clsx(inputs)

// أرقام لاتينية مع نصوص عربية (المعتمد في أغلب المنصات الحكومية)
const LOCALE = 'ar-u-nu-latn'

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString(LOCALE, { year: 'numeric', month: 'short', day: 'numeric' })

export const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString(LOCALE, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })

export const formatNumber = (n: number) => n.toLocaleString(LOCALE)

export const timeAgo = (iso: string) => {
  const days = Math.round((new Date('2026-09-28T10:00:00').getTime() - new Date(iso).getTime()) / 86400000)
  if (days <= 0) return 'اليوم'
  if (days === 1) return 'أمس'
  if (days === 2) return 'منذ يومين'
  if (days <= 10) return `منذ ${days} أيام`
  return `منذ ${days} يوماً`
}
