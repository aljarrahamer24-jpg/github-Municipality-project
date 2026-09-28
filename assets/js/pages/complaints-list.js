/* جدول البلاغات الكامل (الموظف والمدير) */
;(() => {
  createComplaintsTable($('#table'), { data: complaints, basePath: 'complaint.html', pageSize: 12 })
})()
