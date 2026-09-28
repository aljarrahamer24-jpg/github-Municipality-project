/* متابعة بلاغ برقم المتابعة (بدون تسجيل دخول) */
;(() => {
  const form = $('#track-form')
  const out = $('#track-result')
  form.addEventListener('submit', (e) => {
    e.preventDefault()
    const q = $('#track-number').value.trim().toLowerCase()
    const c = complaints.find((x) => x.number.toLowerCase() === q)
    if (!c) {
      out.innerHTML = '<div class="mt-6">' + alertBox('error', 'لم يتم العثور على البلاغ', 'تأكد من كتابة رقم البلاغ بشكل صحيح، مثال: BL-2026-01480') + '</div>'
      return
    }
    out.innerHTML = `<div class="card mt-6"><div class="card-body stack-lg">
      <div class="flex wrap justify-between items-start gap-3">
        <div><p class="text-xs c-3 num">${c.number}</p><h2 class="text-lg fw-600 mt-1">${esc(c.title)}</h2>
        <p class="text-sm c-2 mt-1">${esc(getCategory(c.categoryId).name)} · ${esc(getDistrict(c.districtId).name)} · ${formatDate(c.createdAt)}</p></div>
        ${statusBadge(c.status)}
      </div>
      ${stepper(c.status)}
      <p class="text-sm c-2" style="padding:12px;border-radius:10px;background:var(--canvas)">القسم المسؤول: <b class="c-ink">${esc(getDepartment(c.departmentId).name)}</b></p>
      ${timeline(c.timeline)}
    </div></div>`
  })
  form.requestSubmit()
})()
