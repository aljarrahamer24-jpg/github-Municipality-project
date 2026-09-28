import { useState } from 'react'
import { Download, Lock, Mail, Plus, Search, Send, Trash2 } from 'lucide-react'
import { OverdueBadge, PriorityBadge, StatusBadge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card, CardBody, CardHeader } from '../../components/ui/Card'
import { Checkbox, Field, Input, Select, Switch, Textarea } from '../../components/ui/Form'
import { Alert, Progress, Stars, Tabs } from '../../components/ui/Misc'
import { PageHeader } from '../../components/ui/PageHeader'
import { StatCard } from '../../components/ui/StatCard'
import { ComplaintsTable } from '../../components/complaints/ComplaintsTable'
import { complaints } from '../../data/mock'
import type { ComplaintStatus, Priority } from '../../data/types'

const palette = [
  { name: 'Primary', note: 'أخضر مؤسسي — الأزرار والروابط والهوية', shades: ['#effaf7', '#d5f1ea', '#aee2d6', '#7ccbbb', '#47ad9b', '#28917f', '#1a7467', '#0b5d51', '#0a4a42', '#093d37'] },
  { name: 'Secondary', note: 'ذهبي رملي — الإبراز والتقييم', shades: ['#fbf7ef', '#f4ead3', '#e8d3a6', '#dbb872', '#d1a250', '#c8963e', '#a97630', '#87592a', '#704927', '#5f3e25'] },
]
const semantic = [
  ['Success', '#16a34a', 'تم الحل / نجاح'],
  ['Warning', '#d97706', 'قيد المعالجة / تنبيه'],
  ['Error', '#dc2626', 'متأخر / مرفوض / خطأ'],
  ['Info', '#2563eb', 'جديد / معلومة'],
]
const neutrals = [
  ['Canvas', '#f5f7f6', 'خلفية الصفحة'],
  ['Surface', '#ffffff', 'البطاقات'],
  ['Muted', '#eef2f1', 'رؤوس الجداول'],
  ['Sidebar', '#0a3f38', 'القائمة الجانبية'],
  ['Ink', '#0f1f1c', 'نص أساسي'],
  ['Ink 2', '#43524f', 'نص ثانوي'],
  ['Ink 3', '#7a8784', 'نص خافت'],
  ['Line', '#e2e8e6', 'الحدود'],
  ['Line strong', '#cbd5d2', 'حدود الحقول'],
]

