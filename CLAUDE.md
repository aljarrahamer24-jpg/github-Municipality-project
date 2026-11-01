# منصة شكاوى البلدية — السياق الكامل للمشروع

> هذا الملف يُقرأ تلقائياً في كل محادثة جديدة. فيه كل ما تحتاج معرفته عن المشروع وصاحبه وما تم عمله والقرارات المتخذة.
> عند إنجاز أي عمل مهم: حدّث هذا الملف (خصوصاً قسم "السجل" و"أشياء معلّقة").

---

## 1. صاحب المشروع وطريقة التعامل معه

- **الطالب:** عمرو مهدي الجراح — الرقم الجامعي 120222916.
- **الكلية:** الكلية الجامعية للعلوم التطبيقية، غزة – فلسطين. قسم تكنولوجيا المعلومات، دبلوم متوسط (برمجيات وقواعد بيانات). العام 2025-2026، الفصل الصيفي.
- **المشرف:** أ. عدي فتحي عبد فياض.
- **GitHub:** `aljarrahamer24-jpg/github-Municipality-project`. **LinkedIn:** linkedin.com/in/amer-aljarrah
- **اللغة:** يكتب بالعامية الفلسطينية (أحياناً بأخطاء إملائية). رُدّ بالعامية الفلسطينية، بخطوات مرقّمة وواضحة، وبدون مصطلحات تقنية غير مشروحة.
- **جهازه:** Windows، يستخدم VS Code مع Live Server (`http://127.0.0.1:5500/github-Municipality-project/...`)، و PowerShell، و Chrome مع إضافة Claude in Chrome، وتطبيق Claude Desktop.
- **مشكلة متكررة عنده:** VS Code مفتوح على المجلد الأب `Desktop\البلدية` فيفشل `git pull` بـ "not a git repository". الحل: `cd github-Municipality-project` أو فتح مجلد المشروع نفسه من File ← Open Folder.
- **لا يريد تثبيت Node.js** على جهازه.
- **يكره النصوص التي تبدو مكتوبة بالذكاء الاصطناعي** (في التقارير، أجوبة النماذج، منشورات LinkedIn): اكتب بأسلوب بشري طبيعي، بدون مبالغة وبدون إيموجي كثير.
- **قبل نشر أي شيء خارجي** (LinkedIn مثلاً) اعرض النص عليه وانتظر موافقته الصريحة ("آه").
- **يحب العرض أمام اللجنة:** يهتم بالمناقشة، الشكل، الـ QR، وفتح أكثر من واجهة معاً.

## 2. قيود ثابتة (لا تخالفها أبداً)

- التقنيات: **HTML + CSS + Vanilla JavaScript + Supabase فقط**. بدون Node.js، بدون React أو أي إطار، بدون خطوة build.
- **لا Service Role Key ولا أي مفتاح سري في الواجهة.** المفتاح العام (publishable/anon) فقط في `assets/js/config.js`، والحماية كلها عبر **RLS**.
- **لا تعتمد على JavaScript لإخفاء الصلاحيات فقط**؛ كل قاعدة لازم تكون في قاعدة البيانات (RLS + Triggers + دوال).
- **مفاتيح الذكاء الاصطناعي** في Secrets الخاصة بالـ Edge Function فقط، لا في الواجهة.
- لا تضع اسم/معرّف نموذج Claude في الكوميتات أو الكود.

## 3. فكرة المشروع

منصة رقمية لبلدية (عربية RTL): المواطن يقدّم بلاغاً (حفرة، إنارة، نفايات، تسرب مياه، صرف صحي...) مع صورة إلزامية وموقع على الخريطة، فيصل تلقائياً للقسم المختص ويُسند لموظف، والمواطن يتابعه لحظياً حتى الإغلاق ثم يقيّم الخدمة. الإدارة تحصل على إحصائيات، خريطة حرارية، مشاكل متكررة، استعداد للحالات الجوية، رضا المواطنين، وتقارير شهرية. فوقها طبقة ذكاء اصطناعي اختيارية (بلاغ بالصورة/النص العامي/الصوت + رفض الصور غير البلدية + كشف التكرار).

### الأدوار
- **المواطن:** تسجيل (صفحة التسجيل للمواطنين فقط)، تقديم بلاغ بأربع خطوات (النوع + صورة إلزامية ← التفاصيل ← الموقع والمنطقة ← المراجعة)، متابعة، تعليقات، إشعارات لحظية، تقييم بعد الإغلاق.
- **الموظف:** يرى بلاغات قسمه والمسندة إليه فقط، يغيّر الحالة والأولوية، يسند لزملاء قسمه، ملاحظات داخلية، رد للمواطن، صور قبل/بعد. لا يحوّل لقسم آخر ولا يعيد فتح مغلق.
- **المدير:** كل شيء، مع منع إزالة آخر مدير. يضيف الموظفين من صفحة "الموظفون".

