/* المشاكل المتكررة — بطاقات أو جدول + البلاغات المرتبطة */
;(() => {
  const TONE = { critical: 'error', high: 'warning', medium: 'info', low: 'neutral' }
  const sev = (r) => badge(severityLabels[r.severity], TONE[r.severity])

  $('#stats').innerHTML = [
    statCard({ label: 'مشاكل متكررة', value: recurringIssues.length, icon: 'repeat' }),
    statCard({ label: 'تحتاج صيانة جذرية', value: recurringIssues.filter((r) => r.severity === 'critical').length, icon: 'triangle-alert', accent: 'error' }),
    statCard({ label: 'بلاغات مرتبطة', value: recurringIssues.reduce((a, r) => a + r.count, 0), icon: 'wrench', accent: 'warning' }),
    statCard({ label: 'تكلفة تقديرية للتكرار', value: '18,400 د.أ', icon: 'calendar-days', accent: 'gold' }),
  ].join('')

  $('#cards').innerHTML = recurringIssues
    .map((r) => {
      const cat = getCategory(r.categoryId)
      return `<div class="card issue ${r.severity}">
        <div class="issue-bar"></div>
        <div class="issue-body">
          <div class="flex items-start justify-between gap-3">
            <div class="flex items-center gap-3"><span class="icon-box box-neutral">${icon(cat.icon)}</span><div><p class="text-xs c-3">المشكلة</p><p class="fw-600">${esc(cat.name)}</p></div></div>
            ${sev(r)}
          </div>
          <p class="flex items-start gap-2 text-sm c-2">${icon('map-pin')}${esc(r.location)}</p>
          <div class="issue-nums"><div><b>${r.count}</b><small>عدد البلاغات</small></div><div><b>${r.months}</b><small>${r.months > 10 ? 'شهراً' : 'أشهر'} (الفترة)</small></div></div>
          <div class="recommend">${icon('wrench')}<span><span class="c-3">الحالة: </span><b>${esc(r.recommendation)}</b></span></div>
        </div>
        <div class="card-footer"><button class="btn btn-secondary btn-block" data-related="${r.id}">عرض البلاغات المرتبطة</button></div>
      </div>`
    })
    .join('')

  $('#rows').innerHTML = recurringIssues
    .map(
      (r) => `<tr><td class="strong">${esc(getCategory(r.categoryId).name)}</td><td>${esc(r.location)}</td><td>${esc(getDistrict(r.districtId).name)}</td>
      <td class="strong">${r.count}</td><td>${r.months} أشهر</td><td>${sev(r)}</td><td class="c-ink">${esc(r.recommendation)}</td>
      <td><button class="btn btn-ghost btn-sm" data-related="${r.id}">البلاغات</button></td></tr>`,
    )
    .join('')

  // التبديل بين البطاقات والجدول
  $('#view').addEventListener('click', (e) => {
    const b = e.target.closest('[data-view]')
    if (!b) return
    $$('#view button').forEach((x) => x.classList.toggle('active', x === b))
    $('#cards').hidden = b.dataset.view !== 'cards'
    $('#table-view').hidden = b.dataset.view !== 'table'
  })

  // نافذة البلاغات المرتبطة
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-related]')
    if (!b) return
    const r = recurringIssues.find((x) => x.id === b.dataset.related)
    const m = modal({
      title: `البلاغات المرتبطة — ${getCategory(r.categoryId).name}`,
      body: `<p class="text-sm c-2 mb-3">${esc(r.location)} — ${r.count} بلاغات خلال ${r.months} أشهر</p><div data-t></div>`,
      size: 'lg',
    })
    createComplaintsTable($('[data-t]', m), { data: complaints.filter((c) => c.categoryId === r.categoryId).slice(0, r.count), basePath: 'complaint.html', showFilters: false, showAssignee: false, pageSize: 6 })
  })
})()
