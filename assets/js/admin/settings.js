/* إعدادات النظام — قراءة وحفظ جدول app_settings (الكتابة للمدير فقط عبر RLS) */
App.page({ roles: ['admin'] }, async () => {
  const settings = await API.settings()
  const fields = $$('[data-setting]')
  fields.forEach((el) => {
    const [key, field] = el.dataset.setting.split('.')
    const v = settings[key]?.[field]
    if (v !== undefined && v !== null) el.value = v
  })

  $('#save-settings').addEventListener('click', async (e) => {
    const next = JSON.parse(JSON.stringify(settings))
    let ok = true
    fields.forEach((el) => {
      const [key, field] = el.dataset.setting.split('.')
      next[key] ||= {}
      let v = el.value.trim()
      if (el.dataset.type === 'number') {
        v = Number(v)
        const bad = !Number.isFinite(v) || v < Number(el.min || -Infinity) || v > Number(el.max || Infinity)
        el.closest('.field').classList.toggle('is-invalid', bad)
        if (bad) ok = false
      }
      next[key][field] = v
    })
    if (!ok) return toast('بعض القيم خارج النطاق المسموح', 'error')
    try {
      await withBusy(e.currentTarget, () => API.saveSettings(next))
      Object.assign(settings, next)
      toast('تم حفظ الإعدادات')
    } catch (err) {
      toast(toAppError(err).message, 'error')
    }
  })

  // تمييز القسم الحالي في القائمة الجانبية
  const links = $$('.settings-nav a')
  const setActive = (id) => links.forEach((a) => a.classList.toggle('active', a.getAttribute('href') === '#' + id))
  const io = new IntersectionObserver((entries) => entries.forEach((en) => en.isIntersecting && setActive(en.target.id)), { rootMargin: '-30% 0px -60% 0px' })
  links.forEach((a) => {
    const sec = $(a.getAttribute('href'))
    if (sec) io.observe(sec)
  })
})
