import { useState } from 'react'
import { FileText, Plus, Search } from 'lucide-react'
import { ComplaintCard } from '../../components/complaints/ComplaintCard'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { EmptyState, Tabs } from '../../components/ui/Misc'
import { PageHeader } from '../../components/ui/PageHeader'
import { myComplaints } from '../../data/mock'

type T = 'all' | 'open' | 'done'

export default function MyComplaints() {
  const [tab, setTab] = useState<T>('all')
  const [q, setQ] = useState('')
  const open = (s: string) => ['new', 'in_review', 'in_progress'].includes(s)
  const list = myComplaints.filter((c) => (tab === 'all' ? true : tab === 'open' ? open(c.status) : !open(c.status))).filter((c) => `${c.number} ${c.title}`.includes(q))
  return (
    <div>
      <PageHeader title="بلاغاتي" description="جميع البلاغات التي قدمتها وحالتها الحالية." actions={<Button to="/citizen/new" icon={Plus}>بلاغ جديد</Button>} />
      <Card>
        <div className="flex flex-col gap-3 border-b border-line p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
          <Tabs
            value={tab}
            onChange={setTab}
            tabs={[
              { id: 'all', label: 'الكل', count: myComplaints.length },
              { id: 'open', label: 'مفتوحة', count: myComplaints.filter((c) => open(c.status)).length },
              { id: 'done', label: 'منتهية', count: myComplaints.filter((c) => !open(c.status)).length },
            ]}
          />
          <div className="relative sm:w-72">
            <Search className="pointer-events-none absolute start-3 top-1/2 size-4.5 -translate-y-1/2 text-ink-3" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="بحث..." className="h-10 w-full rounded-md border border-line-strong ps-10 pe-3 text-sm focus:border-primary-500 focus:outline-none" />
          </div>
        </div>
        {list.length ? (
          <div className="divide-y divide-line p-2">
            {list.map((c) => (
              <ComplaintCard key={c.id} c={c} to={`/citizen/complaints/${c.id}`} />
            ))}
          </div>
        ) : (
          <EmptyState icon={FileText} title="لا توجد بلاغات" description="لم يتم العثور على بلاغات مطابقة." action={<Button to="/citizen/new" icon={Plus}>قدّم أول بلاغ</Button>} />
        )}
      </Card>
    </div>
  )
}
