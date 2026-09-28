import { AlertTriangle, CircleDot, ClipboardList, Loader, Lock } from 'lucide-react'
import { ComplaintsTable } from '../../components/complaints/ComplaintsTable'
import { PageHeader } from '../../components/ui/PageHeader'
import { StatCard } from '../../components/ui/StatCard'
import { complaints } from '../../data/mock'

export default function EmployeeDashboard() {
  const n = (f: (c: (typeof complaints)[number]) => boolean) => complaints.filter(f).length
  return (
    <div>
      <PageHeader title="لوحة تحكم الموظف" description="الأحد، 28 سبتمبر 2026 — لديك 5 بلاغات جديدة بانتظار المراجعة." />
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-5">
        <StatCard label="إجمالي البلاغات" value={complaints.length} icon={ClipboardList} accent="primary" trend={{ value: '12%', up: true, good: false }} hint="عن الشهر الماضي" />
        <StatCard label="البلاغات الجديدة" value={n((c) => c.status === 'new' || c.status === 'in_review')} icon={CircleDot} accent="info" />
        <StatCard label="قيد المعالجة" value={n((c) => c.status === 'in_progress')} icon={Loader} accent="warning" />
        <StatCard label="البلاغات المتأخرة" value={n((c) => !!c.overdue)} icon={AlertTriangle} accent="error" hint="تجاوزت المدة المحددة" />
        <StatCard label="البلاغات المغلقة" value={n((c) => c.status === 'closed' || c.status === 'resolved')} icon={Lock} accent="success" className="col-span-2 md:col-span-1" />
      </div>
      <div className="mt-6">
        <h2 className="mb-3 text-lg font-semibold">البلاغات المسندة لقسمك</h2>
        <ComplaintsTable data={complaints} basePath="/employee/complaints" pageSize={8} />
      </div>
    </div>
  )
}
