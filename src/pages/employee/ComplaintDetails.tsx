import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Building2, CalendarDays, Mail, MapPin, Phone, Printer, Save, Tag, Timer, User } from 'lucide-react'
import { Comments } from '../../components/complaints/Comments'
import { FileUpload } from '../../components/complaints/FileUpload'
import { Timeline } from '../../components/complaints/Timeline'
import { LocationMap } from '../../components/map/MapView'
import { OverdueBadge, PriorityBadge, StatusBadge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card, CardBody, CardHeader } from '../../components/ui/Card'
import { Field, Select, Textarea } from '../../components/ui/Form'
import { Alert, Modal, Photo, Tabs } from '../../components/ui/Misc'
import { PageHeader } from '../../components/ui/PageHeader'
import { departments, employeesList, getCategory, getComplaint, getDepartment, getDistrict, priorityLabels, statusLabels } from '../../data/mock'
import type { ComplaintStatus } from '../../data/types'
import { formatDateTime } from '../../lib/utils'

export default function StaffComplaintDetails({ base }: { base: 'employee' | 'admin' }) {
  const { id } = useParams()
  const c = getComplaint(id)
  const [status, setStatus] = useState<ComplaintStatus>(c.status)
  const [tab, setTab] = useState<'before' | 'after'>('before')
  const [saved, setSaved] = useState(false)
  const [preview, setPreview] = useState<number | null>(null)
  const cat = getCategory(c.categoryId)

  return (
    <div>
      <PageHeader
        breadcrumbs={[{ label: 'الرئيسية', to: `/${base}` }, { label: 'البلاغات', to: `/${base}/complaints` }, { label: c.number }]}
        title={
          <span className="flex flex-wrap items-center gap-2">
            <span className="tabular-nums">{c.number}</span>
            <StatusBadge status={c.status} />
            <PriorityBadge priority={c.priority} />
            {c.overdue && <OverdueBadge />}
          </span>
        }
        description={c.title}
        actions={<Button variant="outline" icon={Printer} onClick={() => window.print()}>طباعة</Button>}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_360px] lg:items-start">
        {/* إجراءات — أولاً على الموبايل */}
        <Card className="order-1 lg:col-start-2 lg:row-start-1">
          <CardHeader title="إجراءات البلاغ" />
          <CardBody className="space-y-4">
            {saved && <Alert tone="success" title="تم حفظ التحديث">سيتم إشعار المواطن بالحالة الجديدة.</Alert>}
            <Field label="تغيير الحالة">
              <Select value={status} onChange={(e) => setStatus(e.target.value as ComplaintStatus)}>
                {Object.entries(statusLabels).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </Select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="الأولوية">
                <Select defaultValue={c.priority}>
                  {Object.entries(priorityLabels).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="القسم">
                <Select defaultValue={c.departmentId}>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name.replace('قسم ', '')}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            <Field label="الموظف المسؤول">
              <Select defaultValue={c.assignee ?? ''}>
                <option value="">غير محدد</option>
                {employeesList.map((e) => (
                  <option key={e}>{e}</option>
                ))}
              </Select>
            </Field>
            <Field label="ملاحظة التحديث" hint="تظهر للمواطن ضمن سجل الحالات">
              <Textarea rows={3} placeholder="مثال: تم إرسال الفريق الميداني..." className="min-h-20" />
            </Field>
            {(status === 'resolved' || status === 'closed') && (
              <Field label="صور بعد المعالجة" required>
                <FileUpload compact label="ارفع صور الإنجاز" />
              </Field>
            )}
            <Button block icon={Save} onClick={() => setSaved(true)}>
              حفظ التحديث
            </Button>
          </CardBody>
        </Card>

        {/* المحتوى الرئيسي */}
        <div className="order-2 min-w-0 space-y-6 lg:col-start-1 lg:row-span-2 lg:row-start-1">
          <Card>
            <CardHeader title="بيانات البلاغ" />
            <CardBody className="space-y-5">
              <dl className="grid gap-4 sm:grid-cols-2">
                <Info icon={Tag} k="نوع المشكلة" v={cat.name} />
                <Info icon={Building2} k="القسم المسؤول" v={getDepartment(c.departmentId).name} />
                <Info icon={MapPin} k="المنطقة" v={`${getDistrict(c.districtId).name} — ${c.address.split('—')[1] ?? ''}`} />
                <Info icon={CalendarDays} k="تاريخ البلاغ" v={formatDateTime(c.createdAt)} />
                <Info icon={Timer} k="المدة المحددة (SLA)" v={`${cat.slaDays} أيام`} />
                <Info icon={User} k="الموظف المسؤول" v={c.assignee ?? 'غير محدد'} />
              </dl>
              <div>
                <p className="mb-1.5 text-sm font-semibold">الوصف</p>
                <p className="rounded-lg bg-canvas p-3 text-sm leading-loose text-ink-2">{c.description}</p>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="الصور"
              action={
                <Tabs
                  value={tab}
                  onChange={setTab}
                  tabs={[
                    { id: 'before', label: 'قبل', count: c.images.length },
                    { id: 'after', label: 'بعد المعالجة', count: c.afterImages?.length ?? 0 },
                  ]}
                />
              }
            />
            <CardBody>
              {tab === 'before' || c.afterImages ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {(tab === 'before' ? c.images : c.afterImages!).map((img, i) => (
                    <button key={img} onClick={() => setPreview(i)} className="overflow-hidden rounded-lg">
                      <Photo seed={tab === 'before' ? i : 3} label={tab === 'before' ? `صورة ${i + 1}` : 'بعد'} className="aspect-[4/3] transition-transform hover:scale-105" />
                    </button>
                  ))}
                </div>
              ) : (
                <p className="py-6 text-center text-sm text-ink-3">لم يتم رفع صور بعد المعالجة. غيّر الحالة إلى "تم الحل" لرفع صور الإنجاز.</p>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="الموقع على الخريطة" subtitle={c.address} action={<a className="text-sm font-medium text-primary-700" href={`https://maps.google.com/?q=${c.lat},${c.lng}`} target="_blank" rel="noreferrer">فتح في خرائط Google</a>} />
            <CardBody>
              <LocationMap lat={c.lat} lng={c.lng} className="h-72" />
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="التعليقات والملاحظات الداخلية" subtitle="الملاحظات الداخلية لا تظهر للمواطن" />
            <CardBody>
              <Comments comments={c.comments} viewer="staff" allowInternal />
            </CardBody>
          </Card>
        </div>

        {/* معلومات جانبية */}
        <div className="order-3 space-y-6 lg:col-start-2 lg:row-start-2">
          <Card>
            <CardHeader title="مقدم البلاغ" />
            <CardBody className="space-y-2.5 text-sm">
              <p className="flex items-center gap-2"><User className="size-4 text-ink-3" />{c.citizen}</p>
              <p className="flex items-center gap-2"><Phone className="size-4 text-ink-3" /><span dir="ltr">079 000 0001</span></p>
              <p className="flex items-center gap-2"><Mail className="size-4 text-ink-3" />citizen@example.com</p>
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Timeline — سجل الحالات" />
            <CardBody>
              <Timeline events={c.timeline} />
            </CardBody>
          </Card>
        </div>
      </div>

      <Modal open={preview !== null} onClose={() => setPreview(null)} title="معاينة الصورة" size="lg">
        <Photo seed={preview ?? 0} className="aspect-video" />
      </Modal>
    </div>
  )
}

function Info({ icon: Icon, k, v }: { icon: typeof Tag; k: string; v: string }) {
  return (
    <div className="flex gap-3">
      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted text-ink-2">
        <Icon className="size-4" />
      </span>
      <div className="min-w-0">
        <dt className="text-xs text-ink-3">{k}</dt>
        <dd className="text-sm font-medium">{v}</dd>
      </div>
    </div>
  )
}
