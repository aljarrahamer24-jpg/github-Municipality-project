/* تقييم الخدمة بعد إغلاق البلاغ */
;(() => {
  const c = getComplaint(getParam('id') || '1479')
  $('#number').textContent = c.number
  $('#subject').textContent = `${c.title} — ${getCategory(c.categoryId).name}`
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
  $('#submit').addEventListener('click', () => {
    if (!rating) return
    $('#rate-form').hidden = true
    $('#thanks').hidden = false
  })
})()
