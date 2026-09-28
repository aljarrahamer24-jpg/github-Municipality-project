import { useState } from 'react'
import { AlertTriangle, CalendarDays, LayoutGrid, List, MapPin, Repeat, Wrench } from 'lucide-react'
import { ComplaintsTable } from '../../components/complaints/ComplaintsTable'
import { Badge, type Tone } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Modal } from '../../components/ui/Misc'
import { PageHeader } from '../../components/ui/PageHeader'
import { StatCard } from '../../components/ui/StatCard'
import { complaints, getCategory, getDistrict, recurringIssues, severityLabels } from '../../data/mock'
import { getIcon } from '../../lib/icons'
import { cn } from '../../lib/utils'

const sevTone: Record<string, Tone> = { critical: 'error', high: 'warning', medium: 'info', low: 'neutral' }
type Issue = (typeof recurringIssues)[number]

export default function Recurring() {
  const [view, setView] = useState<'cards' | 'table'>('cards')
  const [open, setOpen] = useState<Issue | null>(null)
  const related = open ? complaints.filter((c) => c.categoryId === open.categoryId).slice(0, open.count) : []

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[{ label: 'الرئيسية', to: '/admin' }, { label: 'المشاكل المتكررة' }]}
        title="المشاكل المتكررة"
        description="يكتشف النظام تلقائياً المشاكل التي تتكرر في نفس الموقع خلال فترة زمنية محددة (3 بلاغات أو أكثر خلال 6 أشهر ضمن 200 متر)."
        actions={
          <div className="flex rounded-md border border-line-strong p-1">
            {[
              { id: 'cards', icon: LayoutGrid, label: 'بطاقات' },
              { id: 'table', icon: List, label: 'جدول' },
            ].map((v) => (
              <button key={v.id} onClick={() => setView(v.id as typeof view)} className={cn('flex h-8 items-center gap-1.5 rounded px-3 text-sm', view === v.id ? 'bg-primary-700 text-white' : 'text-ink-2 hover:bg-muted')}>
                <v.icon className="size-4" /> {v.label}
              </button>
            ))}
          </div>
        }
      />
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label="مشاكل متكررة" value={recurringIssues.length} icon={Repeat} accent="primary" />
        <StatCard label="تحتاج صيانة جذرية" value={recurringIssues.filter((r) => r.severity === 'critical').length} icon={AlertTriangle} accent="error" />
        <StatCard label="بلاغات مرتبطة" value={recurringIssues.reduce((a, r) => a + r.count, 0)} icon={Wrench} accent="warning" />
        <StatCard label="تكلفة تقديرية للتكرار" value="18,400 د.أ" icon={CalendarDays} accent="gold" />
      </div>

      {view === 'cards' ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {recurringIssues.map((r) => {
            const cat = getCategory(r.categoryId)
            const Icon = getIcon(cat.icon)
            return (
              <Card key={r.id} className={cn('flex flex-col overflow-hidden', r.severity === 'critical' && 'border-error-100')}>
                <div className={cn('h-1', r.severity === 'critical' ? 'bg-error-500' : r.severity === 'high' ? 'bg-warning-500' : 'bg-info-500')} />
                <div className="flex-1 space-y-4 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="grid size-11 place-items-center rounded-lg bg-muted text-ink-2"><Icon className="size-5" /></span>
                      <div>
                        <p className="text-xs text-ink-3">المشكلة</p>
                        <p className="font-semibold">{cat.name}</p>
                      </div>
                    </div>
                    <Badge tone={sevTone[r.severity]}>{severityLabels[r.severity]}</Badge>
                  </div>
                  <p className="flex items-start gap-1.5 text-sm text-ink-2"><MapPin className="mt-0.5 size-4 shrink-0" />{r.location}</p>
                  <div className="grid grid-cols-2 gap-3 rounded-lg bg-canvas p-3 text-center">
                    <div>
                      <p className="text-2xl font-bold">{r.count}</p>
                      <p className="text-xs text-ink-3">عدد البلاغات</p>
                    </div>
                    <div className="border-s border-line">
                      <p className="text-2xl font-bold">{r.months}</p>
                      <p className="text-xs text-ink-3">{r.months > 10 ? 'شهراً' : 'أشهر'} (الفترة)</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg border border-dashed border-secondary-300 bg-secondary-50 px-3 py-2 text-sm">
                    <Wrench className="size-4 shrink-0 text-secondary-600" />
                    <span><span className="text-ink-3">الحالة: </span><b>{r.recommendation}</b></span>
                  </div>
                </div>
                <div className="border-t border-line p-3">
                  <Button variant="secondary" block onClick={() => setOpen(r)}>عرض البلاغات المرتبطة</Button>
                </div>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-muted/70 text-xs text-ink-2">
              <tr>
                {['المشكلة', 'الموقع', 'المنطقة', 'عدد البلاغات', 'الفترة', 'الخطورة', 'التوصية', ''].map((h) => <th key={h} className="px-4 py-3 text-start font-semibold">{h}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {recurringIssues.map((r) => (
                <tr key={r.id} className="hover:bg-canvas">
                  <td className="px-4 py-3 font-semibold">{getCategory(r.categoryId).name}</td>
                  <td className="px-4 py-3 text-ink-2">{r.location}</td>
                  <td className="px-4 py-3 text-ink-2">{getDistrict(r.districtId).name}</td>
                  <td className="px-4 py-3 font-bold">{r.count}</td>
                  <td className="px-4 py-3 text-ink-2">{r.months} أشهر</td>
                  <td className="px-4 py-3"><Badge tone={sevTone[r.severity]}>{severityLabels[r.severity]}</Badge></td>
                  <td className="px-4 py-3">{r.recommendation}</td>
                  <td className="px-4 py-3"><Button size="sm" variant="ghost" onClick={() => setOpen(r)}>البلاغات</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <Modal open={!!open} onClose={() => setOpen(null)} title={open ? `البلاغات المرتبطة — ${getCategory(open.categoryId).name}` : ''} size="lg">
        {open && (
          <div className="space-y-3">
            <p className="text-sm text-ink-2">{open.location} — {open.count} بلاغات خلال {open.months} أشهر</p>
            <ComplaintsTable data={related} basePath="/admin/complaints" showFilters={false} showAssignee={false} pageSize={6} />
          </div>
        )}
      </Modal>
    </div>
  )
}
