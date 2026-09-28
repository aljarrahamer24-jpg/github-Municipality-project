import { useState } from 'react'
import { Mail, Phone, Save, User } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Card, CardBody, CardHeader } from '../../components/ui/Card'
import { Field, Input, Select, Switch } from '../../components/ui/Form'
import { Avatar } from '../../components/ui/Misc'
import { PageHeader } from '../../components/ui/PageHeader'
import { districts } from '../../data/mock'

export default function Profile() {
  const [sms, setSms] = useState(true)
  const [email, setEmail] = useState(true)
  const [weather, setWeather] = useState(true)
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title="حسابي" description="إدارة بياناتك الشخصية وتفضيلات الإشعارات." />
      <Card>
        <CardBody className="flex items-center gap-4">
          <Avatar name="عبدالله محمود" size="lg" />
          <div>
            <p className="text-lg font-semibold">عبدالله محمود</p>
            <p className="text-sm text-ink-3">عضو منذ يناير 2026 · 7 بلاغات</p>
          </div>
        </CardBody>
      </Card>
      <Card>
        <CardHeader title="البيانات الشخصية" />
        <CardBody className="grid gap-4 sm:grid-cols-2">
          <Field label="الاسم الكامل">
            <Input icon={User} defaultValue="عبدالله محمود" />
          </Field>
          <Field label="رقم الهاتف">
            <Input icon={Phone} defaultValue="0790000001" dir="ltr" className="text-end" />
          </Field>
          <Field label="البريد الإلكتروني">
            <Input icon={Mail} defaultValue="abdullah@example.com" />
          </Field>
          <Field label="منطقة السكن">
            <Select defaultValue="z-5">
              {districts.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </Select>
          </Field>
        </CardBody>
      </Card>
      <Card>
        <CardHeader title="تفضيلات الإشعارات" />
        <CardBody className="space-y-4">
          <Switch checked={sms} onChange={setSms} label="إشعارات الرسائل النصية" />
          <Switch checked={email} onChange={setEmail} label="إشعارات البريد الإلكتروني" />
          <Switch checked={weather} onChange={setWeather} label="التنبيهات الجوية لمنطقتي" />
        </CardBody>
      </Card>
      <div className="flex justify-end">
        <Button icon={Save}>حفظ التغييرات</Button>
      </div>
    </div>
  )
}
