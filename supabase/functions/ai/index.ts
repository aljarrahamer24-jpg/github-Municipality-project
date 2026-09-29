// ============================================================================
//  Edge Function: ai — طبقة الذكاء الاصطناعي لمنصة شكاوى البلدية (ملف واحد)
//  ---------------------------------------------------------------------------
//  يُنشر من لوحة Supabase مباشرة (بدون أي أداة على جهازك):
//    Edge Functions → Deploy a new function → Via Editor → الاسم: ai → الصق هذا الملف → Deploy
//  الإعدادات السرية: Edge Functions → Secrets → GEMINI_API_KEY
//  التفاصيل: docs/07-ai-layer.md
//
//  POST /functions/v1/ai   (يتطلب تسجيل الدخول — Authorization: Bearer <JWT>)
//  body: { "action": "...", ...parameters }
//   analyze_image  { image: base64, mime_type, hint? }  → اقتراح بيانات البلاغ من صورة
//   analyze_text   { text }                              → اقتراح بيانات البلاغ من نص/كلام بالعامية
//
//  الأمان: التحقق من الجلسة، حد للطلبات لكل مستخدم (ai_begin_request)، التحقق من المدخلات
//  والمخرجات، وكل الوصول لقاعدة البيانات بصلاحيات المستخدم عبر RLS (بدون Service Role).
//  مفتاح المزوّد في Secrets فقط ولا يصل للمتصفح أبداً.
//
//  الأقسام:
//    1. واجهة المزوّد (Provider abstraction)   2. مزوّد Gemini
//    3. الوصول لقاعدة البيانات (RLS)            4. فهم البلاغ (صورة / نص)
//    5. نقطة الدخول والإجراءات
// ============================================================================


// ============================================================================
//  1. واجهة مزوّد الذكاء الاصطناعي (لتغيير المزوّد مستقبلاً: أضف تنفيذاً جديداً في القسم 2 وسجّله في getProvider)
// ============================================================================

/** جزء من رسالة المستخدم: نص أو صورة */
type AIPart = { type: 'text'; text: string } | { type: 'image'; mimeType: string; base64: string }

/** مخطط JSON مبسّط (مجموعة فرعية من OpenAPI يدعمها أغلب المزودين) */
type JSONSchema = {
  type: 'object' | 'string' | 'number' | 'integer' | 'boolean' | 'array'
  description?: string
  enum?: string[]
  properties?: Record<string, JSONSchema>
  required?: string[]
  items?: JSONSchema
}

interface GenerateJSONRequest {
  system: string
  parts: AIPart[]
  schema: JSONSchema
  temperature?: number
  maxOutputTokens?: number
}

interface GenerateTextRequest {
  system: string
  parts: AIPart[]
  temperature?: number
  maxOutputTokens?: number
}

interface AIProvider {
  readonly name: string
  readonly model: string
  /** يعيد كائناً مطابقاً للمخطط (يتم التحقق منه لاحقاً في كل ميزة) */
  generateJSON(req: GenerateJSONRequest): Promise<unknown>
  /** يعيد نصاً حراً (للصياغة والإجابات) */
  generateText(req: GenerateTextRequest): Promise<string>
}

/** خطأ موحّد برسالة عربية ورمز HTTP مناسب */
class AIError extends Error {
  constructor(message: string, public status = 502, public code = 'ai_error') {
    super(message)
  }
}

function getProvider(): AIProvider {
  const name = (Deno.env.get('AI_PROVIDER') || 'gemini').toLowerCase()
  switch (name) {
    case 'gemini':
      return createGeminiProvider()
    default:
      throw new AIError('مزوّد الذكاء الاصطناعي غير مدعوم في الإعدادات', 500, 'ai_misconfigured')
  }
}


// ============================================================================
//  2. مزوّد Google Gemini
// ============================================================================

const DEFAULT_MODEL = 'gemini-3.1-flash-lite'
const DEFAULT_BASE = 'https://generativelanguage.googleapis.com'
const TIMEOUT_MS = 30_000

type GeminiPart = { text: string } | { inlineData: { mimeType: string; data: string } }

const toParts = (parts: AIPart[]): GeminiPart[] =>
  parts.map((p) => (p.type === 'text' ? { text: p.text } : { inlineData: { mimeType: p.mimeType, data: p.base64 } }))

