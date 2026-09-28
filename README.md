# منصة إدارة شكاوى وطلبات خدمات البلدية

مشروع تخرج: منصة رقمية لاستقبال شكاوى وطلبات المواطنين ومتابعتها حتى الإغلاق، بثلاثة أدوار: **المواطن**، **موظف البلدية**، **مدير البلدية**.

- **الواجهة:** HTML + CSS + Vanilla JavaScript، بدون أي إطار عمل وبدون Node.js.
- **الـ Backend الوحيد:** Supabase (Auth + PostgreSQL + Storage + Realtime + RLS).
- **بدون ذكاء اصطناعي:** كل التحليلات مبنية على SQL وإحصاءات وقواعد منطقية وكلمات مفتاحية.

---

## خطوات التشغيل (مرة واحدة)

### 1. أنشئ مشروع Supabase
من [supabase.com/dashboard](https://supabase.com/dashboard) اضغط **New project**، واختر اسماً وكلمة مرور لقاعدة البيانات.

### 2. أنشئ قاعدة البيانات
افتح **SQL Editor → New query**، ثم انسخ محتوى كل ملف والصقه واضغط **Run**، بهذا الترتيب:

| الترتيب | الملف | الوظيفة |
|---|---|---|
| 1 | `supabase/migrations/20260928000000_init.sql` | الجداول، الدوال، المشغلات، RLS، التخزين، Realtime |
| 2 | `supabase/seed.sql` | البيانات الأساسية: الأقسام، أنواع المشاكل، المناطق، الكلمات المفتاحية |
| 3 (اختياري) | `supabase/demo-data.sql` | حسابات وبلاغات تجريبية للاختبار فقط، **لا تستخدمه في النسخة الرسمية** |

### 3. اربط الواجهة بالمشروع
من **Project Settings → API** انسخ **Project URL** و **anon / publishable key**، وضعهما في الملف `assets/js/config.js`:

```js
SUPABASE_URL: 'https://xxxx.supabase.co',
SUPABASE_ANON_KEY: 'eyJ...',   // المفتاح العام فقط
```

> ⚠️ لا تضع أبداً مفتاح `service_role` أو `secret` في الواجهة. الحماية تتم عبر RLS داخل قاعدة البيانات.

### 4. إعدادات المصادقة
من **Authentication → URL Configuration**:
- **Site URL:** رابط تشغيل الموقع، مثل `http://127.0.0.1:5500`.
- **Redirect URLs:** أضف `http://127.0.0.1:5500/**` وأي رابط استضافة لاحق.

من **Authentication → Providers → Email**: تفعيل **Confirm email** اختياري. إذا فعّلته فيجب على المستخدم تأكيد بريده قبل الدخول.

### 5. شغّل الموقع
افتح المجلد في VS Code، ثم اضغط بالزر الأيمن على `index.html` واختر **Open with Live Server**.
(رابط استعادة كلمة المرور يحتاج تشغيل الموقع عبر `http://` وليس بفتح الملف مباشرة.)

### 6. أنشئ حساب المدير الأول
1. سجّل حساباً عادياً من صفحة **إنشاء حساب**. كل حساب جديد يكون "مواطن" تلقائياً.
2. نفّذ في SQL Editor، مع وضع بريدك:
```sql
update public.profiles set role = 'admin'
where id = (select id from auth.users where email = 'your-email@example.com');
```
3. سجّل الدخول، وستظهر لوحة المدير. بعدها يمكنك إضافة الموظفين وترقية الحسابات من لوحة المدير مباشرة.

### حسابات تجريبية (إذا نفّذت `demo-data.sql`)
كلمة المرور لجميع الحسابات: `Demo@12345`

| البريد | الدور |
|---|---|
| admin@demo.test | مدير البلدية |
| roads@demo.test | موظف: قسم الطرق والأرصفة |
| water@demo.test | موظف: قسم المياه والصرف |
| clean@demo.test | موظف: قسم النظافة العامة |
| citizen@demo.test | مواطن |

---

## ماذا يستطيع كل دور أن يفعل؟

**المواطن:** يسجّل حساباً، ثم يقدّم بلاغاً (النوع، الوصف، الصور، الموقع على الخريطة، المنطقة)، ثم يتابع بلاغه (السجل الزمني والتعليقات). تصله تحديثات لحظية، ويقيّم الخدمة بعد الإغلاق.

**الموظف:** يرى بلاغات قسمه والبلاغات المسندة إليه. يغيّر الحالة والأولوية، ويسند البلاغ لزملائه في نفس القسم. يضيف ملاحظات داخلية وردوداً للمواطن، ويرفع صور "قبل" و"بعد" المعالجة، ثم يغلق البلاغ.

**المدير:**
- يرى جميع البلاغات، ويحوّلها بين الأقسام ويسندها للموظفين.
- يتابع الإحصائيات والخريطة الحرارية والمناطق الساخنة والمشاكل المتكررة.
- يسجّل الحالات الجوية ويرسل التنبيهات للفرق.
- يطّلع على التقارير الشهرية وتحليل رضا المواطنين.
- يدير المستخدمين والموظفين والأقسام وأنواع المشاكل والمناطق والكلمات المفتاحية والإعدادات.

---

## هيكل المشروع
```
├── index.html, track.html, screens.html, design-system.html
├── auth/            login, register, forgot-password, reset-password
├── citizen/         index (لوحتي), complaints, new, complaint, rate, notifications, profile
├── employee/        index, complaints, complaint, map
├── admin/           index, complaints, complaint, map, recurring, weather, reports,
│                    satisfaction, users, employees, departments, categories, districts, keywords, settings
├── assets/
│   ├── css/style.css              ملف التنسيق الوحيد
│   ├── js/
│   │   ├── config.js              إعدادات Supabase (عدّلها)
│   │   ├── core/                  الطبقة المشتركة
│   │   │   ├── supabase.js        إنشاء الاتصال + ترجمة الأخطاء للعربية
│   │   │   ├── api.js             كل استعلامات قاعدة البيانات في مكان واحد
│   │   │   ├── app.js             التحقق من الجلسة والدور وحماية الصفحات
│   │   │   ├── layout.js          الهيدر والقوائم
│   │   │   ├── notifications.js   الإشعارات اللحظية (Realtime)
│   │   │   ├── ui.js, utils.js    المكونات والأدوات
│   │   │   ├── complaints-table.js  جدول البلاغات (بحث/فلاتر/ترتيب من الخادم)
│   │   │   ├── charts.js, maps.js, icons.js
│   │   ├── public/ auth/ citizen/ employee/ staff/ admin/   ملف لكل صفحة
│   └── vendor/                    supabase-js و Leaflet (نسخ محلية)
├── supabase/
│   ├── migrations/…_init.sql      قاعدة البيانات الكاملة
│   ├── seed.sql                   البيانات الأساسية
│   └── demo-data.sql              بيانات تجريبية (اختياري)
└── docs/                          التوثيق
```

## التوثيق
1. [خريطة الموقع وقائمة الصفحات](docs/01-sitemap-and-pages.md)
2. [مسارات المستخدمين](docs/02-user-flows.md)
3. [نظام التصميم](docs/03-design-system.md)
4. [المكونات والتخطيطات والتجاوب](docs/04-components-layouts-responsive.md)
5. [الـ Backend: قاعدة البيانات والأمان والتحليلات](docs/05-backend-supabase.md)
