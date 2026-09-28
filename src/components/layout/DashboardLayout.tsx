import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import {
  BarChart3, Bell, Briefcase, ClipboardList, CloudRainWind, FileBarChart, KeyRound, LayoutDashboard, Layers, Map, MapPinned, Menu, Repeat, Search, Settings, Smile, Tags, Users, X,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { Brand } from './Brand'
import { UserMenu } from './UserMenu'

type NavItem = { to: string; label: string; icon: LucideIcon; end?: boolean; badge?: number }
type NavGroup = { title?: string; items: NavItem[] }

const employeeNav: NavGroup[] = [
  {
    items: [
      { to: '/employee', label: 'لوحة التحكم', icon: LayoutDashboard, end: true },
      { to: '/employee/complaints', label: 'البلاغات', icon: ClipboardList, badge: 12 },
      { to: '/employee/map', label: 'خريطة البلاغات', icon: Map },
    ],
  },
]

const adminNav: NavGroup[] = [
  {
    items: [
      { to: '/admin', label: 'الرئيسية', icon: LayoutDashboard, end: true },
      { to: '/admin/complaints', label: 'جميع البلاغات', icon: ClipboardList, badge: 87 },
    ],
  },
  {
    title: 'التحليل والذكاء',
    items: [
      { to: '/admin/map', label: 'خريطة البلاغات', icon: Map },
      { to: '/admin/recurring', label: 'المشاكل المتكررة', icon: Repeat },
      { to: '/admin/weather', label: 'الاستعداد للحالات الجوية', icon: CloudRainWind },
      { to: '/admin/reports', label: 'التقارير الشهرية', icon: FileBarChart },
      { to: '/admin/satisfaction', label: 'رضا المواطنين', icon: Smile },
    ],
  },
  {
    title: 'إدارة النظام',
    items: [
      { to: '/admin/users', label: 'المستخدمون', icon: Users },
      { to: '/admin/employees', label: 'الموظفون', icon: Briefcase },
      { to: '/admin/departments', label: 'الأقسام', icon: Layers },
      { to: '/admin/categories', label: 'أنواع المشاكل', icon: Tags },
      { to: '/admin/districts', label: 'المناطق', icon: MapPinned },
      { to: '/admin/keywords', label: 'الكلمات المفتاحية', icon: KeyRound },
      { to: '/admin/settings', label: 'إعدادات النظام', icon: Settings },
    ],
  },
]

export function DashboardLayout({ role }: { role: 'employee' | 'admin' }) {
  const [open, setOpen] = useState(false)
  const groups = role === 'admin' ? adminNav : employeeNav

  const sidebar = (
    <div className="flex h-full flex-col bg-sidebar text-white/75">
      <div className="flex h-16 items-center justify-between px-4">
        <Brand to={`/${role}`} light />
        <button onClick={() => setOpen(false)} className="grid size-9 place-items-center rounded-md hover:bg-white/10 lg:hidden" aria-label="إغلاق">
          <X className="size-5" />
        </button>
      </div>
      <div className="mx-4 mb-2 rounded-md bg-white/5 px-3 py-2 text-xs">
        {role === 'admin' ? 'لوحة مدير البلدية' : 'بوابة موظف البلدية — قسم الطرق'}
      </div>
      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-3">
        {groups.map((g, i) => (
          <div key={i}>
            {g.title && <p className="mb-1.5 px-3 text-[11px] font-semibold tracking-wide text-white/40">{g.title}</p>}
            <ul className="space-y-0.5">
              {g.items.map((n) => (
                <li key={n.to}>
                  <NavLink
                    to={n.to}
                    end={n.end}
                    onClick={() => setOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
                        isActive ? 'bg-white text-primary-800 shadow-xs' : 'hover:bg-white/10 hover:text-white',
                      )
                    }
                  >
                    <n.icon className="size-[18px] shrink-0" />
                    <span className="flex-1">{n.label}</span>
                    {n.badge && <span className="rounded-full bg-secondary-500 px-1.5 text-[11px] font-semibold text-white">{n.badge}</span>}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
      <div className="border-t border-white/10 p-4 text-[11px] text-white/40">الإصدار 1.0 — نموذج تصميم</div>
    </div>
  )

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[260px_1fr]">
      {/* Sidebar ثابت على الشاشات الكبيرة */}
      <aside className="no-print sticky top-0 hidden h-dvh lg:block">{sidebar}</aside>
      {/* Drawer على الموبايل والتابلت */}
      <div className={cn('fixed inset-0 z-50 lg:hidden', open ? 'visible' : 'invisible')}>
        <div className={cn('absolute inset-0 bg-ink/50 transition-opacity', open ? 'opacity-100' : 'opacity-0')} onClick={() => setOpen(false)} />
        <div className={cn('absolute inset-y-0 start-0 w-72 transition-transform', open ? 'translate-x-0' : 'translate-x-full')}>{sidebar}</div>
      </div>

      <div className="flex min-w-0 flex-col">
        <header className="no-print sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-surface/95 px-4 backdrop-blur sm:px-6">
          <button onClick={() => setOpen(true)} className="grid size-10 place-items-center rounded-md hover:bg-muted lg:hidden" aria-label="القائمة">
            <Menu className="size-6" />
          </button>
          <div className="relative hidden max-w-md flex-1 md:block">
            <Search className="pointer-events-none absolute start-3 top-1/2 size-4.5 -translate-y-1/2 text-ink-3" />
            <input placeholder="بحث سريع برقم البلاغ..." className="h-10 w-full rounded-md border border-line bg-canvas ps-10 pe-3 text-sm focus:border-primary-500 focus:bg-surface focus:outline-none" />
          </div>
          <div className="ms-auto flex items-center gap-1">
            <button className="grid size-10 place-items-center rounded-md text-ink-2 hover:bg-muted md:hidden" aria-label="بحث">
              <Search className="size-5" />
            </button>
            <button className="relative grid size-10 place-items-center rounded-md text-ink-2 hover:bg-muted" aria-label="الإشعارات">
              <Bell className="size-5" />
              <span className="absolute end-2 top-2 size-2 rounded-full bg-error-500 ring-2 ring-surface" />
            </button>
            <button className="hidden size-10 place-items-center rounded-md text-ink-2 hover:bg-muted sm:grid" aria-label="الإحصائيات">
              <BarChart3 className="size-5" />
            </button>
            <UserMenu name={role === 'admin' ? 'م. خالد العمري' : 'أحمد سعيد'} role={role === 'admin' ? 'مدير البلدية' : 'موظف — قسم الطرق'} />
          </div>
        </header>
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
