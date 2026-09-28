import { Link } from 'react-router-dom'
import { CalendarDays, ChevronLeft, MapPin } from 'lucide-react'
import { getCategory, getDistrict } from '../../data/mock'
import type { Complaint } from '../../data/types'
import { getIcon } from '../../lib/icons'
import { formatDate } from '../../lib/utils'
import { StatusBadge } from '../ui/Badge'

// بطاقة بلاغ للمواطن (قائمة بلاغاتي / آخر البلاغات)
export function ComplaintCard({ c, to }: { c: Complaint; to: string }) {
  const cat = getCategory(c.categoryId)
  const Icon = getIcon(cat.icon)
  return (
    <Link to={to} className="group flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-muted sm:gap-4">
      <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-primary-50 text-primary-700">
        <Icon className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <p className="truncate font-semibold">{c.title}</p>
          <StatusBadge status={c.status} />
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-ink-3">
          <span className="tabular-nums">{c.number}</span>
          <span className="inline-flex items-center gap-1">
            <MapPin className="size-3.5" />
            {getDistrict(c.districtId).name}
          </span>
          <span className="inline-flex items-center gap-1">
            <CalendarDays className="size-3.5" />
            {formatDate(c.createdAt)}
          </span>
        </div>
      </div>
      <ChevronLeft className="size-5 shrink-0 text-ink-3 transition-transform group-hover:-translate-x-0.5" />
    </Link>
  )
}
