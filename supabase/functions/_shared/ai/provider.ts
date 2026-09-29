// ============================================================================
//  طبقة مزوّد الذكاء الاصطناعي (Provider abstraction)
//  ---------------------------------------------------------------------------
//  كل ميزات الذكاء الاصطناعي تستدعي هذه الواجهة فقط، وليس مزوداً محدداً.
//  لتغيير المزوّد مستقبلاً: أضف ملفاً جديداً ينفّذ AIProvider وسجّله في getProvider().
// ============================================================================

import { createGeminiProvider } from './gemini.ts'

/** جزء من رسالة المستخدم: نص أو صورة */
export type AIPart = { type: 'text'; text: string } | { type: 'image'; mimeType: string; base64: string }

/** مخطط JSON مبسّط (مجموعة فرعية من OpenAPI يدعمها أغلب المزودين) */
export type JSONSchema = {
  type: 'object' | 'string' | 'number' | 'integer' | 'boolean' | 'array'
  description?: string
  enum?: string[]
  properties?: Record<string, JSONSchema>
  required?: string[]
  items?: JSONSchema
}

export interface GenerateJSONRequest {
  system: string
  parts: AIPart[]
  schema: JSONSchema
  temperature?: number
  maxOutputTokens?: number
}

export interface GenerateTextRequest {
  system: string
  parts: AIPart[]
  temperature?: number
  maxOutputTokens?: number
}

export interface AIProvider {
  readonly name: string
  readonly model: string
  /** يعيد كائناً مطابقاً للمخطط (يتم التحقق منه لاحقاً في كل ميزة) */
  generateJSON(req: GenerateJSONRequest): Promise<unknown>
  /** يعيد نصاً حراً (للصياغة والإجابات) */
  generateText(req: GenerateTextRequest): Promise<string>
}

/** خطأ موحّد برسالة عربية ورمز HTTP مناسب */
export class AIError extends Error {
  constructor(message: string, public status = 502, public code = 'ai_error') {
    super(message)
  }
}

export function getProvider(): AIProvider {
  const name = (Deno.env.get('AI_PROVIDER') || 'gemini').toLowerCase()
  switch (name) {
    case 'gemini':
      return createGeminiProvider()
    default:
      throw new AIError('مزوّد الذكاء الاصطناعي غير مدعوم في الإعدادات', 500, 'ai_misconfigured')
  }
}
