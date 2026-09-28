/* ==========================================================================
   بيانات تجريبية (Mock Data) لغرض عرض التصميم فقط — لا توجد بيانات حقيقية.
   في المرحلة القادمة تُستبدل هذه البيانات بقراءة من قاعدة البيانات.
   ========================================================================== */


const MUNICIPALITY_NAME = 'بلدية المدينة'
const PLATFORM_NAME = 'منصة إدارة شكاوى وطلبات خدمات البلدية'
const MAP_CENTER = [32.5536, 35.8497]

const departments = [
  { id: 'd-roads', name: 'قسم الطرق والأرصفة', head: 'م. سامر العلي', employees: 14, active: true },
  { id: 'd-clean', name: 'قسم النظافة العامة', head: 'أ. خالد يوسف', employees: 22, active: true },
  { id: 'd-light', name: 'قسم الإنارة', head: 'م. رنا حداد', employees: 8, active: true },
  { id: 'd-water', name: 'قسم المياه والصرف', head: 'م. عمر الخطيب', employees: 11, active: true },
  { id: 'd-parks', name: 'قسم الحدائق والتشجير', head: 'أ. ليلى منصور', employees: 9, active: true },
  { id: 'd-build', name: 'قسم الرقابة والتنظيم', head: 'م. فادي سليمان', employees: 6, active: true },
]

const categories = [
  { id: 'c-pothole', name: 'حفر في الطرق', icon: 'construction', departmentId: 'd-roads', slaDays: 7, active: true },
  { id: 'c-waste', name: 'تراكم النفايات', icon: 'trash', departmentId: 'd-clean', slaDays: 2, active: true },
  { id: 'c-light', name: 'إنارة الشوارع', icon: 'lightbulb', departmentId: 'd-light', slaDays: 5, active: true },
  { id: 'c-water', name: 'تسرب مياه', icon: 'droplets', departmentId: 'd-water', slaDays: 3, active: true },
  { id: 'c-sewer', name: 'انسداد صرف صحي', icon: 'waves-horizontal', departmentId: 'd-water', slaDays: 2, active: true },
  { id: 'c-flood', name: 'تجمع مياه الأمطار', icon: 'cloud-rain', departmentId: 'd-water', slaDays: 1, active: true },
  { id: 'c-trees', name: 'الأشجار والحدائق', icon: 'tree-pine', departmentId: 'd-parks', slaDays: 10, active: true },
  { id: 'c-sidewalk', name: 'تلف الأرصفة', icon: 'footprints', departmentId: 'd-roads', slaDays: 10, active: true },
  { id: 'c-violation', name: 'مخالفات بناء', icon: 'building-complex', departmentId: 'd-build', slaDays: 14, active: true },
  { id: 'c-animals', name: 'حيوانات ضالة', icon: 'paw-print', departmentId: 'd-clean', slaDays: 3, active: false },
]

const districts = [
  { id: 'z-1', name: 'وسط البلد', lat: 32.5556, lng: 35.8502, population: 42000, floodRisk: 'high' },
  { id: 'z-2', name: 'حي النزهة', lat: 32.5621, lng: 35.8431, population: 28000, floodRisk: 'medium' },
  { id: 'z-3', name: 'حي الروضة', lat: 32.5468, lng: 35.8588, population: 35000, floodRisk: 'high' },
  { id: 'z-4', name: 'حي الياسمين', lat: 32.5702, lng: 35.8564, population: 19000, floodRisk: 'low' },
  { id: 'z-5', name: 'حي الجامعة', lat: 32.5389, lng: 35.8452, population: 31000, floodRisk: 'medium' },
  { id: 'z-6', name: 'الحي الشرقي', lat: 32.5519, lng: 35.8715, population: 24000, floodRisk: 'high' },
  { id: 'z-7', name: 'حي الورود', lat: 32.5655, lng: 35.8338, population: 16000, floodRisk: 'low' },
  { id: 'z-8', name: 'المنطقة الصناعية', lat: 32.5412, lng: 35.8298, population: 8000, floodRisk: 'medium' },
]

