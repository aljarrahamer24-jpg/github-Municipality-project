import { ArrowLeft, Bell, CheckCircle2, Clock, FileText, MapPin, Search, ShieldCheck, Smile, Star, Timer } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { SectionTitle, Stars } from '../../components/ui/Misc'
import { categories } from '../../data/mock'
import { getIcon } from '../../lib/icons'

const stats = [
  { label: 'بلاغ تم استلامه', value: '12,480', icon: FileText },
  { label: 'نسبة الإغلاق', value: '91%', icon: CheckCircle2 },
  { label: 'متوسط زمن الحل', value: '3.7 يوم', icon: Timer },
  { label: 'رضا المواطنين', value: '4.2 من 5', icon: Smile },
]

const steps = [
  { title: 'قدّم البلاغ', text: 'اختر نوع المشكلة وأرفق الصور وحدد الموقع على الخريطة.', icon: FileText },
  { title: 'استلم رقم المتابعة', text: 'يصلك رقم بلاغ فوري وإشعار بكل تحديث على حالته.', icon: Bell },
  { title: 'المعالجة الميدانية', text: 'يُحال البلاغ تلقائياً للقسم المختص ويُتابع حتى الإنجاز.', icon: Clock },
  { title: 'قيّم الخدمة', text: 'بعد الإغلاق قيّم جودة الخدمة لنستمر في التحسين.', icon: Star },
]

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-primary-800 text-white">
        <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)', backgroundSize: '22px 22px' }} />
        <div className="absolute -end-32 -top-32 size-[28rem] rounded-full bg-primary-500/30 blur-3xl" />
        <div className="container-page relative grid items-center gap-10 py-14 sm:py-20 lg:grid-cols-[1.1fr_1fr]">
          <div className="space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs ring-1 ring-white/15">
              <ShieldCheck className="size-4 text-secondary-300" /> المنصة الرسمية لبلدية المدينة
            </span>
            <h1 className="text-3xl leading-[1.35] font-bold sm:text-4xl lg:text-5xl">
              مدينتك أجمل
              <br />
              <span className="text-secondary-300">بمشاركتك</span>
            </h1>
            <p className="max-w-xl text-base leading-relaxed text-white/80 sm:text-lg">
              منصة موحّدة لتقديم الشكاوى وطلبات الخدمات البلدية ومتابعتها بشفافية — من الحفر والإنارة إلى النظافة وتصريف المياه.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button to="/citizen/new" size="lg" variant="accent" icon={FileText}>
                تقديم بلاغ
              </Button>
              <Button to="/track" size="lg" variant="outline" icon={Search} className="border-white/30 bg-white/5 text-white hover:bg-white/15">
                متابعة بلاغ
              </Button>
            </div>
          </div>
          {/* بطاقة توضيحية */}
          <div className="relative mx-auto w-full max-w-md">
            <div className="rounded-xl bg-surface p-5 text-ink shadow-modal">
              <div className="flex items-center justify-between">
                <span className="text-xs text-ink-3 tabular-nums">BL-2026-01480</span>
                <span className="rounded-full bg-warning-50 px-2.5 py-0.5 text-xs font-medium text-warning-700">قيد المعالجة</span>
              </div>
              <p className="mt-3 font-semibold">حفرة كبيرة في منتصف الشارع</p>
              <p className="mt-1 flex items-center gap-1 text-xs text-ink-3">
                <MapPin className="size-3.5" /> حي الجامعة — شارع الجامعة
              </p>
              <div className="mt-4 space-y-3">
                {['تم استلام البلاغ', 'تمت الإحالة إلى قسم الطرق', 'توجه الفريق الميداني للموقع'].map((t, i) => (
                  <div key={t} className="flex items-center gap-3 text-sm">
                    <span className={i < 2 ? 'grid size-6 place-items-center rounded-full bg-primary-600 text-white' : 'grid size-6 place-items-center rounded-full bg-warning-100 text-warning-700'}>
                      {i < 2 ? <CheckCircle2 className="size-4" /> : <Clock className="size-3.5" />}
                    </span>
                    {t}
                  </div>
                ))}
              </div>
            </div>
            <div className="absolute -bottom-5 -start-4 hidden items-center gap-2 rounded-lg bg-surface px-3 py-2 text-ink shadow-pop sm:flex">
              <Stars value={5} size="sm" />
              <span className="text-xs font-medium">شكراً لسرعة الاستجابة!</span>
            </div>
          </div>
        </div>
      </section>

      {/* إحصائيات */}
      <section className="container-page relative z-10 -mt-8">
        <div className="grid grid-cols-2 gap-3 rounded-xl border border-line bg-surface p-3 shadow-pop sm:p-4 lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="flex items-center gap-3 rounded-lg p-2 sm:p-3">
              <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-primary-50 text-primary-700">
                <s.icon className="size-5" />
              </span>
              <div className="min-w-0">
                <p className="text-lg font-bold sm:text-xl">{s.value}</p>
                <p className="truncate text-xs text-ink-2 sm:text-sm">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* الخدمات */}
      <section id="services" className="container-page scroll-mt-20 py-16 sm:py-20">
        <SectionTitle eyebrow="الخدمات البلدية" title="ماذا يمكنك أن تبلّغ عنه؟" description="اختر نوع المشكلة وسيتم توجيه بلاغك تلقائياً إلى القسم المختص." center />
        <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
          {categories
            .filter((c) => c.active)
            .map((c) => {
              const Icon = getIcon(c.icon)
              return (
                <Link key={c.id} to="/citizen/new" className="group rounded-card border border-line bg-surface p-4 transition-all hover:-translate-y-0.5 hover:border-primary-200 hover:shadow-pop sm:p-5">
                  <span className="grid size-12 place-items-center rounded-lg bg-primary-50 text-primary-700 transition-colors group-hover:bg-primary-700 group-hover:text-white">
                    <Icon className="size-6" />
                  </span>
                  <p className="mt-4 font-semibold">{c.name}</p>
                  <p className="mt-1 text-xs text-ink-3">المدة المتوقعة: {c.slaDays} أيام</p>
                </Link>
              )
            })}
        </div>
      </section>

      {/* كيف تعمل */}
      <section id="how" className="scroll-mt-20 bg-surface py-16 sm:py-20">
        <div className="container-page">
          <SectionTitle eyebrow="خطوات بسيطة" title="كيف تعمل المنصة؟" center />
          <ol className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, i) => (
              <li key={s.title} className="relative text-center">
                <span className="relative mx-auto grid size-16 place-items-center rounded-2xl bg-primary-700 text-white shadow-pop">
                  <s.icon className="size-7" />
                  <span className="absolute -end-2 -top-2 grid size-7 place-items-center rounded-full bg-secondary-500 text-xs font-bold ring-4 ring-surface">{i + 1}</span>
                </span>
                <h3 className="mt-5 font-semibold">{s.title}</h3>
                <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-ink-2">{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* CTA */}
      <section className="container-page py-16">
        <div className="flex flex-col items-start justify-between gap-6 rounded-xl bg-gradient-to-l from-primary-700 to-primary-900 p-8 text-white sm:p-10 md:flex-row md:items-center">
          <div>
            <h2 className="text-2xl font-bold">لاحظت مشكلة في حيّك؟</h2>
            <p className="mt-2 text-white/75">بلاغك يصل مباشرة إلى القسم المختص خلال ثوانٍ.</p>
          </div>
          <Button to="/citizen/new" size="lg" variant="accent" iconEnd={ArrowLeft}>
            قدّم بلاغك الآن
          </Button>
        </div>
      </section>
    </>
  )
}
