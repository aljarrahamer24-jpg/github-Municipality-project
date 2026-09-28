/* لوحة المدير — كل الأرقام والرسوم من دوال SQL في Supabase (بدون ذكاء اصطناعي) */
App.page({ roles: ['admin'] }, async () => {
  // المؤشرات الرئيسية
  load($('#kpis'), async () => {
    const s = await API.stats()
    $('#kpis').innerHTML = [
      statCard({ label: 'إجمالي البلاغات', value: formatNumber(s.total), icon: 'clipboard-list', trend: trendOf(s.this_month, s.last_month, false), hint: 'هذا الشهر مقارنة بالسابق' }),
      statCard({ label: 'البلاغات الجديدة', value: formatNumber(s.new), icon: 'circle-dot', accent: 'info' }),
      statCard({ label: 'قيد المعالجة', value: formatNumber(s.in_progress), icon: 'loader', accent: 'warning' }),
      statCard({ label: 'المغلقة', value: formatNumber(s.done), icon: 'circle-check', accent: 'success', hint: s.closed_rate != null ? `${s.closed_rate}% نسبة الإغلاق` : '' }),
      statCard({ label: 'البلاغات المتأخرة', value: formatNumber(s.overdue), icon: 'triangle-alert', accent: 'error', hint: 'تجاوزت المدة المحددة' }),
      statCard({ label: 'متوسط زمن الحل', value: s.avg_days != null ? `${s.avg_days} يوم` : '—', icon: 'timer', accent: 'neutral' }),
      statCard({ label: 'متوسط رضا المواطنين', value: s.avg_rating != null ? `${s.avg_rating} من 5` : '—', icon: 'face-slightly-smiling', accent: 'gold' }),
      statCard({ label: 'المرفوضة', value: formatNumber(s.rejected), icon: 'circle-x', accent: 'neutral' }),
    ].join('')
  })

  // تنبيه الطقس: أقرب حالة جوية قادمة أو جارية
  API.list('weather_events', { order: 'starts_at', asc: true })
    .then(async (events) => {
      const ev = events.find((e) => new Date(e.ends_at) >= new Date())
      if (!ev) return
      const risky = (await API.weatherAreas(ev.id)).filter((a) => a.is_affected || a.flood_risk === 'high').length
      const b = $('#weather-banner')
      $('[data-t]', b).textContent = `${ev.title}: ${formatDate(ev.starts_at)} — ${formatDate(ev.ends_at)}`
      $('[data-s]', b).textContent = `${risky} مناطق حساسة تحتاج استعداداً مسبقاً`
      b.hidden = false
    })
    .catch(() => {})

  // تنبيه المشاكل المتكررة
  API.recurring()
    .then((list) => {
      if (!list.length) return
      const b = $('#recurring-banner')
      $('[data-t]', b).textContent = `${list.length} مشاكل متكررة مكتشفة`
      $('[data-s]', b).textContent = `${list.filter((r) => r.severity !== 'medium').length} منها تحتاج صيانة جذرية أو فحصاً شاملاً`
      b.hidden = false
    })
    .catch(() => {})

  async function drawCharts() {
    const v = $('#period').value
    const now = new Date()
    const from = v === 'year' ? new Date(now.getFullYear(), 0, 1).toISOString() : v ? new Date(now - Number(v) * 86400000).toISOString() : null
    const months = v === 'year' ? now.getMonth() + 1 : v === '30' ? 3 : v ? 6 : 12
    $('#trend-sub').textContent = `المستلمة مقارنة بالمغلقة — آخر ${months} ${months > 2 && months < 11 ? 'أشهر' : 'شهراً'}`

    await Promise.all([
      load($('#chart-month'), async () => {
        const trend = await API.trend(months)
        Charts.area(Charts.host('chart-month'), trend.map((t) => ({ month: monthName(t.month), received: t.received, closed: t.closed })), [
          { key: 'received', name: 'المستلمة', color: Charts.SERIES[0] },
          { key: 'closed', name: 'المغلقة', color: Charts.SERIES[2] },
        ])
      }),
      load($('#chart-category'), async () => {
        const b = await API.breakdown(from, null)
        Charts.hbar(Charts.host('chart-category'), b.by_category.slice(0, 8))
        Charts.hbar(Charts.host('chart-department'), b.by_department.map((d) => ({ name: d.name.replace(/^قسم /, ''), value: d.value })))
        Charts.hbar(Charts.host('chart-district'), b.by_area.slice(0, 8))
      }),
    ])
  }
  $('#period').addEventListener('change', drawCharts)
  drawCharts()

  createComplaintsTable($('#latest'), { basePath: 'complaint.html', showFilters: false, pageSize: 6 })
})