const statusLabels = {
  new: 'جديد',
  in_review: 'قيد المراجعة',
  in_progress: 'قيد المعالجة',
  resolved: 'تم الحل',
  closed: 'مغلق',
  rejected: 'مرفوض',
}

const priorityLabels = {
  low: 'منخفضة',
  medium: 'متوسطة',
  high: 'عالية',
  urgent: 'عاجلة',
}

const employeesList = ['أحمد سعيد', 'محمد ناصر', 'سارة عودة', 'يزن القاسم', 'هبة الزعبي', 'باسل حمدان']

const citizenNames = ['عبدالله محمود', 'مريم خليل', 'حسن إبراهيم', 'نور الهدى', 'يوسف عيسى', 'ريم جابر', 'طارق سليم', 'لانا فريد']

const titlesByCategory = {
  'c-pothole': ['حفرة كبيرة في منتصف الشارع', 'هبوط في طبقة الإسفلت', 'حفر متعددة قرب الإشارة'],
  'c-waste': ['حاوية نفايات ممتلئة منذ أيام', 'نفايات متراكمة بجانب المدرسة', 'عدم انتظام جمع النفايات'],
  'c-light': ['عمود إنارة معطل', 'إنارة الشارع مطفأة بالكامل', 'أسلاك مكشوفة في عمود إنارة'],
  'c-water': ['تسرب مياه من خط رئيسي', 'انكسار ماسورة مياه', 'تسرب مياه على الرصيف'],
  'c-sewer': ['طفح مناهل الصرف الصحي', 'روائح كريهة من شبكة الصرف', 'انسداد في منهل الصرف'],
  'c-flood': ['تجمع مياه الأمطار عند التقاطع', 'غرق النفق بمياه الأمطار', 'تصريف مياه الأمطار لا يعمل'],
  'c-trees': ['شجرة آيلة للسقوط', 'حديقة الحي تحتاج صيانة', 'أغصان تعيق الإنارة'],
  'c-sidewalk': ['رصيف مكسور يعيق المشاة', 'بلاط الرصيف مقتلع', 'رصيف غير صالح لذوي الإعاقة'],
  'c-violation': ['بناء دون ترخيص', 'إشغال الرصيف بمواد بناء', 'تعدٍّ على الارتداد'],
  'c-animals': ['كلاب ضالة قرب المدرسة'],
}

const streets = ['شارع الملك', 'شارع الجامعة', 'شارع البتراء', 'شارع الحصن', 'شارع السلام', 'شارع الأمير', 'شارع فلسطين', 'شارع القدس']

// مولّد أرقام شبه عشوائي ثابت حتى يبقى التصميم مستقراً بين كل تحميل
function seeded(seed) {
  let s = seed
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}
const rand = seeded(42)
const pick = (arr) => arr[Math.floor(rand() * arr.length)]

const TODAY = new Date('2026-09-28T10:00:00')
const daysAgo = (d, h = 9) => {
  const date = new Date(TODAY)
  date.setDate(date.getDate() - d)
  date.setHours(h, Math.floor(rand() * 59))
  return date.toISOString()
}