### دورة حياة البلاغ
`new` جديد ← `under_review` قيد المراجعة ← `assigned` تم التعيين ← `in_progress` قيد المعالجة ← `resolved` تم الحل ← `closed` مغلق (ثم تقييم). أو `rejected` مرفوض.
رقم البلاغ: `BLD-السنة-000000` من جدول `complaint_counters` (زيادة ذرية).

## 4. هيكل الملفات

```
index.html            يحوّل مباشرة إلى auth/login.html (طلب المستخدم أن يفتح الموقع على الدخول)
home.html             الصفحة التعريفية (الواجهة)، فيها "كيف تعمل المنصة"
track.html            متابعة بلاغ برقمه بدون دخول (بيانات محدودة عبر track_complaint)
design-system.html    نظام التصميم، screens.html فهرس الشاشات
.nojekyll             لـ GitHub Pages
auth/                 login, register, forgot-password, reset-password, demo (دخول سريع)
citizen/              index (لوحتي), new, complaints, complaint, rate, notifications, profile
employee/             index, complaints, complaint, map
admin/                index, complaints, complaint, map, recurring, weather, reports, satisfaction,
                      users, employees, departments, categories, districts, keywords, settings
assets/css/style.css  ملف التنسيق الوحيد (tokens، مكونات، RTL، mobile-first، hover effects)
assets/js/config.js   SUPABASE_URL + المفتاح العام + MAP_CENTER + حدود الصور + DEMO_LOGIN/DEMO_ACCOUNTS/DEMO_PASSWORD
assets/js/core/       supabase.js (اتصال + ترجمة أخطاء) · api.js (كل الاستعلامات) · app.js (حماية الصفحات، afterLoginUrl)
                      layout.js (هيدر/قوائم، لوحة auth مع QR قابل للتكبير) · ui.js (مكونات، رفع صور: getFiles/addFiles/removeFile/clear)
                      utils.js (esc() ضد XSS، CSV آمن) · notifications.js (Realtime) · complaints-table.js
                      ai.js (استدعاء الدالة، ضغط الصور canvas، Web Speech API، nearby/confirmDuplicate)
                      charts.js (SVG يدوي، لا Chart.js) · maps.js (Leaflet محلي) · icons.js
assets/js/{public,auth,citizen,employee,staff,admin}/   ملف لكل صفحة (staff = مشترك موظف/مدير)
assets/vendor/        supabase-js و Leaflet نسخ محلية
assets/img/           favicon.svg, qr-site.svg
supabase/migrations/  ملفات SQL (انظر القسم 5)
supabase/functions/ai/index.ts   Edge Function الذكاء الاصطناعي (ملف واحد)
supabase/seed.sql     الأقسام، الأنواع، مناطق قطاع غزة، الكلمات المفتاحية
supabase/gaza-areas.sql   تحويل المناطق القديمة لغزة + منطقة "غزة" العامة
supabase/demo-data.sql    حسابات وبلاغات تجريبية (كلمة المرور Demo@12345)
supabase/staff-accounts.sql   موظف لكل قسم (كلمة المرور Staff@2026)
docs/01..07-*.md      التوثيق (خريطة الموقع، المسارات، التصميم، المكونات، الـ Backend، الاختبار، الذكاء الاصطناعي)
docs/defense-guide.html   دليل المناقشة (شرح كل ملف + ~30 سؤال وجواب + سيناريو عرض)
docs/qr-cards.html/.pdf   رموز QR للدخول السريع (مدير/موظف/مواطن) — لا تُنشر علناً
docs/report/          تقارير التخرج (Word) + شعار الكلية الدائري + صور QR + reference.pdf (تقرير فريق آخر، يُفضّل حذفه من الريبو العام)
```

## 5. قاعدة البيانات (Supabase / PostgreSQL)

**لا يوجد Supabase CLI عند المستخدم.** كل ملف SQL يُنسخ ويُلصق في Supabase ← SQL Editor ← Run. كل الملفات آمنة للتكرار.

