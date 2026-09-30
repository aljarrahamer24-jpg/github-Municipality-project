/* ==========================================================================
   ui.js — مكونات الواجهة المشتركة (تُرجع HTML أو تضيف سلوكاً تفاعلياً)
   --------------------------------------------------------------------------
   1. شارات وعناصر عرض
   2. حالات الصفحة (تحميل / خطأ / فارغ)
   3. مكونات البلاغ (Timeline، مراحل، بطاقة، تعليقات، صور)
   4. مكونات تفاعلية (Toast، Modal، تأكيد، رفع صور، نجوم، تبويبات)
   ========================================================================== */

/* ============ 1. شارات وعناصر عرض ============ */

function badge(text, tone = 'neutral', iconName = '', dot = false) {
  return `<span class="badge tone-${tone}">${dot ? '<span class="dot"></span>' : ''}${iconName ? icon(iconName) : ''}${esc(text)}</span>`
}

// كل حالة = لون + أيقونة + نص (لا نعتمد على اللون وحده)
const STATUS_META = {
  new: { tone: 'info', icon: 'circle-dot' },
  under_review: { tone: 'purple', icon: 'search' },
  assigned: { tone: 'primary', icon: 'user-cog' },
  in_progress: { tone: 'warning', icon: 'loader' },
  resolved: { tone: 'success', icon: 'circle-check' },
  closed: { tone: 'neutral', icon: 'lock' },
  rejected: { tone: 'error', icon: 'circle-x' },
}
const PRIORITY_TONE = { low: 'neutral', medium: 'info', high: 'warning', urgent: 'error' }

const statusBadge = (s) => (STATUS_META[s] ? badge(STATUS_LABELS[s], STATUS_META[s].tone, STATUS_META[s].icon) : '')
const priorityBadge = (p) => badge(PRIORITY_LABELS[p] || p, PRIORITY_TONE[p] || 'neutral', '', true)
const overdueBadge = () => badge('متأخر', 'error', 'triangle-alert')

const avatar = (name, size = '') => `<span class="avatar ${size}" aria-hidden="true">${esc(initials(name))}</span>`

function stars(value, size = '') {
  let html = `<span class="stars ${size}" aria-label="${value || 0} من 5">`
  for (let i = 1; i <= 5; i++) html += icon('star', i <= Math.round(value || 0) ? 'on' : '')
  return html + '</span>'
}

const progress = (value, tone = '') => `<div class="progress ${tone}"><span style="width:${Math.max(0, Math.min(100, value || 0))}%"></span></div>`

function statCard({ label, value, icon: ic, accent = 'primary', trend, hint, cls = '' }) {
  let foot = ''
  if (trend || hint) {
    const good = trend && (trend.good ?? trend.up)
    foot = `<div class="stat-foot">${trend ? `<span class="trend ${good ? 'good' : 'bad'}">${icon(trend.up ? 'trending-up' : 'trending-down')}${esc(trend.value)}</span>` : ''}${hint ? `<span>${esc(hint)}</span>` : ''}</div>`
  }
  return `<div class="card stat ${cls}">
    <div class="stat-top">
      <div class="flex-1"><p class="stat-label">${esc(label)}</p><p class="stat-value">${value ?? '—'}</p></div>
      <span class="icon-box box-${accent}">${icon(ic)}</span>
    </div>${foot}</div>`
}

// اتجاه التغيير مقارنة بالفترة السابقة
function trendOf(current, previous, upIsGood = true) {
  if (!previous) return null
  const pct = Math.round(((current - previous) / previous) * 100)
  if (!pct) return null
  return { value: `${Math.abs(pct)}%`, up: pct > 0, good: upIsGood ? pct > 0 : pct < 0 }
}

const ALERT_ICON = { info: 'info', success: 'circle-check', warning: 'triangle-alert', error: 'circle-x', gold: 'star' }
const alertBox = (tone, title, body = '', ic = ALERT_ICON[tone]) =>
  `<div class="alert alert-${tone}" role="status">${icon(ic)}<div>${title ? `<p class="alert-title">${title}</p>` : ''}${body ? `<div class="alert-body">${body}</div>` : ''}</div></div>`

