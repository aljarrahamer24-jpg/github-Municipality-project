import { useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { Mail, Menu, Phone, MapPin, X } from 'lucide-react'
import { cn } from '../../lib/utils'
import { Button } from '../ui/Button'
import { Brand } from './Brand'

const links = [
  { to: '/', label: 'الرئيسية' },
  { to: '/#services', label: 'الخدمات' },
  { to: '/#how', label: 'كيف تعمل المنصة' },
  { to: '/track', label: 'متابعة بلاغ' },
]

export function PublicHeader() {
  const [open, setOpen] = useState(false)
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface/90 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Brand />
        <nav className="hidden items-center gap-1 lg:flex">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} className="rounded-md px-3 py-2 text-sm font-medium text-ink-2 hover:bg-muted hover:text-ink">
              {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="hidden items-center gap-2 lg:flex">
          <Button variant="ghost" to="/login">
            تسجيل الدخول
          </Button>
          <Button to="/register">إنشاء حساب</Button>
        </div>
        <button onClick={() => setOpen(true)} className="grid size-10 place-items-center rounded-md hover:bg-muted lg:hidden" aria-label="القائمة">
          <Menu className="size-6" />
        </button>
      </div>
      {/* Drawer للموبايل */}
      <div className={cn('fixed inset-0 z-50 lg:hidden', open ? 'visible' : 'invisible')}>
        <div className={cn('absolute inset-0 bg-ink/40 transition-opacity', open ? 'opacity-100' : 'opacity-0')} onClick={() => setOpen(false)} />
        <div className={cn('absolute inset-y-0 start-0 flex w-72 flex-col bg-surface p-4 shadow-modal transition-transform', open ? 'translate-x-0' : 'translate-x-full')}>
          <div className="mb-6 flex items-center justify-between">
            <Brand />
            <button onClick={() => setOpen(false)} className="grid size-9 place-items-center rounded-md hover:bg-muted" aria-label="إغلاق">
              <X className="size-5" />
            </button>
          </div>
          <nav className="flex flex-col gap-1">
            {links.map((l) => (
              <Link key={l.to} to={l.to} onClick={() => setOpen(false)} className="rounded-md px-3 py-3 font-medium hover:bg-muted">
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="mt-auto grid gap-2">
            <Button variant="outline" to="/login" block>
              تسجيل الدخول
            </Button>
            <Button to="/register" block>
              إنشاء حساب
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}

export function Footer() {
  return (
    <footer className="bg-primary-950 text-white/70">
      <div className="container-page grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-4 sm:col-span-2 lg:col-span-1">
          <Brand light />
          <p className="text-sm leading-relaxed">منصة رقمية رسمية لاستقبال شكاوى وطلبات المواطنين ومتابعتها بشفافية حتى إغلاقها.</p>
        </div>
        <div>
          <h4 className="mb-3 font-semibold text-white">روابط سريعة</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/citizen/new" className="hover:text-white">تقديم بلاغ</Link></li>
            <li><Link to="/track" className="hover:text-white">متابعة بلاغ</Link></li>
            <li><Link to="/#services" className="hover:text-white">الخدمات البلدية</Link></li>
            <li><Link to="/screens" className="hover:text-white">فهرس الشاشات</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 font-semibold text-white">الدعم</h4>
          <ul className="space-y-2 text-sm">
            <li>الأسئلة الشائعة</li>
            <li>سياسة الخصوصية</li>
            <li>شروط الاستخدام</li>
            <li>إمكانية الوصول</li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 font-semibold text-white">تواصل معنا</h4>
          <ul className="space-y-2.5 text-sm">
            <li className="flex items-center gap-2"><Phone className="size-4" /><span dir="ltr">1800-000-000</span></li>
            <li className="flex items-center gap-2"><Mail className="size-4" />info@municipality.example</li>
            <li className="flex items-center gap-2"><MapPin className="size-4" />مبنى البلدية — وسط البلد</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-page flex flex-wrap items-center justify-between gap-2 py-4 text-xs">
          <p>© 2026 بلدية المدينة — جميع الحقوق محفوظة</p>
          <p>نموذج تصميم (UI Prototype) — البيانات المعروضة تجريبية</p>
        </div>
      </div>
    </footer>
  )
}

export function PublicLayout() {
  return (
    <div className="flex min-h-dvh flex-col">
      <PublicHeader />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
