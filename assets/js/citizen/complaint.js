/* تفاصيل البلاغ للمواطن — RLS تمنع عرض أي بلاغ لا يملكه المواطن (حماية من IDOR) */
App.page({ roles: ['citizen'] }, async ({ profile }) => {
  const id = getParam('id')
  if (!id) return App.go('complaints.html')
  const main = $('#content')

  let c
  try {
    c = await API.complaint(id)
  } catch (err) {
    main.innerHTML = `<div class="card">${empty('search-x', 'البلاغ غير موجود', toAppError(err).message, `<a class="btn btn-primary" href="complaints.html">العودة لبلاغاتي</a>`)}</div>`
    return
  }

  document.title = `${c.complaint_number} | تفاصيل البلاغ`
  $('#crumb').textContent = c.complaint_number
  $('#title').innerHTML = `${esc(c.title)} ${statusBadge(c.status)}`
  $('#number').textContent = c.complaint_number
  $('#stepper').innerHTML = stepper(c.status)
  $('#description').textContent = c.description
  $('#address').textContent = [c.area?.name, c.address].filter(Boolean).join(' — ') || 'تم تحديد الموقع على الخريطة'
  Maps.location($('#map'), c.latitude, c.longitude)

  const info = [
    ['hash', 'رقم البلاغ', c.complaint_number],
    ['tag', 'نوع المشكلة', c.category?.name],
    ['building', 'القسم المسؤول', c.department?.name || 'قيد التحديد'],
    ['map-pin', 'المنطقة', c.area?.name || '—'],
    ['calendar-days', 'تاريخ الإنشاء', formatDateTime(c.created_at)],
    ['clock', 'آخر تحديث', formatDateTime(c.updated_at)],
  ]
  $('#info').innerHTML = info.map(([ic, k, v]) => `<div class="info-item"><span class="icon-box sm box-neutral">${icon(ic)}</span><dl><dt>${k}</dt><dd>${esc(v)}</dd></dl></div>`).join('')

  // الصور (روابط موقّعة مؤقتة)
  async function loadImages() {
    const imgs = await API.images(c.id)
    const mine = imgs.filter((i) => i.kind === 'citizen')
    const after = imgs.filter((i) => i.kind === 'after')
    $('#photos').outerHTML = mine.length ? `<div id="photos">${gallery(mine, { label: 'قبل' })}</div>` : `<p id="photos" class="text-sm c-3">لم يتم إرفاق صور.</p>`
    $('#after-wrap').hidden = !after.length
    $('#after').innerHTML = after.length ? gallery(after, { label: 'بعد' }) : ''
    return mine.length
  }
  const count = await load($('#photos'), loadImages)

  // إضافة صور لاحقاً طالما البلاغ مفتوح
  if (OPEN_STATUSES.includes(c.status) && (count ?? 0) < APP_CONFIG.MAX_IMAGES) {
    $('#add-photos').hidden = false
    $('#upload-more').addEventListener('click', async (e) => {
      const files = $('#more-photos').getFiles()
      if (!files.length) return toast('اختر صورة واحدة على الأقل', 'error')
      await withBusy(e.currentTarget, async () => {
        const failed = await API.uploadImages(c.id, 'citizen', files)
        $('#more-photos').clear()
        await loadImages()
        failed.length ? toast(`تعذر رفع ${failed.length} صورة: ${failed[0].error}`, 'error') : toast('تم رفع الصور')
      }, 'جارٍ الرفع...')
    })
  }

  // التعليقات
  const box = $('#comments')
  const drawComments = async () => (box.innerHTML = commentsList(await API.comments(c.id), { viewerId: profile.id }))
  load(box, drawComments)
  if (!['closed', 'rejected'].includes(c.status)) {
    composer($('#composer'), {
      onSubmit: async (text) => {
        await API.addComment(c.id, text)
        await drawComments()
        toast('تم إرسال التعليق')
      },
    })
  } else {
    $('#composer').innerHTML = `<p class="text-xs c-3 mt-3">البلاغ ${STATUS_LABELS[c.status]} — لا يمكن إضافة تعليقات جديدة.</p>`
  }

  load($('#timeline'), async () => ($('#timeline').innerHTML = timeline(await API.history(c.id))))

  // بطاقة التقييم للبلاغ المغلق
  if (c.status === 'closed') {
    const rating = await API.rating(c.id).catch(() => null)
    $('#rating-card').hidden = false
    $('#rating-card .card-body').innerHTML = rating
      ? `<div><p class="fw-600">شكراً لتقييمك</p><div class="flex items-center gap-2 text-sm c-2 mt-1">${stars(rating.rating, 'sm')} ${rating.rating} من 5</div>${rating.comment ? `<p class="text-sm c-2 mt-2">«${esc(rating.comment)}»</p>` : ''}</div>`
      : `<div><p class="fw-600">تم إغلاق البلاغ — كيف كانت الخدمة؟</p><p class="text-sm c-2 mt-1">تقييمك يساعدنا على تحسين الخدمات البلدية.</p></div>
         <a class="btn btn-accent" href="rate.html?id=${c.id}">${icon('star')}قيّم الخدمة</a>`
  }

  // تحديث الصفحة عند وصول إشعار يخص هذا البلاغ
  document.addEventListener('notification', (e) => {
    if (e.detail.complaint_id === c.id && !$('#composer textarea')?.value) setTimeout(() => location.reload(), 1500)
  })
})