/* ============ 2. حالات الصفحة ============ */

const empty = (ic, title, desc = '', action = '') =>
  `<div class="empty"><span class="icon-box lg round">${icon(ic)}</span><h3>${esc(title)}</h3>${desc ? `<p>${esc(desc)}</p>` : ''}${action}</div>`

const loadingBlock = (text = 'جارٍ التحميل...') =>
  `<div class="state-block" role="status" aria-live="polite"><span class="spinner lg"></span><p>${esc(text)}</p></div>`

// عرض خطأ داخل عنصر مع زر "إعادة المحاولة"
function showError(el, err, retry) {
  const e = toAppError(err)
  const ic = e.kind === 'network' ? 'globe' : e.kind === 'permission' ? 'lock' : 'triangle-alert'
  el.innerHTML = `<div class="state-block error">
      <span class="icon-box lg round box-error">${icon(ic)}</span>
      <h3>${e.kind === 'network' ? 'لا يوجد اتصال' : e.kind === 'permission' ? 'غير مصرح' : 'تعذر تحميل البيانات'}</h3>
      <p>${esc(e.message)}</p>
      ${retry ? `<button class="btn btn-outline btn-sm" data-retry>${icon('refresh-cw')}إعادة المحاولة</button>` : ''}
    </div>`
  if (retry) $('[data-retry]', el).addEventListener('click', retry)
}

// يحمّل بيانات داخل عنصر مع حالة تحميل وخطأ
async function load(el, fn, loadingText) {
  if (el) el.innerHTML = loadingBlock(loadingText)
  try {
    return await fn()
  } catch (err) {
    if (el) showError(el, err, () => load(el, fn, loadingText))
    else toast(toAppError(err).message, 'error')
    return undefined
  }
}

// زر في حالة انتظار أثناء تنفيذ عملية
async function withBusy(btn, fn, busyText = 'جارٍ الحفظ...') {
  const html = btn.innerHTML
  btn.disabled = true
  btn.innerHTML = `<span class="spinner"></span>${esc(busyText)}`
  try {
    return await fn()
  } finally {
    btn.disabled = false
    btn.innerHTML = html
  }
}

/* ============ 3. مكونات البلاغ ============ */

const TIMELINE_META = {
  new: ['circle-dot', 'info'],
  under_review: ['search', 'purple'],
  assigned: ['user-cog', 'primary'],
  in_progress: ['loader', 'warning'],
  resolved: ['circle-check', 'success'],
  closed: ['lock', 'neutral'],
  rejected: ['circle-x', 'error'],
}
const TIMELINE_TITLES = {
  new: 'تم استلام البلاغ',
  under_review: 'قيد المراجعة',
  assigned: 'تمت الإحالة للموظف المختص',
  in_progress: 'بدء المعالجة',
  resolved: 'تم حل المشكلة',
  closed: 'تم إغلاق البلاغ',
  rejected: 'تم رفض البلاغ',
}

// rows من complaint_status_history
function timeline(rows) {
  if (!rows?.length) return empty('clock', 'لا يوجد سجل بعد')
  return `<ol class="timeline">${[...rows]
    .reverse()
    .map((h) => {
      const [ic, tone] = TIMELINE_META[h.new_status] || ['circle', 'neutral']
      return `<li>
        <span class="tl-icon tone-${tone}">${icon(ic)}</span>
        <div class="flex-1">
          <div class="tl-head"><p class="tl-title">${TIMELINE_TITLES[h.new_status] || STATUS_LABELS[h.new_status]}</p><time>${formatDateTime(h.created_at)}</time></div>
          ${h.note ? `<p class="tl-note">${esc(h.note)}</p>` : ''}
          ${h.changed_by_name ? `<p class="tl-by">بواسطة: ${esc(h.changed_by_name)}</p>` : ''}
        </div></li>`
    })
    .join('')}</ol>`
}

