/* ==========================================================================
   إدارة النظام — جدول عام يخدم 6 صفحات حسب <main data-entity="...">:
   users | employees | departments | categories | districts | keywords
   كل عمليات الكتابة محمية في قاعدة البيانات (RLS: المدير فقط + Trigger لحماية الأدوار).
   ========================================================================== */
App.page({ roles: ['admin'] }, async ({ profile: me }) => {
  const entity = $('#content').dataset.entity

  /* ---------- أدوات بناء الحقول ---------- */
  const input = (label, name, value = '', attrs = '', hint = '') =>
    `<div class="field"><label class="label">${label}</label><input class="input" name="${name}" value="${esc(value ?? '')}" ${attrs}>${hint ? `<p class="hint">${hint}</p>` : ''}<p class="error-text">قيمة غير صالحة</p></div>`
  const select = (label, name, options, value = '') =>
    `<div class="field"><label class="label">${label}</label><select class="select" name="${name}">${options.map(([v, l]) => `<option value="${esc(v)}" ${String(v) === String(value ?? '') ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select></div>`
  const toggle = (label, name, on = true) => `<label class="switch"><input type="checkbox" name="${name}" ${on ? 'checked' : ''}><span class="track"></span>${label}</label>`
  const textarea = (label, name, value = '') => `<div class="field"><label class="label">${label}</label><textarea class="textarea" name="${name}" rows="3" maxlength="500">${esc(value ?? '')}</textarea></div>`
  const two = (...f) => `<div class="grid sm-cols-2">${f.join('')}</div>`

  const person = (u) =>
    `<span class="flex items-center gap-3">${avatar(u.full_name || u.email, 'sm')}<span style="min-width:0"><span class="strong" style="display:block">${esc(u.full_name || '—')}</span><span class="text-xs c-3 truncate ltr" style="display:block;text-align:right">${esc(u.email || '')}</span></span></span>`
  const activeBadge = (on, yes = 'مفعّل', no = 'معطّل') => badge(on ? yes : no, on ? 'success' : 'neutral', '', true)
  const RISK = { high: ['error', 'عالية'], medium: ['warning', 'متوسطة'], low: ['success', 'منخفضة'] }
  const SENT = { positive: 'success', negative: 'error', neutral: 'neutral' }

  let departments = []
  const deptOptions = (withEmpty = true) => [...(withEmpty ? [['', 'بدون قسم']] : []), ...departments.filter((d) => d.is_active).map((d) => [d.id, d.name])]
  const deptName = (id) => departments.find((d) => d.id === id)?.name || '—'

  // التحقق من الحقول الإلزامية داخل النموذج
  const required = (form, names) => {
    let ok = true
    names.forEach((n) => {
      const el = form.elements[n]
      const bad = !String(el.value).trim()
      el.closest('.field').classList.toggle('is-invalid', bad)
      if (bad) ok = false
    })
    return ok
  }
  const numOrNull = (v) => (String(v).trim() === '' ? null : Number(v))

  /* ---------- إعداد كل صفحة ---------- */
  const CONFIG = {
    users: {
      entity: 'مستخدم',
      addLabel: null, // المواطنون ينشئون حساباتهم بأنفسهم
      load: () => API.list('profiles', { select: 'id, full_name, email, phone, role, is_active, created_at, department_id', filters: { role: 'citizen' } }),
      search: (u) => `${u.full_name} ${u.email} ${u.phone}`,
      columns: [
        ['المستخدم', person],
        ['الهاتف', (u) => `<span class="ltr">${esc(u.phone || '—')}</span>`],
        ['تاريخ التسجيل', (u) => formatDate(u.created_at)],
        ['الحالة', (u) => activeBadge(u.is_active, 'نشط', 'موقوف')],
      ],
      form: (u) =>
        input('الاسم الكامل', 'full_name', u.full_name, 'maxlength="120"') +
        two(input('البريد الإلكتروني', 'email', u.email, 'disabled dir="ltr"'), input('الهاتف', 'phone', u.phone, 'dir="ltr"')) +
        two(select('الدور', 'role', Object.entries(ROLE_LABELS), u.role), select('القسم (للموظفين)', 'department_id', deptOptions(), u.department_id)) +
        toggle('الحساب نشط', 'is_active', u.is_active) +
        `<p class="hint">تغيير الدور إلى "موظف" ينقل الحساب لصفحة الموظفين ويمنحه صلاحيات قسمه.</p>`,
      save: (u, f) => {
        if (!required(f, ['full_name'])) return null
        if (f.elements.role.value === 'employee' && !f.elements.department_id.value) {
          f.elements.department_id.closest('.field').classList.add('is-invalid')
          return null
        }
        return API.update('profiles', u.id, {
          full_name: f.elements.full_name.value.trim(), phone: f.elements.phone.value.trim() || null,
          role: f.elements.role.value, department_id: f.elements.department_id.value || null, is_active: f.elements.is_active.checked,
        })
      },
      toggle: (u) => ({ label: u.is_active ? 'إيقاف الحساب' : 'تفعيل الحساب', run: () => API.update('profiles', u.id, { is_active: !u.is_active }) }),
    },

    employees: {
      entity: 'موظف',
      addLabel: 'إضافة موظف',
      load: () => API.list('profiles', { select: 'id, full_name, email, phone, role, is_active, created_at, department_id', filters: { role: ['employee', 'admin'] } }),
      search: (u) => `${u.full_name} ${u.email}`,
      filter: () => ({ label: 'كل الأقسام', options: departments.map((d) => [d.id, d.name]), match: (u, v) => u.department_id === v }),
      columns: [
        ['الموظف', person],
        ['القسم', (u) => esc(u.role === 'admin' ? 'الإدارة العامة' : deptName(u.department_id))],
        ['الصلاحية', (u) => (u.role === 'admin' ? badge('مدير', 'gold') : badge('موظف', 'primary'))],
        ['الحالة', (u) => activeBadge(u.is_active, 'نشط', 'موقوف')],
      ],
      form: (u) =>
        input('الاسم الكامل', 'full_name', u?.full_name, 'maxlength="120"') +
        two(
          input('البريد الإلكتروني', 'email', u?.email, `dir="ltr" type="email" ${u ? 'disabled' : ''}`),
          input('الهاتف', 'phone', u?.phone, 'dir="ltr"'),
          select('القسم', 'department_id', deptOptions(), u?.department_id),
          select('الصلاحية', 'role', [['employee', 'موظف'], ['admin', 'مدير النظام'], ...(u ? [['citizen', 'مواطن (إلغاء الصلاحيات)']] : [])], u?.role || 'employee'),
        ) +
        (u
          ? toggle('الحساب نشط', 'is_active', u.is_active)
          : input('كلمة مرور مؤقتة', 'password', '', 'type="text" dir="ltr" minlength="8" autocomplete="off"', 'يرسلها المدير للموظف ليغيّرها لاحقاً (8 أحرف على الأقل). إذا كان "تأكيد البريد" مفعلاً في Supabase فسيصل الموظف رابط تفعيل.')),
      save: async (u, f) => {
        const e = f.elements
        const need = u ? ['full_name'] : ['full_name', 'email', 'password']
        if (!required(f, need)) return null
        // حماية من إغلاق المدير على نفسه: لا يلغي صلاحياته ولا يوقف حسابه بنفسه
        if (u && u.id === me.id && (e.role.value !== 'admin' || !e.is_active.checked)) {
          toast('لا يمكنك إلغاء صلاحياتك أو إيقاف حسابك بنفسك. اطلب ذلك من مدير آخر.', 'error')
          return null
        }
        if (e.role.value === 'employee' && !e.department_id.value) {
          e.department_id.closest('.field').classList.add('is-invalid')
          return null
        }
        if (!u) {
          if (e.password.value.length < 8) {
            e.password.closest('.field').classList.add('is-invalid')
            return null
          }
          const res = await API.createStaffAccount({
            email: e.email.value.trim(), password: e.password.value, fullName: e.full_name.value.trim(), phone: e.phone.value.trim() || null,
            role: e.role.value, departmentId: e.department_id.value || null,
          })
          if (res.needsConfirmation) toast('تم إنشاء الحساب — يجب على الموظف تأكيد بريده قبل الدخول', 'info')
          return res
        }
        return API.update('profiles', u.id, {
          full_name: e.full_name.value.trim(), phone: e.phone.value.trim() || null, role: e.role.value,
          department_id: e.department_id.value || null, is_active: e.is_active.checked,
        })
      },
      toggle: (u) => (u.id === me.id ? null : { label: u.is_active ? 'إيقاف الحساب' : 'تفعيل الحساب', run: () => API.update('profiles', u.id, { is_active: !u.is_active }) }),
    },

    departments: {
      entity: 'قسم',
      addLabel: 'إضافة قسم',
      load: async () => {
        const [rows, cats, staff] = await Promise.all([API.departments(), API.categories({ activeOnly: false }), API.staff({ activeOnly: false })])
        return rows.map((d) => ({ ...d, _cats: cats.filter((c) => c.department_id === d.id).length, _staff: staff.filter((s) => s.department_id === d.id).length }))
      },
      search: (d) => `${d.name} ${d.description || ''}`,
      columns: [
        ['القسم', (d) => `<span class="strong">${esc(d.name)}</span>${d.description ? `<p class="text-xs c-3">${esc(d.description)}</p>` : ''}`],
        ['عدد الموظفين', (d) => d._staff],
        ['أنواع المشاكل', (d) => d._cats],
        ['الحالة', (d) => activeBadge(d.is_active)],
      ],
      form: (d) => input('اسم القسم', 'name', d?.name, 'maxlength="100"') + textarea('الوصف', 'description', d?.description) + toggle('القسم مفعّل', 'is_active', d?.is_active ?? true),
      save: (d, f) => {
        if (!required(f, ['name'])) return null
        const row = { name: f.elements.name.value.trim(), description: f.elements.description.value.trim() || null, is_active: f.elements.is_active.checked }
        return d ? API.update('departments', d.id, row) : API.insert('departments', row)
      },
      toggle: (d) => ({ label: d.is_active ? 'تعطيل القسم' : 'تفعيل القسم', run: () => API.update('departments', d.id, { is_active: !d.is_active }) }),
    },

    categories: {
      entity: 'نوع مشكلة',
      addLabel: 'إضافة نوع',
      load: () => API.categories({ activeOnly: false }),
      search: (c) => c.name,
      columns: [
        ['النوع', (c) => `<span class="flex items-center gap-3 strong"><span class="icon-box sm" style="--bg:${esc(c.color)}22;--fg:${esc(c.color)}">${icon(safeIcon(c.icon))}</span>${esc(c.name)}</span>`],
        ['القسم المسؤول', (c) => esc(c.department?.name || '—')],
        ['مدة المعالجة', (c) => `${c.sla_days} يوم`],
        ['الأولوية', (c) => priorityBadge(c.default_priority)],
        ['مرتبط بالطقس', (c) => (c.is_weather_related ? badge('نعم', 'info', 'cloud-rain') : '<span class="c-3">لا</span>')],
        ['الحالة', (c) => activeBadge(c.is_active)],
      ],
      form: (c) =>
        input('اسم النوع', 'name', c?.name, 'maxlength="100"') +
        textarea('الوصف', 'description', c?.description) +
        two(
          select('القسم المسؤول', 'department_id', deptOptions(), c?.department_id),
          input('مدة المعالجة (أيام)', 'sla_days', c?.sla_days ?? 3, 'type="number" min="1" max="365"'),
          select('الأولوية الافتراضية', 'default_priority', Object.entries(PRIORITY_LABELS), c?.default_priority || 'medium'),
          `<div class="field"><label class="label">اللون</label><input class="input" type="color" name="color" value="${esc(c?.color || '#0b5d51')}" style="padding:4px;height:44px"></div>`,
        ) +
        `<div class="field"><label class="label">الأيقونة</label><div class="chips">${CATEGORY_ICONS.map((ic) => `<label class="chip" style="display:inline-flex;align-items:center;gap:4px"><input type="radio" name="icon" value="${ic}" ${(c?.icon || 'construction') === ic ? 'checked' : ''}>${icon(ic)}</label>`).join('')}</div></div>` +
        toggle('مرتبط بالأمطار والتصريف (يُستخدم في تحليل الحالات الجوية)', 'is_weather_related', c?.is_weather_related ?? false) +
        toggle('ظاهر للمواطنين', 'is_active', c?.is_active ?? true),
      save: (c, f) => {
        const e = f.elements
        if (!required(f, ['name', 'sla_days'])) return null
        const row = {
          name: e.name.value.trim(), description: e.description.value.trim() || null, department_id: e.department_id.value || null,
          sla_days: Number(e.sla_days.value), default_priority: e.default_priority.value, color: e.color.value, icon: e.icon.value || 'construction',
          is_weather_related: e.is_weather_related.checked, is_active: e.is_active.checked,
        }
        return c ? API.update('problem_categories', c.id, row) : API.insert('problem_categories', row)
      },
      toggle: (c) => ({ label: c.is_active ? 'إخفاء عن المواطنين' : 'إظهار للمواطنين', run: () => API.update('problem_categories', c.id, { is_active: !c.is_active }) }),
      remove: (c) => API.remove('problem_categories', c.id),
    },

    districts: {
      entity: 'منطقة',
      addLabel: 'إضافة منطقة',
      load: () => API.areas(),
      search: (d) => `${d.name} ${d.description || ''}`,
      columns: [
        ['المنطقة', (d) => `<span class="strong">${esc(d.name)}</span>${d.description ? `<p class="text-xs c-3">${esc(d.description)}</p>` : ''}`],
        ['عدد السكان', (d) => (d.population ? formatNumber(d.population) : '—')],
        ['الإحداثيات', (d) => (d.latitude != null ? `<span class="ltr text-xs num">${d.latitude.toFixed(4)}, ${d.longitude.toFixed(4)}</span>` : '—')],
        ['خطورة الفيضانات', (d) => badge(RISK[d.flood_risk][1], RISK[d.flood_risk][0])],
      ],
      form: (d) =>
        input('اسم المنطقة', 'name', d?.name, 'maxlength="100"') +
        textarea('الوصف', 'description', d?.description) +
        `<div class="field"><label class="label">الموقع (اضغط على الخريطة لتحديد مركز المنطقة)</label><div data-area-map style="height:220px"></div></div>` +
        two(
          input('خط العرض', 'latitude', d?.latitude, 'dir="ltr" type="number" step="any" min="-90" max="90"'),
          input('خط الطول', 'longitude', d?.longitude, 'dir="ltr" type="number" step="any" min="-180" max="180"'),
          input('عدد السكان', 'population', d?.population, 'type="number" min="0"'),
          select('خطورة الفيضانات', 'flood_risk', Object.entries(RISK_LABELS), d?.flood_risk || 'low'),
        ),
      afterOpen: (m, d) => {
        const f = $('[data-form]', m).elements
        Maps.useAreasCenter(state.rows)
        const center = d?.latitude != null ? [d.latitude, d.longitude] : null
        const pk = Maps.picker($('[data-area-map]', m), (ll) => {
          f.latitude.value = ll.lat.toFixed(6)
          f.longitude.value = ll.lng.toFixed(6)
        }, center)
        if (d?.latitude != null) pk.set(center)
      },
      save: (d, f) => {
        const e = f.elements
        if (!required(f, ['name', 'latitude', 'longitude'])) return null
        const row = {
          name: e.name.value.trim(), description: e.description.value.trim() || null, latitude: Number(e.latitude.value), longitude: Number(e.longitude.value),
          population: numOrNull(e.population.value), flood_risk: e.flood_risk.value,
        }
        return d ? API.update('areas', d.id, row) : API.insert('areas', row)
      },
      remove: (d) => API.remove('areas', d.id),
    },

    keywords: {
      entity: 'كلمة مفتاحية',
      addLabel: 'إضافة كلمة',
      load: async () => {
        const [rows, s] = await Promise.all([API.list('feedback_keywords', { order: 'keyword', asc: true }), API.satisfaction().catch(() => null)])
        const hits = Object.fromEntries((s?.keywords || []).map((k) => [k.id, k.hits]))
        return rows.map((k) => ({ ...k, _hits: hits[k.id] ?? 0 }))
      },
      search: (k) => `${k.keyword} ${k.topic}`,
      filter: () => ({ label: 'كل الدلالات', options: Object.entries(SENTIMENT_LABELS), match: (k, v) => k.sentiment === v }),
      columns: [
        ['الكلمة / العبارة', (k) => `<span class="strong" style="padding:4px 8px;border-radius:6px;background:var(--muted)">«${esc(k.keyword)}»</span>`],
        ['الدلالة', (k) => badge(SENTIMENT_LABELS[k.sentiment], SENT[k.sentiment])],
        ['المحور', (k) => esc(k.topic)],
        ['مرات الظهور في التعليقات', (k) => k._hits],
        ['الحالة', (k) => activeBadge(k.is_active)],
      ],
      form: (k) =>
        input('الكلمة أو العبارة', 'keyword', k?.keyword, 'maxlength="60"', 'يبحث النظام عن هذه الكلمة داخل تعليقات التقييمات (مطابقة نصية).') +
        two(
          select('الدلالة', 'sentiment', Object.entries(SENTIMENT_LABELS), k?.sentiment || 'negative'),
          `<div class="field"><label class="label">المحور</label><input class="input" name="topic" list="topics" value="${esc(k?.topic || 'عام')}" maxlength="60"><datalist id="topics"><option>زمن الاستجابة</option><option>جودة الحل</option><option>التواصل</option><option>عام</option></datalist></div>`,
        ) +
        toggle('مفعّلة في التحليل', 'is_active', k?.is_active ?? true),
      save: (k, f) => {
        if (!required(f, ['keyword'])) return null
        const e = f.elements
        const row = { keyword: e.keyword.value.trim(), sentiment: e.sentiment.value, topic: e.topic.value.trim() || 'عام', is_active: e.is_active.checked }
        return k ? API.update('feedback_keywords', k.id, row) : API.insert('feedback_keywords', row)
      },
      remove: (k) => API.remove('feedback_keywords', k.id),
    },
  }

  const cfg = CONFIG[entity]
  const root = $('#crud')
  const state = { q: '', filter: '', rows: [] }
  departments = await API.departments()
  const filter = cfg.filter?.()

  root.innerHTML = `<div class="card card-clip">
    <div class="table-toolbar flex wrap gap-3 items-center">
      <div class="search" style="min-width:220px;max-width:380px">${icon('search')}<input class="input" data-q placeholder="بحث..."></div>
      ${filter ? `<select class="select" data-filter style="width:auto;min-width:170px"><option value="">${filter.label}</option>${filter.options.map(([v, l]) => `<option value="${esc(v)}">${esc(l)}</option>`).join('')}</select>` : ''}
      ${cfg.addLabel ? `<button class="btn btn-primary ms-auto" data-add>${icon('plus')}${cfg.addLabel}</button>` : `<span class="text-xs c-3 ms-auto">ينشئ المواطنون حساباتهم من صفحة التسجيل</span>`}
    </div>
    <div data-body></div>
  </div>`

  const actions = (r, i) => {
    const t = cfg.toggle?.(r)
    return `<div class="flex justify-end gap-1">
      <button class="icon-btn" data-edit="${i}" aria-label="تعديل" title="تعديل" style="width:32px;height:32px">${icon('pencil')}</button>
      ${t ? `<button class="icon-btn" data-toggle="${i}" aria-label="${t.label}" title="${t.label}" style="width:32px;height:32px">${icon(t.label.includes('إيقاف') || t.label.includes('تعطيل') || t.label.includes('إخفاء') ? 'eye-off' : 'eye')}</button>` : ''}
      ${cfg.remove ? `<button class="icon-btn" data-del="${i}" aria-label="حذف" title="حذف" style="width:32px;height:32px;color:var(--error-600)">${icon('trash')}</button>` : ''}
    </div>`
  }

  function draw() {
    const body = $('[data-body]', root)
    const q = state.q.trim().toLowerCase()
    const list = state.rows.map((r, i) => [r, i]).filter(([r]) => cfg.search(r).toLowerCase().includes(q) && (!state.filter || filter.match(r, state.filter)))
    const [first, ...rest] = cfg.columns
    body.innerHTML = list.length
      ? `<div class="table-wrap table-desktop"><table class="table">
          <thead><tr>${cfg.columns.map(([h]) => `<th>${h}</th>`).join('')}<th class="text-end">إجراءات</th></tr></thead>
          <tbody>${list.map(([r, i]) => `<tr>${cfg.columns.map(([, fn]) => `<td>${fn(r)}</td>`).join('')}<td>${actions(r, i)}</td></tr>`).join('')}</tbody>
        </table></div>
        <ul class="mobile-list for-table">${list
          .map(
            ([r, i]) => `<li class="mobile-item stack-sm">
            <div class="flex justify-between items-start gap-2"><div class="flex-1">${first[1](r)}</div>${actions(r, i)}</div>
            <dl class="kv">${rest.map(([h, fn]) => `<div style="min-width:0"><dt>${h}</dt><dd class="truncate">${fn(r)}</dd></div>`).join('')}</dl>
          </li>`,
          )
          .join('')}</ul>
        <div class="card-footer text-sm c-3">عدد السجلات: ${list.length}</div>`
      : state.rows.length
        ? empty('search-x', 'لا توجد نتائج', 'جرّب كلمة بحث مختلفة.')
        : empty('inbox', `لا توجد بيانات بعد`, cfg.addLabel ? `اضغط "${cfg.addLabel}" لإضافة أول سجل.` : '')
  }

  async function reload() {
    const rows = await load($('[data-body]', root), cfg.load)
    if (!rows) return
    state.rows = rows
    draw()
  }

  function openForm(row = null) {
    const m = modal({
      title: row ? `تعديل ${cfg.entity}` : `إضافة ${cfg.entity}`,
      body: `<form class="stack" data-form novalidate>${cfg.form(row)}</form>`,
      footer: `<button class="btn btn-ghost" data-close>إلغاء</button><button class="btn btn-primary" data-save>${icon('save')}حفظ</button>`,
      size: entity === 'districts' || entity === 'categories' ? 'lg' : '',
    })
    cfg.afterOpen?.(m, row)
    const form = $('[data-form]', m)
    form.addEventListener('submit', (e) => e.preventDefault())
    $('[data-save]', m).addEventListener('click', async (e) => {
      try {
        const result = await withBusy(e.currentTarget, async () => cfg.save(row, form))
        if (result === null) return // أخطاء في الحقول
        m.close()
        toast(row ? 'تم حفظ التعديلات' : `تمت إضافة ${cfg.entity}`)
        reload()
      } catch (err) {
        toast(toAppError(err).message, 'error')
      }
    })
  }

  root.addEventListener('input', (e) => {
    if (e.target.matches('[data-q]')) state.q = e.target.value
    if (e.target.matches('[data-filter]')) state.filter = e.target.value
    draw()
  })
  root.addEventListener('click', async (e) => {
    if (e.target.closest('[data-add]')) return openForm()
    const ed = e.target.closest('[data-edit]')
    if (ed) return openForm(state.rows[Number(ed.dataset.edit)])
    const tg = e.target.closest('[data-toggle]')
    if (tg) {
      const t = cfg.toggle(state.rows[Number(tg.dataset.toggle)])
      if (!(await confirmDialog({ title: t.label, message: `هل تريد ${t.label}؟`, confirmText: t.label }))) return
      try {
        await t.run()
        toast('تم التحديث')
        reload()
      } catch (err) {
        toast(toAppError(err).message, 'error')
      }
    }
    const del = e.target.closest('[data-del]')
    if (del) {
      if (!(await confirmDialog({ title: `حذف ${cfg.entity}`, message: 'هل أنت متأكد من الحذف؟ لا يمكن التراجع عن هذا الإجراء.', confirmText: 'تأكيد الحذف', danger: true }))) return
      try {
        await cfg.remove(state.rows[Number(del.dataset.del)])
        toast('تم الحذف')
        reload()
      } catch (err) {
        toast(toAppError(err).message, 'error')
      }
    }
  })
  reload()
})
