// ============================================================================
//  الوصول لقاعدة البيانات من Edge Function بصلاحيات المستخدم نفسه (JWT)
//  لا نستخدم Service Role أبداً: كل استعلام يمر عبر RLS تماماً كما في الواجهة.
// ============================================================================

import { AIError } from './ai/provider.ts'

export type UserContext = { id: string; role: string; token: string }

const URL_ = () => Deno.env.get('SUPABASE_URL')!.replace(/\/+$/, '')
// المفتاح العام للمشروع (القديم anon أو الجديد publishable — كلاهما عام وليس سرياً)
const ANON = () => (Deno.env.get('SUPABASE_ANON_KEY') || Deno.env.get('SUPABASE_PUBLISHABLE_KEY'))!

const headers = (token: string) => ({ apikey: ANON(), authorization: `Bearer ${token}`, 'content-type': 'application/json' })

/** التحقق من الجلسة وقراءة دور المستخدم من profiles */
export async function authenticate(req: Request): Promise<UserContext> {
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

export async function select<T>(token: string, path: string): Promise<T[]> {
  const res = await fetch(`${URL_()}/rest/v1/${path}`, { headers: headers(token) })
  if (!res.ok) await pgError(res)
  return await res.json()
}

export async function insert<T>(token: string, table: string, row: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${URL_()}/rest/v1/${table}`, {
    method: 'POST',
    headers: { ...headers(token), prefer: 'return=representation' },
    body: JSON.stringify(row),
  })
  if (!res.ok) await pgError(res)
  return (await res.json())[0]
}

export async function rpc<T>(token: string, fn: string, args: Record<string, unknown> = {}): Promise<T> {
  const res = await fetch(`${URL_()}/rest/v1/rpc/${fn}`, { method: 'POST', headers: headers(token), body: JSON.stringify(args) })
  if (!res.ok) await pgError(res)
  const text = await res.text()
  return (text ? JSON.parse(text) : null) as T
}