ترتيب التنفيذ:
1. `20260928000000_init.sql` — الجداول، الدوال، المشغلات، RLS، Storage، Realtime، دوال التحليلات.
2. `20260929000000_testing_fixes.sql` — منع تزوير resolved_at/closed_at + فهارس.
3. `seed.sql`
4. `20260930000000_ai_phase1.sql` — ai_analyses, ai_requests, complaint_contributions, find_nearby_complaints, confirm_duplicate, إعدادات ai.
5. `20261001000000_area_within_3km.sql` — أقرب منطقة فقط ضمن 3 كم.
6. `20261003000000_citizen_only_signup.sql` — التسجيل دائماً مواطن.
7. `20261015000000_auto_assign.sql` — الإسناد التلقائي للموظف الأقل عبئاً (least_busy_employee) + إسناد البلاغات الجديدة الموجودة.
8. اختياري: `demo-data.sql`، `staff-accounts.sql`، `gaza-areas.sql`.

**الجداول:** profiles, departments, problem_categories, areas, complaints, complaint_counters, complaint_images, complaint_status_history, complaint_assignments, internal_notes, complaint_comments, complaint_ratings, notifications, feedback_keywords, weather_events, weather_event_areas, app_settings, ai_analyses, ai_requests, complaint_contributions.

**الأقسام الستة:** قسم الطرق والأرصفة، قسم النظافة العامة، قسم الإنارة، قسم المياه والصرف، قسم الحدائق والتشجير، قسم الرقابة والتنظيم.

**أنواع المشاكل (القسم، SLA بالأيام، الأولوية):** حفر في الطرق (طرق، 7، high) · تراكم النفايات (نظافة، 2، medium) · إنارة الشوارع (إنارة، 5، medium) · تسرب مياه (مياه، 3، high) · انسداد صرف صحي (مياه، 2، high، طقس) · تجمع مياه الأمطار (مياه، 1، urgent، طقس) · الأشجار والحدائق (حدائق، 10، low) · تلف الأرصفة (طرق، 10، low) · مخالفات بناء (رقابة، 14، medium).

**المشغلات المهمة:**
- `handle_new_user`: كل حساب جديد مواطن مهما أرسل المتصفح.
- `guard_profile_update`: غير المدير لا يغيّر role/department/is_active/email، ومنع إزالة آخر مدير.
- `before_complaint_insert`: رقم البلاغ، القسم من النوع، الأولوية الافتراضية، due_at من SLA، أقرب منطقة ضمن 3 كم، حد 10 بلاغات/ساعة، **إسناد تلقائي للموظف الأقل عبئاً** (الحالة تصبح assigned؛ إن لم يوجد موظف تبقى new).
- `after_complaint_insert`: سجل الحالة (استلام ثم إسناد تلقائي)، سجل الإسناد، إشعارات (المواطن، الموظف المسند، المدراء وموظفو القسم).
- `before/after_complaint_update`: قواعد التعديل، تواريخ الحل/الإغلاق من الخادم، سجل الحالة، الإشعارات. كل تحديثات الموظف عبر RPC `update_complaint`.

**دوال التحليلات (RPC):** dashboard_stats, analytics_breakdown, monthly_trend, hotspot_areas, recurring_problems (نفس النوع + ≤200م بـ Haversine + آخر 6 أشهر + ≥3 بلاغات، Greedy، خطورة وتوصيات)، weather_risk_areas, notify_staff_weather, satisfaction_summary (كلمات مفتاحية)، monthly_report, track_complaint, public_stats.

**app_settings:** general (اسم البلدية، timezone Asia/Gaza بعد seed)، complaints (max_images 5، max_image_mb 5)، recurring (min_count 3، radius_m 200، months 6)، ai (enabled، max_requests_per_hour 20، duplicate_radius_m 50).

**Storage:** bucket خاص `complaint-images`، صور فقط ≤5MB، المسار `{complaint_id}/{kind}/{file}`، عرض بروابط موقّعة ساعة.

**الاختبارات السابقة:** 129 اختبار RLS/أمان، 54 اختبار خادم للذكاء الاصطناعي + 17 واجهة. (الاختبار كان على Supabase محلي بـ Docker في بيئة السحابة.)

## 6. طبقة الذكاء الاصطناعي

