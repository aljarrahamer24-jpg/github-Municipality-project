import { Link } from 'react-router-dom'
import { CheckCircle2, CircleDot, FileText, Loader, Plus, Star } from 'lucide-react'
import { ComplaintCard } from '../../components/complaints/ComplaintCard'
import { Button } from '../../components/ui/Button'
import { Card, CardHeader } from '../../components/ui/Card'
import { Alert } from '../../components/ui/Misc'
import { StatCard } from '../../components/ui/StatCard'
import { myComplaints } from '../../data/mock'

export default function CitizenDashboard() {
  const count = (fn: (s: string) => boolean) => myComplaints.filter((c) => fn(c.status)).length
  const toRate = myComplaints.find((c) => c.status === 'closed' && !c.rating)
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-ink-3">مساء الخير 👋</p>
          <h1 className="mt-1 text-2xl font-bold">أهلاً، عبدالله</h1>
          <p className="mt-1 text-sm text-ink-2">هذه نظرة سريعة على بلاغاتك.</p>
        </div>
        <Button to="/citizen/new" icon={Plus} size="lg" className="hidden sm:inline-flex">
          إنشاء بلاغ جديد
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label="إجمالي بلاغاتي" value={myComplaints.length} icon={FileText} accent="primary" />
        <StatCard label="البلاغات الجديدة" value={count((s) => s === 'new' || s === 'in_review')} icon={CircleDot} accent="info" />
        <StatCard label="قيد المعالجة" value={count((s) => s === 'in_progress')} icon={Loader} accent="warning" />
        <StatCard label="تم الحل" value={count((s) => s === 'resolved' || s === 'closed')} icon={CheckCircle2} accent="success" />
      </div>

      {toRate && (
        <Alert tone="warning" title="بلاغ بانتظار تقييمك">
          تم إغلاق البلاغ <b>{toRate.number}</b>. شاركنا رأيك في جودة الخدمة.{' '}
          <Link to={`/citizen/complaints/${toRate.id}/rate`} className="inline-flex items-center gap-1 font-semibold underline">
            <Star className="size-3.5" /> قيّم الآن
          </Link>
        </Alert>
      )}

      <Card>
        <CardHeader
          title="آخر البلاغات"
          subtitle="حالة كل بلاغ وآخر تحديث عليه"
          action={
            <Link to="/citizen/complaints" className="text-sm font-medium text-primary-700 hover:underline">
              عرض الكل
            </Link>
          }
        />
        <div className="divide-y divide-line p-2">
          {myComplaints.slice(0, 5).map((c) => (
            <ComplaintCard key={c.id} c={c} to={`/citizen/complaints/${c.id}`} />
          ))}
        </div>
      </Card>
    </div>
  )
}
