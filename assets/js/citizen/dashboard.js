/* لوحة المواطن: أرقام بلاغاته + آخر البلاغات + تنبيه التقييم */
App.page({ roles: ['citizen'] }, async ({ profile }) => {
  const hour = new Date().getHours()
  $('#greeting').textContent = (hour < 12 ? 'صباح الخير' : 'مساء الخير') + ' 👋'
  $('#first-name').textContent = (profile.full_name || '').split(' ')[0] || 'بك'

  // RLS تجعل dashboard_stats تحسب بلاغات المواطن فقط
  load($('#stats'), async () => {
    const s = await API.stats()
    $('#stats').innerHTML = [
      statCard({ label: 'إجمالي بلاغاتي', value: s.total, icon: 'file-text' }),
      statCard({ label: 'البلاغات الجديدة', value: s.new, icon: 'circle-dot', accent: 'info' }),
      statCard({ label: 'قيد المعالجة', value: s.in_progress, icon: 'loader', accent: 'warning' }),
      statCard({ label: 'تم الحل', value: s.done, icon: 'circle-check', accent: 'success' }),
    ].join('')
  })

  const latest = $('#latest')
  const data = await load(latest, () => API.complaints({ citizenId: profile.id, pageSize: 5 }))
  if (!data) return
  latest.innerHTML = data.rows.length
    ? data.rows.map((c) => complaintCard(c, `complaint.html?id=${c.id}`)).join('')
    : empty('file-text', 'لم تقدّم أي بلاغ بعد', 'أبلغ البلدية عن أي مشكلة في حيّك وتابعها حتى تُحل.', `<a class="btn btn-primary" href="new.html">${icon('plus')}قدّم أول بلاغ</a>`)

  // أول بلاغ مغلق بدون تقييم
  const closed = await API.complaints({ citizenId: profile.id, status: 'closed', pageSize: 20, fields: 'id, complaint_number, ratings:complaint_ratings(id)' }).catch(() => null)
  const toRate = closed?.rows.find((c) => !c.ratings?.length)
  if (toRate) {
    $('#rate-alert').innerHTML = alertBox('warning', 'بلاغ بانتظار تقييمك', `تم إغلاق البلاغ <b class="num">${esc(toRate.complaint_number)}</b>. شاركنا رأيك في جودة الخدمة. <a href="rate.html?id=${toRate.id}">قيّم الآن</a>`, 'star')
  }
})