function buildTimeline(status, created, dept, assignee) {
  const t = [
    { id: 't1', status: 'new', title: 'تم استلام البلاغ', note: 'تم تسجيل البلاغ في النظام وإرسال رقم المتابعة للمواطن.', by: 'النظام', at: daysAgo(created, 8) },
  ]
  if (status === 'new') return t
  t.push({ id: 't2', status: 'in_review', title: 'قيد المراجعة', note: 'تمت مراجعة البلاغ والتحقق من البيانات.', by: 'مركز الاستقبال', at: daysAgo(Math.max(created - 1, 0), 11) })
  if (status === 'rejected') {
    t.push({ id: 't3', status: 'rejected', title: 'تم رفض البلاغ', note: 'البلاغ خارج نطاق صلاحيات البلدية.', by: 'مركز الاستقبال', at: daysAgo(Math.max(created - 1, 0), 14) })
    return t
  }
  if (status === 'in_review') return t
  t.push({ id: 't3', status: 'assigned', title: `تمت الإحالة إلى ${dept}`, note: `الموظف المسؤول: ${assignee}`, by: 'مشرف القسم', at: daysAgo(Math.max(created - 2, 0), 9) })
  t.push({ id: 't4', status: 'in_progress', title: 'بدء المعالجة', note: 'توجه الفريق الميداني إلى الموقع.', by: assignee, at: daysAgo(Math.max(created - 3, 0), 10) })
  if (status === 'in_progress') return t
  t.push({ id: 't5', status: 'resolved', title: 'تم حل المشكلة', note: 'تمت المعالجة وإرفاق صور بعد الإنجاز.', by: assignee, at: daysAgo(Math.max(created - 5, 0), 13) })
  if (status === 'resolved') return t
  t.push({ id: 't6', status: 'closed', title: 'تم إغلاق البلاغ', note: 'تم إغلاق البلاغ بعد تأكيد المعالجة.', by: 'مشرف القسم', at: daysAgo(Math.max(created - 6, 0), 15) })
  return t
}

const statusPool = ['new', 'new', 'in_review', 'in_progress', 'in_progress', 'in_progress', 'resolved', 'closed', 'closed', 'closed', 'rejected']
const priorityPool = ['low', 'medium', 'medium', 'high', 'high', 'urgent']

const complaints = Array.from({ length: 48 }, (_, i) => {
  const category = pick(categories.filter((c) => c.active))
  const district = pick(districts)
  const dept = departments.find((d) => d.id === category.departmentId)
  const status = i === 0 ? 'in_progress' : i === 1 ? 'closed' : i === 2 ? 'new' : pick(statusPool)
  const created = Math.floor(rand() * 120) + (i < 6 ? 0 : 1)
  const assignee = pick(employeesList)
  const number = `BL-2026-${String(1480 - i).padStart(5, '0')}`
  const hasAssignee = !['new', 'in_review', 'rejected'].includes(status)
  return {
    id: String(1480 - i),
    number,
    title: pick(titlesByCategory[category.id]),
    description:
      'لاحظت وجود المشكلة منذ عدة أيام وهي تسبب إزعاجاً وخطراً على المارة والسيارات، خاصة في ساعات المساء. أرجو التكرم بالمتابعة والمعالجة في أقرب وقت ممكن.',
    categoryId: category.id,
    districtId: district.id,
    address: `${district.name} — ${pick(streets)}`,
    lat: district.lat + (rand() - 0.5) * 0.012,
    lng: district.lng + (rand() - 0.5) * 0.012,
    status,
    priority: pick(priorityPool),
    departmentId: dept.id,
    assignee: hasAssignee ? assignee : undefined,
    citizen: i < 7 ? 'عبدالله محمود' : pick(citizenNames),
    createdAt: daysAgo(created),
    updatedAt: daysAgo(Math.max(created - 2, 0)),
    images: ['p1', 'p2', 'p3'].slice(0, 1 + Math.floor(rand() * 3)),
    afterImages: ['resolved', 'closed'].includes(status) ? ['a1', 'a2'] : undefined,
    overdue: ['new', 'in_review', 'in_progress'].includes(status) && created > category.slaDays,
    rating: status === 'closed' && rand() > 0.3 ? 3 + Math.floor(rand() * 3) : undefined,
    timeline: buildTimeline(status, created, dept.name, assignee),
    comments: [
      { id: 'm1', author: 'مركز الاستقبال', role: 'employee', body: 'شكراً لتواصلك، تم استلام بلاغك وسيتم التعامل معه حسب الأولوية.', at: daysAgo(Math.max(created - 1, 0), 12) },
      ...(hasAssignee
        ? [
            { id: 'm2', author: 'عبدالله محمود', role: 'citizen', body: 'هل يوجد موعد تقريبي للمعالجة؟', at: daysAgo(Math.max(created - 2, 0), 18) },
            { id: 'm3', author: assignee, role: 'employee', body: 'تمت جدولة الفريق الميداني خلال 48 ساعة.', at: daysAgo(Math.max(created - 3, 0), 9) },
            { id: 'm4', author: assignee, role: 'employee', body: 'يحتاج الموقع إلى معدات إضافية، تم التنسيق مع المستودع.', at: daysAgo(Math.max(created - 3, 0), 11), internal: true },
          ]
        : []),
    ],
  }
})

