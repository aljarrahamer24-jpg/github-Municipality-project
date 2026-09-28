/* لوحة الموظف — الأرقام محسوبة من بلاغات قسمه والبلاغات المسندة له فقط (RLS) */
App.page({ roles: ['employee'] }, async ({ profile }) => {
  const today = new Date().toLocaleDateString(LOCALE, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  const s = await load($('#stats'), () => API.stats())
  if (!s) return
  $('#today-desc').textContent = `${today} — ${s.new ? `لديك ${s.new} بلاغ جديد بانتظار المراجعة.` : 'لا توجد بلاغات جديدة بانتظار المراجعة.'}`
  $('#stats').innerHTML = [
    statCard({ label: 'إجمالي البلاغات', value: formatNumber(s.total), icon: 'clipboard-list', trend: trendOf(s.this_month, s.last_month, false), hint: s.last_month ? 'هذا الشهر مقارنة بالسابق' : '' }),
    statCard({ label: 'البلاغات الجديدة', value: s.new, icon: 'circle-dot', accent: 'info' }),
    statCard({ label: 'قيد المعالجة', value: s.in_progress, icon: 'loader', accent: 'warning' }),
    statCard({ label: 'البلاغات المتأخرة', value: s.overdue, icon: 'triangle-alert', accent: 'error', hint: 'تجاوزت المدة المحددة' }),
    statCard({ label: 'البلاغات المغلقة', value: s.done, icon: 'lock', accent: 'success', cls: 'span-2 md-span-1' }),
  ].join('')
  createComplaintsTable($('#table'), { basePath: 'complaint.html', pageSize: 8 })
})
