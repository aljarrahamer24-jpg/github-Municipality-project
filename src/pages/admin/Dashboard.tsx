import { Link } from 'react-router-dom'
import { CheckCircle2, CircleDot, ClipboardList, CloudRainWind, Download, Loader, Repeat, Smile, Timer } from 'lucide-react'
import { HBarChart, TrendChart } from '../../components/charts/Charts'
import { ComplaintsTable } from '../../components/complaints/ComplaintsTable'
import { Button } from '../../components/ui/Button'
import { Card, CardBody, CardHeader } from '../../components/ui/Card'
import { Select } from '../../components/ui/Form'
import { PageHeader } from '../../components/ui/PageHeader'
import { StatCard } from '../../components/ui/StatCard'
import { adminKpis, byCategory, byDepartment, byDistrict, complaints, monthlyTrend } from '../../data/mock'
import { formatNumber } from '../../lib/utils'

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="لوحة المدير"
        description="نظرة شاملة على أداء البلدية في معالجة البلاغات."
        actions={
          <>
            <Select defaultValue="6m" className="h-10 w-40" aria-label="الفترة">
              <option value="30d">آخر 30 يوماً</option>
              <option value="6m">آخر 6 أشهر</option>
              <option value="1y">هذا العام</option>
            </Select>
            <Button variant="outline" icon={Download} size="sm" className="h-10">
              تصدير
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 2xl:grid-cols-6">
        <StatCard label="إجمالي البلاغات" value={formatNumber(adminKpis.total)} icon={ClipboardList} accent="primary" trend={{ value: '8%', up: true, good: false }} hint="عن الفترة السابقة" />
        <StatCard label="البلاغات الجديدة" value={adminKpis.newCount} icon={CircleDot} accent="info" />
        <StatCard label="قيد المعالجة" value={adminKpis.inProgress} icon={Loader} accent="warning" />
        <StatCard label="المغلقة" value={formatNumber(adminKpis.closed)} icon={CheckCircle2} accent="success" hint="78% نسبة الإغلاق" />
        <StatCard label="متوسط زمن الإغلاق" value={`${adminKpis.avgCloseDays} يوم`} icon={Timer} accent="neutral" trend={{ value: '0.6 يوم', up: false, good: true }} />
        <StatCard label="متوسط رضا المواطنين" value={`${adminKpis.satisfaction} من 5`} icon={Smile} accent="gold" trend={{ value: '0.1', up: true }} />
      </div>

      {/* تنبيهات ذكية */}
      <div className="grid gap-3 md:grid-cols-2">
        <Link to="/admin/weather" className="flex items-center gap-3 rounded-card border border-warning-100 bg-warning-50 p-4 transition-colors hover:border-warning-500/40">
          <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-warning-100 text-warning-700"><CloudRainWind className="size-5" /></span>
          <div className="min-w-0 text-sm">
            <p className="font-semibold text-warning-700">منخفض جوي متوقع 2 — 4 أكتوبر</p>
            <p className="text-warning-700/80">3 مناطق عالية الخطورة تحتاج استعداداً مسبقاً</p>
          </div>
        </Link>
        <Link to="/admin/recurring" className="flex items-center gap-3 rounded-card border border-error-100 bg-error-50 p-4 transition-colors hover:border-error-500/40">
          <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-error-100 text-error-700"><Repeat className="size-5" /></span>
          <div className="min-w-0 text-sm">
            <p className="font-semibold text-error-700">6 مشاكل متكررة مكتشفة</p>
            <p className="text-error-700/80">2 منها تحتاج صيانة جذرية عاجلة</p>
          </div>
        </Link>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader title="البلاغات حسب الشهر" subtitle="المستلمة مقارنة بالمغلقة — آخر 6 أشهر" />
          <CardBody>
            <TrendChart data={monthlyTrend} />
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="البلاغات حسب النوع" subtitle="عدد البلاغات لكل نوع مشكلة" />
          <CardBody>
            <HBarChart data={byCategory} height={300} unit="بلاغ" />
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="البلاغات حسب القسم" />
          <CardBody>
            <HBarChart data={byDepartment} height={280} unit="بلاغ" />
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="البلاغات حسب المنطقة" action={<Link to="/admin/map" className="text-sm font-medium text-primary-700 hover:underline">عرض على الخريطة</Link>} />
          <CardBody>
            <HBarChart data={byDistrict} height={280} unit="بلاغ" />
          </CardBody>
        </Card>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">أحدث البلاغات</h2>
          <Link to="/admin/complaints" className="text-sm font-medium text-primary-700 hover:underline">عرض جميع البلاغات</Link>
        </div>
        <ComplaintsTable data={complaints.slice(0, 6)} basePath="/admin/complaints" showFilters={false} pageSize={6} />
      </div>
    </div>
  )
}
