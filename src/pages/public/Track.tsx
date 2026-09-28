import { useState } from 'react'
import { Hash, Search } from 'lucide-react'
import { Timeline, StatusStepper } from '../../components/complaints/Timeline'
import { StatusBadge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card, CardBody } from '../../components/ui/Card'
import { Field, Input } from '../../components/ui/Form'
import { Alert } from '../../components/ui/Misc'
import { complaints, getCategory, getDepartment, getDistrict } from '../../data/mock'
import { formatDate } from '../../lib/utils'

// متابعة بلاغ برقم المتابعة (بدون تسجيل دخول)
export default function Track() {
  const [q, setQ] = useState('BL-2026-01480')
  const [result, setResult] = useState<(typeof complaints)[number] | null | undefined>(undefined)
  const search = () => setResult(complaints.find((c) => c.number.toLowerCase() === q.trim().toLowerCase()) ?? null)
  return (
    <div className="container-page max-w-3xl py-12 sm:py-16">
      <div className="text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-primary-50 text-primary-700">
          <Search className="size-7" />
        </span>
        <h1 className="mt-4 text-2xl font-bold sm:text-3xl">متابعة بلاغ</h1>
        <p className="mt-2 text-ink-2">أدخل رقم البلاغ الذي وصلك عبر الرسائل أو البريد الإلكتروني.</p>
      </div>
      <Card className="mt-8">
        <CardBody>
          <form
            className="flex flex-col gap-3 sm:flex-row sm:items-end"
            onSubmit={(e) => {
              e.preventDefault()
              search()
            }}
          >
            <Field label="رقم البلاغ" className="flex-1">
              <Input icon={Hash} value={q} onChange={(e) => setQ(e.target.value)} placeholder="BL-2026-00000" dir="ltr" className="text-end" />
            </Field>
            <Button type="submit" icon={Search} size="md">
              بحث
            </Button>
          </form>
        </CardBody>
      </Card>

      {result === null && (
        <Alert tone="error" title="لم يتم العثور على البلاغ" className="mt-6">
          تأكد من كتابة رقم البلاغ بشكل صحيح، مثال: BL-2026-01480
        </Alert>
      )}
      {result && (
        <Card className="mt-6">
          <CardBody className="space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs text-ink-3 tabular-nums">{result.number}</p>
                <h2 className="mt-1 text-lg font-semibold">{result.title}</h2>
                <p className="mt-1 text-sm text-ink-2">
                  {getCategory(result.categoryId).name} · {getDistrict(result.districtId).name} · {formatDate(result.createdAt)}
                </p>
              </div>
              <StatusBadge status={result.status} />
            </div>
            <StatusStepper status={result.status} />
            <div className="rounded-lg bg-canvas p-3 text-sm text-ink-2">
              القسم المسؤول: <b className="text-ink">{getDepartment(result.departmentId).name}</b>
            </div>
            <Timeline events={result.timeline} />
          </CardBody>
        </Card>
      )}
    </div>
  )
}