// مؤشر مراحل مبسط للمواطن
function stepper(status) {
  const steps = [['new', 'تم الاستلام'], ['under_review', 'المراجعة'], ['in_progress', 'المعالجة'], ['resolved', 'تم الحل'], ['closed', 'مغلق']]
  const order = { new: 0, under_review: 1, rejected: 1, assigned: 2, in_progress: 2, resolved: 3, closed: 4 }
  const idx = order[status] ?? 0
  return `<ol class="stepper">${steps
    .map(([, label], i) => {
      const done = i <= idx
      const current = i === idx
      const lbl = current && status === 'rejected' ? 'مرفوض' : label
      return `<li class="${done ? 'done' : ''} ${current ? 'current' : ''}"><span class="dot">${done && !current ? icon('check') : i + 1}</span><span class="lbl">${lbl}</span></li>`
    })
    .join('')}</ol>`
}

// بطاقة بلاغ مختصرة للمواطن (row مع category و area)
function complaintCard(c, href) {
  return `<a class="c-card" href="${href}">
    <span class="icon-box">${icon(safeIcon(c.category?.icon))}</span>
    <div class="flex-1">
      <div class="title-row"><p class="truncate">${esc(c.title)}</p>${statusBadge(c.status)}</div>
      <div class="meta">
        <span class="num">${esc(c.complaint_number)}</span>
        <span>${icon('map-pin')}${esc(c.area?.name || 'غير محدد')}</span>
        <span>${icon('calendar-days')}${formatDate(c.created_at)}</span>
      </div>
    </div>${icon('chevron-left')}</a>`
}

// قائمة التعليقات (أو الملاحظات الداخلية) — viewerRole يحدد اتجاه الفقاعات
function commentsList(list, { viewerId, internal = false } = {}) {
  if (!list.length) return `<p class="text-sm c-3 text-center" style="padding:12px 0">${internal ? 'لا توجد ملاحظات داخلية بعد.' : 'لا توجد تعليقات بعد.'}</p>`
  return `<ul class="comments">${list
    .map((c) => {
      const mine = c.author_id === viewerId
      return `<li class="${mine ? 'mine' : ''}">${avatar(c.author_name, 'sm')}
        <div class="c-wrap">
          <div class="c-meta"><b>${esc(c.author_name || 'مستخدم')}</b>${internal ? badge('ملاحظة داخلية', 'gold', 'lock') : c.author_role && c.author_role !== 'citizen' ? badge('البلدية', 'primary') : ''}<span>${formatDateTime(c.created_at)}</span></div>
          <p class="bubble ${internal ? 'internal' : ''}">${esc(c.body)}</p>
        </div></li>`
    })
    .join('')}</ul>`
}

// نموذج إرسال نص (تعليق / ملاحظة) — onSubmit(text) ترجع Promise
function composer(el, { placeholder = 'اكتب تعليقك...', onSubmit }) {
  el.innerHTML = `<form class="composer">
      <textarea class="textarea" placeholder="${esc(placeholder)}" maxlength="2000" required></textarea>
      <div class="flex justify-end mt-2"><button class="btn btn-primary btn-sm" type="submit">${icon('send')}إرسال</button></div>
    </form>`
  const form = $('form', el)
  const ta = $('textarea', form)
  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    const text = ta.value.trim()
    if (!text) return
    try {
      await withBusy($('button', form), () => onSubmit(text), 'جارٍ الإرسال...')
      ta.value = ''
    } catch (err) {
      toast(toAppError(err).message, 'error')
    }
  })
}

// معرض صور من روابط موقّعة
function gallery(images, { label = '', cls = '' } = {}) {
  if (!images.length) return ''
  return `<div class="photos">${images
    .map(
      (img) => `<button type="button" class="photo-btn" data-full="${esc(img.url)}">
        <div class="photo ${cls}">${img.url ? `<img src="${esc(img.url)}" alt="${esc(label)}" loading="lazy">` : icon('image')}${label ? `<span>${esc(label)}</span>` : ''}</div>
      </button>`,
    )
    .join('')}</div>`
}

