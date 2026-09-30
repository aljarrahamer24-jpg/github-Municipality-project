/* إنشاء حساب مواطن — الدور يُحدد في قاعدة البيانات دائماً "مواطن" */
App.page({ guestOnly: true }, async () => {
  const form = $('#register-form')
  const alert = $('#form-alert')

  API.areas()
    .then((areas) => fillSelect($('#area'), areas.map((a) => [a.id, a.name]), { placeholder: 'اختر المنطقة' }))
    .catch(() => {})
  API.departments({ activeOnly: true })
    .then((d) => fillSelect($('#staff-dept'), d.map((x) => [x.id, x.name]), { placeholder: 'اختر القسم' }))
    .catch(() => {})
  $('#is-staff').addEventListener('change', (e) => ($('#staff-fields').hidden = !e.target.checked))

  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    alert.hidden = true
    const v = {
      name: $('#full-name').value.trim(),
      phone: $('#phone').value.replace(/\s+/g, ''),
      email: $('#email').value.trim(),
      password: $('#password').value,
      password2: $('#password2').value,
      area: $('#area').value,
    }
    const checks = [
      [$('#full-name'), v.name.length >= 3],
      [$('#phone'), /^\+?\d{9,14}$/.test(v.phone)],
      [$('#email'), /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email)],
      [$('#password'), v.password.length >= 8 && /[A-Za-z؀-ۿ]/.test(v.password) && /\d/.test(v.password)],
      [$('#password2'), v.password2 === v.password && !!v.password2],
    ]
    let ok = true
    checks.forEach(([input, valid]) => {
      input.closest('.field').classList.toggle('is-invalid', !valid)
      if (!valid) ok = false
    })
    // طلب صلاحيات موظف: القسم مطلوب
    const isStaff = $('#is-staff').checked
    const staffOk = !isStaff || !!$('#staff-dept').value
    $('#staff-dept').closest('.field').classList.toggle('is-invalid', !staffOk)
    if (!staffOk) ok = false
    const terms = $('#terms').checked
    $('#terms-field').classList.toggle('is-invalid', !terms)
    if (!ok || !terms) return

    try {
      await withBusy($('button[type="submit"]', form), async () => {
        const data = await run(
          sb.auth.signUp({
            email: v.email,
            password: v.password,
            options: {
              // الدور لا يُرسل أبداً — قاعدة البيانات تنشئ الحساب "مواطن" دائماً، وطلب الموظف يُسجّل كطلب معلّق فقط
              data: {
                full_name: v.name,
                phone: v.phone,
                area_id: v.area || null,
                ...(isStaff && {
                  staff_request: { department_id: $('#staff-dept').value, job_title: $('#staff-title').value.trim(), employee_number: $('#staff-number').value.trim(), note: $('#staff-note').value.trim() },
                }),
              },
              emailRedirectTo: new URL('login.html', location.href).href,
            },
          }),
        )
        // عند تفعيل "تأكيد البريد" في Supabase لا تُنشأ جلسة حتى يؤكد المستخدم بريده
        if (data.user && data.user.identities && data.user.identities.length === 0) {
          throw new AppError('هذا البريد الإلكتروني مسجل مسبقاً.')
        }
        if (data.session) return App.go(App.homeUrl('citizen') + (isStaff ? '?reason=staff_request' : ''))
        $('#confirm-email').textContent = v.email
        $('#register-step').hidden = true
        $('#register-confirm').hidden = false
      }, 'جارٍ إنشاء الحساب...')
    } catch (err) {
      alert.hidden = false
      alert.innerHTML = alertBox('error', toAppError(err).message)
    }
  })
})
