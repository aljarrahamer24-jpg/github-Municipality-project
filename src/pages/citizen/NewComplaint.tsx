import { useState } from 'react'
import { ArrowLeft, ArrowRight, Check, CheckCircle2, Copy, Info, LocateFixed, MapPin, Send } from 'lucide-react'
import { FileUpload } from '../../components/complaints/FileUpload'
import { LocationPicker } from '../../components/map/MapView'
import { Button } from '../../components/ui/Button'
import { Card, CardBody } from '../../components/ui/Card'
import { Checkbox, Field, Input, Select, Textarea } from '../../components/ui/Form'
import { Alert } from '../../components/ui/Misc'
import { MAP_CENTER, categories, districts, getDepartment } from '../../data/mock'
import { getIcon } from '../../lib/icons'
import { cn } from '../../lib/utils'

const steps = ['نوع المشكلة', 'التفاصيل والصور', 'الموقع', 'المراجعة والإرسال']

export default function NewComplaint() {
  const [step, setStep] = useState(0)
  const [cat, setCat] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  const [pos, setPos] = useState<[number, number] | null>(null)
  const [district, setDistrict] = useState('')
  const [landmark, setLandmark] = useState('')
  const [sent, setSent] = useState(false)
  const [tried, setTried] = useState(false)

  const category = categories.find((c) => c.id === cat)
  const valid = [!!cat, title.trim().length >= 5 && desc.trim().length >= 15, !!pos && !!district, true]

  const next = () => {
    setTried(true)
    if (!valid[step]) return
    setTried(false)
    if (step === 3) setSent(true)
    else setStep((s) => s + 1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (sent) return <Success />

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">تقديم بلاغ جديد</h1>
        <p className="mt-1 text-sm text-ink-2">أربع خطوات بسيطة — يستغرق أقل من دقيقتين.</p>
      </div>

      {/* Stepper */}
      <ol className="mb-6 grid grid-cols-4 gap-2">
        {steps.map((s, i) => (
          <li key={s} className="space-y-2">
            <div className={cn('h-1.5 rounded-full', i <= step ? 'bg-primary-600' : 'bg-line')} />
            <p className={cn('flex items-center gap-1.5 text-xs', i === step ? 'font-semibold text-primary-800' : i < step ? 'text-ink-2' : 'text-ink-3')}>
              <span className={cn('hidden size-5 place-items-center rounded-full text-[11px] sm:grid', i < step ? 'bg-primary-600 text-white' : i === step ? 'bg-primary-100 text-primary-800' : 'bg-muted')}>
                {i < step ? <Check className="size-3" /> : i + 1}
              </span>
              <span className={cn(i !== step && 'hidden sm:inline')}>{s}</span>
            </p>
          </li>
        ))}
      </ol>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <Card>
          <CardBody className="space-y-5 pb-6">
            {step === 0 && (
              <>
                <div>
                  <h2 className="font-semibold">ما نوع المشكلة؟</h2>
                  <p className="mt-1 text-sm text-ink-3">سيتم تحويل البلاغ تلقائياً للقسم المختص.</p>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {categories
                    .filter((c) => c.active)
                    .map((c) => {
                      const Icon = getIcon(c.icon)
                      const active = cat === c.id
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setCat(c.id)}
                          className={cn(
                            'relative flex flex-col items-start gap-3 rounded-lg border p-3.5 text-start transition-all sm:p-4',
                            active ? 'border-primary-600 bg-primary-50 ring-2 ring-primary-100' : 'border-line hover:border-primary-300 hover:bg-canvas',
                          )}
                        >
                          <span className={cn('grid size-10 place-items-center rounded-lg', active ? 'bg-primary-700 text-white' : 'bg-muted text-ink-2')}>
                            <Icon className="size-5" />
                          </span>
                          <span className="text-sm font-semibold">{c.name}</span>
                          {active && <CheckCircle2 className="absolute end-2.5 top-2.5 size-5 text-primary-700" />}
                        </button>
                      )
                    })}
                </div>
                {tried && !valid[0] && <p className="text-sm text-error-600">يرجى اختيار نوع المشكلة للمتابعة.</p>}
              </>
            )}

            {step === 1 && (
              <>
                <Field label="عنوان البلاغ" required error={tried && title.trim().length < 5 ? 'اكتب عنواناً مختصراً (5 أحرف على الأقل)' : undefined} hint="مثال: حفرة كبيرة أمام مدرسة الحي">
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="عنوان مختصر يصف المشكلة" error={tried && title.trim().length < 5} maxLength={80} />
                </Field>
                <Field label="وصف المشكلة" required error={tried && desc.trim().length < 15 ? 'يرجى كتابة وصف أوضح (15 حرفاً على الأقل)' : undefined}>
                  <Textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={5} maxLength={600} placeholder="صف المشكلة بالتفصيل: منذ متى، مدى خطورتها، وأي معلومات تساعد الفريق..." error={tried && desc.trim().length < 15} />
                  <p className="text-end text-xs text-ink-3">{desc.length} / 600</p>
                </Field>
                <Field label="صور المشكلة" hint="الصور الواضحة تسرّع معالجة البلاغ">
                  <FileUpload />
                </Field>
              </>
            )}

            {step === 2 && (
              <>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="font-semibold">حدد موقع المشكلة</h2>
                    <p className="mt-1 text-sm text-ink-3">اضغط على الخريطة أو اسحب الدبوس لتحديد الموقع بدقة.</p>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={LocateFixed}
                    onClick={() => {
                      setPos([MAP_CENTER[0] + 0.002, MAP_CENTER[1] - 0.003])
                      setDistrict('z-1')
                    }}
                  >
                    استخدم موقعي الحالي
                  </Button>
                </div>
                <div className="relative">
                  <LocationPicker value={pos} onChange={setPos} className="h-72 sm:h-96" />
                  {!pos && (
                    <div className="pointer-events-none absolute inset-x-0 top-3 flex justify-center">
                      <span className="rounded-full bg-ink/80 px-3 py-1.5 text-xs text-white">اضغط على الخريطة لوضع الدبوس</span>
                    </div>
                  )}
                </div>
                {pos && (
                  <p className="flex items-center gap-1.5 text-xs text-ink-2">
                    <MapPin className="size-3.5 text-primary-700" /> الإحداثيات: <span dir="ltr">{pos[0].toFixed(5)}, {pos[1].toFixed(5)}</span>
                  </p>
                )}
                {tried && !pos && <p className="text-sm text-error-600">يرجى تحديد الموقع على الخريطة.</p>}
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="المنطقة / الحي" required error={tried && !district ? 'اختر المنطقة' : undefined}>
                    <Select value={district} onChange={(e) => setDistrict(e.target.value)} error={tried && !district}>
                      <option value="" disabled>
                        اختر المنطقة
                      </option>
                      {districts.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="أقرب معلم / وصف الموقع" hint="اختياري">
                    <Input value={landmark} onChange={(e) => setLandmark(e.target.value)} placeholder="مثال: بجانب مسجد الحي" />
                  </Field>
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <h2 className="font-semibold">راجع بيانات البلاغ قبل الإرسال</h2>
                <dl className="divide-y divide-line rounded-lg border border-line">
                  {[
                    ['نوع المشكلة', category?.name, 0],
                    ['القسم المختص', category && getDepartment(category.departmentId).name, 0],
                    ['العنوان', title, 1],
                    ['الوصف', desc, 1],
                    ['المنطقة', districts.find((d) => d.id === district)?.name, 2],
                    ['الموقع', landmark || 'محدد على الخريطة', 2],
                  ].map(([k, v, s]) => (
                    <div key={k as string} className="grid gap-1 p-3 sm:grid-cols-[140px_1fr_auto] sm:items-start sm:gap-3">
                      <dt className="text-sm text-ink-3">{k}</dt>
                      <dd className="text-sm leading-relaxed font-medium">{v}</dd>
                      <button onClick={() => setStep(s as number)} className="justify-self-start text-xs font-medium text-primary-700 hover:underline">
                        تعديل
                      </button>
                    </div>
                  ))}
                </dl>
                <Checkbox label="أتعهد بصحة المعلومات المقدمة" defaultChecked />
                <Checkbox label="أرغب باستلام إشعارات عبر الرسائل النصية" defaultChecked />
              </>
            )}
          </CardBody>

          {/* أزرار التنقل — ثابتة أسفل الشاشة على الموبايل */}
          <div className="sticky bottom-[72px] flex items-center justify-between gap-3 rounded-b-card border-t border-line bg-surface/95 p-3 backdrop-blur sm:p-4 md:bottom-0">
            <Button variant="ghost" icon={ArrowRight} onClick={() => setStep((s) => s - 1)} disabled={step === 0}>
              السابق
            </Button>
            <Button onClick={next} iconEnd={step === 3 ? Send : ArrowLeft} size="lg" className="min-w-36">
              {step === 3 ? 'إرسال البلاغ' : 'التالي'}
            </Button>
          </div>
        </Card>

        {/* ملخص جانبي — سطح المكتب */}
        <aside className="hidden space-y-4 lg:block">
          <Card>
            <CardBody className="space-y-3 text-sm">
              <h3 className="font-semibold">ملخص البلاغ</h3>
              <Row k="النوع" v={category?.name} />
              <Row k="القسم" v={category && getDepartment(category.departmentId).name} />
              <Row k="العنوان" v={title} />
              <Row k="المنطقة" v={districts.find((d) => d.id === district)?.name} />
              {category && <Row k="المدة المتوقعة" v={`${category.slaDays} أيام عمل`} />}
            </CardBody>
          </Card>
          <Alert tone="info" title="نصائح لبلاغ أسرع">
            <ul className="list-disc space-y-1 ps-4">
              <li>أرفق صورة واضحة من مسافة قريبة وأخرى بعيدة.</li>
              <li>حدد الموقع بدقة على الخريطة.</li>
              <li>بلاغ واحد لكل مشكلة.</li>
            </ul>
          </Alert>
        </aside>
      </div>
    </div>
  )
}

