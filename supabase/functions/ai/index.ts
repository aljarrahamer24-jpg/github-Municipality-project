// ============================================================================
//  Edge Function: ai — نقطة الدخول الوحيدة لكل ميزات الذكاء الاصطناعي
//  ---------------------------------------------------------------------------
//  POST /functions/v1/ai   (يتطلب تسجيل الدخول — Authorization: Bearer <JWT>)
//  body: { "action": "...", ...parameters }
//
//  الإجراءات:
//   analyze_image  { image: base64, mime_type, hint? }  → اقتراح بيانات البلاغ من صورة
//   analyze_text   { text }                              → اقتراح بيانات البلاغ من نص/كلام بالعامية
//
//  الأمان: التحقق من الجلسة، حد للطلبات لكل مستخدم (ai_begin_request)، التحقق من المدخلات،
//  وكل الوصول لقاعدة البيانات بصلاحيات المستخدم عبر RLS. مفتاح المزوّد في متغيرات البيئة فقط.
// ============================================================================

import { AIError, getProvider } from '../_shared/ai/provider.ts'
import { analyzeImage, analyzeText, type Category } from '../_shared/ai/complaint.ts'
import { authenticate, insert, rpc, select, type UserContext } from '../_shared/db.ts'

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'authorization, x-client-info, apikey, content-type',
  'access-control-allow-methods': 'POST, OPTIONS',
}
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...CORS, 'content-type': 'application/json; charset=utf-8' } })

const MAX_IMAGE_BYTES = 5 * 1024 * 1024
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']

const activeCategories = (user: UserContext) =>
  select<Category>(user.token, 'problem_categories?select=id,name,description&is_active=eq.true&order=name')

async function saveAnalysis(user: UserContext, kind: 'image' | 'text', inputText: string | null, result: unknown, provider: { name: string; model: string }) {
  const row = await insert<{ id: string }>(user.token, 'ai_analyses', {
    user_id: user.id, kind, input_text: inputText, result, provider: provider.name, model: provider.model,
  })
  return row.id
}

type Handler = (user: UserContext, body: Record<string, unknown>) => Promise<unknown>

const actions: Record<string, Handler> = {
  async analyze_image(user, body) {
    const mime = String(body.mime_type || '')
    const b64 = typeof body.image === 'string' ? body.image.replace(/^data:[^,]+,/, '') : ''
    if (!IMAGE_TYPES.includes(mime) || !b64) throw new AIError('يرجى إرسال صورة JPG أو PNG أو WEBP.', 400, 'invalid_input')
    if (b64.length * 0.75 > MAX_IMAGE_BYTES) throw new AIError('حجم الصورة أكبر من 5MB.', 413, 'invalid_input')
    const hint = typeof body.hint === 'string' ? body.hint.slice(0, 300) : ''
    const ai = getProvider() // يفشل مبكراً إذا لم يُضبط المفتاح، قبل احتساب الطلب
    await rpc(user.token, 'ai_begin_request', { p_action: 'analyze_image' })
    const categories = await activeCategories(user)
    const result = await analyzeImage(ai, categories, { mimeType: mime, base64: b64 }, hint)
    const analysis_id = await saveAnalysis(user, 'image', hint || null, result, ai)
    return { analysis_id, ...result }
  },

  async analyze_text(user, body) {
    const text = typeof body.text === 'string' ? body.text.trim() : ''
    if (text.length < 3 || text.length > 1000) throw new AIError('اكتب وصفاً للمشكلة (من 3 إلى 1000 حرف).', 400, 'invalid_input')
    const ai = getProvider() // يفشل مبكراً إذا لم يُضبط المفتاح، قبل احتساب الطلب
    await rpc(user.token, 'ai_begin_request', { p_action: 'analyze_text' })
    const categories = await activeCategories(user)
    const result = await analyzeText(ai, categories, text)
    const analysis_id = await saveAnalysis(user, 'text', text, result, ai)
    return { analysis_id, ...result }
  },
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  if (req.method !== 'POST') return json({ error: 'الطريقة غير مسموحة', code: 'method_not_allowed' }, 405)
  try {
    const user = await authenticate(req)
    let body: Record<string, unknown>
    try {
      body = await req.json()
    } catch {
      throw new AIError('طلب غير صالح.', 400, 'invalid_input')
    }
    const handler = actions[String(body?.action)]
    if (!handler) throw new AIError('إجراء غير معروف.', 400, 'unknown_action')
    return json(await handler(user, body))
  } catch (e) {
    if (e instanceof AIError) return json({ error: e.message, code: e.code }, e.status)
    console.error(e)
    return json({ error: 'حدث خطأ غير متوقع في خدمة الذكاء الاصطناعي.', code: 'internal' }, 500)
  }
})
