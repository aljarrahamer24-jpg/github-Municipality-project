import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowUpDown, ChevronLeft, Inbox, ListFilter, MapPin, Search, X } from 'lucide-react'
import { categories, districts, employeesList, getCategory, getDistrict, priorityLabels } from '../../data/mock'
import type { Complaint, ComplaintStatus, Priority } from '../../data/types'
import { cn, formatDate } from '../../lib/utils'
import { OverdueBadge, PriorityBadge, StatusBadge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { Select } from '../ui/Form'
import { Avatar, EmptyState, Pagination, Tabs } from '../ui/Misc'

type SortKey = 'number' | 'createdAt' | 'priority'
const priorityRank: Record<Priority, number> = { low: 0, medium: 1, high: 2, urgent: 3 }

interface Props {
  data: Complaint[]
  basePath: string
  pageSize?: number
  showFilters?: boolean
  showAssignee?: boolean
  showTabs?: boolean
}

export function ComplaintsTable({ data, basePath, pageSize = 10, showFilters = true, showAssignee = true, showTabs = true }: Props) {
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [tab, setTab] = useState<'all' | ComplaintStatus | 'overdue'>('all')
  const [cat, setCat] = useState('')
  const [dist, setDist] = useState('')
  const [prio, setPrio] = useState('')
  const [assignee, setAssignee] = useState('')
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: 'createdAt', dir: -1 })
  const [page, setPage] = useState(1)
  const [filtersOpen, setFiltersOpen] = useState(false)

  const filtered = useMemo(() => {
    const list = data.filter((c) => {
      if (tab === 'overdue' ? !c.overdue : tab !== 'all' && c.status !== tab) return false
      if (cat && c.categoryId !== cat) return false
      if (dist && c.districtId !== dist) return false
      if (prio && c.priority !== prio) return false
      if (assignee && c.assignee !== assignee) return false
      if (q && !`${c.number} ${c.title} ${c.address}`.includes(q.trim())) return false
      return true
    })
    return list.sort((a, b) => {
      const v =
        sort.key === 'priority'
          ? priorityRank[a.priority] - priorityRank[b.priority]
          : sort.key === 'number'
            ? a.number.localeCompare(b.number)
            : a.createdAt.localeCompare(b.createdAt)
      return v * sort.dir
    })
  }, [data, tab, cat, dist, prio, assignee, q, sort])

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const rows = filtered.slice((page - 1) * pageSize, page * pageSize)
  const activeFilters = [cat, dist, prio, assignee].filter(Boolean).length
  const count = (s: ComplaintStatus) => data.filter((c) => c.status === s).length

  const toggleSort = (key: SortKey) => setSort((s) => ({ key, dir: s.key === key ? ((s.dir * -1) as 1 | -1) : -1 }))
  const reset = () => {
    setCat('')
    setDist('')
    setPrio('')
    setAssignee('')
    setQ('')
    setPage(1)
  }

  const sortHead = (k: SortKey, label: string) => (
    <button onClick={() => toggleSort(k)} className={cn('inline-flex items-center gap-1 hover:text-ink', sort.key === k && 'text-primary-700')}>
      {label}
      <ArrowUpDown className="size-3.5" />
    </button>
  )

  return (
    <div className="overflow-hidden rounded-card border border-line bg-surface shadow-card">
      {showFilters && (
        <div className="space-y-3 border-b border-line p-3 sm:p-4">
          {showTabs && (
            <Tabs
              value={tab}
              onChange={(v) => {
                setTab(v)
                setPage(1)
              }}
              tabs={[
                { id: 'all', label: 'الكل', count: data.length },
                { id: 'new', label: 'جديد', count: count('new') },
                { id: 'in_progress', label: 'قيد المعالجة', count: count('in_progress') },
                { id: 'overdue', label: 'متأخرة', count: data.filter((c) => c.overdue).length },
                { id: 'resolved', label: 'تم الحل', count: count('resolved') },
                { id: 'closed', label: 'مغلقة', count: count('closed') },
              ]}
            />
          )}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute start-3 top-1/2 size-4.5 -translate-y-1/2 text-ink-3" />
              <input
                value={q}
                onChange={(e) => {
                  setQ(e.target.value)
                  setPage(1)
                }}
                placeholder="ابحث برقم البلاغ أو العنوان أو الموقع..."
                className="h-11 w-full rounded-md border border-line-strong bg-surface ps-10 pe-3 text-sm placeholder:text-ink-3 focus:border-primary-500 focus:ring-4 focus:ring-primary-100 focus:outline-none"
              />
            </div>
            <Button variant="outline" icon={ListFilter} onClick={() => setFiltersOpen((o) => !o)} className="lg:hidden">
              <span className="hidden sm:inline">الفلاتر</span>
              {activeFilters > 0 && <span className="grid size-5 place-items-center rounded-full bg-primary-700 text-[11px] text-white">{activeFilters}</span>}
            </Button>
          </div>
          <div className={cn('grid gap-2 sm:grid-cols-2 lg:grid lg:grid-cols-5', filtersOpen ? 'grid' : 'hidden')}>
            <Select value={cat} onChange={(e) => setCat(e.target.value)} aria-label="النوع">
              <option value="">كل الأنواع</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
            <Select value={dist} onChange={(e) => setDist(e.target.value)} aria-label="المنطقة">
              <option value="">كل المناطق</option>
              {districts.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </Select>
            <Select value={prio} onChange={(e) => setPrio(e.target.value)} aria-label="الأولوية">
              <option value="">كل الأولويات</option>
              {Object.entries(priorityLabels).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </Select>
            {showAssignee ? (
              <Select value={assignee} onChange={(e) => setAssignee(e.target.value)} aria-label="الموظف">
                <option value="">كل الموظفين</option>
                {employeesList.map((e) => (
                  <option key={e}>{e}</option>
                ))}
              </Select>
            ) : (
              <span />
            )}
            <Button variant="ghost" icon={X} onClick={reset} disabled={!activeFilters && !q}>
              مسح الفلاتر
            </Button>
          </div>
        </div>
      )}

      {rows.length === 0 ? (
        <EmptyState icon={Inbox} title="لا توجد بلاغات مطابقة" description="جرّب تغيير كلمات البحث أو إزالة بعض الفلاتر." action={<Button variant="outline" onClick={reset}>مسح الفلاتر</Button>} />
      ) : (
        <>
          {/* جدول — من md فما فوق */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-sm">
              <thead className="bg-muted/70 text-xs font-semibold text-ink-2">
                <tr className="text-start">
                  <th className="px-4 py-3 text-start">
                    {sortHead('number', 'رقم البلاغ')}
                  </th>
                  <th className="px-4 py-3 text-start">النوع</th>
                  <th className="px-4 py-3 text-start">المنطقة</th>
                  <th className="px-4 py-3 text-start">
                    {sortHead('priority', 'الأولوية')}
                  </th>
                  <th className="px-4 py-3 text-start">الحالة</th>
                  <th className="px-4 py-3 text-start">
                    {sortHead('createdAt', 'تاريخ البلاغ')}
                  </th>
                  {showAssignee && <th className="px-4 py-3 text-start">الموظف المسؤول</th>}
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map((c) => (
                  <tr key={c.id} onClick={() => navigate(`${basePath}/${c.id}`)} className="cursor-pointer transition-colors hover:bg-primary-50/40">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-ink tabular-nums" dir="ltr">
                        {c.number}
                      </p>
                      <p className="mt-0.5 max-w-52 truncate text-xs text-ink-3">{c.title}</p>
                    </td>
                    <td className="px-4 py-3 text-ink-2">{getCategory(c.categoryId).name}</td>
                    <td className="px-4 py-3 text-ink-2">{getDistrict(c.districtId).name}</td>
                    <td className="px-4 py-3">
                      <PriorityBadge priority={c.priority} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        <StatusBadge status={c.status} />
                        {c.overdue && <OverdueBadge />}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-ink-2">{formatDate(c.createdAt)}</td>
                    {showAssignee && (
                      <td className="px-4 py-3">
                        {c.assignee ? (
                          <span className="inline-flex items-center gap-2 whitespace-nowrap">
                            <Avatar name={c.assignee} size="sm" />
                            {c.assignee}
                          </span>
                        ) : (
                          <span className="text-ink-3">غير محدد</span>
                        )}
                      </td>
                    )}
                    <td className="px-2 text-ink-3">
                      <ChevronLeft className="size-4" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* بطاقات — على الموبايل */}
          <ul className="divide-y divide-line md:hidden">
            {rows.map((c) => (
              <li key={c.id}>
                <Link to={`${basePath}/${c.id}`} className="block space-y-2 p-4 active:bg-muted">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-ink-3 tabular-nums">{c.number}</p>
                      <p className="mt-0.5 truncate font-semibold">{c.title}</p>
                    </div>
                    <StatusBadge status={c.status} />
                  </div>
                  <p className="flex items-center gap-1 text-xs text-ink-2">
                    <MapPin className="size-3.5" />
                    {getDistrict(c.districtId).name} · {getCategory(c.categoryId).name}
                  </p>
                  <div className="flex flex-wrap items-center gap-1.5 text-xs text-ink-3">
                    <PriorityBadge priority={c.priority} />
                    {c.overdue && <OverdueBadge />}
                    <span className="ms-auto">{formatDate(c.createdAt)}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
          <Pagination page={page} pages={pages} onChange={setPage} total={filtered.length} />
        </>
      )}
    </div>
  )
}

