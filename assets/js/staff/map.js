/* خريطة البلاغات + المناطق الساخنة — الفلترة من قاعدة البيانات، والحساب SQL (بدون ذكاء اصطناعي) */
App.page({ roles: ['employee', 'admin'] }, async () => {
  const f = { cat: '', dist: '', status: '', period: $('#f-period').value, mode: 'both' }
  const [categories, areas] = await Promise.all([API.categories({ activeOnly: false }), API.areas()])
  fillSelect($('#f-cat'), categories.map((c) => [c.id, c.name]), { placeholder: 'الكل' })
  fillSelect($('#f-dist'), areas.map((a) => [a.id, a.name]), { placeholder: 'كل المناطق' })
  fillSelect($('#f-status'), Object.entries(STATUS_LABELS), { placeholder: 'كل الحالات' })
  $('#legend').innerHTML = Object.keys(STATUS_COLOR).map((s) => `<span><i style="background:${STATUS_COLOR[s]}"></i>${STATUS_LABELS[s]}</span>`).join('')

  const card = $('#selected')
  const m = Maps.complaints($('#map'), (c) => {
    card.hidden = false
    $('#sel-body').innerHTML = `<p class="text-xs c-3 num">${esc(c.complaint_number)}</p><p class="fw-600 mt-1">${esc(c.title)}</p>
      <p class="text-xs c-2 mt-1">${esc(c.category?.name || '')} · ${esc(c.area?.name || '—')} · ${formatDate(c.created_at)}</p>
      <div class="flex items-center justify-between mt-3">${statusBadge(c.status)}<a class="btn btn-primary btn-sm" href="complaint.html?id=${c.id}">التفاصيل</a></div>`
  })
  $('#sel-close').addEventListener('click', () => (card.hidden = true))

  let last = []
  async function update() {
    const from = f.period ? new Date(Date.now() - Number(f.period) * 86400000).toISOString() : null
    $('#count').textContent = '…'
    try {
      // جلب نقاط البلاغات (حتى 2000 بلاغ حسب الفلاتر)
      const rows = []
      for (let page = 1; page <= 2; page++) {
        const res = await API.complaints({ categoryId: f.cat, areaId: f.dist, status: f.status, from, page, pageSize: 1000, fields: 'id, complaint_number, title, status, created_at, latitude, longitude, category:problem_categories(name), area:areas(name)' })
        rows.push(...res.rows)
        if (rows.length >= res.count) break
      }
      last = rows
      m.draw(rows, f.mode)
      $('#count').textContent = formatNumber(rows.length)
    } catch (err) {
      $('#count').textContent = '—'
      toast(toAppError(err).message, 'error')
    }

    // المناطق الساخنة (دالة SQL: hotspot_areas)
    load($('#hot'), async () => {
      const hot = (await API.hotspots({ days: f.period ? Number(f.period) : null, categoryId: f.cat || null, status: f.status || null })).slice(0, 6)
      if (!hot.length) return ($('#hot').innerHTML = empty('flame', 'لا توجد بلاغات ضمن الفلاتر المحددة'))
      const max = Math.max(...hot.map((h) => h.total))
      $('#hot').innerHTML = hot
        .map(
          (h, i) => `<div class="hot-item">
          <div class="flex items-center justify-between gap-2 text-sm">
            <span class="flex items-center gap-2 fw-600"><span class="rank ${i === 0 ? 'r1' : i < 3 ? 'r2' : ''}">${i + 1}</span>${esc(h.name)}</span>
            <span class="fw-600 num">${h.total} بلاغ</span>
          </div>
          ${progress((h.total / max) * 100, i < 2 ? 'error' : 'warning')}
          <p class="text-xs c-3">آخر 30 يوم: <b class="c-2">${h.last_30}</b> · 3 أشهر: <b class="c-2">${h.last_90}</b> · 6 أشهر: <b class="c-2">${h.last_180}</b> · مفتوحة: <b class="c-2">${h.open_count}</b></p>
          <p class="text-xs c-3">الأكثر: ${esc(h.top_category || '—')}</p></div>`,
        )
        .join('')
    })
  }

  $('#filters').addEventListener('change', (e) => {
    if (e.target.dataset.f) f[e.target.dataset.f] = e.target.value
    update()
  })
  $('#modes').addEventListener('click', (e) => {
    const b = e.target.closest('[data-mode]')
    if (!b) return
    f.mode = b.dataset.mode
    $$('#modes button').forEach((x) => x.classList.toggle('active', x === b))
    m.draw(last, f.mode)
  })
  update()
})
