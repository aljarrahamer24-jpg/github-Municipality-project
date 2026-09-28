import { Download } from 'lucide-react'
import { ComplaintsTable } from '../../components/complaints/ComplaintsTable'
import { Button } from '../../components/ui/Button'
import { PageHeader } from '../../components/ui/PageHeader'
import { complaints } from '../../data/mock'

export default function ComplaintsPage({ base }: { base: 'employee' | 'admin' }) {
  return (
    <div>
      <PageHeader
        breadcrumbs={[{ label: 'الرئيسية', to: `/${base}` }, { label: 'البلاغات' }]}
        title={base === 'admin' ? 'جميع البلاغات' : 'البلاغات'}
        description="ابحث وصفِّ ورتّب البلاغات، واضغط على أي بلاغ لعرض التفاصيل."
        actions={<Button variant="outline" icon={Download}>تصدير Excel</Button>}
      />
      <ComplaintsTable data={complaints} basePath={`/${base}/complaints`} pageSize={12} />
    </div>
  )
}
