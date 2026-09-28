/* لوحة المواطن */
;(() => {
  const n = (fn) => myComplaints.filter((c) => fn(c.status)).length
  $('#stats').innerHTML = [
    statCard({ label: 'إجمالي بلاغاتي', value: myComplaints.length, icon: 'file-text' }),
    statCard({ label: 'البلاغات الجديدة', value: n((s) => s === 'new' || s === 'in_review'), icon: 'circle-dot', accent: 'info' }),
    statCard({ label: 'قيد المعالجة', value: n((s) => s === 'in_progress'), icon: 'loader', accent: 'warning' }),
    statCard({ label: 'تم الحل', value: n((s) => s === 'resolved' || s === 'closed'), icon: 'circle-check', accent: 'success' }),
  ].join('')

  const toRate = myComplaints.find((c) => c.status === 'closed' && !c.rating)
  if (toRate) {
    $('#rate-alert').innerHTML = alertBox('warning', 'بلاغ بانتظار تقييمك', `تم إغلاق البلاغ <b class="num">${toRate.number}</b>. شاركنا رأيك في جودة الخدمة. <a href="rate.html?id=${toRate.id}">قيّم الآن</a>`, 'star')
  }

  $('#latest').innerHTML = myComplaints.slice(0, 5).map((c) => complaintCard(c, `complaint.html?id=${c.id}`)).join('')
})()