- `supabase/functions/ai/index.ts`، تُنشر **بالنسخ واللصق** في Supabase Dashboard ← Edge Functions ← ai ← Code ← Deploy (لا CLI).
- Secrets: `GEMINI_API_KEY` (أساسي)، `GEMINI_MODEL` (افتراضي `gemini-3.1-flash-lite`، thinkingLevel low، مهلة 55 ثانية، إعادة محاولة 5xx حتى 3 مرات)، `OPENROUTER_API_KEY` + `OPENROUTER_MODEL` (احتياطي تلقائي withFallback إذا وُجد المفتاحان)، `AI_PROVIDER` اختياري.
- Actions: `analyze_image`، `analyze_text`. ترجع: is_municipal_issue, category_id, title, description, urgency, location_text, confidence, notes.
- **الذكاء الاصطناعي يقترح فقط**؛ الرقم والقسم والحالة والموقع (GPS فقط) يحددها النظام.
- **رفض المحتوى غير البلدي:** إذا `is_municipal_issue === false` (صورة طاولة/غرفة/شخص...) تظهر رسالة حمراء ولا يُعبّأ البلاغ ولا تُرفق الصورة. وصور خانة "صورة المكان" اليدوية تُفحص أيضاً وتُحذف إن لم تكن بلدية؛ عند فشل الخدمة تُقبل الصورة (fail open). زر "التالي" ينتظر انتهاء الفحص.
- كشف التكرار (رياضي لا ذكاء اصطناعي): بلاغ مفتوح، نفس النوع، ≤50م. "نعم نفس المشكلة" يسجّل مساهمة بدل بلاغ جديد.
- الخصوصية: يُرسل للمزوّد الصورة والنص وقائمة الأنواع فقط (لا اسم/هاتف/إحداثيات).
- ملاحظة: تعليمات SYSTEM في الدالة تقول "بلدية أردنية" (من بداية المشروع)، والمشروع الآن لغزة/فلسطين — يمكن تعديلها لـ"فلسطينية" إن طلب.

## 7. النشر والروابط

- **Supabase:** المشروع `lrlriimsfscgritbcqjs` (الرابط والمفتاح العام في config.js).
- **Netlify:** كان `baladiya-gaza-6c9526.netlify.app` — **الحساب أُوقف (suspended) والموقع حُذف**. لا تستخدمه.
- **البديل: GitHub Pages** من الفرع `claude/municipal-complaints-ui-design-ry84z5`، المجلد الجذر:
  `https://aljarrahamer24-jpg.github.io/github-Municipality-project/`
  المستخدم يفعّله بنفسه (Settings ← Pages ← Deploy from a branch). محاولة تفعيله عبر API رُفضت من نظام الصلاحيات.
- **Supabase ← Authentication ← URL Configuration:** Site URL و Redirect URLs (`.../**`) يجب أن تكون على رابط GitHub Pages، وحذف روابط Netlify.
- **روابط الدخول السريع:** `.../auth/demo.html?as=citizen|employee|admin` (تعمل محلياً أيضاً على Live Server). لفتح أكثر من واجهة معاً: Chrome عادي + Incognito + Edge (الجلسة مشتركة بين تابات نفس المتصفح).
- **رموز QR:** كلها تشير لرابط GitHub Pages: `docs/report/qr-site.png` (على غلاف التقرير وصفحة الدخول)، `qr-admin/employee/citizen.png`، `docs/qr-cards.pdf`. QR لا يفتح الرابط تلقائياً على الجوال (حماية من الجوال نفسه، يجب الضغط).

## 8. الحسابات

- تجريبية (demo-data.sql، كلمة المرور `Demo@12345`): admin@demo.test (مدير)، roads@demo.test، water@demo.test، clean@demo.test (موظفون)، citizen@demo.test، citizen2@، citizen3@ (مواطنون).
- موظف لكل قسم (staff-accounts.sql، `Staff@2026`): roads@baladiya.ps محمد أبو سالم، clean@ خالد الهندي، lights@ أحمد شحادة، water@ سامي الدحدوح، parks@ يوسف أبو عودة، control@ إبراهيم النجار.
- المدير الأول يُنشأ بتسجيل حساب ثم `update public.profiles set role='admin' where id=(select id from auth.users where email='...')`.

## 9. تقرير التخرج (Word)

- النسخة النهائية: `docs/report/graduation-report-final.docx` (مبنية من نسخة رفعها المستخدم).
- عُدّل فيها: الغلاف صفحة واحدة مع **QR للموقع تحت التاريخ** ("امسح الرمز لتجربة المنصة")، حذف صفحات أغلفة الفصول الفارغة، فهرس قابل للضغط (PAGEREF + bookmarks + hyperlinks، tab يمين مع نقاط)، ترقيم متصل من 1 بأرقام إنجليزية (لغة ar-MA)، رقم الصفحة في التذييل Times New Roman غامق 14pt أسود. 41 صفحة. المستخدم يضغط F9 في Word لتحديث الفهرس.
- التحويل لـ PDF: من Word ← حفظ باسم ← PDF.
- الرسوم البيانية في المشروع SVG يدوي (ليس Chart.js — صُحّح في التقرير).
- شعار الكلية الدائري: `docs/report/college-logo-round.png`.
- النسخ الأخرى في المجلد (template-format، reference-format) مراحل سابقة.

