/* تفاصيل البلاغ للموظف والمدير: تغيير الحالة/الأولوية/الإسناد، ملاحظات داخلية، صور المعالجة
   كل تغيير يمر عبر دالة update_complaint في قاعدة البيانات التي تسجل السجل وترسل الإشعارات،
   وRLS + Triggers تمنع الموظف من تعديل بلاغات خارج قسمه أو تغيير الحقول المحظورة. */
App.page({ roles: ['employee', 'admin'] }, async ({ profile }) => {
  const id = getParam('id')
  if (!id) return App.go('complaints.html')
  const isAdmin = profile.role === 'admin'
  const main = $('#content')

  let c
  try {
    c = await API.complaint(id)
  } catch (err) {
    main.innerHTML = `<div class="card">${empty('search-x', 'البلاغ غير موجود', toAppError(err).message, `<a class="btn btn-primary" href="complaints.html">العودة للبلاغات</a>`)}</div>`
    return
  }

  const cat = c.category || {}
  function renderHeader() {
    document.title = `${c.complaint_number} | تفاصيل البلاغ`
    $('#crumb').textContent = c.complaint_number
    $('#title').innerHTML = `<span class="num">${esc(c.complaint_number)}</span>${statusBadge(c.status)}${priorityBadge(c.priority)}${isOverdue(c) ? overdueBadge() : ''}`
    $('#subtitle').textContent = c.title
    const info = [
      ['tag', 'نوع المشكلة', cat.name],
      ['building', 'القسم المسؤول', c.department?.name || 'غير محدد'],
      ['map-pin', 'المنطقة', [c.area?.name, c.address].filter(Boolean).join(' — ') || '—'],
      ['calendar-days', 'تاريخ البلاغ', formatDateTime(c.created_at)],
      ['timer', 'الموعد النهائي (SLA)', `${formatDateTime(c.due_at)}${cat.sla_days ? ` (${cat.sla_days} أيام)` : ''}`],
      ['user', 'الموظف المسؤول', c.assignee?.full_name || 'غير محدد'],
    ]
    $('#info').innerHTML = info.map(([ic, k, v]) => `<div class="info-item"><span class="icon-box sm box-neutral">${icon(ic)}</span><dl><dt>${k}</dt><dd>${esc(v)}</dd></dl></div>`).join('')
  }
  renderHeader()
  $('#description').textContent = c.description
  $('#address').textContent = [c.area?.name, c.address].filter(Boolean).join(' — ')
  $('#gmaps').href = `https://www.google.com/maps?q=${c.latitude},${c.longitude}`
  Maps.location($('#map'), c.latitude, c.longitude)
  $('#citizen').innerHTML = c.citizen
    ? `<p class="flex items-center gap-2">${icon('user', 'c-3')}${esc(c.citizen.full_name || '—')}</p>
       <p class="flex items-center gap-2">${icon('phone', 'c-3')}<span class="ltr">${esc(c.citizen.phone || '—')}</span></p>
       <p class="flex items-center gap-2">${icon('mail', 'c-3')}<span class="ltr">${esc(c.citizen.email || '—')}</span></p>`
    : '<p class="c-3">غير متاح</p>'

  /* ---------- لوحة الإجراءات ---------- */
  const [departments, staff] = await Promise.all([API.departments(), API.staff()])
  const statusSel = $('#status')
  const final = ['closed', 'rejected'].includes(c.status) && !isAdmin
  fillSelect(statusSel, Object.entries(STATUS_LABELS), { value: c.status })
  fillSelect($('#priority'), Object.entries(PRIORITY_LABELS), { value: c.priority })
  fillSelect($('#department'), departments.filter((d) => d.is_active || d.id === c.department_id).map((d) => [d.id, d.name.replace(/^قسم /, '')]), { value: c.department_id, placeholder: 'غير محدد' })
  $('#department').disabled = !isAdmin // تحويل البلاغ لقسم آخر من صلاحيات المدير
  const fillAssignees = () => {
    const dept = $('#department').value
    const list = staff.filter((s) => s.role === 'employee' && (!dept || s.department_id === dept))
    fillSelect($('#assignee'), list.map((s) => [s.id, s.full_name || '—']), { placeholder: 'غير محدد', value: c.assigned_employee_id })
  }
  fillAssignees()
  $('#department').addEventListener('change', fillAssignees)
  if (final) {
    $$('#status, #priority, #assignee, #status-note, #save').forEach((el) => (el.disabled = true))
    $('#saved').hidden = false
    $('#saved').innerHTML = alertBox('info', 'البلاغ مغلق', 'لا يمكن تعديل البلاغ بعد إغلاقه أو رفضه. يمكن للمدير إعادة فتحه عند الحاجة.')
  }

  const kindSel = $('#image-kind')
  statusSel.addEventListener('change', () => {
    if (['resolved', 'closed'].includes(statusSel.value)) kindSel.value = 'after'
  })

  $('#save').addEventListener('click', async (e) => {
    const files = $('#staff-uploader').getFiles()
    const changes = {
      id: c.id,
      status: statusSel.value !== c.status ? statusSel.value : null,
      priority: $('#priority').value !== c.priority ? $('#priority').value : null,
      departmentId: isAdmin && $('#department').value && $('#department').value !== c.department_id ? $('#department').value : null,
      assigneeId: $('#assignee').value && $('#assignee').value !== c.assigned_employee_id ? $('#assignee').value : null,
      clearAssignee: !$('#assignee').value && !!c.assigned_employee_id,
      note: $('#status-note').value.trim(),
    }
    const hasChange = changes.status || changes.priority || changes.departmentId || changes.assigneeId || changes.clearAssignee
    if (!hasChange && !files.length) return toast('لم يتم تغيير أي شيء', 'error')
    if (changes.status === 'resolved' && !files.length && !imagesCache.some((i) => i.kind === 'after')) {
      const go = await confirmDialog({ title: 'بدون صور إنجاز؟', message: 'لم يتم إرفاق صور بعد المعالجة. هل تريد تغيير الحالة إلى "تم الحل" بدون صور؟', confirmText: 'متابعة' })
      if (!go) return
    }
    try {
      await withBusy(e.currentTarget, async () => {
        if (files.length) {
          const failed = await API.uploadImages(c.id, kindSel.value, files)
          if (failed.length) toast(`تعذر رفع ${failed.length} صورة: ${failed[0].error}`, 'error')
          $('#staff-uploader').clear()
        }
        if (hasChange) await API.updateComplaint(changes)
      })
      c = await API.complaint(c.id)
      renderHeader()
      fillSelect(statusSel, Object.entries(STATUS_LABELS), { value: c.status })
      $('#status-note').value = ''
      $('#saved').hidden = false
      $('#saved').innerHTML = alertBox('success', 'تم حفظ التحديث', hasChange ? 'تم تسجيل التغيير في سجل الحالات وإشعار المواطن.' : 'تم رفع الصور.')
      loadTimeline()
      loadImages()
    } catch (err) {
      $('#saved').hidden = false
      $('#saved').innerHTML = alertBox('error', 'تعذر الحفظ', esc(toAppError(err).message))
    }
  })

  /* ---------- الصور ---------- */
  let imagesCache = []
  async function loadImages() {
    const imgs = await API.images(c.id)
    imagesCache = imgs
    const before = imgs.filter((i) => i.kind !== 'after')
    const after = imgs.filter((i) => i.kind === 'after')
    $('#count-before').textContent = before.length
    $('#count-after').textContent = after.length
    $('#pane-before').innerHTML = before.length ? gallery(before, { label: 'قبل', cls: 'wide' }) : `<p class="text-center text-sm c-3" style="padding:24px 0">لا توجد صور.</p>`
    $('#pane-after').innerHTML = after.length ? gallery(after, { label: 'بعد', cls: 'wide' }) : `<p class="text-center text-sm c-3" style="padding:24px 0">لم يتم رفع صور بعد المعالجة بعد. استخدم "صور المعالجة" في لوحة الإجراءات.</p>`
  }
  load($('#pane-before'), loadImages)

  /* ---------- التعليقات + الملاحظات الداخلية (دمج حسب الوقت) ---------- */
  const box = $('#comments')
  async function loadComments() {
    const [comments, notes] = await Promise.all([API.comments(c.id), API.notes(c.id)])
    const all = [...comments.map((x) => ({ ...x, _internal: false })), ...notes.map((x) => ({ ...x, _internal: true }))].sort((a, b) => a.created_at.localeCompare(b.created_at))
    if (!all.length) return (box.innerHTML = commentsList([]))
    box.innerHTML = `<ul class="comments">${all
      .map((x) => commentsList([x], { viewerId: profile.id, internal: x._internal }).replace(/^<ul class="comments">|<\/ul>$/g, ''))
      .join('')}</ul>`
  }
  load(box, loadComments)
  composer($('#composer'), {
    placeholder: 'اكتب رداً للمواطن أو ملاحظة داخلية...',
    onSubmit: async (text) => {
      const internal = $('#note-internal').checked
      internal ? await API.addNote(c.id, text) : await API.addComment(c.id, text)
      await loadComments()
      toast(internal ? 'تمت إضافة الملاحظة الداخلية' : 'تم إرسال الرد للمواطن')
    },
  })
  $('#composer .flex').insertAdjacentHTML('afterbegin', '<label class="check"><input type="checkbox" id="note-internal" checked> ملاحظة داخلية (لا تظهر للمواطن)</label>')
  $('#composer .flex').classList.replace('justify-end', 'justify-between')
  $('#note-internal').addEventListener('change', (e) => ($('#composer textarea').placeholder = e.target.checked ? 'اكتب ملاحظة داخلية (لا تظهر للمواطن)...' : 'اكتب رداً يظهر للمواطن...'))

  /* ---------- Timeline ---------- */
  const loadTimeline = () => load($('#timeline'), async () => ($('#timeline').innerHTML = timeline(await API.history(c.id))))
  loadTimeline()

  document.addEventListener('notification', (e) => {
    if (e.detail.complaint_id === c.id && e.detail.type === 'comment') loadComments()
  })
})
