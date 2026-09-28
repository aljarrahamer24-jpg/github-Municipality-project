/* ==========================================================================
   utils.js — أدوات مساعدة عامة (DOM، تنسيق، تسميات عربية)
   ========================================================================== */

const $ = (sel, root = document) => root.querySelector(sel)
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel))

// '' للصفحات في الجذر و '../' للصفحات داخل المجلدات
const ROOT = document.body.dataset.root || ''
const url = (path) => ROOT + path

function esc(str) {
  return String(str ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch])
}

function icon(name, cls = '') {
  return `<svg class="icon ${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name] || ICONS.circle}</svg>`
}

// يستبدل كل <i data-icon="name"></i> بأيقونة SVG
function renderIcons(root = document) {
  $$('[data-icon]', root).forEach((el) => {
    el.outerHTML = icon(el.dataset.icon, el.className)
  })
}

const LOCALE = 'ar-u-nu-latn' // أرقام لاتينية مع نصوص عربية
const formatDate = (iso) => (iso ? new Date(iso).toLocaleDateString(LOCALE, { year: 'numeric', month: 'short', day: 'numeric' }) : '—')
const formatDateTime = (iso) =>
  iso ? new Date(iso).toLocaleString(LOCALE, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'
const formatNumber = (n) => (n === null || n === undefined ? '—' : Number(n).toLocaleString(LOCALE))
const formatMonth = (d) => new Date(d).toLocaleDateString(LOCALE, { month: 'long', year: 'numeric' })
const monthName = (d) => new Date(d).toLocaleDateString(LOCALE, { month: 'long' })
const getParam = (key) => new URLSearchParams(location.search).get(key)

function timeAgo(iso) {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000)
  if (mins < 1) return 'الآن'
  if (mins < 60) return `منذ ${mins} دقيقة`
  const hours = Math.round(mins / 60)
  if (hours < 24) return hours === 1 ? 'منذ ساعة' : hours === 2 ? 'منذ ساعتين' : `منذ ${hours} ساعات`
  const days = Math.round(hours / 24)
  if (days === 1) return 'أمس'
  if (days === 2) return 'منذ يومين'
  if (days <= 10) return `منذ ${days} أيام`
  return formatDate(iso)
}

function debounce(fn, ms = 300) {
  let t
  return (...args) => {
    clearTimeout(t)
    t = setTimeout(() => fn(...args), ms)
  }
}

// إزالة الأحرف التي تكسر صيغة فلاتر PostgREST في البحث النصي
const cleanSearch = (q) => String(q || '').replace(/[,()%*\\]/g, ' ').trim()

/* ---------- التسميات العربية ---------- */
const STATUS_LABELS = {
  new: 'جديد',
  under_review: 'قيد المراجعة',
  assigned: 'تم التعيين',
  in_progress: 'قيد المعالجة',
  resolved: 'تم الحل',
  closed: 'مغلق',
  rejected: 'مرفوض',
}
const OPEN_STATUSES = ['new', 'under_review', 'assigned', 'in_progress']
const PRIORITY_LABELS = { low: 'منخفضة', medium: 'متوسطة', high: 'عالية', urgent: 'عاجلة' }
const ROLE_LABELS = { citizen: 'مواطن', employee: 'موظف', admin: 'مدير' }
const RISK_LABELS = { low: 'منخفضة', medium: 'متوسطة', high: 'عالية' }
const SENTIMENT_LABELS = { positive: 'إيجابية', negative: 'سلبية', neutral: 'محايدة' }
const WEATHER_TYPES = { rain: 'أمطار', flood: 'فيضانات / سيول', storm: 'عاصفة رعدية', wind: 'رياح نشطة', snow: 'ثلوج', heat: 'موجة حر', dust: 'غبار' }
const WEATHER_ICONS = { rain: 'cloud-rain', flood: 'waves-horizontal', storm: 'cloud-rain-wind', wind: 'wind', snow: 'cloud-rain', heat: 'thermometer', dust: 'wind' }
const STATUS_COLOR = { new: '#2563eb', under_review: '#7c3aed', assigned: '#0d9488', in_progress: '#d97706', resolved: '#16a34a', closed: '#64748b', rejected: '#dc2626' }

// أيقونات متاحة لأنواع المشاكل (يختار منها المدير)
const CATEGORY_ICONS = ['construction', 'trash', 'lightbulb', 'droplets', 'waves-horizontal', 'cloud-rain', 'tree-pine', 'footprints', 'building-complex', 'paw-print', 'wind', 'flame', 'wrench', 'map-pin']
const safeIcon = (name) => (ICONS[name] ? name : 'construction')

const isOverdue = (c) => OPEN_STATUSES.includes(c.status) && c.due_at && new Date(c.due_at) < new Date()
const initials = (name) =>
  String(name || '؟')
    .replace(/^(م\.|أ\.|د\.)\s*/, '')
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0])
    .join(' ')
