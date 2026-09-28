import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Briefcase, ChevronDown, LogOut, ShieldCheck, User, UserCog } from 'lucide-react'
import { cn } from '../../lib/utils'
import { Avatar } from '../ui/Misc'

const roles = [
  { to: '/citizen', label: 'واجهة المواطن', icon: User },
  { to: '/employee', label: 'واجهة الموظف', icon: Briefcase },
  { to: '/admin', label: 'لوحة المدير', icon: ShieldCheck },
]

// قائمة المستخدم + مبدّل الأدوار (للعرض التجريبي فقط — يُستبدل بالصلاحيات لاحقاً)
export function UserMenu({ name, role, light }: { name: string; role: string; light?: boolean }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  useEffect(() => {
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false)
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen((o) => !o)} className={cn('flex items-center gap-2 rounded-md p-1 pe-2 hover:bg-muted', light && 'hover:bg-white/10')}>
        <Avatar name={name} size="sm" />
        <span className="hidden text-start leading-tight sm:block">
          <span className="block text-sm font-semibold">{name}</span>
          <span className="block text-[11px] text-ink-3">{role}</span>
        </span>
        <ChevronDown className="hidden size-4 text-ink-3 sm:block" />
      </button>
      {open && (
        <div className="absolute end-0 top-full z-50 mt-2 w-60 overflow-hidden rounded-lg border border-line bg-surface shadow-pop">
          <div className="border-b border-line p-3">
            <p className="text-sm font-semibold">{name}</p>
            <p className="text-xs text-ink-3">{role}</p>
          </div>
          <div className="p-1.5">
            <Link to="/citizen/profile" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-md px-2.5 py-2 text-sm hover:bg-muted">
              <UserCog className="size-4 text-ink-3" /> الملف الشخصي
            </Link>
          </div>
          <div className="border-t border-line p-1.5">
            <p className="px-2.5 pt-1 pb-1.5 text-[11px] font-semibold text-ink-3">التبديل بين الأدوار (عرض تجريبي)</p>
            {roles.map((r) => (
              <button
                key={r.to}
                onClick={() => {
                  setOpen(false)
                  navigate(r.to)
                }}
                className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-sm hover:bg-muted"
              >
                <r.icon className="size-4 text-ink-3" /> {r.label}
              </button>
            ))}
          </div>
          <div className="border-t border-line p-1.5">
            <Link to="/login" className="flex items-center gap-2 rounded-md px-2.5 py-2 text-sm text-error-600 hover:bg-error-50">
              <LogOut className="size-4" /> تسجيل الخروج
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
