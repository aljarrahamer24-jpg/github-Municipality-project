import { useState } from 'react'
import { CheckCircle2, Circle, Lock, ShieldCheck } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Field, Input } from '../../components/ui/Form'
import { cn } from '../../lib/utils'

export default function ResetPassword() {
  const [pw, setPw] = useState('')
  const [done, setDone] = useState(false)
  const rules = [
    { ok: pw.length >= 8, label: '8 أحرف على الأقل' },
    { ok: /[A-Z]/.test(pw), label: 'حرف كبير واحد على الأقل' },
    { ok: /\d/.test(pw), label: 'رقم واحد على الأقل' },
    { ok: /[^A-Za-z0-9]/.test(pw), label: 'رمز خاص (!@#...)' },
  ]
  const strength = rules.filter((r) => r.ok).length
  if (done)
    return (
      <div className="text-center">
        <span className="mx-auto grid size-16 place-items-center rounded-full bg-success-50 text-success-600">
          <ShieldCheck className="size-8" />
        </span>
        <h1 className="mt-5 text-2xl font-bold">تم تغيير كلمة المرور</h1>
        <p className="mt-2 text-sm text-ink-2">يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة.</p>
        <Button to="/login" block className="mt-6">
          تسجيل الدخول
        </Button>
      </div>
    )
  return (
    <div>
      <h1 className="text-2xl font-bold">إعادة تعيين كلمة المرور</h1>
      <p className="mt-2 text-sm text-ink-2">اختر كلمة مرور قوية لم تستخدمها من قبل.</p>
      <form
        className="mt-6 space-y-4"
        onSubmit={(e) => {
          e.preventDefault()
          setDone(true)
        }}
      >
        <Field label="كلمة المرور الجديدة">
          <Input icon={Lock} type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="••••••••" />
        </Field>
        <div className="space-y-2">
          <div className="grid grid-cols-4 gap-1">
            {[0, 1, 2, 3].map((i) => (
              <span key={i} className={cn('h-1.5 rounded-full', i < strength ? (strength < 3 ? 'bg-warning-500' : 'bg-success-500') : 'bg-muted')} />
            ))}
          </div>
          <ul className="grid gap-1 text-xs sm:grid-cols-2">
            {rules.map((r) => (
              <li key={r.label} className={cn('flex items-center gap-1.5', r.ok ? 'text-success-600' : 'text-ink-3')}>
                {r.ok ? <CheckCircle2 className="size-3.5" /> : <Circle className="size-3.5" />}
                {r.label}
              </li>
            ))}
          </ul>
        </div>
        <Field label="تأكيد كلمة المرور">
          <Input icon={Lock} type="password" placeholder="••••••••" />
        </Field>
        <Button type="submit" block size="lg" disabled={strength < 3}>
          حفظ كلمة المرور
        </Button>
      </form>
    </div>
  )
}
