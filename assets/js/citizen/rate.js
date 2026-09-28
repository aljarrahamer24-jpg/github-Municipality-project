/* تقييم الخدمة — مرة واحدة فقط وللبلاغ المغلق (مفروض في قاعدة البيانات) */
App.page({ roles: ['citizen'] }, async () => {
  const id = getParam('id')
  const wrap = $('#rate-form')
  let c
  try {
    c = await API.complaint(id)
  } catch (err) {
    wrap.innerHTML = empty('search-x', 'البلاغ غير موجود', toAppError(err).message, `<a class="btn btn-primary" href="complaints.html">بلاغاتي</a>`)
    return
  }
  const existing = await API.rating(c.id)
  if (c.status !== 'closed' || existing) {
    wrap.innerHTML = existing
      ? empty('star', 'تم تقييم هذا البلاغ مسبقاً', `تقييمك: ${existing.rating} من 5. شكراً لك.`, `<a class="btn btn-primary" href="complaint.html?id=${c.id}">عرض البلاغ</a>`)
      : empty('lock', 'لا يمكن التقييم الآن', 'يمكن تقييم الخدمة بعد إغلاق البلاغ فقط.', `<a class="btn btn-primary" href="complaint.html?id=${c.id}">عرض البلاغ</a>`)
    return
  }

  $('#number').textContent = c.complaint_number
  $('#subject').textContent = `${c.title} — ${c.category?.name || ''}`
  const LABELS = ['', 'سيئة جداً', 'سيئة', 'مقبولة', 'جيدة', 'ممتازة']
  const GOOD = ['سرعة الاستجابة', 'جودة العمل', 'تعامل الموظفين', 'وضوح التحديثات']
  const BAD = ['تأخير في الحل', 'الحل غير كامل', 'لا يوجد تواصل', 'المشكلة تكررت']
  let rating = 0

  starInput($('#stars'), (v) => {
    rating = v
    const label = $('#rate-label')
    label.textContent = LABELS[v]
    label.className = 'rate-label ' + (v >= 4 ? 'good' : 'bad')
    $('#tags-wrap').hidden = false
    $('#tags-title').textContent = v >= 4 ? 'ما الذي أعجبك؟' : 'ما الذي يمكن تحسينه؟'
    $('#tags').innerHTML = (v >= 4 ? GOOD : BAD).map((t) => `<button type="button" class="chip">${t}</button>`).join('')
    $('#submit').disabled = false
  })
  $('#tags').addEventListener('click', (e) => e.target.closest('.chip')?.classList.toggle('active'))
  $('#submit').addEventListener('click', async (e) => {
    if (!rating) return
    const tags = $$('#tags .chip.active').map((b) => b.textContent)
    try {
      await withBusy(e.currentTarget, () => API.rate(c.id, rating, $('#comment').value.trim(), tags), 'جارٍ الإرسال...')
      $('#rate-form').hidden = true
      $('#thanks').hidden = false
    } catch (err) {
      toast(toAppError(err).message, 'error')
    }
  })
})
