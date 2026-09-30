/* ==========================================================================
   supabase.js — إنشاء اتصال Supabase الوحيد في التطبيق + ترجمة الأخطاء
   ========================================================================== */

const CONFIG_OK =
  typeof APP_CONFIG !== 'undefined' &&
  /^https?:\/\//.test(APP_CONFIG.SUPABASE_URL) &&
  !APP_CONFIG.SUPABASE_URL.includes('YOUR-PROJECT') &&
  APP_CONFIG.SUPABASE_ANON_KEY &&
  !APP_CONFIG.SUPABASE_ANON_KEY.startsWith('YOUR-')

const sb = CONFIG_OK
  ? supabase.createClient(APP_CONFIG.SUPABASE_URL, APP_CONFIG.SUPABASE_ANON_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    })
  : null

class AppError extends Error {
  constructor(message, { code, kind, original } = {}) {
    super(message)
    this.code = code
    this.kind = kind // 'network' | 'auth' | 'permission' | 'validation' | 'notfound' | 'server'
    this.original = original
  }
}

// تحويل أخطاء Supabase/الشبكة إلى رسائل عربية واضحة
function toAppError(err) {
  if (!err) return new AppError('حدث خطأ غير متوقع', { kind: 'server' })
  if (err instanceof AppError) return err
  const msg = String(err.message || err.error_description || err || '')
  const code = err.code || err.status || ''

  if (err.name === 'TypeError' || /Failed to fetch|NetworkError|Load failed|fetch failed/i.test(msg)) {
    return new AppError('تعذر الاتصال بالخادم. تحقق من اتصالك بالإنترنت ثم حاول مجدداً.', { kind: 'network', original: err })
  }
  if (code === 'PGRST301' || /JWT expired|invalid JWT|session.*(missing|expired)|refresh token/i.test(msg)) {
    return new AppError('انتهت الجلسة. يرجى تسجيل الدخول من جديد.', { kind: 'auth', code, original: err })
  }

  const authMap = [
    [/Invalid login credentials/i, 'البريد الإلكتروني أو كلمة المرور غير صحيحة.'],
    [/Email not confirmed/i, 'يرجى تأكيد بريدك الإلكتروني أولاً من الرابط المرسل إليك.'],
    [/User already registered|already been registered/i, 'هذا البريد الإلكتروني مسجل مسبقاً.'],
    [/Password should be at least/i, 'كلمة المرور قصيرة جداً (8 أحرف على الأقل).'],
    [/weak.?password|Password is known to be weak/i, 'كلمة المرور ضعيفة، اختر كلمة مرور أقوى.'],
    // حد رسائل البريد في Supabase (الخطة المجانية ترسل رسائل قليلة جداً في الساعة عند تفعيل تأكيد البريد)
    [/email rate limit|over_email_send_rate_limit/i, 'تم الوصول لحد رسائل البريد المسموح في الساعة (تأكيد البريد مفعّل في Supabase). انتظر حوالي ساعة، أو اطلب من مدير النظام إيقاف "Confirm email" في إعدادات Supabase.'],
    [/rate limit|too many requests|For security purposes/i, 'محاولات كثيرة خلال وقت قصير. انتظر قليلاً ثم حاول مجدداً.'],
    [/Unable to validate email address|invalid format/i, 'صيغة البريد الإلكتروني غير صحيحة.'],
    [/New password should be different/i, 'كلمة المرور الجديدة يجب أن تختلف عن القديمة.'],
    [/Signups not allowed/i, 'التسجيل مغلق حالياً.'],
  ]
  for (const [re, text] of authMap) if (re.test(msg)) return new AppError(text, { kind: 'validation', code, original: err })

  if (code === '42501' || /row-level security|permission denied|not authorized/i.test(msg)) {
    // رسائل عربية مرسلة من دوال قاعدة البيانات تظهر كما هي
    const arabic = /[؀-ۿ]/.test(msg) ? msg : 'ليس لديك صلاحية لتنفيذ هذه العملية.'
    return new AppError(arabic, { kind: 'permission', code, original: err })
  }
  if (code === '23505') return new AppError('هذه البيانات موجودة مسبقاً (قيمة مكررة).', { kind: 'validation', code, original: err })
  if (code === '23503') return new AppError('لا يمكن تنفيذ العملية لارتباط هذا السجل ببيانات أخرى.', { kind: 'validation', code, original: err })
  if (code === '23514' || code === '22P02') {
    return new AppError(/[؀-ۿ]/.test(msg) ? msg : 'بعض البيانات المدخلة غير صالحة.', { kind: 'validation', code, original: err })
  }
  if (code === 'PGRST116' || code === 'P0002') return new AppError(/[؀-ۿ]/.test(msg) ? msg : 'العنصر المطلوب غير موجود أو لا تملك صلاحية الوصول إليه.', { kind: 'notfound', code, original: err })
  if (/Payload too large|exceeded the maximum allowed size/i.test(msg)) return new AppError(`حجم الصورة أكبر من المسموح (${APP_CONFIG.MAX_IMAGE_MB}MB).`, { kind: 'validation', original: err })
  if (/mime type .* is not supported|invalid_mime_type/i.test(msg)) return new AppError('نوع الملف غير مدعوم. استخدم صور JPG أو PNG أو WEBP.', { kind: 'validation', original: err })

  if (/[؀-ۿ]/.test(msg)) return new AppError(msg, { kind: 'server', code, original: err })
  console.error('[Supabase]', err)
  return new AppError('حدث خطأ في الخادم. حاول مرة أخرى لاحقاً.', { kind: 'server', code, original: err })
}

// يرجع data أو يرمي AppError — يُستخدم مع كل استعلام
async function run(promise) {
  let res
  try {
    res = await promise
  } catch (e) {
    throw toAppError(e)
  }
  if (res && res.error) {
    const e = toAppError(res.error)
    if (e.kind === 'auth') App.sessionExpired()
    throw e
  }
  return res ? res.data : undefined
}
