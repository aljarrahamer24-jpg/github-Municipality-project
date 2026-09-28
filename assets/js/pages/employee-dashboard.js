/* لوحة الموظف */
;(() => {
  const n = (fn) => complaints.filter(fn).length
  $('#stats').innerHTML = [
    statCard({ label: 'إجمالي البلاغات', value: complaints.length, icon: 'clipboard-list', trend: { value: '12%', up: true, good: false }, hint: 'عن الشهر الماضي' }),
    statCard({ label: 'البلاغات الجديدة', value: n((c) => c.status === 'new' || c.status === 'in_review'), icon: 'circle-dot', accent: 'info' }),
    statCard({ label: 'قيد المعالجة', value: n((c) => c.status === 'in_progress'), icon: 'loader', accent: 'warning' }),
    statCard({ label: 'البلاغات المتأخرة', value: n((c) => c.overdue), icon: 'triangle-alert', accent: 'error', hint: 'تجاوزت المدة المحددة' }),
    statCard({ label: 'البلاغات المغلقة', value: n((c) => c.status === 'closed' || c.status === 'resolved'), icon: 'lock', accent: 'success', cls: 'span-2 md-span-1' }),
  ].join('')
  createComplaintsTable($('#table'), { data: complaints, basePath: 'complaint.html', pageSize: 8 })
})()
