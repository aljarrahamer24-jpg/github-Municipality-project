/* ==========================================================================
   complaints-table.js — جدول البلاغات: بحث + تبويبات + فلاتر + ترتيب + ترقيم
   كل الفلترة والترتيب تتم في قاعدة البيانات (Supabase) وليس في المتصفح.
   --------------------------------------------------------------------------
   createComplaintsTable(el, {
     basePath: 'complaint.html',   رابط صفحة التفاصيل
     pageSize, showFilters, showTabs, showAssignee,
     fixed: { ids, departmentId ... }  فلاتر ثابتة (مثل البلاغات المرتبطة)
     initialSearch
   })
   ========================================================================== */

function createComplaintsTable(container, opts = {}) {
  const o = { basePath: 'complaint.html', pageSize: 10, showFilters: true, showAssignee: true, showTabs: true, fixed: {}, ...opts }
  const state = { q: o.initialSearch || '', tab: 'all', cat: '', area: '', prio: '', assignee: '', sort: 'created_at', asc: false, page: 1, reqId: 0 }

  const TABS = [
    ['all', 'الكل', 'total'],
    ['new', 'جديد', 'new'],
    ['in_progress', 'قيد المعالجة', 'in_progress'],
    ['overdue', 'متأخرة', 'overdue'],
    ['resolved', 'تم الحل', 'resolved'],
    ['closed', 'مغلقة', 'closed'],
  ]
  const tabFilter = {
    all: {},
    new: { statuses: ['new', 'under_review'] },
    in_progress: { statuses: ['assigned', 'in_progress'] },
    overdue: { overdue: true },
    resolved: { status: 'resolved' },
    closed: { status: 'closed' },
  }

  container.classList.add('card', 'card-clip')
  container.innerHTML = `
    ${o.showFilters ? `<div class="table-toolbar">
      ${o.showTabs ? `<div class="tabs" role="tablist">${TABS.map(([id, l, k]) => `<button class="tab ${id === 'all' ? 'active' : ''}" data-t="${id}">${l}<span class="count" data-count="${k}">…</span></button>`).join('')}</div>` : ''}
      <div class="flex gap-2">
        <div class="search">${icon('search')}<input class="input" data-f="q" value="${esc(state.q)}" placeholder="ابحث برقم البلاغ أو العنوان أو الموقع..."></div>
        <button class="btn btn-outline filters-toggle" type="button">${icon('list-filter')}<span class="hidden sm-inline">الفلاتر</span><span class="count-pill hidden" data-active-count></span></button>
      </div>
      <div class="filters">
        <select class="select" data-f="cat" aria-label="النوع"><option value="">كل الأنواع</option></select>
        <select class="select" data-f="area" aria-label="المنطقة"><option value="">كل المناطق</option></select>
        <select class="select" data-f="prio" aria-label="الأولوية"></select>
        ${o.showAssignee ? `<select class="select" data-f="assignee" aria-label="الموظف"><option value="">كل الموظفين</option></select>` : '<span></span>'}
        <button class="btn btn-ghost" type="button" data-reset>${icon('x')}مسح الفلاتر</button>
      </div>
    </div>` : ''}
    <div data-results></div>`

  const results = $('[data-results]', container)

  // تعبئة الفلاتر من قاعدة البيانات
  if (o.showFilters) {
    fillSelect($('[data-f="prio"]', container), Object.entries(PRIORITY_LABELS), { placeholder: 'كل الأولويات' })
    API.categories({ activeOnly: false }).then((l) => fillSelect($('[data-f="cat"]', container), l.map((c) => [c.id, c.name]), { placeholder: 'كل الأنواع' })).catch(() => {})
    API.areas().then((l) => fillSelect($('[data-f="area"]', container), l.map((a) => [a.id, a.name]), { placeholder: 'كل المناطق' })).catch(() => {})
    if (o.showAssignee) API.staff().then((l) => fillSelect($('[data-f="assignee"]', container), l.map((e) => [e.id, e.full_name || '—']), { placeholder: 'كل الموظفين' })).catch(() => {})
    if (o.showTabs) {
      API.stats()
        .then((s) => $$('[data-count]', container).forEach((el) => (el.textContent = s[el.dataset.count] ?? 0)))
        .catch(() => $$('[data-count]', container).forEach((el) => (el.textContent = '')))
    }
  }

  const sortBtn = (key, label) => `<button class="sort-btn ${state.sort === key ? 'active' : ''}" data-sort="${key}">${label}${icon('arrow-up-down')}</button>`
  const href = (c) => `${o.basePath}?id=${c.id}`

  async function render() {
    const reqId = ++state.reqId
    const active = [state.cat, state.area, state.prio, state.assignee].filter(Boolean).length
    const pill = $('[data-active-count]', container)
    if (pill) {
      pill.textContent = active
      pill.classList.toggle('hidden', !active)
    }
    results.innerHTML = loadingBlock()
    let data
    try {
      data = await API.complaints({
        ...tabFilter[state.tab],
        ...o.fixed,
        search: state.q,
        categoryId: state.cat,
        areaId: state.area,
        priority: state.prio,
        assigneeId: state.assignee,
        sort: state.sort,
        asc: state.asc,
        page: state.page,
        pageSize: o.pageSize,
      })
    } catch (err) {
      if (reqId === state.reqId) showError(results, err, render)
      return
    }
    if (reqId !== state.reqId) return // نتيجة قديمة (المستخدم غيّر الفلتر)

    const { rows, count } = data
    const pages = Math.max(1, Math.ceil(count / o.pageSize))
    if (!rows.length) {
      const filtered = state.q || active || state.tab !== 'all'
      results.innerHTML = filtered
        ? empty('inbox', 'لا توجد بلاغات مطابقة', 'جرّب تغيير كلمات البحث أو إزالة بعض الفلاتر.', `<button class="btn btn-outline" data-reset>مسح الفلاتر</button>`)
        : empty('inbox', 'لا توجد بلاغات بعد', 'ستظهر البلاغات هنا فور وصولها.')
      return
    }

    results.innerHTML = `
      <div class="table-wrap table-desktop">
        <table class="table">
          <thead><tr>
            <th>${sortBtn('complaint_number', 'رقم البلاغ')}</th><th>النوع</th><th>المنطقة</th>
            <th>${sortBtn('priority', 'الأولوية')}</th><th>${sortBtn('status', 'الحالة')}</th><th>${sortBtn('created_at', 'تاريخ البلاغ')}</th>
            ${o.showAssignee ? '<th>الموظف المسؤول</th>' : ''}<th></th>
          </tr></thead>
          <tbody>${rows
            .map(
              (c) => `<tr class="clickable" data-href="${href(c)}">
              <td><a href="${href(c)}" class="strong num nowrap">${esc(c.complaint_number)}</a><p class="text-xs c-3 truncate" style="max-width:210px">${esc(c.title)}</p></td>
              <td>${esc(c.category?.name || '—')}</td>
              <td class="nowrap">${esc(c.area?.name || '—')}</td>
              <td>${priorityBadge(c.priority)}</td>
              <td><div class="flex wrap gap-1">${statusBadge(c.status)}${isOverdue(c) ? overdueBadge() : ''}</div></td>
              <td class="nowrap">${formatDate(c.created_at)}</td>
              ${o.showAssignee ? `<td>${c.assignee ? `<span class="flex items-center gap-2 nowrap">${avatar(c.assignee.full_name, 'sm')}${esc(c.assignee.full_name)}</span>` : '<span class="c-3">غير محدد</span>'}</td>` : ''}
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
              <div class="flex-1"><p class="text-xs c-3 fw-600 num">${esc(c.complaint_number)}</p><p class="fw-600 truncate">${esc(c.title)}</p></div>
              ${statusBadge(c.status)}
            </div>
            <p class="flex items-center gap-1 text-xs c-2 mt-2">${icon('map-pin')}${esc(c.area?.name || '—')} · ${esc(c.category?.name || '')}</p>
            <div class="flex wrap items-center gap-2 text-xs c-3 mt-2">${priorityBadge(c.priority)}${isOverdue(c) ? overdueBadge() : ''}<span class="ms-auto">${formatDate(c.created_at)}</span></div>
          </a></li>`,
        )
        .join('')}</ul>
      <div class="pagination">
        <span>إجمالي <b class="c-ink">${formatNumber(count)}</b> نتيجة</span>
        <div class="pages">
          <button data-page="${state.page - 1}" ${state.page === 1 ? 'disabled' : ''}>السابق</button>
          ${pageButtons(state.page, pages)}
          <span class="pg-info">${state.page} / ${pages}</span>
          <button data-page="${state.page + 1}" ${state.page === pages ? 'disabled' : ''}>التالي</button>
        </div>
      </div>`
  }

  // أزرار الصفحات مع اختصار عند كثرتها: 1 … 4 5 6 … 20
  function pageButtons(cur, total) {
    const set = new Set([1, total, cur - 1, cur, cur + 1].filter((p) => p >= 1 && p <= total))
    const list = [...set].sort((a, b) => a - b)
    let html = ''
    list.forEach((p, i) => {
      if (i && p - list[i - 1] > 1) html += '<span class="pg">…</span>'
      html += `<button class="pg ${p === cur ? 'active' : ''}" data-page="${p}">${p}</button>`
    })
    return html
  }

  const searchLater = debounce(() => {
    state.page = 1
    render()
  }, 350)

  container.addEventListener('input', (e) => {
    const f = e.target.dataset.f
    if (!f) return
    if (f === 'q') {
      state.q = e.target.value
      return searchLater()
    }
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
      state.asc = state.sort === k ? !state.asc : false
      state.sort = k
      return render()
    }
    const pg = t.closest('[data-page]')
    if (pg) {
      state.page = Number(pg.dataset.page)
      return render()
    }
    if (t.closest('[data-reset]')) {
      Object.assign(state, { q: '', cat: '', area: '', prio: '', assignee: '', page: 1 })
      $$('[data-f]', container).forEach((el) => (el.value = ''))
      return render()
    }
    if (t.closest('.filters-toggle')) return $('.filters', container).classList.toggle('open')
    const row = t.closest('tr[data-href]')
    if (row && !t.closest('a')) location.href = row.dataset.href
  })

  render()
  return { reload: render }
}
