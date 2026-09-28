import { Link, useNavigate } from 'react-router-dom'
import { CreditCard, Lock, Mail, Phone, User } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Checkbox, Field, Input, Select } from '../../components/ui/Form'
import { districts } from '../../data/mock'

export default function Register() {
  const navigate = useNavigate()
  return (
    <div>
      <h1 className="text-2xl font-bold">إنشاء حساب جديد</h1>
      <p className="mt-2 text-sm text-ink-2">أنشئ حسابك كمواطن لتقديم البلاغات ومتابعتها.</p>
      <form
        className="mt-6 space-y-4"
        onSubmit={(e) => {
          e.preventDefault()
          navigate('/citizen')
        }}
      >
        <Field label="الاسم الكامل" required>
          <Input icon={User} placeholder="الاسم الرباعي" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="رقم الهاتف" required>
            <Input icon={Phone} placeholder="07XXXXXXXX" dir="ltr" className="text-end" />
          </Field>
          <Field label="الرقم الوطني" hint="اختياري">
            <Input icon={CreditCard} placeholder="0000000000" dir="ltr" className="text-end" />
          </Field>
        </div>
        <Field label="البريد الإلكتروني" required>
          <Input icon={Mail} type="email" placeholder="name@example.com" />
        </Field>
        <Field label="منطقة السكن">
          <Select defaultValue="">
            <option value="" disabled>
              اختر المنطقة
            </option>
            {districts.map((d) => (
              <option key={d.id}>{d.name}</option>
            ))}
          </Select>
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="كلمة المرور" required hint="8 أحرف على الأقل">
            <Input icon={Lock} type="password" placeholder="••••••••" />
          </Field>
          <Field label="تأكيد كلمة المرور" required>
            <Input icon={Lock} type="password" placeholder="••••••••" />
          </Field>
        </div>
        <Checkbox label={<>أوافق على <a className="font-medium text-primary-700 underline">شروط الاستخدام</a> وسياسة الخصوصية</>} />
        <Button type="submit" block size="lg">
          إنشاء الحساب
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-ink-2">
        لديك حساب بالفعل؟{' '}
        <Link to="/login" className="font-semibold text-primary-700 hover:underline">
          تسجيل الدخول
        </Link>
      </p>
    </div>
  )
}
