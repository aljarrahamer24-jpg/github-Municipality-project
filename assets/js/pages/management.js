/* ==========================================================================
   إدارة النظام — جدول عام (CRUD) يخدم 6 صفحات:
   المستخدمون، الموظفون، الأقسام، أنواع المشاكل، المناطق، الكلمات المفتاحية.
   الصفحة تحدد نوعها عبر <main id="content" data-entity="users">
   الإضافة/التعديل/الحذف تتم على الواجهة فقط (بدون حفظ في قاعدة بيانات).
   ========================================================================== */
;(() => {
  /* ---- أدوات لبناء الحقول داخل النافذة ---- */
  const input = (label, name, value = '', attrs = '') =>
    `<div class="field"><label class="label">${label}</label><input class="input" name="${name}" value="${esc(value)}" ${attrs}></div>`
  const select = (label, name, options, value = '') =>
    `<div class="field"><label class="label">${label}</label><select class="select" name="${name}">${options.map(([v, l]) => `<option value="${v}" ${v === value ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select></div>`
  const toggle = (label, name, on = true) => `<label class="switch"><input type="checkbox" name="${name}" ${on ? 'checked' : ''}><span class="track"></span>${label}</label>`
  const two = (...fields) => `<div class="grid sm-cols-2">${fields.join('')}</div>`

  const deptOptions = departments.map((d) => [d.id, d.name])
  const person = (u) => `<span class="flex items-center gap-3">${avatar(u.name, 'sm')}<span style="min-width:0"><span class="strong" style="display:block">${esc(u.name)}</span><span class="text-xs c-3 truncate" style="display:block">${esc(u.email)}</span></span></span>`
  const userStatus = (u) => badge(u.status === 'active' ? 'نشط' : 'موقوف', u.status === 'active' ? 'success' : 'error', '', true)
  const active = (on) => badge(on ? 'مفعّل' : 'معطّل', on ? 'success' : 'neutral', '', true)
  const RISK = { high: ['error', 'عالية'], medium: ['warning', 'متوسطة'], low: ['success', 'منخفضة'] }
  const SENT = { positive: ['success', 'إيجابية'], negative: ['error', 'سلبية'], neutral: ['neutral', 'محايدة'] }

  /* ---- إعداد كل نوع ---- */
  const CONFIG = {
    users: {
      entity: 'مستخدم',
      rows: users,
      search: (u) => `${u.name} ${u.email} ${u.phone}`,
      columns: [
        ['المستخدم', person],
        ['الهاتف', (u) => `<span class="ltr">${u.phone}</span>`],
        ['البلاغات', (u) => u.complaints],
        ['تاريخ التسجيل', (u) => formatDate(u.createdAt)],
        ['الحالة', userStatus],
      ],
      form: (u) =>
        input('الاسم الكامل', 'name', u?.name) + two(input('البريد الإلكتروني', 'email', u?.email), input('الهاتف', 'phone', u?.phone, 'dir="ltr"')) + toggle('الحساب نشط', 'status', u?.status !== 'suspended'),
    },
    employees: {
      entity: 'موظف',
      rows: employees,
      search: (u) => `${u.name} ${u.email}`,
      filter: { label: 'كل الأقسام', options: deptOptions, match: (u, v) => u.departmentId === v },
      columns: [
        ['الموظف', person],
        ['القسم', (u) => esc(getDepartment(u.departmentId).name)],
        ['الصلاحية', (u) => (u.role === 'admin' ? badge('مشرف', 'gold') : badge('موظف', 'primary'))],
        ['البلاغات المسندة', (u) => u.complaints],
        ['الحالة', userStatus],
      ],
      form: (u) =>
        input('الاسم الكامل', 'name', u?.name) +
        two(
          input('البريد الإلكتروني', 'email', u?.email),
          input('الهاتف', 'phone', u?.phone, 'dir="ltr"'),
          select('القسم', 'departmentId', deptOptions, u?.departmentId),
          select('الصلاحية', 'role', [['employee', 'موظف'], ['admin', 'مشرف قسم']], u?.role),
        ) +
        toggle('الحساب نشط', 'status', u?.status !== 'suspended'),
    },
    departments: {
      entity: 'قسم',
      rows: departments,
      search: (d) => `${d.name} ${d.head}`,
      columns: [
        ['القسم', (d) => `<span class="strong">${esc(d.name)}</span>`],
        ['رئيس القسم', (d) => esc(d.head)],
        ['عدد الموظفين', (d) => d.employees],
        ['أنواع المشاكل', (d) => categories.filter((c) => c.departmentId === d.id).length],
        ['الحالة', (d) => active(d.active)],
      ],
      form: (d) => input('اسم القسم', 'name', d?.name) + input('رئيس القسم', 'head', d?.head) + input('البريد الإلكتروني للقسم', 'email', '', 'placeholder="dept@municipality.example"') + toggle('مفعّل', 'active', d?.active ?? true),
    },
    categories: {
      entity: 'نوع مشكلة',
      rows: categories,
      search: (c) => c.name,
      columns: [
        ['النوع', (c) => `<span class="flex items-center gap-3 strong"><span class="icon-box sm">${icon(c.icon)}</span>${esc(c.name)}</span>`],
        ['القسم المسؤول', (c) => esc(getDepartment(c.departmentId).name)],
        ['مدة المعالجة', (c) => `${c.slaDays} أيام`],
        ['الحالة', (c) => active(c.active)],
      ],
      form: (c) =>
        input('اسم النوع', 'name', c?.name) +
        two(select('القسم المسؤول', 'departmentId', deptOptions, c?.departmentId), input('مدة المعالجة (أيام)', 'slaDays', c?.slaDays ?? 3, 'type="number" min="1"')) +
        select('الأولوية الافتراضية', 'priority', Object.entries(priorityLabels), 'medium') +
        toggle('ظاهر للمواطنين', 'active', c?.active ?? true),
    },
    districts: {
      entity: 'منطقة',
      rows: districts,
      search: (d) => d.name,
      columns: [
        ['المنطقة', (d) => `<span class="strong">${esc(d.name)}</span>`],
        ['عدد السكان', (d) => formatNumber(d.population)],
        ['الإحداثيات', (d) => `<span class="ltr text-xs num">${d.lat.toFixed(4)}, ${d.lng.toFixed(4)}</span>`],
        ['خطورة الفيضانات', (d) => badge(RISK[d.floodRisk][1], RISK[d.floodRisk][0])],
      ],
      form: (d) =>
        input('اسم المنطقة', 'name', d?.name) +
        two(
          input('خط العرض', 'lat', d?.lat, 'dir="ltr"'),
          input('خط الطول', 'lng', d?.lng, 'dir="ltr"'),
          input('عدد السكان', 'population', d?.population, 'type="number"'),
          select('خطورة الفيضانات', 'floodRisk', [['low', 'منخفضة'], ['medium', 'متوسطة'], ['high', 'عالية']], d?.floodRisk),
        ),
    },
    keywords: {
      entity: 'كلمة مفتاحية',
      rows: keywords,
      search: (k) => `${k.word} ${k.category}`,
      filter: { label: 'كل الدلالات', options: [['positive', 'إيجابية'], ['negative', 'سلبية'], ['neutral', 'محايدة']], match: (k, v) => k.sentiment === v },
      columns: [
        ['الكلمة / العبارة', (k) => `<span class="strong" style="padding:4px 8px;border-radius:6px;background:var(--muted)">«${esc(k.word)}»</span>`],
        ['الدلالة', (k) => badge(SENT[k.sentiment][1], SENT[k.sentiment][0])],
        ['المحور', (k) => esc(k.category)],
        ['مرات الظهور', (k) => k.hits],
      ],
      form: (k) =>
        `<div class="field"><label class="label">الكلمة أو العبارة</label><input class="input" name="word" value="${esc(k?.word ?? '')}"><p class="hint">يمكن إضافة مرادفات مفصولة بفاصلة</p></div>` +
        two(
          select('الدلالة', 'sentiment', [['positive', 'إيجابية'], ['negative', 'سلبية'], ['neutral', 'محايدة']], k?.sentiment),
          select('المحور', 'category', ['زمن الاستجابة', 'جودة الحل', 'التواصل', 'عام'].map((x) => [x, x]), k?.category),
        ),
    },
  }

  const main = $('#content')
  const cfg = CONFIG[main.dataset.entity]
  const rows = [...cfg.rows]
  const state = { q: '', filter: '' }
  const root = $('#crud')

  root.innerHTML = `<div class="card card-clip">
    <div class="table-toolbar flex wrap gap-3 items-center">
      <div class="search" style="min-width:220px;max-width:380px">${icon('search')}<input class="input" data-q placeholder="بحث..."></div>
      ${cfg.filter ? `<select class="select" data-filter style="width:auto;min-width:170px"><option value="">${cfg.filter.label}</option>${cfg.filter.options.map(([v, l]) => `<option value="${v}">${esc(l)}</option>`).join('')}</select>` : ''}
      <button class="btn btn-primary ms-auto" data-add>${icon('plus')}إضافة ${cfg.entity}</button>
    </div>
    <div data-body></div>
  </div>`

  const actions = (i) => `<div class="flex justify-end gap-1">
    <button class="icon-btn" data-edit="${i}" aria-label="تعديل" style="width:32px;height:32px">${icon('pencil')}</button>
    <button class="icon-btn" data-del="${i}" aria-label="حذف" style="width:32px;height:32px;color:var(--error-600)">${icon('trash')}</button></div>`

  function render() {
    const list = rows
      .map((r, i) => [r, i])
      .filter(([r]) => cfg.search(r).includes(state.q.trim()) && (!state.filter || cfg.filter.match(r, state.filter)))
    const [first, ...rest] = cfg.columns
    $('[data-body]', root).innerHTML = list.length
      ? `<div class="table-wrap table-desktop"><table class="table">
          <thead><tr>${cfg.columns.map(([h]) => `<th>${h}</th>`).join('')}<th class="text-end">إجراءات</th></tr></thead>
          <tbody>${list.map(([r, i]) => `<tr>${cfg.columns.map(([, fn]) => `<td>${fn(r)}</td>`).join('')}<td>${actions(i)}</td></tr>`).join('')}</tbody>
        </table></div>
        <ul class="mobile-list for-table">${list
          .map(
            ([r, i]) => `<li class="mobile-item stack-sm">
            <div class="flex justify-between items-start gap-2"><div class="flex-1">${first[1](r)}</div>${actions(i)}</div>
            <dl class="kv">${rest.map(([h, fn]) => `<div style="min-width:0"><dt>${h}</dt><dd class="truncate">${fn(r)}</dd></div>`).join('')}</dl>
          </li>`,
          )
          .join('')}</ul>
        <div class="card-footer text-sm c-3">عدد السجلات: ${list.length}</div>`
      : empty('search-x', 'لا توجد نتائج', 'جرّب كلمة بحث مختلفة.')
  }

  function openForm(index) {
    const row = index === undefined ? null : rows[index]
    const m = modal({
      title: row ? `تعديل ${cfg.entity}` : `إضافة ${cfg.entity}`,
      body: `<form class="stack" data-form>${cfg.form(row)}</form>`,
      footer: `<button class="btn btn-ghost" data-close>إلغاء</button><button class="btn btn-primary" data-save>${icon('save')}حفظ</button>`,
    })
    $('[data-save]', m).addEventListener('click', () => {
      const data = Object.fromEntries(new FormData($('[data-form]', m)))
      if (!data.name && !data.word) return toast('يرجى تعبئة الحقل الأول')
      // تحديث الواجهة فقط — سيُستبدل بطلب للـ Backend لاحقاً
      if (row) Object.assign(row, data.name ? { name: data.name } : { word: data.word })
      else rows.unshift({ ...(row || rows[0]), ...data, id: 'new-' + Date.now(), status: 'active', active: true })
      m.close()
      render()
      toast(row ? 'تم حفظ التعديلات' : `تمت إضافة ${cfg.entity}`)
    })
  }

  function confirmDelete(index) {
    const m = modal({
      title: `حذف ${cfg.entity}`,
      size: 'sm',
      body: '<p class="text-sm c-2 leading-loose">هل أنت متأكد من حذف هذا السجل؟ لا يمكن التراجع عن هذا الإجراء.</p>',
      footer: `<button class="btn btn-ghost" data-close>إلغاء</button><button class="btn btn-danger" data-confirm>${icon('trash')}تأكيد الحذف</button>`,
    })
    $('[data-confirm]', m).addEventListener('click', () => {
      rows.splice(index, 1)
      m.close()
      render()
      toast('تم الحذف')
    })
  }

  root.addEventListener('input', (e) => {
    if (e.target.matches('[data-q]')) state.q = e.target.value
    if (e.target.matches('[data-filter]')) state.filter = e.target.value
    render()
  })
  root.addEventListener('click', (e) => {
    if (e.target.closest('[data-add]')) return openForm()
    const ed = e.target.closest('[data-edit]')
    if (ed) return openForm(Number(ed.dataset.edit))
    const del = e.target.closest('[data-del]')
    if (del) confirmDelete(Number(del.dataset.del))
  })
  render()
})()
