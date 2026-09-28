/* التقارير الشهرية — الأرقام من دالة monthly_report (SQL) والملخص النصي بقوالب JavaScript (بدون ذكاء اصطناعي) */
App.page({ roles: ['admin'] }, async () => {
  const monthSel = $('#month')
  const now = new Date()
  const months = Array.from({ length: 12 }, (_, i) => new Date(now.getFullYear(), now.getMonth() - i, 1))
  const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
  fillSelect(monthSel, months.map((d) => [iso(d), formatMonth(d)]), { value: getParam('month') || iso(months[0]) })

  const settings = await API.settings().catch(() => ({}))
  if (settings.general?.municipality_name) $('#r-municipality').textContent = settings.general.municipality_name

  const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0)
  const setNeeds = (on) => $$('[data-needs-report]').forEach((b) => (b.disabled = !on))

  // الملخص النصي — قوالب ثابتة تُملأ بالأرقام
  function summaryText(r, label) {
    const k = r.kpis
    if (!k.total) return `لم يتم استقبال أي بلاغ خلال شهر ${label}.`
    const parts = [`خلال شهر ${label} تم استقبال ${formatNumber(k.total)} بلاغاً`]
    if (r.previous_total) {
      const diff = pct(Math.abs(k.total - r.previous_total), r.previous_total)
      parts[0] += k.total === r.previous_total ? '، بنفس مستوى الشهر السابق' : `، ${k.total > r.previous_total ? 'بزيادة' : 'بانخفاض'} ${diff}% عن الشهر السابق`
    }
    parts.push(`تم حل أو إغلاق ${formatNumber(k.closed)} منها بنسبة إغلاق ${k.closed_rate ?? 0}%، وما زال ${formatNumber(k.open)} بلاغاً قيد المتابعة${k.overdue ? ` منها ${k.overdue} بلاغاً متأخراً عن المدة المحددة` : ''}`)
    if (k.avg_days != null) parts.push(`بلغ متوسط زمن الحل ${k.avg_days} يوم`)
    const topCat = r.breakdown.by_category[0]
    const topArea = r.breakdown.by_area[0]
    if (topCat) parts.push(`وكانت "${topCat.name}" أكثر المشاكل تكراراً (${topCat.value} بلاغاً)`)
    if (topArea) parts.push(`و"${topArea.name}" أكثر المناطق تضرراً (${topArea.value} بلاغاً)`)
    const s = r.satisfaction
    if (s.count) parts.push(`وسجّل رضا المواطنين متوسط ${s.avg} من 5 بناءً على ${s.count} تقييماً، بنسبة رضا ${s.satisfied_pct ?? 0}%`)
    if (r.recurring.length) parts.push(`كما رصد النظام ${r.recurring.length} مشاكل متكررة تحتاج متابعة ميدانية`)
    return parts.join('، ') + '.'
  }

  async function generate() {
    const month = monthSel.value
    const label = formatMonth(month)
    setNeeds(false)
    $('#placeholder').hidden = true
    $('#report').hidden = false
    const body = $('#report .report-body')
    body.style.opacity = '0.4'
    try {
      const [r, trend] = await Promise.all([API.monthlyReport(month), API.trend(12)])
      const k = r.kpis
      $('#r-month').textContent = label
      $('#r-code').textContent = `RPT-${month.slice(0, 7)}`
      $('#r-summary').textContent = summaryText(r, label)
      $('#r-kpis').innerHTML = [
        ['file-chart-column', formatNumber(k.total), 'إجمالي البلاغات'],
        ['circle-check', formatNumber(k.closed), 'المغلقة / المحلولة'],
        ['clock', formatNumber(k.open), 'المفتوحة'],
        ['chart-column', `${k.closed_rate ?? 0}%`, 'نسبة الإغلاق'],
        ['timer', k.avg_days != null ? `${k.avg_days} يوم` : '—', 'متوسط زمن الحل'],
        ['triangle-alert', formatNumber(k.overdue), 'المتأخرة'],
        ['circle-x', formatNumber(k.rejected), 'المرفوضة'],
        ['face-slightly-smiling', r.satisfaction.avg != null ? `${r.satisfaction.avg} من 5` : '—', 'رضا المواطنين'],
      ].map(([ic, v, l]) => `<div class="report-kpi">${icon(ic)}<b>${v}</b><small>${l}</small></div>`).join('')

      // آخر 6 أشهر حتى الشهر المختار
      const upto = trend.filter((t) => t.month <= month).slice(-6)
      const reset = (id) => {
        $('#' + id).innerHTML = '<div></div>'
        return $('#' + id).firstElementChild
      }
      Charts.columns(reset('chart-months'), upto.map((t) => ({ month: monthName(t.month), received: t.received })), { key: 'received', name: 'المستلمة', unit: 'بلاغ', height: 220 })
      Charts.hbar(reset('chart-problems'), r.breakdown.by_category.slice(0, 5))
      Charts.hbar(reset('chart-areas'), r.breakdown.by_area.slice(0, 5))

      const depts = r.breakdown.by_department
      $('#depts').innerHTML = depts.length
        ? depts
            .map((d) => {
              const tone = d.close_rate >= 85 ? 'success' : d.close_rate >= 70 ? 'warning' : 'error'
              return `<tr><td class="strong">${esc(d.name)}</td><td class="num">${d.value}</td>
              <td><div class="flex items-center gap-2"><div style="width:80px">${progress(d.close_rate || 0, tone)}</div><span class="num">${d.close_rate ?? 0}%</span></div></td>
              <td class="num">${d.avg_days != null ? d.avg_days + ' يوم' : '—'}</td><td>${d.avg_rating != null ? `<span class="flex items-center gap-1">${stars(d.avg_rating, 'sm')} ${d.avg_rating}</span>` : '—'}</td></tr>`
            })
            .join('')
        : `<tr><td colspan="5" class="text-center c-3">لا توجد بلاغات في هذا الشهر</td></tr>`

      const s = r.satisfaction
      const reasons = (s.keywords || []).filter((x) => x.sentiment === 'negative' && x.hits).slice(0, 2)
      $('#r-satisfaction').innerHTML = `
        <div><p class="text-2xl fw-700">${s.avg ?? '—'}</p>${stars(s.avg || 0, 'sm')}<p class="text-xs c-3 mt-1">من ${s.count} تقييماً</p></div>
        <div><p class="text-2xl fw-700 c-success">${s.satisfied_pct ?? 0}%</p><p class="text-xs c-3">نسبة الرضا (4 نجوم فأكثر)</p></div>
        <div><p class="text-sm fw-600">أبرز أسباب عدم الرضا</p><p class="text-sm c-2 mt-1">${reasons.length ? reasons.map((x) => `«${esc(x.keyword)}» (${x.hits})`).join(' · ') : 'لا توجد'}</p></div>`

      $('#r-recurring').innerHTML = r.recurring.length
        ? `<div class="table-wrap"><table class="table"><thead><tr><th>المشكلة</th><th>المنطقة</th><th>عدد البلاغات</th><th>التوصية</th></tr></thead><tbody>${r.recurring
            .map((x) => `<tr><td class="strong">${esc(x.category)}</td><td>${esc(x.area || '—')}</td><td class="num">${x.count}</td><td>${esc(x.recommendation)}</td></tr>`)
            .join('')}</tbody></table></div>`
        : '<p class="text-sm c-3">لا توجد مشاكل متكررة حالياً.</p>'

      $('#r-generated').textContent = `تم إنشاء التقرير آلياً من البيانات الفعلية — ${formatDateTime(new Date().toISOString())}`
      setNeeds(true)
    } catch (err) {
      showError(body, err, () => location.reload())
    } finally {
      body.style.opacity = ''
    }
  }

  $('#generate').addEventListener('click', (e) => withBusy(e.currentTarget, generate, 'جارٍ الإنشاء...'))
  monthSel.addEventListener('change', () => {
    $('#report').hidden = true
    $('#placeholder').hidden = false
    setNeeds(false)
  })
  // "تصدير PDF" يفتح نافذة الطباعة — اختر "حفظ كـ PDF"
  $('#export').addEventListener('click', () => {
    toast('اختر "حفظ كـ PDF" من نافذة الطباعة', 'info')
    setTimeout(() => window.print(), 400)
  })
  generate()
})