// فتح الصورة بحجم كبير عند الضغط
document.addEventListener('click', (e) => {
  const b = e.target.closest('.photo-btn[data-full]')
  if (b && b.dataset.full) modal({ title: 'معاينة الصورة', body: `<img class="full-image" src="${b.dataset.full}" alt="">`, size: 'lg' })
})

/* ============ 4. مكونات تفاعلية ============ */

function toast(message, tone = 'success') {
  $('.toast')?.remove()
  const el = document.createElement('div')
  el.className = `toast ${tone}`
  el.setAttribute('role', tone === 'error' ? 'alert' : 'status')
  el.innerHTML = icon(tone === 'error' ? 'circle-x' : tone === 'info' ? 'bell' : 'circle-check') + `<span>${esc(message)}</span>`
  document.body.appendChild(el)
  setTimeout(() => el.remove(), tone === 'error' ? 5000 : 3000)
}

// نافذة منبثقة: modal({ title, body, footer, size }) — أي عنصر فيه data-close يغلقها
function modal({ title, body, footer = '', size = '' }) {
  const el = document.createElement('div')
  el.className = 'modal'
  el.setAttribute('role', 'dialog')
  el.setAttribute('aria-modal', 'true')
  el.innerHTML = `<div class="modal-backdrop" data-close></div>
    <div class="modal-panel ${size}">
      <div class="modal-head"><h2>${title}</h2><button class="icon-btn" data-close aria-label="إغلاق">${icon('x')}</button></div>
      <div class="modal-body">${body}</div>
      ${footer ? `<div class="modal-foot">${footer}</div>` : ''}
    </div>`
  const close = () => {
    el.remove()
    document.removeEventListener('keydown', onKey)
  }
  const onKey = (e) => e.key === 'Escape' && close()
  el.addEventListener('click', (e) => e.target.closest('[data-close]') && close())
  document.addEventListener('keydown', onKey)
  document.body.appendChild(el)
  renderIcons(el)
  el.close = close
  return el
}

// نافذة تأكيد — ترجع Promise<boolean>
function confirmDialog({ title, message, confirmText = 'تأكيد', danger = false }) {
  return new Promise((resolve) => {
    const m = modal({
      title,
      size: 'sm',
      body: `<p class="text-sm c-2 leading-loose">${esc(message)}</p>`,
      footer: `<button class="btn btn-ghost" data-close>إلغاء</button><button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" data-ok>${esc(confirmText)}</button>`,
    })
    let answered = false
    $('[data-ok]', m).addEventListener('click', () => {
      answered = true
      m.close()
      resolve(true)
    })
    new MutationObserver((_, obs) => {
      if (!document.body.contains(m)) {
        obs.disconnect()
        if (!answered) resolve(false)
      }
    }).observe(document.body, { childList: true })
  })
}

// إظهار / إخفاء كلمة المرور لكل حقل type=password داخل .input-wrap
function initPasswordToggles(root = document) {
  $$('.input-wrap input[type="password"]', root).forEach((input) => {
    if (input.nextElementSibling?.classList.contains('toggle-pass')) return
    const btn = document.createElement('button')
    btn.type = 'button'
    btn.className = 'toggle-pass'
    btn.setAttribute('aria-label', 'إظهار كلمة المرور')
    btn.innerHTML = icon('eye')
    btn.addEventListener('click', () => {
      const show = input.type === 'password'
      input.type = show ? 'text' : 'password'
      btn.innerHTML = icon(show ? 'eye-off' : 'eye')
    })
    input.after(btn)
  })
}

