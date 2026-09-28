import { Frown, KeyRound, MessageSquare, Smile, Star, ThumbsUp } from 'lucide-react'
import { HBarChart, SimpleLine } from '../../components/charts/Charts'
import { Badge } from '../../components/ui/Badge'
import { Card, CardBody, CardHeader } from '../../components/ui/Card'
import { Select } from '../../components/ui/Form'
import { Progress, Stars } from '../../components/ui/Misc'
import { PageHeader } from '../../components/ui/PageHeader'
import { StatCard } from '../../components/ui/StatCard'
import { byDepartment, dissatisfactionReasons, ratingDistribution, recentFeedback, satisfactionByMonth } from '../../data/mock'

export default function Satisfaction() {
  const total = ratingDistribution.reduce((a, r) => a + r.count, 0)
  const avg = ratingDistribution.reduce((a, r) => a + r.stars * r.count, 0) / total
  const satisfied = ((ratingDistribution[0].count + ratingDistribution[1].count) / total) * 100
  const maxReason = Math.max(...dissatisfactionReasons.map((r) => r.count))
  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[{ label: 'الرئيسية', to: '/admin' }, { label: 'رضا المواطنين' }]}
        title="رضا المواطنين"
        description="تحليل تقييمات المواطنين بعد إغلاق البلاغات وتحليل التعليقات بالكلمات المفتاحية."
        actions={<Select defaultValue="6m" className="h-10 w-40"><option value="6m">آخر 6 أشهر</option><option value="1y">هذا العام</option></Select>}
      />
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label="متوسط التقييم" value={`${avg.toFixed(1)} من 5`} icon={Star} accent="gold" trend={{ value: '0.2', up: true }} hint="عن الفترة السابقة" />
        <StatCard label="نسبة الرضا" value={`${satisfied.toFixed(0)}%`} icon={Smile} accent="success" />
        <StatCard label="عدد التقييمات" value={total} icon={MessageSquare} accent="primary" />
        <StatCard label="نسبة عدم الرضا" value={`${(((ratingDistribution[3].count + ratingDistribution[4].count) / total) * 100).toFixed(0)}%`} icon={Frown} accent="error" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <Card>
          <CardHeader title="توزيع النجوم" />
          <CardBody className="space-y-5">
            <div className="flex items-center gap-4">
              <p className="text-5xl font-bold">{avg.toFixed(1)}</p>
              <div>
                <Stars value={avg} />
                <p className="mt-1 text-xs text-ink-3">بناءً على {total} تقييماً</p>
              </div>
            </div>
            <div className="space-y-2.5">
              {ratingDistribution.map((r) => (
                <div key={r.stars} className="flex items-center gap-3 text-sm">
                  <span className="flex w-8 items-center gap-0.5 font-medium">{r.stars}<Star className="size-3.5 fill-secondary-400 text-secondary-400" /></span>
                  <Progress value={(r.count / total) * 100} tone={r.stars >= 4 ? 'success' : r.stars === 3 ? 'gold' : 'error'} className="flex-1" />
                  <span className="w-10 text-end text-ink-2 tabular-nums">{r.count}</span>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="مقارنة الأشهر" subtitle="متوسط التقييم الشهري (من 5)" />
          <CardBody>
            <SimpleLine data={satisfactionByMonth} domain={[3, 5]} height={260} />
          </CardBody>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="مقارنة الأقسام" subtitle="متوسط تقييم كل قسم (من 5)" />
          <CardBody>
            <HBarChart data={byDepartment.map((d) => ({ name: d.name, value: d.satisfaction }))} height={280} unit="/ 5" name="التقييم" />
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="أكثر أسباب عدم الرضا" subtitle="مستخرجة من التعليقات عبر الكلمات المفتاحية" action={<KeyRound className="size-5 text-ink-3" />} />
          <CardBody className="space-y-4">
            {dissatisfactionReasons.map((r, i) => (
              <div key={r.reason} className="space-y-1.5">
                <div className="flex items-center justify-between gap-2 text-sm">
                  <span className="flex items-center gap-2 font-medium">
                    <span className="grid size-6 place-items-center rounded-full bg-error-50 text-xs font-bold text-error-700">{i + 1}</span>
                    {r.reason}
                  </span>
                  <span className="text-ink-2 tabular-nums">{r.count}</span>
                </div>
                <Progress value={(r.count / maxReason) * 100} tone="error" />
                <p className="text-xs text-ink-3">الكلمة المفتاحية: «{r.keyword}»</p>
              </div>
            ))}
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader title="أحدث التعليقات" />
        <div className="grid divide-y divide-line md:grid-cols-3 md:divide-x md:divide-y-0 md:divide-x-reverse">
          {recentFeedback.map((f) => (
            <div key={f.name} className="space-y-2 p-5">
              <div className="flex items-center justify-between">
                <p className="font-semibold">{f.name}</p>
                <Stars value={f.rating} size="sm" />
              </div>
              <p className="text-sm leading-relaxed text-ink-2">«{f.text}»</p>
              <div className="flex items-center justify-between text-xs text-ink-3">
                <Badge tone={f.rating >= 4 ? 'success' : 'error'} icon={f.rating >= 4 ? ThumbsUp : Frown}>{f.rating >= 4 ? 'إيجابي' : 'سلبي'}</Badge>
                <span>{f.dept}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
