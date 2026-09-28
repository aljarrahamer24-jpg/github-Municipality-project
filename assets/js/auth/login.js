/* تسجيل الدخول عبر Supabase Auth ثم التوجيه حسب الدور المخزن في profiles */
App.page({ guestOnly: true }, async () => {
  const form = $('#login-form')
  const alert = $('#form-alert')
  const showAlert = (msg) => {
    alert.hidden = false
    alert.innerHTML = alertBox('error', msg)
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    alert.hidden = true
    const email = $('#email').value.trim()
    const password = $('#password').value
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    setFieldError($('#email').closest('.field'), emailOk ? '' : 'أدخل بريداً إلكترونياً صحيحاً')
    setFieldError($('#password').closest('.field'), password ? '' : 'أدخل كلمة المرور')
    if (!emailOk || !password) return

    try {
      await withBusy($('button[type="submit"]', form), async () => {
        const data = await run(sb.auth.signInWithPassword({ email, password }))
        const profile = await App.loadProfile(data.user.id)
        if (!profile || !profile.is_active) {
          await sb.auth.signOut()
          throw new AppError('هذا الحساب موقوف. تواصل مع إدارة البلدية.')
        }
        App.go(App.homeUrl(profile.role))
      }, 'جارٍ الدخول...')
    } catch (err) {
      showAlert(toAppError(err).message)
    }
  })
})
