/* إنشاء بلاغ — نموذج من 4 خطوات */
;(() => {
  const STEPS = ['نوع المشكلة', 'التفاصيل والصور', 'الموقع', 'المراجعة والإرسال']
  const s = { step: 0, cat: getParam('cat'), pos: null }
  const title = $('#title')
  const desc = $('#desc')
  const district = $('#district')
  const landmark = $('#landmark')

  // أنواع المشاكل
  $('#tiles').innerHTML = categories
    .filter((c) => c.active)
    .map((c) => `<button type="button" class="tile" data-cat="${c.id}"><span class="icon-box">${icon(c.icon)}</span><b>${esc(c.name)}</b>${icon('circle-check', 'check-mark')}</button>`)
    .join('')
  $('#tiles').addEventListener('click', (e) => {
    const t = e.target.closest('[data-cat]')
    if (!t) return
    s.cat = t.dataset.cat
    paint()
  })

  district.innerHTML = '<option value="" disabled selected>اختر المنطقة</option>' + districts.map((d) => `<option value="${d.id}">${esc(d.name)}</option>`).join('')

  // الخريطة تُنشأ عند الوصول لخطوة الموقع (حتى تأخذ مقاسها الصحيح)
  let picker = null
  function ensureMap() {
    if (picker) return picker.map.invalidateSize()
    picker = Maps.picker($('#picker'), (latlng) => {
      s.pos = latlng
      $('#map-hint').hidden = true
      $('#coords').hidden = false
      $('#coords-val').textContent = `${latlng.lat.toFixed(5)}, ${latlng.lng.toFixed(5)}`
      $('#pos-field').classList.remove('is-invalid')
    })
  }
  $('#locate').addEventListener('click', () => {
    ensureMap()
    picker.set([MAP_CENTER[0] + 0.002, MAP_CENTER[1] - 0.003])
    district.value = 'z-1'
    paint()
  })

  desc.addEventListener('input', () => ($('#desc-count').textContent = desc.value.length))
  ;[title, desc, district, landmark].forEach((el) => el.addEventListener('input', paint))

  const valid = () => [!!s.cat, title.value.trim().length >= 5 && desc.value.trim().length >= 15, !!s.pos && !!district.value, true]
  const catObj = () => categories.find((c) => c.id === s.cat)

  function showErrors() {
    if (s.step === 0) $('#err-cat').hidden = !!s.cat
    if (s.step === 1) {
      title.closest('.field').classList.toggle('is-invalid', title.value.trim().length < 5)
      desc.closest('.field').classList.toggle('is-invalid', desc.value.trim().length < 15)
    }
    if (s.step === 2) {
      $('#pos-field').classList.toggle('is-invalid', !s.pos)
      district.closest('.field').classList.toggle('is-invalid', !district.value)
    }
  }

  function paint() {
    // مؤشر الخطوات
    $('#wsteps').innerHTML = STEPS.map(
      (label, i) => `<li class="${i < s.step ? 'done' : ''} ${i === s.step ? 'current' : ''}"><i></i><p><span class="n">${i < s.step ? icon('check') : i + 1}</span><span class="txt">${label}</span></p></li>`,
    ).join('')
    $$('[data-step]').forEach((p) => (p.hidden = Number(p.dataset.step) !== s.step))
    $$('.tile').forEach((t) => t.classList.toggle('active', t.dataset.cat === s.cat))
    $('#prev').disabled = s.step === 0
    $('#next').innerHTML = s.step === 3 ? `إرسال البلاغ${icon('send')}` : `التالي${icon('arrow-left')}`

    const cat = catObj()
    const dist = districts.find((d) => d.id === district.value)
    const summary = [
      ['النوع', cat?.name],
      ['القسم', cat && getDepartment(cat.departmentId).name],
      ['العنوان', title.value],
      ['المنطقة', dist?.name],
      ['المدة المتوقعة', cat && `${cat.slaDays} أيام عمل`],
    ]
    $('#summary').innerHTML = summary.map(([k, v]) => `<div class="summary-row"><span>${k}</span><span class="${v ? '' : 'c-3'}">${esc(v || '—')}</span></div>`).join('')

    if (s.step === 3) {
      const rows = [
        ['نوع المشكلة', cat?.name, 0],
        ['القسم المختص', cat && getDepartment(cat.departmentId).name, 0],
        ['العنوان', title.value, 1],
        ['الوصف', desc.value, 1],
        ['المنطقة', dist?.name, 2],
        ['الموقع', landmark.value || 'محدد على الخريطة', 2],
      ]
      $('#review').innerHTML = rows.map(([k, v, st]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd><button type="button" data-goto="${st}">تعديل</button></div>`).join('')
    }
  }

  $('#review').addEventListener('click', (e) => {
    const b = e.target.closest('[data-goto]')
    if (b) go(Number(b.dataset.goto))
  })

  function go(step) {
    s.step = step
    paint()
    if (step === 2) setTimeout(ensureMap, 0)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  $('#next').addEventListener('click', () => {
    showErrors()
    if (!valid()[s.step]) return
    if (s.step === 3) {
      $('#wizard').hidden = true
      $('#success').hidden = false
      window.scrollTo({ top: 0 })
      return
    }
    go(s.step + 1)
  })
  $('#prev').addEventListener('click', () => go(s.step - 1))
  $('#copy').addEventListener('click', () => {
    navigator.clipboard?.writeText('BL-2026-01481')
    toast('تم نسخ رقم البلاغ')
  })

  paint()
})()