// Gemini يستخدم أسماء الأنواع بالأحرف الكبيرة (OBJECT, STRING, ...)
const toGeminiSchema = (s: JSONSchema): Record<string, unknown> => {
  const out: Record<string, unknown> = { type: s.type.toUpperCase() }
  if (s.description) out.description = s.description
  if (s.enum) out.enum = s.enum
  if (s.properties) out.properties = Object.fromEntries(Object.entries(s.properties).map(([k, v]) => [k, toGeminiSchema(v)]))
  if (s.required) out.required = s.required
  if (s.items) out.items = toGeminiSchema(s.items)
  return out
}

function createGeminiProvider(): AIProvider {
  const apiKey = Deno.env.get('GEMINI_API_KEY')
  const model = Deno.env.get('GEMINI_MODEL') || DEFAULT_MODEL
  const base = (Deno.env.get('GEMINI_BASE_URL') || DEFAULT_BASE).replace(/\/+$/, '')
  if (!apiKey) throw new AIError('لم يتم إعداد مفتاح خدمة الذكاء الاصطناعي بعد (GEMINI_API_KEY).', 503, 'ai_not_configured')

  async function call(body: Record<string, unknown>): Promise<string> {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS)
    let res: Response
    try {
      res = await fetch(`${base}/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-goog-api-key': apiKey! },
        body: JSON.stringify(body),
        signal: ctrl.signal,
      })
    } catch (e) {
      throw new AIError(e instanceof DOMException && e.name === 'AbortError' ? 'استغرقت خدمة الذكاء الاصطناعي وقتاً طويلاً. حاول مجدداً.' : 'تعذر الاتصال بخدمة الذكاء الاصطناعي.', 504, 'ai_unreachable')
    } finally {
      clearTimeout(timer)
    }
    if (res.status === 429) throw new AIError('تم تجاوز الحد المجاني لخدمة الذكاء الاصطناعي مؤقتاً. حاول بعد قليل أو أكمل يدوياً.', 429, 'ai_quota')
    if (res.status === 400 || res.status === 403 || res.status === 404) {
      console.error('gemini error', res.status, (await res.text()).slice(0, 500))
      throw new AIError('إعدادات خدمة الذكاء الاصطناعي غير صحيحة (المفتاح أو اسم النموذج).', 502, 'ai_misconfigured')
    }
    if (!res.ok) throw new AIError('خدمة الذكاء الاصطناعي غير متاحة حالياً.', 502, 'ai_unavailable')

    const data = await res.json()
    if (data?.promptFeedback?.blockReason) throw new AIError('تعذر تحليل هذا المحتوى. أكمل البلاغ يدوياً.', 422, 'ai_blocked')
    const cand = data?.candidates?.[0]
    if (!cand || cand.finishReason === 'SAFETY' || cand.finishReason === 'PROHIBITED_CONTENT') {
      throw new AIError('تعذر تحليل هذا المحتوى. أكمل البلاغ يدوياً.', 422, 'ai_blocked')
    }
    const text = (cand.content?.parts || []).map((p: { text?: string }) => p.text || '').join('')
    if (!text.trim()) throw new AIError('لم تُرجع خدمة الذكاء الاصطناعي نتيجة.', 502, 'ai_empty')
    return text
  }

  return {
    name: 'gemini',
    model,
    async generateJSON(req: GenerateJSONRequest) {
      const text = await call({
        systemInstruction: { parts: [{ text: req.system }] },
        contents: [{ role: 'user', parts: toParts(req.parts) }],
        generationConfig: {
          temperature: req.temperature ?? 0.2,
          maxOutputTokens: req.maxOutputTokens ?? 1024,
          responseMimeType: 'application/json',
          responseSchema: toGeminiSchema(req.schema),
        },
      })
      try {
        return JSON.parse(text)
      } catch {
        throw new AIError('نتيجة غير صالحة من خدمة الذكاء الاصطناعي.', 502, 'ai_bad_output')
      }
    },
    async generateText(req: GenerateTextRequest) {
      return await call({
        systemInstruction: { parts: [{ text: req.system }] },
        contents: [{ role: 'user', parts: toParts(req.parts) }],
        generationConfig: { temperature: req.temperature ?? 0.3, maxOutputTokens: req.maxOutputTokens ?? 1536 },
      })
    },
  }
}


// ============================================================================
//  3. الوصول لقاعدة البيانات بصلاحيات المستخدم (RLS)
// ============================================================================

type UserContext = { id: string; role: string; token: string }

const URL_ = () => Deno.env.get('SUPABASE_URL')!.replace(/\/+$/, '')
// المفتاح العام للمشروع (القديم anon أو الجديد publishable — كلاهما عام وليس سرياً)
const ANON = () => (Deno.env.get('SUPABASE_ANON_KEY') || Deno.env.get('SUPABASE_PUBLISHABLE_KEY'))!

const headers = (token: string) => ({ apikey: ANON(), authorization: `Bearer ${token}`, 'content-type': 'application/json' })

/** التحقق من الجلسة وقراءة دور المستخدم من profiles */
async function authenticate(req: Request): Promise<UserContext> {
  const auth = req.headers.get('authorization') || ''
  const token = auth.replace(/^Bearer\s+/i, '')
  if (!token || token === ANON()) throw new AIError('يجب تسجيل الدخول لاستخدام هذه الميزة.', 401, 'unauthorized')
  const u = await fetch(`${URL_()}/auth/v1/user`, { headers: headers(token) })
  if (!u.ok) throw new AIError('انتهت الجلسة. سجّل الدخول من جديد.', 401, 'unauthorized')
  const user = await u.json()
  const rows = await select<{ role: string; is_active: boolean }>(token, `profiles?select=role,is_active&id=eq.${user.id}`)
  if (!rows[0] || !rows[0].is_active) throw new AIError('الحساب غير نشط.', 403, 'forbidden')
  return { id: user.id, role: rows[0].role, token }
}

async function pgError(res: Response): Promise<never> {
  let msg = ''
  let hint = ''
  try {
    const j = await res.json()
    msg = j.message || ''
    hint = j.hint || ''
  } catch { /* تجاهل */ }
  if (hint === 'ai_rate_limit') throw new AIError(msg, 429, 'rate_limited')
  if (hint === 'ai_disabled') throw new AIError(msg, 503, 'ai_disabled')
  if (/[؀-ۿ]/.test(msg)) throw new AIError(msg, res.status === 401 ? 401 : 400, 'db_error')
  console.error('db error', res.status, msg)
  throw new AIError('حدث خطأ في قاعدة البيانات.', 500, 'db_error')
}

async function select<T>(token: string, path: string): Promise<T[]> {
  const res = await fetch(`${URL_()}/rest/v1/${path}`, { headers: headers(token) })
  if (!res.ok) await pgError(res)
  return await res.json()
}

async function insert<T>(token: string, table: string, row: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${URL_()}/rest/v1/${table}`, {
    method: 'POST',
    headers: { ...headers(token), prefer: 'return=representation' },
    body: JSON.stringify(row),
  })
  if (!res.ok) await pgError(res)
  return (await res.json())[0]
}

async function rpc<T>(token: string, fn: string, args: Record<string, unknown> = {}): Promise<T> {
  const res = await fetch(`${URL_()}/rest/v1/rpc/${fn}`, { method: 'POST', headers: headers(token), body: JSON.stringify(args) })
  if (!res.ok) await pgError(res)
  const text = await res.text()
  return (text ? JSON.parse(text) : null) as T
}


// ============================================================================
//  4. فهم البلاغ من صورة أو نص
// ============================================================================

type Category = { id: string; name: string; description: string | null }

type ComplaintSuggestion = {
  is_municipal_issue: boolean
  category_id: string | null
  category_name: string | null
  title: string
  description: string
  urgency: 'low' | 'medium' | 'high' | 'urgent'
  location_text: string
  confidence: number
  notes: string
}

const OTHER = 'غير ذلك'
const URGENCY = ['low', 'medium', 'high', 'urgent'] as const

const SYSTEM = `أنت مساعد لاستقبال بلاغات منصة شكاوى بلدية أردنية. مهمتك تحويل صورة أو كلام المواطن (بالفصحى أو العامية) إلى بيانات بلاغ منظمة.
القواعد:
- اختر "category" من القائمة المعطاة فقط. إذا لم تنطبق أي فئة بوضوح اختر "${OTHER}".
- "title": عنوان عربي مختصر وواضح (من 5 إلى 60 حرفاً).
- "description": وصف عربي فصيح ومهذب للمشكلة (من 20 إلى 400 حرف) يعتمد فقط على ما في الصورة أو الكلام، دون مبالغة ودون اختلاق تفاصيل غير موجودة.
- "urgency": low أو medium أو high أو urgent. استخدم urgent فقط عند خطر مباشر على السلامة (أسلاك مكشوفة، حفرة عميقة في طريق رئيسي، طفح مجاري واسع...).
- "location_text": اكتب المكان فقط إذا ذكره المواطن نصاً أو ظهر مكتوباً بوضوح في الصورة (مثل: "جنب المدرسة"، "عند الدوار"). لا تخمّن ولا تكتب إحداثيات. إذا لم يُذكر مكان اترك القيمة فارغة "".
- "is_municipal_issue": false إذا لم تكن المشكلة من اختصاص البلدية أو لم تكن الصورة لمشكلة أصلاً.
- "confidence": رقم من 0 إلى 1 يعبّر عن ثقتك في اختيار الفئة.
- "notes": ملاحظة قصيرة إضافية مفيدة للفريق الميداني إن وجدت، وإلا "".
- لا تذكر أي معلومات شخصية (وجوه، أرقام لوحات، أسماء أشخاص) في أي حقل.`

function schema(categories: Category[]): JSONSchema {
  return {
    type: 'object',
    properties: {
      is_municipal_issue: { type: 'boolean' },
      category: { type: 'string', enum: [...categories.map((c) => c.name), OTHER] },
      title: { type: 'string' },
      description: { type: 'string' },
      urgency: { type: 'string', enum: [...URGENCY] },
      location_text: { type: 'string' },
      confidence: { type: 'number' },
      notes: { type: 'string' },
    },
    required: ['is_municipal_issue', 'category', 'title', 'description', 'urgency', 'location_text', 'confidence'],
  }
}

const clean = (v: unknown, max: number) =>
  typeof v === 'string' ? v.replace(/\s+/g, ' ').replace(/[<>]/g, '').trim().slice(0, max) : ''

/** التحقق من مخرجات النموذج وربط الفئة بمعرّفها الحقيقي في قاعدة البيانات */
function validateSuggestion(raw: unknown, categories: Category[]): ComplaintSuggestion {
  if (!raw || typeof raw !== 'object') throw new AIError('نتيجة غير صالحة من خدمة الذكاء الاصطناعي.', 502, 'ai_bad_output')
  const r = raw as Record<string, unknown>
  const cat = categories.find((c) => c.name === r.category) || null
  const urgency = URGENCY.includes(r.urgency as typeof URGENCY[number]) ? (r.urgency as ComplaintSuggestion['urgency']) : 'medium'
  const conf = Number(r.confidence)
  return {
    is_municipal_issue: r.is_municipal_issue !== false,
    category_id: cat?.id ?? null,
    category_name: cat?.name ?? null,
    title: clean(r.title, 80),
    description: clean(r.description, 600),
    urgency,
    location_text: clean(r.location_text, 200),
    confidence: Number.isFinite(conf) ? Math.min(1, Math.max(0, conf)) : 0,
    notes: clean(r.notes, 300),
  }
}

const catList = (categories: Category[]) =>
  'فئات المشاكل المتاحة:\n' + categories.map((c) => `- ${c.name}${c.description ? `: ${c.description}` : ''}`).join('\n')

async function analyzeImage(ai: AIProvider, categories: Category[], image: { mimeType: string; base64: string }, hint = '') {
  const parts: AIPart[] = [
    { type: 'image', mimeType: image.mimeType, base64: image.base64 },
    { type: 'text', text: `${catList(categories)}\n\nحلّل صورة المشكلة التي التقطها المواطن.${hint ? `\nملاحظة المواطن: «${hint}»` : ''}` },
  ]
  return validateSuggestion(await ai.generateJSON({ system: SYSTEM, parts, schema: schema(categories) }), categories)
}

async function analyzeText(ai: AIProvider, categories: Category[], text: string) {
  const parts: AIPart[] = [{ type: 'text', text: `${catList(categories)}\n\nكلام المواطن:\n«${text}»` }]
  return validateSuggestion(await ai.generateJSON({ system: SYSTEM, parts, schema: schema(categories) }), categories)
}


// ============================================================================
//  5. نقطة الدخول والإجراءات
// ============================================================================

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
