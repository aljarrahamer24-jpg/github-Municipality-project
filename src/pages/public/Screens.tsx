import { Link } from 'react-router-dom'
import { Briefcase, ExternalLink, Globe, KeyRound, Palette, ShieldCheck, User } from 'lucide-react'
import { Card, CardHeader } from '../../components/ui/Card'
import { PageHeader } from '../../components/ui/PageHeader'

// فهرس كل شاشات النموذج — يسهل مراجعة التصميم وعرضه في مناقشة المشروع
const groups = [
  { title: 'الصفحات العامة', icon: Globe, items: [['/', 'الصفحة الرئيسية'], ['/track', 'متابعة بلاغ'], ['/design-system', 'نظام التصميم (Design System)']] },
  { title: 'المصادقة', icon: KeyRound, items: [['/login', 'تسجيل الدخول'], ['/register', 'إنشاء حساب'], ['/forgot-password', 'نسيت كلمة المرور'], ['/reset-password', 'إعادة تعيين كلمة المرور']] },
  {
    title: 'المواطن',
    icon: User,
    items: [['/citizen', 'لوحة المواطن'], ['/citizen/complaints', 'بلاغاتي'], ['/citizen/new', 'إنشاء بلاغ'], ['/citizen/complaints/1480', 'تفاصيل بلاغ (قيد المعالجة)'], ['/citizen/complaints/1479', 'تفاصيل بلاغ (مغلق)'], ['/citizen/complaints/1479/rate', 'تقييم الخدمة'], ['/citizen/notifications', 'الإشعارات'], ['/citizen/profile', 'حسابي']],
  },
  { title: 'موظف البلدية', icon: Briefcase, items: [['/employee', 'لوحة الموظف'], ['/employee/complaints', 'جدول البلاغات'], ['/employee/complaints/1480', 'تفاصيل البلاغ للموظف'], ['/employee/map', 'خريطة البلاغات']] },
  {
    title: 'مدير البلدية',
    icon: ShieldCheck,
    items: [
      ['/admin', 'لوحة المدير'], ['/admin/complaints', 'جميع البلاغات'], ['/admin/map', 'خريطة البلاغات + المناطق الساخنة'], ['/admin/recurring', 'المشاكل المتكررة'], ['/admin/weather', 'الاستعداد للحالات الجوية'], ['/admin/reports', 'التقارير الشهرية'], ['/admin/satisfaction', 'رضا المواطنين'],
      ['/admin/users', 'إدارة المستخدمين'], ['/admin/employees', 'إدارة الموظفين'], ['/admin/departments', 'إدارة الأقسام'], ['/admin/categories', 'إدارة أنواع المشاكل'], ['/admin/districts', 'إدارة المناطق'], ['/admin/keywords', 'الكلمات المفتاحية'], ['/admin/settings', 'إعدادات النظام'],
    ],
  },
]

export default function Screens() {
  return (
    <div className="container-page py-10">
      <PageHeader title="فهرس الشاشات" description="جميع واجهات النموذج مجمعة حسب الدور — مرحلة التصميم (بيانات تجريبية)." />
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {groups.map((g) => (
          <Card key={g.title}>
            <CardHeader title={<span className="flex items-center gap-2"><g.icon className="size-5 text-primary-700" />{g.title}</span>} subtitle={`${g.items.length} شاشات`} />
            <ul className="p-2">
              {g.items.map(([to, label]) => (
                <li key={to}>
                  <Link to={to} className="flex items-center justify-between gap-2 rounded-md px-3 py-2.5 text-sm hover:bg-muted">
                    <span>{label}</span>
                    <span className="flex items-center gap-1 text-xs text-ink-3" dir="ltr">{to}<ExternalLink className="size-3" /></span>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        ))}
        <Card className="flex items-center gap-3 p-5">
          <Palette className="size-8 text-secondary-500" />
          <p className="text-sm text-ink-2">التوثيق الكامل (Sitemap، User Flows، Design System) موجود في مجلد <code className="rounded bg-muted px-1">docs/</code> داخل المستودع.</p>
        </Card>
      </div>
    </div>
  )
}
