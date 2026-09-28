import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, KeyRound, Mail, MailCheck } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Field, Input } from '../../components/ui/Form'

export default function ForgotPassword() {
  const [sent, setSent] = useState(false)
  if (sent)
    return (
      <div className="text-center">
        <span className="mx-auto grid size-16 place-items-center rounded-full bg-success-50 text-success-600">
          <MailCheck className="size-8" />
        </span>
        <h1 className="mt-5 text-2xl font-bold">تحقق من بريدك الإلكتروني</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-2">أرسلنا رابط إعادة تعيين كلمة المرور إلى بريدك. الرابط صالح لمدة 30 دقيقة.</p>
        <div className="mt-6 grid gap-2">
          <Button to="/reset-password" block>
            فتح رابط إعادة التعيين (تجريبي)
          </Button>
          <Button variant="ghost" onClick={() => setSent(false)} block>
            لم يصلك البريد؟ إعادة الإرسال
          </Button>
        </div>
      </div>
    )
  return (
    <div>
      <span className="grid size-12 place-items-center rounded-xl bg-primary-50 text-primary-700">
        <KeyRound className="size-6" />
      </span>
      <h1 className="mt-5 text-2xl font-bold">نسيت كلمة المرور؟</h1>
      <p className="mt-2 text-sm text-ink-2">أدخل بريدك الإلكتروني المسجل وسنرسل لك رابطاً لإعادة تعيين كلمة المرور.</p>
      <form
        className="mt-6 space-y-4"
        onSubmit={(e) => {
          e.preventDefault()
          setSent(true)
        }}
      >
        <Field label="البريد الإلكتروني">
          <Input icon={Mail} type="email" placeholder="name@example.com" required />
        </Field>
        <Button type="submit" block size="lg">
          إرسال رابط إعادة التعيين
        </Button>
      </form>
      <Link to="/login" className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-ink-2 hover:text-primary-700">
        <ArrowRight className="size-4" /> العودة لتسجيل الدخول
      </Link>
    </div>
  )
}
