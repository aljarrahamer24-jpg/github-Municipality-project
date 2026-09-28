/* جدول البلاغات الكامل (الموظف: قسمه والمسند له — المدير: الكل) + تصدير CSV */
App.page({ roles: ['employee', 'admin'] }, async () => {
  createComplaintsTable($('#table'), { basePath: 'complaint.html', pageSize: 12, initialSearch: getParam('q') || '' })

  $('#export-csv').addEventListener('click', async (e) => {
    try {
      await withBusy(e.currentTarget, async () => {
        // جلب على دفعات (Supabase يعيد 1000 صف كحد أقصى لكل طلب)
        const rows = []
        for (let page = 1; ; page++) {
          const res = await API.complaints({ page, pageSize: 1000 })
          rows.push(...res.rows)
          if (rows.length >= res.count || !res.rows.length) break
        }
        const header = ['رقم البلاغ', 'العنوان', 'النوع', 'القسم', 'المنطقة', 'الأولوية', 'الحالة', 'الموظف المسؤول', 'تاريخ البلاغ', 'متأخر']
        const lines = rows.map((c) => [
          c.complaint_number, c.title, c.category?.name, c.department?.name, c.area?.name,
          PRIORITY_LABELS[c.priority], STATUS_LABELS[c.status], c.assignee?.full_name || '', formatDateTime(c.created_at), isOverdue(c) ? 'نعم' : 'لا',
        ])
        // حماية من حقن الصيغ في Excel: الخلايا التي تبدأ بـ = + - @ تُسبق بعلامة '
        const cell = (v) => {
          let t = String(v ?? '')
          if (/^[=+\-@\t\r]/.test(t)) t = "'" + t
          return `"${t.replace(/"/g, '""')}"`
        }
        const csv = [header, ...lines].map((r) => r.map(cell).join(',')).join('\r\n')
        const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }) // BOM ليظهر العربي في Excel
        const a = document.createElement('a')
        a.href = URL.createObjectURL(blob)
        a.download = `complaints-${new Date().toISOString().slice(0, 10)}.csv`
        a.click()
        URL.revokeObjectURL(a.href)
      }, 'جارٍ التصدير...')
      toast('تم تصدير البلاغات')
    } catch (err) {
      toast(toAppError(err).message, 'error')
    }
  })
})