## 10. السجل (ما تم بالترتيب تقريباً)

1. بناء المنصة كاملة: التصميم (أخضر مؤسسي + ذهبي)، كل الصفحات، Supabase، RLS، الاختبارات، التوثيق.
2. طبقة الذكاء الاصطناعي (المرحلة 1) + Fallback/Retry/Logging، وتغيير النموذج لـ gemini-3.1-flash-lite مع low thinking بسبب مهلات.
3. مناطق قطاع غزة، حقل منطقة يُكتب أو يُختار، إضافة "غزة".
4. صورة إلزامية في الخطوة الأولى، خانة صورة منفصلة عن الذكاء الاصطناعي.
5. التسجيل للمواطنين فقط.
6. الموقع يفتح على صفحة الدخول (index.html ← login، والصفحة التعريفية صارت home.html).
7. تقارير التخرج بتنسيقات مختلفة، شعار دائري، فهرس قابل للضغط، ترقيم.
8. بحث سوقي (منصات مشابهة) وأجوبة نماذج بأسلوب بشري.
9. ملف موظف لكل قسم (staff-accounts.sql) لأن قائمة "الموظف المسؤول" كانت فارغة.
10. الإسناد التلقائي للموظف الأقل عبئاً.
11. دليل المناقشة `docs/defense-guide.html`.
12. QR على غلاف التقرير وفي صفحة الدخول (قابل للتكبير بالضغط).
13. الدخول السريع بـ QR للمدير/الموظف/المواطن (`auth/demo.html`، `DEMO_LOGIN`).
14. حركة hover (تكبير/ارتفاع) على البطاقات والأزرار والقوائم (فقط على أجهزة بماوس).
15. أول دخول للمواطن يفتح home.html (localStorage `welcomed:<userId>`).
16. إيقاف Netlify ← الانتقال لـ GitHub Pages وتحديث كل رموز QR.
17. رفض الصور/النصوص غير البلدية بالذكاء الاصطناعي، وفحص صور الخانة اليدوية.
18. بحث سوقي للتسويق: الخليج والأردن (عمّان) عندهم منصات؛ في الضفة رام الله ونابلس والخليل وإذنا عندهم خدمات شكاوى إلكترونية، جنين وبيت لحم ناقصة. الفرصة: البلديات الصغيرة والمتوسطة والمجالس القروية. البلدية لن تقبل بياناتها عند الطالب ← نموذج البيع: تركيب على حساب Supabase باسم البلدية أو على سيرفرها + ترخيص استخدام + عقد صيانة سنوي (15–20%). أسعار تقديرية: صغيرة 2–5 آلاف $، متوسطة 5–12 ألف $، كبيرة 12–25 ألف $+. غزة غير مناسبة حالياً حسب رأي المستخدم.
19. منشور LinkedIn مكتوب بأسلوب بشري (لم يُنشر؛ لا يوجد ربط مع LinkedIn، المستخدم ينشر بنفسه).

## 11. العمل مع Git

- طوّر وادفع على الفرع `claude/municipal-complaints-ui-design-ry84z5` فقط (ليس main).
- رسائل الكوميت بالإنجليزية وواضحة.
- بعد أي تعديل، ذكّر المستخدم بـ `git pull` من داخل مجلد المشروع، وإذا عدّلت دالة `ai` ذكّره بإعادة نشرها في Supabase، وإذا أضفت migration ذكّره بتنفيذها في SQL Editor.

## 12. أشياء معلّقة

- **تعطيل الدخول السريع بعد المناقشة:** `DEMO_LOGIN: false` في `assets/js/config.js`، وعدم نشر روابطه أو رموز QR الثلاثة علناً (أي شخص يدخل كمدير). README أيضاً يذكر كلمة المرور التجريبية.
- التأكد أن المستخدم فعّل GitHub Pages وحدّث Site URL/Redirect URLs في Supabase.
- التأكد أنه نفّذ `20261015000000_auto_assign.sql` و `staff-accounts.sql` على Supabase الحقيقي.
- إعادة نشر دالة `ai` بعد تعديل تعليمات رفض الصور غير البلدية.
- اختياري: حذف `docs/report/reference.pdf` (تقرير فريق آخر) من الريبو العام، تعديل "بلدية أردنية" في تعليمات الذكاء الاصطناعي، إزالة noindex وإضافة robots/sitemap إن أراد الظهور في Google، ملف عرض (Proposal) أو عرض سعر لبلدية.
