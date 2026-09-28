import { forwardRef, useState, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import { ChevronDown, Eye, EyeOff, type LucideIcon } from 'lucide-react'
import { cn } from '../../lib/utils'

const base =
  'w-full rounded-md border bg-surface text-sm text-ink placeholder:text-ink-3 transition-colors focus:outline-none focus:ring-4 disabled:cursor-not-allowed disabled:bg-muted'
const state = (error?: boolean) =>
  error
    ? 'border-error-500 focus:border-error-500 focus:ring-error-100'
    : 'border-line-strong hover:border-ink-3 focus:border-primary-500 focus:ring-primary-100'

interface FieldProps {
  label?: ReactNode
  hint?: ReactNode
  error?: string
  required?: boolean
  htmlFor?: string
  className?: string
  children: ReactNode
}

export function Field({ label, hint, error, required, htmlFor, className, children }: FieldProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <label htmlFor={htmlFor} className="block text-sm font-medium text-ink">
          {label}
          {required && <span className="ms-0.5 text-error-600">*</span>}
        </label>
      )}
      {children}
      {error ? <p className="text-xs text-error-600">{error}</p> : hint && <p className="text-xs text-ink-3">{hint}</p>}
    </div>
  )
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: LucideIcon
  error?: boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({ icon: Icon, error, className, type, ...rest }, ref) => {
  const [show, setShow] = useState(false)
  const isPassword = type === 'password'
  return (
    <div className="relative">
      {Icon && <Icon className="pointer-events-none absolute start-3 top-1/2 size-4.5 -translate-y-1/2 text-ink-3" />}
      <input
        ref={ref}
        type={isPassword && show ? 'text' : type}
        className={cn(base, state(error), 'h-11 px-3', Icon && 'ps-10', isPassword && 'pe-10', className)}
        {...rest}
      />
      {isPassword && (
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute end-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-md text-ink-3 hover:bg-muted hover:text-ink"
          aria-label={show ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
        >
          {show ? <EyeOff className="size-4.5" /> : <Eye className="size-4.5" />}
        </button>
      )}
    </div>
  )
})

export function Textarea({ error, className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement> & { error?: boolean }) {
  return <textarea className={cn(base, state(error), 'min-h-28 px-3 py-2.5 leading-relaxed', className)} {...rest} />
}

export function Select({ error, className, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement> & { error?: boolean }) {
  return (
    <div className="relative">
      <select className={cn(base, state(error), 'h-11 appearance-none ps-3 pe-9', className)} {...rest}>
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute end-3 top-1/2 size-4 -translate-y-1/2 text-ink-3" />
    </div>
  )
}

export function Checkbox({ label, className, ...rest }: InputHTMLAttributes<HTMLInputElement> & { label: ReactNode }) {
  return (
    <label className={cn('inline-flex cursor-pointer items-center gap-2 text-sm text-ink-2', className)}>
      <input type="checkbox" className="size-4 rounded border-line-strong accent-primary-700" {...rest} />
      {label}
    </label>
  )
}

export function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: ReactNode }) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-3 text-sm text-ink">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn('relative h-6 w-11 shrink-0 rounded-full transition-colors', checked ? 'bg-primary-600' : 'bg-line-strong')}
      >
        <span
          className={cn(
            'absolute top-0.5 size-5 rounded-full bg-white shadow-xs transition-all',
            checked ? 'start-[22px]' : 'start-0.5',
          )}
        />
      </button>
      {label}
    </label>
  )
}
