import { Mail, Phone } from 'lucide-react'
import { Badge } from '../../components/ui/Badge'
import { DataTable } from '../../components/ui/DataTable'
import { Field, Input, Select, Switch } from '../../components/ui/Form'
import { Avatar } from '../../components/ui/Misc'
import { PageHeader } from '../../components/ui/PageHeader'
import { categories, departments, districts, employees, getDepartment, keywords, users } from '../../data/mock'
import type { User } from '../../data/types'
import { getIcon } from '../../lib/icons'
import { formatDate, formatNumber } from '../../lib/utils'
import { useState } from 'react'

const crumbs = (label: string) => [{ label: 'الرئيسية', to: '/admin' }, { label: 'إدارة النظام' }, { label }]

function Person({ u }: { u: User }) {
  return (
    <span className="flex items-center gap-3">
      <Avatar name={u.name} size="sm" />
      <span className="min-w-0">
        <span className="block font-semibold text-ink">{u.name}</span>
        <span className="block truncate text-xs text-ink-3">{u.email}</span>
      </span>
    </span>
  )
}

const StatusB = ({ s }: { s: User['status'] }) => <Badge tone={s === 'active' ? 'success' : 'error'} dot>{s === 'active' ? 'نشط' : 'موقوف'}</Badge>
const Active = ({ on }: { on: boolean }) => <Badge tone={on ? 'success' : 'neutral'} dot>{on ? 'مفعّل' : 'معطّل'}</Badge>

function ActiveSwitch({ initial = true, label = 'مفعّل' }: { initial?: boolean; label?: string }) {
  const [v, setV] = useState(initial)
  return <Switch checked={v} onChange={setV} label={label} />
}

/* ---------------- المستخدمون ---------------- */
export function UsersPage() {
  return (
    <div>
      <PageHeader breadcrumbs={crumbs('المستخدمون')} title="إدارة المستخدمين" description="حسابات المواطنين المسجلين في المنصة." />
      <DataTable
        rows={users}
        entity="مستخدم"
        addLabel="إضافة مستخدم"
        getId={(u) => u.id}
        searchText={(u) => `${u.name} ${u.email} ${u.phone}`}
        columns={[
          { key: 'name', header: 'المستخدم', render: (u) => <Person u={u} />, className: 'px-4 py-3' },
          { key: 'phone', header: 'الهاتف', render: (u) => <span dir="ltr">{u.phone}</span> },
          { key: 'complaints', header: 'البلاغات', render: (u) => u.complaints },
          { key: 'created', header: 'تاريخ التسجيل', render: (u) => formatDate(u.createdAt) },
          { key: 'status', header: 'الحالة', render: (u) => <StatusB s={u.status} /> },
        ]}
        form={(u) => (
          <>
            <Field label="الاسم الكامل"><Input defaultValue={u?.name} /></Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="البريد الإلكتروني"><Input icon={Mail} defaultValue={u?.email} /></Field>
              <Field label="الهاتف"><Input icon={Phone} defaultValue={u?.phone} dir="ltr" className="text-end" /></Field>
            </div>
            <ActiveSwitch initial={u?.status !== 'suspended'} label="الحساب نشط" />
          </>
        )}
      />
    </div>
  )
}

