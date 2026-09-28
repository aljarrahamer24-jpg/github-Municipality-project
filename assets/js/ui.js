/* ==========================================================================
   ui.js — الأدوات والمكونات المشتركة + بناء التخطيط (Header / Sidebar / Footer)
   يُحمّل في كل الصفحات بعد icons.js و data.js
   --------------------------------------------------------------------------
   1. أدوات مساعدة
   2. مكونات تُرجع HTML
   3. مكونات تفاعلية (Modal, Toast, رفع الصور, النجوم, كلمة المرور)
   4. جدول البلاغات (بحث + فلاتر + ترتيب + ترقيم)
   5. التخطيطات حسب الدور
   ========================================================================== */

/* ============ 1. أدوات مساعدة ============ */
const $ = (sel, root = document) => root.querySelector(sel)
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel))

const ROOT = document.body.dataset.root || '' // '' للصفحات في الجذر و '../' للصفحات داخل المجلدات
const url = (path) => ROOT + path

function esc(str) {
  return String(str ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch])
}

function icon(name, cls = '') {
  return `<svg class="icon ${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name] || ''}</svg>`
}

// يستبدل كل <i data-icon="name"></i> في الصفحة بأيقونة SVG
function renderIcons(root = document) {
  $$('[data-icon]', root).forEach((el) => {
    el.outerHTML = icon(el.dataset.icon, el.className)
  })
}

