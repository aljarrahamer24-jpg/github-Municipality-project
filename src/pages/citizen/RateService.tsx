import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Heart, Send } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Card, CardBody } from '../../components/ui/Card'
import { Field, Textarea } from '../../components/ui/Form'
import { Stars } from '../../components/ui/Misc'
import { getCategory, getComplaint } from '../../data/mock'
import { cn } from '../../lib/utils'

const labels = ['', 'سيئة جداً', 'سيئة', 'مقبولة', 'جيدة', 'ممتازة']
const tagsGood = ['سرعة الاستجابة', 'جودة العمل', 'تعامل الموظفين', 'وضوح التحديثات']
const tagsBad = ['تأخير في الحل', 'الحل غير كامل', 'لا يوجد تواصل', 'المشكلة تكررت']

export default function RateService() {
  const { id } = useParams()
  const c = getComplaint(id)
  const [rating, setRating] = useState(0)
  const [tags, setTags] = useState<string[]>([])
  const [done, setDone] = useState(false)
  const tagList = rating >= 4 ? tagsGood : tagsBad

  if (done)
    return (
      <div className="mx-auto max-w-md py-10 text-center">
        <span className="mx-auto grid size-20 place-items-center rounded-full bg-secondary-50 text-secondary-500">
          <Heart className="size-10 fill-current" />
        </span>
        <h1 className="mt-6 text-2xl font-bold">شكراً لتقييمك!</h1>
        <p className="mt-2 text-ink-2">رأيك يصل مباشرة إلى إدارة البلدية ويساهم في تحسين الخدمة.</p>
        <Button to="/citizen" className="mt-6">
          العودة للوحتي
        </Button>
      </div>
    )

  return (
    <div className="mx-auto max-w-xl">
      <Card>
        <CardBody className="space-y-6 p-5 sm:p-8">
          <div className="text-center">
            <p className="text-xs text-ink-3 tabular-nums">{c.number}</p>
            <h1 className="mt-1 text-xl font-bold">قيّم الخدمة</h1>
            <p className="mt-1 text-sm text-ink-2">
              {c.title} — {getCategory(c.categoryId).name}
            </p>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Stars value={rating} size="lg" onChange={setRating} />
            <p className={cn('h-6 text-sm font-semibold', rating >= 4 ? 'text-success-600' : rating ? 'text-warning-600' : 'text-ink-3')}>{rating ? labels[rating] : 'اختر من 1 إلى 5 نجوم'}</p>
          </div>
          {rating > 0 && (
            <div>
              <p className="mb-2 text-sm font-medium">{rating >= 4 ? 'ما الذي أعجبك؟' : 'ما الذي يمكن تحسينه؟'}</p>
              <div className="flex flex-wrap gap-2">
                {tagList.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTags((p) => (p.includes(t) ? p.filter((x) => x !== t) : [...p, t]))}
                    className={cn('rounded-full border px-3 py-1.5 text-sm transition-colors', tags.includes(t) ? 'border-primary-600 bg-primary-50 text-primary-800' : 'border-line-strong text-ink-2 hover:bg-muted')}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          )}
          <Field label="تعليق" hint="اختياري">
            <Textarea placeholder="شاركنا تفاصيل تجربتك..." rows={4} />
          </Field>
          <Button block size="lg" icon={Send} disabled={!rating} onClick={() => setDone(true)}>
            إرسال التقييم
          </Button>
        </CardBody>
      </Card>
    </div>
  )
}
