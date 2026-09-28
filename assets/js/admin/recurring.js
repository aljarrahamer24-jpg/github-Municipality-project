/* المشاكل المتكررة — دالة recurring_problems في PostgreSQL:
   نفس النوع + مسافة ≤ R متر (Haversine) + خلال آخر M شهر + عدد ≥ N ← مجموعة متكررة */
App.page({ roles: ['admin'] }, async () => {
  const TONE = { critical: 'error', high: 'warning', medium: 'info' }
  const SEV = { critical: 'حرجة', high: 'مرتفعة', medium: 'متوسطة' }
  const sev = (r) => badge(SEV[r.severity], TONE[r.severity])
  const days = (d) => (d >= 60 ? `${Math.round(d / 30)} أشهر` : `${d} يوم`)
  let list = []

  const settings = (await API.settings().catch(() => ({}))).recurring || {}
  $('#p-radius').value = settings.radius_m ?? 200
  $('#p-months').value = settings.months ?? 6
  $('#p-min').value = settings.min_count ?? 3

  async function analyze() {
    const opts = { radius: Number($('#p-radius').value), months: Number($('#p-months').value), minCount: Number($('#p-min').value) }
    list = await load($('#cards'), () => API.recurring(opts), 'جارٍ تحليل البلاغات...')
    if (!list) return
    $('#stats').innerHTML = [
      statCard({ label: 'مشاكل متكررة', value: list.length, icon: 'repeat' }),
      statCard({ label: 'تحتاج صيانة جذرية', value: list.filter((r) => r.severity === 'critical' || r.complaints_count >= 6).length, icon: 'triangle-alert', accent: 'error' }),
      statCard({ label: 'بلاغات مرتبطة', value: list.reduce((a, r) => a + r.complaints_count, 0), icon: 'wrench', accent: 'warning' }),
      statCard({ label: 'ما زالت مفتوحة', value: list.reduce((a, r) => a + r.open_count, 0), icon: 'clock', accent: 'gold' }),
    ].join('')

    if (!list.length) {
      $('#cards').innerHTML = `<div style="grid-column:1/-1" class="card">${empty('repeat', 'لا توجد مشاكل متكررة', 'لم يتم العثور على مجموعات تحقق الشروط الحالية. جرّب زيادة المسافة أو الفترة الزمنية.')}</div>`
      $('#rows').innerHTML = ''
      return
    }
    $('#cards').innerHTML = list
      .map(
        (r, i) => `<div class="card issue ${r.severity}">
        <div class="issue-bar"></div>
        <div class="issue-body">
          <div class="flex items-start justify-between gap-3">
            <div class="flex items-center gap-3"><span class="icon-box box-neutral">${icon(safeIcon(r.category_icon))}</span><div><p class="text-xs c-3">المشكلة</p><p class="fw-600">${esc(r.category_name)}</p></div></div>
            ${sev(r)}
          </div>
          <p class="flex items-start gap-2 text-sm c-2">${icon('map-pin')}${esc(r.area_name || 'غير محدد')} <span class="c-3 ltr text-xs">(${r.center_lat.toFixed(4)}, ${r.center_lng.toFixed(4)})</span></p>
          <div class="issue-nums"><div><b>${r.complaints_count}</b><small>عدد البلاغات</small></div><div><b>${days(r.period_days)}</b><small>الفترة</small></div></div>
          <p class="text-xs c-3">من ${formatDate(r.first_at)} إلى ${formatDate(r.last_at)} · مفتوحة: ${r.open_count}</p>
          <div class="recommend">${icon('wrench')}<span><span class="c-3">الحالة: </span><b>${esc(r.recommendation)}</b></span></div>
        </div>
        <div class="card-footer"><button class="btn btn-secondary btn-block" data-related="${i}">عرض البلاغات المرتبطة</button></div>
      </div>`,
      )
      .join('')
    $('#rows').innerHTML = list
      .map(
        (r, i) => `<tr><td class="strong">${esc(r.category_name)}</td><td class="ltr text-xs">${r.center_lat.toFixed(4)}, ${r.center_lng.toFixed(4)}</td><td>${esc(r.area_name || '—')}</td>
        <td class="strong">${r.complaints_count}</td><td>${days(r.period_days)}</td><td>${sev(r)}</td><td class="c-ink">${esc(r.recommendation)}</td>
        <td><button class="btn btn-ghost btn-sm" data-related="${i}">البلاغات</button></td></tr>`,
      )
      .join('')
  }

  $('#params').addEventListener('submit', (e) => {
    e.preventDefault()
    analyze()
  })

  $('#view').addEventListener('click', (e) => {
    const b = e.target.closest('[data-view]')
    if (!b) return
    $$('#view button').forEach((x) => x.classList.toggle('active', x === b))
    $('#cards').hidden = b.dataset.view !== 'cards'
    $('#table-view').hidden = b.dataset.view !== 'table'
  })

  // نافذة البلاغات المرتبطة: خريطة المواقع + جدول البلاغات
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-related]')
    if (!b) return
    const r = list[Number(b.dataset.related)]
    const m = modal({
      title: `البلاغات المرتبطة — ${esc(r.category_name)}`,
      body: `<p class="text-sm c-2 mb-3">${esc(r.area_name || '')} — ${r.complaints_count} بلاغات خلال ${days(r.period_days)}</p>
        <div data-map class="h-64 mb-4"></div><div data-t></div>`,
      size: 'lg',
    })
    createComplaintsTable($('[data-t]', m), { basePath: 'complaint.html', showFilters: false, showAssignee: false, pageSize: 6, fixed: { ids: r.complaint_ids } })
    API.complaints({ ids: r.complaint_ids, pageSize: 100, fields: 'id, complaint_number, title, status, created_at, latitude, longitude' })
      .then(({ rows }) => {
        const mp = Maps.complaints($('[data-map]', m), (c) => (location.href = `complaint.html?id=${c.id}`))
        mp.draw(rows, 'both')
      })
      .catch(() => {})
  })

  analyze()
})
