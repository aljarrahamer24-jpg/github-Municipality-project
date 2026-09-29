// ============================================================================
//  مزوّد Google Gemini (REST API — بدون مكتبات خارجية)
//  المتغيرات: GEMINI_API_KEY (مطلوب، سرّي) · GEMINI_MODEL (اختياري) · GEMINI_BASE_URL (اختياري)
// ============================================================================

import { AIError, type AIPart, type AIProvider, type GenerateJSONRequest, type GenerateTextRequest, type JSONSchema } from './provider.ts'

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

export function createGeminiProvider(): AIProvider {
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