// منطقة رفع الصور: <div data-upload data-max="5"></div>
// الملفات المختارة متاحة عبر box.getFiles() — والتفريغ عبر box.clear()
function initUploads(root = document) {
  const maxMb = APP_CONFIG.MAX_IMAGE_MB
  $$('[data-upload]', root).forEach((box) => {
    if (box.getFiles) return
    const max = Number(box.dataset.max || APP_CONFIG.MAX_IMAGES)
    const compact = box.hasAttribute('data-compact')
    let files = []
    box.innerHTML = `<button type="button" class="upload-zone ${compact ? 'compact' : ''}">
        <span class="icon-box">${icon('image-plus')}</span>
        <span class="text-sm fw-500">${esc(box.dataset.label || 'اسحب الصور هنا أو اضغط للاختيار')}</span>
        <span class="text-xs c-3">JPG أو PNG أو WEBP — حتى ${max} صور، بحد أقصى ${maxMb}MB للصورة</span>
      </button>
      <input type="file" accept="image/jpeg,image/png,image/webp" multiple hidden>
      <div class="previews"></div>`
    const zone = $('.upload-zone', box)
    const input = $('input', box)
    const previews = $('.previews', box)
    const draw = () => {
      previews.innerHTML = ''
      files.forEach((f, i) => {
        const item = document.createElement('div')
        item.className = 'preview'
        item.innerHTML = `<img alt=""><button type="button" aria-label="حذف الصورة">${icon('x')}</button>`
        $('img', item).src = URL.createObjectURL(f)
        $('button', item).addEventListener('click', () => {
          files.splice(i, 1)
          draw()
        })
        previews.appendChild(item)
      })
      box.dispatchEvent(new CustomEvent('files-change'))
    }
    const add = (list) => {
      for (const f of Array.from(list)) {
        if (!/^image\/(jpeg|png|webp)$/.test(f.type)) {
          toast(`الملف "${f.name}" ليس صورة مدعومة`, 'error')
          continue
        }
        if (f.size > maxMb * 1024 * 1024) {
          toast(`الصورة "${f.name}" أكبر من ${maxMb}MB`, 'error')
          continue
        }
        if (files.length >= max) {
          toast(`الحد الأقصى ${max} صور`, 'error')
          break
        }
        files.push(f)
      }
      draw()
    }
    zone.addEventListener('click', () => input.click())
    input.addEventListener('change', () => {
      add(input.files)
      input.value = ''
    })
    zone.addEventListener('dragover', (e) => {
      e.preventDefault()
      zone.classList.add('drag')
    })
    zone.addEventListener('dragleave', () => zone.classList.remove('drag'))
    zone.addEventListener('drop', (e) => {
      e.preventDefault()
      zone.classList.remove('drag')
      add(e.dataTransfer.files)
    })
    box.getFiles = () => [...files]
    box.addFiles = add
    box.clear = () => {
      files = []
      draw()
    }
  })
}

// نجوم قابلة للاختيار
function starInput(container, onChange) {
  let value = 0
  const draw = () => {
    container.innerHTML = [1, 2, 3, 4, 5].map((i) => `<button type="button" data-v="${i}" aria-label="${i} نجوم">${icon('star', i <= value ? 'on' : '')}</button>`).join('')
  }
  container.classList.add('stars', 'lg')
  container.addEventListener('click', (e) => {
    const b = e.target.closest('button')
    if (!b) return
    value = Number(b.dataset.v)
    draw()
    onChange(value)
  })
  draw()
}

// تبويبات عامة: <div class="tabs" data-tabs> <button class="tab" data-tab="x"> ... ومحتوى [data-pane="x"]
function initTabs(root = document) {
  $$('[data-tabs]', root).forEach((tabs) => {
    tabs.addEventListener('click', (e) => {
      const t = e.target.closest('[data-tab]')
      if (!t) return
      $$('[data-tab]', tabs).forEach((b) => b.classList.toggle('active', b === t))
      const scope = tabs.closest('[data-tabs-scope]') || document
      $$('[data-pane]', scope).forEach((p) => (p.hidden = p.dataset.pane !== t.dataset.tab))
    })
  })
}

// ملء قائمة منسدلة من مصفوفة [value, label]
function fillSelect(select, items, { placeholder, value } = {}) {
  select.innerHTML =
    (placeholder !== undefined ? `<option value="">${esc(placeholder)}</option>` : '') +
    items.map(([v, l]) => `<option value="${esc(v)}" ${String(v) === String(value ?? '') ? 'selected' : ''}>${esc(l)}</option>`).join('')
}

// تمييز حقل غير صالح مع رسالة
function setFieldError(field, message) {
  field.classList.toggle('is-invalid', !!message)
  const el = $('.error-text', field)
  if (el && message) el.textContent = message
}
