import { useState } from 'react'
import { Bell, Building, Save, ShieldCheck, Sparkles, Timer } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Card, CardBody, CardHeader } from '../../components/ui/Card'
import { Field, Input, Select, Switch, Textarea } from '../../components/ui/Form'
import { PageHeader } from '../../components/ui/PageHeader'
import { cn } from '../../lib/utils'

const sections = [
  { id: 'general', label: 'الإعدادات العامة', icon: Building },
  { id: 'complaints', label: 'البلاغات و SLA', icon: Timer },
  { id: 'notifications', label: 'الإشعارات', icon: Bell },
  { id: 'smart', label: 'التحليل الذكي', icon: Sparkles },
  { id: 'security', label: 'الأمان', icon: ShieldCheck },
]

export default function Settings() {
  const [active, setActive] = useState('general')
  const [t, setT] = useState<Record<string, boolean>>({ sms: true, email: true, push: false, auto: true, recurring: true, weather: true, twofa: true, anon: false })
  const tog = (k: string) => (v: boolean) => setT((p) => ({ ...p, [k]: v }))
  return (
    <div>
      <PageHeader breadcrumbs={[{ label: 'الرئيسية', to: '/admin' }, { label: 'إعدادات النظام' }]} title="إعدادات النظام" description="تحكم في الإعدادات العامة وقواعد العمل للمنصة." actions={<Button icon={Save}>حفظ الإعدادات</Button>} />
      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        <nav className="-mx-4 flex gap-1 overflow-x-auto px-4 lg:mx-0 lg:flex-col lg:px-0">
          {sections.map((s) => (
            <a key={s.id} href={`#${s.id}`} onClick={() => setActive(s.id)} className={cn('flex shrink-0 items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium', active === s.id ? 'bg-primary-50 text-primary-800' : 'text-ink-2 hover:bg-muted')}>
              <s.icon className="size-4" /> {s.label}
            </a>
          ))}
        </nav>
        <div className="space-y-6">
          <Card id="general" className="scroll-mt-20">
            <CardHeader title="الإعدادات العامة" />
            <CardBody className="grid gap-4 sm:grid-cols-2">
              <Field label="اسم البلدية"><Input defaultValue="بلدية المدينة" /></Field>
              <Field label="اسم المنصة"><Input defaultValue="منصة إدارة شكاوى وطلبات خدمات البلدية" /></Field>
              <Field label="رقم الطوارئ"><Input defaultValue="1800-000-000" dir="ltr" className="text-end" /></Field>
              <Field label="البريد الرسمي"><Input defaultValue="info@municipality.example" /></Field>
              <Field label="اللغة الافتراضية"><Select><option>العربية</option><option>English</option></Select></Field>
              <Field label="المنطقة الزمنية"><Select><option>Asia/Amman (GMT+3)</option></Select></Field>
              <Field label="نص الترحيب في الصفحة الرئيسية" className="sm:col-span-2"><Textarea defaultValue="منصة موحّدة لتقديم الشكاوى وطلبات الخدمات البلدية ومتابعتها بشفافية." rows={3} /></Field>
            </CardBody>
          </Card>
          <Card id="complaints" className="scroll-mt-20">
            <CardHeader title="البلاغات و SLA" />
            <CardBody className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="الحد الأقصى للصور"><Input type="number" defaultValue={5} /></Field>
                <Field label="حجم الصورة الأقصى (MB)"><Input type="number" defaultValue={5} /></Field>
                <Field label="الإغلاق التلقائي بعد (أيام)" hint="بعد تغيير الحالة إلى تم الحل"><Input type="number" defaultValue={3} /></Field>
              </div>
              <Switch checked={t.auto} onChange={tog('auto')} label="الإحالة التلقائية للقسم المختص حسب نوع المشكلة" />
              <Switch checked={t.anon} onChange={tog('anon')} label="السماح بالبلاغات دون تسجيل دخول" />
            </CardBody>
          </Card>
          <Card id="notifications" className="scroll-mt-20">
            <CardHeader title="الإشعارات" />
            <CardBody className="space-y-4">
              <Switch checked={t.sms} onChange={tog('sms')} label="الرسائل النصية SMS" />
              <Switch checked={t.email} onChange={tog('email')} label="البريد الإلكتروني" />
              <Switch checked={t.push} onChange={tog('push')} label="إشعارات المتصفح" />
            </CardBody>
          </Card>
          <Card id="smart" className="scroll-mt-20">
            <CardHeader title="التحليل الذكي" />
            <CardBody className="space-y-4">
              <Switch checked={t.recurring} onChange={tog('recurring')} label="اكتشاف المشاكل المتكررة تلقائياً" />
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="عدد البلاغات الأدنى"><Input type="number" defaultValue={3} /></Field>
                <Field label="نطاق المسافة (متر)"><Input type="number" defaultValue={200} /></Field>
                <Field label="الفترة (أشهر)"><Input type="number" defaultValue={6} /></Field>
              </div>
              <Switch checked={t.weather} onChange={tog('weather')} label="التنبيه الاستباقي للحالات الجوية" />
            </CardBody>
          </Card>
          <Card id="security" className="scroll-mt-20">
            <CardHeader title="الأمان" />
            <CardBody className="space-y-4">
              <Switch checked={t.twofa} onChange={tog('twofa')} label="التحقق بخطوتين للموظفين والمدراء" />
              <Field label="انتهاء الجلسة بعد (دقيقة)" className="sm:w-60"><Input type="number" defaultValue={30} /></Field>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  )
}
