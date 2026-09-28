/* الاستعداد للحالات الجوية — بدون ذكاء اصطناعي:
   المدير يسجل الحالة الجوية والمناطق المتأثرة، والنظام يعرض المناطق ذات التاريخ الأعلى
   في بلاغات الفيضانات / انسداد المصارف / تجمع المياه (أنواع مشاكل مُعلّمة is_weather_related).
   يمكن لاحقاً ربط Weather API لتعبئة الحالة تلقائياً — الحقول جاهزة لذلك. */
App.page({ roles: ['admin'] }, async () => {
  const SEV_COLOR = { high: 'var(--error-500)', medium: 'var(--warning-600)', low: 'var(--success-500)' }
  const RISK = { high: ['error', 'خطورة عالية'], medium: ['warning', 'خطورة متوسطة'], low: ['success', 'خطورة منخفضة'] }
  let events = []
  let current = null
  let areas = []
  let riskMap = null

  const pickCurrent = () => events.find((e) => new Date(e.ends_at) >= new Date()) || events[events.length - 1] || null

  async function loadEvents() {
    ;[events, areas] = await Promise.all([API.list('weather_events', { select: '*, weather_event_areas(area_id)', order: 'starts_at', asc: true }), API.areas()])
  }

  function renderHero() {
    $('#hero').hidden = !current
    $('#no-event').hidden = !!current
    $('#notify').disabled = !current
    if (!current) {
      $('#no-event').innerHTML = `<div class="card">${empty('cloud-rain', 'لا توجد حالات جوية مسجلة', 'أضف الحالة الجوية المتوقعة وحدد المناطق المتأثرة ليعرض النظام المناطق الحساسة بناءً على البلاغات السابقة.', `<button class="btn btn-primary" data-add-event>${icon('plus')}إضافة حالة جوية</button>`)}</div>`
      return
    }
    $('#w-icon').innerHTML = icon(WEATHER_ICONS[current.event_type] || 'cloud-rain')
    $('#w-type').textContent = current.title
    $('#w-sev').innerHTML = `${icon('triangle-alert')}مستوى الخطورة: ${RISK_LABELS[current.severity]}`
    $('#w-sev').style.background = SEV_COLOR[current.severity]
    $('#w-desc').textContent = current.description || WEATHER_TYPES[current.event_type]
    $('#w-start').textContent = formatDateTime(current.starts_at)
    $('#w-end').textContent = formatDateTime(current.ends_at)
    $('#w-rain').textContent = current.rainfall || '—'
    $('#w-wind').textContent = current.wind || '—'
    $('#w-temp').textContent = current.temperature || '—'
  }

  async function renderAreas() {
    const rows = await load($('#areas'), () => API.weatherAreas(current?.id || null))
    if (!rows) return
    const shown = rows.filter((a) => a.is_affected || a.weather_complaints > 0)
    const max = Math.max(1, ...shown.map((a) => a.weather_complaints))
    $('#areas').innerHTML = shown.length
      ? shown
          .map(
            (a) => `<div class="area-row">
          <div class="stack-sm">
            <div class="area-title">${icon('map-pin')}<p class="fw-600">${esc(a.name)}</p><span class="c-3">—</span>
              <p class="fw-600 ${a.weather_complaints ? 'c-error' : 'c-3'}">${a.weather_complaints} بلاغ سابق (فيضانات / تصريف)</p>
              ${badge(RISK[a.flood_risk][1], RISK[a.flood_risk][0])}${a.is_affected ? badge('ضمن المناطق المتأثرة', 'gold', 'cloud-rain') : ''}</div>
            <p class="text-xs c-3">آخر حادثة: ${a.last_incident ? formatDate(a.last_incident) : 'لا يوجد'} · مفتوحة حالياً: ${a.open_weather_complaints} · الأكثر: ${esc(a.top_category || '—')}</p>
          </div>
          ${progress((a.weather_complaints / max) * 100, a.flood_risk === 'high' ? 'error' : a.flood_risk === 'medium' ? 'warning' : 'success')}
        </div>`,
          )
          .join('')
      : empty('map-pin', 'لا توجد بيانات تاريخية بعد', 'ستظهر المناطق هنا عند وجود بلاغات من أنواع مرتبطة بالأمطار والتصريف.')

    const mapHost = $('#risk-map')
    if (riskMap) riskMap.remove()
    mapHost.innerHTML = ''
    mapHost.className = 'h-72 flush'
    riskMap = Maps.risk(mapHost, shown.map((a) => ({ name: a.name, latitude: a.latitude, longitude: a.longitude, count: a.weather_complaints, risk: a.flood_risk, affected: a.is_affected })))
  }

  function renderTasks() {
    const list = $('#tasks')
    const tasks = current?.checklist || []
    $('#tasks-count').textContent = current ? `${tasks.filter((t) => t.done).length} من ${tasks.length} مهام مكتملة` : ''
    list.innerHTML = current
      ? tasks.map((t, i) => `<div class="task-row"><label class="check"><input type="checkbox" data-task="${i}" ${t.done ? 'checked' : ''}><span class="${t.done ? 'done-task' : ''}">${esc(t.text)}</span></label><button class="icon-btn" data-del-task="${i}" aria-label="حذف المهمة" style="width:32px;height:32px">${icon('x')}</button></div>`).join('') +
        `<form class="flex gap-2 mt-2" id="task-form"><input class="input" maxlength="150" placeholder="أضف مهمة استعداد..." required><button class="btn btn-secondary" type="submit">${icon('plus')}</button></form>`
      : '<p class="text-sm c-3">أضف حالة جوية لإنشاء قائمة الاستعداد.</p>'
    $('#task-form')?.addEventListener('submit', (e) => {
      e.preventDefault()
      const text = $('input', e.target).value.trim()
      if (text) saveChecklist([...tasks, { text, done: false }])
    })
  }

  async function saveChecklist(checklist) {
    try {
      const updated = await API.update('weather_events', current.id, { checklist })
      current.checklist = updated.checklist
      renderTasks()
    } catch (err) {
      toast(toAppError(err).message, 'error')
    }
  }
  $('#tasks').addEventListener('change', (e) => {
    const i = e.target.dataset.task
    if (i === undefined) return
    const list = current.checklist.map((t, j) => (j === Number(i) ? { ...t, done: e.target.checked } : t))
    saveChecklist(list)
  })
  $('#tasks').addEventListener('click', (e) => {
    const b = e.target.closest('[data-del-task]')
    if (b) saveChecklist(current.checklist.filter((_, j) => j !== Number(b.dataset.delTask)))
  })

  function renderEvents() {
    $('#upcoming').innerHTML = events.length
      ? [...events]
          .reverse()
          .map(
            (a) => `<div class="event-item ${a.id === current?.id ? 'active' : ''}">
        <span class="icon-box box-info">${icon(WEATHER_ICONS[a.event_type] || 'cloud-rain')}</span>
        <button class="flex-1" style="text-align:start" data-select="${a.id}"><p class="fw-600">${esc(a.title)}</p><p class="text-sm c-3">${formatDate(a.starts_at)} — ${formatDate(a.ends_at)} · ${a.weather_event_areas.length} مناطق متأثرة ${new Date(a.ends_at) < new Date() ? '· منتهية' : ''}</p></button>
        ${badge(RISK_LABELS[a.severity], RISK[a.severity][0], 'triangle-alert')}
        <button class="icon-btn" data-edit="${a.id}" aria-label="تعديل">${icon('pencil')}</button>
        <button class="icon-btn" data-delete="${a.id}" aria-label="حذف" style="color:var(--error-600)">${icon('trash')}</button>
      </div>`,
          )
          .join('')
      : `<p class="text-sm c-3 text-center" style="padding:20px">لا توجد حالات جوية مسجلة.</p>`
  }

  async function refresh(selectId) {
    await loadEvents()
    current = events.find((e) => e.id === selectId) || pickCurrent()
    renderHero()
    renderTasks()
    renderEvents()
    await renderAreas()
  }

  $('#upcoming').addEventListener('click', async (e) => {
    const sel = e.target.closest('[data-select]')
    const ed = e.target.closest('[data-edit]')
    const del = e.target.closest('[data-delete]')
    if (sel) refresh(sel.dataset.select)
    if (ed) openForm(events.find((x) => x.id === ed.dataset.edit))
    if (del && (await confirmDialog({ title: 'حذف الحالة الجوية', message: 'هل تريد حذف هذه الحالة الجوية وقائمة الاستعداد الخاصة بها؟', confirmText: 'حذف', danger: true }))) {
      try {
        await API.remove('weather_events', del.dataset.delete)
        toast('تم الحذف')
        refresh()
      } catch (err) {
        toast(toAppError(err).message, 'error')
      }
    }
  })

  // نموذج إضافة / تعديل حالة جوية
  const toLocal = (iso) => (iso ? new Date(new Date(iso).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : '')
  function openForm(ev = null) {
    const selected = new Set((ev?.weather_event_areas || []).map((a) => a.area_id))
    const m = modal({
      title: ev ? 'تعديل الحالة الجوية' : 'إضافة حالة جوية',
      size: 'lg',
      body: `<form class="stack" data-form novalidate>
        <div class="field"><label class="label">عنوان الحالة<span class="req">*</span></label><input class="input" name="title" maxlength="150" value="${esc(ev?.title || '')}" placeholder="مثال: منخفض جوي وأمطار غزيرة"><p class="error-text">العنوان مطلوب</p></div>
        <div class="grid sm-cols-2">
          <div class="field"><label class="label">نوع الحالة</label><select class="select" name="event_type">${Object.entries(WEATHER_TYPES).map(([k, v]) => `<option value="${k}" ${ev?.event_type === k ? 'selected' : ''}>${v}</option>`).join('')}</select></div>
          <div class="field"><label class="label">مستوى الخطورة</label><select class="select" name="severity">${Object.entries(RISK_LABELS).map(([k, v]) => `<option value="${k}" ${(ev?.severity || 'medium') === k ? 'selected' : ''}>${v}</option>`).join('')}</select></div>
          <div class="field"><label class="label">تاريخ البداية<span class="req">*</span></label><input class="input" type="datetime-local" name="starts_at" value="${toLocal(ev?.starts_at)}"><p class="error-text">حدد تاريخ البداية</p></div>
          <div class="field"><label class="label">تاريخ النهاية<span class="req">*</span></label><input class="input" type="datetime-local" name="ends_at" value="${toLocal(ev?.ends_at)}"><p class="error-text">النهاية يجب أن تكون بعد البداية</p></div>
          <div class="field"><label class="label">كمية الأمطار</label><input class="input" name="rainfall" value="${esc(ev?.rainfall || '')}" placeholder="45 ملم"></div>
          <div class="field"><label class="label">سرعة الرياح</label><input class="input" name="wind" value="${esc(ev?.wind || '')}" placeholder="55 كم/س"></div>
          <div class="field"><label class="label">درجات الحرارة</label><input class="input" name="temperature" value="${esc(ev?.temperature || '')}" placeholder="12° — 18°"></div>
        </div>
        <div class="field"><label class="label">الوصف</label><textarea class="textarea" name="description" rows="3" maxlength="1000">${esc(ev?.description || '')}</textarea></div>
        <div class="field"><label class="label">المناطق المتأثرة</label>
          <div class="grid cols-2 sm-cols-3 grid-sm">${areas.map((a) => `<label class="check"><input type="checkbox" name="areas" value="${a.id}" ${selected.has(a.id) ? 'checked' : ''}> ${esc(a.name)}</label>`).join('')}</div>
        </div>
        ${ev ? '' : `<div class="field"><label class="label">مهام الاستعداد (مهمة في كل سطر)</label><textarea class="textarea" name="checklist" rows="4">تنظيف مناهل تصريف الأمطار\nتجهيز مضخات الشفط الاحتياطية\nرفع جاهزية فرق الطوارئ\nإشعار سكان المناطق الحساسة</textarea></div>`}
      </form>`,
      footer: `<button class="btn btn-ghost" data-close>إلغاء</button><button class="btn btn-primary" data-save>${icon('save')}حفظ</button>`,
    })
    $('[data-save]', m).addEventListener('click', async (e) => {
      const form = $('[data-form]', m)
      const f = form.elements
      const title = f.title.value.trim()
      const starts = f.starts_at.value ? new Date(f.starts_at.value) : null
      const ends = f.ends_at.value ? new Date(f.ends_at.value) : null
      f.title.closest('.field').classList.toggle('is-invalid', !title)
      f.starts_at.closest('.field').classList.toggle('is-invalid', !starts)
      f.ends_at.closest('.field').classList.toggle('is-invalid', !ends || (starts && ends < starts))
      if (!title || !starts || !ends || ends < starts) return
      const row = {
        title, event_type: f.event_type.value, severity: f.severity.value, starts_at: starts.toISOString(), ends_at: ends.toISOString(),
        rainfall: f.rainfall.value.trim() || null, wind: f.wind.value.trim() || null, temperature: f.temperature.value.trim() || null, description: f.description.value.trim() || null,
      }
      if (!ev) row.checklist = f.checklist.value.split('\n').map((t) => t.trim()).filter(Boolean).map((text) => ({ text, done: false }))
      const areaIds = $$('input[name="areas"]:checked', form).map((x) => x.value)
      try {
        await withBusy(e.currentTarget, async () => {
          const saved = ev ? await API.update('weather_events', ev.id, row) : await API.insert('weather_events', row)
          // تحديث المناطق المتأثرة: حذف ثم إضافة
          await run(sb.from('weather_event_areas').delete().eq('event_id', saved.id))
          if (areaIds.length) await run(sb.from('weather_event_areas').insert(areaIds.map((area_id) => ({ event_id: saved.id, area_id }))))
          m.close()
          toast(ev ? 'تم حفظ التعديلات' : 'تمت إضافة الحالة الجوية')
          refresh(saved.id)
        })
      } catch (err) {
        toast(toAppError(err).message, 'error')
      }
    })
  }
  $('#add-event').addEventListener('click', () => openForm())
  document.addEventListener('click', (e) => e.target.closest('[data-add-event]') && openForm())

  $('#notify').addEventListener('click', async (e) => {
    if (!current) return
    if (!(await confirmDialog({ title: 'إرسال تنبيه', message: `سيتم إرسال إشعار "${current.title}" لجميع الموظفين والمدراء. متابعة؟`, confirmText: 'إرسال' }))) return
    try {
      const n = await withBusy(e.currentTarget, () => API.notifyStaffWeather(current.id), 'جارٍ الإرسال...')
      toast(`تم إرسال التنبيه إلى ${n} موظف`)
    } catch (err) {
      toast(toAppError(err).message, 'error')
    }
  })

  await refresh()
})
