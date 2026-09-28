import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'
import { cn } from '../../lib/utils'

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'accent'
type Size = 'sm' | 'md' | 'lg'

const variants: Record<Variant, string> = {
  primary: 'bg-primary-700 text-white hover:bg-primary-800 active:bg-primary-900 shadow-xs',
  secondary: 'bg-primary-50 text-primary-800 hover:bg-primary-100',
  outline: 'border border-line-strong bg-surface text-ink hover:bg-muted',
  ghost: 'text-ink-2 hover:bg-muted hover:text-ink',
  danger: 'bg-error-600 text-white hover:bg-error-700 shadow-xs',
  accent: 'bg-secondary-500 text-white hover:bg-secondary-600 shadow-xs',
}

const sizes: Record<Size, string> = {
  sm: 'h-9 px-3 text-sm gap-1.5',
  md: 'h-11 px-4 text-sm gap-2',
  lg: 'h-12 px-6 text-base gap-2',
}

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  icon?: LucideIcon
  iconEnd?: LucideIcon
  to?: string
  block?: boolean
  loading?: boolean
  children?: ReactNode
}

export function Button({ variant = 'primary', size = 'md', icon: Icon, iconEnd: IconEnd, to, block, loading, className, children, ...rest }: Props) {
  // يسمح بإخفاء الزر عبر className="hidden md:inline-flex" دون تعارض مع inline-flex الافتراضي
  const hiddenByDefault = /(^|\s)hidden(\s|$)/.test(className ?? '')
  const classes = cn(
    !hiddenByDefault && 'inline-flex',
    'items-center justify-center rounded-md font-medium whitespace-nowrap transition-colors disabled:pointer-events-none disabled:opacity-50',
    variants[variant],
    sizes[size],
    block && 'w-full',
    !children && (size === 'sm' ? 'w-9 px-0' : size === 'md' ? 'w-11 px-0' : 'w-12 px-0'),
    className,
  )
  const content = (
    <>
      {loading ? (
        <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : (
        Icon && <Icon className="size-[1.15em] shrink-0" />
      )}
      {children}
      {IconEnd && <IconEnd className="size-[1.15em] shrink-0" />}
    </>
  )
  if (to) {
    return (
      <Link to={to} className={classes}>
        {content}
      </Link>
    )
  }
  return (
    <button className={classes} {...rest}>
      {content}
    </button>
  )
}
