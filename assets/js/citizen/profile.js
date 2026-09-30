/* حسابي — تعديل البيانات الشخصية (الدور والقسم محميان في قاعدة البيانات) */
App.page({ roles: ['citizen'] }, async ({ profile }) => {
  const areas = await API.areas()
  const fill = (p) => {
    $('#avatar').textContent = initials(p.full_name)
    $('#display-name').textContent = p.full_name || p.email
    $('#member-since').textContent = `عضو منذ ${formatMonth(p.created_at)}`
    $('#full-name').value = p.full_name || ''
    $('#phone').value = p.phone || ''
    $('#email').value = p.email || ''
    fillSelect($('#area'), areas.map((a) => [a.id, a.name]), { placeholder: 'غير محدد', value: p.area_id })
    $$('[data-pref]').forEach((el) => (el.checked = p.preferences?.[el.dataset.pref] !== false))
  }
  fill(profile)

  $('#profile-form').addEventListener('submit', async (e) => {
    e.preventDefault()
    const name = $('#full-name').value.trim()
    const phone = $('#phone').value.replace(/\s+/g, '')
    const okName = name.length >= 3
    const okPhone = !phone || /^\+?\d{9,14}$/.test(phone)
    $('#full-name').closest('.field').classList.toggle('is-invalid', !okName)
    $('#phone').closest('.field').classList.toggle('is-invalid', !okPhone)
    if (!okName || !okPhone) return
    const preferences = { ...(profile.preferences || {}) }
    $$('[data-pref]').forEach((el) => (preferences[el.dataset.pref] = el.checked))
    try {
      const updated = await withBusy($('button[type="submit"]', e.target), () =>
        API.update('profiles', profile.id, { full_name: name, phone: phone || null, area_id: $('#area').value || null, preferences }),
      )
      Object.assign(profile, updated)
      fill(profile)
      $$('.user-btn .who b').forEach((b) => (b.textContent = name))
      toast('تم حفظ التغييرات')
    } catch (err) {
      toast(toAppError(err).message, 'error')
    }
  })

  /* ---------- طلب صلاحيات موظف ---------- */
  const STATUS = { pending: ['بانتظار موافقة المدير', 'warning'], approved: ['تمت الموافقة', 'success'], rejected: ['مرفوض', 'error'], cancelled: ['ملغى', 'neutral'] }
  async function loadStaffRequest() {
    const [reqs, depts] = await Promise.all([
      run(sb.from('staff_requests').select('*, department:departments(name)').eq('user_id', profile.id).order('created_at', { ascending: false }).limit(1)),
      API.departments({ activeOnly: true }),
    ])
    const r = reqs[0]
    $('#staff-request').hidden = false
    if (r && r.status === 'pending') {
      $('#staff-request-body').innerHTML = `<div class="flex wrap items-center justify-between gap-2">
        <div><p class="fw-600">${esc(r.department?.name || '')}${r.job_title ? ` — ${esc(r.job_title)}` : ''}</p><p class="text-xs c-3 mt-1">أُرسل في ${formatDate(r.created_at)}</p></div>
        ${badge(STATUS.pending[0], STATUS.pending[1])}</div>`
      $('#staff-request-foot').innerHTML = `<button type="button" class="btn btn-ghost" id="cancel-staff">إلغاء الطلب</button>`
      $('#cancel-staff').addEventListener('click', async (e) => {
        if (!(await confirmDialog({ title: 'إلغاء الطلب', message: 'هل تريد إلغاء طلب صلاحيات الموظف؟', confirmText: 'إلغاء الطلب', danger: true }))) return
        await withBusy(e.currentTarget, () => run(sb.rpc('cancel_staff_request')))
        location.reload()
      })
      return
    }
    fillSelect($('#staff-dept'), depts.map((d) => [d.id, d.name]), { placeholder: 'اختر القسم' })
    if (r) $('#staff-request-body').insertAdjacentHTML('afterbegin', `<p class="text-sm c-2 mb-3">آخر طلب: ${badge(...STATUS[r.status])}${r.review_note ? ` — ${esc(r.review_note)}` : ''}</p>`)
  }
  loadStaffRequest().catch(() => {})
  $('#staff-request').addEventListener('submit', async (e) => {
    e.preventDefault()
    const dept = $('#staff-dept')?.value
    if (!dept) return $('#staff-dept').closest('.field').classList.add('is-invalid')
    try {
      await withBusy($('button[type="submit"]', e.target), () =>
        run(sb.rpc('submit_staff_request', { p_department: dept, p_job_title: $('#staff-title').value.trim() || null, p_employee_number: $('#staff-number').value.trim() || null, p_note: $('#staff-note').value.trim() || null })),
      )
      toast('تم إرسال طلبك إلى مدير النظام')
      location.reload()
    } catch (err) {
      toast(toAppError(err).message, 'error')
    }
  })

  $('#password-form').addEventListener('submit', async (e) => {
    e.preventDefault()
    const p1 = $('#new-password').value
    const p2 = $('#new-password2').value
    const ok1 = p1.length >= 8 && /[A-Za-z؀-ۿ]/.test(p1) && /\d/.test(p1)
    $('#new-password').closest('.field').classList.toggle('is-invalid', !ok1)
    $('#new-password2').closest('.field').classList.toggle('is-invalid', p1 !== p2)
    if (!ok1 || p1 !== p2) return
    try {
      await withBusy($('button[type="submit"]', e.target), () => run(sb.auth.updateUser({ password: p1 })))
      e.target.reset()
      toast('تم تحديث كلمة المرور')
    } catch (err) {
      toast(toAppError(err).message, 'error')
    }
  })
})