const myComplaints = complaints.filter((c) => c.citizen === 'عبدالله محمود')

const getCategory = (id) => categories.find((c) => c.id === id)
const getDistrict = (id) => districts.find((d) => d.id === id)
const getDepartment = (id) => departments.find((d) => d.id === id)
const getComplaint = (id) => complaints.find((c) => c.id === id) ?? complaints[0]

/* ---------------- إحصائيات ولوحات المدير ---------------- */

const monthlyTrend = [
  { month: 'أبريل', received: 182, closed: 160 },
  { month: 'مايو', received: 205, closed: 188 },
  { month: 'يونيو', received: 231, closed: 209 },
  { month: 'يوليو', received: 264, closed: 230 },
  { month: 'أغسطس', received: 248, closed: 241 },
  { month: 'سبتمبر', received: 219, closed: 196 },
]

const byCategory = [
  { name: 'حفر في الطرق', value: 312 },
  { name: 'تراكم النفايات', value: 268 },
  { name: 'إنارة الشوارع', value: 197 },
  { name: 'تسرب مياه', value: 151 },
  { name: 'انسداد صرف صحي', value: 118 },
  { name: 'أخرى', value: 303 },
]

const byDepartment = departments.map((d, i) => ({
  name: d.name.replace('قسم ', ''),
  value: [398, 331, 197, 269, 88, 66][i],
  closeRate: [88, 94, 91, 82, 76, 70][i],
  avgDays: [4.8, 1.9, 3.1, 3.6, 6.2, 9.4][i],
  satisfaction: [4.1, 4.5, 4.3, 3.8, 4.0, 3.4][i],
}))

const byDistrict = districts
  .map((d, i) => ({ name: d.name, value: [286, 174, 241, 96, 188, 219, 71, 74][i] }))
  .sort((a, b) => b.value - a.value)

const adminKpis = {
  total: 1349,
  newCount: 87,
  inProgress: 164,
  closed: 1052,
  avgCloseDays: 3.7,
  satisfaction: 4.2,
}

/* ---------------- المشاكل المتكررة ---------------- */

const recurringIssues = [
  { id: 'r1', categoryId: 'c-pothole', location: 'شارع الجامعة — قرب الإشارة الضوئية', districtId: 'z-5', count: 6, months: 4, severity: 'critical', recommendation: 'تحتاج صيانة جذرية', lastAt: '2026-09-21' },
  { id: 'r2', categoryId: 'c-flood', location: 'نفق وسط البلد', districtId: 'z-1', count: 9, months: 12, severity: 'critical', recommendation: 'إعادة تصميم شبكة تصريف الأمطار', lastAt: '2026-03-02' },
  { id: 'r3', categoryId: 'c-sewer', location: 'شارع السلام — الحي الشرقي', districtId: 'z-6', count: 5, months: 3, severity: 'high', recommendation: 'استبدال خط الصرف', lastAt: '2026-09-14' },
  { id: 'r4', categoryId: 'c-light', location: 'شارع البتراء — حي الروضة', districtId: 'z-3', count: 4, months: 2, severity: 'medium', recommendation: 'فحص الشبكة الكهربائية للخط', lastAt: '2026-09-25' },
  { id: 'r5', categoryId: 'c-waste', location: 'السوق الشعبي — وسط البلد', districtId: 'z-1', count: 7, months: 2, severity: 'high', recommendation: 'زيادة عدد الحاويات ومرات الجمع', lastAt: '2026-09-26' },
  { id: 'r6', categoryId: 'c-water', location: 'شارع الحصن — حي النزهة', districtId: 'z-2', count: 3, months: 5, severity: 'medium', recommendation: 'فحص ضغط الخط الرئيسي', lastAt: '2026-08-30' },
]

