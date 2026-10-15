/* ==========================================================================
   config.js — إعدادات الاتصال بـ Supabase
   --------------------------------------------------------------------------
   1. افتح مشروعك في https://supabase.com/dashboard
   2. Project Settings → API (أو Data API)
   3. انسخ Project URL والمفتاح العام (anon / publishable key) وضعهما هنا.

   ⚠️ لا تضع أبداً مفتاح service_role أو secret هنا — هذا الملف يصل للمتصفح.
      الحماية الفعلية للبيانات تتم عبر RLS داخل قاعدة البيانات.
   ========================================================================== */

const APP_CONFIG = {
  SUPABASE_URL: 'https://lrlriimsfscgritbcqjs.supabase.co',
  SUPABASE_ANON_KEY: 'sb_publishable_PSaa1uzvNNHK5Pka-f6PPA_-p0WRdII',

  // مركز الخريطة الافتراضي (خط العرض، خط الطول) والتكبير
  MAP_CENTER: [32.5536, 35.8497],
  MAP_ZOOM: 14,

  // حدود رفع الصور (يجب أن تتوافق مع إعدادات الـ Bucket في قاعدة البيانات)
  MAX_IMAGES: 5,
  MAX_IMAGE_MB: 5,

  // دخول سريع للحسابات التجريبية عبر رمز QR (auth/demo.html?as=admin|employee|citizen)
  // للعرض والمناقشة فقط: أي شخص يملك الرابط يدخل بهذه الحسابات.
  // بعد المناقشة اجعلها false (أو احذف الحسابات التجريبية من قاعدة البيانات).
  DEMO_LOGIN: true,
  DEMO_ACCOUNTS: {
    admin: { email: 'admin@demo.test', label: 'مدير البلدية' },
    employee: { email: 'roads@demo.test', label: 'موظف قسم الطرق' },
    citizen: { email: 'citizen@demo.test', label: 'مواطن' },
  },
  DEMO_PASSWORD: 'Demo@12345',
}
