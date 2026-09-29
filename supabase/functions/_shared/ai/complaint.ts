// ============================================================================
//  فهم البلاغ من صورة أو نص (عربي فصيح أو عامية)
//  ---------------------------------------------------------------------------
//  الذكاء الاصطناعي يقترح فقط: النوع (من قائمة الأنواع الموجودة فعلاً)، العنوان، الوصف،
//  درجة الاستعجال، ووصف المكان كما ذُكر حرفياً. لا يحدد إحداثيات أبداً.
//  كل مخرجاته تُتحقق وتُقصّ هنا قبل إرجاعها، والمواطن يراجعها ويعدّلها قبل الإرسال.
// ============================================================================

import { AIError, type AIPart, type AIProvider, type JSONSchema } from './provider.ts'

export type Category = { id: string; name: string; description: string | null }

export type ComplaintSuggestion = {
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
export function validateSuggestion(raw: unknown, categories: Category[]): ComplaintSuggestion {
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

export async function analyzeImage(ai: AIProvider, categories: Category[], image: { mimeType: string; base64: string }, hint = '') {
  const parts: AIPart[] = [
    { type: 'image', mimeType: image.mimeType, base64: image.base64 },
    { type: 'text', text: `${catList(categories)}\n\nحلّل صورة المشكلة التي التقطها المواطن.${hint ? `\nملاحظة المواطن: «${hint}»` : ''}` },
  ]
  return validateSuggestion(await ai.generateJSON({ system: SYSTEM, parts, schema: schema(categories) }), categories)
}

export async function analyzeText(ai: AIProvider, categories: Category[], text: string) {
  const parts: AIPart[] = [{ type: 'text', text: `${catList(categories)}\n\nكلام المواطن:\n«${text}»` }]
  return validateSuggestion(await ai.generateJSON({ system: SYSTEM, parts, schema: schema(categories) }), categories)
}