export default function DesignSystem() {
  const [tab, setTab] = useState<'a' | 'b' | 'c'>('a')
  const [sw, setSw] = useState(true)
  const [r, setR] = useState(4)
  return (
    <div className="container-page space-y-8 py-10">
      <PageHeader title="نظام التصميم — Design System" description="المكونات والألوان والخطوط المعتمدة في جميع واجهات المنصة." />

      <Card>
        <CardHeader title="الألوان" subtitle="كل الألوان معرّفة كـ Tokens في src/index.css" />
        <CardBody className="space-y-6">
          {palette.map((p) => (
            <div key={p.name}>
              <p className="mb-2 text-sm font-semibold">{p.name} <span className="font-normal text-ink-3">— {p.note}</span></p>
              <div className="grid grid-cols-5 gap-1 overflow-hidden rounded-lg sm:grid-cols-10">
                {p.shades.map((s, i) => (
                  <div key={s} className="h-16 p-1.5 text-[10px]" style={{ background: s, color: i > 4 ? '#fff' : '#0f1f1c' }}>
                    <p>{[50, 100, 200, 300, 400, 500, 600, 700, 800, 900][i]}</p>
                    <p dir="ltr" className="opacity-80">{s}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {semantic.map(([n, c, d]) => (
              <div key={n} className="overflow-hidden rounded-lg border border-line">
                <div className="h-14" style={{ background: c }} />
                <div className="p-2.5 text-xs"><p className="font-semibold">{n} <span dir="ltr" className="text-ink-3">{c}</span></p><p className="text-ink-3">{d}</p></div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-3 md:grid-cols-9">
            {neutrals.map(([n, c, d]) => (
              <div key={n} className="text-xs">
                <div className="h-12 rounded-md border border-line" style={{ background: c }} />
                <p className="mt-1 font-semibold">{n}</p>
                <p className="text-ink-3">{d}</p>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="الخط — IBM Plex Sans Arabic" subtitle="خط رسمي واضح يدعم العربية واللاتينية بنفس الروح" />
          <CardBody className="space-y-3">
            <p className="text-4xl font-bold">عنوان رئيسي 36/700</p>
            <p className="text-2xl font-bold">عنوان صفحة 24/700</p>
            <p className="text-lg font-semibold">عنوان قسم 18/600</p>
            <p className="text-base">نص أساسي 16/400 — منصة إدارة شكاوى وطلبات خدمات البلدية</p>
            <p className="text-sm text-ink-2">نص ثانوي 14/400 — يستخدم في الوصف والجداول</p>
            <p className="text-xs text-ink-3">نص صغير 12/400 — تواريخ وتلميحات</p>
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="الزوايا والظلال" />
          <CardBody className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[['6px', 'rounded-sm', 'Badges صغيرة'], ['10px', 'rounded-md', 'أزرار/حقول'], ['14px', 'rounded-lg', 'بطاقات'], ['20px', 'rounded-xl', 'Modals']].map(([v, c, d]) => (
              <div key={v} className="text-center text-xs"><div className={`mx-auto size-16 border-2 border-primary-600 bg-primary-50 ${c}`} /><p className="mt-2 font-semibold">{v}</p><p className="text-ink-3">{d}</p></div>
            ))}
            {[['shadow-xs', 'xs'], ['shadow-card', 'card'], ['shadow-pop', 'pop'], ['shadow-modal', 'modal']].map(([c, n]) => (
              <div key={n} className="text-center text-xs"><div className={`mx-auto size-16 rounded-lg bg-surface ${c}`} /><p className="mt-2 font-semibold">{n}</p></div>
            ))}
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader title="الأزرار" />
        <CardBody className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button icon={Plus}>Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline" icon={Download}>Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="accent" icon={Send}>Accent</Button>
            <Button variant="danger" icon={Trash2}>Danger</Button>
            <Button disabled>Disabled</Button>
            <Button loading>جارٍ الحفظ</Button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm">Small 36px</Button>
            <Button size="md">Medium 44px</Button>
            <Button size="lg">Large 48px</Button>
            <Button icon={Search} variant="outline" aria-label="بحث" />
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="شارات الحالات والأولوية" subtitle="كل شارة = لون + أيقونة + نص (لا نعتمد على اللون وحده)" />
        <CardBody className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {(['new', 'in_review', 'in_progress', 'resolved', 'closed', 'rejected'] as ComplaintStatus[]).map((s) => <StatusBadge key={s} status={s} />)}
            <OverdueBadge />
          </div>
          <div className="flex flex-wrap gap-2">
            {(['low', 'medium', 'high', 'urgent'] as Priority[]).map((p) => <PriorityBadge key={p} priority={p} />)}
          </div>
        </CardBody>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="الحقول" />
          <CardBody className="space-y-4">
            <Field label="بريد إلكتروني" required hint="نص مساعد أسفل الحقل"><Input icon={Mail} placeholder="name@example.com" /></Field>
            <Field label="كلمة المرور"><Input icon={Lock} type="password" defaultValue="secret123" /></Field>
            <Field label="حقل بخطأ" error="هذا الحقل مطلوب"><Input error placeholder="..." /></Field>
            <Field label="قائمة منسدلة"><Select><option>خيار 1</option></Select></Field>
            <Field label="نص طويل"><Textarea placeholder="اكتب هنا..." /></Field>
            <div className="flex flex-wrap gap-6"><Checkbox label="خانة اختيار" defaultChecked /><Switch checked={sw} onChange={setSw} label="مفتاح تبديل" /></div>
          </CardBody>
        </Card>
        <div className="space-y-6">
          <Card>
            <CardHeader title="Tabs / Rating / Progress" />
            <CardBody className="space-y-5">
              <Tabs value={tab} onChange={setTab} tabs={[{ id: 'a', label: 'الكل', count: 48 }, { id: 'b', label: 'جديد', count: 6 }, { id: 'c', label: 'مغلق' }]} />
              <Stars value={r} onChange={setR} size="lg" />
              <Progress value={72} />
              <Progress value={45} tone="warning" />
            </CardBody>
          </Card>
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="إجمالي البلاغات" value="1,349" icon={Plus} trend={{ value: '8%', up: true }} />
            <StatCard label="المتأخرة" value="12" icon={Trash2} accent="error" />
          </div>
          <Alert tone="info" title="تنبيه معلوماتي">نص التنبيه.</Alert>
          <Alert tone="success" title="تمت العملية بنجاح" />
          <Alert tone="warning" title="تحذير" />
          <Alert tone="error" title="حدث خطأ" />
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold">الجدول (Search + Filters + Sorting + Pagination)</h2>
        <ComplaintsTable data={complaints.slice(0, 12)} basePath="/employee/complaints" pageSize={5} />
      </div>
    </div>
  )
}
