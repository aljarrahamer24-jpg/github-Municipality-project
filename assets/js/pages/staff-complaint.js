/* تفاصيل البلاغ للموظف / المدير: البيانات + الإجراءات + التعليقات الداخلية */
;(() => {
  const c = getComplaint(getParam('id') || '1480')
  const cat = getCategory(c.categoryId)
  document.title = `${c.number} | تفاصيل البلاغ`
  $('#crumb').textContent = c.number
  $('#title').innerHTML = `<span class="num">${c.number}</span>${statusBadge(c.status)}${priorityBadge(c.priority)}${c.overdue ? overdueBadge() : ''}`
  $('#subtitle').textContent = c.title

  // لوحة الإجراءات
  const opts = (entries, selected) => entries.map(([v, l]) => `<option value="${v}" ${v === selected ? 'selected' : ''}>${esc(l)}</option>`).join('')
  $('#status').innerHTML = opts(Object.entries(statusLabels), c.status)
  $('#priority').innerHTML = opts(Object.entries(priorityLabels), c.priority)
  $('#department').innerHTML = opts(departments.map((d) => [d.id, d.name.replace('قسم ', '')]), c.departmentId)
  $('#assignee').innerHTML = '<option value="">غير محدد</option>' + opts(employeesList.map((e) => [e, e]), c.assignee)
  const toggleAfter = () => ($('#after-upload').hidden = !['resolved', 'closed'].includes($('#status').value))
  $('#status').addEventListener('change', toggleAfter)
  toggleAfter()
  $('#save').addEventListener('click', () => {
    $('#saved').hidden = false
    toast('تم حفظ التحديث وإشعار المواطن')
  })

  // البيانات
  const info = [
    ['tag', 'نوع المشكلة', cat.name],
    ['building', 'القسم المسؤول', getDepartment(c.departmentId).name],
    ['map-pin', 'المنطقة', c.address],
    ['calendar-days', 'تاريخ البلاغ', formatDateTime(c.createdAt)],
    ['timer', 'المدة المحددة (SLA)', `${cat.slaDays} أيام`],
    ['user', 'الموظف المسؤول', c.assignee || 'غير محدد'],
  ]
  $('#info').innerHTML = info.map(([ic, k, v]) => `<div class="info-item"><span class="icon-box sm box-neutral">${icon(ic)}</span><dl><dt>${k}</dt><dd>${esc(v)}</dd></dl></div>`).join('')
  $('#description').textContent = c.description

  // الصور قبل/بعد
  $('#count-before').textContent = c.images.length
  $('#count-after').textContent = c.afterImages?.length || 0
  $('#pane-before').innerHTML = `<div class="photos">${c.images.map((_, i) => `<button class="photo-btn" data-seed="${i}">${photo(i, `صورة ${i + 1}`, 'wide')}</button>`).join('')}</div>`
  $('#pane-after').innerHTML = c.afterImages
    ? `<div class="photos">${c.afterImages.map(() => `<button class="photo-btn" data-seed="3">${photo(3, 'بعد', 'wide')}</button>`).join('')}</div>`
    : `<p class="text-center text-sm c-3" style="padding:24px 0">لم يتم رفع صور بعد المعالجة. غيّر الحالة إلى "تم الحل" لرفع صور الإنجاز.</p>`
  document.addEventListener('click', (e) => {
    const b = e.target.closest('.photo-btn')
    if (b) modal({ title: 'معاينة الصورة', body: photo(Number(b.dataset.seed), '', 'video'), size: 'lg' })
  })

  $('#address').textContent = c.address
  $('#gmaps').href = `https://maps.google.com/?q=${c.lat},${c.lng}`
  Maps.location($('#map'), c.lat, c.lng)

  const box = $('#comments')
  box.innerHTML = comments(c.comments, 'staff', true)
  bindComposer(box, 'staff')

  $('#citizen').innerHTML = `<p class="flex items-center gap-2">${icon('user', 'c-3')}${esc(c.citizen)}</p>
    <p class="flex items-center gap-2">${icon('phone', 'c-3')}<span class="ltr">079 000 0001</span></p>
    <p class="flex items-center gap-2">${icon('mail', 'c-3')}citizen@example.com</p>`
  $('#timeline').innerHTML = timeline(c.timeline)
})()
