import { Outlet } from 'react-router-dom'
import { CheckCircle2 } from 'lucide-react'
import { Brand } from './Brand'

export function AuthLayout() {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <div className="flex flex-col px-4 py-6 sm:px-10">
        <Brand />
        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-md">
            <Outlet />
          </div>
        </div>
        <p className="text-center text-xs text-ink-3">© 2026 بلدية المدينة</p>
      </div>
      {/* لوحة الهوية — تظهر على الشاشات الكبيرة فقط */}
      <aside className="relative hidden overflow-hidden bg-primary-800 p-12 text-white lg:flex lg:flex-col lg:justify-end">
        <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)', backgroundSize: '22px 22px' }} />
        <div className="absolute -top-24 -start-24 size-96 rounded-full bg-primary-600/40 blur-3xl" />
        <div className="absolute -bottom-32 -end-10 size-96 rounded-full bg-secondary-500/20 blur-3xl" />
        <div className="relative max-w-md space-y-6">
          <span className="inline-block rounded-full bg-white/10 px-3 py-1 text-xs">الخدمات البلدية الإلكترونية</span>
          <h2 className="text-3xl leading-snug font-bold">بلّغ عن المشكلة في دقيقة، وتابعها حتى تُحل.</h2>
          <ul className="space-y-3 text-white/80">
            {['تقديم البلاغ مع الصور والموقع الدقيق', 'متابعة حالة البلاغ لحظة بلحظة', 'تقييم الخدمة بعد الإغلاق'].map((t) => (
              <li key={t} className="flex items-center gap-2">
                <CheckCircle2 className="size-5 text-secondary-300" />
                {t}
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  )
}