const severityLabels = {
  critical: 'حرجة',
  high: 'مرتفعة',
  medium: 'متوسطة',
  low: 'منخفضة',
}

/* ---------------- الطقس ---------------- */

const weatherAlerts = [
  {
    id: 'w1',
    type: 'منخفض جوي وأمطار غزيرة',
    icon: 'cloud-rain-wind',
    severity: 'high',
    start: '2026-10-02',
    end: '2026-10-04',
    description: 'يتوقع هطول أمطار غزيرة مصحوبة بعواصف رعدية وتشكل سيول في المناطق المنخفضة.',
    rainfall: '45 ملم',
    wind: '55 كم/س',
    temp: '12° — 18°',
  },
  {
    id: 'w2',
    type: 'رياح نشطة مثيرة للغبار',
    icon: 'wind',
    severity: 'medium',
    start: '2026-10-07',
    end: '2026-10-08',
    description: 'رياح نشطة قد تؤدي إلى سقوط أشجار ولوحات إعلانية.',
    rainfall: '—',
    wind: '70 كم/س',
    temp: '19° — 27°',
  },
]

const sensitiveAreas = [
  { districtId: 'z-1', floods: 12, lastIncident: 'فبراير 2026', risk: 'high', actions: ['تنظيف مناهل الأمطار', 'تجهيز مضخات شفط'] },
  { districtId: 'z-3', floods: 9, lastIncident: 'يناير 2026', risk: 'high', actions: ['فحص العبّارات', 'وضع حواجز تحذيرية'] },
  { districtId: 'z-6', floods: 7, lastIncident: 'ديسمبر 2025', risk: 'high', actions: ['تنظيف قنوات التصريف'] },
  { districtId: 'z-2', floods: 4, lastIncident: 'مارس 2026', risk: 'medium', actions: ['متابعة ميدانية'] },
  { districtId: 'z-5', floods: 3, lastIncident: 'فبراير 2025', risk: 'medium', actions: ['متابعة ميدانية'] },
  { districtId: 'z-8', floods: 2, lastIncident: 'يناير 2025', risk: 'low', actions: ['لا يوجد'] },
]

/* ---------------- الرضا ---------------- */

const ratingDistribution = [
  { stars: 5, count: 412 },
  { stars: 4, count: 268 },
  { stars: 3, count: 97 },
  { stars: 2, count: 41 },
  { stars: 1, count: 33 },
]

const satisfactionByMonth = [
  { month: 'أبريل', value: 3.9 },
  { month: 'مايو', value: 4.0 },
  { month: 'يونيو', value: 4.1 },
  { month: 'يوليو', value: 3.9 },
  { month: 'أغسطس', value: 4.3 },
  { month: 'سبتمبر', value: 4.2 },
]

const dissatisfactionReasons = [
  { reason: 'التأخر في الاستجابة', count: 58, keyword: 'تأخير' },
  { reason: 'عدم حل المشكلة بشكل كامل', count: 36, keyword: 'لم تحل' },
  { reason: 'ضعف التواصل والمتابعة', count: 24, keyword: 'لا يوجد رد' },
  { reason: 'تكرار المشكلة بعد الإصلاح', count: 19, keyword: 'تكررت' },
  { reason: 'تعامل الفريق الميداني', count: 8, keyword: 'تعامل' },
]

