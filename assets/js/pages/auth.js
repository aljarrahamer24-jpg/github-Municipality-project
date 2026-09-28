/* صفحات المصادقة (عرض تجريبي — لا يوجد تحقق حقيقي) */
;(() => {
  // تسجيل الدخول: اختيار الدور ثم التوجيه لواجهته
  const login = $('#login-form')
  if (login) {
    let role = 'citizen'
    $$('.role-opt').forEach((b) =>
      b.addEventListener('click', () => {
        role = b.dataset.role
        $$('.role-opt').forEach((x) => x.classList.toggle('active', x === b))
      }),
    )
    login.addEventListener('submit', (e) => {
      e.preventDefault()
      const btn = $('button[type="submit"]', login)
      btn.innerHTML = '<span class="spinner"></span>جارٍ الدخول...'
      btn.disabled = true
      setTimeout(() => (location.href = `../${role}/index.html`), 500)
    })
  }

  // إنشاء حساب: تحقق بسيط من الحقول الإلزامية
  const register = $('#register-form')
  if (register) {
    register.addEventListener('submit', (e) => {
      e.preventDefault()
      let ok = true
      $$('[data-required]', register).forEach((f) => {
        const input = $('input', f)
        const bad = !input.value.trim()
        f.classList.toggle('is-invalid', bad)
        if (bad) ok = false
      })
      const [p1, p2] = $$('input[type="password"]', register)
      const mismatch = p1.value !== p2.value
      p2.closest('.field').classList.toggle('is-invalid', mismatch || !p2.value)
      if (ok && !mismatch) location.href = '../citizen/index.html'
    })
  }

  // نسيت كلمة المرور: عرض شاشة "تحقق من بريدك"
  const forgot = $('#forgot-form')
  if (forgot) {
    forgot.addEventListener('submit', (e) => {
      e.preventDefault()
      $('#forgot-step').hidden = true
      $('#forgot-sent').hidden = false
    })
    $('#resend').addEventListener('click', () => toast('تمت إعادة إرسال الرابط'))
  }

  // إعادة التعيين: مؤشر قوة كلمة المرور
  const reset = $('#reset-form')
  if (reset) {
    const pw = $('#new-password')
    const rules = [
      [(v) => v.length >= 8, '8 أحرف على الأقل'],
      [(v) => /[A-Z]/.test(v), 'حرف كبير واحد على الأقل'],
      [(v) => /\d/.test(v), 'رقم واحد على الأقل'],
      [(v) => /[^A-Za-z0-9]/.test(v), 'رمز خاص (!@#...)'],
    ]
    const update = () => {
      const passed = rules.map(([fn]) => fn(pw.value))
      const n = passed.filter(Boolean).length
      $('#strength').innerHTML = [0, 1, 2, 3].map((i) => `<span class="${i < n ? (n < 3 ? 'weak' : 'strong') : ''}"></span>`).join('')
      $('#rules').innerHTML = rules.map(([, label], i) => `<li class="${passed[i] ? 'ok' : ''}">${icon(passed[i] ? 'circle-check' : 'circle')}${label}</li>`).join('')
      $('button[type="submit"]', reset).disabled = n < 3
    }
    pw.addEventListener('input', update)
    update()
    reset.addEventListener('submit', (e) => {
      e.preventDefault()
      $('#reset-step').hidden = true
      $('#reset-done').hidden = false
    })
  }
})()
