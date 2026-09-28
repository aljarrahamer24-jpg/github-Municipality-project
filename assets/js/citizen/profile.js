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
