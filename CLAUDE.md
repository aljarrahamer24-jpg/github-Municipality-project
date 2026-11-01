# منصة شكاوى البلدية — سياق المشروع لأي محادثة جديدة

مشروع تخرج (الكلية الجامعية للعلوم التطبيقية، غزة) للطالب عمرو الجراح، إشراف أ. عدي فتحي عبد فياض.
منصة عربية (RTL) لاستقبال شكاوى المواطنين ومتابعتها، بثلاثة أدوار: مواطن، موظف، مدير.
صاحب المشروع يكتب بالعامية الفلسطينية؛ رُدّ عليه بنفس الأسلوب وبخطوات واضحة (يستخدم Windows و VS Code و Live Server).

## قيود ثابتة (لا تخالفها)
- التقنيات: HTML + CSS + Vanilla JavaScript + Supabase فقط. بدون Node.js وبدون أي إطار عمل أو خطوة بناء.
- لا Service Role Key ولا أي مفتاح سري في الواجهة. المفتاح العام فقط في `assets/js/config.js`، والحماية عبر RLS.
- الصلاحيات لا تعتمد على إخفاء العناصر بـ JavaScript؛ القواعد في قاعدة البيانات (RLS + Triggers).
- مفاتيح الذكاء الاصطناعي في Secrets الخاصة بالـ Edge Function فقط.

## البنية
- `auth/` الدخول والتسجيل (للمواطنين فقط) والاستعادة، و`auth/demo.html?as=admin|employee|citizen` دخول سريع للحسابات التجريبية (يُعطّل بـ `DEMO_LOGIN: false` في config.js بعد المناقشة).
- `citizen/` `employee/` `admin/` صفحات كل دور. `home.html` الصفحة التعريفية، و`index.html` يحوّل لصفحة الدخول.
- `assets/js/core/` الطبقة المشتركة (api, app, layout, ui, ai, maps, charts...). ملف JS لكل صفحة في `assets/js/<role>/`.
- `assets/css/style.css` ملف التنسيق الوحيد.
- `supabase/migrations/*.sql` تُنفّذ يدوياً بالترتيب في SQL Editor (لا يوجد Supabase CLI عند المستخدم). آخرها `20261015000000_auto_assign.sql` (إسناد تلقائي للموظف الأقل عبئاً).
- `supabase/functions/ai/index.ts` الـ Edge Function (Gemini افتراضياً، OpenRouter احتياطي). تُنشر بنسخ الكود ولصقه في Supabase Dashboard ← Edge Functions ← ai ← Code ← Deploy.
- `supabase/staff-accounts.sql` موظف لكل قسم (كلمة المرور Staff@2026). `supabase/demo-data.sql` حسابات تجريبية (Demo@12345).
- `docs/` التوثيق، و`docs/defense-guide.html` دليل المناقشة، و`docs/qr-cards.pdf` رموز الدخول السريع، و`docs/report/graduation-report-final.docx` التقرير النهائي (فيه QR على الغلاف).

## النشر
- Netlify أُوقف حسابه (suspended)؛ البديل GitHub Pages من الفرع `claude/municipal-complaints-ui-design-ry84z5`:
  https://aljarrahamer24-jpg.github.io/github-Municipality-project/
  (المستخدم يفعّله بنفسه من Settings ← Pages). كل رموز QR تشير لهذا الرابط.
- في Supabase ← Authentication ← URL Configuration يجب أن يكون Site URL و Redirect URLs على رابط GitHub Pages.

## ميزات مهمة أُضيفت مؤخراً
- صورة إلزامية في الخطوة الأولى؛ الذكاء الاصطناعي يرفض الصور/النصوص التي لا تخص البلدية (`is_municipal_issue`)، ويفحص صور خانة "صورة المكان" أيضاً (عند فشل الخدمة تُقبل الصورة).
- أول دخول للمواطن يفتح `home.html` بدل لوحته (علامة في localStorage).
- حركة hover على البطاقات والأزرار، وتكبير رمز QR في صفحة الدخول.

## العمل مع Git
- طوّر وادفع على الفرع `claude/municipal-complaints-ui-design-ry84z5` فقط.
- على جهاز المستخدم: الترمنال يجب أن يكون داخل مجلد `github-Municipality-project` قبل `git pull`.

## أشياء معلّقة
- تعطيل الدخول السريع (`DEMO_LOGIN: false`) بعد المناقشة، وعدم نشر روابطه أو رموزه علناً.
- التأكد من تفعيل GitHub Pages وتحديث إعدادات Supabase للرابط الجديد.
- إعادة نشر دالة `ai` على Supabase بعد آخر تعديل على التعليمات (رفض الصور غير البلدية).
