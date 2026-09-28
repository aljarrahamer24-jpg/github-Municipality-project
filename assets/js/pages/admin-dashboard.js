/* لوحة المدير */
;(() => {
  const k = adminKpis
  $('#kpis').innerHTML = [
    statCard({ label: 'إجمالي البلاغات', value: formatNumber(k.total), icon: 'clipboard-list', trend: { value: '8%', up: true, good: false }, hint: 'عن الفترة السابقة' }),
    statCard({ label: 'البلاغات الجديدة', value: k.newCount, icon: 'circle-dot', accent: 'info' }),
    statCard({ label: 'قيد المعالجة', value: k.inProgress, icon: 'loader', accent: 'warning' }),
    statCard({ label: 'المغلقة', value: formatNumber(k.closed), icon: 'circle-check', accent: 'success', hint: '78% نسبة الإغلاق' }),
    statCard({ label: 'متوسط زمن الإغلاق', value: `${k.avgCloseDays} يوم`, icon: 'timer', accent: 'neutral', trend: { value: '0.6 يوم', up: false, good: true } }),
    statCard({ label: 'متوسط رضا المواطنين', value: `${k.satisfaction} من 5`, icon: 'face-slightly-smiling', accent: 'gold', trend: { value: '0.1', up: true } }),
  ].join('')

  Charts.area($('#chart-month'), monthlyTrend, [
    { key: 'received', name: 'المستلمة', color: Charts.SERIES[0] },
    { key: 'closed', name: 'المغلقة', color: Charts.SERIES[2] },
  ])
  Charts.hbar($('#chart-category'), byCategory)
  Charts.hbar($('#chart-department'), byDepartment)
  Charts.hbar($('#chart-district'), byDistrict)

  createComplaintsTable($('#latest'), { data: complaints.slice(0, 6), basePath: 'complaint.html', showFilters: false, pageSize: 6 })
})()
