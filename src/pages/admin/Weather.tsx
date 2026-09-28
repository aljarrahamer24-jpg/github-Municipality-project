import { AlertTriangle, Bell, CalendarDays, CheckCircle2, Droplets, MapPin, Thermometer, Wind } from 'lucide-react'
import { RiskMap } from '../../components/map/MapView'
import { Badge, type Tone } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card, CardBody, CardHeader } from '../../components/ui/Card'
import { Checkbox } from '../../components/ui/Form'
import { Progress } from '../../components/ui/Misc'
import { PageHeader } from '../../components/ui/PageHeader'
import { getDistrict, sensitiveAreas, weatherAlerts } from '../../data/mock'
import { getIcon } from '../../lib/icons'
import { cn, formatDate } from '../../lib/utils'

const riskLabel = { high: 'خطورة عالية', medium: 'خطورة متوسطة', low: 'خطورة منخفضة' }
const riskTone: Record<string, Tone> = { high: 'error', medium: 'warning', low: 'success' }

export default function Weather() {
  const main = weatherAlerts[0]
  const Icon = getIcon(main.icon)
  const max = Math.max(...sensitiveAreas.map((a) => a.floods))
  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[{ label: 'الرئيسية', to: '/admin' }, { label: 'الاستعداد للحالات الجوية' }]}
        title="الاستعداد للحالات الجوية"
        description="تنبيه استباقي يربط توقعات الطقس بسجل البلاغات التاريخي لتحديد المناطق الأكثر عرضة للمشاكل."
        actions={<Button icon={Bell} variant="accent">إرسال تنبيه للفرق الميدانية</Button>}
      />

      {/* بطاقة الحالة الجوية */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-l from-slate-700 to-slate-900 p-5 text-white sm:p-7">
        <div className="absolute -end-10 -top-10 size-60 rounded-full bg-info-500/20 blur-3xl" />
        <div className="relative grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="flex items-start gap-4">
            <span className="grid size-16 shrink-0 place-items-center rounded-2xl bg-white/10"><Icon className="size-9" /></span>
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-bold sm:text-2xl">{main.type}</h2>
                <span className="inline-flex items-center gap-1 rounded-full bg-error-500 px-2.5 py-0.5 text-xs font-semibold"><AlertTriangle className="size-3.5" /> مستوى الخطورة: مرتفع</span>
              </div>
              <p className="max-w-xl text-sm leading-relaxed text-white/75">{main.description}</p>
              <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-white/85">
                <span className="inline-flex items-center gap-1.5"><CalendarDays className="size-4" /> من {formatDate(main.start)}</span>
                <span className="inline-flex items-center gap-1.5"><CalendarDays className="size-4" /> إلى {formatDate(main.end)}</span>
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            {[
              { icon: Droplets, k: 'الأمطار', v: main.rainfall },
              { icon: Wind, k: 'الرياح', v: main.wind },
              { icon: Thermometer, k: 'الحرارة', v: main.temp },
            ].map((m) => (
              <div key={m.k} className="rounded-lg bg-white/10 px-3 py-3">
                <m.icon className="mx-auto size-5 text-white/70" />
                <p className="mt-1 text-sm font-bold whitespace-nowrap">{m.v}</p>
                <p className="text-[11px] text-white/60">{m.k}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <Card>
          <CardHeader title="المناطق الحساسة" subtitle="مرتبة حسب عدد المشاكل التاريخية المرتبطة بالأمطار والفيضانات" />
          <div className="divide-y divide-line">
            {sensitiveAreas.map((a) => {
              const d = getDistrict(a.districtId)
              return (
                <div key={a.districtId} className="grid gap-3 p-4 sm:grid-cols-[1fr_200px] sm:items-center sm:px-5">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <MapPin className="size-4 text-ink-3" />
                      <p className="font-semibold">{d.name}</p>
                      <span className="text-ink-3">—</span>
                      <p className="font-semibold text-error-700">{a.floods} بلاغ فيضانات سابقة</p>
                      <Badge tone={riskTone[a.risk]}>{riskLabel[a.risk]}</Badge>
                    </div>
                    <p className="text-xs text-ink-3">آخر حادثة: {a.lastIncident} · إجراءات مقترحة: {a.actions.join('، ')}</p>
                  </div>
                  <Progress value={(a.floods / max) * 100} tone={a.risk === 'high' ? 'error' : a.risk === 'medium' ? 'warning' : 'success'} />
                </div>
              )
            })}
          </div>
        </Card>
        <div className="space-y-6">
          <Card className="overflow-hidden">
            <CardHeader title="خريطة المخاطر" />
            <RiskMap className="h-72 rounded-none border-0" areas={sensitiveAreas.map((a) => { const d = getDistrict(a.districtId); return { name: d.name, lat: d.lat, lng: d.lng, count: a.floods, risk: a.risk } })} />
          </Card>
          <Card>
            <CardHeader title="قائمة الاستعداد" subtitle="3 من 6 مهام مكتملة" />
            <CardBody className="space-y-3">
              {['تنظيف مناهل تصريف الأمطار في وسط البلد', 'تجهيز مضخات الشفط الاحتياطية', 'رفع جاهزية فرق الطوارئ', 'إغلاق النفق عند ارتفاع المنسوب', 'إشعار سكان المناطق الحساسة', 'التنسيق مع الدفاع المدني'].map((t, i) => (
                <Checkbox key={t} label={<span className={cn(i < 3 && 'text-ink-3 line-through')}>{t}</span>} defaultChecked={i < 3} />
              ))}
            </CardBody>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader title="تنبيهات قادمة" />
        <div className="divide-y divide-line">
          {weatherAlerts.map((w) => {
            const WIcon = getIcon(w.icon)
            return (
              <div key={w.id} className="flex flex-wrap items-center gap-4 p-4 sm:px-5">
                <span className="grid size-11 place-items-center rounded-lg bg-info-50 text-info-600"><WIcon className="size-5" /></span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{w.type}</p>
                  <p className="text-sm text-ink-3">{formatDate(w.start)} — {formatDate(w.end)}</p>
                </div>
                <Badge tone={w.severity === 'high' ? 'error' : 'warning'} icon={w.severity === 'high' ? AlertTriangle : CheckCircle2}>{w.severity === 'high' ? 'مرتفع' : 'متوسط'}</Badge>
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}
