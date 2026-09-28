import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Briefcase, Lock, Mail, ShieldCheck, User } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Checkbox, Field, Input } from '../../components/ui/Form'
import { cn } from '../../lib/utils'

const demo = [
  { id: 'citizen', label: 'مواطن', icon: User, to: '/citizen' },
  { id: 'employee', label: 'موظف', icon: Briefcase, to: '/employee' },
  { id: 'admin', label: 'مدير', icon: ShieldCheck, to: '/admin' },
]

export default function Login() {
  const navigate = useNavigate()
  const [role, setRole] = useState('citizen')
  const [loading, setLoading] = useState(false)
  return (
    <div>
      <h1 className="text-2xl font-bold">تسجيل الدخول</h1>
      <p className="mt-2 text-sm text-ink-2">مرحباً بعودتك، سجّل دخولك لمتابعة بلاغاتك.</p>

      {/* اختيار الدور — للعرض التجريبي فقط */}
      <div className="mt-6 rounded-lg border border-dashed border-secondary-300 bg-secondary-50 p-3">
        <p className="mb-2 text-xs font-semibold text-secondary-700">دخول تجريبي (مرحلة التصميم)</p>
        <div className="grid grid-cols-3 gap-2">
          {demo.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => setRole(d.id)}
              className={cn(
                'flex flex-col items-center gap-1 rounded-md border py-2 text-xs font-medium transition-colors',
                role === d.id ? 'border-primary-600 bg-surface text-primary-800 ring-2 ring-primary-100' : 'border-line bg-surface/60 text-ink-2 hover:bg-surface',
              )}
            >
              <d.icon className="size-4.5" />
              {d.label}
            </button>
          ))}
        </div>
      </div>

      <form
        className="mt-6 space-y-4"
        onSubmit={(e) => {
          e.preventDefault()
          setLoading(true)
          setTimeout(() => navigate(demo.find((d) => d.id === role)!.to), 500)
        }}
      >
        <Field label="البريد الإلكتروني أو رقم الهاتف" htmlFor="email">
          <Input id="email" icon={Mail} placeholder="name@example.com" defaultValue="abdullah@example.com" />
        </Field>
        <Field label="كلمة المرور" htmlFor="password">
          <Input id="password" icon={Lock} type="password" placeholder="••••••••" defaultValue="password123" />
        </Field>
        <div className="flex items-center justify-between">
          <Checkbox label="تذكرني" defaultChecked />
          <Link to="/forgot-password" className="text-sm font-medium text-primary-700 hover:underline">
            نسيت كلمة المرور؟
          </Link>
        </div>
        <Button type="submit" block size="lg" loading={loading}>
          تسجيل الدخول
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-ink-2">
        ليس لديك حساب؟{' '}
        <Link to="/register" className="font-semibold text-primary-700 hover:underline">
          إنشاء حساب جديد
        </Link>
      </p>
    </div>
  )
}