const LOCALE = 'ar-u-nu-latn' // أرقام لاتينية مع نصوص عربية
const formatDate = (iso) => new Date(iso).toLocaleDateString(LOCALE, { year: 'numeric', month: 'short', day: 'numeric' })
const formatDateTime = (iso) => new Date(iso).toLocaleString(LOCALE, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
const formatNumber = (n) => Number(n).toLocaleString(LOCALE)
const getParam = (key) => new URLSearchParams(location.search).get(key)

/* ============ 2. مكونات تُرجع HTML ============ */

function badge(text, tone = 'neutral', iconName = '', dot = false) {
  return `<span class="badge tone-${tone}">${dot ? '<span class="dot"></span>' : ''}${iconName ? icon(iconName) : ''}${esc(text)}</span>`
}

// كل حالة = لون + أيقونة + نص (لا نعتمد على اللون وحده)
const STATUS_META = {
  new: { tone: 'info', icon: 'circle-dot' },
  in_review: { tone: 'purple', icon: 'search' },
  in_progress: { tone: 'warning', icon: 'loader' },
  resolved: { tone: 'success', icon: 'circle-check' },
  closed: { tone: 'neutral', icon: 'lock' },
  rejected: { tone: 'error', icon: 'circle-x' },
}
const PRIORITY_TONE = { low: 'neutral', medium: 'info', high: 'warning', urgent: 'error' }
const STATUS_COLOR = { new: '#2563eb', in_review: '#7c3aed', in_progress: '#d97706', resolved: '#16a34a', closed: '#64748b', rejected: '#dc2626' }

const statusBadge = (s) => badge(statusLabels[s], STATUS_META[s].tone, STATUS_META[s].icon)
const priorityBadge = (p) => badge(priorityLabels[p], PRIORITY_TONE[p], '', true)
const overdueBadge = () => badge('متأخر', 'error', 'triangle-alert')

function avatar(name, size = '') {
  const initials = name.replace(/^(م\.|أ\.)\s*/, '').split(' ').slice(0, 2).map((p) => p[0]).join(' ')
  return `<span class="avatar ${size}" aria-hidden="true">${esc(initials)}</span>`
}

function stars(value, size = '') {
  let html = `<span class="stars ${size}" aria-label="${value} من 5">`
  for (let i = 1; i <= 5; i++) html += icon('star', i <= Math.round(value) ? 'on' : '')
  return html + '</span>'
}

const progress = (value, tone = '') => `<div class="progress ${tone}"><span style="width:${Math.min(100, value)}%"></span></div>`

const photo = (seed = 0, label = '', cls = '') => `<div class="photo photo-${seed % 4} ${cls}">${icon('image')}${label ? `<span>${esc(label)}</span>` : ''}</div>`

function statCard({ label, value, icon: ic, accent = 'primary', trend, hint, cls = '' }) {
  let foot = ''
  if (trend || hint) {
    const good = trend && (trend.good ?? trend.up)
    foot = `<div class="stat-foot">${trend ? `<span class="trend ${good ? 'good' : 'bad'}">${icon(trend.up ? 'trending-up' : 'trending-down')}${esc(trend.value)}</span>` : ''}${hint ? `<span>${esc(hint)}</span>` : ''}</div>`
  }
  return `<div class="card stat ${cls}">
    <div class="stat-top">
      <div class="flex-1"><p class="stat-label">${esc(label)}</p><p class="stat-value">${value}</p></div>
      <span class="icon-box box-${accent}">${icon(ic)}</span>
    </div>${foot}</div>`
}

const ALERT_ICON = { info: 'info', success: 'circle-check', warning: 'triangle-alert', error: 'circle-x', gold: 'star' }
const alertBox = (tone, title, body = '', ic = ALERT_ICON[tone]) =>
  `<div class="alert alert-${tone}" role="status">${icon(ic)}<div>${title ? `<p class="alert-title">${title}</p>` : ''}${body ? `<div class="alert-body">${body}</div>` : ''}</div></div>`

const empty = (ic, title, desc = '', action = '') =>
  `<div class="empty"><span class="icon-box lg round">${icon(ic)}</span><h3>${esc(title)}</h3>${desc ? `<p>${esc(desc)}</p>` : ''}${action}</div>`

const TIMELINE_META = {
  new: ['circle-dot', 'info'],
  in_review: ['search', 'purple'],
  assigned: ['user-cog', 'primary'],
  in_progress: ['loader', 'warning'],
  resolved: ['circle-check', 'success'],
  closed: ['lock', 'neutral'],
  rejected: ['circle-x', 'error'],
  comment: ['message-square', 'neutral'],
}
function timeline(events) {
  return `<ol class="timeline">${[...events]
    .reverse()
    .map((e) => {
      const [ic, tone] = TIMELINE_META[e.status]
      return `<li>
        <span class="tl-icon tone-${tone}">${icon(ic)}</span>
        <div class="flex-1">
          <div class="tl-head"><p class="tl-title">${esc(e.title)}</p><time>${formatDateTime(e.at)}</time></div>
          ${e.note ? `<p class="tl-note">${esc(e.note)}</p>` : ''}
          <p class="tl-by">بواسطة: ${esc(e.by)}</p>
        </div></li>`
    })
    .join('')}</ol>`
}

// مؤشر مراحل مبسط للمواطن
function stepper(status) {
  const steps = [['new', 'تم الاستلام'], ['in_review', 'المراجعة'], ['in_progress', 'المعالجة'], ['resolved', 'تم الحل'], ['closed', 'مغلق']]
  const idx = status === 'rejected' ? 1 : steps.findIndex((s) => s[0] === status)
  return `<ol class="stepper">${steps
    .map(([, label], i) => {
      const done = i <= idx
      const current = i === idx
      return `<li class="${done ? 'done' : ''} ${current ? 'current' : ''}"><span class="dot">${done && !current ? icon('check') : i + 1}</span><span class="lbl">${label}</span></li>`
    })
    .join('')}</ol>`
}

// بطاقة بلاغ مختصرة للمواطن
function complaintCard(c, href) {
  const cat = getCategory(c.categoryId)
  return `<a class="c-card" href="${href}">
    <span class="icon-box">${icon(cat.icon)}</span>
    <div class="flex-1">
      <div class="title-row"><p class="truncate">${esc(c.title)}</p>${statusBadge(c.status)}</div>
      <div class="meta">
        <span class="num">${c.number}</span>
        <span>${icon('map-pin')}${esc(getDistrict(c.districtId).name)}</span>
        <span>${icon('calendar-days')}${formatDate(c.createdAt)}</span>
      </div>
    </div>${icon('chevron-left')}</a>`
}

// محادثة البلاغ — المواطن لا يرى الملاحظات الداخلية
function comments(list, viewer, allowInternal = false) {
  const visible = viewer === 'citizen' ? list.filter((c) => !c.internal) : list
  const items = visible
    .map((c) => {
      const mine = viewer === 'citizen' ? c.role === 'citizen' : c.role !== 'citizen'
      return `<li class="${mine ? 'mine' : ''}">${avatar(c.author, 'sm')}
        <div class="c-wrap">
          <div class="c-meta"><b>${esc(c.author)}</b>${c.internal ? badge('ملاحظة داخلية', 'gold', 'lock') : ''}<span>${formatDateTime(c.at)}</span></div>
          <p class="bubble ${c.internal ? 'internal' : ''}">${esc(c.body)}</p>
        </div></li>`
    })
    .join('')
  return `<ul class="comments">${items}</ul>
    <form class="composer" data-composer>
      <textarea class="textarea" placeholder="اكتب تعليقك..." required></textarea>
      <div class="flex items-center justify-between wrap gap-2 mt-2">
        ${allowInternal ? '<label class="check"><input type="checkbox" data-internal> ملاحظة داخلية (لا تظهر للمواطن)</label>' : '<span></span>'}
        <button class="btn btn-primary btn-sm" type="submit">${icon('send')}إرسال</button>
      </div>
    </form>`
}

// تفعيل نموذج التعليق (يضيف التعليق للواجهة فقط — بدون حفظ)
function bindComposer(root, viewer) {
  const form = $('[data-composer]', root)
  if (!form) return
  const ta = $('textarea', form)
  const internal = $('[data-internal]', form)
  if (internal) internal.addEventListener('change', () => (ta.placeholder = internal.checked ? 'اكتب ملاحظة داخلية (لا تظهر للمواطن)...' : 'اكتب تعليقك...'))
  form.addEventListener('submit', (e) => {
    e.preventDefault()
    const text = ta.value.trim()
    if (!text) return
    const isInternal = internal?.checked
    const author = viewer === 'citizen' ? 'عبدالله محمود' : 'أحمد سعيد'
    $('.comments', root).insertAdjacentHTML(
      'beforeend',
      `<li class="mine">${avatar(author, 'sm')}<div class="c-wrap"><div class="c-meta"><b>${author}</b>${isInternal ? badge('ملاحظة داخلية', 'gold', 'lock') : ''}<span>الآن</span></div><p class="bubble ${isInternal ? 'internal' : ''}">${esc(text)}</p></div></li>`,
    )
    ta.value = ''
    toast('تم إرسال التعليق')
  })
}

/* ============ 3. مكونات تفاعلية ============ */

function toast(message) {
  $('.toast')?.remove()
  const el = document.createElement('div')
  el.className = 'toast'
  el.setAttribute('role', 'status')
  el.innerHTML = icon('circle-check') + esc(message)
  document.body.appendChild(el)
  setTimeout(() => el.remove(), 2600)
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
  el.close = close
  return el
}

// إظهار / إخفاء كلمة المرور لكل حقل type=password داخل .input-wrap
function initPasswordToggles(root = document) {
  $$('.input-wrap input[type="password"]', root).forEach((input) => {
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

// منطقة رفع الصور: <div data-upload data-max="5" data-label="..."></div> — معاينة محلية فقط
function initUploads(root = document) {
  $$('[data-upload]', root).forEach((box) => {
    const max = Number(box.dataset.max || 5)
    const compact = box.hasAttribute('data-compact')
    box.innerHTML = `<button type="button" class="upload-zone ${compact ? 'compact' : ''}">
        <span class="icon-box">${icon('image-plus')}</span>
        <span class="text-sm fw-500">${esc(box.dataset.label || 'اسحب الصور هنا أو اضغط للاختيار')}</span>
        <span class="text-xs c-3">PNG أو JPG — حتى ${max} صور، بحد أقصى 5MB للصورة</span>
      </button>
      <input type="file" accept="image/*" multiple hidden>
      <div class="previews"></div>`
    const zone = $('.upload-zone', box)
    const input = $('input', box)
    const previews = $('.previews', box)
    const add = (files) => {
      Array.from(files)
        .filter((f) => f.type.startsWith('image/'))
        .forEach((f) => {
          if (previews.children.length >= max) return
          const item = document.createElement('div')
          item.className = 'preview'
          item.innerHTML = `<img alt=""><button type="button" aria-label="حذف الصورة">${icon('x')}</button>`
          $('img', item).src = URL.createObjectURL(f)
          $('button', item).addEventListener('click', () => item.remove())
          previews.appendChild(item)
        })
    }
    zone.addEventListener('click', () => input.click())
    input.addEventListener('change', () => add(input.files))
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

/* ============ 4. جدول البلاغات ============ */
// createComplaintsTable(container, { data, basePath, pageSize, showFilters, showAssignee, showTabs })
function createComplaintsTable(container, opts) {
  const o = { pageSize: 10, showFilters: true, showAssignee: true, showTabs: true, ...opts }
  const state = { q: '', tab: 'all', cat: '', dist: '', prio: '', assignee: '', sortKey: 'createdAt', sortDir: -1, page: 1, filtersOpen: false }
  const rank = { low: 0, medium: 1, high: 2, urgent: 3 }
  const count = (fn) => o.data.filter(fn).length
  const options = (list, all) => `<option value="">${all}</option>` + list.map(([v, l]) => `<option value="${v}">${esc(l)}</option>`).join('')

  container.classList.add('card', 'card-clip')
  container.innerHTML = `
    ${o.showFilters ? `<div class="table-toolbar">
      ${o.showTabs ? `<div class="tabs" role="tablist">${[
        ['all', 'الكل', o.data.length],
        ['new', 'جديد', count((c) => c.status === 'new')],
        ['in_progress', 'قيد المعالجة', count((c) => c.status === 'in_progress')],
        ['overdue', 'متأخرة', count((c) => c.overdue)],
        ['resolved', 'تم الحل', count((c) => c.status === 'resolved')],
        ['closed', 'مغلقة', count((c) => c.status === 'closed')],
      ].map(([id, l, n]) => `<button class="tab ${id === 'all' ? 'active' : ''}" data-t="${id}">${l}<span class="count">${n}</span></button>`).join('')}</div>` : ''}
      <div class="flex gap-2">
        <div class="search">${icon('search')}<input class="input" data-f="q" placeholder="ابحث برقم البلاغ أو العنوان أو الموقع..."></div>
        <button class="btn btn-outline filters-toggle" type="button">${icon('list-filter')}<span class="hidden sm-inline">الفلاتر</span><span class="count-pill hidden" data-active-count></span></button>
      </div>
      <div class="filters">
        <select class="select" data-f="cat" aria-label="النوع">${options(categories.map((c) => [c.id, c.name]), 'كل الأنواع')}</select>
        <select class="select" data-f="dist" aria-label="المنطقة">${options(districts.map((d) => [d.id, d.name]), 'كل المناطق')}</select>
        <select class="select" data-f="prio" aria-label="الأولوية">${options(Object.entries(priorityLabels), 'كل الأولويات')}</select>
        ${o.showAssignee ? `<select class="select" data-f="assignee" aria-label="الموظف">${options(employeesList.map((e) => [e, e]), 'كل الموظفين')}</select>` : '<span></span>'}
        <button class="btn btn-ghost" type="button" data-reset>${icon('x')}مسح الفلاتر</button>
      </div>
    </div>` : ''}
    <div data-results></div>`

  const results = $('[data-results]', container)

  function filtered() {
    return o.data
      .filter((c) => {
        if (state.tab === 'overdue' ? !c.overdue : state.tab !== 'all' && c.status !== state.tab) return false
        if (state.cat && c.categoryId !== state.cat) return false
        if (state.dist && c.districtId !== state.dist) return false
        if (state.prio && c.priority !== state.prio) return false
        if (state.assignee && c.assignee !== state.assignee) return false
        if (state.q && !`${c.number} ${c.title} ${c.address}`.toLowerCase().includes(state.q.trim().toLowerCase())) return false
        return true
      })
      .sort((a, b) => {
        const v = state.sortKey === 'priority' ? rank[a.priority] - rank[b.priority] : state.sortKey === 'number' ? a.number.localeCompare(b.number) : a.createdAt.localeCompare(b.createdAt)
        return v * state.sortDir
      })
  }

  const sortBtn = (key, label) => `<button class="sort-btn ${state.sortKey === key ? 'active' : ''}" data-sort="${key}">${label}${icon('arrow-up-down')}</button>`
  const href = (c) => `${o.basePath}?id=${c.id}`

  function render() {
    const list = filtered()
    const pages = Math.max(1, Math.ceil(list.length / o.pageSize))
    state.page = Math.min(state.page, pages)
    const rows = list.slice((state.page - 1) * o.pageSize, state.page * o.pageSize)
    const active = [state.cat, state.dist, state.prio, state.assignee].filter(Boolean).length
    const pill = $('[data-active-count]', container)
    if (pill) {
      pill.textContent = active
      pill.classList.toggle('hidden', !active)
    }

    if (!rows.length) {
      results.innerHTML = empty('inbox', 'لا توجد بلاغات مطابقة', 'جرّب تغيير كلمات البحث أو إزالة بعض الفلاتر.', `<button class="btn btn-outline" data-reset>مسح الفلاتر</button>`)
      return
    }

    results.innerHTML = `
      <div class="table-wrap table-desktop">
        <table class="table">
          <thead><tr>
            <th>${sortBtn('number', 'رقم البلاغ')}</th><th>النوع</th><th>المنطقة</th>
            <th>${sortBtn('priority', 'الأولوية')}</th><th>الحالة</th><th>${sortBtn('createdAt', 'تاريخ البلاغ')}</th>
            ${o.showAssignee ? '<th>الموظف المسؤول</th>' : ''}<th></th>
          </tr></thead>
          <tbody>${rows
            .map(
              (c) => `<tr class="clickable" data-href="${href(c)}">
              <td><a href="${href(c)}" class="strong num nowrap">${c.number}</a><p class="text-xs c-3 truncate" style="max-width:210px">${esc(c.title)}</p></td>
              <td>${esc(getCategory(c.categoryId).name)}</td>
              <td class="nowrap">${esc(getDistrict(c.districtId).name)}</td>
              <td>${priorityBadge(c.priority)}</td>
              <td><div class="flex wrap gap-1">${statusBadge(c.status)}${c.overdue ? overdueBadge() : ''}</div></td>
              <td class="nowrap">${formatDate(c.createdAt)}</td>
              ${o.showAssignee ? `<td>${c.assignee ? `<span class="flex items-center gap-2 nowrap">${avatar(c.assignee, 'sm')}${esc(c.assignee)}</span>` : '<span class="c-3">غير محدد</span>'}</td>` : ''}
              <td class="c-3">${icon('chevron-left')}</td>
            </tr>`,
            )
            .join('')}</tbody>
        </table>
      </div>
      <ul class="mobile-list for-table">${rows
        .map(
          (c) => `<li><a class="mobile-item" href="${href(c)}">
            <div class="flex justify-between items-start gap-2">
              <div class="flex-1"><p class="text-xs c-3 fw-600 num">${c.number}</p><p class="fw-600 truncate">${esc(c.title)}</p></div>
              ${statusBadge(c.status)}
            </div>
            <p class="flex items-center gap-1 text-xs c-2 mt-2">${icon('map-pin')}${esc(getDistrict(c.districtId).name)} · ${esc(getCategory(c.categoryId).name)}</p>
            <div class="flex wrap items-center gap-2 text-xs c-3 mt-2">${priorityBadge(c.priority)}${c.overdue ? overdueBadge() : ''}<span class="ms-auto">${formatDate(c.createdAt)}</span></div>
          </a></li>`,
        )
        .join('')}</ul>
      <div class="pagination">
        <span>إجمالي <b class="c-ink">${list.length}</b> نتيجة</span>
        <div class="pages">
          <button data-page="${state.page - 1}" ${state.page === 1 ? 'disabled' : ''}>السابق</button>
          ${Array.from({ length: pages }, (_, i) => `<button class="pg ${i + 1 === state.page ? 'active' : ''}" data-page="${i + 1}">${i + 1}</button>`).join('')}
          <span class="pg-info">${state.page} / ${pages}</span>
          <button data-page="${state.page + 1}" ${state.page === pages ? 'disabled' : ''}>التالي</button>
        </div>
      </div>`
  }

  // الأحداث
  container.addEventListener('input', (e) => {
    const f = e.target.dataset.f
    if (!f) return
    state[f] = e.target.value
    state.page = 1
    render()
  })
  container.addEventListener('click', (e) => {
    const t = e.target
    const tab = t.closest('[data-t]')
    if (tab) {
      state.tab = tab.dataset.t
      state.page = 1
      $$('[data-t]', container).forEach((b) => b.classList.toggle('active', b === tab))
      return render()
    }
    const sort = t.closest('[data-sort]')
    if (sort) {
      const k = sort.dataset.sort
      state.sortDir = state.sortKey === k ? state.sortDir * -1 : -1
      state.sortKey = k
      return render()
    }
    const pg = t.closest('[data-page]')
    if (pg) {
      state.page = Number(pg.dataset.page)
      return render()
    }
    if (t.closest('[data-reset]')) {
      Object.assign(state, { q: '', cat: '', dist: '', prio: '', assignee: '', page: 1 })
      $$('[data-f]', container).forEach((el) => (el.value = ''))
      return render()
    }
    if (t.closest('.filters-toggle')) return $('.filters', container).classList.toggle('open')
    const row = t.closest('tr[data-href]')
    if (row && !t.closest('a')) location.href = row.dataset.href
  })

  render()
}

/* ============ 5. التخطيطات ============ */

const LOGO_SVG = `<svg class="brand-logo" viewBox="0 0 40 40" aria-hidden="true"><rect width="40" height="40" rx="11" fill="#0b5d51"/><path d="M10 30V18l10-7.5L30 18v12h-6.5v-7h-7v7z" fill="#fff"/><circle cx="20" cy="16.5" r="2" fill="#c8963e"/></svg>`
const brand = (href, light = false) =>
  `<a class="brand ${light ? 'light' : ''}" href="${href}">${LOGO_SVG}<span><span class="brand-name">بلدية المدينة</span><span class="brand-sub">منصة الشكاوى والخدمات</span></span></a>`

const ACTIVE = document.body.dataset.active || ''
const isActive = (key) => (key === ACTIVE ? 'active' : '')

// قائمة المستخدم + مبدّل الأدوار (عرض تجريبي فقط)
function userMenu(name, role) {
  return `<div class="dropdown">
    <button class="user-btn" data-menu-btn aria-haspopup="true">${avatar(name, 'sm')}<span class="who"><b>${name}</b><small>${role}</small></span>${icon('chevron-down')}</button>
    <div class="menu" hidden>
      <div class="menu-sec"><p class="fw-600 text-sm">${name}</p><p class="text-xs c-3">${role}</p></div>
      <div class="menu-sec"><a href="${url('citizen/profile.html')}">${icon('user-cog')}الملف الشخصي</a></div>
      <div class="menu-sec">
        <p class="menu-title">التبديل بين الأدوار (عرض تجريبي)</p>
        <a href="${url('citizen/index.html')}">${icon('user')}واجهة المواطن</a>
        <a href="${url('employee/index.html')}">${icon('briefcase')}واجهة الموظف</a>
        <a href="${url('admin/index.html')}">${icon('shield-check')}لوحة المدير</a>
      </div>
      <div class="menu-sec"><a class="danger" href="${url('auth/login.html')}">${icon('log-out')}تسجيل الخروج</a></div>
    </div></div>`
}

function drawer(inner, dark = false) {
  return `<div class="drawer ${dark ? 'dark' : ''}" data-drawer><div class="drawer-backdrop" data-drawer-close></div><div class="drawer-panel">${inner}</div></div>`
}

const footer = () => `<footer class="site-footer">
  <div class="container footer-grid">
    <div class="stack"> ${brand(url('index.html'), true)}<p class="text-sm leading-loose">منصة رقمية رسمية لاستقبال شكاوى وطلبات المواطنين ومتابعتها بشفافية حتى إغلاقها.</p></div>
    <div><h4>روابط سريعة</h4><ul><li><a href="${url('citizen/new.html')}">تقديم بلاغ</a></li><li><a href="${url('track.html')}">متابعة بلاغ</a></li><li><a href="${url('index.html#services')}">الخدمات البلدية</a></li><li><a href="${url('screens.html')}">فهرس الشاشات</a></li></ul></div>
    <div><h4>الدعم</h4><ul><li>الأسئلة الشائعة</li><li>سياسة الخصوصية</li><li>شروط الاستخدام</li><li>إمكانية الوصول</li></ul></div>
    <div><h4>تواصل معنا</h4><ul class="contact"><li>${icon('phone')}<span class="ltr">1800-000-000</span></li><li>${icon('mail')}info@municipality.example</li><li>${icon('map-pin')}مبنى البلدية — وسط البلد</li></ul></div>
  </div>
  <div class="footer-bottom"><div class="container"><p>© 2026 بلدية المدينة — جميع الحقوق محفوظة</p><p>نموذج تصميم (UI Prototype) — البيانات المعروضة تجريبية</p></div></div>
</footer>`

function layoutPublic(content) {
  const links = [['index.html', 'الرئيسية', 'home'], ['index.html#services', 'الخدمات', ''], ['index.html#how', 'كيف تعمل المنصة', ''], ['track.html', 'متابعة بلاغ', 'track']]
  document.body.classList.add('public')
  document.body.innerHTML = `
    <header class="site-header"><div class="container">
      ${brand(url('index.html'))}
      <nav class="main-nav public-nav">${links.map(([h, l, k]) => `<a href="${url(h)}" class="${k ? isActive(k) : ''}">${l}</a>`).join('')}</nav>
      <div class="header-actions">
        <a class="btn btn-ghost desktop-only" href="${url('auth/login.html')}">تسجيل الدخول</a>
        <a class="btn btn-primary desktop-only" href="${url('auth/register.html')}">إنشاء حساب</a>
        <button class="icon-btn menu-toggle" data-drawer-open aria-label="القائمة">${icon('menu')}</button>
      </div>
    </div></header>
    ${drawer(`<div class="drawer-head">${brand(url('index.html'))}<button class="icon-btn" data-drawer-close aria-label="إغلاق">${icon('x')}</button></div>
      <nav class="drawer-nav">${links.map(([h, l]) => `<a href="${url(h)}" data-drawer-close>${l}</a>`).join('')}</nav>
      <div class="drawer-foot"><a class="btn btn-outline btn-block" href="${url('auth/login.html')}">تسجيل الدخول</a><a class="btn btn-primary btn-block" href="${url('auth/register.html')}">إنشاء حساب</a></div>`)}
    <main id="content"></main>
    ${footer()}`
  $('#content').replaceWith(content)
}

function layoutAuth(content) {
  document.body.innerHTML = `<div class="auth">
    <div class="auth-main">
      ${brand(url('index.html'))}
      <div class="auth-center"><div class="auth-box" id="auth-slot"></div></div>
      <p class="text-center text-xs c-3">© 2026 بلدية المدينة</p>
    </div>
    <aside class="auth-aside">
      <div class="pattern"></div>
      <div class="blob" style="top:-96px;inset-inline-start:-96px;width:384px;height:384px;background:rgb(40 145 127 / .4)"></div>
      <div class="blob" style="bottom:-128px;inset-inline-end:-40px;width:384px;height:384px;background:rgb(200 150 62 / .2)"></div>
      <div class="content stack-lg">
        <span class="chip-soft">الخدمات البلدية الإلكترونية</span>
        <h2>بلّغ عن المشكلة في دقيقة، وتابعها حتى تُحل.</h2>
        <ul>${['تقديم البلاغ مع الصور والموقع الدقيق', 'متابعة حالة البلاغ لحظة بلحظة', 'تقييم الخدمة بعد الإغلاق'].map((t) => `<li>${icon('circle-check')}${t}</li>`).join('')}</ul>
      </div>
    </aside></div>`
  $('#auth-slot').appendChild(content)
  content.removeAttribute('id')
}

function layoutCitizen(content) {
  const nav = [['citizen/index.html', 'لوحتي', 'layout-dashboard', 'dashboard'], ['citizen/complaints.html', 'بلاغاتي', 'file-text', 'complaints'], ['citizen/notifications.html', 'الإشعارات', 'bell', 'notifications'], ['citizen/profile.html', 'حسابي', 'user', 'profile']]
  const tab = ([h, l, ic, k]) => `<a href="${url(h)}" class="${isActive(k)}">${icon(ic)}${l}</a>`
  document.body.classList.add('citizen')
  document.body.innerHTML = `
    <header class="site-header"><div class="container">
      ${brand(url('index.html'))}
      <nav class="main-nav citizen-nav">${nav.map(tab).join('')}</nav>
      <div class="header-actions">
        <a class="btn btn-primary desktop-only" href="${url('citizen/new.html')}">${icon('plus')}بلاغ جديد</a>
        <a class="icon-btn mobile-only" href="${url('citizen/notifications.html')}" aria-label="الإشعارات">${icon('bell')}<span class="ping"></span></a>
        ${userMenu('عبدالله محمود', 'مواطن')}
      </div>
    </div></header>
    <main id="content"></main>
    <div class="hidden md-show">${footer()}</div>
    <nav class="bottom-nav no-print">
      ${nav.slice(0, 2).map(tab).join('')}
      <div class="fab-wrap"><a class="fab" href="${url('citizen/new.html')}" aria-label="بلاغ جديد">${icon('plus')}</a></div>
      ${nav.slice(2).map(tab).join('')}
    </nav>`
  content.classList.add('container', 'citizen-main')
  $('#content').replaceWith(content)
}

function layoutDashboard(content, role) {
  const groups =
    role === 'admin'
      ? [
          { items: [['admin/index.html', 'الرئيسية', 'layout-dashboard', 'dashboard'], ['admin/complaints.html', 'جميع البلاغات', 'clipboard-list', 'complaints', 87]] },
          {
            title: 'التحليل والذكاء',
            items: [
              ['admin/map.html', 'خريطة البلاغات', 'map', 'map'],
              ['admin/recurring.html', 'المشاكل المتكررة', 'repeat', 'recurring'],
              ['admin/weather.html', 'الاستعداد للحالات الجوية', 'cloud-rain-wind', 'weather'],
              ['admin/reports.html', 'التقارير الشهرية', 'file-chart-column', 'reports'],
              ['admin/satisfaction.html', 'رضا المواطنين', 'face-slightly-smiling', 'satisfaction'],
            ],
          },
          {
            title: 'إدارة النظام',
            items: [
              ['admin/users.html', 'المستخدمون', 'users', 'users'],
              ['admin/employees.html', 'الموظفون', 'briefcase', 'employees'],
              ['admin/departments.html', 'الأقسام', 'layers', 'departments'],
              ['admin/categories.html', 'أنواع المشاكل', 'tags', 'categories'],
              ['admin/districts.html', 'المناطق', 'map-pinned', 'districts'],
              ['admin/keywords.html', 'الكلمات المفتاحية', 'key-round', 'keywords'],
              ['admin/settings.html', 'إعدادات النظام', 'settings', 'settings'],
            ],
          },
        ]
      : [{ items: [['employee/index.html', 'لوحة التحكم', 'layout-dashboard', 'dashboard'], ['employee/complaints.html', 'البلاغات', 'clipboard-list', 'complaints', 12], ['employee/map.html', 'خريطة البلاغات', 'map', 'map']] }]

  const home = url(`${role}/index.html`)
  const sidebar = (closeBtn) => `<div class="sidebar">
    <div class="sidebar-head">${brand(home, true)}${closeBtn ? `<button class="icon-btn" data-drawer-close aria-label="إغلاق">${icon('x')}</button>` : ''}</div>
    <div class="sidebar-tag">${role === 'admin' ? 'لوحة مدير البلدية' : 'بوابة موظف البلدية — قسم الطرق'}</div>
    <nav class="sidebar-nav">${groups
      .map(
        (g) => `<div class="nav-group">${g.title ? `<p class="nav-group-title">${g.title}</p>` : ''}${g.items
          .map(([h, l, ic, k, n]) => `<a class="nav-link ${isActive(k)}" href="${url(h)}">${icon(ic)}<span class="label-txt">${l}</span>${n ? `<span class="nav-badge">${n}</span>` : ''}</a>`)
          .join('')}</div>`,
      )
      .join('')}</nav>
    <div class="sidebar-foot">الإصدار 1.0 — نموذج تصميم</div></div>`

  const [name, roleName] = role === 'admin' ? ['م. خالد العمري', 'مدير البلدية'] : ['أحمد سعيد', 'موظف — قسم الطرق']
  document.body.innerHTML = `<div class="app">
    <aside class="sidebar-desktop">${sidebar(false)}</aside>
    ${drawer(sidebar(true), true)}
    <div class="col" style="min-width:0">
      <header class="topbar">
        <button class="icon-btn menu-toggle" data-drawer-open aria-label="القائمة">${icon('menu')}</button>
        <div class="search">${icon('search')}<input class="input" placeholder="بحث سريع برقم البلاغ..."></div>
        <div class="topbar-actions">
          <button class="icon-btn search-trigger" aria-label="بحث">${icon('search')}</button>
          <button class="icon-btn" aria-label="الإشعارات">${icon('bell')}<span class="ping"></span></button>
          ${userMenu(name, roleName)}
        </div>
      </header>
      <main id="content"></main>
    </div></div>`
  content.classList.add('app-main')
  $('#content').replaceWith(content)
}

// أحداث عامة: فتح/إغلاق الـ Drawer وقائمة المستخدم
function bindShell() {
  document.addEventListener('click', (e) => {
    const dr = $('[data-drawer]')
    if (e.target.closest('[data-drawer-open]')) dr?.classList.add('open')
    else if (e.target.closest('[data-drawer-close]')) dr?.classList.remove('open')

    const btn = e.target.closest('[data-menu-btn]')
    $$('.menu').forEach((m) => {
      if (btn && m.previousElementSibling === btn) m.hidden = !m.hidden
      else if (!e.target.closest('.menu')) m.hidden = true
    })
  })
  // أزرار عامة: data-toast="رسالة" تعرض إشعاراً، data-print يطبع الصفحة
  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-toast]')
    if (t) toast(t.dataset.toast)
    if (e.target.closest('[data-print]')) window.print()
  })
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      $('[data-drawer]')?.classList.remove('open')
      $$('.menu').forEach((m) => (m.hidden = true))
    }
  })
}

// تركيب التخطيط حسب <body data-layout="...">
;(function mountLayout() {
  const content = $('#content')
  const layout = document.body.dataset.layout
  if (content) {
    if (layout === 'public') layoutPublic(content)
    else if (layout === 'auth') layoutAuth(content)
    else if (layout === 'citizen') layoutCitizen(content)
    else if (layout === 'employee' || layout === 'admin') layoutDashboard(content, layout)
  }
  renderIcons()
  initPasswordToggles()
  initUploads()
  initTabs()
  bindShell()
})()
