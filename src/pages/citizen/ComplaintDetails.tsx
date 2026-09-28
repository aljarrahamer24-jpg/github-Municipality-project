import { useParams } from 'react-router-dom'
import { Building2, CalendarDays, Hash, MapPin, Star, Tag } from 'lucide-react'
import { Comments } from '../../components/complaints/Comments'
import { StatusStepper, Timeline } from '../../components/complaints/Timeline'
import { LocationMap } from '../../components/map/MapView'
import { StatusBadge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card, CardBody, CardHeader } from '../../components/ui/Card'
import { Photo, Stars } from '../../components/ui/Misc'
import { PageHeader } from '../../components/ui/PageHeader'
import { getCategory, getComplaint, getDepartment } from '../../data/mock'
import { formatDateTime } from '../../lib/utils'

export default function CitizenComplaintDetails() {
  const { id } = useParams()
  const c = getComplaint(id)
  const info = [
    { icon: Hash, k: 'رقم البلاغ', v: c.number },
    { icon: Tag, k: 'نوع المشكلة', v: getCategory(c.categoryId).name },
    { icon: Building2, k: 'القسم المسؤول', v: getDepartment(c.departmentId).name },
    { icon: MapPin, k: 'المنطقة', v: c.address },
    { icon: CalendarDays, k: 'تاريخ الإنشاء', v: formatDateTime(c.createdAt) },
  ]
  return (
    <div>
      <PageHeader
        breadcrumbs={[{ label: 'لوحتي', to: '/citizen' }, { label: 'بلاغاتي', to: '/citizen/complaints' }, { label: c.number }]}
        title={
          <span className="flex flex-wrap items-center gap-3">
            {c.title} <StatusBadge status={c.status} />
          </span>
        }
        description={<span className="tabular-nums">{c.number}</span>}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="min-w-0 space-y-6">
          <Card>
            <CardBody>
              <StatusStepper status={c.status} />
            </CardBody>
          </Card>

          {c.status === 'closed' && (
            <Card className="border-secondary-200 bg-secondary-50/60">
              <CardBody className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                {c.rating ? (
                  <div>
                    <p className="font-semibold">شكراً لتقييمك</p>
                    <div className="mt-1 flex items-center gap-2 text-sm text-ink-2">
                      <Stars value={c.rating} size="sm" /> {c.rating} من 5
                    </div>
                  </div>
                ) : (
                  <>
                    <div>
                      <p className="font-semibold">تم إغلاق البلاغ — كيف كانت الخدمة؟</p>
                      <p className="mt-1 text-sm text-ink-2">تقييمك يساعدنا على تحسين الخدمات البلدية.</p>
                    </div>
                    <Button to={`/citizen/complaints/${c.id}/rate`} variant="accent" icon={Star}>
                      قيّم الخدمة
                    </Button>
                  </>
                )}
              </CardBody>
            </Card>
          )}

          <Card>
            <CardHeader title="وصف المشكلة" />
            <CardBody className="space-y-5">
              <p className="leading-loose text-ink-2">{c.description}</p>
              <div>
                <p className="mb-2 text-sm font-semibold">الصور المرفقة</p>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {c.images.map((img, i) => (
                    <Photo key={img} seed={i} label="قبل" className="aspect-square" />
                  ))}
                </div>
              </div>
              {c.afterImages && (
                <div>
                  <p className="mb-2 text-sm font-semibold">صور بعد المعالجة</p>
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                    {c.afterImages.map((img) => (
                      <Photo key={img} seed={3} label="بعد" className="aspect-square" />
                    ))}
                  </div>
                </div>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="الموقع" subtitle={c.address} />
            <CardBody>
              <LocationMap lat={c.lat} lng={c.lng} className="h-64" />
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="التعليقات والتحديثات" subtitle="تواصل مع الفريق المسؤول عن البلاغ" />
            <CardBody>
              <Comments comments={c.comments} viewer="citizen" />
            </CardBody>
          </Card>
        </div>

        <aside className="space-y-6">
          <Card>
            <CardHeader title="بيانات البلاغ" />
            <CardBody className="space-y-3.5">
              {info.map((r) => (
                <div key={r.k} className="flex gap-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted text-ink-2">
                    <r.icon className="size-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs text-ink-3">{r.k}</p>
                    <p className="text-sm font-medium">{r.v}</p>
                  </div>
                </div>
              ))}
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="سجل الحالات" />
            <CardBody>
              <Timeline events={c.timeline} />
            </CardBody>
          </Card>
        </aside>
      </div>
    </div>
  )
}
