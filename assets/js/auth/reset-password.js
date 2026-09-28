/* تعيين كلمة مرور جديدة بعد فتح الرابط المرسل للبريد (جلسة استرداد مؤقتة) */
App.page({}, async () => {
  const show = (id) => ['reset-loading', 'reset-invalid', 'reset-step', 'reset-done'].forEach((x) => ($('#' + x).hidden = x !== id))

  // رابط منتهي أو غير صالح يصل مع error في العنوان
  const hash = new URLSearchParams(location.hash.slice(1))
  if (hash.get('error') || getParam('error')) return show('reset-invalid')

  let recovered = false
  sb.auth.onAuthStateChange((event) => {
    if (event === 'PASSWORD_RECOVERY') {
      recovered = true
      show('reset-step')
    }
  })
  const { data } = await sb.auth.getSession()
  if (data.session) show('reset-step')
  else setTimeout(() => !recovered && show('reset-invalid'), 1500)

  const pw = $('#new-password')
  const rules = [
    [(v) => v.length >= 8, '8 أحرف على الأقل'],
    [(v) => /[A-Za-z؀-ۿ]/.test(v), 'تحتوي على حروف'],
    [(v) => /\d/.test(v), 'رقم واحد على الأقل'],
    [(v) => /[^A-Za-z0-9؀-ۿ]/.test(v), 'رمز خاص (!@#...)'],
  ]
  const update = () => {
    const passed = rules.map(([fn]) => fn(pw.value))
    const n = passed.filter(Boolean).length
    $('#strength').innerHTML = [0, 1, 2, 3].map((i) => `<span class="${i < n ? (n < 3 ? 'weak' : 'strong') : ''}"></span>`).join('')
    $('#rules').innerHTML = rules.map(([, label], i) => `<li class="${passed[i] ? 'ok' : ''}">${icon(passed[i] ? 'circle-check' : 'circle')}${label}</li>`).join('')
    $('button[type="submit"]', $('#reset-form')).disabled = !(passed[0] && passed[1] && passed[2])
  }
  pw.addEventListener('input', update)
  update()

  $('#reset-form').addEventListener('submit', async (e) => {
    e.preventDefault()
    const same = $('#confirm-password').value === pw.value
    $('#confirm-password').closest('.field').classList.toggle('is-invalid', !same)
    if (!same) return
    try {
      await withBusy($('button[type="submit"]', e.target), () => run(sb.auth.updateUser({ password: pw.value })))
      const { data: u } = await sb.auth.getUser()
      const profile = u.user ? await App.loadProfile(u.user.id) : null
      if (profile) $('#go-home').href = App.homeUrl(profile.role)
      show('reset-done')
    } catch (err) {
      const box = $('#form-alert')
      box.hidden = false
      box.innerHTML = alertBox('error', toAppError(err).message)
    }
  })
})
