import { useMemo, useState } from 'react'
import { Flame, Layers, MapPin, X } from 'lucide-react'
import { ComplaintsMap, statusColor } from '../../components/map/MapView'
import { StatusBadge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card, CardBody, CardHeader } from '../../components/ui/Card'
import { Field, Select } from '../../components/ui/Form'
import { Progress } from '../../components/ui/Misc'
import { PageHeader } from '../../components/ui/PageHeader'
import { categories, complaints, districts, getCategory, getDistrict, statusLabels } from '../../data/mock'
import type { Complaint, ComplaintStatus } from '../../data/types'
import { cn, formatDate } from '../../lib/utils'

export default function ComplaintsMapPage({ base }: { base: 'employee' | 'admin' }) {
  const [mode, setMode] = useState<'markers' | 'heat' | 'both'>('both')
  const [cat, setCat] = useState('')
  const [dist, setDist] = useState('')
  const [status, setStatus] = useState('')
  const [period, setPeriod] = useState('120')
  const [selected, setSelected] = useState<Complaint | null>(null)

  const data = useMemo(
    () =>
      complaints.filter(
        (c) =>
          (!cat || c.categoryId === cat) &&
          (!dist || c.districtId === dist) &&
          (!status || c.status === status) &&
          (new Date('2026-09-28').getTime() - new Date(c.createdAt).getTime()) / 86400000 <= Number(period),
      ),
    [cat, dist, status, period],
  )

  const hot = districts
    .map((d) => ({ ...d, count: data.filter((c) => c.districtId === d.id).length, top: topCategory(data.filter((c) => c.districtId === d.id)) }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
  const max = Math.max(1, ...hot.map((h) => h.count))

  return (
    <div className="space-y-6">
      <PageHeader breadcrumbs={[{ label: 'الرئيسية', to: `/${base}` }, { label: 'خريطة البلاغات' }]} title="خريطة البلاغات" description="التوزيع الجغرافي للبلاغات والمناطق الأكثر كثافة." />

      {/* الفلاتر */}
      <Card>
        <CardBody className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5 lg:items-end">
          <Field label="نوع المشكلة">
            <Select value={cat} onChange={(e) => setCat(e.target.value)}>
              <option value="">الكل</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </Field>
          <Field label="الفترة الزمنية">
            <Select value={period} onChange={(e) => setPeriod(e.target.value)}>
              <option value="7">آخر 7 أيام</option>
              <option value="30">آخر 30 يوماً</option>
              <option value="90">آخر 3 أشهر</option>
              <option value="120">آخر 4 أشهر</option>
            </Select>
          </Field>
          <Field label="المنطقة">
            <Select value={dist} onChange={(e) => setDist(e.target.value)}>
              <option value="">كل المناطق</option>
              {districts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </Select>
          </Field>
          <Field label="الحالة">
            <Select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">كل الحالات</option>
              {Object.entries(statusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </Select>
          </Field>
          <div className="flex rounded-md border border-line-strong p-1" role="group" aria-label="طريقة العرض">
            {[
              { id: 'markers', label: 'نقاط', icon: MapPin },
              { id: 'heat', label: 'حرارية', icon: Flame },
              { id: 'both', label: 'معاً', icon: Layers },
            ].map((m) => (
              <button key={m.id} onClick={() => setMode(m.id as typeof mode)} className={cn('flex h-9 flex-1 items-center justify-center gap-1.5 rounded text-sm font-medium', mode === m.id ? 'bg-primary-700 text-white' : 'text-ink-2 hover:bg-muted')}>
                <m.icon className="size-4" />
                {m.label}
              </button>
            ))}
          </div>
        </CardBody>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <Card className="relative overflow-hidden">
          <ComplaintsMap data={data} mode={mode} onSelect={setSelected} className="h-[420px] rounded-none border-0 sm:h-[560px]" />
          {/* مفتاح الخريطة */}
          <div className="absolute bottom-3 start-3 z-[500] rounded-lg bg-surface/95 p-3 text-xs shadow-pop">
            <p className="mb-2 font-semibold">الحالة</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
              {(Object.keys(statusColor) as ComplaintStatus[]).map((s) => (
                <span key={s} className="flex items-center gap-1.5 text-ink-2">
                  <span className="size-2.5 rounded-full ring-2 ring-white" style={{ background: statusColor[s] }} />
                  {statusLabels[s]}
                </span>
              ))}
            </div>
            <p className="mt-2 border-t border-line pt-2 text-ink-3">عدد البلاغات المعروضة: <b className="text-ink">{data.length}</b></p>
          </div>
          {selected && (
            <div className="absolute end-3 top-3 z-[500] w-72 rounded-lg bg-surface p-4 shadow-pop">
              <button onClick={() => setSelected(null)} className="absolute end-2 top-2 grid size-7 place-items-center rounded-md text-ink-3 hover:bg-muted" aria-label="إغلاق">
                <X className="size-4" />
              </button>
              <p className="text-xs text-ink-3 tabular-nums">{selected.number}</p>
              <p className="mt-1 font-semibold">{selected.title}</p>
              <p className="mt-1 text-xs text-ink-2">{getCategory(selected.categoryId).name} · {getDistrict(selected.districtId).name} · {formatDate(selected.createdAt)}</p>
              <div className="mt-3 flex items-center justify-between">
                <StatusBadge status={selected.status} />
                <Button size="sm" to={`/${base}/complaints/${selected.id}`}>التفاصيل</Button>
              </div>
            </div>
          )}
        </Card>

        <Card>
          <CardHeader title="المناطق الساخنة" subtitle="المناطق الأعلى في عدد البلاغات" action={<Flame className="size-5 text-error-500" />} />
          <CardBody className="space-y-4">
            {hot.map((h, i) => (
              <div key={h.id} className="space-y-1.5">
                <div className="flex items-center justify-between gap-2 text-sm">
                  <span className="flex items-center gap-2 font-semibold">
                    <span className={cn('grid size-6 place-items-center rounded-full text-xs', i === 0 ? 'bg-error-600 text-white' : i < 3 ? 'bg-error-100 text-error-700' : 'bg-muted text-ink-2')}>{i + 1}</span>
                    {h.name}
                  </span>
                  <span className="font-semibold tabular-nums">{h.count} بلاغ</span>
                </div>
                <Progress value={(h.count / max) * 100} tone={i < 2 ? 'error' : 'warning'} />
                <p className="text-xs text-ink-3">الأكثر: {h.top}</p>
              </div>
            ))}
          </CardBody>
        </Card>
      </div>
    </div>
  )
}

function topCategory(list: Complaint[]) {
  const counts: Record<string, number> = {}
  list.forEach((c) => (counts[c.categoryId] = (counts[c.categoryId] ?? 0) + 1))
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]
  return top ? getCategory(top[0]).name : '—'
}