function Row({ k, v }: { k: string; v?: string }) {
  return (
    <div className="flex justify-between gap-3 border-b border-dashed border-line pb-2 last:border-0">
      <span className="text-ink-3">{k}</span>
      <span className={cn('text-end font-medium', !v && 'text-ink-3')}>{v || '—'}</span>
    </div>
  )
}

function Success() {
  return (
    <div className="mx-auto max-w-lg py-6 text-center">
      <span className="mx-auto grid size-20 place-items-center rounded-full bg-success-50 text-success-600 ring-8 ring-success-50/50">
        <CheckCircle2 className="size-10" />
      </span>
      <h1 className="mt-6 text-2xl font-bold">تم إرسال بلاغك بنجاح</h1>
      <p className="mt-2 text-ink-2">سيتم مراجعة البلاغ وإحالته للقسم المختص، وستصلك إشعارات بكل تحديث.</p>
      <Card className="mt-6">
        <CardBody>
          <p className="text-sm text-ink-3">رقم البلاغ</p>
          <div className="mt-1 flex items-center justify-center gap-2">
            <span className="text-2xl font-bold tracking-wide text-primary-800 tabular-nums">BL-2026-01481</span>
            <button className="grid size-8 place-items-center rounded-md text-ink-3 hover:bg-muted" aria-label="نسخ">
              <Copy className="size-4" />
            </button>
          </div>
          <p className="mt-3 flex items-center justify-center gap-1 text-xs text-ink-3">
            <Info className="size-3.5" /> احتفظ بهذا الرقم لمتابعة البلاغ
          </p>
        </CardBody>
      </Card>
      <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
        <Button to="/citizen/complaints/1480">متابعة البلاغ</Button>
        <Button to="/citizen" variant="outline">
          العودة للوحتي
        </Button>
      </div>
    </div>
  )
}
