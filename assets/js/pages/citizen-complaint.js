/* تفاصيل البلاغ للمواطن */
;(() => {
  const c = getComplaint(getParam('id') || '1480')
  document.title = `${c.number} | تفاصيل البلاغ`
  $('#crumb').textContent = c.number
  $('#title').innerHTML = `${esc(c.title)} ${statusBadge(c.status)}`
  $('#number').textContent = c.number
  $('#stepper').innerHTML = stepper(c.status)
  $('#description').textContent = c.description
  $('#photos').innerHTML = c.images.map((_, i) => photo(i, 'قبل')).join('')
  if (c.afterImages) {
    $('#after-wrap').hidden = false
    $('#after').innerHTML = c.afterImages.map(() => photo(3, 'بعد')).join('')
  }
  $('#address').textContent = c.address
  Maps.location($('#map'), c.lat, c.lng)

  const box = $('#comments')
  box.innerHTML = comments(c.comments, 'citizen')
  bindComposer(box, 'citizen')

  // بطاقة التقييم للبلاغ المغلق
  if (c.status === 'closed') {
    $('#rating-card').hidden = false
    $('#rating-card .card-body').innerHTML = c.rating
      ? `<div><p class="fw-600">شكراً لتقييمك</p><div class="flex items-center gap-2 text-sm c-2 mt-1">${stars(c.rating, 'sm')} ${c.rating} من 5</div></div>`
      : `<div><p class="fw-600">تم إغلاق البلاغ — كيف كانت الخدمة؟</p><p class="text-sm c-2 mt-1">تقييمك يساعدنا على تحسين الخدمات البلدية.</p></div>
         <a class="btn btn-accent" href="rate.html?id=${c.id}">${icon('star')}قيّم الخدمة</a>`
  }

  const info = [
    ['hash', 'رقم البلاغ', c.number],
    ['tag', 'نوع المشكلة', getCategory(c.categoryId).name],
    ['building', 'القسم المسؤول', getDepartment(c.departmentId).name],
    ['map-pin', 'المنطقة', c.address],
    ['calendar-days', 'تاريخ الإنشاء', formatDateTime(c.createdAt)],
  ]
  $('#info').innerHTML = info.map(([ic, k, v]) => `<div class="info-item"><span class="icon-box sm box-neutral">${icon(ic)}</span><dl><dt>${k}</dt><dd>${esc(v)}</dd></dl></div>`).join('')
  $('#timeline').innerHTML = timeline(c.timeline)
})()