/* ---------------- الموظفون ---------------- */
export function EmployeesPage() {
  return (
    <div>
      <PageHeader breadcrumbs={crumbs('الموظفون')} title="إدارة الموظفين" description="موظفو البلدية وصلاحياتهم والأقسام التابعين لها." />
      <DataTable
        rows={employees}
        entity="موظف"
        addLabel="إضافة موظف"
        getId={(u) => u.id}
        searchText={(u) => `${u.name} ${u.email}`}
        toolbar={
          <Select className="h-10 sm:w-48" defaultValue="">
            <option value="">كل الأقسام</option>
            {departments.map((d) => <option key={d.id}>{d.name}</option>)}
          </Select>
        }
        columns={[
          { key: 'name', header: 'الموظف', render: (u) => <Person u={u} />, className: 'px-4 py-3' },
          { key: 'dept', header: 'القسم', render: (u) => getDepartment(u.departmentId!).name },
          { key: 'role', header: 'الصلاحية', render: (u) => <Badge tone={u.role === 'admin' ? 'gold' : 'primary'}>{u.role === 'admin' ? 'مشرف' : 'موظف'}</Badge> },
          { key: 'load', header: 'البلاغات المسندة', render: (u) => u.complaints },
          { key: 'status', header: 'الحالة', render: (u) => <StatusB s={u.status} /> },
        ]}
        form={(u) => (
          <>
            <Field label="الاسم الكامل"><Input defaultValue={u?.name} /></Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="البريد الإلكتروني"><Input defaultValue={u?.email} /></Field>
              <Field label="الهاتف"><Input defaultValue={u?.phone} dir="ltr" className="text-end" /></Field>
              <Field label="القسم">
                <Select defaultValue={u?.departmentId}>{departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</Select>
              </Field>
              <Field label="الصلاحية">
                <Select defaultValue={u?.role}><option value="employee">موظف</option><option value="admin">مشرف قسم</option></Select>
              </Field>
            </div>
            <ActiveSwitch initial={u?.status !== 'suspended'} label="الحساب نشط" />
          </>
        )}
      />
    </div>
  )
}

/* ---------------- الأقسام ---------------- */
export function DepartmentsPage() {
  return (
    <div>
      <PageHeader breadcrumbs={crumbs('الأقسام')} title="إدارة الأقسام" description="الأقسام المسؤولة عن معالجة البلاغات." />
      <DataTable
        rows={departments}
        entity="قسم"
        addLabel="إضافة قسم"
        getId={(d) => d.id}
        searchText={(d) => `${d.name} ${d.head}`}
        columns={[
          { key: 'name', header: 'القسم', render: (d) => <span className="font-semibold text-ink">{d.name}</span> },
          { key: 'head', header: 'رئيس القسم', render: (d) => d.head },
          { key: 'emp', header: 'عدد الموظفين', render: (d) => d.employees },
          { key: 'cats', header: 'أنواع المشاكل', render: (d) => categories.filter((c) => c.departmentId === d.id).length },
          { key: 'active', header: 'الحالة', render: (d) => <Active on={d.active} /> },
        ]}
        form={(d) => (
          <>
            <Field label="اسم القسم"><Input defaultValue={d?.name} /></Field>
            <Field label="رئيس القسم"><Input defaultValue={d?.head} /></Field>
            <Field label="البريد الإلكتروني للقسم"><Input placeholder="dept@municipality.example" /></Field>
            <ActiveSwitch initial={d?.active ?? true} />
          </>
        )}
      />
    </div>
  )
}

/* ---------------- أنواع المشاكل ---------------- */
export function CategoriesPage() {
  return (
    <div>
      <PageHeader breadcrumbs={crumbs('أنواع المشاكل')} title="إدارة أنواع المشاكل" description="أنواع البلاغات والقسم المسؤول والمدة المحددة للمعالجة (SLA)." />
      <DataTable
        rows={categories}
        entity="نوع مشكلة"
        addLabel="إضافة نوع"
        getId={(c) => c.id}
        searchText={(c) => c.name}
        columns={[
          {
            key: 'name',
            header: 'النوع',
            className: 'px-4 py-3',
            render: (c) => {
              const I = getIcon(c.icon)
              return <span className="flex items-center gap-3 font-semibold text-ink"><span className="grid size-9 place-items-center rounded-lg bg-primary-50 text-primary-700"><I className="size-4.5" /></span>{c.name}</span>
            },
          },
          { key: 'dept', header: 'القسم المسؤول', render: (c) => getDepartment(c.departmentId).name },
          { key: 'sla', header: 'مدة المعالجة', render: (c) => `${c.slaDays} أيام` },
          { key: 'active', header: 'الحالة', render: (c) => <Active on={c.active} /> },
        ]}
        form={(c) => (
          <>
            <Field label="اسم النوع"><Input defaultValue={c?.name} /></Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="القسم المسؤول">
                <Select defaultValue={c?.departmentId}>{departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</Select>
              </Field>
              <Field label="مدة المعالجة (أيام)"><Input type="number" defaultValue={c?.slaDays ?? 3} /></Field>
            </div>
            <Field label="الأولوية الافتراضية">
              <Select defaultValue="medium"><option value="low">منخفضة</option><option value="medium">متوسطة</option><option value="high">عالية</option><option value="urgent">عاجلة</option></Select>
            </Field>
            <ActiveSwitch initial={c?.active ?? true} label="ظاهر للمواطنين" />
          </>
        )}
      />
    </div>
  )
}

/* ---------------- المناطق ---------------- */
const riskB = { high: ['error', 'عالية'], medium: ['warning', 'متوسطة'], low: ['success', 'منخفضة'] } as const
export function DistrictsPage() {
  return (
    <div>
      <PageHeader breadcrumbs={crumbs('المناطق')} title="إدارة المناطق" description="الأحياء والمناطق التابعة للبلدية ومستوى خطورة الفيضانات." />
      <DataTable
        rows={districts}
        entity="منطقة"
        addLabel="إضافة منطقة"
        getId={(d) => d.id}
        searchText={(d) => d.name}
        columns={[
          { key: 'name', header: 'المنطقة', render: (d) => <span className="font-semibold text-ink">{d.name}</span> },
          { key: 'pop', header: 'عدد السكان', render: (d) => formatNumber(d.population) },
          { key: 'coords', header: 'الإحداثيات', render: (d) => <span dir="ltr" className="text-xs tabular-nums">{d.lat.toFixed(4)}, {d.lng.toFixed(4)}</span>, hideOnMobile: true },
          { key: 'risk', header: 'خطورة الفيضانات', render: (d) => <Badge tone={riskB[d.floodRisk][0]}>{riskB[d.floodRisk][1]}</Badge> },
        ]}
        form={(d) => (
          <>
            <Field label="اسم المنطقة"><Input defaultValue={d?.name} /></Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="خط العرض"><Input defaultValue={d?.lat} dir="ltr" /></Field>
              <Field label="خط الطول"><Input defaultValue={d?.lng} dir="ltr" /></Field>
              <Field label="عدد السكان"><Input type="number" defaultValue={d?.population} /></Field>
              <Field label="خطورة الفيضانات">
                <Select defaultValue={d?.floodRisk}><option value="low">منخفضة</option><option value="medium">متوسطة</option><option value="high">عالية</option></Select>
              </Field>
            </div>
          </>
        )}
      />
    </div>
  )
}

/* ---------------- الكلمات المفتاحية ---------------- */
const sent = { positive: ['success', 'إيجابية'], negative: ['error', 'سلبية'], neutral: ['neutral', 'محايدة'] } as const
export function KeywordsPage() {
  return (
    <div>
      <PageHeader breadcrumbs={crumbs('الكلمات المفتاحية')} title="الكلمات المفتاحية لتحليل التعليقات" description="تُستخدم لتصنيف تعليقات المواطنين تلقائياً واستخراج أسباب الرضا وعدم الرضا." />
      <DataTable
        rows={keywords}
        entity="كلمة مفتاحية"
        addLabel="إضافة كلمة"
        getId={(k) => k.id}
        searchText={(k) => `${k.word} ${k.category}`}
        toolbar={
          <Select className="h-10 sm:w-40" defaultValue="">
            <option value="">كل التصنيفات</option>
            <option>إيجابية</option>
            <option>سلبية</option>
            <option>محايدة</option>
          </Select>
        }
        columns={[
          { key: 'word', header: 'الكلمة / العبارة', render: (k) => <span className="rounded-md bg-muted px-2 py-1 font-semibold text-ink">«{k.word}»</span> },
          { key: 'sent', header: 'الدلالة', render: (k) => <Badge tone={sent[k.sentiment][0]}>{sent[k.sentiment][1]}</Badge> },
          { key: 'cat', header: 'المحور', render: (k) => k.category },
          { key: 'hits', header: 'مرات الظهور', render: (k) => k.hits },
        ]}
        form={(k) => (
          <>
            <Field label="الكلمة أو العبارة" hint="يمكن إضافة مرادفات مفصولة بفاصلة"><Input defaultValue={k?.word} /></Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="الدلالة">
                <Select defaultValue={k?.sentiment}><option value="positive">إيجابية</option><option value="negative">سلبية</option><option value="neutral">محايدة</option></Select>
              </Field>
              <Field label="المحور">
                <Select defaultValue={k?.category}><option>زمن الاستجابة</option><option>جودة الحل</option><option>التواصل</option><option>عام</option></Select>
              </Field>
            </div>
          </>
        )}
      />
    </div>
  )
}
