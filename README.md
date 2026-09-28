# منصة إدارة شكاوى وطلبات خدمات البلدية

مشروع تخرج — منصة رقمية لاستقبال شكاوى وطلبات المواطنين ومتابعتها حتى الإغلاق، بثلاثة أدوار: **المواطن**، **موظف البلدية**، **مدير البلدية**.

> **المرحلة الحالية: تصميم UI/UX فقط.**
> لا يوجد Backend أو قاعدة بيانات أو Supabase أو مصادقة حقيقية. كل البيانات المعروضة تجريبية (Mock Data) من `src/data/mock.ts`.

## التشغيل

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # بناء نسخة الإنتاج
```

ابدأ من **`/screens`** لرؤية فهرس جميع الشاشات، أو من `/login` واختر الدور (مواطن / موظف / مدير). يمكن التبديل بين الأدوار من قائمة المستخدم أعلى أي لوحة.

## التقنيات
- React 19 + TypeScript + Vite
- Tailwind CSS v4 (Design Tokens في `src/index.css`)
- React Router
- Recharts (الرسوم البيانية)
- Leaflet / React-Leaflet (الخرائط)
- Lucide (الأيقونات)
- خط IBM Plex Sans Arabic — واجهة RTL بالكامل

## التوثيق (docs/)
1. [خريطة الموقع وقائمة الصفحات](docs/01-sitemap-and-pages.md)
2. [مسارات المستخدمين (User Flows)](docs/02-user-flows.md)
3. [نظام التصميم والهوية البصرية](docs/03-design-system.md)
4. [المكونات المشتركة والتخطيطات والسلوك المتجاوب](docs/04-components-layouts-responsive.md)

## هيكل المشروع
```
src/
├── components/
│   ├── ui/          # المكونات الأساسية (Button, Card, Badge, Form, Modal, DataTable...)
│   ├── layout/      # Public / Auth / Citizen / Dashboard layouts
│   ├── complaints/  # جدول البلاغات، Timeline، التعليقات، رفع الصور
│   ├── map/         # الخرائط (Leaflet)
│   └── charts/      # الرسوم البيانية (Recharts)
├── data/            # الأنواع + البيانات التجريبية
├── lib/             # أدوات مساعدة (التنسيق، الأيقونات)
└── pages/
    ├── public/      # الرئيسية، متابعة بلاغ، فهرس الشاشات، Design System
    ├── auth/        # الدخول، التسجيل، نسيت/إعادة تعيين كلمة المرور
    ├── citizen/     # واجهة المواطن
    ├── employee/    # واجهة الموظف
    └── admin/       # لوحة المدير + التحليلات + إدارة النظام
```

## المرحلة القادمة
ربط الواجهات بـ Supabase (قاعدة البيانات، المصادقة، التخزين) — الأنواع في `src/data/types.ts` مصممة لتكون أساساً لجداول قاعدة البيانات.
