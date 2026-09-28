/* متابعة بلاغ برقمه (بدون تسجيل دخول) — تعرض بيانات محدودة فقط بدون معلومات شخصية */
App.page({}, async () => {
  const form = $('#track-form')
  const input = $('#track-number')
  const out = $('#track-result')
  input.value = getParam('number') || ''

  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    const number = input.value.trim().toUpperCase()
    if (!/^BLD-\d{4}-\d{6}$/.test(number)) {
      out.innerHTML = '<div class="mt-6">' + alertBox('warning', 'صيغة الرقم غير صحيحة', 'رقم البلاغ يكون بالشكل: BLD-2026-000001') + '</div>'
      return
    }
    out.innerHTML = `<div class="card mt-6">${loadingBlock('جارٍ البحث...')}</div>`
    try {
      const c = await API.track(number)
      if (!c) {
        out.innerHTML = '<div class="mt-6">' + alertBox('error', 'لم يتم العثور على البلاغ', 'تأكد من كتابة رقم البلاغ بشكل صحيح، مثال: BLD-2026-000001') + '</div>'
        return
      }
      const history = c.history.map((h) => ({ new_status: h.status, created_at: h.created_at }))
      out.innerHTML = `<div class="card mt-6"><div class="card-body stack-lg">
        <div class="flex wrap justify-between items-start gap-3">
          <div><p class="text-xs c-3">رقم البلاغ</p><h2 class="text-lg fw-600 num mt-1">${esc(c.complaint_number)}</h2>
          <p class="text-sm c-2 mt-1">${esc(c.category || '')} · ${esc(c.area || '—')} · ${formatDate(c.created_at)}</p></div>
          ${statusBadge(c.status)}
        </div>
        ${stepper(c.status)}
        <p class="text-sm c-2" style="padding:12px;border-radius:10px;background:var(--canvas)">القسم المسؤول: <b class="c-ink">${esc(c.department || 'قيد التحديد')}</b></p>
        ${timeline(history)}
        <p class="text-xs c-3">لعرض التفاصيل الكاملة والتعليقات، <a class="link" href="auth/login.html">سجّل الدخول</a> بحسابك.</p>
      </div></div>`
    } catch (err) {
      showError(out, err, () => form.requestSubmit())
    }
  })
  if (input.value) form.requestSubmit()
})
