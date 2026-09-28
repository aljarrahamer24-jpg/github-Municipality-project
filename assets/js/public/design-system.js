/* صفحة نظام التصميم — أمثلة ثابتة لعرض المكونات (دليل أسلوب، لا تعتمد على قاعدة البيانات) */
App.page({}, async () => {
  $('#status-badges').innerHTML = Object.keys(STATUS_LABELS).map(statusBadge).join('') + overdueBadge()
  $('#priority-badges').innerHTML = Object.keys(PRIORITY_LABELS).map(priorityBadge).join('')
  $('#demo-stats').innerHTML =
    statCard({ label: 'إجمالي البلاغات', value: '1,349', icon: 'clipboard-list', trend: { value: '8%', up: true } }) +
    statCard({ label: 'المتأخرة', value: 12, icon: 'triangle-alert', accent: 'error' })
  $('#demo-alerts').innerHTML =
    alertBox('info', 'تنبيه معلوماتي', 'نص التنبيه يظهر هنا.') + alertBox('success', 'تمت العملية بنجاح') + alertBox('warning', 'تحذير') + alertBox('error', 'حدث خطأ')
  $('#demo-progress').innerHTML = progress(72) + '<div class="mt-3"></div>' + progress(45, 'warning')
  starInput($('#demo-stars'), (v) => toast(`التقييم: ${v} من 5`))
  const t0 = Date.now()
  $('#demo-timeline').innerHTML = timeline([
    { new_status: 'new', created_at: new Date(t0 - 3 * 864e5).toISOString(), changed_by_name: 'النظام', note: 'تم استلام البلاغ.' },
    { new_status: 'assigned', created_at: new Date(t0 - 2 * 864e5).toISOString(), changed_by_name: 'مشرف القسم' },
    { new_status: 'in_progress', created_at: new Date(t0 - 864e5).toISOString(), changed_by_name: 'الموظف المختص', note: 'توجه الفريق الميداني للموقع.' },
  ])
  $('#demo-stepper').innerHTML = stepper('in_progress')
  // عرض شكل الجدول فقط (بدون اتصال بقاعدة البيانات)
  $('#demo-table').outerHTML = `<div class="card">${empty('clipboard-list', 'جدول البلاغات', 'يظهر في صفحات البلاغات: بحث + تبويبات الحالة + فلاتر + ترتيب + ترقيم، وكل الفلترة تتم في قاعدة البيانات.')}</div>`
})
