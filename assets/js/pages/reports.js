/* التقارير الشهرية: اختيار الشهر → إنشاء → معاينة → طباعة / PDF */
;(() => {
  const btn = $('#generate')
  const report = $('#report')

  function draw() {
    $('#r-month').textContent = $('#month').value
    $('#depts').innerHTML = byDepartment
      .map((d) => {
        const tone = d.closeRate >= 85 ? 'success' : d.closeRate >= 75 ? 'warning' : 'error'
        return `<tr><td class="strong">${esc(d.name)}</td><td class="num">${d.value}</td>
          <td><div class="flex items-center gap-2"><div style="width:80px">${progress(d.closeRate, tone)}</div><span class="num">${d.closeRate}%</span></div></td>
          <td class="num">${d.avgDays} يوم</td><td><span class="flex items-center gap-1">${stars(d.satisfaction, 'sm')} ${d.satisfaction}</span></td></tr>`
      })
      .join('')
  }

  Charts.columns($('#chart-months'), monthlyTrend, { key: 'received', name: 'المستلمة', unit: 'بلاغ', height: 220 })
  Charts.hbar($('#chart-problems'), byCategory.slice(0, 5))
  Charts.hbar($('#chart-areas'), byDistrict.slice(0, 5))
  draw()

  $('#month').addEventListener('change', () => {
    report.hidden = true
    $('#placeholder').hidden = false
    $('#placeholder-month').textContent = $('#month').value
    $$('[data-needs-report]').forEach((b) => (b.disabled = true))
  })

  btn.addEventListener('click', () => {
    btn.disabled = true
    btn.innerHTML = '<span class="spinner"></span>جارٍ الإنشاء...'
    setTimeout(() => {
      draw()
      report.hidden = false
      $('#placeholder').hidden = true
      $$('[data-needs-report]').forEach((b) => (b.disabled = false))
      btn.disabled = false
      btn.innerHTML = `${icon('refresh-cw')}إنشاء التقرير`
      toast('تم إنشاء التقرير')
    }, 600)
  })
  // "تصدير PDF" يفتح نافذة الطباعة — اختر "حفظ كـ PDF"
  $('#export').addEventListener('click', () => {
    toast('اختر "حفظ كـ PDF" من نافذة الطباعة')
    setTimeout(() => window.print(), 300)
  })
})()