const recentFeedback = [
  { name: 'مريم خليل', rating: 5, text: 'استجابة سريعة جداً وتم إصلاح الإنارة خلال يومين. شكراً للفريق.', dept: 'قسم الإنارة', at: '2026-09-26' },
  { name: 'طارق سليم', rating: 2, text: 'تأخير كبير في المعالجة ولا يوجد رد على استفساراتي.', dept: 'قسم المياه والصرف', at: '2026-09-24' },
  { name: 'ريم جابر', rating: 4, text: 'تم الحل لكن المشكلة تكررت بعد أسبوع.', dept: 'قسم الطرق والأرصفة', at: '2026-09-22' },
]

/* ---------------- الكلمات المفتاحية ---------------- */

const keywords = [
  { id: 'k1', word: 'تأخير', sentiment: 'negative', category: 'زمن الاستجابة', hits: 58 },
  { id: 'k2', word: 'لم تحل', sentiment: 'negative', category: 'جودة الحل', hits: 36 },
  { id: 'k3', word: 'لا يوجد رد', sentiment: 'negative', category: 'التواصل', hits: 24 },
  { id: 'k4', word: 'تكررت', sentiment: 'negative', category: 'جودة الحل', hits: 19 },
  { id: 'k5', word: 'سريع', sentiment: 'positive', category: 'زمن الاستجابة', hits: 142 },
  { id: 'k6', word: 'شكراً', sentiment: 'positive', category: 'عام', hits: 311 },
  { id: 'k7', word: 'ممتاز', sentiment: 'positive', category: 'جودة الحل', hits: 97 },
  { id: 'k8', word: 'مقبول', sentiment: 'neutral', category: 'عام', hits: 45 },
]

/* ---------------- المستخدمون ---------------- */

const users = [
  { id: 'u1', name: 'عبدالله محمود', email: 'abdullah@example.com', phone: '0790000001', role: 'citizen', status: 'active', createdAt: '2026-01-14', complaints: 7 },
  { id: 'u2', name: 'مريم خليل', email: 'mariam@example.com', phone: '0790000002', role: 'citizen', status: 'active', createdAt: '2026-02-03', complaints: 4 },
  { id: 'u3', name: 'حسن إبراهيم', email: 'hasan@example.com', phone: '0790000003', role: 'citizen', status: 'suspended', createdAt: '2026-03-21', complaints: 12 },
  { id: 'u4', name: 'نور الهدى', email: 'noor@example.com', phone: '0790000004', role: 'citizen', status: 'active', createdAt: '2026-04-09', complaints: 2 },
  { id: 'u5', name: 'يوسف عيسى', email: 'yousef@example.com', phone: '0790000005', role: 'citizen', status: 'active', createdAt: '2026-05-30', complaints: 1 },
  { id: 'u6', name: 'ريم جابر', email: 'reem@example.com', phone: '0790000006', role: 'citizen', status: 'active', createdAt: '2026-06-18', complaints: 5 },
]

const employees = employeesList.map((name, i) => ({
  id: `e${i + 1}`,
  name,
  email: `employee${i + 1}@municipality.example`,
  phone: `079100000${i + 1}`,
  role: i === 0 ? 'admin' : 'employee',
  departmentId: departments[i % departments.length].id,
  status: i === 4 ? 'suspended' : 'active',
  createdAt: `2025-0${i + 1}-10`,
  complaints: [34, 51, 27, 40, 12, 22][i],
}))

const notifications = [
  { id: 'n1', title: 'تم تحديث حالة بلاغك', body: 'البلاغ BL-2026-01480 أصبح "قيد المعالجة".', at: 'منذ ساعتين', read: false, type: 'status' },
  { id: 'n2', title: 'تعليق جديد', body: 'أضاف قسم الطرق تعليقاً على بلاغك.', at: 'منذ 5 ساعات', read: false, type: 'comment' },
  { id: 'n3', title: 'قيّم الخدمة', body: 'تم إغلاق البلاغ BL-2026-01479، شاركنا رأيك.', at: 'أمس', read: true, type: 'rating' },
  { id: 'n4', title: 'تنبيه جوي', body: 'منخفض جوي متوقع يوم الجمعة، يرجى الحذر.', at: 'منذ يومين', read: true, type: 'weather' },
]
