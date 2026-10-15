/* دخول سريع بالحسابات التجريبية عبر رمز QR: auth/demo.html?as=admin|employee|citizen
   للعرض فقط — يُعطَّل من config.js (DEMO_LOGIN: false). الصلاحيات تبقى محمية بـ RLS حسب دور الحساب. */
App.page({}, async () => {
  const status = $('#demo-status')
  const alert = $('#form-alert')
  const fail = (msg) => {
    status.textContent = 'تعذّر الدخول السريع.'
    alert.hidden = false
    alert.innerHTML = alertBox('error', msg)
  }

  const key = new URLSearchParams(location.search).get('as')
  const account = APP_CONFIG.DEMO_LOGIN && APP_CONFIG.DEMO_ACCOUNTS?.[key]
  if (!account) return fail(APP_CONFIG.DEMO_LOGIN ? 'الرابط غير صحيح.' : 'الدخول السريع غير مفعّل.')

  status.textContent = `جارٍ الدخول بحساب ${account.label}...`
  try {
    // جلسة سابقة بحساب آخر تُغلق أولاً
    await sb.auth.signOut().catch(() => {})
    const data = await run(sb.auth.signInWithPassword({ email: account.email, password: APP_CONFIG.DEMO_PASSWORD }))
    const profile = await App.loadProfile(data.user.id)
    if (!profile || !profile.is_active) {
      await sb.auth.signOut()
      return fail('الحساب التجريبي غير موجود أو موقوف.')
    }
    App.go(App.homeUrl(profile.role))
  } catch (err) {
    fail(toAppError(err).message)
  }
})
