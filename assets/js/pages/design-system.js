/* صفحة نظام التصميم — أمثلة حية للمكونات */
;(() => {
  $('#status-badges').innerHTML = Object.keys(statusLabels).map(statusBadge).join('') + overdueBadge()
  $('#priority-badges').innerHTML = Object.keys(priorityLabels).map(priorityBadge).join('')
  $('#demo-stats').innerHTML =
    statCard({ label: 'إجمالي البلاغات', value: '1,349', icon: 'clipboard-list', trend: { value: '8%', up: true } }) +
    statCard({ label: 'المتأخرة', value: 12, icon: 'triangle-alert', accent: 'error' })
  $('#demo-alerts').innerHTML =
    alertBox('info', 'تنبيه معلوماتي', 'نص التنبيه يظهر هنا.') + alertBox('success', 'تمت العملية بنجاح') + alertBox('warning', 'تحذير') + alertBox('error', 'حدث خطأ')
  $('#demo-progress').innerHTML = progress(72) + '<div class="mt-3"></div>' + progress(45, 'warning')
  starInput($('#demo-stars'), (v) => toast(`التقييم: ${v} من 5`))
  $('#demo-timeline').innerHTML = timeline(complaints[0].timeline.slice(0, 3))
  $('#demo-stepper').innerHTML = stepper('in_progress')
  createComplaintsTable($('#demo-table'), { data: complaints.slice(0, 12), basePath: 'employee/complaint.html', pageSize: 5 })
})()
