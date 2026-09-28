import { NavLink, Outlet } from 'react-router-dom'
import { Bell, FileText, LayoutDashboard, Plus, User } from 'lucide-react'
import { cn } from '../../lib/utils'
import { Button } from '../ui/Button'
import { Brand } from './Brand'
import { Footer } from './PublicLayout'
import { UserMenu } from './UserMenu'

const nav = [
  { to: '/citizen', label: 'لوحتي', icon: LayoutDashboard, end: true },
  { to: '/citizen/complaints', label: 'بلاغاتي', icon: FileText },
  { to: '/citizen/notifications', label: 'الإشعارات', icon: Bell },
  { to: '/citizen/profile', label: 'حسابي', icon: User },
]

export function CitizenLayout() {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-40 border-b border-line bg-surface/95 backdrop-blur">
        <div className="container-page flex h-16 items-center justify-between gap-4">
          <Brand to="/" />
          <nav className="hidden items-center gap-1 md:flex">
            {nav.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.end}
                className={({ isActive }) =>
                  cn('inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium', isActive ? 'bg-primary-50 text-primary-800' : 'text-ink-2 hover:bg-muted')
                }
              >
                <n.icon className="size-4" />
                {n.label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Button to="/citizen/new" icon={Plus} className="hidden md:inline-flex">
              بلاغ جديد
            </Button>
            <NavLink to="/citizen/notifications" className="relative grid size-10 place-items-center rounded-md text-ink-2 hover:bg-muted md:hidden" aria-label="الإشعارات">
              <Bell className="size-5" />
              <span className="absolute end-2 top-2 size-2 rounded-full bg-error-500 ring-2 ring-surface" />
            </NavLink>
            <UserMenu name="عبدالله محمود" role="مواطن" />
          </div>
        </div>
      </header>
      <main className="container-page flex-1 py-6 pb-28 sm:py-8 md:pb-10">
        <Outlet />
      </main>
      <div className="hidden md:block">
        <Footer />
      </div>
      {/* شريط تنقل سفلي للموبايل مع زر بلاغ جديد في المنتصف */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] md:hidden">
        <div className="grid grid-cols-5 items-end">
          {nav.slice(0, 2).map((n) => (
            <TabItem key={n.to} {...n} />
          ))}
          <div className="flex justify-center">
            <NavLink to="/citizen/new" className="-mt-6 grid size-14 place-items-center rounded-full bg-primary-700 text-white shadow-pop ring-4 ring-surface" aria-label="بلاغ جديد">
              <Plus className="size-7" />
            </NavLink>
          </div>
          {nav.slice(2).map((n) => (
            <TabItem key={n.to} {...n} />
          ))}
        </div>
      </nav>
    </div>
  )
}

function TabItem({ to, label, icon: Icon, end }: (typeof nav)[number]) {
  return (
    <NavLink to={to} end={end} className={({ isActive }) => cn('flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium', isActive ? 'text-primary-700' : 'text-ink-3')}>
      <Icon className="size-5" />
      {label}
    </NavLink>
  )
}
