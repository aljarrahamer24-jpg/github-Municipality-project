/* إنشاء بلاغ — 4 خطوات: النوع ← التفاصيل والصور ← الموقع ← المراجعة والإرسال
   عند الإرسال: إنشاء البلاغ (الرقم والحالة والقسم يحددها الخادم) ← رفع الصور ← عرض رقم البلاغ
   سجل الحالة والإشعارات تُنشأ تلقائياً بواسطة Triggers في قاعدة البيانات. */
App.page({ roles: ['citizen'] }, async () => {
  const STEPS = ['نوع المشكلة', 'التفاصيل والصور', 'الموقع', 'المراجعة والإرسال']
  const s = { step: 0, cat: getParam('cat'), pos: null, sending: false }
  const title = $('#title')
  const desc = $('#desc')
  const district = $('#district')
  const landmark = $('#landmark')
  const uploader = $('#uploader')

  const [categories, areas] = await Promise.all([API.categories(), API.areas()])
  if (!categories.length) {
    $('#tiles').innerHTML = `<div style="grid-column:1/-1">${empty('tags', 'لا توجد أنواع مشاكل متاحة حالياً', 'تواصل مع البلدية لإضافة أنواع الخدمات.')}</div>`
  }
  if (!categories.some((c) => c.id === s.cat)) s.cat = null

  $('#tiles').innerHTML ||= categories
    .map((c) => `<button type="button" class="tile" data-cat="${c.id}"><span class="icon-box">${icon(safeIcon(c.icon))}</span><b>${esc(c.name)}</b>${icon('circle-check', 'check-mark')}</button>`)
    .join('')
  $('#tiles').addEventListener('click', (e) => {
    const t = e.target.closest('[data-cat]')
    if (!t) return
    s.cat = t.dataset.cat
    $('#err-cat').hidden = true
    paint()
  })

  fillSelect(district, areas.map((a) => [a.id, a.name]), { placeholder: 'اختر المنطقة' })

  // الخريطة تُنشأ عند الوصول لخطوة الموقع (حتى تأخذ مقاسها الصحيح)
  let picker = null
  const onPick = (latlng) => {
    s.pos = latlng
    $('#map-hint').hidden = true
    $('#coords').hidden = false
    $('#coords-val').textContent = `${latlng.lat.toFixed(5)}, ${latlng.lng.toFixed(5)}`
    $('#pos-field').classList.remove('is-invalid')
    // اقتراح المنطقة الأقرب تلقائياً (يمكن للمواطن تغييرها)
    const near = Maps.nearestArea(areas, latlng.lat, latlng.lng)
    if (near && !district.dataset.manual) district.value = near.id
    paint()
  }
  function ensureMap() {
    if (picker) return picker.map.invalidateSize()
    picker = Maps.picker($('#picker'), onPick)
  }
  district.addEventListener('change', () => (district.dataset.manual = '1'))

  $('#locate').addEventListener('click', (e) => {
    ensureMap()
    if (!navigator.geolocation) return toast('المتصفح لا يدعم تحديد الموقع، حدده على الخريطة يدوياً.', 'error')
    const btn = e.currentTarget
    btn.disabled = true
    navigator.geolocation.getCurrentPosition(
      (p) => {
        btn.disabled = false
        picker.set([p.coords.latitude, p.coords.longitude])
      },
      () => {
        btn.disabled = false
        toast('تعذر تحديد موقعك الحالي. اسمح للمتصفح بالوصول للموقع أو حدده على الخريطة.', 'error')
      },
      { enableHighAccuracy: true, timeout: 10000 },
    )
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
    $('#wsteps').innerHTML = STEPS.map(
      (label, i) => `<li class="${i < s.step ? 'done' : ''} ${i === s.step ? 'current' : ''}"><i></i><p><span class="n">${i < s.step ? icon('check') : i + 1}</span><span class="txt">${label}</span></p></li>`,
    ).join('')
    $$('[data-step]').forEach((p) => (p.hidden = Number(p.dataset.step) !== s.step))
    $$('.tile').forEach((t) => t.classList.toggle('active', t.dataset.cat === s.cat))
    $('#prev').disabled = s.step === 0 || s.sending
    $('#next').innerHTML = s.step === 3 ? `إرسال البلاغ${icon('send')}` : `التالي${icon('arrow-left')}`

    const cat = catObj()
    const dist = areas.find((d) => d.id === district.value)
    const summary = [
      ['النوع', cat?.name],
      ['القسم', cat?.department?.name],
      ['العنوان', title.value],
      ['المنطقة', dist?.name],
      ['المدة المتوقعة', cat && `${cat.sla_days} ${cat.sla_days > 2 && cat.sla_days < 11 ? 'أيام' : 'يوم'}`],
    ]
    $('#summary').innerHTML = summary.map(([k, v]) => `<div class="summary-row"><span>${k}</span><span class="${v ? '' : 'c-3'}">${esc(v || '—')}</span></div>`).join('')

    if (s.step === 3) {
      const files = uploader.getFiles()
      const rows = [
        ['نوع المشكلة', cat?.name, 0],
        ['القسم المختص', cat?.department?.name || 'يُحدد لاحقاً', 0],
        ['العنوان', title.value, 1],
        ['الوصف', desc.value, 1],
        ['الصور', files.length ? `${files.length} صورة` : 'بدون صور', 1],
        ['المنطقة', dist?.name, 2],
        ['الموقع', (landmark.value ? landmark.value + ' — ' : '') + (s.pos ? `${s.pos.lat.toFixed(5)}, ${s.pos.lng.toFixed(5)}` : ''), 2],
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

  async function submit() {
    const btn = $('#next')
    s.sending = true
    paint()
    try {
      const result = await withBusy(
        btn,
        () =>
          API.createComplaint(
            {
              categoryId: s.cat,
              title: title.value.trim(),
              description: desc.value.trim(),
              latitude: s.pos.lat,
              longitude: s.pos.lng,
              areaId: district.value,
              address: landmark.value.trim(),
            },
            uploader.getFiles(),
          ),
        'جارٍ إرسال البلاغ...',
      )
      $('#new-number').textContent = result.complaint_number
      $('#follow-link').href = `complaint.html?id=${result.id}`
      if (result.failedUploads.length) {
        $('#upload-warning').innerHTML = alertBox('warning', 'تم إنشاء البلاغ لكن تعذر رفع بعض الصور', result.failedUploads.map((f) => `${esc(f.file)}: ${esc(f.error)}`).join('<br>') + '<br>يمكنك إضافتها لاحقاً من صفحة البلاغ.')
      }
      $('#wizard').hidden = true
      $('#success').hidden = false
      window.scrollTo({ top: 0 })
    } catch (err) {
      toast(toAppError(err).message, 'error')
    } finally {
      s.sending = false
      paint()
    }
  }

  $('#next').addEventListener('click', () => {
    if (s.sending) return
    showErrors()
    if (!valid()[s.step]) return
    if (s.step === 3) return submit()
    go(s.step + 1)
  })
  $('#prev').addEventListener('click', () => go(s.step - 1))
  $('#copy').addEventListener('click', () => {
    navigator.clipboard?.writeText($('#new-number').textContent)
    toast('تم نسخ رقم البلاغ')
  })

  paint()
})
