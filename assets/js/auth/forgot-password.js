/* طلب رابط إعادة تعيين كلمة المرور عبر البريد */
App.page({}, async () => {
  const form = $('#forgot-form')
  const alert = $('#form-alert')
  let lastEmail = ''

  const send = (email) =>
    run(sb.auth.resetPasswordForEmail(email, { redirectTo: new URL('reset-password.html', location.href).href }))

  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    alert.hidden = true
    const email = $('#email').value.trim()
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    $('#email').closest('.field').classList.toggle('is-invalid', !ok)
    if (!ok) return
    try {
      await withBusy($('button[type="submit"]', form), () => send(email), 'جارٍ الإرسال...')
      lastEmail = email
      $('#forgot-step').hidden = true
      $('#forgot-sent').hidden = false
    } catch (err) {
      alert.hidden = false
      alert.innerHTML = alertBox('error', toAppError(err).message)
    }
  })

  $('#resend').addEventListener('click', async (e) => {
    try {
      await withBusy(e.currentTarget, () => send(lastEmail), 'جارٍ الإرسال...')
      toast('تمت إعادة إرسال الرابط')
    } catch (err) {
      toast(toAppError(err).message, 'error')
    }
  })
})
