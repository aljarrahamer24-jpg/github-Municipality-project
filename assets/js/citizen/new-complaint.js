/* إنشاء بلاغ — 4 خطوات: النوع ← التفاصيل والصور ← الموقع ← المراجعة والإرسال
   عند الإرسال: كشف البلاغات المكررة القريبة ← إنشاء البلاغ (الرقم والحالة والقسم يحددها الخادم) ← رفع الصور
   سجل الحالة والإشعارات تُنشأ تلقائياً بواسطة Triggers في قاعدة البيانات.
   البلاغ السريع بالذكاء الاصطناعي (صورة / نص / صوت) يعبّئ نفس الخطوات فقط، والمواطن يراجع قبل الإرسال. */
App.page({ roles: ['citizen'] }, async () => {
  const STEPS = ['نوع المشكلة', 'التفاصيل والصور', 'الموقع', 'المراجعة والإرسال']
  const s = { step: 0, cat: getParam('cat'), pos: null, sending: false, ai: null }
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
  // إذا لم تكن منطقة المواطن ضمن القائمة يكتبها بنفسه (تُحفظ ضمن العنوان، والبلاغ بدون ربط بمنطقة مسجلة)
  district.insertAdjacentHTML('beforeend', '<option value="__other">منطقتي غير موجودة — سأكتبها</option>')
  const districtOther = $('#district-other')
  const otherArea = () => (district.value === '__other' ? districtOther.value.trim() : '')
  Maps.useAreasCenter(areas)

  // الخريطة تُنشأ عند الوصول لخطوة الموقع (حتى تأخذ مقاسها الصحيح)
  let picker = null
  const onPick = (latlng) => {
    s.pos = latlng
    $('#map-hint').hidden = true
    $('#coords').hidden = false
    $('#coords-val').textContent = `${latlng.lat.toFixed(5)}, ${latlng.lng.toFixed(5)}`
    $('#pos-field').classList.remove('is-invalid')
    // اقتراح المنطقة الأقرب تلقائياً (يمكن للمواطن تغييرها)
    // اقتراح أقرب منطقة فقط إذا كانت ضمن 3 كم (وإلا فالموقع خارج مناطق البلدية المسجلة)
    const near = Maps.nearestArea(areas, latlng.lat, latlng.lng, 3000)
    if (!district.dataset.manual) district.value = near ? near.id : ''
    $('#area-far').hidden = !!near || !areas.some((a) => a.latitude != null)
    paint()
  }
  function ensureMap() {
    if (picker) return picker.map.invalidateSize()
    picker = Maps.picker($('#picker'), onPick)
    if (s.pos) picker.set([s.pos.lat, s.pos.lng]) // موقع GPS الذي حُدد من البلاغ السريع
  }
  district.addEventListener('change', () => {
    district.dataset.manual = '1'
    $('#district-other-field').hidden = district.value !== '__other'
    if (district.value === '__other') districtOther.focus()
  })
  districtOther.addEventListener('input', paint)

  $('#locate').addEventListener('click', (e) => {
    ensureMap()
    if (!navigator.geolocation) return toast('المتصفح لا يدعم تحديد الموقع، حدده على الخريطة يدوياً.', 'error')
    const btn = e.currentTarget
    btn.disabled = true
    toast('جارٍ تحديد موقعك...', 'info')
    navigator.geolocation.getCurrentPosition(
      (p) => {
        btn.disabled = false
        picker.set([p.coords.latitude, p.coords.longitude])
        const acc = p.coords.accuracy
        // أجهزة اللابتوب غالباً بدون GPS: الموقع تقديري من الإنترنت وقد يبعد كيلومترات
        acc > 300
          ? toast(`تم تحديد موقعك لكنه تقريبي (بدقة ${acc >= 1000 ? Math.round(acc / 1000) + ' كم' : Math.round(acc) + ' م'} تقريباً). اضغط على الخريطة أو اسحب الدبوس لمكان المشكلة بالضبط.`, 'info')
          : toast('تم تحديد موقعك الحالي')
      },
      (err) => {
        btn.disabled = false
        toast(
          err.code === 1
            ? 'لم يُسمح للموقع باستخدام موقعك. اضغط على أيقونة القفل بجانب رابط الصفحة واسمح بالوصول للموقع، أو حدده على الخريطة.'
            : 'تعذر تحديد موقعك الحالي. حدده على الخريطة بالضغط على مكان المشكلة.',
          'error',
        )
      },
      { enableHighAccuracy: true, timeout: 10000 },
    )
  })

  desc.addEventListener('input', () => ($('#desc-count').textContent = desc.value.length))
  ;[title, desc, district, landmark].forEach((el) => el.addEventListener('input', paint))

  const areaOk = () => !!district.value && (district.value !== '__other' || otherArea().length >= 2)
  const valid = () => [!!s.cat, title.value.trim().length >= 5 && desc.value.trim().length >= 15, !!s.pos && areaOk(), true]
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
      $('#district-other-field').classList.toggle('is-invalid', district.value === '__other' && otherArea().length < 2)
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
    const dist = areas.find((d) => d.id === district.value) || (otherArea() ? { name: otherArea() } : null)
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
      $('#ai-review').hidden = !s.ai
      if (s.ai)
        $('#ai-review').innerHTML = alertBox(
          'info',
          'تمت تعبئة البلاغ بمساعدة الذكاء الاصطناعي',
          `راجع البيانات وعدّلها إن لزم. درجة الاستعجال المقترحة: <b>${URGENCY_LABELS[s.ai.urgency] || '—'}</b>${s.ai.notes ? ` — ${esc(s.ai.notes)}` : ''}`,
        )
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

  // كشف البلاغات المكررة: بلاغ مفتوح من نفس النوع ضمن 50 متراً (حساب جغرافي في قاعدة البيانات)
  function duplicateDialog(list) {
    return new Promise((resolve) => {
      const item = (n) => `<div class="dup-item">
          <div class="flex items-center gap-3" style="min-width:0">
            <span class="icon-box sm box-neutral">${icon(safeIcon(n.category_icon))}</span>
            <div style="min-width:0"><p class="fw-600 text-sm">${esc(n.category_name)} ${statusBadge(n.status)}</p>
            <p class="text-xs c-3 mt-1">على بعد ${n.distance_m} م · ${esc(n.area_name || '')} · ${formatDate(n.created_at)}${n.confirmations ? ` · أكده ${n.confirmations} مواطن` : ''}</p></div>
          </div>
          ${n.is_mine
            ? `<a class="btn btn-ghost btn-sm nowrap" href="complaint.html?id=${n.id}">بلاغك</a>`
            : `<button type="button" class="btn btn-primary btn-sm nowrap" data-same="${n.id}">نعم، نفس المشكلة</button>`}
        </div>`
      const m = modal({
        title: 'يوجد بلاغ مشابه بالقرب منك',
        body: `<p class="text-sm c-2 mb-4 leading-loose">يبدو أن هناك بلاغاً مفتوحاً عن نفس المشكلة بالقرب من موقعك. إذا كانت هي نفسها، سنضيف تأكيدك وملاحظتك وصورك للبلاغ الموجود بدلاً من إنشاء بلاغ مكرر.</p>${list.map(item).join('')}`,
        footer: `<button type="button" class="btn btn-ghost" data-close>إلغاء</button><button type="button" class="btn btn-outline" data-new>لا، مشكلة مختلفة — أنشئ بلاغاً جديداً</button>`,
      })
      let done = false
      const finish = (v) => {
        done = true
        m.close()
        resolve(v)
      }
      m.addEventListener('click', (e) => {
        const same = e.target.closest('[data-same]')
        if (same) finish({ same: same.dataset.same })
        if (e.target.closest('[data-new]')) finish({ create: true })
      })
      new MutationObserver((_, obs) => {
        if (!document.body.contains(m)) {
          obs.disconnect()
          if (!done) resolve({ cancel: true })
        }
      }).observe(document.body, { childList: true })
    })
  }

  function showSuccess({ number, id, contributed, failed = [] }) {
    $('#new-number').textContent = number
    $('#follow-link').href = contributed ? `../track.html?number=${encodeURIComponent(number)}` : `complaint.html?id=${id}`
    if (contributed) {
      $('#success h1').textContent = 'تم تسجيل تأكيدك على البلاغ الموجود'
      $('#success h1 + p').textContent = 'شكراً لك. أضفنا ملاحظتك إلى البلاغ القائم بدلاً من إنشاء بلاغ مكرر، وستصلك إشعارات عند تحديث حالته.'
    }
    if (failed.length) {
      $('#upload-warning').innerHTML = alertBox('warning', 'تم الإرسال لكن تعذر رفع بعض الصور', failed.map((f) => `${esc(f.file)}: ${esc(f.error)}`).join('<br>'))
    }
    $('#wizard').hidden = true
    $('#success').hidden = false
    window.scrollTo({ top: 0 })
  }

  async function submit() {
    const btn = $('#next')
    // 1) كشف التكرار قبل الإنشاء (لا يمنع الإرسال إذا تعذر الفحص)
    const near = await AI.nearby(s.pos.lat, s.pos.lng, s.cat).catch(() => [])
    if (near.length) {
      const choice = await duplicateDialog(near)
      if (choice.cancel) return
      if (choice.same) {
        s.sending = true
        paint()
        try {
          const r = await withBusy(btn, async () => {
            const res = await AI.confirmDuplicate(choice.same, s.pos.lat, s.pos.lng, desc.value.trim())
            const files = uploader.getFiles()
            const failed = files.length ? await API.uploadImages(res.complaint_id, 'citizen', files) : []
            return { ...res, failed }
          }, 'جارٍ الإرسال...')
          showSuccess({ number: r.complaint_number, contributed: true, failed: r.failed })
        } catch (err) {
          toast(toAppError(err).message, 'error')
        } finally {
          s.sending = false
          paint()
        }
        return
      }
    }
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
              areaId: district.value === '__other' ? null : district.value,
              address: [otherArea() && `المنطقة: ${otherArea()}`, landmark.value.trim()].filter(Boolean).join(' — '),
            },
            uploader.getFiles(),
          ),
        'جارٍ إرسال البلاغ...',
      )
      if (s.ai?.analysis_id) AI.linkAnalysis(s.ai.analysis_id, result.id).catch(() => {}) // حفظ اقتراح الذكاء الاصطناعي للموظف
      showSuccess({ number: result.complaint_number, id: result.id, failed: result.failedUploads })
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
  /* ---------- البلاغ السريع بالذكاء الاصطناعي ---------- */
  const aiStatus = (type, text) => {
    $('#ai-status').hidden = !text
    $('#ai-status').innerHTML = !text ? '' : type === 'busy' ? `<p class="flex items-center gap-2 text-sm c-2">${icon('loader', 'spin')}${esc(text)}</p>` : alertBox(type, esc(text))
  }
  const getPosition = () =>
    new Promise((resolve, reject) => {
      if (!navigator.geolocation) return reject(new Error('unsupported'))
      navigator.geolocation.getCurrentPosition((p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy }), reject, { enableHighAccuracy: true, timeout: 10000 })
    })

  async function applySuggestion(r, file) {
    s.ai = r
    if (r.category_id) s.cat = r.category_id
    if (r.title) title.value = r.title
    if (r.description) desc.value = r.description
    $('#desc-count').textContent = desc.value.length
    if (r.location_text && !landmark.value) landmark.value = r.location_text
    if (file) uploader.addFiles([file])
    // الموقع من GPS الجهاز فقط — لا يُخمَّن من الذكاء الاصطناعي
    aiStatus('busy', 'جارٍ تحديد موقعك من GPS...')
    const pos = await getPosition().catch(() => null)
    if (pos) (picker ? picker.set([pos.lat, pos.lng]) : onPick(pos))
    aiStatus('', '')
    // الانتقال لأول خطوة تحتاج إكمالاً، أو للمراجعة مباشرة
    const v = valid()
    let next = v.findIndex((ok, i) => i < 3 && !ok)
    // الموقع التقريبي (أجهزة بدون GPS تقدّر الموقع من الإنترنت) يحتاج تأكيداً على الخريطة
    const rough = pos && pos.accuracy > 300
    if (next === -1 && rough) next = 2
    if (!r.category_id) toast('لم نتمكن من تحديد نوع المشكلة بدقة، اختره من القائمة.', 'info')
    else if (!pos) toast('لم نتمكن من تحديد موقعك تلقائياً. حدده على الخريطة.', 'info')
    else if (rough) toast(`الموقع تقريبي (بدقة ${Math.round(pos.accuracy / 1000) || 1} كم تقريباً). حرّك الدبوس لمكان المشكلة بالضبط.`, 'info')
    else toast('تمت تعبئة البلاغ — راجعه قبل الإرسال')
    go(next === -1 ? 3 : next)
    showErrors()
  }

  async function runAI(fn, busyText, file) {
    $$('#ai-photo, #ai-mic, #ai-analyze').forEach((b) => (b.disabled = true))
    aiStatus('busy', busyText)
    try {
      await applySuggestion(await fn(), file)
    } catch (err) {
      if (file) uploader.addFiles([file])
      aiStatus('error', `${toAppError(err).message} يمكنك إكمال البلاغ يدوياً${file ? ' — أضفنا صورتك للبلاغ' : ''}.`)
    } finally {
      $$('#ai-photo, #ai-mic, #ai-analyze').forEach((b) => (b.disabled = false))
    }
  }

  $('#ai-photo').addEventListener('click', () => $('#ai-photo-input').click())
  $('#ai-photo-input').addEventListener('change', async (e) => {
    const f = e.target.files[0]
    e.target.value = ''
    if (!f) return
    if (!/^image\/(jpeg|png|webp)$/.test(f.type)) return aiStatus('error', 'يرجى اختيار صورة JPG أو PNG أو WEBP.')
    const img = await AI.compressImage(f)
    runAI(() => AI.analyzeImage(img, $('#ai-text').value.trim()), 'جارٍ تحليل الصورة...', img)
  })
  const analyzeText = () => {
    const t = $('#ai-text').value.trim()
    if (t.length < 3) return aiStatus('error', 'اكتب وصفاً قصيراً للمشكلة أولاً.')
    runAI(() => AI.analyzeText(t), 'جارٍ فهم وصف المشكلة...')
  }
  $('#ai-analyze').addEventListener('click', analyzeText)

  let stopListening = null
  $('#ai-mic').addEventListener('click', (e) => {
    const btn = e.currentTarget
    if (stopListening) return stopListening()
    if (!AI.speechSupported()) {
      aiStatus('info', 'متصفحك لا يدعم الإدخال الصوتي (يعمل في Chrome وEdge). اكتب المشكلة في المربع بدلاً من ذلك.')
      return $('#ai-text').focus()
    }
    btn.classList.add('recording')
    $('span', btn).textContent = 'إيقاف التسجيل'
    aiStatus('busy', 'أستمع إليك... تحدث بالمشكلة ثم اضغط إيقاف.')
    const reset = () => {
      stopListening = null
      btn.classList.remove('recording')
      $('span', btn).textContent = 'تحدّث بالمشكلة'
    }
    stopListening = AI.listen({
      onText: (t) => ($('#ai-text').value = t),
      onEnd: () => {
        reset()
        if ($('#ai-text').value.trim().length >= 3) analyzeText()
        else aiStatus('', '')
      },
      onError: (msg) => {
        reset()
        aiStatus('error', msg)
      },
    })
  })

  $('#copy').addEventListener('click', () => {
    navigator.clipboard?.writeText($('#new-number').textContent)
    toast('تم نسخ رقم البلاغ')
  })

  paint()
})
