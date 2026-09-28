import { useState } from 'react'
import { CheckCircle2, Download, FileBarChart, Printer, RefreshCw, Smile, Timer } from 'lucide-react'
import { ColumnChart, HBarChart } from '../../components/charts/Charts'
import { Button } from '../../components/ui/Button'
import { Card, CardBody } from '../../components/ui/Card'
import { Field, Select } from '../../components/ui/Form'
import { Progress, Stars } from '../../components/ui/Misc'
import { PageHeader } from '../../components/ui/PageHeader'
import { byCategory, byDepartment, byDistrict, monthlyTrend } from '../../data/mock'
import { Logo } from '../../components/layout/Brand'
import { cn } from '../../lib/utils'

const months = ['سبتمبر 2026', 'أغسطس 2026', 'يوليو 2026', 'يونيو 2026', 'مايو 2026', 'أبريل 2026']

export default function Reports() {
  const [month, setMonth] = useState(months[0])
  const [generated, setGenerated] = useState(true)
  const [loading, setLoading] = useState(false)

  const generate = () => {
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setGenerated(true)
    }, 700)
  }

  return (
    <div className="space-y-6">
      <div className="no-print">
        <PageHeader breadcrumbs={[{ label: 'الرئيسية', to: '/admin' }, { label: 'التقارير الشهرية' }]} title="التقارير الشهرية" description="أنشئ تقريراً شهرياً شاملاً عن أداء البلدية، واعرضه أو اطبعه أو صدّره PDF." />
        <Card>
          <CardBody className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <Field label="اختيار الشهر" className="sm:w-60">
              <Select value={month} onChange={(e) => { setMonth(e.target.value); setGenerated(false) }}>
                {months.map((m) => <option key={m}>{m}</option>)}
              </Select>
            </Field>
            <Field label="نوع التقرير" className="sm:w-60">
              <Select>
                <option>تقرير شامل</option>
                <option>تقرير الأقسام</option>
                <option>تقرير المناطق</option>
              </Select>
            </Field>
            <Button icon={RefreshCw} onClick={generate} loading={loading}>إنشاء التقرير</Button>
            <div className="flex gap-2 sm:ms-auto">
              <Button variant="outline" icon={Printer} disabled={!generated} onClick={() => window.print()}>طباعة</Button>
              <Button variant="outline" icon={Download} disabled={!generated} onClick={() => window.print()}>تصدير PDF</Button>
            </div>
          </CardBody>
        </Card>
      </div>

      {!generated ? (
        <Card className="no-print">
          <CardBody className="flex flex-col items-center py-16 text-center">
            <FileBarChart className="size-12 text-ink-3" />
            <p className="mt-3 font-semibold">اضغط "إنشاء التقرير" لمعاينة تقرير {month}</p>
          </CardBody>
        </Card>
      ) : (
        /* معاينة التقرير (Preview) — ورقة A4 */
        <div className={cn('print-area mx-auto max-w-4xl rounded-card border border-line bg-surface shadow-pop', loading && 'opacity-50')}>
          <div className="flex flex-wrap items-center justify-between gap-4 border-b-4 border-primary-700 p-6 sm:p-8">
            <div className="flex items-center gap-3">
              <Logo className="size-12" />
              <div>
                <p className="text-lg font-bold">بلدية المدينة</p>
                <p className="text-sm text-ink-3">إدارة الخدمات والشكاوى</p>
              </div>
            </div>
            <div className="text-end">
              <p className="text-xl font-bold text-primary-800">التقرير الشهري للبلاغات</p>
              <p className="text-sm text-ink-2">{month} · رقم التقرير RPT-2026-09</p>
            </div>
          </div>

          <div className="space-y-8 p-6 sm:p-8">
            <section>
              <h3 className="mb-3 font-bold">1. ملخص الأداء</h3>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {[
                  { k: 'إجمالي البلاغات', v: '219', icon: FileBarChart },
                  { k: 'نسبة الإغلاق', v: '89.5%', icon: CheckCircle2 },
                  { k: 'متوسط زمن الحل', v: '3.4 يوم', icon: Timer },
                  { k: 'رضا المواطنين', v: '4.2 من 5', icon: Smile },
                ].map((s) => (
                  <div key={s.k} className="rounded-lg border border-line p-3">
                    <s.icon className="size-5 text-primary-700" />
                    <p className="mt-2 text-xl font-bold">{s.v}</p>
                    <p className="text-xs text-ink-3">{s.k}</p>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h3 className="mb-3 font-bold">2. البلاغات خلال آخر 6 أشهر</h3>
              <ColumnChart data={monthlyTrend} dataKey="received" name="المستلمة" unit="بلاغ" height={220} />
            </section>

            <section>
              <h3 className="mb-3 font-bold">3. أداء الأقسام</h3>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[520px] text-sm">
                  <thead className="bg-muted text-xs text-ink-2">
                    <tr>{['القسم', 'البلاغات', 'نسبة الإغلاق', 'متوسط زمن الحل', 'الرضا'].map((h) => <th key={h} className="px-3 py-2.5 text-start font-semibold">{h}</th>)}</tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {byDepartment.map((d) => (
                      <tr key={d.name}>
                        <td className="px-3 py-2.5 font-medium">{d.name}</td>
                        <td className="px-3 py-2.5 tabular-nums">{d.value}</td>
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-2">
                            <Progress value={d.closeRate} tone={d.closeRate >= 85 ? 'success' : d.closeRate >= 75 ? 'warning' : 'error'} className="w-20" />
                            <span className="tabular-nums">{d.closeRate}%</span>
                          </div>
                        </td>
                        <td className="px-3 py-2.5 tabular-nums">{d.avgDays} يوم</td>
                        <td className="px-3 py-2.5"><span className="inline-flex items-center gap-1"><Stars value={d.satisfaction} size="sm" /> {d.satisfaction}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <div className="grid gap-8 md:grid-cols-2">
              <section>
                <h3 className="mb-3 font-bold">4. أكثر المشاكل</h3>
                <HBarChart data={byCategory.slice(0, 5)} height={220} unit="بلاغ" />
              </section>
              <section>
                <h3 className="mb-3 font-bold">5. أكثر المناطق تضرراً</h3>
                <HBarChart data={byDistrict.slice(0, 5)} height={220} unit="بلاغ" />
              </section>
            </div>

            <section>
              <h3 className="mb-3 font-bold">6. رضا المواطنين</h3>
              <div className="grid gap-4 rounded-lg bg-canvas p-4 sm:grid-cols-3">
                <div><p className="text-3xl font-bold">4.2</p><Stars value={4.2} size="sm" /><p className="text-xs text-ink-3">من 831 تقييماً</p></div>
                <div><p className="text-3xl font-bold text-success-600">82%</p><p className="text-xs text-ink-3">نسبة الرضا (4 نجوم فأكثر)</p></div>
                <div><p className="text-sm font-semibold">أبرز أسباب عدم الرضا</p><p className="mt-1 text-sm text-ink-2">التأخر في الاستجابة (58) · الحل غير كامل (36)</p></div>
              </div>
            </section>

            <footer className="flex flex-wrap justify-between gap-2 border-t border-line pt-4 text-xs text-ink-3">
              <span>تم إنشاء التقرير آلياً من منصة إدارة الشكاوى — 28 سبتمبر 2026</span>
              <span>صفحة 1 من 1</span>
            </footer>
          </div>
        </div>
      )}
    </div>
  )
}
