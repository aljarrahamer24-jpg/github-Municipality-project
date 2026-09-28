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
  SUPABASE_URL: 'https://YOUR-PROJECT-ID.supabase.co',
  SUPABASE_ANON_KEY: 'YOUR-ANON-OR-PUBLISHABLE-KEY',

  // مركز الخريطة الافتراضي (خط العرض، خط الطول) والتكبير
  MAP_CENTER: [32.5536, 35.8497],
  MAP_ZOOM: 14,

  // حدود رفع الصور (يجب أن تتوافق مع إعدادات الـ Bucket في قاعدة البيانات)
  MAX_IMAGES: 5,
  MAX_IMAGE_MB: 5,
}
