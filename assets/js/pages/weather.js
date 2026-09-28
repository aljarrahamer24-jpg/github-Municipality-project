/* الاستعداد للحالات الجوية */
;(() => {
  const w = weatherAlerts[0]
  $('#w-icon').innerHTML = icon(w.icon)
  $('#w-type').textContent = w.type
  $('#w-desc').textContent = w.description
  $('#w-start').textContent = formatDate(w.start)
  $('#w-end').textContent = formatDate(w.end)
  $('#w-rain').textContent = w.rainfall
  $('#w-wind').textContent = w.wind
  $('#w-temp').textContent = w.temp

  const RISK = { high: ['error', 'خطورة عالية'], medium: ['warning', 'خطورة متوسطة'], low: ['success', 'خطورة منخفضة'] }
  const max = Math.max(...sensitiveAreas.map((a) => a.floods))
  $('#areas').innerHTML = sensitiveAreas
    .map((a) => {
      const d = getDistrict(a.districtId)
      return `<div class="area-row">
        <div class="stack-sm">
          <div class="area-title">${icon('map-pin')}<p class="fw-600">${esc(d.name)}</p><span class="c-3">—</span><p class="fw-600 c-error">${a.floods} بلاغ فيضانات سابقة</p>${badge(RISK[a.risk][1], RISK[a.risk][0])}</div>
          <p class="text-xs c-3">آخر حادثة: ${a.lastIncident} · إجراءات مقترحة: ${a.actions.join('، ')}</p>
        </div>
        ${progress((a.floods / max) * 100, a.risk === 'high' ? 'error' : a.risk === 'medium' ? 'warning' : 'success')}
      </div>`
    })
    .join('')

  Maps.risk(
    $('#risk-map'),
    sensitiveAreas.map((a) => {
      const d = getDistrict(a.districtId)
      return { name: d.name, lat: d.lat, lng: d.lng, count: a.floods, risk: a.risk }
    }),
  )

  // قائمة الاستعداد
  const tasks = ['تنظيف مناهل تصريف الأمطار في وسط البلد', 'تجهيز مضخات الشفط الاحتياطية', 'رفع جاهزية فرق الطوارئ', 'إغلاق النفق عند ارتفاع المنسوب', 'إشعار سكان المناطق الحساسة', 'التنسيق مع الدفاع المدني']
  const list = $('#tasks')
  list.innerHTML = tasks.map((t, i) => `<label class="check"><input type="checkbox" ${i < 3 ? 'checked' : ''}><span class="${i < 3 ? 'done-task' : ''}">${t}</span></label>`).join('')
  const count = () => ($('#tasks-count').textContent = `${$$('input:checked', list).length} من ${tasks.length} مهام مكتملة`)
  list.addEventListener('change', (e) => {
    e.target.nextElementSibling.classList.toggle('done-task', e.target.checked)
    count()
  })
  count()

  $('#upcoming').innerHTML = weatherAlerts
    .map(
      (a) => `<div class="flex wrap items-center gap-4" style="padding:16px 20px">
      <span class="icon-box box-info">${icon(a.icon)}</span>
      <div class="flex-1"><p class="fw-600">${esc(a.type)}</p><p class="text-sm c-3">${formatDate(a.start)} — ${formatDate(a.end)}</p></div>
      ${a.severity === 'high' ? badge('مرتفع', 'error', 'triangle-alert') : badge('متوسط', 'warning', 'info')}
    </div>`,
    )
    .join('')
})()
