import { Bell, CloudRain, MessageSquare, RefreshCw, Star } from 'lucide-react'
import { Card } from '../../components/ui/Card'
import { PageHeader } from '../../components/ui/PageHeader'
import { notifications } from '../../data/mock'
import { cn } from '../../lib/utils'

const icons = { status: RefreshCw, comment: MessageSquare, rating: Star, weather: CloudRain }

export default function Notifications() {
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="الإشعارات" description="آخر التحديثات على بلاغاتك وتنبيهات البلدية." actions={<button className="text-sm font-medium text-primary-700">تعليم الكل كمقروء</button>} />
      <Card className="divide-y divide-line">
        {notifications.map((n) => {
          const Icon = icons[n.type] ?? Bell
          return (
            <div key={n.id} className={cn('flex gap-3 p-4', !n.read && 'bg-primary-50/40')}>
              <span className={cn('grid size-10 shrink-0 place-items-center rounded-full', n.type === 'weather' ? 'bg-warning-50 text-warning-600' : 'bg-primary-50 text-primary-700')}>
                <Icon className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold">{n.title}</p>
                  <span className="shrink-0 text-xs text-ink-3">{n.at}</span>
                </div>
                <p className="mt-0.5 text-sm text-ink-2">{n.body}</p>
              </div>
              {!n.read && <span className="mt-2 size-2 shrink-0 rounded-full bg-primary-600" />}
            </div>
          )
        })}
      </Card>
    </div>
  )
}
